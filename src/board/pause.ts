// What a braid's pause looks like on the board and in `braid status`: its phase by the clock and its texts.
// Pure (no Node.js), so the page uses it too. The record comes from src/braids/pauses.ts.
import { reasonOf, type Pause } from "../braids/pauses.js";

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
const who = (p: Pause): string => (p.by === "pm" ? "the PM" : "the coordinator");

/** `Claude_Everix Session 97%`: the provider, the window's label and its usage, as far as they are known. */
export function usage(p: Pause): string {
  return [p.provider, p.label, p.usedPercent === null ? null : `${p.usedPercent}%`].filter((s) => s !== null).join(" ");
}

/** What a card, a strand row and `braid status` show of a pause. */
export interface PauseView {
  /** `paused`: sky; `due` (also once `over`): amber. */
  readonly state: "paused" | "due";
  readonly phase: PausePhase;
  /** `Paused: Claude_Everix Session 97%, resumes 21:05`, or `…; resume was due at 20:27`. */
  readonly text: string;
  /** The smaller line: who paused and when, or when it reads Stalled. */
  readonly note: string;
  readonly record: Pause;
}

/** `Held: “Please freeze work”`: a hold shows the words it was given. */
const heldText = (p: Pause): string => `Held: “${p.words ?? ""}”`;

export function pauseView(p: Pause, now: Date): PauseView {
  const phase = phaseOf(p, now);
  if (reasonOf(p) === "hold") {
    return { state: "paused", phase, text: heldText(p), note: `held by ${who(p)} since ${clock(p.at, now)}`, record: p };
  }
  if (phase === "paused") {
    return { state: "paused", phase, text: `Paused: ${usage(p)}, resumes ${at(p.resumeAt, now)}`, note: `paused by ${who(p)} ${span(now.getTime() - Date.parse(p.at))} ago`, record: p };
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
  const window = p.label === null ? (p.provider ?? "") : `${p.provider} ${p.label} window${p.usedPercent === null ? "" : ` at ${p.usedPercent}%`}`;
  const command = `braid resume ${p.braid}`;
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
  const by = `by ${p.by === "pm" ? "PM" : "coordinator"} ${p.thread.slice(0, 8)}`;
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
