// The board's pause for provider limits (0064, docs/board.md "Provider limits"), the pure part: which `models.steering` line
// steers, which threads a braid's pause reaches, the steering thread's first message, its `Steering:` line, the resume
// messages and the limit pushes. src/board/steerer.ts runs them.
import type { ModelLine, ProviderReading } from "../braids/limits.js";
import type { Pause, PauseTarget, Steering } from "../braids/pauses.js";
import { clock } from "./pause.js";
import type { T3 } from "./t3.js";

/** `models.steering.first`, then `models.steering.fallback` (a plain `models.steering` line counts as first); null when BRAID.md has no `steering` role. */
export function steeringLines(lines: readonly ModelLine[]): ModelLine[] | null {
  const pick = (role: string) => lines.find((l) => l.role === role);
  const out = [pick("steering.first") ?? pick("steering"), pick("steering.fallback")].filter((l): l is ModelLine => l !== undefined);
  return out.length === 0 ? null : out;
}

/** The first line whose provider is under its threshold (`ok` or `unknown`); when every one is over, `first`, steering from the over provider (`self`). */
export function pickSteering(lines: readonly ModelLine[], over: (instanceId: string) => boolean): { readonly line: ModelLine; readonly self: boolean } | null {
  const free = lines.find((l) => !over(l.instanceId));
  const first = lines[0];
  return free !== undefined ? { line: free, self: false } : first === undefined ? null : { line: first, self: true };
}

/** What the board knows of a PM: its thread and the braids its plan lists. */
export interface PmThread {
  readonly thread: string;
  readonly braids: readonly string[];
}

/**
 * The threads a braid's pause reaches on `provider`, from the snapshot: its coordinator (running, else the newest idle one), the workers
 * of the braid and its strands (running or idle, not archived), its running recorded reviewers, and the PM threads whose plan lists it.
 * A thread whose provider T3 doesn't name is left out. The steering thread adds the running children of these.
 */
export function targetsOf(braid: string, provider: string, t3: T3, pms: readonly PmThread[], project: string): PauseTarget[] {
  const out: PauseTarget[] = [];
  const add = (t: PauseTarget, on: string | null | undefined): void => {
    if (on === provider && !out.some((o) => o.thread === t.thread)) {
      out.push(t);
    }
  };
  const coordinator = t3.coordinators?.get(braid) ?? t3.idleCoordinators?.get(braid);
  if (coordinator !== undefined) {
    add({ thread: coordinator.id, kind: "coordinator", item: braid, project }, coordinator.provider);
  }
  const mine = (key: string) => key === braid || key.startsWith(`${braid}/`);
  for (const map of [t3.threads, t3.idle ?? new Map()]) {
    for (const [key, threads] of map) {
      if (mine(key)) {
        for (const t of threads) {
          add({ thread: t.id, kind: t.role, item: key, project }, t.provider);
        }
      }
    }
  }
  if (out.length === 0) {
    return out; // a braid with no agent on the provider is no braid of this pause; its PM alone doesn't make it one
  }
  for (const pm of pms) {
    if (pm.braids.includes(braid) && t3.states?.get(pm.thread) !== "archived") {
      add({ thread: pm.thread, kind: "pm", item: pm.braids.join(","), project }, t3.providers?.get(pm.thread));
    }
  }
  return out;
}

/** The window over the threshold, as the reading names it: `Session`, `Weekly`. */
export function overWindow(r: ProviderReading): ProviderReading["windows"][number] | null {
  return r.windows.find((w) => w.id === r.pauseWindow) ?? null;
}

/** The pause message of a worker, reviewer or child: limits.md's text, unchanged, with the reply going to the steering thread. */
export function workerPause(provider: string, window: string, resume: string): string {
  return `Pause for ${provider} ${window} until ${resume}. Finish or undo your current step; never stop mid-commit. A running command may already have moved to the background: let it finish. Commit and push your WIP, log a checkpoint (\`braid log --checkpoint\`), send \`Paused: <id> at <sha>\` to <steering thread id>, end your turn. Start no new work until a resume message; if something wakes you meanwhile (a background command, a PR watch), note it, include your item's CI result in a short reply if that is what woke you, and end your turn again.`;
}

/** A coordinator's: its agents were messaged directly, so it launches nothing and answers for the braid. */
export function coordinatorPause(braid: string, provider: string, window: string, resume: string): string {
  return `Pause for ${provider} ${window} until ${resume}: the board is pausing braid ${braid}'s agents on ${provider} and has messaged them directly. Launch nothing on ${provider}, schedule no resume and run no \`braid pause\`: the board records the pause and sends your resume message. Reply \`Paused: ${braid}\` to <steering thread id> and end your turn.`;
}

/** A PM's: the braids it runs are paused by the board. */
export function pmPause(braids: string, provider: string, window: string, resume: string): string {
  return `Braids ${braids.split(",").join(", ")} are paused by the board for ${provider} ${window} until ${resume}; launch nothing on ${provider} until the board's resume message. Reply \`Paused: pm\` to <steering thread id> and end your turn.`;
}

export interface SteeringBrief {
  readonly provider: string;
  /** The window's label (`Session`) and usage, its threshold, and when work resumes (ISO). */
  readonly window: string;
  readonly usedPercent: number | null;
  readonly threshold: number | null;
  readonly resumeAt: string;
  readonly targets: readonly PauseTarget[];
  readonly now: Date;
}

/** The steering thread's first message, built here from a template (no skill: it runs in any project the board lists). */
export function steeringMessage(b: SteeringBrief): string {
  const resume = clock(b.resumeAt, b.now);
  const usage = b.usedPercent === null ? "" : ` at ${b.usedPercent}%${b.threshold === null ? "" : ` (threshold ${b.threshold}%)`}`;
  const rows = b.targets.map((t) => `- ${t.thread}  ${t.kind}  ${t.item}`).join("\n");
  const variants = [
    ["worker, reviewer and child", workerPause(b.provider, b.window, resume)],
    ["coordinator (fill in its braid number)", coordinatorPause("<number>", b.provider, b.window, resume)],
    ["pm (fill in its braids)", pmPause("<braids>", b.provider, b.window, resume)],
  ]
    .map(([who, text]) => `For a ${who ?? ""}:\n\n\`\`\`text\n${text ?? ""}\n\`\`\``)
    .join("\n\n");
  return `You are the board's 🚦 steering thread. ${b.provider} ${b.window} is${usage}; the board resumes the work at ${resume} (${b.resumeAt}). Pause the agents below on ${b.provider}, collect their replies, report one line and settle. Do nothing else: no code, no files, no messages to other threads.

Targets (thread id, kind, item):

${rows}

1. Find your own thread id: \`t3_thread_list\` returns it as \`currentThreadId\`. Use it for <steering thread id> below.
2. Children: call \`t3_thread_list\` with \`includeSubagents: true\`, \`allProjects: true\`, \`statuses: ["running"]\`. A thread whose \`parentThreadId\` is a target and whose \`providerInstanceId\` is ${b.provider} is a child target, of its parent's item.
3. Send each target and child its message with \`t3_thread_send\` \`mode: "auto"\` (never \`queue\`):

${variants}

4. Collect the replies; don't end your turn before every target and child answered or 10 minutes passed since your sends. Wait with \`t3_thread_wait\` on a target that hasn't answered (\`timeoutMs\`: what is left of the 10 minutes). Each reply arrives as a message to you and cuts that wait; the id in its \`Paused:\` line says whose it is. After each reply or timeout, wait again on the next one still silent. At the 10 minutes, read each silent one with \`t3_thread_read\` (last message, status) and count it as no answer.
5. Settle yourself: \`t3_thread_organize\` with \`action: "settle"\` and no \`threadId\`. Never archive yourself.
6. End your final message with exactly this line, last:

\`\`\`text
Steering: ${b.provider} paused <answered>/<targets and children>; children: <child thread id>:<item>,…; no answer: <item or thread id>,…
\`\`\`

Write \`none\` for an empty list. If a later message wakes you (a late \`Paused:\` reply), end that turn at once: no action, no new line.
`;
}

export interface SteeringResult {
  readonly provider: string;
  readonly answered: number;
  readonly total: number;
  readonly children: readonly { readonly thread: string; readonly item: string | null }[];
  readonly noAnswer: readonly string[];
}

const list = (text: string): string[] => (/^\s*none\s*$/i.test(text) ? [] : text.split(",").map((s) => s.trim().replace(/^`|`$/g, "")).filter((s) => s !== "" && !/^none$/i.test(s)));

/** The last `Steering: <provider> paused <n>/<m>; children: <ids>; no answer: <ids>` line of `text`; null when it has none. A child may carry its item (`<id>:<item>`). */
export function parseSteeringLine(text: string): SteeringResult | null {
  const all = [...text.matchAll(/^[`*\s]*Steering:\s*(\S+)\s+paused\s+(\d+)\s*\/\s*(\d+)\s*;\s*children:\s*(.*?)\s*;\s*no answer:\s*(.*?)[`*\s]*$/gm)];
  const m = all.at(-1);
  if (m === undefined) {
    return null;
  }
  const children = list(m[4] ?? "").map((c) => {
    const at = c.indexOf(":");
    // A T3 thread id may itself hold a colon (`mcp:launch:…`): only a last part that reads as an item id is the item.
    const item = at === -1 ? null : /^\d{4}(\/[A-Z])?$/.exec(c.slice(c.lastIndexOf(":") + 1))?.[0] ?? null;
    return { thread: item === null ? c : c.slice(0, c.lastIndexOf(":")), item };
  });
  return { provider: m[1] ?? "", answered: Number(m[2]), total: Number(m[3]), children, noAnswer: list(m[5] ?? "") };
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
const agents = (n: number): string => `${n} agent${n === 1 ? "" : "s"}`;

export type LimitEvent = "pausing" | "paused" | "failed" | "resumed" | "extended" | "weekly" | "nosteer";

/** The push of an event over the board's records of one pause (one provider), per mockup 6 of 0064/A. */
export function limitPush(event: LimitEvent, records: readonly Pause[], now: Date, extra: { readonly click?: string | null; readonly roles?: readonly string[]; readonly due?: string | null; readonly usage?: string | null } = {}): LimitPush | null {
  const first = records[0];
  if (first === undefined) {
    return null;
  }
  const provider = first.provider ?? "";
  const s: Steering | undefined = first.steering;
  const key = pauseKey(first);
  const braids = braidsOf(records);
  const resume = first.resumeAt === null ? "?" : clock(first.resumeAt, now);
  const window = `${first.label ?? first.window ?? ""}${first.usedPercent === null ? "" : ` ${first.usedPercent}%`}`;
  const click = extra.click ?? null;
  switch (event) {
    case "pausing":
      return { key: `${key}:pausing`, title: `${provider}: pausing`, body: `${window}. Pausing ${braids} (${agents(s?.total ?? records.reduce((n, r) => n + (r.targets?.length ?? 0), 0))}) until ${resume}.`, tags: ["double_vertical_bar"], priority: "default", click };
    case "paused": {
      const missing = s?.noAnswer ?? [];
      const total = s?.total ?? 0;
      if (missing.length > 0) {
        return { key: `${key}:paused`, title: `${provider} paused; ${agents(missing.length)} didn’t answer`, body: `${s?.answered ?? 0} of ${total} agents paused. ${missing.join(", ")} didn’t answer in 10 min: it may still be using ${provider}.`, tags: ["warning"], priority: "high", click };
      }
      return { key: `${key}:paused`, title: `${provider} paused until ${resume}`, body: `${braids}: ${s?.answered ?? total} of ${total} agents paused.\nResumes at ${resume} after a re-check.`, tags: ["double_vertical_bar"], priority: "low", click: null };
    }
    case "failed":
      return { key: `${key}:failed`, title: `${provider}: pause failed`, body: `The steering thread ${s?.reason ?? "failed"}. ${braids} may still be running on ${provider}.`, tags: ["x"], priority: "high", click };
    case "resumed": {
      const usage = extra.usage === null || extra.usage === undefined ? "" : `${extra.usage} after the reset. `;
      return extra.due === null || extra.due === undefined
        ? { key: `${key}:resumed`, title: `${provider} resumed`, body: `${usage}${braids} go${records.length === 1 ? "es" : ""} on.`, tags: ["arrow_forward"], priority: "default", click: null }
        : { key: `${key}:resumed`, title: `${provider} resumed (was due ${extra.due})`, body: `No board ran at ${extra.due}. Re-checked at start: ${usage}${braids} go${records.length === 1 ? "es" : ""} on.`, tags: ["arrow_forward"], priority: "default", click: null };
    }
    case "extended":
      return { key: `${key}:extended:${first.resetsAt ?? first.resumeAt ?? ""}`, title: `${provider} still over: resumes ${resume}`, body: `${window} at the resume time. ${braids} stay paused.`, tags: ["double_vertical_bar"], priority: "default", click: null };
    case "weekly":
      return {
        key: `${key}:weekly`,
        title: `${provider} weekly limit: needs you`,
        body: `${window} until ${first.resetsAt === null ? resume : clock(first.resetsAt, now)}. ${braids} paused.\nWait for the reset, or move ${(extra.roles ?? []).length === 0 ? "its roles" : (extra.roles ?? []).join(", ")} to another provider in BRAID.md models.`,
        tags: ["scales"],
        priority: "high",
        click,
      };
    case "nosteer":
      return { key: `${key}:nosteer`, title: `${provider} over, steering from it`, body: `Every steering provider is over its threshold; the 🚦 thread runs on ${provider} / ${s?.model ?? "?"} in the margin.`, tags: ["warning"], priority: "default", click };
  }
}

/** Whether a pause waits for a weekly window: by its window id (`seven_day…`) or its label. */
export const weeklyPause = (p: Pick<Pause, "window" | "label">): boolean => /seven_day|week/i.test(`${p.window ?? ""} ${p.label ?? ""}`);
