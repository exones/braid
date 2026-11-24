// The board's reminders (0071/B, docs/board.md "Reminders"): at each refresh of a running board, after the wake, every open
// wait (a request to another braid's coordinator) and every open request to the PM is looked at:
//   - its addressee gets "Gentle hourly reminder: I'm still waiting for you" with the request, at most hourly and not before
//     the addressee's estimate (`braid eta`), recorded as a `reminded` event by the board;
//   - a wait past its estimate is escalated once per estimate: under a PM, the PM gets one message, recorded as a `reminded`
//     event with the cause as its reason.
// A held or paused braid, asking or waited on, is skipped. Nothing goes to the user. As the wake: send first, record after
// (the event is the memory); a failed send records nothing and is tried at the next refresh.
import { addEvent, loadRecord, type Request, type RequestEvent } from "../braids/requests.js";
import { clock } from "./pause.js";
import type { T3Runner } from "./t3.js";
import { addresseeOf, braidOfId, escalated, missedEta, pmThreadOf, remindable, reminderDue, type Addressee } from "./waits.js";
import { safeText, type Waker } from "./wake.js";

/** "braid 0002 is merged into main", "PR #5 is merged", "answered". */
function doneWords(doneWhen: string, now: Date): string {
  const [kind, value = ""] = doneWhen.split(/:(.*)/s);
  return kind === "braid" ? `braid ${value} is merged into main` : kind === "pr" ? `PR #${value} is merged` : kind === "time" ? `at ${clock(value, now)}` : "answered";
}

/** A text as a sentence: a full stop unless it ends in a question mark. */
const sentence = (text: string): string => (text.endsWith("?") ? text : `${text}.`);

/** The reminder an addressee gets. No quote or shell character reaches T3 (cmd.exe on Windows): the call is shown with single quotes. */
export function reminderMessage(r: Request, a: Exclude<Addressee, { to: "gone" }>, now: Date): string {
  const asker = braidOfId(r.id) ?? r.id;
  const to = a.to === "pm" && a.braid !== undefined ? ` to braid ${a.braid}, which has no coordinator yet` : "";
  const missed = missedEta(r, now);
  const ask = missed === null ? `Say when you expect it: braid eta ${r.code} 2h 'why' (a duration, or a time such as 16:30).` : `Your estimate ${clock(missed, now)} has passed; set a new one: braid eta ${r.code} 2h 'why'.`;
  return `Gentle hourly reminder: I'm still waiting for you. ${r.code} from the ${asker} coordinator (item ${r.id})${to}: ${sentence(safeText(r.text))} Done when ${doneWords(r.doneWhen, now)}. ${ask}`;
}

/** The one message the PM gets when a wait of its braid passes its estimate. */
export function escalationMessage(r: Request, missed: string, now: Date): string {
  const asker = braidOfId(r.id) ?? r.id;
  return `From the board: ${asker} waits on braid ${r.to ?? ""} (${r.code}: ${safeText(r.text)}) past its estimate ${clock(missed, now)}. The ${r.to ?? ""} coordinator is reminded hourly. See braid requests ${r.code}.`;
}

/** What one refresh sends for a request: the thread, the message and the event that records it; none when nothing is due. */
export function remindersOf(r: Request, a: Addressee | null, pm: string | null, now: Date): { thread: string; message: string; event: RequestEvent }[] {
  if (a === null) {
    return [];
  }
  const out: { thread: string; message: string; event: RequestEvent }[] = [];
  const at = now.toISOString();
  const missed = missedEta(r, now);
  // Escalation: a wait past its estimate, once per estimate, to the PM of a PM-run braid whose reminders go to the coordinator.
  if (missed !== null && a.to === "coordinator" && pm !== null && !escalated(r)) {
    out.push({ thread: pm, message: escalationMessage(r, missed, now), event: { event: "reminded", at, by: "board", text: "sent to the PM", reason: `missed its estimate ${clock(missed, now)}` } });
  }
  if (a.to !== "gone" && reminderDue(r, now)) {
    out.push({ thread: a.thread, message: reminderMessage(r, a, now), event: { event: "reminded", at, by: "board", text: a.to === "pm" ? "sent to the PM" : `sent to the ${a.braid} coordinator` } });
  }
  return out;
}

export function reminder(t3: T3Runner): Waker {
  /** Sends delivered whose event isn't recorded yet: `<code> <event text>`. */
  const sent = new Set<string>();
  return async ({ root, good }, at, warn) => {
    const held = good.sig.pauses ?? new Map();
    const plans = good.sig.plans;
    for (const r of loadRecord(root).requests.filter(remindable)) {
      if (held.has(braidOfId(r.id) ?? "") || (r.to !== undefined && held.has(r.to))) {
        continue;
      }
      const pm = pmThreadOf(braidOfId(r.id) ?? "", plans);
      const live = pm !== null && good.t3.states?.has(pm) === true && good.t3.states.get(pm) !== "archived" ? pm : null;
      const addressee = addresseeOf(r, good.t3, plans);
      for (const s of remindersOf(r, addressee, live, at)) {
        const key = `${r.code} ${s.event.text ?? ""} ${s.event.reason ?? ""}`;
        if (!sent.has(key)) {
          // Right before the send, the record is read again: a second board of the project may have sent it a moment ago.
          const now = loadRecord(root).requests.find((x) => x.code === r.code);
          if (now === undefined || !remindersOf(now, addressee, live, at).some((x) => x.event.text === s.event.text && x.event.reason === s.event.reason)) {
            continue;
          }
          const out = await t3(root, ["thread", "send", s.thread, s.message]);
          if (out.error !== undefined || out.status !== 0) {
            const why = (out.stderr.trim().split("\n")[0] ?? "") || out.error?.message || "t3 failed";
            warn(`the reminder of ${r.code} (${r.id}) failed (${why}); retrying at each refresh`, `remind ${r.code}`);
            continue;
          }
          sent.add(key);
        }
        try {
          addEvent(root, r.code, s.event);
          sent.delete(key);
        } catch (error) {
          warn(`the reminder of ${r.code} (${r.id}) couldn't be recorded (${error instanceof Error ? error.message : String(error)}); retrying at each refresh`, `record remind ${r.code}`);
        }
      }
    }
  };
}
