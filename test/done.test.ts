import assert from "node:assert/strict";
import { readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { spawnSync } from "node:child_process";
import { acceptCommand, brief, git, hasBoxSection, openBoxes, resetGithubMemory, statusCommand, TICKED, world } from "./support/done-fixtures.ts";

// `braid accept` of stories, braids' final PRs, refusals and the box check. Strands and presets are in done-merge.test.ts.

/** The lifecycle file of an item on the remote record branch, parsed; null when there is none. */
const lifecycleOf = (w: ReturnType<typeof world>, id: string): { id: string; events: { kind: string; head?: string; review?: string; thread?: string | null }[] } | null => {
  const r = spawnSync("git", ["--git-dir", w.remote, "show", `braid-requests:lifecycle/${id.replace("/", "-")}.json`], { encoding: "utf8" });
  return r.status === 0 ? JSON.parse(r.stdout) : null;
};

test("a story's open PR is accepted with an event on the record branch; its head and brief are unchanged", async () => {
  const w = world();
  const head = w.headOf("braid/0002-story");
  const out = await acceptCommand(w.root, ["0002", "--head", head, "--review", "https://x/6#c", "--thread", "mcp:launch:abcdef0123"], w.opts);
  assert.equal(w.headOf("braid/0002-story"), head);
  assert.match(out, new RegExp(`^0002 accepted at ${head}; the head is unchanged\n`));
  assert.match(w.show("braid/0002-story", "braids/0002-story/brief.md"), /^status: In Progress$/m);
  const life = lifecycleOf(w, "0002");
  assert.equal(life?.id, "0002");
  assert.deepEqual(life?.events.map((e) => [e.kind, e.head, e.review, e.thread]), [["accepted", head, "https://x/6#c", "mcp:launch:abcdef0123"]]);
  assert.equal(git(w.root, "--git-dir", w.remote, "log", "-1", "--format=%s", "braid-requests"), "docs(record): 0002 accepted");
  assert.equal(w.merges.length, 0);
  // Again at the same head: nothing new is recorded.
  assert.match(await acceptCommand(w.root, ["0002", "--head", head], w.opts), /0002 is already accepted at [0-9a-f]{40}\n/);
  assert.equal(lifecycleOf(w, "0002")?.events.length, 1);
  await assert.rejects(acceptCommand(w.root, ["0002"], w.opts), /give the reviewed head with --head/);
});

test("a story with --merge merges exactly the reviewed head; it reads Done from the merge, with no commit after the review", async () => {
  const w = world();
  const head = w.headOf("braid/0002-story");
  const out = await acceptCommand(w.root, ["0002", "--head", head, "--merge"], w.opts);
  assert.match(out, new RegExp(`merged PR #6 at ${head}`));
  assert.deepEqual(w.merges[0], ["pr", "merge", "6", "--merge", "--match-head-commit", head]);
  assert.equal(w.headOf("braid/0002-story"), head);
  // The brief on main still says In Progress; every reader says Done.
  assert.match(w.show("main", "braids/0002-story/brief.md"), /^status: In Progress$/m);
  resetGithubMemory();
  git(w.root, "fetch", "-q", "origin");
  assert.match(await statusCommand(w.root, ["0002"], w.opts), /^0002  Done  Done /m);
  resetGithubMemory();
  assert.match(await acceptCommand(w.root, ["0002"], w.opts), /0002 is Done: PR #6 is merged; nothing changed/);
});

test("a story accepted before but not merged: a second call with --merge merges that head without a second event", async () => {
  const w = world();
  const head = w.headOf("braid/0002-story");
  await acceptCommand(w.root, ["0002", "--head", head], w.opts);
  assert.equal(w.merges.length, 0);
  resetGithubMemory();
  const out = await acceptCommand(w.root, ["0002", "--head", head.slice(0, 7), "--merge"], w.opts);
  assert.equal(out, `0002 is already accepted at ${head}\nmerged PR #6 at ${head}\n`);
  assert.deepEqual(w.merges[0], ["pr", "merge", "6", "--merge", "--match-head-commit", head]);
  assert.equal(lifecycleOf(w, "0002")?.events.length, 1);
});

test("a story with --merge and failing checks is refused before anything is recorded", async () => {
  const w = world();
  const head = w.headOf("braid/0002-story");
  w.prs[1]!.checks = "FAILURE";
  await assert.rejects(acceptCommand(w.root, ["0002", "--head", head, "--merge"], w.opts), /0002 not accepted: ci checks not green .*verify failing/);
  assert.equal(w.comments.length, 0);
  assert.equal(w.merges.length, 0);
  assert.equal(lifecycleOf(w, "0002"), null);
});

test("a braid's final PR needs every strand Done (its PR merged, or an older stored Done)", async () => {
  const w = world();
  w.prs.push({ number: 7, branch: "braid/0001-alpha", base: "main", state: "OPEN", checks: "SUCCESS", mergeable: "MERGEABLE" });
  w.workerCommit("braid/0001-alpha", "braids/0001-alpha/brief.md", brief("0001", "In Progress", TICKED));
  w.workerCommit("braid/0001-alpha", "braids/0001-alpha/report.md", "# braid report\n");
  const head = w.headOf("braid/0001-alpha");
  await assert.rejects(acceptCommand(w.root, ["0001", "--head", head], w.opts), /strands not Done: 0001\/A/);
  // The strand's PR merged: Done from the merge, with nothing stamped in its brief.
  w.prs[0]!.state = "MERGED";
  resetGithubMemory();
  const out = await acceptCommand(w.root, ["0001", "--head", head], w.opts);
  assert.match(out, /^0001 accepted at [0-9a-f]{40}; the head is unchanged/);
  assert.equal(w.headOf("braid/0001-alpha"), head);
});

test("the dsyv case: an early PR from the braid branch merged while a strand is open doesn't make the braid Done, and gives no accept hint", async () => {
  const w = world();
  w.prs.push({ number: 7, branch: "braid/0001-alpha", base: "main", state: "MERGED", checks: "SUCCESS", mergeable: "MERGEABLE" });
  resetGithubMemory();
  const status = await statusCommand(w.root, ["0001"], w.opts);
  assert.match(status, /^0001  In Progress  /m);
  assert.doesNotMatch(status, /run braid accept/);
  resetGithubMemory();
  await assert.rejects(acceptCommand(w.root, ["0001"], w.opts), /PR #7 merged into main while strands were open \(0001\/A\), so it doesn't make 0001 Done/);
});

test("refusals for no PR, a closed PR, a merged story without Done, and bad arguments", async () => {
  const w = world();
  w.prs.splice(0, 2);
  await assert.rejects(acceptCommand(w.root, ["0001/A"], w.opts), /0001\/A not accepted: it has no PR/);
  w.prs.push({ number: 8, branch: "braid/0001/A-first", base: "braid/0001-alpha", state: "CLOSED", checks: "SUCCESS", mergeable: "MERGEABLE" });
  resetGithubMemory();
  await assert.rejects(acceptCommand(w.root, ["0001/A"], w.opts), /PR #8 was closed without merging/);
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

test("a story accepted without --review says the coordinator reviewed it, and the comment is posted on its PR; --log is refused for a story", async () => {
  const w = world();
  const head = w.headOf("braid/0002-story");
  const logFile = join(w.root, "..", "entry2.md");
  writeFileSync(logFile, "0002 ok.\n");
  await assert.rejects(acceptCommand(w.root, ["0002", "--head", head, "--log", logFile, "--thread", "mcp:launch:abcdef0123"], w.opts), /--log is for a strand/);
  await acceptCommand(w.root, ["0002", "--head", head, "--thread", "mcp:launch:abcdef0123"], w.opts);
  assert.deepEqual(w.comments, [`6: Accepted: 0002 at ${head.slice(0, 7)}; review: reviewed by the coordinator; coordinator thread mcp:launch:abcdef0123.`]);
  assert.equal(w.headOf("braid/0002-story"), head);
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
  assert.match(out, /0002 accepted at /);
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
