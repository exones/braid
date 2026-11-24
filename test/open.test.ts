import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

const cli = fileURLToPath(new URL("../dist/cli.js", import.meta.url));
const scratch = mkdtempSync(join(tmpdir(), "braid-open-"));
after(() => rmSync(scratch, { recursive: true, force: true, maxRetries: 20, retryDelay: 250 }));
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

/** A brief with `related` links in its front matter. */
const linked = (id: string, status: string, related: string) =>
  brief(id, status).replace(`status: ${status}\n`, `status: ${status}\nrelated: [${related}]\n`);

test("related links show both ways: back-links come from a braid branch and from a plan branch", () => {
  const root = fixture();
  git(root, "checkout", "-q", "braid/0003-b");
  commit(root, { "braids/0003-b/brief.md": linked("0003", "In Progress", "'0002'") });
  git(root, "checkout", "-q", "plan/c");
  commit(root, { "braids/0004-c/brief.md": linked("0004", "To Do", "'0002', '0003'") });
  // A malformed copy on another branch is skipped and breaks nothing for the others.
  commitAt(root, "braid/0005-bad", "2026-01-01T00:00:00Z", { "braids/0005-bad/brief.md": linked("0005", "To Do", "'0005'") });
  git(root, "checkout", "-q", "main");

  const plain = braid(root, "view", "0002");
  assert.equal(plain.status, 0, plain.stderr);
  assert.match(plain.stdout, /\nRelated: none\nStrands:\n/);
  assert.doesNotMatch(plain.stdout, /Linked from/);
  const view = braid(root, "view", "0002", "--links");
  assert.equal(view.status, 0, view.stderr);
  assert.match(view.stdout, /\nRelated: none\nLinked from:\n {2}0003 {2}Title 0003\n {2}0004 {2}Title 0004\nStrands:\n/);
  assert.match(braid(root, "view", "0002/A", "--links").stderr, /--links shows the braids that link to a braid/);
  const v3 = braid(root, "view", "0003");
  assert.equal(v3.status, 0, v3.stderr);
  assert.match(v3.stdout, /\nRead from: braid\/0003-b\n[^]*\nRelated: 0002\n/);

  git(root, "checkout", "-q", "plan/c");
  const own = braid(root, "view", "0004");
  assert.equal(own.status, 0, own.stderr);
  assert.match(own.stdout, /\nRelated: 0002, 0003\nStrands: none\n/);
  assert.match(braid(root, "view", "4", "--links").stdout, /\nRelated: 0002, 0003\nLinked from: none\nStrands: none\n/);
  git(root, "checkout", "-q", "main");

  const list = braid(root, "list", "--open", "--no-fetch");
  assert.equal(list.status, 0, list.stderr);
  assert.match(list.stdout, /0003 {2}In Progress {2}Title 0003\n {2}read from: braid\/0003-b\n {2}related: 0002\n/);
  assert.match(list.stdout, /0004 {2}To Do {2}Title 0004\n {2}read from: plan\/c\n {2}related: 0002, 0003\n/);
  assert.match(list.stdout, /0002 {2}Outline {2}Title 0002\n {2}read from: main\n\n/);
  assert.doesNotMatch(list.stdout, /0005/);
});

test("braid view reads the live copy: braid, strand and plan branches, and not a merged branch", () => {
  const root = fixture();
  const view = (id: string) => {
    const r = braid(root, "view", id);
    assert.equal(r.status, 0, r.stderr);
    return r.stdout;
  };
  // Only on a braid branch, and only on a local plan/ branch.
  assert.match(view("3"), /^0003 {2}Title 0003\n\nStatus: In Progress\n[^]*\nDelivery: epic\nRead from: braid\/0003-b\nFolder: braids\/0003-b\n/);
  assert.match(view("0004"), /\nStatus: To Do\n[^]*\nRead from: plan\/c\nFolder: braids\/0004-c\n/);
  // On the working tree, newer on its braid branch: the branch copy.
  commitAt(root, "braid/0002-outline", "2026-01-01T00:00:00Z", {
    "braids/0002-outline/brief.md": brief("0002", "In Progress", "Branch copy."),
  });
  git(root, "checkout", "-q", "main");
  const live = view("0002");
  assert.match(live, /\nStatus: In Progress\n[^]*\nRead from: braid\/0002-outline\n/);
  assert.match(live, /\nBranch copy\.\n/);
  // A strand only on its strand branch; strand A comes from its braid's branch, as in `braid list --open`.
  commitAt(root, "braid/0002/B-y", "2026-01-02T00:00:00Z", { "braids/0002-outline/B-y/brief.md": brief("0002/B", "In Progress") });
  git(root, "checkout", "-q", "main");
  assert.match(view("2/b"), /^0002\/B {2}Title 0002\/B\n\nStatus: In Progress\n[^]*\nRead from: braid\/0002\/B-y\nFolder: braids\/0002-outline\/B-y\n/);
  assert.match(view("0002/A"), /\nRead from: braid\/0002-outline\n/);
  // Merged into HEAD: the working tree's copy, no Read from.
  git(root, "merge", "-q", "--no-ff", "-m", "merge", "braid/0002-outline");
  const merged = view("0002");
  assert.match(merged, /\nStatus: In Progress\n/);
  assert.doesNotMatch(merged, /Read from/);
  assert.equal(braid(root, "view", "0099").status, 1);
});

test("braid check: a related id found in no source warns with exit 0; one on a branch is fine", () => {
  const root = fixture();
  writeFileSync(join(root, "braids/0002-outline/brief.md"), linked("0002", "Outline", "'0004', '0099'"));
  const r = braid(root, "check");
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout, "braids OK: 2 braids, 1 strands\n");
  assert.equal(
    r.stderr,
    "warning: braids/0002-outline/brief.md: related braid 0099 is not in the working tree or on any braid or plan/ branch here (fetch, or check the id)\n",
  );
  writeFileSync(join(root, "braids/0002-outline/brief.md"), linked("0002", "Outline", "'0004'"));
  assert.equal(braid(root, "check").stderr, "");
});

test("braid new and braid edit set related like --dep; none clears it; strands and self are refused", () => {
  const root = fixture();
  const file = join(root, "braids/0002-outline/brief.md");
  // A brief without related is written byte for byte as before.
  const before = "---\nid: '0002'\ntitle: \"Title 0002\"\nstatus: Outline\nlabels: []\ndependencies: []\ndelivery: epic\n---\n\n## Goal\n\nG.\n";
  writeFileSync(file, before);
  assert.equal(braid(root, "edit", "2", "--order", "3").status, 0);
  assert.equal(braid(root, "edit", "2", "--order", "none").status, 0);
  assert.equal(readFileSync(file, "utf8"), before);

  let r = braid(root, "edit", "2", "--related", "4,3", "--related", "4");
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stderr, "");
  assert.match(readFileSync(file, "utf8"), /\ndependencies: \[\]\nrelated: \['0004', '0003'\]\ndelivery: epic\n/);
  r = braid(root, "edit", "2", "--related", "99");
  assert.equal(r.status, 0);
  assert.match(r.stderr, /^warning: related braid 0099 is not in the working tree or on any braid or plan\/ branch here; kept\n$/);
  assert.equal(braid(root, "edit", "2", "--related", "none").status, 0);
  assert.equal(readFileSync(file, "utf8"), before);

  assert.match(braid(root, "edit", "2", "--related", "2").stderr, /0002 can't be related to itself/);
  assert.match(braid(root, "edit", "2/A", "--related", "4").stderr, /related is set per braid, not per strand/);
  assert.match(braid(root, "edit", "2", "--related", "0004/A").stderr, /related takes braid ids like 0002, not 0004\/A/);
  assert.match(braid(root, "strand", "new", "2", "S", "--related", "4", "--no-fetch").stderr, /related is set per braid/);

  r = braid(root, "new", "Linked", "--related", "2", "--no-fetch");
  assert.equal(r.status, 0, r.stderr);
  assert.match(readFileSync(join(root, "braids/0005-linked/brief.md"), "utf8"), /\nrelated: \['0002'\]\n/);
});

test("braid new's count reads each braid as list --open does: a story Done only from its merged PR isn't counted (0075/B)", async () => {
  const root = fixture();
  const { openBraidsLine } = (await import(new URL("../dist/commands/braids.js", import.meta.url).href)) as { openBraidsLine: (root: string, gh: (r: string, a: readonly string[]) => { status: number; stdout: string; stderr: string }) => string };
  const prs = [{ number: 9, url: "u/9", state: "MERGED", headRefName: "braid/0003-b", headRefOid: "a".repeat(40), baseRefName: "main", mergedAt: "2026-11-24T10:00:00Z" }];
  const gh = () => ({ status: 0, stdout: JSON.stringify(prs), stderr: "" });
  assert.equal(openBraidsLine(root, gh), "Open braids: 2 (braid list --open)\n");
  assert.equal(openBraidsLine(root, () => ({ status: 1, stdout: "", stderr: "no gh" })), "Open braids: 3 (braid list --open)\n", "without GitHub, stored statuses");
});
