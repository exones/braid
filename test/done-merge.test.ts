import assert from "node:assert/strict";
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { acceptCommand, brief, git, resetGithubMemory, statusCommand, world } from "./support/done-fixtures.ts";

// `braid accept` of strands, and `--merge --preset`. The story and refusal tests are in done.test.ts.

test("a strand with an open PR: --merge merges the reviewed green head, records the acceptance and commits only the log entry on the braid branch", async () => {
  const w = world();
  const head = w.headOf("braid/0001/A-first");
  const logFile = join(w.root, "..", "entry.md");
  writeFileSync(logFile, "0001/A merged: PR #5.\n");
  const out = await acceptCommand(w.root, ["0001/A", "--head", head.slice(0, 7), "--merge", "--review", "https://x/pr/5#c1", "--log", logFile, "--thread", "mcp:launch:abcdef0123"], w.opts);
  assert.match(out, new RegExp(`merged PR #5 at ${head}`));
  assert.match(out, new RegExp(`0001/A accepted at ${head}; Done from the merge\nlog entry on braid/0001-alpha in [0-9a-f]{40}`));
  assert.deepEqual(w.merges[0], ["pr", "merge", "5", "--merge", "--match-head-commit", head]);
  // No status is written into the brief: Done comes from the merge.
  assert.match(w.show("braid/0001-alpha", "braids/0001-alpha/A-first/brief.md"), /^status: In Progress$/m);
  assert.equal(git(w.root, "--git-dir", w.remote, "log", "-1", "--format=%s", "braid/0001-alpha"), "docs(braids): 0001/A accepted");
  assert.equal(git(w.root, "--git-dir", w.remote, "diff", "--name-only", "braid/0001-alpha~1", "braid/0001-alpha"), `braids/0001-alpha/log-${new Date().toISOString().slice(0, 10)}-abcdef01.md`);
  assert.equal(git(w.root, "--git-dir", w.remote, "log", "-1", "--format=%s", "braid-requests"), "docs(record): 0001/A accepted");
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
  await refuse(["0001/A"], /PR #5 is open, and a strand is accepted with its merge/);
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

test("a strand merged in GitHub's UI and never accepted is Done with no accept hint; accepting it later records it once", async () => {
  const w = world();
  w.opts.gh(w.root, ["pr", "merge", "5", "--merge", "--match-head-commit", w.headOf("braid/0001/A-first")]);
  const status = await statusCommand(w.root, ["0001"], w.opts);
  assert.match(status, /^ {2}0001\/A {2}Done {2}Done /m);
  assert.doesNotMatch(status, /run braid accept/);
  await assert.rejects(acceptCommand(w.root, ["0001/A", "--merge"], w.opts), /already merged; run braid accept 0001\/A without --head and --merge/);
  const logFile = join(w.root, "..", "entry.md");
  writeFileSync(logFile, "0001/A merged in the UI.\n");
  const tip0 = w.headOf("braid/0001-alpha");
  const out = await acceptCommand(w.root, ["0001/A", "--log", logFile, "--thread", "mcp:launch:abcdef0123"], w.opts);
  assert.match(out, /0001\/A accepted at [0-9a-f]{40}; Done from the merge of PR #5\nlog entry on braid\/0001-alpha/);
  assert.notEqual(w.headOf("braid/0001-alpha"), tip0);
  // The pull brought the strand's own work in too.
  assert.ok(existsSync(join(w.root, "code.txt")));
  const tip = w.headOf("braid/0001-alpha");
  resetGithubMemory();
  assert.match(await acceptCommand(w.root, ["0001/A"], w.opts), /0001\/A is already accepted at [0-9a-f]{40}; nothing changed/);
  assert.equal(w.headOf("braid/0001-alpha"), tip);
});

test("an open strand PR with --merge --log is refused before the merge when this checkout can't take the log entry", async () => {
  const w = world();
  const head = w.headOf("braid/0001/A-first");
  const logFile = join(w.root, "..", "entry.md");
  writeFileSync(logFile, "entry\n");
  const args = ["0001/A", "--head", head, "--merge", "--log", logFile, "--thread", "mcp:launch:abcdef0123"];
  git(w.root, "checkout", "-q", "main");
  await assert.rejects(acceptCommand(w.root, args, w.opts), /this checkout is on main, not the braid branch braid\/0001-alpha/);
  git(w.root, "checkout", "-q", "braid/0001-alpha");
  writeFileSync(join(w.root, "BRAID.md"), "---\nmain: main\nci: [verify]\n---\nedited\n");
  await assert.rejects(acceptCommand(w.root, args, w.opts), /uncommitted changes/);
  assert.equal(w.merges.length, 0);
  assert.equal(w.prs[0]!.state, "OPEN");
});

test("a merged strand's log entry needs the braid branch checked out and no uncommitted changes; without --log it needs neither", async () => {
  const w = world();
  w.opts.gh(w.root, ["pr", "merge", "5", "--merge", "--match-head-commit", w.headOf("braid/0001/A-first")]);
  const logFile = join(w.root, "..", "entry.md");
  writeFileSync(logFile, "entry\n");
  const args = ["0001/A", "--log", logFile, "--thread", "mcp:launch:abcdef0123"];
  git(w.root, "checkout", "-q", "main");
  await assert.rejects(acceptCommand(w.root, args, w.opts), /this checkout is on main, not the braid branch braid\/0001-alpha/);
  git(w.root, "checkout", "-q", "braid/0001-alpha");
  writeFileSync(join(w.root, "BRAID.md"), "---\nmain: main\nci: [verify]\n---\nedited\n");
  await assert.rejects(acceptCommand(w.root, args, w.opts), /uncommitted changes/);
  assert.match(await acceptCommand(w.root, ["0001/A"], w.opts), /0001\/A accepted at /);
});


test("--merge --preset: a strand merges under steady, and the merge is the same one --merge makes", async () => {
  const w = world("steady");
  const head = w.headOf("braid/0001/A-first");
  const out = await acceptCommand(w.root, ["0001/A", "--head", head, "--merge", "--preset", "--thread", "mcp:launch:abcdef0123"], w.opts);
  assert.match(out, new RegExp(`merged PR #5 at ${head}`));
  assert.deepEqual(w.merges[0], ["pr", "merge", "5", "--merge", "--match-head-commit", head]);
});

test("--merge --preset: a story's PR is refused under steady, naming the preset and its merge value, and merges under free", async () => {
  const w = world("steady");
  const head = w.headOf("braid/0002-story");
  await assert.rejects(acceptCommand(w.root, ["0002", "--head", head, "--merge", "--preset"], w.opts), /0002 not merged: preset steady has merge: strands, which does not let the coordinator merge a story's PR/);
  assert.equal(w.merges.length, 0);
  const f = world("free");
  const out = await acceptCommand(f.root, ["0002", "--head", f.headOf("braid/0002-story"), "--merge", "--preset"], f.opts);
  assert.match(out, /merged PR #6 at /);
  assert.equal(f.merges.length, 1);
});

test("--merge --preset: nothing merges under careful (the default) or none; a braid's final PR needs all", async () => {
  const w = world();
  await assert.rejects(acceptCommand(w.root, ["0001/A", "--head", w.headOf("braid/0001/A-first"), "--merge", "--preset"], w.opts), /preset careful has merge: none, which does not let the coordinator merge a strand's PR/);
  const s = world("steady");
  s.prs.push({ number: 7, branch: "braid/0001-alpha", base: "main", state: "OPEN", checks: "SUCCESS", mergeable: "MERGEABLE" });
  await assert.rejects(acceptCommand(s.root, ["0001", "--head", s.headOf("braid/0001-alpha"), "--merge", "--preset"], s.opts), /preset steady has merge: strands, which does not let the coordinator merge a braid's final PR/);
  assert.equal(w.merges.length + s.merges.length, 0);
});

test("--merge --preset: refused when ci is none, and --preset needs --merge", async () => {
  const w = world("steady", "none");
  const head = w.headOf("braid/0001/A-first");
  await assert.rejects(acceptCommand(w.root, ["0001/A", "--head", head, "--merge", "--preset"], w.opts), /preset steady allows this merge only with CI to wait for, and ci in BRAID\.md is none/);
  await assert.rejects(acceptCommand(w.root, ["0001/A", "--head", head, "--preset"], w.opts), /--preset goes with --merge/);
  assert.equal(w.merges.length, 0);
});

test("ci: all: --merge needs every reported check green and at least one reported", async () => {
  const w = world("", "all");
  const head = w.headOf("braid/0001/A-first").slice(0, 7);
  const merge = ["0001/A", "--head", head, "--merge"];
  const refuse = async (why: RegExp) => assert.rejects(acceptCommand(w.root, merge, w.opts), why);
  w.prs[0]!.checks = "NONE";
  await refuse(/ci: all, but no check is reported on [0-9a-f]{7}/);
  w.prs[0]!.checks = "FAILURE";
  await refuse(/checks not green: verify failing/);
  w.prs[0]!.checks = "PENDING";
  await refuse(/checks not green: verify pending/);
  assert.equal(w.merges.length, 0);
  w.prs[0]!.checks = "SUCCESS";
  assert.match(await acceptCommand(w.root, merge, w.opts), /merged PR #5/);
});
