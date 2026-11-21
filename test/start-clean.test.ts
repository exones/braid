import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { cleanCommand, git, gone, listed, repo, resetGithubMemory, src, startCommand } from "./support/start-fixtures.ts";

// `braid clean`: removing merged items' worktrees and branches. The `braid start` tests are in start.test.ts.

const merged = (n: number, branch: string) => ({ number: n, url: `https://github.com/o/r/pull/${n}`, state: "MERGED", headRefName: branch, mergedAt: "2026-11-14T00:00:00Z", statusCheckRollup: [] });

/** Braid 0001 with A and B started (A, B Done and merged on GitHub), and C started but unmerged. */
async function started() {
  const r = repo();
  for (const l of ["A", "B", "C"]) {
    await startCommand(r.root, [`0001/${l}`, "--force"], src(), r.env);
  }
  // The braid branch merges into main with a merge commit: A, B and C are then in this checkout's HEAD.
  git(r.root, "merge", "-q", "--no-ff", "-m", "merge braid", "braid/0001-alpha");
  const prs = [merged(5, "braid/0001/A-first"), merged(6, "braid/0001/B-second-one")];
  return { ...r, prs };
}


test("clean is a dry run: it lists merged items' worktrees and branches and changes nothing", async () => {
  const { root, env, wt, prs } = await started();
  const out = await cleanCommand(root, [], src(prs), env);
  assert.match(out, /would remove 0001\/A: worktree .*0001-A and branch braid\/0001\/A-first \(PR #5 merged\)/);
  assert.doesNotMatch(out, /0001\/C/);
  assert.match(out, /dry run: run again with --yes/);
  assert.ok(existsSync(join(wt, "proj", "0001-A")));
  assert.equal(gone(root, "braid/0001/A-first"), false);
});

test("clean --yes removes merged worktrees and local branches, not unmerged items or remote branches", async () => {
  const { root, env, wt, prs } = await started();
  const out = await cleanCommand(root, ["--yes"], src(prs), env);
  assert.match(out, /removed 0001\/A:/);
  assert.equal(existsSync(join(wt, "proj", "0001-A")), false);
  assert.ok(gone(root, "braid/0001/A-first"));
  assert.ok(existsSync(join(wt, "proj", "0001-C")));
  assert.equal(gone(root, "braid/0001/C-third"), false);
  assert.notEqual(git(root, "ls-remote", "--heads", "origin", "braid/0001/A-first"), "");
  assert.match(await cleanCommand(root, ["--yes"], src(prs), env), /nothing to clean/);
});

test("clean keeps a worktree with changes and a branch with commits that are not in HEAD", async () => {
  const { root, env, wt, prs } = await started();
  const a = join(wt, "proj", "0001-A");
  writeFileSync(join(a, "scratch.txt"), "x");
  git(join(wt, "proj", "0001-B"), "commit", "-q", "--allow-empty", "-m", "unpushed work");
  const out = await cleanCommand(root, ["0001", "--yes"], src(prs), env);
  assert.match(out, /skip 0001\/A: .*worktree not removed/);
  assert.ok(existsSync(a));
  assert.match(out, /skip 0001\/B: .*merged on GitHub, but its commits are not in this checkout/);
  assert.equal(gone(root, "braid/0001/B-second-one"), false);
});

test("clean keeps a squash-merged branch that is pushed and tracked, and removes a merge-commit one", async () => {
  const { root, env, wt, prs } = await started();
  const b = join(wt, "proj", "0001-B");
  writeFileSync(join(b, "work.txt"), "work");
  git(b, "add", "work.txt");
  git(b, "commit", "-q", "-m", "work");
  git(b, "push", "-q");
  // upstream has the commit, so git branch -d alone would accept it
  git(root, "merge", "-q", "--squash", "braid/0001/B-second-one");
  git(root, "commit", "-q", "-m", "squash B");
  const dry = await cleanCommand(root, [], src(prs), env);
  assert.match(dry, /would remove 0001\/A:/);
  assert.match(dry, /skip 0001\/B: .*squash-merged/);
  const out = await cleanCommand(root, ["--yes"], src(prs), env);
  assert.match(out, /removed 0001\/A:/);
  assert.match(out, /skip 0001\/B: .*delete it by hand/);
  assert.ok(gone(root, "braid/0001/A-first"));
  assert.equal(gone(root, "braid/0001/B-second-one"), false);
  assert.ok(existsSync(b));
  assert.equal(git(b, "log", "-1", "--format=%s"), "work");
});

test("clean leaves a worktree outside the worktree folder unless the strand is named", async () => {
  const { root, env, wt, prs } = await started();
  git(root, "worktree", "remove", join(wt, "proj", "0001-A"));
  const elsewhere = join(wt, "mine");
  git(root, "worktree", "add", "-q", elsewhere, "braid/0001/A-first");
  const out = await cleanCommand(root, ["0001", "--yes"], src(prs), env);
  assert.match(out, /skip 0001\/A: .*not in the braid worktree folder/);
  assert.ok(existsSync(elsewhere));
  await cleanCommand(root, ["0001/A", "--yes"], src(prs), env);
  assert.equal(existsSync(elsewhere), false);
  assert.ok(gone(root, "braid/0001/A-first"));
});

test("clean never removes the checked-out branch, and refuses when GitHub can't be read or the ids are bad", async () => {
  const { root, env, wt, prs } = await started();
  git(root, "worktree", "remove", join(wt, "proj", "0001-A"));
  git(root, "checkout", "-q", "braid/0001/A-first");
  assert.match(await cleanCommand(root, ["--yes"], src(prs), env), /skip 0001\/A: .*checked out in this checkout/);
  assert.equal(gone(root, "braid/0001/A-first"), false);
  const down = { ...src(), gh: () => ({ status: 1, stdout: "", stderr: "gh auth login needed" }) };
  await assert.rejects(cleanCommand(root, ["--yes"], down, env), /GitHub could not be read/);
  await assert.rejects(cleanCommand(root, ["--nope"], src(prs), env), /usage: braid clean/);
});

test("clean says a worktree is still in use and keeps it (Windows holds a working directory)", { skip: process.platform !== "win32" }, async () => {
  const { root, env, wt, prs } = await started();
  const a = join(wt, "proj", "0001-A");
  const holder = spawn(process.execPath, ["-e", "setTimeout(() => {}, 20000)"], { cwd: a, stdio: "ignore" });
  try {
    await new Promise((r) => setTimeout(r, 500));
    const out = await cleanCommand(root, ["--yes"], src(prs), env);
    assert.match(out, /skip 0001\/A: .*still in use, retry later/);
    assert.ok(existsSync(join(a, "BRAID.md")));
    assert.equal(gone(root, "braid/0001/A-first"), false);
  } finally {
    holder.kill();
    await new Promise((r) => setTimeout(r, 300));
  }
});

test("clean still removes a leftover -review checkout of a merged item (made before reviewers were subagents)", async () => {
  const { root, env, wt } = repo();
  await startCommand(root, ["0001/B"], src(), env);
  const worker = join(wt, "proj", "0001-B");
  git(worker, "commit", "-q", "--allow-empty", "-m", "work");
  git(worker, "push", "-q");
  const head = git(worker, "rev-parse", "HEAD");
  // What `braid start 0001/B --review` used to make: a detached checkout of the PR head, and one of the braid's final PR.
  const folder = join(wt, "proj", "0001-B-review");
  git(root, "worktree", "add", "-q", "--detach", folder, head);
  const braidFolder = join(wt, "proj", "0001-review");
  git(root, "worktree", "add", "-q", "--detach", braidFolder, "braid/0001-alpha");
  const done = merged(9, "braid/0001/B-second-one");
  const dry = await cleanCommand(root, [], src([done]), env);
  assert.match(dry, /would remove 0001\/B: review checkout .*0001-B-review \(PR #9 merged\)/);
  assert.ok(existsSync(folder));
  const cleaned = await cleanCommand(root, ["--yes"], src([done]), env);
  assert.match(cleaned, /removed 0001\/B: review checkout/);
  assert.equal(existsSync(folder), false);
  assert.ok(existsSync(worker), "the worker's worktree has unmerged commits, so it stays");
  resetGithubMemory();
  const finalDone = merged(12, "braid/0001-alpha");
  const cleanedBraid = await cleanCommand(root, ["0001", "--yes"], src([done, finalDone]), env);
  assert.match(cleanedBraid, /removed 0001: review checkout .*0001-review/);
  assert.equal(existsSync(braidFolder), false);
});

test("clean removes a merged plan/ branch and its clean worktree, and skips a dirty one and one without a merged PR", async () => {
  const { root, env, wt } = await started();
  for (const slug of ["gone", "dirty", "open"]) {
    git(root, "branch", `plan/${slug}`);
  }
  git(root, "worktree", "add", "-q", join(wt, "plan-gone"), "plan/gone");
  git(root, "worktree", "add", "-q", join(wt, "plan-dirty"), "plan/dirty");
  writeFileSync(join(wt, "plan-dirty", "scratch.txt"), "x");
  const prs = [merged(30, "plan/gone"), merged(31, "plan/dirty"), { ...merged(32, "plan/open"), state: "OPEN", mergedAt: null }];
  const dry = await cleanCommand(root, [], src(prs), env);
  assert.match(dry, /would remove planning branch plan\/gone and worktree .*plan-gone \(PR #30 merged\)/);
  assert.match(dry, /skip planning branch plan\/dirty .*: its worktree has changes/);
  assert.doesNotMatch(dry, /plan\/open/);
  assert.ok(existsSync(join(wt, "plan-gone")));
  const out = await cleanCommand(root, ["--yes"], src(prs), env);
  assert.match(out, /removed planning branch plan\/gone/);
  assert.equal(existsSync(join(wt, "plan-gone")), false);
  assert.ok(gone(root, "plan/gone"));
  assert.ok(existsSync(join(wt, "plan-dirty")));
  assert.equal(gone(root, "plan/dirty"), false);
  assert.equal(gone(root, "plan/open"), false);
});

test("worktrees made under the old folder are still found by start and clean; new items go to the project folder", async () => {
  const { root, env, wt, prs } = await started();
  const legacy = join(wt, "proj");
  const old = await listed([{ name: "renamed", path: root }], async () => {
    // A second start finds the worktree where it is and creates nothing.
    const again = await startCommand(root, ["0001/C", "--force"], src(prs), env);
    assert.equal(again, `branch braid/0001/C-third (already started)\ncommit ${git(join(legacy, "0001-C"), "rev-parse", "HEAD")}\nfolder ${join(legacy, "0001-C")}\n`);
    assert.equal(existsSync(join(wt, "renamed")), false);
    // Clean removes the merged items' worktrees from the old folder and keeps the unmerged one.
    const out = await cleanCommand(root, ["--yes"], src(prs), env);
    assert.match(out, /removed 0001\/A:/);
    assert.equal(existsSync(join(legacy, "0001-A")), false);
    assert.ok(existsSync(join(legacy, "0001-C")));
    return legacy;
  });
  assert.equal(old, legacy);
});

test("a new item of a listed project goes to the project's folder, and clean removes it there", async () => {
  const { root, env, wt } = repo();
  await listed([{ name: "renamed", path: root }], async () => {
    await startCommand(root, ["0001/B"], src(), env);
    const folder = join(wt, "renamed", "0001-B");
    assert.ok(existsSync(folder));
    git(root, "merge", "-q", "--no-ff", "-m", "merge braid", "braid/0001-alpha");
    const out = await cleanCommand(root, ["--yes"], src([merged(6, "braid/0001/B-second-one")]), env);
    assert.match(out, /removed 0001\/B:/);
    assert.equal(existsSync(folder), false);
  });
});

test("clean in one listed twin leaves the other twin's worktree in the shared old folder alone", async () => {
  const a = repo();
  const b = repo();
  const env = { BRAID_WORKTREES_DIR: a.wt };
  // Before the list had names, both twins' worktrees were in <worktrees>/proj.
  await listed([], async () => {
    await startCommand(a.root, ["0001/B", "--force"], src(), env);
    await startCommand(b.root, ["0001/C", "--force"], src(), env);
  });
  const shared = join(a.wt, "proj");
  const bFolder = join(shared, "0001-C");
  assert.ok(existsSync(join(shared, "0001-B")) && existsSync(bFolder));
  await listed(
    [
      { name: "alpha", path: a.root },
      { name: "beta", path: b.root },
    ],
    async () => {
      git(a.root, "merge", "-q", "--no-ff", "-m", "merge braid", "braid/0001-alpha");
      git(b.root, "merge", "-q", "--no-ff", "-m", "merge braid", "braid/0001-alpha");
      // Both PRs read as merged for both twins; each clean may touch only its own repository's worktrees.
      const prs = [merged(6, "braid/0001/B-second-one"), merged(7, "braid/0001/C-third")];
      const out = await cleanCommand(a.root, ["--yes"], src(prs), env);
      assert.match(out, /removed 0001\/B:/);
      assert.equal(existsSync(join(shared, "0001-B")), false, "a's own old worktree is cleaned");
      assert.ok(existsSync(bFolder), "b's worktree is untouched");
      assert.equal(gone(b.root, "braid/0001/C-third"), false);
    },
  );
});
