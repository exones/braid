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
//
// An answer given by `braid answer` or the board's page records, in the same write, which threads are still to hear it
// (`owed` in src/braids/requests.ts): the asking thread, and the follower (the PM that forwarded the request). A board
// sends each such wake once, however long after the answer it first runs. One that can't go is recorded with its reason
// ("answer not delivered"): a failed send is tried again for a day, a held or paused braid's once it resumes, and a
// request with no thread or an archived one only by the page's Retry. The rule above for answers recorded elsewhere
// stays for those an older braid recorded without that mark.
import { braidAt, braidAtAsync } from "../braids/branches.js";
import { gitAsync } from "../braids/gitio.js";
import { loadLifecycle, loadLifecycleAsync, withStatuses, type Lifecycle } from "../braids/lifecycle.js";
import { loadPauses } from "../braids/pauses.js";
import type { PullRequest } from "./github.js";
import { answerWoken, askerOf, closing, conditionEnding, DISMISSED, endRequestAsync, handleOf, loadRecordAsync, markAnswerFailedAsync, markAnswerWokenAsync, outcomeOf, owed, programmeOf, READERS, type Ending, type Reader, type Request, type RequestEvent } from "../braids/requests.js";
import type { PlanRead } from "./plans.js";
import type { Good } from "./feed.js";
import { prOf } from "./signals.js";
import type { T3Result, T3Runner } from "./t3.js";

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
export function answerFromElsewhere(r: Pick<Request, "state" | "kind" | "events" | "by" | "to" | "forwarded">): RequestEvent | null {
  // A dismissal is the user's, outside the asking thread, whoever the request was for.
  if (outcomeOf(r) === "dismissed") {
    return closing(r);
  }
  const e = r.state === "answered" ? closing(r) : null;
  if (e === null || e.event !== "answered" || e.by === askerOf(r)) {
    return null;
  }
  if (e.by === "user" && !(askerOf(r) === "coordinator" && (r.to === "pm" || r.forwarded !== undefined))) {
    return null;
  }
  return e;
}

/** What the asking thread is sent when its request was answered elsewhere, or dismissed. */
export function answerWakeMessage(r: Pick<Request, "code" | "words">, e: Pick<RequestEvent, "event" | "by" | "text" | "reason">): string {
  if (e.event === "withdrawn" && e.by === "user" && e.text === DISMISSED) {
    return `Wake: ${handleOf(r)} ${DISMISSED}; if you still need it, ask again with what changed.`;
  }
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

/**
 * The thread besides the asker's that follows `r`: the PM's for a request it forwarded; for the PM's own request about an
 * item, the coordinator thread that started the item (or its braid), when the lifecycle names one. Null otherwise.
 */
export function followerOf(r: Pick<Request, "id" | "by" | "pm" | "forwarded">, lifecycle: ReadonlyMap<string, Lifecycle>): string | null {
  if (r.forwarded !== undefined) {
    return r.pm ?? null;
  }
  if (askerOf(r) !== "pm" || programmeOf(r.id) !== null) {
    return null;
  }
  const startedBy = (id: string): string | null => lifecycle.get(id)?.events.findLast((e) => e.kind === "started")?.thread ?? null;
  return startedBy(r.id) ?? startedBy(r.id.slice(0, 4));
}

/** What the follower of a request is told, one line. */
export function followerMessage(r: Pick<Request, "code" | "words" | "kind" | "events" | "state" | "thread">): string {
  const e = closing(r);
  const outcome = outcomeOf(r);
  const who = ANSWERER[e?.by ?? "user"];
  const said = outcome === "dismissed" ? `dismissed by ${who} without an answer` : outcome === "acknowledged" ? `acknowledged by ${who}` : `answered by ${who}${e?.text === undefined ? "" : `: ${safeText(e.text)}`}`;
  const asker = r.thread === null ? "the request names no asking thread" : outcome === "acknowledged" ? `the asker ${r.thread} is not woken` : `the asker ${r.thread} has it too`;
  return `${handleOf(r)} ${said} (${asker})`;
}

const NO_THREAD = "the request names no thread";
const ARCHIVED = "the thread is archived";
const FAILED = "the wake failed";
const pausedWhy = (r: Pick<Request, "id">): string => `braid ${askingBraid(r) ?? ""} is paused or held; the board wakes the thread when it resumes`;

/** Whether the board tries an owed wake again by itself: not yet tried, held back by a pause, or a send that failed within the last day. */
const retries = (failed: { readonly at: string; readonly reason: string } | null, at: Date): boolean =>
  failed === null || failed.reason.startsWith("braid ") || (failed.reason.startsWith(FAILED) && at.getTime() - Date.parse(failed.at) < ANSWER_WAKE_MS);

/** Wakes being sent now, and ones delivered whose mark isn't written yet, by project root, code and reader. */
const sending = new Set<string>();
const delivered = new Set<string>();
const keyOf = (root: string, code: string, reader: Reader): string => `${root}\n${code}\n${reader}`;

/** Whether the asking braid of `r` is held or paused now (`.braid/pauses.json`). */
const pausedNow = (root: string, r: Pick<Request, "id">): boolean => loadPauses(root).pauses.some((p) => p.braid === askingBraid(r));

export interface Told {
  readonly woken: boolean;
  /** Why not, when not woken. */
  readonly why: string | null;
}

/**
 * Sends one reader the wake of an answered or dismissed request and records how it went: the "sent" mark after a delivered
 * send, else the reason ("answer not delivered"). `blocked`: why it isn't to be sent now (archived, paused).
 */
async function tell(t3: T3Runner, root: string, r: Request, reader: Reader, at: Date, blocked: string | null, warn: (line: string, once?: string) => void = () => {}): Promise<Told> {
  const key = keyOf(root, r.code, reader);
  if (sending.has(key)) {
    return { woken: false, why: "the wake is being sent" };
  }
  sending.add(key);
  try {
    const mark = async (): Promise<void> => {
      try {
        await markAnswerWokenAsync(root, r.code, at.toISOString(), reader);
        delivered.delete(key);
      } catch (error) {
        warn(`${r.code} (${r.id}) couldn't be recorded as woken (${error instanceof Error ? error.message : String(error)}); retrying at each refresh`, `record ${r.code}`);
      }
    };
    // Right before the send, the record is read again: a second board of the project may have woken it a moment ago.
    const now = (await loadRecordAsync(root)).requests.find((x) => x.code === r.code);
    if (now === undefined || answerWoken(now, reader)) {
      return { woken: true, why: null };
    }
    if (delivered.has(key)) {
      await mark();
      return { woken: true, why: null };
    }
    const thread = reader === "asker" ? now.thread : followerOf(now, await loadLifecycleAsync(root));
    let why = thread === null ? NO_THREAD : blocked;
    if (why === null && thread !== null) {
      const e = closing(now);
      const message = reader === "follower" ? followerMessage(now) : answerWakeMessage(now, e ?? { event: "answered", by: "user" });
      const out: T3Result = await t3(root, ["thread", "send", thread, message]).catch((error: unknown) => ({ status: 1, stdout: "", stderr: error instanceof Error ? error.message : String(error) }));
      if (out.error === undefined && out.status === 0) {
        delivered.add(key);
        await mark();
        return { woken: true, why: null };
      }
      why = `${FAILED} (${(out.stderr.trim().split("\n")[0] ?? "") || out.error?.message || "t3 failed"})`;
      warn(`the wake of ${r.code} (${r.id}) failed (${why.slice(FAILED.length + 2, -1)}); retrying at each refresh`, `wake ${r.code}`);
    }
    try {
      await markAnswerFailedAsync(root, r.code, at.toISOString(), reader, why ?? NO_THREAD);
    } catch (error) {
      warn(`${r.code} (${r.id}) couldn't be recorded as not delivered (${error instanceof Error ? error.message : String(error)})`, `record ${r.code}`);
    }
    return { woken: false, why };
  } finally {
    sending.delete(key);
  }
}

/**
 * Wakes the threads a request answered on the board's page is owed to, at once: the answer action, and Retry, which sends
 * whatever was recorded as not delivered. What it returns is the asker's, else the follower's; nothing owed: woken false, no why.
 */
export async function wakePageAnswer(t3: T3Runner, root: string, r: Request, at: Date, archived: (thread: string) => Promise<boolean> | boolean = () => false): Promise<Told> {
  let out: Told | null = null;
  for (const reader of READERS) {
    if (owed(r, reader) === null) {
      continue;
    }
    const thread = reader === "asker" ? r.thread : followerOf(r, await loadLifecycleAsync(root));
    const blocked = pausedNow(root, r) ? pausedWhy(r) : thread !== null && (await archived(thread)) ? ARCHIVED : null;
    const told = await tell(t3, root, r, reader, at, blocked);
    out ??= told;
  }
  return out ?? { woken: false, why: null };
}

export function waker(t3: T3Runner): Waker {
  /** Codes whose condition wake was delivered but whose ending isn't recorded yet. */
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
    // Answers: the ones a thread is still owed, whatever their age; and, as an older braid recorded them (no such mark),
    // the ones recorded outside the asking thread within the last day (0072/D).
    const since = Math.max(Date.parse(ANSWER_WAKES_FROM), at.getTime() - ANSWER_WAKE_MS);
    let lifecycle: ReadonlyMap<string, Lifecycle> | null = null;
    for (const r of record) {
      for (const reader of READERS) {
        const due = owed(r, reader);
        const elsewhere = due === null && reader === "asker" && !answerWoken(r) ? answerFromElsewhere(r) : null;
        if (due === null ? elsewhere === null || !(Date.parse(elsewhere.at) >= since) : !retries(due.failed, at)) {
          continue;
        }
        const thread = reader === "asker" ? r.thread : followerOf(r, (lifecycle ??= await loadLifecycleAsync(root)));
        const blocked = !live(r) ? pausedWhy(r) : thread !== null && good.t3.states?.get(thread) === "archived" ? ARCHIVED : null;
        await tell(t3, root, r, reader, at, blocked, warn);
      }
    }
  };
}