import { constants } from "node:fs";
import { lstat, mkdir, open, readFile, realpath, rename, rmdir } from "node:fs/promises";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { errnoCode, LedgerFailure } from "./errors.js";

const LOCK_RETRY_MS = 100;
const LOCK_BUDGET_MS = 5000;

export const STORAGE_DIRECTORY = ".braid";

export interface LedgerPaths {
  readonly dir: string;
  readonly state: string;
  readonly events: string;
  readonly temp: string;
  readonly lock: string;
}

export type PathKind = "absent" | "file" | "directory" | "link" | "other";

export interface LedgerIo {
  writeTempFile(tempPath: string, contents: string): Promise<void>;
  replaceTemp(tempPath: string, statePath: string): Promise<void>;
  appendEventLine(eventsPath: string, line: string): Promise<void>;
  createEmptyEvents(eventsPath: string): Promise<void>;
}

export function ledgerPaths(root: string): LedgerPaths {
  const dir = join(root, STORAGE_DIRECTORY);
  return {
    dir,
    state: join(dir, "state.json"),
    events: join(dir, "events.jsonl"),
    temp: join(dir, "state.json.tmp"),
    lock: join(dir, "lock"),
  };
}

/**
 * Node 26 reports a Windows directory junction as a symbolic link from lstat.
 * A link is not opened or followed.
 */
export async function pathKind(target: string): Promise<PathKind> {
  try {
    const stats = await lstat(target);
    if (stats.isSymbolicLink()) {
      return "link";
    }
    if (stats.isDirectory()) {
      return "directory";
    }
    if (stats.isFile()) {
      return "file";
    }
    return "other";
  } catch (error) {
    if (errnoCode(error) === "ENOENT") {
      return "absent";
    }
    throw error;
  }
}

export async function resolveRoot(rootArg: string | undefined, cwd: string): Promise<string> {
  const requested = rootArg ?? cwd;
  let listed;
  try {
    listed = await lstat(requested);
  } catch (error) {
    if (errnoCode(error) === "ENOENT") {
      throw new LedgerFailure(1, "error: root does not exist");
    }
    throw error;
  }
  if (!listed.isSymbolicLink() && !listed.isDirectory()) {
    throw new LedgerFailure(1, "error: root is not a directory");
  }
  let resolved: string;
  try {
    resolved = await realpath(requested);
  } catch (error) {
    if (errnoCode(error) === "ENOENT") {
      throw new LedgerFailure(1, "error: root does not exist");
    }
    if (errnoCode(error) === "ENOTDIR") {
      throw new LedgerFailure(1, "error: root is not a directory");
    }
    throw error;
  }
  const resolvedStat = await lstat(resolved);
  if (!resolvedStat.isDirectory() || resolvedStat.isSymbolicLink()) {
    throw new LedgerFailure(1, "error: root is not a directory");
  }
  return resolved;
}

export async function readRegularFile(filePath: string): Promise<Buffer> {
  const noFollow = constants.O_NOFOLLOW;
  if (typeof noFollow === "number" && noFollow !== 0) {
    const handle = await open(filePath, constants.O_RDONLY | noFollow);
    try {
      return await handle.readFile();
    } finally {
      await handle.close();
    }
  }
  return readFile(filePath);
}

/** The directory's existence is the lock. Schema 1 does not steal a stale lock. */
export async function acquireLock(lockPath: string): Promise<void> {
  const started = Date.now();
  for (;;) {
    try {
      await mkdir(lockPath);
      return;
    } catch (error) {
      const code = errnoCode(error);
      if (code !== "EEXIST") {
        if (code === "EACCES" || code === "EPERM" || code === "EROFS" || code === "ENOSPC") {
          throw new LedgerFailure(5, "error: cannot write state");
        }
        throw error;
      }
      if (Date.now() - started >= LOCK_BUDGET_MS) {
        throw new LedgerFailure(4, `error: state lock held at ${STORAGE_DIRECTORY}/lock`);
      }
      const remaining = LOCK_BUDGET_MS - (Date.now() - started);
      await delay(Math.min(LOCK_RETRY_MS, Math.max(1, remaining)));
    }
  }
}

export async function releaseLock(lockPath: string): Promise<void> {
  try {
    await rmdir(lockPath);
  } catch (error) {
    if (errnoCode(error) === "ENOENT") {
      return;
    }
    throw new LedgerFailure(5, "error: cannot write state");
  }
}

export function createDefaultLedgerIo(): LedgerIo {
  return {
    async writeTempFile(tempPath: string, contents: string): Promise<void> {
      const handle = await open(tempPath, "wx");
      try {
        await handle.writeFile(contents, "utf8");
        await handle.sync();
      } finally {
        await handle.close();
      }
    },
    async replaceTemp(tempPath: string, statePath: string): Promise<void> {
      // Rename the temp file directly over the live state file in the same directory.
      // Do not unlink or rename the live file away first.
      await rename(tempPath, statePath);
    },
    async appendEventLine(eventsPath: string, line: string): Promise<void> {
      const handle = await open(eventsPath, "a");
      try {
        await handle.writeFile(line, "utf8");
        await handle.sync();
      } finally {
        await handle.close();
      }
    },
    async createEmptyEvents(eventsPath: string): Promise<void> {
      const handle = await open(eventsPath, "wx");
      try {
        await handle.sync();
      } finally {
        await handle.close();
      }
    },
  };
}
