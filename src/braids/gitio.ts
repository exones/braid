// Asynchronous Git for the board's reads: the server keeps answering requests while `git` runs. The
// synchronous readers stay for the CLI commands.
import { execFile, spawn } from "node:child_process";

export interface GitOut {
  readonly status: number | null;
  readonly stdout: string;
  readonly stderr: string;
}

/** Told of every `git` process started here (its arguments), for tests. */
let spy: ((args: readonly string[]) => void) | undefined;

/** Sets or clears the observer of the processes started here, for tests. */
export function spyOnGit(observer: ((args: readonly string[]) => void) | undefined): void {
  spy = observer;
}

/** Runs `git` in `root` without blocking; never rejects. */
export function gitAsync(root: string, args: readonly string[], env?: NodeJS.ProcessEnv): Promise<GitOut> {
  spy?.(args);
  return new Promise((done) => {
    execFile(
      "git",
      ["-c", "core.quotePath=false", ...args],
      { cwd: root, encoding: "utf8", maxBuffer: 256 * 1024 * 1024, timeout: 60_000, windowsHide: true, ...(env === undefined ? {} : { env: { ...process.env, ...env } }) },
      (error, stdout, stderr) => {
        const code = error === null ? 0 : typeof (error as { code?: unknown }).code === "number" ? (error as { code: number }).code : null;
        done({ status: code, stdout, stderr });
      },
    );
  });
}

/**
 * The texts of these objects (`<commit>:<path>` or a blob id), read through one `git cat-file --batch`
 * process; null for one that is missing or when Git fails.
 */
export function catBatch(root: string, specs: readonly string[]): Promise<(string | null)[]> {
  if (specs.length === 0) {
    return Promise.resolve([]);
  }
  spy?.(["cat-file", "--batch"]);
  return new Promise((done) => {
    const child = spawn("git", ["cat-file", "--batch"], { cwd: root, windowsHide: true, stdio: ["pipe", "pipe", "ignore"] });
    const chunks: Buffer[] = [];
    child.stdout.on("data", (c: Buffer) => chunks.push(c));
    child.stdin.on("error", () => {});
    child.on("error", () => done(specs.map(() => null)));
    child.on("close", () => {
      const all = Buffer.concat(chunks);
      const out: (string | null)[] = [];
      let at = 0;
      for (let i = 0; i < specs.length; i++) {
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
      done(out);
    });
    child.stdin.end(`${specs.join("\n")}\n`);
  });
}
