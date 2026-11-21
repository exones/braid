import assert from "node:assert/strict";
import { readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { acceptCommand, brief, git, hasBoxSection, openBoxes, resetGithubMemory, TICKED, world } from "./support/done-fixtures.ts";

// `braid accept` of stories, braids' final PRs, refusals and the box check. Strands and presets are in done-merge.test.ts.

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
  assert.equal(w.comments.length, 1);
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

test("a brief with no Completion, Acceptance or Definition of done section is refused, not stamped", async () => {
  const w = world();
  w.workerCommit("braid/0002-story", "braids/0002-story/brief.md", brief("0002", "In Progress", "\n\n## Notes\n\n- [x] not a box section\n"));
  const head = w.headOf("braid/0002-story");
  await assert.rejects(acceptCommand(w.root, ["0002", "--head", head], w.opts), /no Completion section/);
  assert.equal(w.headOf("braid/0002-story"), head);
  assert.deepEqual(w.comments, []);
  assert.equal(hasBoxSection("## Goal\n\nx\n"), false);
  assert.equal(hasBoxSection("## Completion\n\n- [x] a\n"), true);
});

test("old briefs with Acceptance and Definition of done, and new ones with Completion, pass the box check", () => {
  assert.deepEqual(openBoxes("## Completion\n\n- [x] a\n- [ ] b\n- [ ] CI green\n\n## Plan\n\n- [ ] later\n"), ["b"]);
  assert.deepEqual(openBoxes("## Acceptance\n\n- [ ] x\n\n## Definition of done\n\n- [ ] y\n"), ["x", "y"]);
});

test("a head with no checks that only adds braids/ changes on a green commit is accepted, with and without --merge", async () => {
  const w = world();
  const code = w.headOf("braid/0002-story");
  w.green.add(code);
  // The story's own commit changed braids/ only (brief, report), so the whole branch above main counts; main has no green record, so the PR's green is the base.
  w.workerCommit("braid/0002-story", "braids/0002-story/report.md", "# more"+"\n");
  const head = w.headOf("braid/0002-story");
  w.prs[1]!.checks = "PENDING";
  const out = await acceptCommand(w.root, ["0002", "--head", head, "--merge"], w.opts);
  assert.match(out, new RegExp("checks skipped on " + head.slice(0, 7) + ": only braids/ changed since " + code.slice(0, 7)));
  assert.equal(w.merges.length, 1);
});

test("a code change on top of the green commit, or a failed check on the head, still refuses accept", async () => {
  const w = world();
  w.green.add(w.headOf("braid/0002-story"));
  w.workerCommit("braid/0002-story", "code.txt", "b"+"\n");
  w.prs[1]!.checks = "PENDING";
  await assert.rejects(acceptCommand(w.root, ["0002", "--head", w.headOf("braid/0002-story")], w.opts), /verify pending/);
  w.workerCommit("braid/0002-story", "braids/0002-story/report.md", "# x"+"\n");
  w.green.add(git(w.root, "--git-dir", w.remote, "rev-parse", "braid/0002-story~1"));
  w.prs[1]!.checks = "FAILURE";
  await assert.rejects(acceptCommand(w.root, ["0002", "--head", w.headOf("braid/0002-story")], w.opts), /verify failing/);
  assert.equal(w.merges.length, 0);
});
