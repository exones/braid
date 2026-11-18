// Requests: what the coordinator needs from the user, kept in one local file under `.braid/` of the
// main checkout (found from any worktree). Only braid commands write it; it is never committed.
import { spawnSync } from "node:child_process";
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, renameSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";

export const KINDS = ["review", "question", "decision", "plan"] as const;
export type Kind = (typeof KINDS)[number];

export interface Request {
  /** The item: `0015` or `0015/C`. */
  readonly id: string;
  readonly kind: Kind;
  /** One line: what is needed from the user. */
  readonly text: string;
  /** The stop case the request comes from (`ask --key`), when given. */
  readonly key?: string;
  /** When it was opened, ISO. */
  readonly at: string;
  /** The asking thread (its id), when given. */
  readonly thread: string | null;
  /** A review request: the PR and the head commit handed over. */
  readonly pr?: number;
  readonly head?: string;
}

/** What `gh pr view --json state,headRefOid` says of a PR; `headRefOid` is the full commit sha, as stored in a review request's `head`. null: GitHub couldn't be read. */
export type PrNow = { readonly state: string; readonly headRefOid: string } | null;

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

/** The store file; the one place that asks Git where the main checkout is. */
export function requestsFile(root: string): string {
  return join(mainCheckout(root), ".braid", "requests.json");
}

function readFile(file: string): Request[] {
  try {
    const parsed: unknown = JSON.parse(readFileSync(file, "utf8"));
    return Array.isArray(parsed) ? (parsed as Request[]) : [];
  } catch {
    return [];
  }
}

/** Writes the whole list to a temporary file next to the store, then renames it over the store. */
function writeFile(file: string, list: readonly Request[]): void {
  const tmp = `${file}.${process.pid}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(list, null, 2)}\n`);
  renameSync(tmp, file);
}

/** Waiting for a lock gave up. */
export class LockError extends Error {}

const LOCK_STALE_MS = 30_000;
const LOCK_WAIT_MS = 10_000;

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

/** Runs `fn` holding the lock of `file`: a lock file made exclusively next to it. A lock older than 30 s is taken over by one waiter; waiting gives up after 10 s. Never call GitHub inside `fn`. */
export function locked<T>(file: string, fn: () => T, what = "the requests store"): T {
  ensureStateDir(dirname(file));
  const lock = `${file}.lock`;
  const give = Date.now() + LOCK_WAIT_MS;
  for (;;) {
    try {
      closeSync(openSync(lock, "wx"));
      break;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST" && (error as NodeJS.ErrnoException).code !== "EPERM") {
        throw error;
      }
      if (takeOverStale(lock)) {
        continue;
      }
      if (Date.now() > give) {
        throw new LockError(`${what} is locked (${lock}); remove it if no braid command is running`);
      }
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 20);
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

/** A short locked read-modify-write of the store; `change` returning null leaves the file alone. */
function update(file: string, change: (list: Request[]) => Request[] | null): void {
  locked(file, () => {
    const next = change(readFile(file));
    if (next !== null) {
      writeFile(file, next);
    }
  });
}

export function loadRequests(root: string): Request[] {
  return readFile(requestsFile(root));
}

/** Opens a request; an earlier one on the same item is replaced. */
export function openRequest(root: string, request: Request): void {
  update(requestsFile(root), (list) => [...list.filter((r) => r.id !== request.id), request]);
}

/** Closes the item's request; true when there was one. */
export function closeRequest(root: string, id: string): boolean {
  const file = requestsFile(root);
  // Nothing to close: no lock, no write (start and done call this on every item).
  if (!readFile(file).some((r) => r.id === id)) {
    return false;
  }
  let found = false;
  update(file, (list) => {
    found = list.some((r) => r.id === id);
    return found ? list.filter((r) => r.id !== id) : null;
  });
  return found;
}

/** A review request is void when its PR is no longer open (in any letter case) or is at another head (the full sha). A PR that can't be read (null) leaves it. */
export function voided(request: Request, pr: PrNow): boolean {
  return request.kind === "review" && pr !== null && (pr.state.toUpperCase() !== "OPEN" || (request.head !== undefined && pr.headRefOid !== request.head));
}

/** The requests still open, given what each review request's PR is now. Pure: it writes nothing, so a board can derive lanes from it. */
export function filterLive(requests: readonly Request[], prOf: (number: number) => PrNow): Request[] {
  return requests.filter((r) => !(r.pr !== undefined && voided(r, prOf(r.pr))));
}

/**
 * The open requests, with the void review requests dropped from the store. GitHub is asked without the lock;
 * then, under it, the file is read again and only the requests that were found void (same item and time) go.
 */
export function liveRequests(root: string, prOf: (number: number) => PrNow): Request[] {
  const file = requestsFile(root);
  const seen = readFile(file);
  const live = filterLive(seen, prOf);
  if (live.length === seen.length) {
    return live;
  }
  const dropped = seen.filter((r) => !live.includes(r));
  let now: Request[] = [];
  update(file, (list) => {
    now = list.filter((r) => !dropped.some((d) => d.id === r.id && d.at === r.at));
    return now;
  });
  return now;
}

/** `5m`, `2h`, `3d`: the age of a request. */
export function age(at: string, now: Date): string {
  const min = Math.max(0, Math.floor((now.getTime() - new Date(at).getTime()) / 60_000));
  return min < 60 ? `${min}m` : min < 2880 ? `${Math.floor(min / 60)}h` : `${Math.floor(min / 1440)}d`;
}
