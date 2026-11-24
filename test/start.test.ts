import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { test } from "node:test";
import { agentsDirs, git, gone, listed, load, repo, scratch, src, startCommand, worktreesDir } from "./support/start-fixtures.ts";

// Starting items: `braid start`. The `braid clean` tests are in start-clean.test.ts.

test("start creates the strand branch from the braid tip, pushes it and adds a worktree", async () => {
  const { root, env, wt } = repo();
  const tipCommit = git(root, "rev-parse", "braid/0001-alpha");
  const out = await startCommand(root, ["0001/B", "--thread", "mcp:launch:coord1234"], src(), env);
  const folder = join(wt, "proj", "0001-B");
  assert.equal(out, `branch braid/0001/B-second-one\ncommit ${tipCommit}\nfolder ${folder}\n`);
  // The start is an event on the record branch; no brief is written.
  const life = JSON.parse(git(root, "show", "origin/braid-requests:lifecycle/0001-B.json")) as { id: string; events: { kind: string; thread: string | null; branch: string }[] };
  assert.deepEqual([life.id, life.events.map((e) => [e.kind, e.thread, e.branch])], ["0001/B", [["started", "mcp:launch:coord1234", "braid/0001/B-second-one"]]]);
  assert.equal(git(root, "log", "-1", "--format=%s", "origin/braid-requests"), "docs(record): 0001/B started");
  assert.equal(git(folder, "rev-parse", "--abbrev-ref", "HEAD"), "braid/0001/B-second-one");
  assert.equal(git(folder, "rev-parse", "HEAD"), tipCommit);
  assert.equal(git(root, "ls-remote", "--heads", "origin", "braid/0001/B-second-one").split("\t")[0], tipCommit);
  assert.equal(git(folder, "rev-parse", "--abbrev-ref", "@{upstream}"), "origin/braid/0001/B-second-one");
  assert.equal(git(folder, "status", "--porcelain"), "");
  assert.equal(git(root, "rev-parse", "--abbrev-ref", "HEAD"), "main");
});

test("start refuses a strand that is not ready and --force starts it", async () => {
  const { root, env, wt } = repo();
  await assert.rejects(startCommand(root, ["0001/C"], src(), env), /0001\/C is not ready: blocked by 0001\/B/);
  await assert.rejects(startCommand(root, ["0001/A"], src(), env), /0001\/A is not ready: done/);
  assert.equal(existsSync(join(wt, "proj", "0001-C")), false);
  assert.equal(git(root, "ls-remote", "--heads", "origin", "braid/0001/C-third"), "");
  await startCommand(root, ["0001/C", "--force"], src(), env);
  assert.ok(existsSync(join(wt, "proj", "0001-C", "BRAID.md")));
});

test("start refuses a strand whose branch exists without its worktree, and an existing folder, creating nothing", async () => {
  const { root, env, wt } = repo();
  await startCommand(root, ["1/B"], src(), env);
  git(root, "worktree", "remove", join(wt, "proj", "0001-B"));
  await assert.rejects(startCommand(root, ["0001/B", "--force"], src(), env), /already has the branch/);
  mkdirSync(join(wt, "proj", "0001-C"), { recursive: true });
  await assert.rejects(startCommand(root, ["0001/C", "--force"], src(), env), /already exists/);
  assert.equal(git(root, "ls-remote", "--heads", "origin", "braid/0001/C-third"), "");
});

test("start refuses when the braid has no branch, and bad ids", async () => {
  const { root, env } = repo();
  git(root, "branch", "-D", "braid/0001-alpha");
  git(root, "update-ref", "-d", "refs/remotes/origin/braid/0001-alpha");
  await assert.rejects(startCommand(root, ["0001/B"], src(), env), /braid 0001 has no branch/);
  await assert.rejects(startCommand(root, ["0001"], src(), env), /has strands: start one of them/);
  await assert.rejects(startCommand(root, ["0001/Z"], src(), env), /no strand 0001\/Z/);
  await assert.rejects(startCommand(root, ["nope"], src(), env), /usage: braid start/);
});

test("a story gets braid/<number>-<slug> from main", async () => {
  const { root, env, wt } = repo(false);
  const mainCommit = git(root, "rev-parse", "main");
  const out = await startCommand(root, ["0002"], src(), env);
  assert.equal(out, `branch braid/0002-story\ncommit ${mainCommit}\nfolder ${join(wt, "proj", "0002")}\n`);
  assert.equal(git(root, "ls-remote", "--heads", "origin", "braid/0002-story").split("\t")[0], mainCommit);
});

test("from inside a worktree, the folder is still named after the main checkout", async () => {
  const { root, env, wt } = repo();
  const inner = join(wt, "elsewhere");
  git(root, "worktree", "add", "-q", "--detach", inner);
  await startCommand(inner, ["0001/B"], src(), env);
  assert.ok(existsSync(join(wt, "proj", "0001-B")));
});

test("the worktree folder is BRAID_WORKTREES_DIR, else braid-worktrees in the home folder", () => {
  assert.equal(worktreesDir({ BRAID_WORKTREES_DIR: join(scratch, "x") }), join(scratch, "x"));
  assert.match(worktreesDir({}).replace(/\\/g, "/"), /\/braid-worktrees$/);
  assert.match(worktreesDir({ BRAID_WORKTREES_DIR: "" }).replace(/\\/g, "/"), /\/braid-worktrees$/);
});

test("start --review is gone: it fails naming braid review and creates nothing", async () => {
  const { root, env, wt } = repo();
  await startCommand(root, ["0001/B"], src(), env);
  const open = { number: 9, url: "https://github.com/o/r/pull/9", state: "OPEN", headRefName: "braid/0001/B-second-one", statusCheckRollup: [] };
  const before = git(root, "worktree", "list", "--porcelain");
  await assert.rejects(startCommand(root, ["0001/B", "--review"], src([open]), env), /no --review option: .*braid review <id> --thread <thread id>\. Nothing was created/);
  await assert.rejects(startCommand(root, ["0001/C", "--review", "--force"], src([open]), env), /braid review/);
  assert.equal(git(root, "worktree", "list", "--porcelain"), before, "no worktree was added");
  assert.equal(existsSync(join(wt, "proj", "0001-B-review")), false);
  assert.equal(gone(root, "braid/0001/C-third"), true, "no branch was made");
});


test("a planned story's pushed branch gets its worktree, tracking origin/; a local-only branch is checked out as is", async () => {
  const { root, env, wt } = repo(false);
  const planned = git(root, "rev-parse", "main");
  git(root, "push", "-q", "origin", "main:refs/heads/braid/0002-story");
  git(root, "fetch", "-q", "origin");
  const out = await startCommand(root, ["0002"], src(), env);
  const folder = join(wt, "proj", "0002");
  assert.equal(out, "branch braid/0002-story (existing)"+"\n"+"commit " + planned + "\n"+"folder " + folder + "\n");
  assert.equal(git(folder, "rev-parse", "--abbrev-ref", "HEAD"), "braid/0002-story");
  assert.equal(git(folder, "rev-parse", "--abbrev-ref", "@{upstream}"), "origin/braid/0002-story");
  // A local branch only.
  const b = repo(false);
  git(b.root, "branch", "braid/0002-story");
  await startCommand(b.root, ["0002"], src(), b.env);
  assert.equal(git(join(b.wt, "proj", "0002"), "rev-parse", "--abbrev-ref", "HEAD"), "braid/0002-story");
});

test("a story with an existing branch is still refused with a PR open, a worktree, or a status other than To Do", async () => {
  const a = repo(false);
  git(a.root, "push", "-q", "origin", "main:refs/heads/braid/0002-story");
  const pr = { number: 7, url: "u/7", state: "OPEN", headRefName: "braid/0002-story", statusCheckRollup: [] };
  await assert.rejects(startCommand(a.root, ["0002"], src([pr]), a.env), /PR #7 is open/);
  mkdirSync(join(a.wt, "proj", "0002"), { recursive: true });
  await assert.rejects(startCommand(a.root, ["0002"], src(), a.env), /already exists/);
  const c = repo(false);
  git(c.root, "push", "-q", "origin", "main:refs/heads/braid/0002-story");
  writeFileSync(join(c.root, "braids/0002-story/brief.md"), readFileSync(join(c.root, "braids/0002-story/brief.md"), "utf8").replace("status: To Do", "status: In Progress"));
  await assert.rejects(startCommand(c.root, ["0002"], src(), c.env), /status In Progress/);
  // Checked out in a worktree already.
  const d = repo(false);
  git(d.root, "branch", "braid/0002-story");
  git(d.root, "worktree", "add", "-q", join(d.wt, "elsewhere"), "braid/0002-story");
  await assert.rejects(startCommand(d.root, ["0002"], src(), d.env), /checked out in a worktree/);
});


test("a second start of a strand says already started and creates nothing", async () => {
  const { root, env, wt } = repo();
  const first = await startCommand(root, ["0001/B"], src(), env);
  const before = git(root, "worktree", "list", "--porcelain");
  // Without --force: the pushed branch would make a fresh start look not ready.
  const second = await startCommand(root, ["0001/B"], src(), env);
  const folder = join(wt, "proj", "0001-B");
  assert.equal(second, first.replace("braid/0001/B-second-one", "braid/0001/B-second-one (already started)"));
  assert.equal(git(root, "worktree", "list", "--porcelain"), before);
  // Work on the branch is still "at or after" the base.
  git(folder, "commit", "-q", "--allow-empty", "-m", "work");
  assert.equal(await startCommand(root, ["0001/B"], src(), env), `branch braid/0001/B-second-one (already started)\ncommit ${git(folder, "rev-parse", "HEAD")}\nfolder ${folder}\n`);
});

test("a second start of a planned story says already started", async () => {
  const { root, env, wt } = repo(false);
  git(root, "push", "-q", "origin", "main:refs/heads/braid/0002-story");
  git(root, "fetch", "-q", "origin");
  await startCommand(root, ["0002"], src(), env);
  git(root, "commit", "-q", "--allow-empty", "-m", "main moves on");
  const folder = join(wt, "proj", "0002");
  assert.equal(await startCommand(root, ["0002"], src(), env), `branch braid/0002-story (already started)\ncommit ${git(folder, "rev-parse", "HEAD")}\nfolder ${folder}\n`);
  // A story made by start itself, then started again.
  const b = repo(false);
  await startCommand(b.root, ["0002"], src(), b.env);
  assert.match(await startCommand(b.root, ["0002"], src(), b.env), /^branch braid\/0002-story \(already started\)/);
});

test("a start whose branch is in another folder or off its base fails and says what it found", async () => {
  const a = repo();
  git(a.root, "branch", "braid/0001/B-second-one");
  git(a.root, "worktree", "add", "-q", join(a.wt, "elsewhere"), "braid/0001/B-second-one");
  await assert.rejects(startCommand(a.root, ["0001/B"], src(), a.env), /already has the branch braid\/0001\/B-second-one, checked out in a worktree at .*elsewhere, not in .*0001-B; nothing was created/);
  const b = repo();
  await startCommand(b.root, ["0001/B"], src(), b.env);
  git(join(b.wt, "proj", "0001-B"), "reset", "-q", "--hard", "HEAD~1");
  await assert.rejects(startCommand(b.root, ["0001/B"], src(), b.env), /does not contain its base braid\/0001-alpha/);
});

test("two listed projects with one folder name get different worktrees folders; an unlisted repository keeps the folder name", async () => {
  const a = repo();
  const b = repo();
  assert.equal(basename(a.root), basename(b.root));
  await listed(
    [
      { name: "proj", path: a.root },
      { name: "proj-b", path: b.root },
    ],
    async () => {
      assert.deepEqual(agentsDirs(a.root, a.env), [join(a.wt, "proj")]);
      assert.deepEqual(agentsDirs(b.root, b.env), [join(b.wt, "proj-b"), join(b.wt, "proj")]);
      assert.deepEqual(agentsDirs(a.root, { BRAID_WORKTREES_DIR: a.wt }), agentsDirs(a.root, a.env));
      const same = { BRAID_WORKTREES_DIR: a.wt };
      assert.notEqual(agentsDirs(a.root, same)[0], agentsDirs(b.root, same)[0]);
      await startCommand(b.root, ["0001/B"], src(), same);
      assert.ok(existsSync(join(a.wt, "proj-b", "0001-B")));
      assert.equal(existsSync(join(a.wt, "proj", "0001-B")), false, "the other project's folder is not used");
    },
  );
  // Not in the list: the folder name, and from a worktree too.
  await listed([], () => {
    assert.deepEqual(agentsDirs(a.root, a.env), [join(a.wt, "proj")]);
  });
});

test("a worktree of the old folder placed by a thread: the board counts it as an agent when the project name differs", async () => {
  const { root, env, wt } = repo();
  await listed([], () => startCommand(root, ["0001/B"], src(), env));
  await listed([{ name: "renamed", path: root }], async () => {
    await startCommand(root, ["0001/C", "--force"], src(), env);
    const t3 = (await load("../../dist/board/t3.js")) as { readT3(root: string, o: { run: unknown; ttlMs: number; project: string }): Promise<{ threads: Map<string, { id: string }[]> }> };
    const where: Record<string, string> = {
      old: join(wt, "proj", "0001-B"),
      fresh: join(wt, "renamed", "0001-C"),
      other: join(wt, "elsewhere", "0001-A"),
      nested: join(wt, "proj", "0001-B", "sub", "0001-A"),
    };
    const run = (_r: string, args: readonly string[]) => {
      const out = args[1] === "list" ? Object.keys(where).map((threadId) => ({ threadId, status: "running" })) : { thread: { worktreePath: where[args[2] ?? ""] ?? null, pendingRequestCount: 0 } };
      return Promise.resolve({ status: 0, stdout: JSON.stringify(out), stderr: "" });
    };
    const saved = process.env["BRAID_WORKTREES_DIR"];
    process.env["BRAID_WORKTREES_DIR"] = wt;
    try {
      const read = await t3.readT3(root, { run, ttlMs: 0, project: root });
      assert.deepEqual(read.threads.get("0001/B")?.map((t) => t.id), ["old"]);
      assert.deepEqual(read.threads.get("0001/C")?.map((t) => t.id), ["fresh"]);
      assert.equal(read.threads.has("0001/A"), false);
    } finally {
      if (saved === undefined) {
        delete process.env["BRAID_WORKTREES_DIR"];
      } else {
        process.env["BRAID_WORKTREES_DIR"] = saved;
      }
    }
  });
});

test("a projects.json braid can't read falls back to the folder name, and start still works", async () => {
  const { root, env, wt } = repo();
  await listed("{ not json", async () => {
    assert.deepEqual(agentsDirs(root, env), [join(wt, "proj")]);
    await startCommand(root, ["0001/B"], src(), env);
    assert.ok(existsSync(join(wt, "proj", "0001-B")));
  });
});

test("a project name that differs from the folder name only by case is one folder on Windows, two on Linux", async () => {
  const { root, env, wt } = repo();
  await listed([{ name: "PROJ", path: root }], () => {
    const dirs = agentsDirs(root, env);
    assert.equal(dirs.length, process.platform === "win32" ? 1 : 2);
    assert.equal(dirs.at(-1), join(wt, "proj"));
  });
});
