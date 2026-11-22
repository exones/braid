// Pauses: braids held back for a provider's usage limit, kept in `.braid/pauses.json` of the main checkout
// (found from any worktree), one record per braid. `braid pause` and `braid resume` write it, and the running board
// for provider limits (`by: board`, 0064: `claimPauses`, `patchPauses`, `clearPause`); the board and `braid status` read it. A missing file is no pauses; a damaged one also reads as no pauses, with a note.
import { readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { locked, mainCheckout } from "./requests.js";

export const PAUSERS = ["coordinator", "pm", "board"] as const;
export type Pauser = (typeof PAUSERS)[number];

export const REASONS = ["limit", "hold"] as const;
export type Reason = (typeof REASONS)[number];

/** A thread the board's pause reached: a coordinator, worker, reviewer or PM thread from the snapshot, or a child the steering thread found. */
export interface PauseTarget {
  readonly thread: string;
  readonly kind: "coordinator" | "worker" | "reviewer" | "pm" | "child";
  /** The item (`0064/C`) of a worker or reviewer, the braid of a coordinator, the braids (`0064,0065`) of a PM; a child's parent item. */
  readonly item: string;
  /** The project (T3's folder) the thread is in, for `t3 thread send`. */
  readonly project?: string;
}

/** What became of the board's 🚦 steering thread for a pause. */
export interface Steering {
  /** The steering thread; null until `t3 thread start` returned one (or when it failed). */
  readonly thread: string | null;
  readonly link: string | null;
  readonly provider: string;
  readonly model: string | null;
  /** When it was started (ISO). */
  readonly started: string;
  /** `pausing` until its `Steering:` line came; `paused` (every target answered), `partial` (some didn't) or `failed`. */
  readonly outcome: "pausing" | "paused" | "partial" | "failed";
  readonly answered: number | null;
  readonly total: number;
  readonly children: readonly string[];
  readonly noAnswer: readonly string[];
  /** Why it failed; null otherwise. */
  readonly reason: string | null;
  /** The steering ran on the provider it pauses: every steering line was over its threshold. */
  readonly self: boolean;
}

export interface Pause {
  /** The braid number: `0061`. */
  readonly braid: string;
  /** `limit`: a provider's usage window (0061); `hold`: the user's or the PM's deliberate pause. A record without it is a limit. */
  readonly reason?: Reason;
  /** A hold's words (the user's own); null or absent for a limit. */
  readonly words?: string | null;
  /** The provider instance (`Claude_Everix`), as `BRAID.md` `models` and T3's caches name it; null for a hold. */
  readonly provider: string | null;
  /** The window over its threshold (`five_hour`) and its label (`Session`); null when not known (`--until` without a reading). */
  readonly window: string | null;
  readonly label: string | null;
  /** The window's usage when paused, 0 to 100; null when not known. */
  readonly usedPercent: number | null;
  /** When the window resets (ISO); null when not known. */
  readonly resetsAt: string | null;
  /** When work resumes (ISO): the reset plus the buffer, or `--until`. */
  readonly resumeAt: string | null;
  /** The scheduled resume task's id (T3 `schedule_task`); null when none was given. */
  readonly task: string | null;
  /** The pausing thread: the coordinator's or the PM's, which the resume task wakes. */
  readonly thread: string;
  readonly by: Pauser;
  /** When it was paused (ISO). */
  readonly at: string;
  /** `by: board`: the threads it paused (resume sends to each, then to the steering thread's children). */
  readonly targets?: readonly PauseTarget[];
  /** `by: board`: the steering thread and its outcome. */
  readonly steering?: Steering;
  /** `by: board`: the threads already sent their resume message (a failed send is retried for the others only). */
  readonly resumed?: readonly string[];
}

export interface PausesRead {
  readonly pauses: readonly Pause[];
  /** Why the file was read as no pauses (or some records were left out); null when it read cleanly or is missing. */
  readonly note: string | null;
}

export function pausesFile(root: string): string {
  return join(mainCheckout(root), ".braid", "pauses.json");
}

/** A pause's reason; a record without one is a limit. */
export const reasonOf = (p: Pick<Pause, "reason">): Reason => p.reason ?? "limit";

const isIso = (v: unknown): v is string => typeof v === "string" && !Number.isNaN(Date.parse(v));
const strOrNull = (v: unknown): v is string | null => v === null || typeof v === "string";

function valid(v: unknown): v is Pause {
  if (typeof v !== "object" || v === null) {
    return false;
  }
  const p = v as Record<string, unknown>;
  return (
    typeof p.braid === "string" &&
    /^\d{4}$/.test(p.braid) &&
    (p.reason === undefined || (REASONS as readonly unknown[]).includes(p.reason)) &&
    (p.reason === "hold" ? p.provider === null && p.resumeAt === null && typeof p.words === "string" && p.words !== "" : typeof p.provider === "string" && p.provider !== "" && isIso(p.resumeAt)) &&
    strOrNull(p.window) &&
    strOrNull(p.label) &&
    (p.usedPercent === null || typeof p.usedPercent === "number") &&
    (p.resetsAt === null || isIso(p.resetsAt)) &&
    strOrNull(p.task) &&
    typeof p.thread === "string" &&
    (PAUSERS as readonly unknown[]).includes(p.by) &&
    isIso(p.at) &&
    (p.targets === undefined || (Array.isArray(p.targets) && p.targets.every((t: unknown) => typeof t === "object" && t !== null && typeof (t as PauseTarget).thread === "string" && typeof (t as PauseTarget).item === "string"))) &&
    (p.steering === undefined || (typeof p.steering === "object" && p.steering !== null && typeof (p.steering as Steering).outcome === "string" && isIso((p.steering as Steering).started)))
  );
}

/** Reads the file: missing is no pauses; unreadable JSON or not a list is no pauses with a note; bad records are left out with a note. */
export function readPausesFile(file: string): PausesRead {
  let text: string;
  try {
    text = readFileSync(file, "utf8");
  } catch (error) {
    return { pauses: [], note: (error as NodeJS.ErrnoException).code === "ENOENT" ? null : `${file} could not be read` };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    return { pauses: [], note: `${file} is not valid JSON (${(error as Error).message})` };
  }
  if (!Array.isArray(parsed)) {
    return { pauses: [], note: `${file} is not a list of pauses` };
  }
  const pauses = parsed.filter(valid);
  const bad = parsed.length - pauses.length;
  return { pauses, note: bad === 0 ? null : `${file}: ${bad} record${bad === 1 ? "" : "s"} not readable, left out` };
}

function writePauses(file: string, list: readonly Pause[]): void {
  const tmp = `${file}.${process.pid}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(list, null, 2)}\n`);
  renameSync(tmp, file);
}

export function loadPauses(root: string): PausesRead {
  return readPausesFile(pausesFile(root));
}

/** The same pause apart from when it was recorded. */
function same(a: Pause, b: Pause): boolean {
  return JSON.stringify({ ...a, at: "" }) === JSON.stringify({ ...b, at: "" });
}

/**
 * Records a braid's pause, replacing an earlier one of the same braid. `unchanged`: the same pause was already
 * recorded (the file is left alone). A damaged file is replaced by a list that holds only what could be read and this pause.
 */
export function setPause(root: string, pause: Pause): "recorded" | "updated" | "unchanged" {
  const file = pausesFile(root);
  return locked(
    file,
    () => {
      const list = readPausesFile(file).pauses;
      const old = list.find((p) => p.braid === pause.braid);
      if (old !== undefined && same(old, pause)) {
        return "unchanged";
      }
      writePauses(file, [...list.filter((p) => p.braid !== pause.braid), pause]);
      return old === undefined ? "recorded" : "updated";
    },
    "the pauses store",
  );
}

/**
 * The board's claim (0064): adds each record whose braid has none yet, in one `locked()` call, and returns those it added. A braid
 * with any record (a hold, another board's or a coordinator's pause) is left alone, so a second board or a later refresh adds nothing.
 */
export function claimPauses(root: string, records: readonly Pause[]): Pause[] {
  if (records.length === 0) {
    return [];
  }
  const file = pausesFile(root);
  return locked(
    file,
    () => {
      const list = readPausesFile(file).pauses;
      const added = records.filter((r) => !list.some((p) => p.braid === r.braid));
      if (added.length > 0) {
        writePauses(file, [...list, ...added]);
      }
      return added;
    },
    "the pauses store",
  );
}

/** Changes the board's records of these braids under the lock (`change` gets each and returns the new one); records of others, or not `by: board`, stay. Returns the new records. */
export function patchPauses(root: string, braids: readonly string[], change: (p: Pause) => Pause): Pause[] {
  const file = pausesFile(root);
  return locked(
    file,
    () => {
      const list = readPausesFile(file).pauses;
      const out: Pause[] = [];
      const next = list.map((p) => {
        if (p.by !== "board" || !braids.includes(p.braid)) {
          return p;
        }
        const n = change(p);
        out.push(n);
        return n;
      });
      if (out.length > 0) {
        writePauses(file, next);
      }
      return out;
    },
    "the pauses store",
  );
}

/**
 * Clears a braid's pause; returns the record cleared, or null when it wasn't paused (nothing is written). With `only`, a record
 * it rejects is left alone and null returned: the board and `braid resume --limit` clear a limit pause only, never a hold.
 */
export function clearPause(root: string, braid: string, only: (p: Pause) => boolean = () => true): Pause | null {
  const file = pausesFile(root);
  if (!readPausesFile(file).pauses.some((p) => p.braid === braid && only(p))) {
    return null;
  }
  return locked(
    file,
    () => {
      const list = readPausesFile(file).pauses;
      const found = list.find((p) => p.braid === braid) ?? null;
      const old = found !== null && only(found) ? found : null;
      if (old !== null) {
        writePauses(file, list.filter((p) => p.braid !== braid));
      }
      return old;
    },
    "the pauses store",
  );
}
