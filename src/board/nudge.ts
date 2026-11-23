// The board's nudge (0071/C, docs/board.md "Nudges"): a coordinator or PM that is idle with nothing asked, no agent running and no
// hold (the stall conditions, derived in src/board/model.ts and programme.ts) gets one `t3 thread send` when the stall has held ten
// minutes. If it still holds ten minutes after the nudge, the card shows the stall, and under a PM the PM gets one message.
// The memory is the alarm clock, `.braid/broke.json` of the main checkout: `<id> stalled nudged` and `<id> stalled escalated`,
// dropped with the first-seen time when the stall ends, so a later stall is nudged again. As the wake: send first, record after; a
// failed send records nothing and is tried at the next refresh. Right before each send the file is read again, so a second board of
// the project (a service and a hand-started run) skips what the first recorded.
import { escalatedKey, nudgedKey, readBrokeNow, writeBroke, type Nudge } from "./signals.js";
import type { T3Runner } from "./t3.js";
import type { Waker } from "./wake.js";

const ASK = "Go on with the next step, or open a request or wait and end your turn.";

/** What an idle coordinator or PM is sent: names what stalled, and what to do. */
export function nudgeMessage(group: readonly Nudge[]): string {
  const first = group[0];
  if (first?.kind === "pm") {
    return `Nudge from the board: the PM of ${first.who} looks idle: no braid running, no open request, no hold. ${ASK}`;
  }
  return `Nudge from the board: ${[...new Set(group.map((n) => n.who))].join(", ")} looks idle: no running agent, no open request or wait, no hold. ${ASK}`;
}

/** The one message a PM gets when a braid's coordinator stopped after the nudge. */
export function escalationNote(group: readonly Nudge[]): string {
  const who = [...new Set(group.map((n) => n.who))].join(", ");
  return `From the board: the coordinator of ${who} was nudged and stopped again ten minutes later, with nothing asked and no agent running. The card shows it stalled; see the board.`;
}

/** The nudges and escalations that are still due on the file now, grouped by the thread they go to, with the clock key each records. */
function groups(all: readonly Nudge[], root: string, key: (id: string) => string, target: (n: Nudge) => string | null): Map<string, Nudge[]> {
  const file = readBrokeNow(root);
  const out = new Map<string, Nudge[]>();
  for (const n of all) {
    const thread = target(n);
    if (thread !== null && `${n.id} stalled` in file && !(key(n.id) in file)) {
      out.set(thread, [...(out.get(thread) ?? []), n]);
    }
  }
  return out;
}

export function nudger(t3: T3Runner): Waker {
  /** Sends delivered whose time isn't recorded yet. */
  const sent = new Set<string>();
  return async ({ root, good }, at, warn) => {
    const stalls = good.sig.nudges;
    if (stalls === undefined) {
      return;
    }
    const jobs = [
      { all: stalls.due(), key: nudgedKey, target: (n: Nudge) => n.thread, message: nudgeMessage, what: "nudge" },
      { all: stalls.escalate(), key: escalatedKey, target: (n: Nudge) => n.pm, message: escalationNote, what: "escalation" },
    ];
    for (const job of jobs) {
      for (const [thread, group] of groups(job.all, root, job.key, job.target)) {
        const names = group.map((n) => n.who).join(", ");
        if (!group.every((n) => sent.has(job.key(n.id)))) {
          const out = await t3(root, ["thread", "send", thread, job.message(group)]);
          if (out.error !== undefined || out.status !== 0) {
            const why = (out.stderr.trim().split("\n")[0] ?? "") || out.error?.message || "t3 failed";
            warn(`the ${job.what} of ${names} failed (${why}); retrying at each refresh`, `${job.what} ${names}`);
            continue;
          }
          group.forEach((n) => sent.add(job.key(n.id)));
        }
        try {
          for (const n of group) {
            writeBroke(root, job.key(n.id), at.toISOString());
            sent.delete(job.key(n.id));
          }
        } catch (error) {
          warn(`the ${job.what} of ${names} couldn't be recorded (${error instanceof Error ? error.message : String(error)}); retrying at each refresh`, `record ${job.what} ${names}`);
        }
      }
    }
  };
}
