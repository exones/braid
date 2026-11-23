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
import { braidAt } from "../braids/branches.js";
import { gitAsync } from "../braids/gitio.js";
import { conditionEnding, endRequest, loadRecord, type Ending, type Request } from "../braids/requests.js";
import type { Good } from "./feed.js";
import { prOf } from "./signals.js";
import type { T3Runner } from "./t3.js";

/** Whether braid `number` is Done on `origin/<main>`; each braid read once per call of this. Null: not there. */
export function braidDoneOn(root: string, main: string): (number: string) => boolean | null {
  const memo = new Map<string, boolean | null>();
  return (number) => {
    if (!memo.has(number)) {
      const b = braidAt(root, `origin/${main}`, number);
      memo.set(number, b === null ? null : b.brief.status === "Done");
    }
    return memo.get(number) ?? null;
  };
}

/** The braid a request's asker works on (`0042` of `0042/B`); null for a programme's request. */
const askingBraid = (r: Pick<Request, "id">): string | null => /^(\d{4})(?:\/|$)/.exec(r.id)?.[1] ?? null;

/** What the asking thread is sent. The text goes through cmd.exe on Windows: no quote or shell character may reach it. */
export function wakeMessage(r: Pick<Request, "code" | "text">, e: Ending): string {
  const text = r.text.replace(/["%^&|<>!\r\n]+/g, " ").replace(/\s+/g, " ").trim().replace(/[.\s]+$/, "");
  return `Wake: ${r.code} is met (${e.text ?? "its condition holds"}): ${text}. Go on where you left off.`;
}

export interface WakeProject {
  readonly root: string;
  readonly good: Good;
}

/** One project's wake step, run after a good read; `warn` reports what it couldn't do. */
export type Waker = (project: WakeProject, at: Date, warn: (line: string, once?: string) => void) => Promise<void>;

export function waker(t3: T3Runner): Waker {
  /** Codes whose wake was delivered but whose ending isn't recorded yet. */
  const sent = new Set<string>();
  return async ({ root, good }, at, warn) => {
    const held = good.sig.pauses ?? new Map();
    const open = loadRecord(root).requests.filter((r) => r.state === "open" && !held.has(askingBraid(r) ?? ""));
    if (open.length === 0) {
      return;
    }
    const main = good.start.main;
    // A `braid:` condition reads main as origin has it now; a failed fetch leaves the last one.
    if (open.some((r) => r.doneWhen.startsWith("braid:"))) {
      await gitAsync(root, ["fetch", "-q", "origin", main]).catch(() => undefined);
    }
    const check = { pr: (n: number) => prOf(good.github, n), braidDone: braidDoneOn(root, main), now: at };
    for (const r of open) {
      const e = conditionEnding(r, check);
      if (e === null) {
        continue;
      }
      const archived = r.thread !== null && good.t3.states?.get(r.thread) === "archived";
      if (e.state === "met" && r.thread !== null && !archived && !sent.has(r.code)) {
        const out = await t3(root, ["thread", "send", r.thread, wakeMessage(r, e)]);
        if (out.error !== undefined || out.status !== 0) {
          const why = (out.stderr.trim().split("\n")[0] ?? "") || out.error?.message || "t3 failed";
          warn(`the wake of ${r.code} (${r.id}) failed (${why}); retrying at each refresh`, `wake ${r.code}`);
          continue;
        }
        sent.add(r.code);
      }
      try {
        endRequest(root, r.code, { ...e, at: at.toISOString() });
        sent.delete(r.code);
      } catch (error) {
        warn(`${r.code} (${r.id}) couldn't be recorded as ${e.state} (${error instanceof Error ? error.message : String(error)}); retrying at each refresh`, `record ${r.code}`);
      }
    }
  };
}
