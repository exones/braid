import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { after, beforeEach, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const scratch = mkdtempSync(join(tmpdir(), "braid-start-"));
after(() => rmSync(scratch, { recursive: true, force: true, maxRetries: 20, retryDelay: 250 }));

const load = (path: string) => import(pathToFileURL(fileURLToPath(new URL(path, import.meta.url))).href);
const { startCommand, worktreesDir } = (await load("../dist/commands/start.js")) as {
  startCommand: (root: string, args: string[], src: object, env: Record<string, string>) => Promise<string>;
  worktreesDir: (env: Record<string, string>) => string;
};
const { cleanCommand } = (await load("../dist/commands/clean.js")) as {
  cleanCommand: (root: string, args: string[], src: object, env: Record<string, string>) => Promise<string>;
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
const gone = (root: string, branch: string) => git(root, "branch", "--list", branch) === "";

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

const { agentsDirs } = (await load("../dist/braids/worktree-folders.js")) as { agentsDirs: (root: string, env: Record<string, string>) => string[] };

/** Runs `body` with a project list in a scratch home (homedir() follows HOME and USERPROFILE). */
async function listed<T>(projects: { name: string; path: string }[], body: () => Promise<T> | T): Promise<T> {
  const home = join(scratch, `home${++n}`);
  mkdirSync(join(home, ".braid"), { recursive: true });
  writeFileSync(join(home, ".braid", "projects.json"), JSON.stringify({ version: 1, projects }));
  const saved = { HOME: process.env["HOME"], USERPROFILE: process.env["USERPROFILE"] };
  process.env["HOME"] = home;
  process.env["USERPROFILE"] = home;
  try {
    return await body();
  } finally {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) {
        delete process.env[k];
      } else {
        process.env[k] = v;
      }
    }
  }
}

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
