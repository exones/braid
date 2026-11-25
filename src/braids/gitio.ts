// Asynchronous Git for the board's reads: the server keeps answering requests while `git` runs. The
// synchronous readers stay for the CLI commands.
import { execFile, spawn, spawnSync, type SpawnSyncReturns } from "node:child_process";

export interface GitOut {
  readonly status: number | null;
  readonly stdout: string;
  readonly stderr: string;
}

/** Told of every `git` process started here (its arguments), for tests. */
let spy: ((args: readonly string[], sync?: boolean) => void) | undefined;

/** Sets or clears the observer of the processes started here, for tests. */
export function spyOnGit(observer: ((args: readonly string[], sync?: boolean) => void) | undefined): void {
  spy = observer;
}

/** Held before every asynchronous `git` process starts, for tests: a slow git without a slow machine. */
let before: ((args: readonly string[]) => Promise<void> | void) | undefined;

/** Sets or clears the test hook awaited before each asynchronous `git` process starts. */
export function delayGit(hook: ((args: readonly string[]) => Promise<void> | void) | undefined): void {
  before = hook;
}

/** Tells the observer a synchronous `git` process starts (the synchronous readers call this), for tests. */
export function noteSyncGit(args: readonly string[]): void {
  spy?.(args, true);
}

/** Options of `gitSync`; the rest (`core.quotePath=false`, `windowsHide`, UTF-8 text) is the same for every caller. */
export interface GitSyncOptions {
  readonly input?: string;
  readonly env?: NodeJS.ProcessEnv;
  readonly timeout?: number;
  readonly maxBuffer?: number;
}

/** The one synchronous `git` runner: runs `git` in `root`, reports it to `spyOnGit`, never throws (a failed start is `status` null). */
export function gitSync(root: string, args: readonly string[], options: GitSyncOptions = {}): SpawnSyncReturns<string> {
  noteSyncGit(args);
  return spawnSync("git", ["-c", "core.quotePath=false", ...args], {
    cwd: root,
    encoding: "utf8",
    windowsHide: true,
    ...(options.maxBuffer === undefined ? {} : { maxBuffer: options.maxBuffer }),
    ...(options.timeout === undefined ? {} : { timeout: options.timeout }),
    ...(options.input === undefined ? {} : { input: options.input }),
    ...(options.env === undefined ? {} : { env: { ...process.env, ...options.env } }),
  });
}

/** How long `git cat-file --batch` may run before it is killed. */
export const BATCH_TIMEOUT_MS = 60_000;

/** Runs `git` in `root` without blocking; never rejects. `input` goes to its standard input. */
export function gitAsync(root: string, args: readonly string[], env?: NodeJS.ProcessEnv, input?: string): Promise<GitOut> {
  spy?.(args);
  return Promise.resolve(before?.(args)).then(
    () =>
      new Promise((done) => {
        const child = execFile(
          "git",
          ["-c", "core.quotePath=false", ...args],
          { cwd: root, encoding: "utf8", maxBuffer: 256 * 1024 * 1024, timeout: 60_000, windowsHide: true, ...(env === undefined ? {} : { env: { ...process.env, ...env } }) },
          (error, stdout, stderr) => {
            const code = error === null ? 0 : typeof (error as { code?: unknown }).code === "number" ? (error as { code: number }).code : null;
            done({ status: code, stdout, stderr });
          },
        );
        if (input !== undefined) {
          child.stdin?.on("error", () => {});
          child.stdin?.end(input);
        }
      }),
  );
}

/**
 * The texts of these objects (`<commit>:<path>` or a blob id), read through one `git cat-file --batch`
 * process; null for one that is missing or when git can't start. After `timeoutMs` a hung git is killed and the
 * promise rejects, so the board read that waited for it ends with an error.
 */
export function catBatch(root: string, specs: readonly string[], timeoutMs: number = BATCH_TIMEOUT_MS, command: readonly string[] = ["git", "cat-file", "--batch"]): Promise<(string | null)[]> {
  if (specs.length === 0) {
    return Promise.resolve([]);
  }
  spy?.(["cat-file", "--batch"]);
  return Promise.resolve(before?.(["cat-file", "--batch"])).then(() => catBatchRun(root, specs, timeoutMs, command));
}

function catBatchRun(root: string, specs: readonly string[], timeoutMs: number, command: readonly string[]): Promise<(string | null)[]> {
  return new Promise((done, reject) => {
    let failed = false;
    const child = spawn(command[0] ?? "git", command.slice(1), { cwd: root, windowsHide: true, stdio: ["pipe", "pipe", "ignore"] });
    const chunks: Buffer[] = [];
    // A hung git ends the read with an error (the board shows it) instead of waiting forever.
    const timer = setTimeout(() => {
      failed = true;
      child.kill();
      reject(new Error(`git cat-file --batch timed out after ${timeoutMs} ms`));
    }, timeoutMs);
    child.stdout.on("data", (c: Buffer) => chunks.push(c));
    child.stdin.on("error", () => {});
    child.on("error", () => {
      clearTimeout(timer);
      done(specs.map(() => null));
    });
    child.on("close", () => {
      clearTimeout(timer);
      if (!failed) {
        done(parseBatch(Buffer.concat(chunks), specs.length));
      }
    });
    child.stdin.end(`${specs.join("\n")}\n`);
  });
}

/** The `git cat-file --batch` output for `count` requests: each object's text when it is a blob, else null. */
function parseBatch(all: Buffer, count: number): (string | null)[] {
  const out: (string | null)[] = [];
  let at = 0;
  for (let i = 0; i < count; i++) {
    const eol = all.indexOf(0x0a, at);
    if (eol < 0) {
      out.push(null);
      continue;
    }
    const header = all.toString("utf8", at, eol);
    const m = /^\w+ (\w+) (\d+)$/.exec(header);
    if (m === null) {
      out.push(null);
      at = eol + 1;
      continue;
    }
    const size = Number(m[2]);
    out.push(m[1] === "blob" ? all.toString("utf8", eol + 1, eol + 1 + size) : null);
    at = eol + 1 + size + 1;
  }
  return out;
}

/**
 * `catBatch` for the synchronous readers of the CLI commands: the same texts through one `git cat-file --batch`
 * process, null for each when git fails or times out.
 */
export function catBatchSync(root: string, specs: readonly string[], timeoutMs: number = BATCH_TIMEOUT_MS, command: readonly string[] = ["git", "cat-file", "--batch"]): (string | null)[] {
  if (specs.length === 0) {
    return [];
  }
  noteSyncGit(["cat-file", "--batch"]);
  const r = spawnSync(command[0] ?? "git", command.slice(1), {
    cwd: root,
    input: `${specs.join("\n")}\n`,
    maxBuffer: 256 * 1024 * 1024,
    timeout: timeoutMs,
    windowsHide: true,
    stdio: ["pipe", "pipe", "ignore"],
  });
  return r.status !== 0 || r.stdout === null ? specs.map(() => null) : parseBatch(r.stdout, specs.length);
}
