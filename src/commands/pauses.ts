// `braid pause <number>` and `braid resume <number>`: the coordinator (or the PM) records that a braid waits for a
// provider's usage window, and clears it. The store is src/braids/pauses.ts; the values come from `braid limits`.
import { join } from "node:path";
import { loadKnownBraids } from "../braids/branches.js";
import { LimitsError, readLimits, readModelLines, readProvider, t3Home, type ProviderReading } from "../braids/limits.js";
import { threadShort } from "../braids/logs.js";
import { clearPause, loadPauses, markResumed, PAUSERS, reasonOf, setPause, type Pause, type Pauser } from "../braids/pauses.js";
import { pauseView, statusLine } from "../board/pause.js";
import { resumePauses, type ResumeItem } from "../board/resume.js";
import { runT3, type T3Runner } from "../board/t3.js";
import { UsageError } from "./braids.js";
import { parse, str } from "./edit.js";

export interface PauseOptions {
  /** Runs `t3` (the resume sends of `--limit`); the real CLI unless given. */
  readonly t3?: T3Runner;
  /** T3's caches folder; defaults to `$T3CODE_HOME/caches`, else `~/.t3/caches`. */
  readonly caches?: string;
  readonly now?: Date;
}

const PAUSE_USAGE = "usage: braid pause <number> --provider <instanceId> --thread <id> [--window <id>] [--until <iso time>] [--task <scheduled task id>] [--by coordinator|pm|board]  (without --until, with --window too, refused unless braid limits says pause)\n   or: braid pause <number> --hold \"<words>\" --thread <id> [--by coordinator|pm]  (a deliberate hold: no provider, no resume time)";
const RESUME_USAGE = "usage: braid resume <number> [--limit]  (--limit resumes a limit pause only, never a hold: the board's record is cleared and each paused agent gets its resume text)\n   or: braid resume --limit --all  (every board pause of the repository; a PM-run braid's PM is asked)";

/** The braid number of `0061` or `61`, checked against the braids `braid view` finds (this checkout's and those that live only on their branch). */
function braidOf(root: string, raw: string | undefined, usage: string): string {
  const m = raw === undefined ? null : /^(\d{1,4})$/.exec(raw);
  if (m === null) {
    throw new UsageError(`${usage}  (a braid number like 0061, not a strand: a pause holds the whole braid)`);
  }
  const number = (m[1] ?? "").padStart(4, "0");
  if (!loadKnownBraids(root, number).some((b) => b.number === number)) {
    throw new UsageError(`no braid ${number}`);
  }
  return number;
}

function reading(root: string, provider: string, options: PauseOptions, now: Date): ProviderReading {
  try {
    const lines = readModelLines(root).filter((l) => l.instanceId === provider);
    if (lines.length === 0) {
      throw new UsageError(`BRAID.md models names no provider ${provider}`);
    }
    return readProvider(options.caches ?? join(t3Home(), "caches"), provider, lines, readLimits(root), now);
  } catch (error) {
    if (error instanceof LimitsError) {
      throw new UsageError(error.message);
    }
    throw error;
  }
}

/**
 * `braid pause`: without `--until`, the window and the resume time come from `braid limits` for the provider, and it is refused
 * unless the verdict is `pause`. `--window` only picks the window (its reset plus the buffer) and lifts no refusal; only
 * `--until` sets the resume time and pauses whatever the verdict. Pausing again with the same values changes nothing; other values replace the record.
 */
export function pauseCommand(root: string, args: readonly string[], options: PauseOptions = {}): string {
  const { positionals, values } = parse("braid pause", args, {
    provider: { type: "string" },
    window: { type: "string" },
    until: { type: "string" },
    task: { type: "string" },
    thread: { type: "string" },
    by: { type: "string" },
    hold: { type: "string" },
  });
  const provider = str(values, "provider");
  const thread = str(values, "thread");
  const hold = str(values, "hold");
  if (hold !== undefined && (provider !== undefined || str(values, "window") !== undefined || str(values, "until") !== undefined || str(values, "task") !== undefined)) {
    throw new UsageError("--hold takes no --provider, --window, --until or --task: a hold has no provider and no resume time");
  }
  if (positionals.length !== 1 || (provider === undefined && hold === undefined) || thread === undefined) {
    throw new UsageError(PAUSE_USAGE);
  }
  if (threadShort(thread) === null) {
    throw new UsageError(`--thread needs an id with at least 8 letters or digits; got: ${thread}`);
  }
  const by = (str(values, "by") ?? "coordinator") as Pauser;
  if (!PAUSERS.includes(by)) {
    throw new UsageError(`--by is ${PAUSERS.join(", ")}; got: ${by}`);
  }
  const words = hold?.replace(/\s+/g, " ").trim();
  if (words === "") {
    throw new UsageError("--hold needs the words of the hold");
  }
  const until = str(values, "until");
  if (until !== undefined && Number.isNaN(Date.parse(until))) {
    throw new UsageError(`--until needs an ISO time such as 2026-11-21T21:05:00Z; got: ${until}`);
  }
  const braid = braidOf(root, positionals[0], PAUSE_USAGE);
  const now = options.now ?? new Date();
  if (words !== undefined) {
    const held: Pause = { braid, reason: "hold", words, provider: null, window: null, label: null, usedPercent: null, resetsAt: null, resumeAt: null, task: null, thread, by, at: now.toISOString() };
    const done = setPause(root, held);
    const line = statusLine(pauseView(held, now), now);
    return done === "unchanged" ? `${braid} already held, unchanged: ${line}
` : `${braid} ${done === "recorded" ? "held" : "hold updated"}: ${line}
`;
  }
  if (provider === undefined) {
    throw new UsageError(PAUSE_USAGE);
  }
  // A hold outlives a limit: a braid has one record, so a limit pause would replace the hold and its resume would end it.
  const held = loadPauses(root).pauses.find((p) => p.braid === braid && reasonOf(p) === "hold");
  if (held !== undefined) {
    throw new UsageError(`${braid} not paused: it is held (“${held.words ?? ""}”), and a hold outlives a limit pause; its agents are already stopped. braid resume ${braid} lifts the hold.`);
  }
  const r = reading(root, provider, options, now);
  const windowId = str(values, "window") ?? r.pauseWindow;
  const window = windowId === null ? undefined : r.windows.find((w) => w.id === windowId);
  if (until === undefined) {
    if (r.verdict !== "pause") {
      throw new UsageError(`${braid} not paused: braid limits says ${r.verdict} for ${provider}${r.reason === null ? "" : ` (${r.reason})`}; give --until <time> to pause anyway`);
    }
    if (window === undefined) {
      throw new UsageError(`${braid} not paused: ${provider} has no window ${windowId ?? ""} (windows: ${r.windows.map((w) => w.id).join(", ")})`);
    }
  }
  const limits = readLimits(root);
  const resumeAt =
    until !== undefined
      ? new Date(until).toISOString()
      : str(values, "window") === undefined
        ? (r.resumeAt ?? "")
        : window?.resetsAt == null
          ? (r.resumeAt ?? "")
          : new Date(Date.parse(window.resetsAt) + limits.buffer * 60_000).toISOString();
  const pause: Pause = {
    braid,
    provider,
    window: window?.id ?? windowId ?? null,
    label: window?.label ?? null,
    usedPercent: window?.usedPercent ?? null,
    resetsAt: window?.resetsAt ?? null,
    resumeAt,
    task: str(values, "task") ?? null,
    thread,
    by,
    at: now.toISOString(),
  };
  const done = setPause(root, pause);
  const line = statusLine(pauseView(pause, now), now);
  return done === "unchanged" ? `${braid} already paused, unchanged: ${line}\n` : `${braid} ${done === "recorded" ? "paused" : "pause updated"}: ${line}\n`;
}

/** `braid resume`: clears the braid's pause and prints what it cleared; a braid that isn't paused is left as it is. */
/**
 * `braid resume <number> --limit` and `braid resume --limit --all` (0074/D): the board's one resume path. One braid: its limit record
 * is resumed directly (each paused agent gets its resume text by code, then the record is cleared; the PM runs this for a braid it
 * runs). `--all`: every board pause of the repository, a PM-run braid by one message to its PM. A send that fails stays pending on
 * the record and the acting board retries it at each refresh. A hold is never touched.
 */
export async function resumeLimitCommand(root: string, args: readonly string[], options: PauseOptions = {}): Promise<string> {
  const { positionals, values } = parse("braid resume", args, { limit: { type: "boolean" }, all: { type: "boolean" } });
  const all = values["all"] === true;
  if (values["limit"] !== true || (all ? positionals.length !== 0 : positionals.length !== 1)) {
    throw new UsageError(RESUME_USAGE);
  }
  const now = options.now ?? new Date();
  const records = loadPauses(root).pauses;
  let items: ResumeItem[];
  if (all) {
    items = records.filter((p) => p.by === "board" && reasonOf(p) === "limit").map((pause) => ({ root, pause }));
    if (items.length === 0) {
      return "no board pause to resume\n";
    }
  } else {
    const braid = braidOf(root, positionals[0], RESUME_USAGE);
    const record = records.find((p) => p.braid === braid);
    if (record === undefined) {
      return `${braid} was not paused; nothing changed\n`;
    }
    if (reasonOf(record) === "hold") {
      return `${braid} is held, not paused for a limit; --limit leaves the hold (braid resume ${braid} lifts it)\n`;
    }
    items = [{ root, pause: record }];
  }
  // Like Resume now: no new pause of these providers until a reading checked after now.
  markResumed(root, [...new Set(items.flatMap((i) => (i.pause.provider === null ? [] : [i.pause.provider])))], now);
  const out = await resumePauses(items, { t3: options.t3 ?? runT3, now, why: "cli", ...(all ? {} : { direct: true }) });
  const lines: string[] = [];
  for (const c of out.cleared) {
    const p = c.pause;
    const to = out.sent.get(p.braid) ?? [];
    const task = p.task === null ? "" : `; if scheduled task ${p.task} is still set, delete it (delete_scheduled_task) so it doesn't wake ${p.thread.slice(0, 8)} later`;
    lines.push(`${p.braid} resumed: ${to.length === 0 ? "" : `sent the resume text to ${to.join(", ")}; `}cleared ${statusLine(pauseView(p, now), now)}${task}`);
  }
  for (const a of out.asked) {
    lines.push(`${a.pause.braid}: asked ${a.pause.by === "board" ? "the PM" : `the ${a.pause.by} ${a.pause.thread.slice(0, 8)}`} to resume it`);
  }
  for (const n of out.pending) {
    const p = loadPauses(root).pauses.find((x) => x.braid === n.pause.braid) ?? n.pause;
    const agents = (p.targets ?? []).filter((t) => t.kind !== "pm");
    const reached = p.resuming?.direct === true ? ` (${agents.filter((t) => (p.resumed ?? []).includes(t.thread)).length} of ${agents.length} sent)` : "";
    lines.push(`${p.braid}: resume pending: T3 unreachable${reached}${p.resuming?.error == null ? "" : `: ${p.resuming.error}`}. The board retries at each refresh.`);
  }
  const held = all ? records.filter((p) => reasonOf(p) === "hold").map((p) => `${p.braid}: held, left alone`) : [];
  return `${[...lines, ...held].join("\n")}\n`;
}

export function resumeCommand(root: string, args: readonly string[], options: PauseOptions = {}): string {
  const { positionals, values } = parse("braid resume", args, { limit: { type: "boolean" } });
  if (positionals.length !== 1) {
    throw new UsageError(RESUME_USAGE);
  }
  const braid = braidOf(root, positionals[0], RESUME_USAGE);
  const limitOnly = values["limit"] === true;
  const cleared = clearPause(root, braid, limitOnly ? (p) => reasonOf(p) === "limit" : undefined);
  if (cleared === null && limitOnly && loadPauses(root).pauses.some((p) => p.braid === braid)) {
    return `${braid} is held, not paused for a limit; --limit leaves the hold (braid resume ${braid} lifts it)\n`;
  }
  if (cleared === null) {
    return `${braid} was not paused; nothing changed\n`;
  }
  const now = options.now ?? new Date();
  if (cleared.reason === "hold") {
    return `${braid} resumed: cleared ${statusLine(pauseView(cleared, now), now)}
`;
  }
  const task = cleared.task === null ? "" : `; if scheduled task ${cleared.task} is still set, delete it (delete_scheduled_task) so it doesn't wake ${cleared.thread.slice(0, 8)} later`;
  return `${braid} resumed: cleared ${statusLine(pauseView(cleared, now), now)}${task}\n`;
}
