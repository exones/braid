// The words of the limits chips and panel (docs/board.md, "Provider limits"). Pure (no Node.js), so the page uses it too.
import { clock } from "./pause.js";
import type { ChipState, LimitsView, ProviderView } from "./limits.js";

const MIN = 60_000;

/** `14 min`, `3 h`: how long ago `iso` was, as the chip and panel say it. */
export function agoText(iso: string, now: Date): string {
  const min = Math.max(0, Math.round((now.getTime() - Date.parse(iso)) / MIN));
  return min < 60 ? `${min} min` : `${Math.round(min / 60)} h`;
}

/** `in 52 min`, `in 3 h`, `in 2 d`. */
function inText(ms: number): string {
  const min = Math.max(0, Math.round(ms / MIN));
  return min < 60 ? `in ${min} min` : min < 2880 ? `in ${Math.round(min / 60)} h` : `in ${Math.round(min / 1440)} d`;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** `07:05` today, `Thu 07:05` within the next six days (a weekly reset), else the date as `clock` gives it. */
export function whenText(iso: string, now: Date): string {
  const days = (Date.parse(iso) - now.getTime()) / 86_400_000;
  const d = new Date(iso);
  if (d.toDateString() !== now.toDateString() && days > 0 && days < 6) {
    return `${DAYS[d.getDay()] ?? ""} ${clock(iso, d).slice(-5)}`;
  }
  return clock(iso, now);
}

/** Whether the window a pause waits for is a weekly one: by the reading when it has the window, else by the record's window id. */
const isWeekly = (p: ProviderView): boolean => p.windows.find((w) => w.id === p.pauseWindow)?.kind === "weekly" || (p.pauseWindow !== null && /seven_day|week/i.test(p.pauseWindow));

/** The note on a chip, after the name: what the state says beyond the meters; empty for ok and near. */
export function chipNote(p: ProviderView, now: Date): string {
  switch (p.state) {
    case "unmeasured":
      return "not measured";
    case "unknown":
      return p.checkedAt === null ? "no reading yet" : `no reading for ${agoText(p.checkedAt, now)}`;
    case "over":
      return p.steering?.outcome === "pausing" ? "pausing…" : "over";
    case "paused": {
      if (p.steering?.outcome === "pausing") {
        return "pausing…";
      }
      return `${isWeekly(p) ? "weekly · " : "paused · "}resumes ${p.resumeAt === null ? "?" : whenText(p.resumeAt, now)}`;
    }
    default:
      return "";
  }
}

/** The badge in the panel: the state in words, with the resume time when paused. */
export function badgeText(p: ProviderView, now: Date): string {
  return p.state === "paused" ? chipNote(p, now) : p.state === "unmeasured" ? "not measured" : p.state === "unknown" ? "unknown" : p.state;
}

/** The chip's hover text: the numbers in words. */
export function chipTitle(p: ProviderView): string {
  const part = (label: string, w: ProviderView["session"]): string => (w === null ? "" : `${label} ${w.usedPercent}% of ${w.threshold}%`);
  const nums = [part("Session", p.session), part("Weekly", p.weekly)].filter((s) => s !== "").join(", ");
  return `${p.instanceId}: ${nums === "" ? (p.reason ?? p.state) : nums}`;
}

/** `resets 13:50 (in 52 min)` for a window. */
export function resetText(resetsAt: string | null, reset: boolean, now: Date): string {
  return resetsAt === null ? "no reset shown" : reset ? "reset" : `resets ${whenText(resetsAt, now)} (${inText(Date.parse(resetsAt) - now.getTime())})`;
}

/** The state's tone: which colours the chip, bar and badge take. */
export const STATE_TONE: Readonly<Record<ChipState, "slate" | "amber" | "red" | "sky" | "dashed">> = { ok: "slate", near: "amber", over: "red", paused: "sky", unknown: "dashed", unmeasured: "dashed" };

/** The agents line of a provider: the paused braids and the running agents, or what is known when none. */
export function agentsText(p: ProviderView): { readonly paused: string; readonly running: string } {
  const list = (state: "paused" | "running"): string => {
    const items = p.agents.filter((a) => a.state === state).map((a) => `${a.project === null ? "" : `${a.project}: `}${a.id}${state === "running" ? ` (${a.role})` : ""}`);
    return items.length === 0 ? "none" : items.join(", ");
  };
  return { paused: list("paused"), running: list("running") };
}

/** The panel's steering line (mockup 3): where the 🚦 thread ran, when, and what came of it; null without one. */
/**
 * Which board acts (0074/B): "This board acts for the pauses, resumes and wakes." when it holds every key, else one line per key
 * another board holds: "Watching: the board on port <p> (pid <n>) acts for <what>." Null when the board pauses nothing.
 */
export function actingText(view: LimitsView): string[] | null {
  const lines = view.acting;
  if (lines === undefined) {
    return null;
  }
  const watching = lines.filter((l) => l.state === "watching");
  if (watching.length === 0) {
    return ["This board acts for the pauses, resumes and wakes."];
  }
  return watching.map((l) => `Watching: ${l.by ?? "another board acts"} for ${l.key.startsWith("repo-") ? `the wakes and reminders of ${l.label}` : `the pause and resume of ${l.label}`}.`);
}

export function steeringText(p: ProviderView, now: Date): string | null {
  const s = p.steering;
  if (s === null) {
    return null;
  }
  const on = `${s.provider}${s.model === null ? "" : ` / ${s.model}`}${s.self ? " (in the margin of the provider it pauses)" : ""}`;
  const started = `started ${whenText(s.started, now)}`;
  const what =
    s.outcome === "pausing"
      ? `pausing ${s.total} agent${s.total === 1 ? "" : "s"}`
      : s.outcome === "failed"
        ? `failed: ${s.reason ?? "no reason given"}`
        : `${s.answered ?? 0} of ${s.total} agents answered Paused:${s.noAnswer.length === 0 ? "" : `; no answer: ${s.noAnswer.join(", ")}`}`;
  return `🚦 Steering thread on ${on}, ${started}: ${what}.`;
}
