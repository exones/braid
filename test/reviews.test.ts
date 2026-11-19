import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, beforeEach, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

// Reviewers are T3 subagents (0039): `braid review` records their child threads, the board and `braid status` count a recorded
// running thread as the item's reviewer, and `braid clean` removes a finished child's checkout after the merge.
const scratch = mkdtempSync(join(tmpdir(), "braid-reviews-"));
after(() => rmSync(scratch, { recursive: true, force: true }));

interface Result {
  status: number | null;
  stdout: string;
  stderr: string;
  error?: Error;
}
type T3Run = (root: string, args: readonly string[]) => Promise<Result>;
interface Thread {
  id: string;
  role: string;
  pending: number;
  link: string | null;
}
const load = (path: string) => import(pathToFileURL(fileURLToPath(new URL(path, import.meta.url))).href);
const { reviewCommand } = (await load("../dist/commands/requests.js")) as { reviewCommand: (root: string, args: string[], opts?: object) => string };
const { loadReviews, reviewsFile } = (await load("../dist/braids/reviews.js")) as {
  loadReviews: (root: string) => { id: string; thread: string; at: string }[];
  reviewsFile: (root: string) => string;
};
const t3mod = (await load("../dist/board/t3.js")) as {
  readT3: (root: string, o: object) => Promise<{ status: { state: string }; threads: Map<string, Thread[]>; idle?: Map<string, Thread[]> }>;
  resetT3Memory: () => void;
};
const model = (await load("../dist/board/model.js")) as {
  derive: (status: string, labels: string[], key: string, gh: unknown, t3: unknown, sig: unknown) => { lane: string; reason: string | null; activity: string | null };
};
const signals = (await load("../dist/board/signals.js")) as {
  brokeClock: (initial: Record<string, string>, now: Date) => { alarm: (id: string, reason: string, holds: boolean | null) => string | null };
};
const { statusCommand } = (await load("../dist/commands/coordinate.js")) as { statusCommand: (root: string, args: string[], src: object) => Promise<string> };
const { startCommand } = (await load("../dist/commands/start.js")) as { startCommand: (root: string, args: string[], src: object, env: object) => Promise<string> };
const { cleanCommand } = (await load("../dist/commands/clean.js")) as { cleanCommand: (root: string, args: string[], src: object, env: object) => Promise<string> };
const { resetGithubMemory } = (await load("../dist/board/github.js")) as { resetGithubMemory: () => void };

beforeEach(() => {
  resetGithubMemory();
  t3mod.resetT3Memory();
});

const git = (cwd: string, ...args: string[]) => {
  const r = spawnSync("git", args, { cwd, encoding: "utf8" });
  assert.equal(r.status, 0, `git ${args.join(" ")}: ${r.stderr}`);
  return r.stdout.trim();
};
const ok = (data: unknown): Result => ({ status: 0, stdout: JSON.stringify(data), stderr: "" });
const unknown: Result = { status: 1, stdout: "", stderr: "Thread not found" };

/** A child thread id of the real shape: it holds `:` and `%`. */
const child = (n: number) => `thread:delegated-task:command%3Amcp%3A0b1c2d3e-aaaa-bbbb-cccc-00000000000${n}%3Adelegate-task%3A9f8e7d6c-1111-2222-3333-abcdefabcde${n}`;

let n = 0;
/** A repository `proj` with a bare remote; braid 0001 has strands B (In Progress) and C (To Do), and a braid branch. */
function repo(): { root: string; env: Record<string, string>; wt: string } {
  const base = join(scratch, `t${++n}`);
  const root = join(base, "proj");
  const wt = join(base, "wt");
  const put = (path: string, text: string) => {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  };
  const brief = (id: string, status: string, order = "") => `---\nid: '${id}'\ntitle: "T ${id}"\nstatus: ${status}\nlabels: []\ndependencies: []\n${order}---\n\n## Goal\n\nx\n`;
  put("BRAID.md", "---\nmain: main\nci: none\n---\n");
  put("braids/0001-alpha/brief.md", brief("0001", "In Progress"));
  put("braids/0001-alpha/B-second/brief.md", brief("0001/B", "In Progress", "order: 20\n"));
  put("braids/0001-alpha/C-third/brief.md", brief("0001/C", "To Do", "order: 30\n"));
  mkdirSync(base, { recursive: true });
  git(base, "init", "-q", "--bare", "remote.git");
  git(base, "init", "-q", "-b", "main", root);
  git(root, "config", "user.email", "t@example.com");
  git(root, "config", "user.name", "t");
  git(root, "remote", "add", "origin", join(base, "remote.git"));
  git(root, "add", "-A");
  git(root, "commit", "-q", "-m", "init");
  git(root, "push", "-q", "origin", "main");
  git(root, "checkout", "-q", "-b", "braid/0001-alpha");
  git(root, "push", "-q", "origin", "braid/0001-alpha");
  git(root, "checkout", "-q", "main");
  return { root, env: { BRAID_WORKTREES_DIR: wt }, wt };
}

/** A fake T3: `thread list` lists no thread (children are never listed); `thread show` answers from `shown`, else "not found". */
function t3(shown: Record<string, object>, calls: string[][] = []): T3Run {
  return (_root, args) => {
    calls.push([...args]);
    if (args[1] === "list") {
      return Promise.resolve(ok([]));
    }
    const t = shown[args[2] ?? ""];
    return Promise.resolve(t === undefined ? unknown : ok({ thread: t }));
  };
}

test("braid review records a thread in .braid/ of the main checkout, adds a second, keeps a repeat once, and checks its input", () => {
  const { root, wt } = repo();
  const out = reviewCommand(root, ["0001/B", "--thread", child(1)], { now: () => new Date("2026-11-19T10:00:00Z") });
  assert.equal(out, `0001/B: review thread ${child(1)} recorded\n`);
  assert.equal(reviewCommand(root, ["0001/B", "--thread", child(1)]), `0001/B: review thread ${child(1)} already recorded\n`);
  // A re-check is a second thread of the same item, recorded from another worktree: it lands in the same file.
  const inner = join(wt, "inner");
  git(root, "worktree", "add", "-q", "--detach", inner);
  reviewCommand(inner, ["0001/B", "--thread", child(2)]);
  reviewCommand(root, ["1", "--thread", child(3)]);
  // Compared as real paths: on Windows CI the temp folder is a short (8.3) name and Git gives the long one.
  assert.equal(realpathSync.native(dirname(reviewsFile(inner))), realpathSync.native(join(root, ".braid")));
  assert.deepEqual(loadReviews(root).map((r) => [r.id, r.thread]), [["0001/B", child(1)], ["0001/B", child(2)], ["0001", child(3)]]);
  assert.equal(loadReviews(root)[0]?.at, "2026-11-19T10:00:00.000Z");
  assert.equal(JSON.parse(readFileSync(join(root, ".braid", "reviews.json"), "utf8")).length, 3);
  assert.equal(git(root, "status", "--porcelain"), "", "the record is never untracked");
  assert.throws(() => reviewCommand(root, ["0001/B"]), /usage: braid review <id> --thread <thread id>/);
  assert.throws(() => reviewCommand(root, ["0001/Z", "--thread", child(1)]), /0001\/Z/);
  assert.throws(() => reviewCommand(root, ["0001/B", "--thread", "short"]), /--thread needs an id/);
});

test("a recorded running review thread is the item's reviewer: review activity, its question, no checks failed or stalled however long", async () => {
  const { root } = repo();
  reviewCommand(root, ["0001/B", "--thread", child(1)]);
  reviewCommand(root, ["0001/C", "--thread", child(2)]);
  reviewCommand(root, ["0001", "--thread", child(3)]);
  const calls: string[][] = [];
  const run = t3(
    {
      [child(1)]: { status: "running", relationshipToParent: "subagent", pendingRequestCount: 0, worktreePath: join(scratch, "t3-aaa"), branch: "t3/aaa" },
      [child(2)]: { status: "running", relationshipToParent: "subagent", pendingRequestCount: 1 },
      // child(3) is unknown to T3
    },
    calls,
  );
  const read = await t3mod.readT3(root, { run, ttlMs: 0, agents: join(scratch, "none"), project: root });
  assert.deepEqual(read.threads.get("0001/B"), [{ id: child(1), role: "reviewer", pending: 0, link: null }]);
  assert.equal(read.threads.get("0001/C")?.[0]?.pending, 1);
  assert.equal(read.threads.has("0001"), false, "a thread T3 doesn't know counts for nothing");
  // The id of the real shape reaches the runner unchanged, as one argument.
  assert.ok(calls.some((c) => c.join("\u0000") === ["thread", "show", child(1), "--json"].join("\u0000")));

  const NOW = new Date("2026-11-19T12:00:00Z");
  const held = { "0001/B checks failed": new Date(NOW.getTime() - 60 * 60_000).toISOString(), "0001/B stalled": new Date(NOW.getTime() - 60 * 60_000).toISOString() };
  // A fresh clock per derive: each has seen both conditions for an hour.
  const sig = () => ({ now: NOW, requests: new Map(), alarm: signals.brokeClock(held, NOW).alarm });
  const failing = { status: { state: "ok" }, prs: new Map([["0001/B", { number: 7, url: "u", state: "open", checks: "failing", failed: ["verify"] }]]) };
  const d = model.derive("In Progress", [], "0001/B", failing, read, sig());
  assert.deepEqual([d.lane, d.reason, d.activity], ["In Progress", null, "review"]);
  const noPr = { status: { state: "ok" }, prs: new Map() };
  assert.deepEqual([model.derive("In Progress", [], "0001/B", noPr, read, sig()).reason], [null], "no stalled while it reviews");
  // Without the reviewer the same item is stalled and its checks have failed.
  const none = { status: { state: "ok" }, threads: new Map() };
  assert.equal(model.derive("In Progress", [], "0001/B", failing, none, sig()).reason, "checks failed");
  assert.equal(model.derive("In Progress", [], "0001/B", noPr, none, sig()).reason, "stalled");
  assert.equal(model.derive("In Progress", [], "0001/C", noPr, read, sig()).reason, "question", "the reviewer's pending question");
});

test("a recorded thread that has ended, or that T3 doesn't know, changes nothing; neither does a top-level thread in a -review folder", async () => {
  const { root, wt } = repo();
  reviewCommand(root, ["0001/B", "--thread", child(1)]);
  reviewCommand(root, ["0001/C", "--thread", child(2)]);
  const agents = join(wt, "proj");
  const run: T3Run = (_root, args) => {
    if (args[1] === "list") {
      return Promise.resolve(ok([{ threadId: "top-review", status: "running" }, { threadId: "titled", status: "idle", title: "👀 proj 0001/B review: T 0001/B" }]));
    }
    const shown: Record<string, object> = {
      [child(1)]: { status: "completed", relationshipToParent: "subagent", pendingRequestCount: 0 },
      "top-review": { status: "running", worktreePath: join(agents, "0001-B-review"), pendingRequestCount: 0 },
    };
    const t = shown[args[2] ?? ""];
    return Promise.resolve(t === undefined ? unknown : ok({ thread: t }));
  };
  const read = await t3mod.readT3(root, { run, ttlMs: 0, agents, project: root });
  assert.equal(read.status.state, "ok");
  assert.equal(read.threads.size, 0);
  assert.equal(read.idle?.size ?? 0, 0, "an idle thread titled as a review is no thread of the item");
  const out = await statusCommand(root, ["1"], { gh: () => ok([]), t3: run });
  assert.match(out, /0001\/B .* thread - /);
});

test("braid status shows a recorded running review thread as review running", async () => {
  const { root } = repo();
  reviewCommand(root, ["0001/B", "--thread", child(1)]);
  const run = t3({ [child(1)]: { status: "running", relationshipToParent: "subagent", pendingRequestCount: 0 } });
  const out = await statusCommand(root, ["1"], { gh: () => ok([]), t3: run });
  assert.match(out, /0001\/B {2}In Progress {2}Working .* thread review running /);
  assert.match(out, /0001\/C .* thread - /);
});

const merged = (num: number, branch: string) => ({ number: num, url: `https://github.com/o/r/pull/${num}`, state: "MERGED", headRefName: branch, mergedAt: "2026-11-19T00:00:00Z", statusCheckRollup: [] });

/** 0001/B started, its work merged into main; a T3-style checkout per name (`t3-<hex>` on a new `t3/<hex>` branch at main, then detached as the reviewer does). */
async function mergedWithChildren(names: string[]) {
  const r = repo();
  await startCommand(r.root, ["0001/B", "--force"], { gh: () => ok([]), t3: t3({}) }, r.env);
  git(r.root, "merge", "-q", "--no-ff", "-m", "merge B", "braid/0001/B-second");
  const t3dir = join(r.wt, "t3-worktrees", "proj");
  const folders: Record<string, string> = {};
  for (const name of names) {
    const folder = join(t3dir, `t3-${name}`);
    git(r.root, "worktree", "add", "-q", "-b", `t3/${name}`, folder, "main");
    git(folder, "checkout", "-q", "--detach", "HEAD");
    folders[name] = folder;
  }
  return { ...r, folders, pr: merged(6, "braid/0001/B-second") };
}

test("clean removes a finished subagent reviewer's checkout and t3/ branch for a merged item, and keeps a running, foreign or top-level one", async () => {
  const { root, env, folders, pr, wt } = await mergedWithChildren(["aaa", "bbb"]);
  const foreign = join(wt, "not-a-worktree");
  mkdirSync(foreign, { recursive: true });
  for (const i of [1, 2, 3, 4, 5]) {
    reviewCommand(root, ["0001/B", "--thread", child(i)]);
  }
  const shown = {
    [child(1)]: { status: "completed", relationshipToParent: "subagent", worktreePath: folders["aaa"], branch: "t3/aaa", pendingRequestCount: 0 },
    [child(2)]: { status: "running", relationshipToParent: "subagent", worktreePath: folders["bbb"], branch: "t3/bbb", pendingRequestCount: 0 },
    [child(3)]: { status: "completed", relationshipToParent: "subagent", worktreePath: foreign, branch: "t3/ccc", pendingRequestCount: 0 },
    [child(4)]: { status: "completed", worktreePath: folders["bbb"], branch: "t3/bbb", pendingRequestCount: 0 },
    // child(5) is unknown to T3
  };
  const src = { gh: () => ok([pr]), t3: t3(shown) };
  const dry = await cleanCommand(root, [], src, env);
  assert.match(dry, new RegExp(`would remove 0001/B: review thread ${child(1)}: checkout .*t3-aaa and branch t3/aaa \\(PR #6 merged\\)`));
  assert.match(dry, /skip 0001\/B: review thread .*: checkout .*t3-bbb and branch t3\/bbb \(PR #6 merged\): still running/);
  assert.match(dry, /skip 0001\/B: review thread .*not-a-worktree.*: the folder is not a worktree of this repository/);
  assert.match(dry, /skip 0001\/B: review thread .*: T3 says it is not a subagent's thread/);
  assert.match(dry, /would drop the record of 0001\/B: review thread .*: T3 doesn't know the thread/);
  assert.ok(existsSync(folders["aaa"] as string));
  assert.equal(loadReviews(root).length, 5, "a dry run changes nothing");

  const out = await cleanCommand(root, ["--yes"], src, env);
  assert.match(out, /removed 0001\/B: review thread .*t3-aaa and branch t3\/aaa/);
  assert.equal(existsSync(folders["aaa"] as string), false);
  assert.equal(git(root, "branch", "--list", "t3/aaa"), "");
  assert.ok(existsSync(folders["bbb"] as string), "a running reviewer's checkout stays");
  assert.notEqual(git(root, "branch", "--list", "t3/bbb"), "");
  assert.ok(existsSync(foreign), "a folder that is no worktree of this repository stays");
  assert.deepEqual(loadReviews(root).map((r) => r.thread), [child(2), child(3), child(4)]);
});

test("clean keeps the recorded reviewers' checkouts when T3 can't be read, and says so", async () => {
  const { root, env, folders, pr } = await mergedWithChildren(["aaa"]);
  reviewCommand(root, ["0001/B", "--thread", child(1)]);
  const down: T3Run = () => Promise.resolve({ status: 1, stdout: "", stderr: "connect ECONNREFUSED" });
  const out = await cleanCommand(root, ["--yes"], { gh: () => ok([pr]), t3: down }, env);
  assert.match(out, /skip 0001\/B: review thread .*: T3 could not be read, so its checkout is kept/);
  assert.ok(existsSync(folders["aaa"] as string));
  assert.equal(loadReviews(root).length, 1);
});

test("clean leaves the recorded reviewers of an unmerged item alone", async () => {
  const { root, env, folders } = await mergedWithChildren(["aaa"]);
  reviewCommand(root, ["0001/B", "--thread", child(1)]);
  const open = { number: 6, url: "https://github.com/o/r/pull/6", state: "OPEN", headRefName: "braid/0001/B-second", statusCheckRollup: [] };
  const shown = { [child(1)]: { status: "completed", relationshipToParent: "subagent", worktreePath: folders["aaa"], branch: "t3/aaa" } };
  const out = await cleanCommand(root, ["--yes"], { gh: () => ok([open]), t3: t3(shown) }, env);
  assert.doesNotMatch(out, /review thread/);
  assert.ok(existsSync(folders["aaa"] as string));
});

test("a record that can't be read is no record", () => {
  const { root } = repo();
  mkdirSync(join(root, ".braid"), { recursive: true });
  writeFileSync(join(root, ".braid", "reviews.json"), "not json");
  assert.deepEqual(loadReviews(root), []);
  assert.deepEqual(loadReviews(join(scratch, "no-repo-here")), []);
});
