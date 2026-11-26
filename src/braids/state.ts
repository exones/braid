// braid's local state in the main checkout's `.braid/` (found from any worktree), and the lock its writers take turns with.
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";

/** The main checkout's folder, also from inside a worktree. */
export function mainCheckout(root: string): string {
  const r = spawnSync("git", ["rev-parse", "--git-common-dir"], { cwd: root, encoding: "utf8" });
  if (r.status !== 0) {
    throw new Error(`can't read the repository: ${(r.stderr || "").trim()}`);
  }
  const dir = resolve(root, r.stdout.trim());
  return basename(dir) === ".git" ? dirname(dir) : dir;
}

/** The folder of braid's local state in the main checkout, created with a `.gitignore` of its own so it never shows as untracked, whether or not the project ignores it. */
export function ensureStateDir(dir: string): void {
  mkdirSync(dir, { recursive: true });
  const ignore = join(dir, ".gitignore");
  if (!existsSync(ignore)) {
    writeFileSync(ignore, "*\n");
  }
}

/** Waiting for a lock gave up. */
export class LockError extends Error {}

const LOCK_STALE_MS = 30_000;
const LOCK_WAIT_MS = 10_000;

/** How `locked` tells the time and lets it pass between two tries; a test hands the lock over from `pause`, so no timing decides it. */
export interface LockClock {
  now(): number;
  pause(): void;
}

const LOCK_CLOCK: LockClock = {
  now: () => Date.now(),
  pause: () => void Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 20),
};

/**
 * Removes the lock when it is older than `staleMs`, for one waiter at a time: the check and the removal
 * happen under a short guard file, so a second waiter that also found the lock stale looks again and
 * leaves the first one's new lock alone. Returns whether this call removed it.
 */
export function takeOverStale(lock: string, staleMs: number = LOCK_STALE_MS): boolean {
  const guard = `${lock}.takeover`;
  try {
    closeSync(openSync(guard, "wx"));
  } catch {
    try {
      // a guard left by a process that died mid-takeover
      if (Date.now() - statSync(guard).mtimeMs > staleMs) {
        unlinkSync(guard);
      }
    } catch {
      // gone already
    }
    return false;
  }
  try {
    if (Date.now() - statSync(lock).mtimeMs > staleMs) {
      unlinkSync(lock);
      return true;
    }
  } catch {
    // the holder just released it
  } finally {
    try {
      unlinkSync(guard);
    } catch {
      // nothing to release
    }
  }
  return false;
}

/**
 * Names this lock file instance (the token its holder wrote, its inode, creation and change time), or "" when it is gone: another
 * holder's lock has a different one. The token matters where a new lock can reuse the inode within one tick of the file clock.
 */
function lockIdentity(lock: string): string {
  try {
    const st = statSync(lock, { bigint: true });
    return `${st.ino}:${st.birthtimeNs}:${st.mtimeNs}:${readFileSync(lock, "utf8")}`;
  } catch {
    return "";
  }
}

/**
 * Runs `fn` holding the lock of `file`: a lock file made exclusively next to it. A lock older than 30 s is taken over by one waiter; waiting gives up when the lock has not changed hands for `waitMs` (10 s). Never call GitHub inside `fn`.
 * `makeDir` prepares the file's folder (default: a repository's `.braid/`, ignored by Git).
 */
export function locked<T>(file: string, fn: () => T, what = "the requests store", makeDir: (dir: string) => void = ensureStateDir, waitMs: number = LOCK_WAIT_MS, clock: LockClock = LOCK_CLOCK): T {
  makeDir(dirname(file));
  const lock = `${file}.lock`;
  let give = clock.now() + waitMs;
  let seen = "";
  for (;;) {
    try {
      writeFileSync(lock, randomUUID(), { flag: "wx" });
      break;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST" && (error as NodeJS.ErrnoException).code !== "EPERM") {
        throw error;
      }
      if (takeOverStale(lock)) {
        continue;
      }
      // The wait runs out when the lock has not changed hands for `waitMs`: a queue of writers that each make progress is not a stuck lock.
      const now = lockIdentity(lock);
      if (now !== "" && now !== seen) {
        seen = now;
        give = clock.now() + waitMs;
      }
      if (clock.now() > give) {
        throw new LockError(`${what} is locked (${lock}); remove it if no braid command is running`);
      }
      clock.pause();
    }
  }
  try {
    return fn();
  } finally {
    try {
      unlinkSync(lock);
    } catch {
      // already taken over as stale
    }
  }
}
