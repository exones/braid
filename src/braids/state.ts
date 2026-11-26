// braid's local state in the main checkout's `.braid/` (found from any worktree), and the lock its writers take turns with.
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { Worker } from "node:worker_threads";

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
/** How often a holder touches its lock: well inside the stale time, so a live holder's lock never looks stale. */
const LOCK_REFRESH_MS = LOCK_STALE_MS / 6;

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
 * Names this lock file instance (the token its holder wrote, its inode and creation time), or "" when it is gone: another
 * holder's lock has a different one. The token matters where a new lock can reuse the inode within one tick of the file clock.
 * Not the change time: the holder's refresh changes it, and a refreshed lock has not changed hands.
 */
function lockIdentity(lock: string): string {
  try {
    const st = statSync(lock, { bigint: true });
    return `${st.ino}:${st.birthtimeNs}:${readFileSync(lock, "utf8")}`;
  } catch {
    return "";
  }
}

// The refresher's state, shared with its worker: running, stopping (set by the holder), touching (set by the worker while it touches).
const RUNNING = 0;
const STOPPING = 1;
const TOUCHING = 2;

// Runs in a worker thread, so it keeps running while the holder's thread is blocked in a synchronous git call; it dies with its process,
// so a killed holder stops refreshing. It touches the lock only while it still holds the holder's token.
const REFRESHER = `
const { workerData } = require("node:worker_threads");
const { readFileSync, utimesSync } = require("node:fs");
const state = new Int32Array(workerData.state);
for (;;) {
  Atomics.wait(state, 0, ${RUNNING}, workerData.everyMs);
  if (Atomics.compareExchange(state, 0, ${RUNNING}, ${TOUCHING}) !== ${RUNNING}) break;
  try {
    if (readFileSync(workerData.lock, "utf8") === workerData.token) {
      const now = new Date();
      utimesSync(workerData.lock, now, now);
    }
  } catch {}
  Atomics.store(state, 0, ${RUNNING});
  Atomics.notify(state, 0);
}
`;

/** Starts touching `lock` every `everyMs` while it holds `token`; the returned function stops it, and no touch happens after it returns. */
function refresh(lock: string, token: string, everyMs: number): () => void {
  const state = new Int32Array(new SharedArrayBuffer(4));
  const worker = new Worker(REFRESHER, { eval: true, workerData: { lock, token, everyMs, state: state.buffer } });
  worker.unref();
  return () => {
    // Waits out a touch under way, then tells the worker to stop.
    while (Atomics.compareExchange(state, 0, RUNNING, STOPPING) === TOUCHING) {
      Atomics.wait(state, 0, TOUCHING, 1_000);
    }
    Atomics.notify(state, 0);
    void worker.terminate();
  };
}

/** The locks this process holds, with the token each was made with. */
const held = new Map<string, string>();

/** Throws when a lock this process holds was taken over (its token is gone), so a holder that lost its lock doesn't write beside the new holder. */
export function checkHeld(): void {
  for (const [lock, token] of held) {
    let now = "";
    try {
      now = readFileSync(lock, "utf8");
    } catch {
      // gone: taken over and not re-created yet
    }
    if (now !== token) {
      throw new LockError(`lost the lock ${lock}: another writer took it over as stale; nothing was written`);
    }
  }
}

/**
 * Runs `fn` holding the lock of `file`: a lock file made exclusively next to it, with a token of its own. While `fn` runs, a worker thread
 * touches the lock every 5 s (`refreshMs`), so a live holder never looks stale however long it takes; a lock not touched for 30 s (its holder
 * died) is taken over by one waiter. Waiting gives up when the lock has not changed hands for `waitMs` (10 s). Release deletes the lock only
 * while it still holds our token. Never call GitHub inside `fn`; call `checkHeld` before writing what the lock guards.
 * `makeDir` prepares the file's folder (default: a repository's `.braid/`, ignored by Git).
 */
export function locked<T>(
  file: string,
  fn: () => T,
  what = "the requests store",
  makeDir: (dir: string) => void = ensureStateDir,
  waitMs: number = LOCK_WAIT_MS,
  clock: LockClock = LOCK_CLOCK,
  refreshMs: number = LOCK_REFRESH_MS,
): T {
  makeDir(dirname(file));
  const lock = `${file}.lock`;
  const token = randomUUID();
  let give = clock.now() + waitMs;
  let seen = "";
  for (;;) {
    try {
      writeFileSync(lock, token, { flag: "wx" });
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
  let stop = () => {};
  held.set(lock, token);
  try {
    stop = refresh(lock, token, refreshMs);
    return fn();
  } finally {
    stop();
    held.delete(lock);
    try {
      // Only our own lock: one taken over as stale and made again by another writer stays.
      if (readFileSync(lock, "utf8") === token) {
        unlinkSync(lock);
      }
    } catch {
      // already taken over as stale
    }
  }
}
