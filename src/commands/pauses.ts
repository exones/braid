// `braid pause <number>` and `braid resume <number>`: the coordinator (or the PM) records that a braid waits for a
// provider's usage window, and clears it. The store is src/braids/pauses.ts; the values come from `braid limits`.
import { join } from "node:path";
import { loadKnownBraids } from "../braids/branches.js";
import { LimitsError, readLimits, readModelLines, readProvider, t3Home, type ProviderReading } from "../braids/limits.js";
import { threadShort } from "../braids/logs.js";
import { clearPause, PAUSERS, setPause, type Pause, type Pauser } from "../braids/pauses.js";
import { pauseView, statusLine } from "../board/pause.js";
import { UsageError } from "./braids.js";
import { parse, str } from "./edit.js";

export interface PauseOptions {
  /** T3's caches folder; defaults to `$T3CODE_HOME/caches`, else `~/.t3/caches`. */
  readonly caches?: string;
  readonly now?: Date;
}

const PAUSE_USAGE = "usage: braid pause <number> --provider <instanceId> --thread <id> [--window <id>] [--until <iso time>] [--task <scheduled task id>] [--by coordinator|pm]";
const RESUME_USAGE = "usage: braid resume <number>";

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
 * unless the verdict is `pause`. `--window` picks the window (its reset plus the buffer); `--until` sets the resume time
 * and pauses whatever the verdict. Pausing again with the same values changes nothing; other values replace the record.
 */
export function pauseCommand(root: string, args: readonly string[], options: PauseOptions = {}): string {
  const { positionals, values } = parse("braid pause", args, {
    provider: { type: "string" },
    window: { type: "string" },
    until: { type: "string" },
    task: { type: "string" },
    thread: { type: "string" },
    by: { type: "string" },
  });
  const provider = str(values, "provider");
  const thread = str(values, "thread");
  if (positionals.length !== 1 || provider === undefined || thread === undefined) {
    throw new UsageError(PAUSE_USAGE);
  }
  if (threadShort(thread) === null) {
    throw new UsageError(`--thread needs an id with at least 8 letters or digits; got: ${thread}`);
  }
  const by = (str(values, "by") ?? "coordinator") as Pauser;
  if (!PAUSERS.includes(by)) {
    throw new UsageError(`--by is coordinator or pm; got: ${by}`);
  }
  const until = str(values, "until");
  if (until !== undefined && Number.isNaN(Date.parse(until))) {
    throw new UsageError(`--until needs an ISO time such as 2026-11-21T21:05:00Z; got: ${until}`);
  }
  const braid = braidOf(root, positionals[0], PAUSE_USAGE);
  const now = options.now ?? new Date();
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
        : new Date(Date.parse(window?.resetsAt ?? "") + limits.buffer * 60_000).toISOString();
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
export function resumeCommand(root: string, args: readonly string[], options: PauseOptions = {}): string {
  const { positionals } = parse("braid resume", args, {});
  if (positionals.length !== 1) {
    throw new UsageError(RESUME_USAGE);
  }
  const braid = braidOf(root, positionals[0], RESUME_USAGE);
  const cleared = clearPause(root, braid);
  if (cleared === null) {
    return `${braid} was not paused; nothing changed\n`;
  }
  const now = options.now ?? new Date();
  const task = cleared.task === null ? "" : `; if scheduled task ${cleared.task} is still set, delete it (delete_scheduled_task) so it doesn't wake ${cleared.thread.slice(0, 8)} later`;
  return `${braid} resumed: cleared ${statusLine(pauseView(cleared, now), now)}${task}\n`;
}
