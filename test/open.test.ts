import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

const cli = fileURLToPath(new URL("../dist/cli.js", import.meta.url));
const scratch = mkdtempSync(join(tmpdir(), "braid-open-"));
after(() => rmSync(scratch, { recursive: true, force: true }));
const home = join(scratch, "home");
mkdirSync(home);
const env: NodeJS.ProcessEnv = {
  ...process.env,
  HOME: home,
  USERPROFILE: home,
  APPDATA: join(home, "AppData"),
  LOCALAPPDATA: join(home, "AppData", "Local"),
  XDG_CONFIG_HOME: join(home, ".config"),
  GIT_CONFIG_NOSYSTEM: "1",
  GIT_AUTHOR_NAME: "t",
  GIT_AUTHOR_EMAIL: "t@example.invalid",
  GIT_COMMITTER_NAME: "t",
  GIT_COMMITTER_EMAIL: "t@example.invalid",
};

function git(cwd: string, ...args: string[]): void {
  const r = spawnSync("git", ["-c", "commit.gpgsign=false", ...args], { cwd, encoding: "utf8", env });
  assert.equal(r.status, 0, `git ${args.join(" ")}: ${r.stderr}`);
}

function braid(cwd: string, ...args: string[]) {
  return spawnSync(process.execPath, [cli, ...args], { encoding: "utf8", cwd, env });
}

const brief = (id: string, status: string, goal = `Goal of ${id}.`) =>
  `---\nid: '${id}'\ntitle: Title ${id}\nstatus: ${status}\n---\n\n## Goal\n\n${goal}\n\nSecond paragraph of ${id}.\n`;

function commit(root: string, files: Record<string, string>): void {
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  }
  git(root, "add", "-A");
  git(root, "commit", "-q", "-m", "change");
}

/** main: 0001 Done, 0002 Outline with strand A; branch braid/0003-b: 0003 In Progress; branch plan/c: 0004 To Do. */
function fixture(): string {
  const root = join(scratch, `repo-${readdirCount++}`);
  mkdirSync(root);
  git(root, "init", "-q", "-b", "main");
  commit(root, {
    "braids/0001-done/brief.md": brief("0001", "Done"),
    "braids/0002-outline/brief.md": brief("0002", "Outline", `${"long words ".repeat(40)}end.`),
    "braids/0002-outline/A-x/brief.md": brief("0002/A", "To Do"),
  });
  git(root, "checkout", "-q", "-b", "braid/0003-b", "main");
  commit(root, { "braids/0003-b/brief.md": brief("0003", "In Progress") });
  git(root, "checkout", "-q", "-b", "plan/c", "main");
  commit(root, { "braids/0004-c/brief.md": brief("0004", "To Do") });
  git(root, "checkout", "-q", "main");
  return root;
}
let readdirCount = 0;

test("braid list --open shows unfinished braids from main, a braid branch and a plan branch", () => {
  const root = fixture();
  const r = braid(root, "list", "--open", "--no-fetch");
  assert.equal(r.status, 0, r.stderr);
  const out = r.stdout;
  assert.doesNotMatch(out, /0001/);
  const ids = [...out.matchAll(/^(\d{4}) {2}(\S.*?) {2}Title/gm)].map((m) => `${m[1]} ${m[2]}`);
  assert.deepEqual(ids, ["0002 Outline", "0003 In Progress", "0004 To Do"]);
  assert.match(out, /0002 {2}Outline {2}Title 0002\n {2}read from: main\n/);
  assert.match(out, /0003 {2}In Progress {2}Title 0003\n {2}read from: braid\/0003-b\n\n {2}Goal of 0003\.\n/);
  assert.match(out, /0004 {2}To Do {2}Title 0004\n {2}read from: plan\/c\n/);
  assert.match(out, /^ {2}0002\/A {2}To Do +- +Title 0002\/A$/m);
  assert.doesNotMatch(out, /Second paragraph/);
  const long = /^ {2}(long words .*)$/m.exec(out)?.[1] ?? "";
  assert.ok(long.endsWith("...") && long.length <= 304, long);
});

test("a plan branch never overrides another source, and a merged one adds nothing", () => {
  const root = fixture();
  git(root, "checkout", "-q", "plan/c");
  commit(root, { "braids/0003-b/brief.md": brief("0003", "To Do", "Plan copy.") });
  git(root, "checkout", "-q", "main");
  const out = braid(root, "list", "--open", "--no-fetch").stdout;
  assert.match(out, /0003 {2}In Progress {2}Title 0003\n {2}read from: braid\/0003-b\n/);
  git(root, "merge", "-q", "--no-ff", "-m", "merge", "plan/c");
  assert.match(braid(root, "list", "--open", "--no-fetch").stdout, /0004 {2}To Do {2}Title 0004\n {2}read from: main\n/);
});

test("plain braid list is unchanged and list --open refuses other arguments", () => {
  const root = fixture();
  const r = braid(root, "list");
  assert.equal(r.status, 0);
  assert.match(r.stdout, /^0001 {2}Done {9}Title 0001\n0002 {2}Outline {6}Title 0002\n/);
  assert.doesNotMatch(r.stdout, /0003|0004|read from/);
  assert.equal(braid(root, "list", "--open", "x").status, 1);
});

test("braid new ends with the count of open braids, itself excluded", () => {
  const root = fixture();
  const r = braid(root, "new", "Fresh", "--no-fetch");
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout, "Created 0005 braids/0005-fresh\nOpen braids: 3 (braid list --open)\n");
});

test("a failed fetch warns and goes on with what is local", () => {
  const root = fixture();
  git(root, "remote", "add", "origin", join(scratch, "no-such-remote"));
  const r = braid(root, "list", "--open");
  assert.equal(r.status, 0);
  assert.match(r.stderr, /^warning: git fetch failed/);
  assert.match(r.stdout, /0004/);
});

/** Commits `files` on a new branch off main with the given commit time, then returns its commit and goes back to main. */
function commitAt(root: string, branch: string, date: string, files: Record<string, string>): string {
  const dated = { ...env, GIT_COMMITTER_DATE: date, GIT_AUTHOR_DATE: date };
  const run = (...args: string[]) => {
    const r = spawnSync("git", ["-c", "commit.gpgsign=false", ...args], { cwd: root, encoding: "utf8", env: dated });
    assert.equal(r.status, 0, `git ${args.join(" ")}: ${r.stderr}`);
    return r.stdout.trim();
  };
  run("checkout", "-q", "-b", branch, "main");
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  }
  run("add", "-A");
  run("commit", "-q", "-m", "change");
  const sha = run("rev-parse", "HEAD");
  run("checkout", "-q", "main");
  return sha;
}

test("a braid found only on origin/plan/* is listed with that source", () => {
  const root = fixture();
  const sha = commitAt(root, "tmp", "2026-01-01T00:00:00Z", { "braids/0005-r/brief.md": brief("0005", "To Do") });
  git(root, "update-ref", "refs/remotes/origin/plan/r", sha);
  git(root, "branch", "-q", "-D", "tmp");
  assert.match(braid(root, "list", "--open", "--no-fetch").stdout, /0005 {2}To Do {2}Title 0005\n {2}read from: origin\/plan\/r\n/);
});

test("two plan copies of one braid: the newest wins, a local branch on a tie", () => {
  const root = fixture();
  const at = (title: string) => ({ "braids/0006-d/brief.md": brief("0006", "To Do", title) });
  commitAt(root, "plan/d", "2026-01-01T00:00:00Z", at("Local copy."));
  const remote = commitAt(root, "tmp", "2026-02-01T00:00:00Z", at("Remote newer copy."));
  git(root, "update-ref", "refs/remotes/origin/plan/d", remote);
  git(root, "branch", "-q", "-D", "tmp");
  let out = braid(root, "list", "--open", "--no-fetch").stdout;
  assert.match(out, /read from: origin\/plan\/d\n\n {2}Remote newer copy\./);
  // Same commit time: the local branch wins.
  const tie = commitAt(root, "tmp", "2026-01-01T00:00:00Z", at("Remote tied copy."));
  git(root, "update-ref", "refs/remotes/origin/plan/d", tie);
  git(root, "branch", "-q", "-D", "tmp");
  out = braid(root, "list", "--open", "--no-fetch").stdout;
  assert.match(out, /read from: plan\/d\n\n {2}Local copy\./);
});

test("a plan branch merged into HEAD adds nothing even when its braid files are gone from HEAD", () => {
  const root = fixture();
  commitAt(root, "plan/m", "2026-01-01T00:00:00Z", { "braids/0007-m/brief.md": brief("0007", "To Do") });
  git(root, "merge", "-q", "--no-ff", "-m", "merge", "plan/m");
  git(root, "rm", "-q", "-r", "braids/0007-m");
  git(root, "commit", "-q", "-m", "remove");
  assert.doesNotMatch(braid(root, "list", "--open", "--no-fetch").stdout, /0007/);
});
