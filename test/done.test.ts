import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, beforeEach, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const scratch = mkdtempSync(join(tmpdir(), "braid-done-test-"));
after(() => rmSync(scratch, { recursive: true, force: true }));
// braid worktrees live in `<worktrees>/<repo>/<NNNN>[-<L>][-review]`; a thread shown elsewhere is no agent of an item.
process.env.BRAID_WORKTREES_DIR = join(scratch, "worktrees");

const load = (path: string) => import(pathToFileURL(fileURLToPath(new URL(path, import.meta.url))).href);
const { acceptCommand, openBoxes } = (await load("../dist/commands/done.js")) as {
  acceptCommand: (root: string, args: string[], opts: object) => Promise<string>;
  openBoxes: (brief: string) => string[];
};
const { statusCommand } = (await load("../dist/commands/coordinate.js")) as {
  statusCommand: (root: string, args: string[], src: object) => Promise<string>;
};
const { resetGithubMemory } = (await load("../dist/board/github.js")) as { resetGithubMemory: () => void };
const { resetT3Memory } = (await load("../dist/board/t3.js")) as { resetT3Memory: () => void };
beforeEach(() => {
  resetGithubMemory();
  resetT3Memory();
});

const git = (cwd: string, ...args: string[]) => {
  const r = spawnSync("git", args, { cwd, encoding: "utf8" });
  assert.equal(r.status, 0, `git ${args.join(" ")}: ${r.stderr}`);
  return r.stdout.trim();
};
const ok = (data: unknown) => ({ status: 0, stdout: typeof data === "string" ? data : JSON.stringify(data), stderr: "" });

const brief = (id: string, status: string, body = "") => `---\nid: '${id}'\ntitle: "T ${id}"\nstatus: ${status}\nlabels: []\ndependencies: []\n---\n\n## Goal\n\nx\n${body}`;
const TICKED = "\n## Acceptance\n\n- [x] it works\n- [ ] CI green on Windows and Ubuntu\n\n## Definition of done\n\n- [x] The gate passes\n";

interface FakePr {
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
function world() {
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
  put(root, "BRAID.md", "---\nmain: main\nci: [verify]\n---\n");
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
  const rollup = (p: FakePr) => [{ name: "verify", conclusion: p.checks === "PENDING" ? "" : p.checks, status: p.checks === "PENDING" ? "IN_PROGRESS" : "COMPLETED" }];
  const gh = (_r: string, args: readonly string[]) => {
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
  // A thread's `_at` is the folder of its worktree under braid's worktrees for this repository.
  const t3 = (_r: string, args: readonly string[]) => {
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
    opts,
    headOf,
    setThreads: (t: object[]) => (threads = t),
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

test("a strand with an open PR: --merge merges the reviewed green head, then stamps Done on the braid branch", async () => {
  const w = world();
  const head = w.headOf("braid/0001/A-first");
  const logFile = join(w.root, "..", "entry.md");
  writeFileSync(logFile, "0001/A merged: PR #5.\n");
  const out = await acceptCommand(w.root, ["0001/A", "--head", head.slice(0, 7), "--merge", "--review", "https://x/pr/5#c1", "--log", logFile, "--thread", "mcp:launch:abcdef0123"], w.opts);
  assert.match(out, new RegExp(`merged PR #5 at ${head}`));
  assert.match(out, /0001\/A done: PR #5 merged; Done on braid\/0001-alpha in [0-9a-f]{40}/);
  assert.deepEqual(w.merges[0], ["pr", "merge", "5", "--merge", "--match-head-commit", head]);
  assert.match(w.show("braid/0001-alpha", "braids/0001-alpha/A-first/brief.md"), /^status: Done$/m);
  assert.equal(git(w.root, "--git-dir", w.remote, "log", "-1", "--format=%s", "braid/0001-alpha"), "docs(braids): 0001/A done");
  const logText = w.show("braid/0001-alpha", "braids/0001-alpha/log-" + new Date().toISOString().slice(0, 10) + "-abcdef01.md");
  assert.match(logText, /0001\/A merged: PR #5\./);
  const line = `Accepted: 0001/A at ${head.slice(0, 7)}; review: https://x/pr/5#c1; coordinator thread mcp:launch:abcdef0123.`;
  assert.ok(logText.includes(line), logText);
  assert.deepEqual(w.comments, [`5: ${line}`]);
  // The strand's own branch never got a Done commit.
  assert.equal(w.headOf("braid/0001/A-first"), head);
  assert.equal(git(w.root, "status", "--porcelain"), "");
});

test("a strand's open PR is refused without --merge, and for each failed condition, merging nothing", async () => {
  const w = world();
  const head = w.headOf("braid/0001/A-first").slice(0, 7);
  const before = w.headOf("braid/0001-alpha");
  const refuse = async (args: string[], why: RegExp) => assert.rejects(acceptCommand(w.root, args, w.opts), why);
  const merge = ["0001/A", "--head", head, "--merge"];
  await refuse(["0001/A"], /PR #5 is open, and a strand is marked Done after its merge/);
  await refuse(["0001/A", "--head", "abcdef0", "--merge"], /head is [0-9a-f]{7}, not the reviewed abcdef0/);
  w.prs[0]!.checks = "FAILURE";
  await refuse(merge, /ci checks not green on [0-9a-f]{7}: verify failing/);
  w.prs[0]!.checks = "PENDING";
  await refuse(merge, /verify pending/);
  w.prs[0]!.checks = "SUCCESS";
  w.prs[0]!.mergeable = "CONFLICTING";
  await refuse(merge, /PR #5 has conflicts/);
  w.prs[0]!.mergeable = "UNKNOWN";
  await refuse(merge, /has not worked out whether PR #5 is mergeable/);
  w.prs[0]!.mergeable = "MERGEABLE";
  w.prs[0]!.base = "main";
  await refuse(merge, /PR #5 goes into main, not braid\/0001-alpha/);
  w.prs[0]!.base = "braid/0001-alpha";
  w.setThreads([{ threadId: "x", status: "running", _at: "0001-A" }]);
  await refuse(merge, /a worker thread for 0001\/A is still running \(x\)/);
  // The coordinator's thread (on the braid branch, in no braid-made worktree) is no agent and needs no skip.
  w.setThreads([{ threadId: "mcp:launch:abcd1234ef", title: "Coordinator", status: "running", _at: "0001" }, { threadId: "workerthread1", title: "Worker A", status: "running", _at: "0001-A" }]);
  await refuse(merge, /still running \(workerthread1, "Worker A"\)/);
  w.setThreads([]);
  w.setT3Down(true);
  await refuse(merge, /T3 could not be read .* a running worker can't be ruled out/);
  w.setT3Down(false);
  // Only the coordinator runs: the check is passed (the next refusal is the unticked box below).
  w.setThreads([{ threadId: "mcp:launch:abcd1234ef", status: "running", _at: "0001" }]);
  w.workerCommit("braid/0001/A-first", "braids/0001-alpha/A-first/brief.md", brief("0001/A", "In Progress", "\n## Acceptance\n\n- [ ] it works\n"));
  const mine = w.headOf("braid/0001/A-first").slice(0, 7);
  await refuse(["0001/A", "--head", mine, "--merge"], /unticked boxes at [0-9a-f]{7}: it works/);
  assert.equal(w.merges.length, 0);
  assert.equal(w.headOf("braid/0001-alpha"), before);
});

test("a strand without report.md is refused", async () => {
  const w = world();
  w.workerCommit("braid/0001/A-first", "braids/0001-alpha/A-first/report.md", "");
  git(w.worker, "rm", "-q", "braids/0001-alpha/A-first/report.md");
  git(w.worker, "commit", "-q", "-m", "drop report");
  git(w.worker, "push", "-q", "origin", "braid/0001/A-first");
  const head = w.headOf("braid/0001/A-first").slice(0, 7);
  await assert.rejects(acceptCommand(w.root, ["0001/A", "--head", head, "--merge"], w.opts), /no report\.md at/);
  assert.equal(w.merges.length, 0);
});

test("a strand merged in GitHub's UI is stamped on the braid branch, once", async () => {
  const w = world();
  w.opts.gh(w.root, ["pr", "merge", "5", "--merge", "--match-head-commit", w.headOf("braid/0001/A-first")]);
  const hint = await statusCommand(w.root, ["0001"], w.opts);
  assert.match(hint, /0001\/A  In Progress {2}Done .*run braid accept 0001\/A/);
  await assert.rejects(acceptCommand(w.root, ["0001/A", "--merge"], w.opts), /already merged; run braid accept 0001\/A without --head and --merge/);
  const out = await acceptCommand(w.root, ["0001/A"], w.opts);
  assert.match(out, /0001\/A done: PR #5 merged; Done on braid\/0001-alpha/);
  assert.match(w.show("braid/0001-alpha", "braids/0001-alpha/A-first/brief.md"), /^status: Done$/m);
  // The pull brought the strand's own work in too.
  assert.ok(existsSync(join(w.root, "code.txt")));
  const tip = w.headOf("braid/0001-alpha");
  resetGithubMemory();
  assert.match(await acceptCommand(w.root, ["0001/A"], w.opts), /0001\/A is already Done on braid\/0001-alpha; nothing changed/);
  assert.equal(w.headOf("braid/0001-alpha"), tip);
  resetGithubMemory();
  assert.doesNotMatch(await statusCommand(w.root, ["0001"], w.opts), /run braid accept/);
});

test("an open strand PR with --merge is refused before the merge when this checkout can't take the stamp", async () => {
  const w = world();
  const head = w.headOf("braid/0001/A-first");
  git(w.root, "checkout", "-q", "main");
  await assert.rejects(acceptCommand(w.root, ["0001/A", "--head", head, "--merge"], w.opts), /this checkout is on main, not the braid branch braid\/0001-alpha/);
  git(w.root, "checkout", "-q", "braid/0001-alpha");
  writeFileSync(join(w.root, "BRAID.md"), "---\nmain: main\nci: [verify]\n---\nedited\n");
  await assert.rejects(acceptCommand(w.root, ["0001/A", "--head", head, "--merge"], w.opts), /uncommitted changes/);
  assert.equal(w.merges.length, 0);
  assert.equal(w.prs[0]!.state, "OPEN");
});

test("the merged-strand stamp needs the braid branch checked out and no uncommitted changes", async () => {
  const w = world();
  w.opts.gh(w.root, ["pr", "merge", "5", "--merge", "--match-head-commit", w.headOf("braid/0001/A-first")]);
  git(w.root, "checkout", "-q", "main");
  await assert.rejects(acceptCommand(w.root, ["0001/A"], w.opts), /this checkout is on main, not the braid branch braid\/0001-alpha/);
  git(w.root, "checkout", "-q", "braid/0001-alpha");
  writeFileSync(join(w.root, "BRAID.md"), "---\nmain: main\nci: [verify]\n---\nedited\n");
  await assert.rejects(acceptCommand(w.root, ["0001/A"], w.opts), /uncommitted changes/);
});

test("a story's open PR gets a status-only commit on its branch; the new head is printed", async () => {
  const w = world();
  const head = w.headOf("braid/0002-story");
  const out = await acceptCommand(w.root, ["0002", "--head", head], w.opts);
  const now = w.headOf("braid/0002-story");
  assert.notEqual(now, head);
  assert.equal(out, `0002 done: Done on braid/0002-story in ${now}\nhead ${now}\n`);
  assert.match(w.show("braid/0002-story", "braids/0002-story/brief.md"), /^status: Done$/m);
  assert.equal(git(w.root, "--git-dir", w.remote, "diff", "--name-only", head, now), "braids/0002-story/brief.md");
  assert.equal(w.merges.length, 0);
  // No temporary worktree is left behind.
  assert.equal(git(w.root, "worktree", "list", "--porcelain").split("\n").filter((l) => l.startsWith("worktree ")).length, 1);
  assert.match(await acceptCommand(w.root, ["0002", "--head", now], w.opts), /0002 is already Done at [0-9a-f]{40}; nothing changed/);
  await assert.rejects(acceptCommand(w.root, ["0002"], w.opts), /give the reviewed head with --head/);
});

test("a story with --merge waits for green on the new head and merges exactly that head", async () => {
  const w = world();
  const head = w.headOf("braid/0002-story");
  let polls = 0;
  // The new commit's checks run: pending on the first poll, then green.
  const sleep = () => {
    polls += 1;
    w.prs[1]!.checks = "SUCCESS";
    return Promise.resolve();
  };
  const gh = (r: string, args: readonly string[]) => {
    if (args[1] === "view" && polls === 0 && w.headOf("braid/0002-story") !== head) {
      w.prs[1]!.checks = "PENDING";
    }
    return w.opts.gh(r, args);
  };
  const out = await acceptCommand(w.root, ["0002", "--head", head, "--merge"], { ...w.opts, gh, sleep });
  const now = git(w.root, "--git-dir", w.remote, "rev-parse", "braid/0002-story");
  assert.match(out, new RegExp(`merged PR #6 at ${now}`));
  assert.equal(polls, 1);
  assert.deepEqual(w.merges[0], ["pr", "merge", "6", "--merge", "--match-head-commit", now]);
  assert.match(w.show("main", "braids/0002-story/brief.md"), /^status: Done$/m);
});

test("a story stamped before but not merged: a second call with --merge waits for green and merges that head", async () => {
  const w = world();
  await acceptCommand(w.root, ["0002", "--head", w.headOf("braid/0002-story")], w.opts);
  const stamped = w.headOf("braid/0002-story");
  assert.equal(w.merges.length, 0);
  // The stamp's checks are still running when the second call comes.
  w.prs[1]!.checks = "PENDING";
  let polls = 0;
  const sleep = () => {
    polls += 1;
    w.prs[1]!.checks = "SUCCESS";
    return Promise.resolve();
  };
  resetGithubMemory();
  const out = await acceptCommand(w.root, ["0002", "--head", stamped.slice(0, 7), "--merge"], { ...w.opts, sleep });
  assert.equal(out, `0002 is already Done at ${stamped}\nmerged PR #6 at ${stamped}\n`);
  assert.equal(polls, 1);
  assert.deepEqual(w.merges[0], ["pr", "merge", "6", "--merge", "--match-head-commit", stamped]);
  // No second stamp: the head that merged is the one stamped before.
  assert.equal(w.headOf("braid/0002-story"), stamped);
  assert.match(w.show("main", "braids/0002-story/brief.md"), /^status: Done$/m);
});

test("a story with --merge stops when the new head's checks fail, Done but not merged", async () => {
  const w = world();
  const head = w.headOf("braid/0002-story");
  const gh = (r: string, args: readonly string[]) => {
    if (args[1] === "view" && w.headOf("braid/0002-story") !== head) {
      w.prs[1]!.checks = "FAILURE";
    }
    return w.opts.gh(r, args);
  };
  await assert.rejects(acceptCommand(w.root, ["0002", "--head", head, "--merge"], { ...w.opts, gh }), /0002 is Done in [0-9a-f]{7}, but ci checks not green .*verify failing; not merged/);
  assert.equal(w.merges.length, 0);
});

test("a braid's final PR needs every strand Done at its head", async () => {
  const w = world();
  w.prs.push({ number: 7, branch: "braid/0001-alpha", base: "main", state: "OPEN", checks: "SUCCESS", mergeable: "MERGEABLE" });
  w.workerCommit("braid/0001-alpha", "braids/0001-alpha/brief.md", brief("0001", "In Progress", TICKED));
  w.workerCommit("braid/0001-alpha", "braids/0001-alpha/report.md", "# braid report\n");
  const head = w.headOf("braid/0001-alpha");
  await assert.rejects(acceptCommand(w.root, ["0001", "--head", head], w.opts), /strands not Done at [0-9a-f]{7}: 0001\/A/);
  w.workerCommit("braid/0001-alpha", "braids/0001-alpha/A-first/brief.md", brief("0001/A", "Done", TICKED));
  const ready = w.headOf("braid/0001-alpha");
  const out = await acceptCommand(w.root, ["0001", "--head", ready], w.opts);
  assert.match(out, /^0001 done: Done on braid\/0001-alpha in /);
  assert.match(w.show("braid/0001-alpha", "braids/0001-alpha/brief.md"), /^status: Done$/m);
});

test("refusals for no PR, a closed PR, a merged story without Done, and bad arguments", async () => {
  const w = world();
  w.prs.splice(0, 2);
  await assert.rejects(acceptCommand(w.root, ["0001/A"], w.opts), /0001\/A not accepted: it has no PR/);
  w.prs.push({ number: 8, branch: "braid/0001/A-first", base: "braid/0001-alpha", state: "CLOSED", checks: "SUCCESS", mergeable: "MERGEABLE" });
  resetGithubMemory();
  await assert.rejects(acceptCommand(w.root, ["0001/A"], w.opts), /PR #8 was closed without merging/);
  w.prs.push({ number: 9, branch: "braid/0002-story", base: "main", state: "MERGED", checks: "SUCCESS", mergeable: "MERGEABLE" });
  resetGithubMemory();
  await assert.rejects(acceptCommand(w.root, ["0002"], w.opts), /PR #9 is merged into main without Done, and braid never commits to main/);
  const down = { ...w.opts, gh: () => ({ status: 1, stdout: "", stderr: "gh auth login" }) };
  resetGithubMemory();
  await assert.rejects(acceptCommand(w.root, ["0001/A"], down), /GitHub could not be read/);
  await assert.rejects(acceptCommand(w.root, [], w.opts), /usage: braid accept/);
  await assert.rejects(acceptCommand(w.root, ["0001/A", "--head", "xyz"], w.opts), /--head needs a commit sha/);
  await assert.rejects(acceptCommand(w.root, ["0001/Z"], w.opts), /no strand 0001\/Z/);
  assert.deepEqual(readdirSync(join(w.root, "braids", "0001-alpha")).sort(), ["A-first", "brief.md"]);
});

test("open boxes: unticked ones under Acceptance and Definition of done, except a CI box", () => {
  const text = "## Goal\n\n- [ ] not a box here\n\n## Acceptance\n\n- [x] done\n- [ ] open one\n- [ ] CI green on Windows and Ubuntu\n\n## Definition of done\n\n- [ ] report written\n\n## Plan\n\n- [ ] later\n";
  assert.deepEqual(openBoxes(text), ["open one", "report written"]);
});

test("a story accepted without --review says the coordinator reviewed it, and the comment is posted on its PR", async () => {
  const w = world();
  const head = w.headOf("braid/0002-story");
  const logFile = join(w.root, "..", "entry2.md");
  writeFileSync(logFile, "0002 ok.\n");
  await acceptCommand(w.root, ["0002", "--head", head, "--log", logFile, "--thread", "mcp:launch:abcdef0123"], w.opts);
  assert.deepEqual(w.comments, [`6: Accepted: 0002 at ${head.slice(0, 7)}; review: reviewed by the coordinator; coordinator thread mcp:launch:abcdef0123.`]);
  assert.match(w.show("braid/0002-story", `braids/0002-story/log-${new Date().toISOString().slice(0, 10)}-abcdef01.md`), /review: reviewed by the coordinator/);
});

test("a refused accept posts no comment; a failing comment is only a warning", async () => {
  const w = world();
  const head = w.headOf("braid/0002-story");
  w.prs[1]!.checks = "FAILURE";
  await assert.rejects(acceptCommand(w.root, ["0002", "--head", head], w.opts), /not accepted/);
  assert.deepEqual(w.comments, []);
  w.prs[1]!.checks = "SUCCESS";
  const failing = (r: string, a: readonly string[]) => (a[1] === "comment" ? { status: 1, stdout: "", stderr: "denied" } : (w.opts.gh as (r: string, a: readonly string[]) => object)(r, a));
  const out = await acceptCommand(w.root, ["0002", "--head", head], { ...w.opts, gh: failing });
  assert.match(out, /0002 done: Done on braid\/0002-story/);
  assert.match(out, /warning: the PR comment was not posted \(denied\)/);
});

test("old briefs with Acceptance and Definition of done, and new ones with Completion, pass the box check", () => {
  assert.deepEqual(openBoxes("## Completion\n\n- [x] a\n- [ ] b\n- [ ] CI green\n\n## Plan\n\n- [ ] later\n"), ["b"]);
  assert.deepEqual(openBoxes("## Acceptance\n\n- [ ] x\n\n## Definition of done\n\n- [ ] y\n"), ["x", "y"]);
});
