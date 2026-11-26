// The board's pause for provider limits (0064, 0074/C, docs/board.md "Provider limits"), the pure part: which threads a braid's pause
// reaches, the texts the board sends them by code, how a reply reads, the resume messages and the limit pushes. src/board/steerer.ts runs them.
import { percent } from "../braids/percent.js";
import type { ProviderReading } from "../braids/limits.js";
import type { Pause, PauseTarget, Replies } from "../braids/pauses.js";
import { clock, noAnswerItem, repliesText } from "./pause.js";
import type { T3 } from "./t3.js";

/** What the board knows of a PM: its thread and the braids its plan lists. */
export interface PmThread {
  readonly thread: string;
  readonly braids: readonly string[];
}

/**
 * The threads a braid's pause reaches on `provider`, from the board's T3 snapshot (0074/C; the 0060 contract): the threads of the braid
 * and its strands that work now (workers, and every thread recorded in `.braid/reviews.json` whatever its role: reviewers, researchers,
 * subagent workers), its running coordinator, and then its coordinator even when idle (it would launch new work). None when nothing of
 * the braid works on the provider: an Outline, a braid with no started item or whose agents all finished gets no pause. Idle workers,
 * archived threads and threads on other providers are never targets. A thread whose provider T3 doesn't name is left out.
 */
export function targetsOf(braid: string, provider: string, t3: T3, project: string): PauseTarget[] {
  const out: PauseTarget[] = [];
  const add = (t: PauseTarget, on: string | null | undefined): void => {
    if (on === provider && t3.states?.get(t.thread) !== "archived" && !out.some((o) => o.thread === t.thread)) {
      out.push(t);
    }
  };
  const mine = (key: string) => key === braid || key.startsWith(`${braid}/`);
  const running = t3.coordinators?.get(braid);
  if (running !== undefined) {
    add({ thread: running.id, kind: "coordinator", item: braid, project, link: running.link }, running.provider);
  }
  for (const [key, threads] of t3.threads) {
    if (mine(key)) {
      for (const t of threads) {
        add({ thread: t.id, kind: t.role, item: key, project, link: t.link ?? t3.links?.get(t.id) ?? null }, t.provider);
      }
    }
  }
  if (out.length === 0) {
    return out;
  }
  const idle = t3.idleCoordinators?.get(braid);
  if (running === undefined && idle !== undefined && idle.provider === provider && t3.states?.get(idle.id) !== "archived") {
    out.unshift({ thread: idle.id, kind: "coordinator", item: braid, project, link: idle.link });
  }
  return out;
}

/** The PM threads (not archived) whose plan lists this braid: they get the board's summary, and the resume. */
export function pmsOf(braid: string, t3: T3, pms: readonly PmThread[], project: string): PauseTarget[] {
  return pms
    .filter((pm) => pm.braids.includes(braid) && t3.states?.get(pm.thread) !== "archived")
    .map((pm) => ({ thread: pm.thread, kind: "pm", item: pm.braids.join(","), project, link: t3.links?.get(pm.thread) ?? null }));
}

/** The window over the threshold, as the reading names it: `Session`, `Weekly`. */
export function overWindow(r: ProviderReading): ProviderReading["windows"][number] | null {
  return r.windows.find((w) => w.id === r.pauseWindow) ?? null;
}

/** The pause text of a worker, reviewer, researcher or subagent: the board sends it by code and reads the reply in the thread. */
export function workerPause(provider: string, window: string, resume: string): string {
  return `Pause for ${provider} ${window} until ${resume}. Finish or undo your current step; never stop mid-commit. A running command may already have moved to the background: let it finish. Commit and push your WIP, log a checkpoint (\`braid log --checkpoint\`), then end your turn with the line \`Paused: <id> at <sha>\` (your item id and head commit) as the last line of your message; the board reads it in this thread. Start no new work until a resume message; if something wakes you meanwhile (a background command, a PR watch), note it, include your item's CI result in a short reply if that is what woke you, and end your turn again.`;
}

/** A coordinator's: its agents were messaged directly, so it launches nothing and answers for the braid. */
export function coordinatorPause(braid: string, provider: string, window: string, resume: string): string {
  return `Pause for ${provider} ${window} until ${resume}: the board is pausing braid ${braid}'s agents on ${provider} and has messaged them directly. Launch nothing on ${provider}, schedule no resume and run no \`braid pause\`: the board records the pause and sends your resume message. End your turn with the line \`Paused: ${braid}\` as the last line of your message; the board reads it in this thread.`;
}

/** The PM's one summary (direct pause, tell the PM): which braids, the provider and window, until when. It needs no reply. */
export function pmSummary(braids: readonly string[], provider: string, window: string, resume: string): string {
  return `Direct pause: the board paused braid${braids.length === 1 ? "" : "s"} ${braids.join(", ")} on ${provider} (${window}) until ${resume}, messaging each working agent and coordinator itself. Launch nothing on ${provider} until the resume. No reply is needed.`;
}

/** Whether a message holds a `Paused:` line (`Paused: 0074/C at 1a2b3c4`, `Paused: 0074`), in any line, also in code marks or bold. */
export function pausedLine(text: string): boolean {
  return /^[\s`*>_-]*Paused:\s*\S+/m.test(text);
}

/** The message to the PM thread (or, for a braid without a PM, its coordinator) when a pause didn't reach everyone: the safety net. */
export function escalation(braids: readonly string[], provider: string, r: Replies): string {
  const how = r.outcome === "failed" ? `failed (${r.reason ?? "no send went through"})` : repliesText(r);
  return `The board's pause of ${braids.join(", ")} for ${provider}: ${how}. The agents listed may still be running on ${provider}: check their threads and pause them by hand if needed. No reply is needed.`;
}

/** The resume message of one paused thread: workers and children their checkpoint, coordinators and PMs where they left off. */
export function resumeMessage(t: PauseTarget, provider: string): string {
  if (t.kind === "coordinator") {
    return `Resume: ${t.item} was paused by the board for ${provider}; go on where you left off`;
  }
  if (t.kind === "pm") {
    return `Resume: ${t.item.split(",").join(", ")} were paused by the board for ${provider}; go on where you left off`;
  }
  return `Resume: continue ${t.item} from your checkpoint`;
}

/** Why a resume happens, in the words of the ask: the button, the resume time, a fresh reading under the threshold, a window gone. */
const RESUME_WHY: Record<string, string> = {
  now: "Resume now, from the board (the user asked)",
  timer: "The window is open again (its resume time came)",
  early: "The window is back under its threshold",
  gone: "The paused window no longer applies to the provider's models",
  cli: "Resume asked for with braid resume --limit",
};

/**
 * The one message the PM gets when the board resumes braids it runs (0074/D: direct pause, PM-led resume): why, which braids, and
 * the command that resumes each, in the PM's order. `pauser`: the record is a `braid pause` of the coordinator or PM itself, which
 * clears it with `braid resume`.
 */
export function resumeAsk(braids: readonly string[], provider: string, why: string, usage: string | null, pauser = false): string {
  const head = `${RESUME_WHY[why] ?? RESUME_WHY["now"] ?? ""}: ${provider}${usage === null ? "" : ` reads ${usage}`}.`;
  const list = `Paused braid${braids.length === 1 ? "" : "s"}: ${braids.join(", ")}.`;
  return pauser
    ? `${head} ${list} Run braid resume ${braids.join(", ")}, delete its resume task if one is set, and go on. No reply is needed.`
    : `${head} ${list} Resume each, in your order: braid resume <number> --limit (it clears the board's record and sends each agent its resume text by code). No reply is needed.`;
}

/** A limit push (docs/board.md, "Notifications"): one per event and provider, its key kept in `notified.json`. */
export interface LimitPush {
  readonly key: string;
  readonly title: string;
  readonly body: string;
  readonly tags: readonly string[];
  readonly priority: "high" | "default" | "low";
  readonly click: string | null;
}

/** Every limit push key starts with this; the need notifier keeps them (they outlive the snapshot that sent them). */
export const LIMIT_KEY = "pause:";

/** The key of one pause: provider, window and the reset it waits for. */
export const pauseKey = (p: Pick<Pause, "provider" | "window" | "resetsAt" | "resumeAt">): string => `${LIMIT_KEY}${p.provider ?? ""}:${p.window ?? ""}:${p.resetsAt ?? p.resumeAt ?? ""}`;

const braidsOf = (records: readonly Pause[]): string => [...new Set(records.map((r) => r.braid))].sort().join(", ");

export type LimitEvent = "paused" | "failed" | "resumed" | "extended" | "weekly";

/** The push of an event over the board's records of one pause (one provider), per mockup 6 of 0064/A. */
export function limitPush(event: LimitEvent, records: readonly Pause[], now: Date, extra: { readonly click?: string | null; readonly roles?: readonly string[]; readonly due?: string | null; readonly usage?: string | null } = {}): LimitPush | null {
  const first = records[0];
  if (first === undefined) {
    return null;
  }
  const provider = first.provider ?? "";
  const key = pauseKey(first);
  const braids = braidsOf(records);
  const resume = first.resumeAt === null ? "?" : clock(first.resumeAt, now);
  const window = `${first.label ?? first.window ?? ""}${first.usedPercent === null ? "" : ` ${percent(first.usedPercent)}%`}`;
  const click = extra.click ?? null;
  const answered = records.reduce((n, r) => n + (r.replies?.answered ?? 0), 0);
  const total = records.reduce((n, r) => n + (r.replies?.total ?? 0), 0);
  switch (event) {
    case "paused":
      return { key: `${key}:paused`, title: `${provider} paused until ${resume}`, body: `${braids}: ${answered} of ${total} agents paused.\nResumes at ${resume} after a re-check.`, tags: ["double_vertical_bar"], priority: "low", click: null };
    case "failed": {
      // A partial pause pushes as failed too (0074/C): an agent without an answer may still be using the provider.
      const missing = records.flatMap((r) => r.replies?.noAnswer ?? []);
      const reason = records.find((r) => r.replies?.reason != null)?.replies?.reason ?? null;
      const what = answered === 0 && reason !== null ? `The pause failed: ${reason}.` : `${answered} of ${total} agents paused; no answer: ${missing.map(noAnswerItem).join(", ")}.`;
      return { key: `${key}:failed`, title: `${provider}: pause ${answered === 0 ? "failed" : `reached ${answered}/${total}`}`, body: `${what} ${braids} may still be running on ${provider}.`, tags: ["x"], priority: "high", click };
    }
    case "resumed": {
      const usage = extra.usage === null || extra.usage === undefined ? "" : `${extra.usage} after the reset. `;
      return extra.due === null || extra.due === undefined
        ? { key: `${key}:resumed`, title: `${provider} resumed`, body: `${usage}${braids} go${records.length === 1 ? "es" : ""} on.`, tags: ["arrow_forward"], priority: "default", click: null }
        : { key: `${key}:resumed`, title: `${provider} resumed (was due ${extra.due})`, body: `No board ran at ${extra.due}. Re-checked at start: ${usage}${braids} go${records.length === 1 ? "es" : ""} on.`, tags: ["arrow_forward"], priority: "default", click: null };
    }
    case "extended":
      return { key: `${key}:extended:${first.resetsAt ?? first.resumeAt ?? ""}`, title: `${provider} still over: resumes ${resume}`, body: `${window} at the resume time. ${braids} stay${records.length === 1 ? "s" : ""} paused.`, tags: ["double_vertical_bar"], priority: "default", click: null };
    case "weekly":
      return {
        key: `${key}:weekly`,
        title: `${provider} weekly limit: needs you`,
        body: `${window} until ${first.resetsAt === null ? resume : clock(first.resetsAt, now)}. ${braids} paused.\nWait for the reset, or move ${(extra.roles ?? []).length === 0 ? "its roles" : (extra.roles ?? []).join(", ")} to another provider in BRAID.md models.`,
        tags: ["scales"],
        priority: "high",
        click,
      };
  }
}

/** The key of one blind spell (0074/E): the provider and when its cache was last updated, so a spell pushes once and a later spell again. */
export const blindKey = (provider: string, since: string): string => `${LIMIT_KEY}blind:${provider}:${since}`;

/** The push for a provider that has gone blind: nothing pauses on it until it reads again. `agents` are the braids and items running on it. */
export function blindPush(provider: string, since: string, why: string, agents: readonly string[], now: Date): LimitPush {
  const using = agents.length === 0 ? "" : ` Running on it: ${agents.join(", ")}.`;
  return { key: blindKey(provider, since), title: `${provider}: limits blind since ${clock(since, now)}`, body: `${why}. Nothing pauses on ${provider} while it is blind.${using}`, tags: ["warning"], priority: "high", click: null };
}

/** Whether a pause waits for a weekly window: by its window id (`seven_day…`) or its label. */
export const weeklyPause = (p: Pick<Pause, "window" | "label">): boolean => /seven_day|week/i.test(`${p.window ?? ""} ${p.label ?? ""}`);
