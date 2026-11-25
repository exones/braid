import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { git, load, ok, repo, src } from "./support/start-fixtures.ts";

// `braid launch`: one call prepares a subagent launch (limits, a worker's branch, the delegate_task input) and a second records the child.
const { launchCommand } = (await load("../../dist/commands/launch.js")) as {
  launchCommand: (root: string, args: string[], opts?: object) => Promise<{ stdout: string; stderr: string; code: number }>;
};
const { reviewCommand } = (await load("../../dist/commands/requests.js")) as { reviewCommand: (root: string, args: string[], opts?: object) => Promise<string> };
const { loadReviews, childRole, reviewsFile } = (await load("../../dist/braids/reviews.js")) as {
  loadReviews: (root: string) => { id: string; thread: string; role?: string; folder?: string }[];
  childRole: (r: object) => string;
  reviewsFile: (root: string) => string;
};

const caches = fileURLToPath(new URL("./fixtures/limits", import.meta.url));
const NOW = new Date("2026-11-21T18:05:00.000Z");
const MODELS = [
  "---",
  "main: main",
  "ci: none",
  "models:",
  "  worker:",
  "    task: claude_ok / claude-sonnet-5-5 / effort=medium",
  "    L: claude_session_over / claude-opus-5-5 / effort=high",
  "  reviewer: claude_ok / grok-4.6 / effort=high, fastMode=false; skill braid-reviewer",
  "  researcher: claude_ok / claude-opus-5-5 / effort=medium; skill braid-researcher",
  "---",
  "",
].join("\n");

/** The start fixture's repository with a test BRAID.md (never the real one) and labels on 0001/B. */
function project(tier = "M") {
  const r = repo();
  // The briefs are read from the braid branch, so the labels are committed there.
  git(r.root, "checkout", "-q", "braid/0001-alpha");
  const file = join(r.root, "braids/0001-alpha/B-second-one/brief.md");
  writeFileSync(file, readFileSync(file, "utf8").replace("labels: []", `labels: ['kind:task', 'tier:${tier}']`));
  git(r.root, "commit", "-q", "-am", "labels");
  git(r.root, "push", "-q", "origin", "braid/0001-alpha");
  git(r.root, "checkout", "-q", "main");
  writeFileSync(join(r.root, "BRAID.md"), MODELS);
  const opts = { caches, now: () => NOW, src: src(), env: r.env };
  return { ...r, opts };
}

const run = async (root: string, args: string[], opts: object) => {
  const out = await launchCommand(root, args, opts);
  return { ...out, json: out.stdout === "" ? null : (JSON.parse(out.stdout) as Record<string, unknown>) };
};
const events = (root: string) => {
  try {
    return (JSON.parse(git(root, "show", "origin/braid-requests:lifecycle/0001-B.json")) as { events: { kind: string }[] }).events;
  } catch {
    return [];
  }
};

test("a worker launch starts the branch with no worktree and prints the delegate_task input", async () => {
  const { root, wt, opts } = project();
  const tipCommit = git(root, "rev-parse", "braid/0001-alpha");
  const { json, code } = await run(root, ["0001/B", "--role", "worker", "--thread", "mcp:launch:coord1234"], opts);
  assert.equal(code, 0);
  assert.ok(json);
  assert.equal(json["role"], "implementation");
  assert.equal(json["isolation"], "worktree");
  assert.equal(json["mode"], "async");
  assert.match(json["title"] as string, /^\S+ \S+ 0001\/B worker: T 0001\/B$/);
  assert.deepEqual(json["target"], { providerInstanceId: "claude_ok", model: "claude-sonnet-5-5", options: { effort: "medium" } });
  const task = json["task"] as string;
  assert.match(task, /braid-worker skill/);
  assert.ok(task.includes(`Branch: braid/0001/B-second-one at ${tipCommit.slice(0, 8)}. Open the PR into braid/0001-alpha.`));
  assert.ok(task.includes("`git fetch`, `git switch braid/0001/B-second-one`"));
  assert.ok(task.includes("Send your result to thread mcp:launch:coord1234. Your thread id: `parentThreadId` from `orchestrator_capabilities`."));
  assert.ok(task.includes("PR <url>, head <sha>, checks <state>"));
  assert.equal(git(root, "ls-remote", "--heads", "origin", "braid/0001/B-second-one").split("\t")[0], tipCommit);
  assert.equal(existsSync(join(wt, "proj", "0001-B")), false, "no worktree");
  assert.equal(git(root, "branch", "--list", "braid/0001/B-second-one"), "", "no local branch either");
  assert.equal(events(root).length, 1);
});

test("a second worker launch is a no-op start and prints the same input", async () => {
  const { root, opts } = project();
  const args = ["0001/B", "--role", "worker", "--thread", "mcp:launch:coord1234"];
  const first = await run(root, args, opts);
  const remote = git(root, "ls-remote", "--heads", "origin", "braid/0001/B-second-one");
  const second = await run(root, args, opts);
  assert.equal(second.code, 0);
  assert.equal(second.stdout, first.stdout);
  assert.equal(git(root, "ls-remote", "--heads", "origin", "braid/0001/B-second-one"), remote);
  assert.equal(events(root).length, 1, "started once");
});

test("the model follows the item's tier: a tier L worker reads the L line, and on pause nothing is started", async () => {
  const { root, opts } = project("L");
  const out = await run(root, ["0001/B", "--role", "worker", "--thread", "mcp:launch:coord1234"], opts);
  assert.equal(out.code, 3);
  assert.equal(out.stdout, "");
  assert.match(out.stderr, /claude_session_over/);
  assert.match(out.stderr, /verdict: pause: .*resume at \d{4}-\d{2}-\d{2} \d{2}:\d{2}/);
  assert.equal(git(root, "ls-remote", "--heads", "origin", "braid/0001/B-second-one"), "", "no branch");
  assert.equal(events(root).length, 0, "no start recorded");
});

test("a review launch prints the PR, head and focus, with the reviewer's options as an object", async () => {
  const { root, opts } = project();
  const pr = { number: 7, url: "https://github.com/x/y/pull/7", state: "OPEN", baseRefName: "b", headRefName: "h", headRefOid: "abcdef0123456789abcdef0123456789abcdef01" };
  const { json, code } = await run(root, ["0001/B", "--role", "review", "--thread", "mcp:launch:coord1234", "--pr", "7", "--focus", "the edge cases"], { ...opts, gh: () => ok(pr) });
  assert.equal(code, 0);
  assert.ok(json);
  assert.equal(json["role"], "review");
  assert.equal(json["isolation"], "worktree");
  assert.match(json["title"] as string, / 0001\/B review: /);
  assert.deepEqual(json["target"], { providerInstanceId: "claude_ok", model: "grok-4.6", options: { effort: "high", fastMode: false } });
  const task = json["task"] as string;
  assert.ok(task.includes("braid-reviewer skill"));
  assert.ok(task.includes("https://github.com/x/y/pull/7, head abcdef01. Focus: the edge cases."));
  assert.equal(git(root, "ls-remote", "--heads", "origin", "braid/0001/B-second-one"), "", "a review starts nothing");
  await assert.rejects(run(root, ["0001/B", "--role", "review"], opts), /needs --pr/);
});

test("a research launch is shared, carries the question, and starts nothing", async () => {
  const { root, opts } = project();
  const { json } = await run(root, ["0001/B", "--role", "research", "--question", "Which library?"], opts);
  assert.ok(json);
  assert.equal(json["role"], "research");
  assert.equal(json["isolation"], "shared");
  assert.match(json["title"] as string, / 0001\/B research: /);
  assert.deepEqual(json["target"], { providerInstanceId: "claude_ok", model: "claude-opus-5-5", options: { effort: "medium" } });
  assert.ok((json["task"] as string).includes("Question: Which library?."));
  assert.equal(events(root).length, 0);
  await assert.rejects(run(root, ["0001/B", "--role", "research"], opts), /needs --question/);
});

test("--child records the child with its role and the checkout T3 gives; braid review records a review; old records read as review", async () => {
  const { root, opts } = project();
  const t3 = () => Promise.resolve(ok({ thread: { branch: "t3/abc", worktreePath: "C:/t3/wt", pendingRequestCount: 0 } }));
  const out = await launchCommand(root, ["0001/B", "--role", "worker", "--child", "mcp:child:worker0001"], { ...opts, t3 });
  assert.match(out.stdout, /0001\/B: worker thread mcp:child:worker0001 recorded \(checkout C:\/t3\/wt, branch t3\/abc\)/);
  await reviewCommand(root, ["0001/B", "--thread", "mcp:child:review0001"], { t3 });
  const [worker, review] = loadReviews(root);
  assert.deepEqual([worker?.role, worker?.folder, review?.role], ["worker", "C:/t3/wt", undefined]);
  assert.deepEqual([childRole(worker as object), childRole(review as object)], ["worker", "review"]);
  mkdirSync(join(root, ".braid"), { recursive: true });
  writeFileSync(reviewsFile(root), JSON.stringify([{ id: "0001/B", thread: "old-thread-1", at: "2026-01-01T00:00:00.000Z" }]));
  assert.equal(childRole(loadReviews(root)[0] as object), "review");
});

test("bad arguments are usage errors that start nothing", async () => {
  const { root, opts } = project();
  await assert.rejects(run(root, ["0001/B"], opts), /usage: braid launch/);
  await assert.rejects(run(root, ["0001/B", "--role", "boss"], opts), /usage: braid launch/);
  assert.equal(git(root, "ls-remote", "--heads", "origin", "braid/0001/B-second-one"), "");
});
