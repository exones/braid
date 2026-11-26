// The board's wake (0071/A, docs/board.md "Wakes"): at each refresh of a running board, every open request whose "done when"
// holds (`pr:`, `braid:`, `time:`, checked by `conditionEnding` in src/braids/requests.ts, as `braid requests` checks them)
// is closed on `braid-requests`, and its asking thread gets one `t3 thread send`. A request whose asking braid is held or
// paused is left open until it resumes.
//
// Exactly once, with no state of its own: the wake is sent first and the ending recorded after it, so the `met` event is the
// memory of a delivered wake. A failed send records nothing and is tried again at the next refresh; a refused or failed push
// keeps the commit on the local branch, which the record is read from, so it is never sent again; a record write that throws
// after a delivered send is retried at the next refresh without sending again (the codes sent are kept for the board's life).
// The one gap left is a board that dies between the send and the local commit: that wake may come twice.
//
// An answer recorded outside the asking thread (0072/D: the PM's own answer, `braid answer --from pm`; the user's answer the
// PM records on a request that went through it) wakes the asking thread the same way, once: the send first, then a `reminded`
// event by `board` (`ANSWER_WOKEN`) as the memory, a kind older braid versions read. Answers before `ANSWER_WAKES_FROM` or
// older than a day are never woken, so a first run doesn't flood threads with old answers.
import { braidAt, braidAtAsync } from "../braids/branches.js";
import { gitAsync } from "../braids/gitio.js";
import { loadLifecycle, loadLifecycleAsync, withStatuses } from "../braids/lifecycle.js";
import type { PullRequest } from "./github.js";
import { answerWoken, askerOf, closing, conditionEnding, endRequestAsync, handleOf, loadRecordAsync, markAnswerWokenAsync, programmeOf, type Ending, type Request, type RequestEvent } from "../braids/requests.js";
import type { PlanRead } from "./plans.js";
import type { Good } from "./feed.js";
import { prOf } from "./signals.js";
import type { T3Runner } from "./t3.js";

/**
 * Whether braid `number`, as `origin/<main>` has it, is Done: its PR merged after its strands, or an older stored Done
 * (`withStatuses`); `prs` gives the PRs when GitHub can be read, else null. Each braid read once per call of this. Null: not there.
 */
export function braidDoneOn(root: string, main: string, prs: () => ReadonlyMap<string, PullRequest> | null): (number: string) => boolean | null {
  const memo = new Map<string, boolean | null>();
  return (number) => {
    if (!memo.has(number)) {
      const b = braidAt(root, `origin/${main}`, number);
      memo.set(number, b === null ? null : withStatuses(b, loadLifecycle(root), prs() ?? new Map()).brief.status === "Done");
    }
    return memo.get(number) ?? null;
  };
}

/** `braidDoneOn` for the board: the braids are read first, without blocking, and the answer is then a plain lookup. */
export async function braidsDoneOn(root: string, main: string, numbers: readonly string[], prs: () => ReadonlyMap<string, PullRequest> | null): Promise<(number: string) => boolean | null> {
  const done = new Map<string, boolean | null>();
  const lifecycle = numbers.length === 0 ? new Map() : await loadLifecycleAsync(root);
  for (const number of new Set(numbers)) {
    const b = await braidAtAsync(root, `origin/${main}`, number);
    done.set(number, b === null ? null : withStatuses(b, lifecycle, prs() ?? new Map()).brief.status === "Done");
  }
  return (number) => done.get(number) ?? null;
}

/** The braid a request's asker works on (`0042` of `0042/B`); null for a programme's request. */
const askingBraid = (r: Pick<Request, "id">): string | null => /^(\d{4})(?:\/|$)/.exec(r.id)?.[1] ?? null;

/** A request's text for a T3 send: it goes through cmd.exe on Windows, so no quote or shell character may reach it; one line, no closing full stop. */
export const safeText = (text: string): string => text.replace(/["%^&|<>!\r\n]+/g, " ").replace(/\s+/g, " ").trim().replace(/[.\s]+$/, "");

/** What the asking thread is sent. */
export function wakeMessage(r: Pick<Request, "code" | "words" | "text">, e: Ending): string {
  const text = safeText(r.text);
  return `Wake: ${handleOf(r)} is met (${e.text ?? "its condition holds"}): ${text}. Go on where you left off.`;
}

/** Answers recorded before this are never woken: they are older than the answer wake (0072/D). */
export const ANSWER_WAKES_FROM = "2026-11-25T23:00:00.000Z";

/** An answer older than this when the board first sees it is not woken: the asking thread has moved on. */
export const ANSWER_WAKE_MS = 24 * 60 * 60_000;

const ANSWERER: Readonly<Record<RequestEvent["by"], string>> = { user: "the user", pm: "the PM", coordinator: "the coordinator", board: "the board" };

/**
 * The answer that closed `r`, when it was recorded outside the asking thread, so the asker may not know it: the asker's own
 * role never wakes itself; the user's answer wakes a coordinator only on a request that went through the PM (`to: pm` or
 * forwarded), where the PM records it; a request straight to the user is answered in the asker's thread. Null otherwise.
 */
export function answerFromElsewhere(r: Pick<Request, "state" | "events" | "by" | "to" | "forwarded">): RequestEvent | null {
  const e = r.state === "answered" ? closing(r) : null;
  if (e === null || e.event !== "answered" || e.by === askerOf(r)) {
    return null;
  }
  if (e.by === "user" && !(askerOf(r) === "coordinator" && (r.to === "pm" || r.forwarded !== undefined))) {
    return null;
  }
  return e;
}

/** What the asking thread is sent when its request was answered elsewhere. */
export function answerWakeMessage(r: Pick<Request, "code" | "words">, e: Pick<RequestEvent, "by" | "text" | "reason">): string {
  const said = e.text === undefined ? "" : safeText(e.text);
  const reason = e.reason === undefined ? "" : safeText(e.reason);
  return `Wake: ${handleOf(r)} answered by ${ANSWERER[e.by]}${said === "" ? "" : `: ${said}`}${reason === "" ? "" : ` (reason: ${reason})`}. Recap it in one line, then act.`;
}

/** Whether a request on a programme item (`pm/<slug>`) belongs to a held or paused programme: the plan is held, or every braid of it still open is held or paused. */
export function programmeHeld(r: Pick<Request, "id">, plans: readonly PlanRead[] | undefined, held: ReadonlyMap<string, unknown>): boolean {
  const slug = programmeOf(r.id);
  const plan = slug === null ? undefined : plans?.find((p) => p.slug === slug)?.plan;
  if (plan === undefined || plan === null) {
    return false;
  }
  const open = plan.rows.filter((row) => row.braid !== null && row.state !== "done" && row.state !== "dropped");
  return plan.state === "held" || plan.hold !== null || (open.length > 0 && open.every((row) => held.has(row.braid ?? "")));
}

export interface WakeProject {
  readonly root: string;
  readonly good: Good;
}

/** One project's wake step, run after a good read; `warn` reports what it couldn't do. */
export type Waker = (project: WakeProject, at: Date, warn: (line: string, once?: string) => void) => Promise<void>;

/** Several steps as one, in order; one that throws is reported and doesn't stop the next. */
export function steps(...all: readonly Waker[]): Waker {
  return async (project, at, warn) => {
    for (const step of all) {
      try {
        await step(project, at, warn);
      } catch (error) {
        warn(`a board step failed this refresh (${error instanceof Error ? error.message : String(error)})`, `step ${project.root}`);
      }
    }
  };
}

export function waker(t3: T3Runner): Waker {
  /** Codes whose wake was delivered but whose ending (or answer mark) isn't recorded yet. */
  const sent = new Set<string>();
  /** Sends one wake; false (and a warning) when it failed. */
  const send = async (root: string, r: Request, message: string, warn: (line: string, once?: string) => void): Promise<boolean> => {
    const out = await t3(root, ["thread", "send", r.thread ?? "", message]);
    if (out.error !== undefined || out.status !== 0) {
      const why = (out.stderr.trim().split("\n")[0] ?? "") || out.error?.message || "t3 failed";
      warn(`the wake of ${r.code} (${r.id}) failed (${why}); retrying at each refresh`, `wake ${r.code}`);
      return false;
    }
    sent.add(r.code);
    return true;
  };
  return async ({ root, good }, at, warn) => {
    const held = good.sig.pauses ?? new Map();
    const live = (r: Request): boolean => !held.has(askingBraid(r) ?? "") && !programmeHeld(r, good.sig.plans, held);
    const archived = (r: Request): boolean => r.thread !== null && good.t3.states?.get(r.thread) === "archived";
    const record = (await loadRecordAsync(root)).requests;
    const open = record.filter((r) => r.state === "open" && live(r));
    if (open.length > 0) {
      const main = good.start.main;
      // A `braid:` condition reads main as origin has it now; a failed fetch leaves the last one.
      if (open.some((r) => r.doneWhen.startsWith("braid:"))) {
        await gitAsync(root, ["fetch", "-q", "origin", main]).catch(() => undefined);
      }
      const waiting = open.flatMap((r) => (r.doneWhen.startsWith("braid:") ? [r.doneWhen.slice("braid:".length).trim()] : []));
      const braidDone = await braidsDoneOn(root, main, waiting, () => (good.github.status.state === "ok" ? good.github.prs : null));
      const check = { pr: (n: number) => prOf(good.github, n), braidDone, now: at };
      for (const r of open) {
        const e = conditionEnding(r, check);
        if (e === null) {
          continue;
        }
        if (e.state === "met" && r.thread !== null && !archived(r) && !sent.has(r.code)) {
          // Right before the send, the record is read again: a second board of the project may have woken it a moment ago.
          if ((await loadRecordAsync(root)).requests.find((x) => x.code === r.code)?.state !== "open") {
            continue;
          }
          if (!(await send(root, r, wakeMessage(r, e), warn))) {
            continue;
          }
        }
        try {
          await endRequestAsync(root, r.code, { ...e, at: at.toISOString() });
          sent.delete(r.code);
        } catch (error) {
          warn(`${r.code} (${r.id}) couldn't be recorded as ${e.state} (${error instanceof Error ? error.message : String(error)}); retrying at each refresh`, `record ${r.code}`);
        }
      }
    }
    // Answers recorded outside the asking thread (0072/D): one wake each, the mark after it.
    const since = Math.max(Date.parse(ANSWER_WAKES_FROM), at.getTime() - ANSWER_WAKE_MS);
    for (const r of record) {
      const e = answerFromElsewhere(r);
      if (e === null || r.thread === null || archived(r) || answerWoken(r) || !live(r) || !(Date.parse(e.at) >= since)) {
        continue;
      }
      if (!sent.has(r.code)) {
        // Right before the send, the record is read again: a second board of the project may have woken it a moment ago.
        const now = (await loadRecordAsync(root)).requests.find((x) => x.code === r.code);
        if (now === undefined || answerWoken(now)) {
          continue;
        }
        if (!(await send(root, r, answerWakeMessage(r, e), warn))) {
          continue;
        }
      }
      try {
        await markAnswerWokenAsync(root, r.code, at.toISOString());
        sent.delete(r.code);
      } catch (error) {
        warn(`${r.code} (${r.id}) couldn't be recorded as woken (${error instanceof Error ? error.message : String(error)}); retrying at each refresh`, `record ${r.code}`);
      }
    }
  };
}
