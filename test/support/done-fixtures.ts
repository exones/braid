import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, beforeEach } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

// Fixtures shared by done.test.ts and done-merge.test.ts. Each test file runs in its own process,
// so each gets its own scratch folder (removed after its tests).
export const scratch = mkdtempSync(join(tmpdir(), "braid-done-test-"));
after(() => rmSync(scratch, { recursive: true, force: true, maxRetries: 20, retryDelay: 250 }));
// braid worktrees live in `<worktrees>/<repo>/<NNNN>[-<L>]`; a thread shown elsewhere is no worker of an item.
process.env.BRAID_WORKTREES_DIR = join(scratch, "worktrees");

export const load = (path: string) => import(pathToFileURL(fileURLToPath(new URL(path, import.meta.url))).href);
export const { acceptCommand, openBoxes, hasBoxSection } = (await load("../../dist/commands/done.js")) as {
  hasBoxSection: (brief: string) => boolean;
  acceptCommand: (root: string, args: string[], opts: object) => Promise<string>;
  openBoxes: (brief: string) => string[];
};
export const { statusCommand } = (await load("../../dist/commands/coordinate.js")) as {
  statusCommand: (root: string, args: string[], src: object) => Promise<string>;
};
export const { resetGithubMemory } = (await load("../../dist/board/github.js")) as { resetGithubMemory: () => void };
beforeEach(() => {
  resetGithubMemory();
});

export const git = (cwd: string, ...args: string[]) => {
  const r = spawnSync("git", args, { cwd, encoding: "utf8" });
  assert.equal(r.status, 0, `git ${args.join(" ")}: ${r.stderr}`);
  return r.stdout.trim();
};
export const ok = (data: unknown) => ({ status: 0, stdout: typeof data === "string" ? data : JSON.stringify(data), stderr: "" });

export const brief = (id: string, status: string, body = "") => `---\nid: '${id}'\ntitle: "T ${id}"\nstatus: ${status}\nlabels: []\ndependencies: []\n---\n\n## Goal\n\nx\n${body}`;
export const TICKED = "\n## Acceptance\n\n- [x] it works\n- [ ] CI green on Windows and Ubuntu\n\n## Definition of done\n\n- [x] The gate passes\n";

export interface FakePr {
  number: number;
  branch: string;
  base: string;
  state: "OPEN" | "MERGED" | "CLOSED";
  checks: string;
  mergeable: string;
}

/**
 * A repository `proj` with a bare remote. Braid 0001 (braid branch braid/0001-alpha) has strand A, worked on
 * braid/0001/A-first with its boxes ticked and a report; story 0002 is worked on braid/0002-story the same way.
 * The coordinator's checkout is on the braid branch. `gh` is a fake whose merge really merges in the remote.
 */
export function world(preset = "", ci = "[verify]") {
  const base = mkdtempSync(join(scratch, "w-"));
  const root = join(base, "proj");
  const remote = join(base, "remote.git");
  const put = (dir: string, path: string, text: string) => {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), text);
  };
  git(base, "init", "-q", "--bare", "remote.git");
  git(base, "init", "-q", "-b", "main", root);
  git(root, "config", "user.email", "t@example.com");
  git(root, "config", "user.name", "t");
  git(root, "remote", "add", "origin", remote);
  put(root, "BRAID.md", ["---", "main: main", `ci: ${ci}`, ...(preset === "" ? [] : [`autonomy: ${preset}`]), "---", ""].join("\n"));
  put(root, "braids/0001-alpha/brief.md", brief("0001", "In Progress"));
  put(root, "braids/0001-alpha/A-first/brief.md", brief("0001/A", "To Do"));
  put(root, "braids/0002-story/brief.md", brief("0002", "To Do"));
  git(root, "add", "-A");
  git(root, "commit", "-q", "-m", "init");
  git(root, "push", "-q", "origin", "main");
  git(root, "push", "-q", "origin", "main:refs/heads/braid/0001-alpha");
  // The workers' branches, made in a second clone.
  const worker = join(base, "worker");
  git(base, "clone", "-q", remote, "worker");
  git(worker, "config", "user.email", "w@example.com");
  git(worker, "config", "user.name", "w");
  git(worker, "checkout", "-q", "-b", "braid/0001/A-first", "origin/braid/0001-alpha");
  put(worker, "braids/0001-alpha/A-first/brief.md", brief("0001/A", "In Progress", TICKED));
  put(worker, "braids/0001-alpha/A-first/report.md", "# report\n");
  put(worker, "code.txt", "a\n");
  git(worker, "add", "-A");
  git(worker, "commit", "-q", "-m", "feat: A");
  git(worker, "push", "-q", "origin", "braid/0001/A-first");
  git(worker, "checkout", "-q", "-b", "braid/0002-story", "origin/main");
  put(worker, "braids/0002-story/brief.md", brief("0002", "In Progress", TICKED));
  put(worker, "braids/0002-story/report.md", "# report\n");
  git(worker, "add", "-A");
  git(worker, "commit", "-q", "-m", "feat: story");
  git(worker, "push", "-q", "origin", "braid/0002-story");
  git(root, "fetch", "-q", "origin");
  git(root, "checkout", "-q", "-b", "braid/0001-alpha", "origin/braid/0001-alpha");

  const prs: FakePr[] = [
    { number: 5, branch: "braid/0001/A-first", base: "braid/0001-alpha", state: "OPEN", checks: "SUCCESS", mergeable: "MERGEABLE" },
    { number: 6, branch: "braid/0002-story", base: "main", state: "OPEN", checks: "SUCCESS", mergeable: "MERGEABLE" },
  ];
  const merges: string[][] = [];
  const comments: string[] = [];
  const headOf = (branch: string) => git(root, "ls-remote", remote, `refs/heads/${branch}`).split("\t")[0] ?? "";
  const rollup = (p: FakePr) => p.checks === "NONE" ? [] : [{ name: "verify", conclusion: p.checks === "PENDING" ? "" : p.checks, status: p.checks === "PENDING" ? "IN_PROGRESS" : "COMPLETED" }];
  /** Commits whose `verify` check passed, as `gh api .../check-runs` reports it. */
  const green = new Set<string>();
  const gh = (_r: string, args: readonly string[]) => {
    if (args[0] === "api") {
      const sha = /commits\/([0-9a-f]+)\/check-runs/.exec(args[1] ?? "")?.[1] ?? "";
      return ok({ check_runs: green.has(sha) ? [{ name: "verify", status: "completed", conclusion: "success" }] : [] });
    }
    if (args[1] === "list") {
      return ok(prs.map((p) => ({ number: p.number, url: `u/${p.number}`, state: p.state, headRefName: p.branch, statusCheckRollup: rollup(p) })));
    }
    const p = prs.find((x) => x.number === Number(args[2]));
    if (p === undefined) {
      return { status: 1, stdout: "", stderr: "no such PR" };
    }
    if (args[1] === "view") {
      return ok({ number: p.number, url: `u/${p.number}`, state: p.state, baseRefName: p.base, headRefName: p.branch, headRefOid: headOf(p.branch), mergeable: p.mergeable, statusCheckRollup: rollup(p) });
    }
    if (args[1] === "comment") {
      comments.push(`${p.number}: ${args[args.indexOf("--body") + 1]}`);
      return ok("");
    }
    if (args[1] === "merge") {
      merges.push([...args]);
      if (args[args.indexOf("--match-head-commit") + 1] !== headOf(p.branch)) {
        return { status: 1, stdout: "", stderr: "head moved" };
      }
      git(worker, "fetch", "-q", "origin");
      git(worker, "checkout", "-q", "-B", p.base, `origin/${p.base}`);
      git(worker, "merge", "-q", "--no-ff", "-m", `Merge PR #${p.number}`, `origin/${p.branch}`);
      git(worker, "push", "-q", "origin", p.base);
      p.state = "MERGED";
      return ok("");
    }
    return { status: 1, stdout: "", stderr: `unexpected gh ${args.join(" ")}` };
  };
  let threads: object[] = [];
  let t3Down = false;
  // `thread show` answers of recorded child threads (never listed), by thread id.
  let shown: Record<string, object> = {};
  // A thread's `_at` is the folder of its worktree under braid's worktrees for this repository.
  const t3 = (_r: string, args: readonly string[]) => {
    const child = shown[args[2] ?? ""];
    if (child !== undefined && !t3Down && args[1] === "show") {
      return Promise.resolve(ok({ thread: child }));
    }
    const at = (threads as { threadId: string; _at?: string }[]).find((t) => t.threadId === args[2])?._at ?? "elsewhere";
    return Promise.resolve(t3Down ? { status: 1, stdout: "", stderr: "t3 is not running" } : args[1] === "list" ? ok(threads) : ok({ thread: { worktreePath: join(process.env.BRAID_WORKTREES_DIR as string, "proj", at), pendingRequestCount: 0 } }));
  };
  const opts = { gh, t3, sleep: () => Promise.resolve(), waitMs: 60_000 };
  return {
    root,
    remote,
    worker,
    prs,
    merges,
    comments,
    green,
    opts,
    headOf,
    setThreads: (t: object[]) => (threads = t),
    setShown: (s: Record<string, object>) => (shown = s),
    setT3Down: (d: boolean) => (t3Down = d),
    /** A file on a remote branch. */
    show: (branch: string, path: string) => git(root, "--git-dir", remote, "show", `${branch}:${path}`),
    /** Adds a commit to the worker's branch, as a fix round would. */
    workerCommit: (branch: string, path: string, text: string) => {
      git(worker, "checkout", "-q", "-B", branch, `origin/${branch}`);
      put(worker, path, text);
      git(worker, "add", "-A");
      git(worker, "commit", "-q", "-m", "fix");
      git(worker, "push", "-q", "origin", branch);
    },
  };
}
