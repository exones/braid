import assert from "node:assert/strict";
import { existsSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { pathToFileURL } from "node:url";
import { cleanCommand, git, gone, load, repo, src, startCommand } from "./support/start-fixtures.ts";

// `braid clean` on worktrees with checked-out submodules: removed once nothing would be lost, kept with a line naming the submodule otherwise.
// Fixture repositories only, in the scratch folder; local submodules need protocol.file.allow=always.

const { failRemovalForTest } = (await load("../../dist/braids/remove-worktree.js")) as {
  failRemovalForTest: (hook: ((step: "deinit" | "remove", path: string) => boolean) | undefined) => void;
};

const file = ["-c", "protocol.file.allow=always"];
const merged = (n: number, branch: string) => ({ number: n, url: `https://github.com/o/r/pull/${n}`, state: "MERGED", headRefName: branch, mergedAt: "2026-11-14T00:00:00Z", statusCheckRollup: [] });

/** A bare remote at `<base>/<name>.git` with one commit (a file `<name>.txt`), and optionally a submodule. */
function remote(base: string, name: string, sub?: { path: string; url: string }): string {
  const work = join(base, `${name}-work`);
  git(base, "init", "-q", "--bare", `${name}.git`);
  git(base, "init", "-q", "-b", "main", work);
  git(work, "config", "user.email", "t@example.com");
  git(work, "config", "user.name", "t");
  writeFileSync(join(work, `${name}.txt`), name);
  if (sub !== undefined) {
    git(work, ...file, "submodule", "add", "-q", sub.url, sub.path);
  }
  git(work, "add", "-A");
  git(work, "commit", "-q", "-m", name);
  const url = pathToFileURL(join(base, `${name}.git`)).href;
  git(work, "push", "-q", url, "main");
  return url;
}

const init = (dir: string) => git(dir, ...file, "submodule", "update", "-q", "--init", "--recursive");

/**
 * Braid 0001 whose braid branch has a submodule `lib` with a nested submodule `nested`; the main checkout has them initialised.
 * Strand A (merged on GitHub) and, with `other`, strand C (not merged) are started, their submodules initialised.
 */
async function withSubmodules(other = false) {
  const r = repo();
  const base = dirname(r.root);
  const nested = remote(base, "nested");
  const lib = remote(base, "lib", { path: "nested", url: nested });
  git(r.root, "checkout", "-q", "braid/0001-alpha");
  git(r.root, ...file, "submodule", "add", "-q", lib, "lib");
  init(r.root);
  git(r.root, "commit", "-q", "-m", "add lib");
  git(r.root, "push", "-q", "origin", "braid/0001-alpha");
  git(r.root, "checkout", "-q", "main");
  for (const l of other ? ["A", "C"] : ["A"]) {
    await startCommand(r.root, [`0001/${l}`, "--force"], src(), r.env);
  }
  git(r.root, "merge", "-q", "--no-ff", "-m", "merge braid", "braid/0001-alpha");
  init(r.root);
  const a = join(r.wt, "proj", "0001-A");
  init(a);
  const c = join(r.wt, "proj", "0001-C");
  if (other) {
    init(c);
  }
  return { ...r, a, c, prs: [merged(5, "braid/0001/A-first")] };
}

/** What must stay as it is in a checkout clean doesn't remove: its submodules' status and their files. */
const snapshot = (dir: string) => ({
  status: git(dir, "submodule", "status", "--recursive"),
  lib: readdirSync(join(dir, "lib")).sort(),
  nested: readdirSync(join(dir, "lib", "nested")).sort(),
});

test("clean removes a merged worktree with submodules, its submodule data too, and leaves the main checkout's and another worktree's submodules alone", async () => {
  const { root, env, a, c, prs } = await withSubmodules(true);
  const mainBefore = snapshot(root);
  const otherBefore = snapshot(c);
  assert.ok(existsSync(join(a, "lib", "nested", "nested.txt")));
  const admin = join(root, ".git", "worktrees", "0001-A");
  assert.ok(existsSync(join(admin, "modules")));

  const dry = await cleanCommand(root, [], src(prs), env);
  assert.match(dry, /would remove 0001\/A: worktree .*0001-A and branch braid\/0001\/A-first/);
  assert.ok(existsSync(join(a, "lib", "nested", "nested.txt")), "a dry run changes nothing");

  const out = await cleanCommand(root, ["--yes"], src(prs), env);
  assert.match(out, /removed 0001\/A: worktree .*0001-A and branch/);
  assert.equal(existsSync(a), false);
  assert.equal(existsSync(admin), false, "the worktree's submodule data under .git/worktrees goes with it");
  assert.ok(gone(root, "braid/0001/A-first"));

  assert.deepEqual(snapshot(root), mainBefore, "the main checkout's submodules are untouched");
  assert.ok(existsSync(join(root, "lib", "nested", "nested.txt")));
  assert.deepEqual(snapshot(c), otherBefore, "the kept worktree's submodules are untouched");
  assert.ok(existsSync(join(c, "lib", "lib.txt")));
});

const kept: { name: string; make: (a: string) => void; line: RegExp }[] = [
  { name: "an uncommitted change in a submodule", make: (a) => writeFileSync(join(a, "lib", "lib.txt"), "changed"), line: /submodule lib has uncommitted changes or untracked files/ },
  { name: "an untracked file in a submodule", make: (a) => writeFileSync(join(a, "lib", "new.txt"), "x"), line: /submodule lib has uncommitted changes or untracked files/ },
  {
    name: "a commit in a submodule that is on no remote",
    make: (a) => {
      git(join(a, "lib"), "-c", "user.email=t@example.com", "-c", "user.name=t", "commit", "-q", "--allow-empty", "-m", "local only");
    },
    line: /submodule lib has commits that are on no remote/,
  },
  { name: "a change in a nested submodule", make: (a) => writeFileSync(join(a, "lib", "nested", "nested.txt"), "changed"), line: /submodule lib\/nested has uncommitted changes or untracked files/ },
  { name: "an uncommitted change in the worktree itself", make: (a) => writeFileSync(join(a, "scratch.txt"), "x"), line: /its worktree has uncommitted changes or untracked files/ },
];

for (const k of kept) {
  test(`clean keeps a merged worktree with submodules and names why: ${k.name}`, async () => {
    const { root, env, a, prs } = await withSubmodules();
    k.make(a);
    const dry = await cleanCommand(root, [], src(prs), env);
    assert.match(dry, new RegExp(`skip 0001/A: .*${k.line.source}`));
    const out = await cleanCommand(root, ["--yes"], src(prs), env);
    assert.match(out, new RegExp(`skip 0001/A: .*${k.line.source}`));
    assert.ok(existsSync(join(a, "lib", "nested", "nested.txt")), "nothing of it is removed");
    assert.equal(gone(root, "braid/0001/A-first"), false);
  });
}

for (const step of ["deinit", "remove"] as const) {
  test(`a failed ${step} keeps the worktree with a line, and a second clean finishes`, async () => {
    const { root, env, a, prs } = await withSubmodules();
    failRemovalForTest((s) => s === step);
    try {
      const out = await cleanCommand(root, ["--yes"], src(prs), env);
      assert.match(out, step === "deinit" ? /skip 0001\/A: .*its submodules could not be deinitialised/ : /skip 0001\/A: .*worktree not removed/);
      assert.doesNotMatch(out, /removed 0001\/A/);
      assert.ok(existsSync(a));
      assert.equal(gone(root, "braid/0001/A-first"), false);
    } finally {
      failRemovalForTest(undefined);
    }
    const again = await cleanCommand(root, ["--yes"], src(prs), env);
    assert.match(again, /removed 0001\/A:/);
    assert.equal(existsSync(a), false);
  });
}

test("the safe removal refuses the main checkout and the caller's checkout, and runs nothing there", async () => {
  const { root, a } = await withSubmodules();
  const { removeWorktree } = (await load("../../dist/braids/remove-worktree.js")) as {
    removeWorktree: (root: string, path: string) => { removed: boolean; why?: string };
  };
  const before = snapshot(root);
  assert.deepEqual(removeWorktree(a, root), { removed: false, why: "it is the main checkout" });
  assert.deepEqual(removeWorktree(root, root), { removed: false, why: "it is this checkout" });
  assert.deepEqual(removeWorktree(root, join(root, "lib")), { removed: false, why: "it is not a worktree of this repository" });
  assert.deepEqual(snapshot(root), before);
});
