// Pauses: braids held back for a provider's usage limit, kept in `.braid/pauses.json` of the main checkout
// (found from any worktree), one record per braid. Only `braid pause` and `braid resume` write it; the board
// and `braid status` read it. A missing file is no pauses; a damaged one also reads as no pauses, with a note.
import { readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { locked, mainCheckout } from "./requests.js";

export const PAUSERS = ["coordinator", "pm"] as const;
export type Pauser = (typeof PAUSERS)[number];

export const REASONS = ["limit", "hold"] as const;
export type Reason = (typeof REASONS)[number];

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
    isIso(p.at)
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

/** Clears a braid's pause; returns the record cleared, or null when it wasn't paused (nothing is written). */
export function clearPause(root: string, braid: string): Pause | null {
  const file = pausesFile(root);
  if (!readPausesFile(file).pauses.some((p) => p.braid === braid)) {
    return null;
  }
  return locked(
    file,
    () => {
      const list = readPausesFile(file).pauses;
      const old = list.find((p) => p.braid === braid) ?? null;
      if (old !== null) {
        writePauses(file, list.filter((p) => p.braid !== braid));
      }
      return old;
    },
    "the pauses store",
  );
}
