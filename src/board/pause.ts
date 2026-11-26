// What a braid's pause looks like on the board and in `braid status`: its phase by the clock and its texts.
// Pure (no Node.js), so the page uses it too. The record comes from src/braids/pauses.ts.
import { percent } from "../braids/percent.js";
import { reasonOf, type NoAnswer, type Pause, type Replies } from "../braids/pauses.js";
import type { Lane } from "./model.js";

/** Past `resumeAt` by this much with the record still there, the mark says the resume was due. */
export const DUE_MS = 15 * 60_000;
/** Past `resumeAt` by this much (the due time plus ten minutes), a paused item reads `stalled` again. */
export const STALL_MS = 25 * 60_000;

/** `paused` until `resumeAt` + 15 min, `due` until + 25 min, then `over`: stalled shows again if nobody works. */
export type PausePhase = "paused" | "due" | "over";

/** When a limit's resume is due, ms; a hold has no resume time and is never overdue. */
const dueAt = (pause: Pause): number => (pause.resumeAt === null ? Number.POSITIVE_INFINITY : Date.parse(pause.resumeAt));

export function phaseOf(pause: Pause, now: Date): PausePhase {
  const past = now.getTime() - dueAt(pause);
  return past < DUE_MS ? "paused" : past < STALL_MS ? "due" : "over";
}

/** When a paused item reads stalled again (ISO). */
export function stalledSince(pause: Pause): string {
  return new Date(dueAt(pause) + STALL_MS).toISOString();
}

const pad = (n: number): string => String(n).padStart(2, "0");
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Local time as `21:05`, with the date (`Nov 23 21:05`) when it isn't today's. */
export function clock(iso: string, now: Date): string {
  const d = new Date(iso);
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return d.toDateString() === now.toDateString() ? time : `${MONTHS[d.getMonth()] ?? ""} ${d.getDate()} ${time}`;
}

/** `18 min`, `3 h`, `2 d`. */
function span(ms: number): string {
  const min = Math.max(0, Math.floor(ms / 60_000));
  return min < 60 ? `${min} min` : min < 2880 ? `${Math.floor(min / 60)} h` : `${Math.floor(min / 1440)} d`;
}

const at = (iso: string | null, now: Date): string => (iso === null ? "" : clock(iso, now));
const who = (p: Pause): string => (p.by === "pm" ? "the PM" : p.by === "board" ? "the board" : "the coordinator");
const agentsWord = (n: number): string => `${n} agent${n === 1 ? "" : "s"}`;

/** `Claude_Everix Session 92%`: the provider, the window's label and its usage, as far as they are known. */
export function usage(p: Pause): string {
  return [p.provider, p.label, p.usedPercent === null ? null : `${percent(p.usedPercent)}%`].filter((s) => s !== null).join(" ");
}

/** What a card, a strand row and `braid status` show of a pause. */
export interface PauseView {
  /** `paused`: sky; `pausing`: sky, while the board counts the replies; `due` (also once `over`, or an agent that didn't answer): amber. */
  readonly state: "paused" | "pausing" | "due";
  readonly phase: PausePhase;
  /** `Paused: Claude_Everix Session 92%, resumes 21:05`, or `…; resume was due at 20:27`. */
  readonly text: string;
  /** The smaller line: who paused and when, or when it reads Stalled. */
  readonly note: string;
  readonly record: Pause;
}

/**
 * How a resume of this record goes (0074/D): `direct`, the board sends each agent its resume text and clears the record; `pm`, the
 * board asks the PM, who resumes it with `braid resume <number> --limit`; `pauser`, a `braid pause` of a coordinator or PM: that
 * thread is asked. Null for a hold: Resume now never clears one.
 */
export function resumeMode(p: Pause): "direct" | "pm" | "pauser" | null {
  if (reasonOf(p) === "hold") {
    return null;
  }
  if (p.by !== "board") {
    return "pauser";
  }
  return (p.targets ?? []).some((t) => t.kind === "pm") ? "pm" : "direct";
}

/** Whether a braid's card carries ▶ Resume now: a paused braid in To Do, Working or Needs You (a failed or partial pause keeps its record there). */
export const resumeOnCard = (pause: PauseView | null, lane: Lane): pause is PauseView => pause !== null && (lane === "In Progress" || lane === "To Do" || lane === "Waiting");

/** Who a resume asks: `the PM` or `the coordinator`. */
export const askWho = (p: Pause): string => (resumeMode(p) === "pm" || (p.by === "pm" && resumeMode(p) === "pauser") ? "the PM" : "the coordinator");

/** The card line of a resume under way: pending (a send failed, retried at each refresh), asked (the PM got it), or asked for. Null otherwise. */
function resumingView(p: Pause, phase: PausePhase, now: Date): PauseView | null {
  const r = p.resuming;
  if (r === undefined) {
    return null;
  }
  if (r.failedSince !== null) {
    const agents = (p.targets ?? []).filter((t) => t.kind !== "pm");
    const reached = r.direct ? `${agents.filter((t) => (p.resumed ?? []).includes(t.thread)).length} of ${agentsWord(agents.length)} reached` : `${askWho(p)} not reached yet`;
    return { state: "due", phase, text: `Paused: ${usage(p)}; resume pending: T3 unreachable since ${clock(r.failedSince, now)}`, note: `retried at each refresh${r.lastTry === null ? "" : ` · last try ${clock(r.lastTry, now)}`} · ${reached}`, record: p };
  }
  const resumes = p.resumeAt === null ? "" : `, resumes ${at(p.resumeAt, now)}`;
  if (r.lastTry === null) {
    return { state: "paused", phase, text: `Paused: ${usage(p)}${resumes}`, note: `resume asked for at ${clock(r.at, now)} · the acting board sends it`, record: p };
  }
  if (!r.direct && r.askedAt !== null) {
    return { state: "paused", phase, text: `Paused: ${usage(p)}${resumes}`, note: `asked ${askWho(p)} to resume at ${clock(r.askedAt, now)}`, record: p };
  }
  return null;
}

/** `Held: “Please freeze work”`: a hold shows the words it was given; with none (a plan's `state: held`) it says so. */
const heldText = (p: Pause): string => ((p.words ?? "").trim() === "" ? "Held: the plan says held" : `Held: “${p.words}”`);

export function pauseView(p: Pause, now: Date): PauseView {
  const phase = phaseOf(p, now);
  if (reasonOf(p) === "hold") {
    return { state: "paused", phase, text: heldText(p), note: `held by ${who(p)} since ${clock(p.at, now)}`, record: p };
  }
  const resuming = resumingView(p, phase, now);
  if (resuming !== null) {
    return resuming;
  }
  const s = p.replies;
  if (phase === "paused" && s !== undefined) {
    // The board's pause (0064, 0074/C): the texts it sent and the replies it counted.
    const ago = `paused by the board ${span(now.getTime() - Date.parse(p.at))} ago`;
    if (s.outcome === "pausing") {
      return { state: "pausing", phase, text: `Pausing for ${usage(p)}: ${agentsWord(s.total)} asked to pause`, note: `sent ${span(now.getTime() - Date.parse(s.sent))} ago · ${s.got.length} of ${s.total} answered so far`, record: p };
    }
    if (s.outcome === "partial") {
      return { state: "due", phase, text: `Paused ${s.answered}/${s.total}: ${usage(p)}; ${agentsWord(s.noAnswer.length)} didn’t answer`, note: `${ago} · no answer: ${s.noAnswer.map(noAnswerItem).join(", ")}; check its thread`, record: p };
    }
    if (s.outcome === "failed") {
      return { state: "due", phase, text: `Pause failed: ${s.reason ?? "no send went through"}`, note: `${ago} · agents may still be running on ${p.provider ?? "the provider"}`, record: p };
    }
    return { state: "paused", phase, text: `Paused: ${usage(p)}, resumes ${at(p.resumeAt, now)}`, note: `${ago} · ${s.answered} of ${agentsWord(s.total)} answered${resumeMode(p) === "pm" ? " · the PM resumes it" : ""}`, record: p };
  }
  if (phase === "paused") {
    return { state: "paused", phase, text: `Paused: ${usage(p)}, resumes ${at(p.resumeAt, now)}`, note: `paused by ${who(p)} ${span(now.getTime() - Date.parse(p.at))} ago`, record: p };
  }
  if (p.by === "board") {
    return { state: "due", phase, text: `Paused: ${usage(p)}; resume was due at ${at(p.resumeAt, now)}`, note: "no board was running then · resumes at the next refresh after a re-check", record: p };
  }
  const stall = clock(stalledSince(p), now);
  return {
    state: "due",
    phase,
    text: `Paused: ${usage(p)}; resume was due at ${at(p.resumeAt, now)}`,
    note: phase === "due" ? `reads Stalled at ${stall} unless it resumes` : `nobody resumed it; Stalled since ${stall} if nobody works`,
    record: p,
  };
}

/** `0074/C (link)`: a target without an answer, with its thread link (else its thread id) and why, unless it still worked. */
export function noAnswerItem(n: NoAnswer): string {
  return `${n.item}${n.link !== null ? ` (${n.link})` : n.thread === "" ? "" : ` (thread ${n.thread})`}${n.why === "working" ? "" : `: ${n.why}`}`;
}

/** `paused 3/4; no answer: 0074/C (link)`: what a settled board pause reached. */
export function repliesText(r: Replies): string {
  return `paused ${r.answered}/${r.total}${r.noAnswer.length === 0 ? "" : `; no answer: ${r.noAnswer.map(noAnswerItem).join(", ")}`}`;
}

/**
 * What a board pause asks of the user (0064, reason `limit`): a weekly window until its reset (wait, or move the roles), or a pause
 * that didn't reach everyone (0074/C: a failed send or no answer in 10 min). Null for any other pause. Derived from the record: no request file.
 */
export function limitNeed(p: Pause, now: Date): { readonly text: string; readonly since: string } | null {
  if (p.by !== "board" || reasonOf(p) !== "limit") {
    return null;
  }
  const r = p.replies;
  if (r?.outcome === "failed") {
    return { text: `Pause failed for ${p.provider ?? "the provider"}: ${r.reason ?? "no send went through"}; ${repliesText(r)}. Its agents may still be running: open their threads, or pause by hand`, since: r.sent };
  }
  if (r?.outcome === "partial") {
    return { text: `Pause for ${p.provider ?? "the provider"}: ${repliesText(r)}. Those may still be running: open their threads, or pause by hand`, since: r.sent };
  }
  const weekly = /seven_day|week/i.test(`${p.window ?? ""} ${p.label ?? ""}`);
  if (weekly && (p.resumeAt === null || Date.parse(p.resumeAt) > now.getTime())) {
    const until = p.resetsAt ?? p.resumeAt;
    return { text: `Weekly limit: ${usage(p)} until ${until === null ? "the reset" : clock(until, now)}. Wait for the reset, or move its roles to another provider in BRAID.md models`, since: p.at };
  }
  return null;
}

/** The stalled text of a paused item whose resume never came. */
export function stalledText(p: Pause, now: Date): string {
  return `Stalled: paused for ${p.provider ?? "a limit"}; resume was due at ${at(p.resumeAt, now)} and nobody resumed it`;
}

/** The details panel's box: heading, text and the small line under it. */
export function pauseBox(view: PauseView, now: Date): { readonly head: string; readonly text: string; readonly foot: string } {
  const p = view.record;
  const thread = p.thread.slice(0, 8);
  if (reasonOf(p) === "hold") {
    return { head: `Held · since ${clock(p.at, now)}`, text: `${heldText(p)}. It has no resume time and never turns stalled.`, foot: `Held by ${who(p)} (thread ${thread}). Nothing to do: braid resume ${p.braid} clears it.` };
  }
  const window = p.label === null ? (p.provider ?? "") : `${p.provider} ${p.label} window${p.usedPercent === null ? "" : ` at ${percent(p.usedPercent)}%`}`;
  const command = `braid resume ${p.braid}`;
  if (p.by === "board") {
    const s = p.replies;
    const steer = s === undefined ? "" : `, its text sent to ${agentsWord(s.total)} at ${clock(s.sent, now)}`;
    const reset = p.resetsAt === null ? "" : ` (resets ${clock(p.resetsAt, now)})`;
    return {
      head: view.state === "due" && view.phase !== "paused" ? `Paused · resume was due at ${at(p.resumeAt, now)}` : `Paused · since ${clock(p.at, now)}`,
      text: `${window}${reset}. ${view.text}.`,
      foot: `Paused by the board${steer}. The board re-checks the limit at ${at(p.resumeAt, now)}, and earlier when a fresh reading is under the threshold, then ${resumeMode(p) === "pm" ? "asks the PM to resume it" : "resumes every paused agent"}; ▶ Resume now does it at once, and ${command} --limit resumes it from a terminal.`,
    };
  }
  if (view.state === "paused") {
    const buffer = p.resetsAt === null ? null : Math.round((dueAt(p) - Date.parse(p.resetsAt)) / 60_000);
    const reset = p.resetsAt === null ? "" : ` (resets ${clock(p.resetsAt, now)})`;
    const resumes = `Resumes ${at(p.resumeAt, now)}${buffer === null || buffer <= 0 ? "" : `, with the ${buffer} min buffer`}.`;
    const task = p.task === null ? "; no resume task was recorded" : `; its resume task ${p.task} wakes it at ${at(p.resumeAt, now)}`;
    return { head: `Paused · since ${clock(p.at, now)}`, text: `${window}${reset}. ${resumes}`, foot: `Paused by ${who(p)} (thread ${thread})${task}. Nothing to do: ${command} clears it by hand.` };
  }
  const reset = p.resetsAt === null ? "" : ` (reset ${clock(p.resetsAt, now)})`;
  const stall = clock(stalledSince(p), now);
  const later = view.phase === "due" ? `Reads Stalled at ${stall}.` : `Stalled since ${stall} if nobody works.`;
  return {
    head: `Paused · resume was due at ${at(p.resumeAt, now)}`,
    text: `${window}${reset}. The resume didn't come: T3 may have been down, the task deleted, or the ${p.by === "pm" ? "PM" : "coordinator"} thread archived. ${later}`,
    foot: `Paused by ${who(p)} (thread ${thread})${p.task === null ? "" : `, resume task ${p.task}`}. Open the ${p.by === "pm" ? "PM" : "coordinator"} thread and tell it to resume, or run ${command}.`,
  };
}

/** The line `braid status` prints under a paused braid. */
export function statusLine(view: PauseView, now: Date): string {
  const p = view.record;
  const by = p.by === "board" ? "by the board" : `by ${p.by === "pm" ? "PM" : "coordinator"} ${p.thread.slice(0, 8)}`;
  const task = p.task === null ? "" : `, task ${p.task}`;
  if (reasonOf(p) === "hold") {
    return `${view.text} (${by} at ${clock(p.at, now)})`;
  }
  if (view.state === "paused") {
    return `${view.text} (${by} at ${clock(p.at, now)}${task})`;
  }
  return `${view.text} (${by}${task}); ${view.phase === "due" ? `reads Stalled at ${clock(stalledSince(p), now)}` : `Stalled since ${clock(stalledSince(p), now)} if nobody works`}`;
}

/** The lane suffix in `braid status`: `paused` or `paused, resume was due`. */
export function laneNote(view: PauseView): string {
  return view.record.reason === "hold" ? "held" : view.state === "paused" ? "paused" : "paused, resume was due";
}
