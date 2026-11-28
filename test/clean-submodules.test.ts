import assert from "node:assert/strict";
import { existsSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { pathToFileURL } from "node:url";
import { cleanCommand, git, gone, load, repo, src, startCommand } from "./support/start-fixtures.ts";

// `braid clean` on worktrees with checked-out submodules: removed once nothing would be lost, kept with a line naming the submodule otherwise.
// Fixture repositories only, in the scratch folder; local submodules need protocol.file.allow=always.

const { failRemovalForTest, removeWorktree } = (await load("../../dist/braids/remove-worktree.js")) as {
  failRemovalForTest: (hook: ((path: string) => boolean) | undefined) => void;
  removeWorktree: (root: string, path: string) => { removed: boolean; why?: string };
};

const file = ["-c", "protocol.file.allow=always"];
const merged = (n: number, branch: string) => ({ number: n, url: `https://github.com/o/r/pull/${n}`, state: "MERGED", headRefName: branch, mergedAt: "2026-11-14T00:00:00Z", statusCheckRollup: [] });

/** A bare remote at `<base>/<name>.git` with one commit (a file `<name>.txt`), and optionally a submodule. */
function remote(base: string, name: string, sub?: { path: string; url: string }): string {
  const work = join(base, `${name}-work`);
  git(base, "init", "-q", "--bare", "-b", "main", `${name}.git`);
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

/** Each way a worktree with submodules holds work, the line clean gives, and how the test undoes it for the next one. */
const kept: { name: string; make: (a: string) => () => void; line: RegExp }[] = [
  {
    name: "an uncommitted change in a submodule",
    make: (a) => {
      writeFileSync(join(a, "lib", "lib.txt"), "changed");
      return () => git(join(a, "lib"), "checkout", "--", "lib.txt");
    },
    line: /submodule lib has uncommitted changes or untracked files/,
  },
  {
    name: "an untracked file in a submodule",
    make: (a) => {
      writeFileSync(join(a, "lib", "new.txt"), "x");
      return () => rmSync(join(a, "lib", "new.txt"));
    },
    line: /submodule lib has uncommitted changes or untracked files/,
  },
  {
    name: "a commit in a submodule that is on no remote",
    make: (a) => {
      git(join(a, "lib"), "-c", "user.email=t@example.com", "-c", "user.name=t", "commit", "-q", "--allow-empty", "-m", "local only");
      return () => git(join(a, "lib"), "reset", "-q", "--hard", "HEAD~1");
    },
    line: /submodule lib has commits that are on no remote/,
  },
  {
    name: "a change in a nested submodule",
    make: (a) => {
      writeFileSync(join(a, "lib", "nested", "nested.txt"), "changed");
      return () => git(join(a, "lib", "nested"), "checkout", "--", "nested.txt");
    },
    line: /submodule lib\/nested has uncommitted changes or untracked files/,
  },
  {
    name: "a submodule that can't be read",
    make: (a) => {
      // Windows marks the .git file hidden, which refuses an overwrite: move it aside and put a broken one in its place.
      const dotGit = join(a, "lib", ".git");
      renameSync(dotGit, `${dotGit}-saved`);
      writeFileSync(dotGit, "gitdir: ../nowhere\n");
      return () => {
        rmSync(dotGit);
        renameSync(`${dotGit}-saved`, dotGit);
      };
    },
    line: /submodule lib can't be read/,
  },
  {
    name: "an uncommitted change in the worktree itself",
    make: (a) => {
      writeFileSync(join(a, "scratch.txt"), "x");
      return () => rmSync(join(a, "scratch.txt"));
    },
    line: /its worktree has uncommitted changes or untracked files/,
  },
];

// One fixture for the whole story, as each fixture costs several git runs: the kept cases in turn, a failed removal, then the removal.
test("clean keeps a worktree with submodules while anything in it would be lost, then removes it and leaves other checkouts' submodules alone", async (t) => {
  const { root, env, a, c, prs } = await withSubmodules(true);
  const mainBefore = snapshot(root);
  const otherBefore = snapshot(c);
  const admin = join(root, ".git", "worktrees", "0001-A");
  assert.ok(existsSync(join(admin, "modules")), "the worktree's submodules keep their git dirs under .git/worktrees/0001-A/modules");

  for (const k of kept) {
    await t.test(`kept: ${k.name}`, async () => {
      const undo = k.make(a);
      try {
        const out = await cleanCommand(root, ["--yes"], src(prs), env);
        assert.match(out, new RegExp(`skip 0001/A: .*${k.line.source}`));
        assert.ok(existsSync(join(a, "lib", "nested", "nested.txt")), "nothing of it is removed");
        assert.equal(gone(root, "braid/0001/A-first"), false);
      } finally {
        undo();
      }
    });
  }

  await t.test("the safe removal refuses the main checkout, the caller's checkout and a folder that is no worktree", () => {
    assert.deepEqual(removeWorktree(a, root), { removed: false, why: "it is the main checkout" });
    assert.deepEqual(removeWorktree(root, root), { removed: false, why: "it is this checkout" });
    assert.deepEqual(removeWorktree(root, join(root, "lib")), { removed: false, why: "it is not a worktree of this repository" });
  });

  await t.test("a dry run says would remove and changes nothing", async () => {
    const dry = await cleanCommand(root, [], src(prs), env);
    assert.match(dry, /would remove 0001\/A: worktree .*0001-A and branch braid\/0001\/A-first/);
    assert.ok(existsSync(join(a, "lib", "nested", "nested.txt")));
  });

  await t.test("a failed removal keeps it with a line, never reports it removed", async () => {
    failRemovalForTest(() => true);
    try {
      const out = await cleanCommand(root, ["--yes"], src(prs), env);
      assert.match(out, /skip 0001\/A: .*worktree not removed/);
      assert.doesNotMatch(out, /removed 0001\/A/);
      assert.ok(existsSync(a));
      assert.equal(gone(root, "braid/0001/A-first"), false);
    } finally {
      failRemovalForTest(undefined);
    }
  });

  await t.test("the next clean --yes removes it, its submodule data under .git/worktrees too", async () => {
    const out = await cleanCommand(root, ["--yes"], src(prs), env);
    assert.match(out, /removed 0001\/A: worktree .*0001-A and branch/);
    assert.equal(existsSync(a), false);
    assert.equal(existsSync(admin), false);
    assert.ok(gone(root, "braid/0001/A-first"));
  });

  await t.test("the main checkout's and the kept worktree's submodules are untouched", () => {
    assert.deepEqual(snapshot(root), mainBefore);
    assert.ok(existsSync(join(root, "lib", "nested", "nested.txt")));
    assert.deepEqual(snapshot(c), otherBefore);
    assert.ok(existsSync(join(c, "lib", "lib.txt")));
  });
});