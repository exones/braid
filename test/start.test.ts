import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, beforeEach, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const scratch = mkdtempSync(join(tmpdir(), "braid-start-"));
after(() => rmSync(scratch, { recursive: true, force: true }));

const load = (path: string) => import(pathToFileURL(fileURLToPath(new URL(path, import.meta.url))).href);
const { startCommand, worktreesDir } = (await load("../dist/commands/start.js")) as {
  startCommand: (root: string, args: string[], src: object, env: Record<string, string>) => Promise<string>;
  worktreesDir: (env: Record<string, string>) => string;
};
const { resetGithubMemory } = (await load("../dist/board/github.js")) as { resetGithubMemory: () => void };
const { resetT3Memory } = (await load("../dist/board/t3.js")) as { resetT3Memory: () => void };
beforeEach(() => {
  resetGithubMemory();
  resetT3Memory();
});

const git = (cwd: string, ...args: string[]) => {
  const r = spawnSync("git", args, { cwd, encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  return r.stdout.trim();
};
const ok = (data: unknown) => ({ status: 0, stdout: JSON.stringify(data), stderr: "" });
const src = (prs: object[] = []) => ({
  gh: () => ok(prs),
  t3: (_r: string, args: readonly string[]) => Promise.resolve(args[1] === "list" ? ok([]) : ok({ thread: { branch: null, worktreePath: null, pendingRequestCount: 0 } })),
  worktrees: () => new Map<string, string>(),
});

let n = 0;
/** A repository named `proj` with a bare local remote; braid 0001 has strands A (Done), B (ready), C (blocked by B) and a braid branch, else a story 0002. */
function repo(withStrands = true): { root: string; env: Record<string, string>; wt: string } {
  const base = join(scratch, `t${++n}`);
  const root = join(base, "proj");
  const wt = join(base, "wt");
  const put = (path: string, text: string) => {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  };
  const brief = (id: string, status: string, deps = "", order = "") =>
    `---\nid: '${id}'\ntitle: "T ${id}"\nstatus: ${status}\nlabels: []\ndependencies: [${deps}]\n${order}---\n\n## Goal\n\nx\n`;
  put("BRAID.md", "---\nmain: main\nci: none\n---\n");
  if (withStrands) {
    put("braids/0001-alpha/brief.md", brief("0001", "In Progress"));
    put("braids/0001-alpha/A-first/brief.md", brief("0001/A", "Done", "", "order: 10\n"));
    put("braids/0001-alpha/B-second-one/brief.md", brief("0001/B", "To Do", "'0001/A'", "order: 20\n"));
    put("braids/0001-alpha/C-third/brief.md", brief("0001/C", "To Do", "'0001/B'", "order: 30\n"));
  } else {
    put("braids/0002-story/brief.md", brief("0002", "To Do"));
  }
  mkdirSync(base, { recursive: true });
  git(base, "init", "-q", "--bare", "remote.git");
  git(base, "init", "-q", "-b", "main", root);
  git(root, "config", "user.email", "t@example.com");
  git(root, "config", "user.name", "t");
  git(root, "remote", "add", "origin", join(base, "remote.git"));
  git(root, "add", "-A");
  git(root, "commit", "-q", "-m", "init");
  git(root, "push", "-q", "origin", "main");
  if (withStrands) {
    git(root, "checkout", "-q", "-b", "braid/0001-alpha");
    git(root, "commit", "-q", "--allow-empty", "-m", "braid tip");
    git(root, "push", "-q", "origin", "braid/0001-alpha");
    git(root, "checkout", "-q", "main");
    git(root, "commit", "-q", "--allow-empty", "-m", "main moves on");
  }
  return { root, env: { BRAID_WORKTREES_DIR: wt }, wt };
}

test("start creates the strand branch from the braid tip, pushes it and adds a worktree", async () => {
  const { root, env, wt } = repo();
  const tipCommit = git(root, "rev-parse", "braid/0001-alpha");
  const out = await startCommand(root, ["0001/B"], src(), env);
  const folder = join(wt, "proj", "0001-B");
  assert.equal(out, `branch braid/0001/B-second-one\ncommit ${tipCommit}\nfolder ${folder}\n`);
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

test("start refuses a strand whose branch exists, and an existing folder, creating nothing", async () => {
  const { root, env, wt } = repo();
  await startCommand(root, ["1/B"], src(), env);
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
