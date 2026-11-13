import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

const cli = fileURLToPath(new URL("../dist/cli.js", import.meta.url));
const scratch = mkdtempSync(join(tmpdir(), "braid-edit-"));
after(() => rmSync(scratch, { recursive: true, force: true }));

// Git and braid run with a home inside the scratch folder, so no real config is read or written.
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
  GIT_AUTHOR_NAME: "test",
  GIT_AUTHOR_EMAIL: "test@example.invalid",
  GIT_COMMITTER_NAME: "test",
  GIT_COMMITTER_EMAIL: "test@example.invalid",
};

function braid(cwd: string, args: readonly string[], input?: string) {
  return spawnSync(process.execPath, [cli, ...args], { encoding: "utf8", cwd, env, ...(input === undefined ? {} : { input }) });
}

/** Runs braid and expects exit 0; returns stdout. */
function ok(cwd: string, ...args: string[]): string {
  const r = braid(cwd, args);
  assert.equal(r.stderr, "", `braid ${args.join(" ")}`);
  assert.equal(r.status, 0);
  return r.stdout;
}

function git(cwd: string, ...args: string[]): string {
  const r = spawnSync("git", args, { encoding: "utf8", cwd, env });
  assert.equal(r.status, 0, `git ${args.join(" ")}: ${r.stderr}`);
  return r.stdout;
}

let count = 0;
function dir(name: string): string {
  const path = join(scratch, `${name}-${++count}`);
  mkdirSync(path);
  return path;
}

/** A Git repository with one commit on main. */
function repo(): string {
  const root = dir("repo");
  git(root, "init", "-q", "-b", "main");
  writeFileSync(join(root, "README.md"), "test\n");
  git(root, "add", ".");
  git(root, "commit", "-q", "-m", "init");
  return root;
}

function commitAll(root: string, message: string): void {
  git(root, "add", "-A");
  git(root, "commit", "-q", "-m", message);
}

const brief = (root: string, folder: string) => readFileSync(join(root, folder, "brief.md"), "utf8");

test("a braid with two strands is created and edited entirely from the CLI", () => {
  const root = repo();
  assert.equal(ok(root, "new", "Fresh start", "--status", "Done"), "Created 0001 braids/0001-fresh-start\n");
  assert.equal(
    ok(root, "new", 'Braids folder: the "format"', "--labels", "kind:story,tier:L", "--dep", "1", "--delivery", "main"),
    "Created 0002 braids/0002-braids-folder-the-format\n",
  );
  assert.equal(
    ok(root, "strand", "new", "0002", "Read braids", "--order", "2"),
    "Created 0002/A braids/0002-braids-folder-the-format/A-read-braids\n",
  );
  assert.equal(
    ok(root, "strand", "new", "2", "Create & edit", "--slug", "create", "--status", "outline"),
    "Created 0002/B braids/0002-braids-folder-the-format/B-create\n",
  );
  assert.equal(
    ok(root, "edit", "2/b", "--status", "in progress", "--title", "Create and edit", "--order", "1", "--dep", "0002/A", "--labels", "a", "--labels", "b, c"),
    "Updated 0002/B\n",
  );
  ok(root, "edit", "0002/A", "--order", "none");
  ok(root, "edit", "0002", "--delivery", "epic", "--labels", "");
  ok(root, "brief", "0002", "Goal", "--text", "Track braids.");
  ok(root, "brief", "0002", "Plan", "--text", "1. Read\n2. Write");
  ok(root, "brief", "0002", "## Goal", "--text", "Track braids from the CLI.");

  assert.equal(
    brief(root, "braids/0002-braids-folder-the-format"),
    [
      "---",
      "id: '0002'",
      'title: "Braids folder: the \\"format\\""',
      "status: To Do",
      "labels: []",
      "dependencies: ['0001']",
      "delivery: epic",
      "---",
      "",
      "## Goal",
      "",
      "Track braids from the CLI.",
      "",
      "## Plan",
      "",
      "1. Read",
      "2. Write",
      "",
    ].join("\n"),
  );
  assert.equal(
    brief(root, "braids/0002-braids-folder-the-format/B-create"),
    [
      "---",
      "id: '0002/B'",
      'title: "Create and edit"',
      "status: In Progress",
      'labels: ["a", "b", "c"]',
      "dependencies: ['0002/A']",
      "order: 1",
      "---",
      "",
    ].join("\n"),
  );
  assert.equal(
    ok(root, "list"),
    [
      "0001  Done         Fresh start",
      '0002  To Do        Braids folder: the "format"',
      "  0002/B  In Progress   1  Create and edit",
      "  0002/A  To Do         -  Read braids",
      "",
    ].join("\n"),
  );
});

test("brief sections take multi-line text from a file and from standard input", () => {
  const root = repo();
  ok(root, "new", "Text");
  writeFileSync(join(root, "goal.md"), "﻿First line\r\n\r\n```\r\n## inside a fence\r\n```\r\nLast line\r\n\r\n");
  ok(root, "brief", "1", "Goal", "--file", "goal.md");
  const r = braid(root, ["brief", "1", "Notes", "--file", "-"], "Piped one\nPiped two\n");
  assert.equal(r.stderr, "");
  assert.equal(r.status, 0);
  // Replacing the first section keeps the one after it.
  const again = braid(root, ["brief", "1", "Goal", "--file", "-"], "New goal\r\nsecond line\r\n");
  assert.equal(again.status, 0);
  assert.equal(
    brief(root, "braids/0001-text").split("---\n")[2],
    ["", "## Goal", "", "New goal", "second line", "", "## Notes", "", "Piped one", "Piped two", ""].join("\n"),
  );
  ok(root, "brief", "1", "Notes", "--file", join(root, "goal.md"));
  const view = ok(root, "view", "1");
  assert.match(view, /## Notes\n\nFirst line\n\n```\n## inside a fence\n```\nLast line\n$/);
});

test("braid numbers on remote branches and in deleted folders are not reused", () => {
  const remote = dir("remote");
  git(remote, "init", "-q", "--bare", "-b", "main");
  const one = repo();
  git(one, "remote", "add", "origin", remote);
  git(one, "push", "-q", "origin", "main");
  const two = dir("clone");
  git(two, "clone", "-q", remote, ".");

  // Clone one takes 0001 and 0002 on a branch, deletes 0002, and pushes the branch.
  git(one, "switch", "-q", "-c", "plan");
  ok(one, "new", "First");
  ok(one, "new", "Second");
  commitAll(one, "two braids");
  rmSync(join(one, "braids", "0002-second"), { recursive: true });
  commitAll(one, "drop the second");
  assert.equal(ok(one, "new", "Third", "--no-fetch"), "Created 0003 braids/0003-third\n");
  git(one, "push", "-q", "origin", "plan");

  // Clone two hasn't fetched: --no-fetch only sees what it knows, a plain new fetches first.
  assert.equal(ok(two, "new", "Local", "--no-fetch"), "Created 0001 braids/0001-local\n");
  rmSync(join(two, "braids"), { recursive: true });
  assert.equal(ok(two, "new", "Other clone"), "Created 0003 braids/0003-other-clone\n");
});

test("strand letters are never reused, also across branches", () => {
  const root = repo();
  ok(root, "new", "Braid");
  ok(root, "strand", "new", "1", "A");
  ok(root, "strand", "new", "1", "B");
  commitAll(root, "strands");
  git(root, "switch", "-q", "-c", "side");
  assert.match(ok(root, "strand", "new", "1", "C"), /^Created 0001\/C /);
  commitAll(root, "strand c");
  git(root, "switch", "-q", "main");
  rmSync(join(root, "braids", "0001-braid", "B-b"), { recursive: true });
  commitAll(root, "drop b");
  assert.deepEqual(readdirSync(join(root, "braids", "0001-braid")).sort(), ["A-a", "brief.md"]);
  assert.equal(ok(root, "strand", "new", "1", "Next"), "Created 0001/D braids/0001-braid/D-next\n");
});

test("a strand letter taken only on a pushed remote branch is not reused", () => {
  const remote = dir("remote");
  git(remote, "init", "-q", "--bare", "-b", "main");
  const one = repo();
  git(one, "remote", "add", "origin", remote);
  ok(one, "new", "Braid");
  ok(one, "strand", "new", "1", "First");
  commitAll(one, "braid with strand A");
  git(one, "push", "-q", "origin", "main");
  const two = dir("clone");
  git(two, "clone", "-q", remote, ".");

  // Clone one takes letter B on a branch that only the remote has.
  git(one, "switch", "-q", "-c", "side");
  assert.match(ok(one, "strand", "new", "1", "Second"), /^Created 0001\/B /);
  commitAll(one, "strand b");
  git(one, "push", "-q", "origin", "side");

  assert.match(ok(two, "strand", "new", "1", "Stale", "--no-fetch"), /^Created 0001\/B /);
  rmSync(join(two, "braids", "0001-braid", "B-stale"), { recursive: true });
  assert.equal(ok(two, "strand", "new", "1", "Third"), "Created 0001/C braids/0001-braid/C-third\n");
});

test("a failed fetch stops new unless --no-fetch", () => {
  const root = repo();
  git(root, "remote", "add", "origin", join(scratch, "missing-remote"));
  const r = braid(root, ["new", "X"]);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /^error: git fetch failed.*--no-fetch/);
  assert.equal(ok(root, "new", "X", "--no-fetch"), "Created 0001 braids/0001-x\n");
});

test("a folder that isn't a Git repository still gets numbers and letters", () => {
  const root = dir("plain");
  mkdirSync(join(root, "braids"));
  assert.equal(ok(root, "new", "Ünïcode — title!"), "Created 0001 braids/0001-unicode-title\n");
  assert.equal(ok(root, "strand", "new", "1", "!!!"), "Created 0001/A braids/0001-unicode-title/A-strand\n");
});

test("usage errors exit 1 and leave the brief alone", () => {
  const root = repo();
  ok(root, "new", "One");
  ok(root, "strand", "new", "1", "Part");
  const before = brief(root, "braids/0001-one");
  const cases: [string[], RegExp][] = [
    [["new"], /braid new takes one title/],
    [["new", "a", "b"], /braid new takes one title/],
    [["new", "X", "--bogus"], /braid new: Unknown option '--bogus'/],
    [["new", "X", "--slug", "Bad_Slug"], /slug must be/],
    [["strand", "add", "1", "X"], /usage: braid strand new/],
    [["strand", "new", "1/A", "X"], /give a braid id/],
    [["strand", "new", "9", "X"], /no braid 0009/],
    [["edit", "1"], /needs at least one/],
    [["edit", "1", "--status", "Doing"], /status must be one of Outline, To Do, In Progress, Done; got: Doing/],
    [["edit", "1", "--order=-1"], /order must be a whole number or none/],
    [["edit", "1", "--delivery", "both"], /delivery must be epic or main/],
    [["edit", "1", "--dep", "1"], /0001 can't depend on itself/],
    [["edit", "1", "--dep", "0001/B"], /dependency 0001\/B does not exist/],
    [["edit", "1/A", "--delivery", "main"], /delivery is set per braid/],
    [["edit", "1", "--title", " "], /title must not be empty/],
    [["edit", "1/Z", "--status", "Done"], /no strand 0001\/Z/],
    [["brief", "1", "Goal"], /either --file <path>/],
    [["brief", "1", "Goal", "--text", "a", "--file", "b"], /either --file <path>/],
    [["brief", "1", "Goal", "--file", "missing.md"], /can't read .*missing\.md/],
    [["brief", "1", "Goal", "--text", "a\n## Next"], /must not contain "## " headings/],
    [["brief", "1", "Goal", "--text", "```\ncode"], /code fence that is not closed/],
  ];
  for (const [args, message] of cases) {
    const r = braid(root, args);
    assert.equal(r.status, 1, `braid ${args.join(" ")}: ${r.stderr}`);
    assert.match(r.stderr, message);
  }
  assert.equal(brief(root, "braids/0001-one"), before);
});

test("a malformed brief stops edits with exit 2", () => {
  const root = repo();
  ok(root, "new", "One");
  writeFileSync(join(root, "braids", "0001-one", "brief.md"), "---\nid: '0001'\ntitle: One\nstatus: Doing\n---\n");
  const r = braid(root, ["edit", "1", "--status", "Done"]);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /^error: braids\/0001-one\/brief\.md: line 4: status must be one of/);
});

test("braid log creates and appends the thread file, stages it and never commits", () => {
  const root = repo();
  ok(root, "new", "Logged");
  ok(root, "strand", "new", "1", "Part");
  commitAll(root, "braids");
  const head = git(root, "rev-parse", "HEAD");
  const env1 = { ...env, BRAID_NOW: "2026-11-13T14:05:30Z" };
  const run = (args: string[], input?: string) =>
    spawnSync(process.execPath, [cli, ...args], { encoding: "utf8", cwd: root, env: env1, ...(input === undefined ? {} : { input }) });
  const thread = "mcp:launch:5d80964a34704ff9";
  let r = run(["log", "1/A", "--thread", thread, "first"]);
  assert.equal(r.stderr, "");
  assert.equal(r.stdout, "Logged 0001/A: braids/0001-logged/A-part/log-2026-11-13-5d80964a.md\n");
  env1.BRAID_NOW = "2026-11-14T09:00:00Z";
  r = run(["log", "1/A", "--thread", thread, "--checkpoint", "--file", "-"], "line one\r\nline two\r\n");
  assert.equal(r.status, 0, r.stderr);
  const file = join(root, "braids/0001-logged/A-part/log-2026-11-13-5d80964a.md");
  assert.equal(
    readFileSync(file, "utf8"),
    "## 2026-11-13 14:05Z\n\nfirst\n\n## 2026-11-14 09:00Z checkpoint\n\nline one\nline two\n",
  );
  assert.equal(run(["log", "0001", "note"]).status, 0);
  assert.equal(run(["log", "0001", "--thread", "mcp:launch:7c1e22b0aaaa", "other"]).status, 0);
  assert.equal(run(["log", "0001", "--thread", "mcp:2831f09b-f69a-4c1d-9a3e-000000000000", "uuid"]).status, 0);
  assert.equal(run(["log", "0001", "--thread", "a1b2c3d4", "bare"]).status, 0);
  assert.ok(readdirSync(join(root, "braids/0001-logged")).includes("log-2026-11-14-user.md"));
  assert.equal(
    git(root, "status", "--porcelain"),
    [
      "A  braids/0001-logged/A-part/log-2026-11-13-5d80964a.md",
      "A  braids/0001-logged/log-2026-11-14-2831f09b.md",
      "A  braids/0001-logged/log-2026-11-14-7c1e22b0.md",
      "A  braids/0001-logged/log-2026-11-14-a1b2c3d4.md",
      "A  braids/0001-logged/log-2026-11-14-user.md",
      "",
    ].join("\n"),
  );
  assert.equal(git(root, "rev-parse", "HEAD"), head);
  assert.match(ok(root, "view", "0001/A"), /log-2026-11-13-5d80964a\.md/);
  r = run(["log", "1/A", "--thread", "abc", "x"]);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /8 letters or digits/);
  assert.equal(run(["log", "1/A", ""]).status, 1);
  assert.equal(run(["log", "9", "x"]).status, 1);
});

test("braid report writes, replaces and appends report.md", () => {
  const root = repo();
  ok(root, "new", "Reported");
  const report = join(root, "braids/0001-reported/report.md");
  ok(root, "report", "1", "--text", "First.");
  assert.equal(readFileSync(report, "utf8"), "First.\n");
  writeFileSync(join(root, "more.md"), "Second\r\nline\r\n");
  ok(root, "report", "1", "--append", "--file", "more.md");
  assert.equal(readFileSync(report, "utf8"), "First.\n\nSecond\nline\n");
  const r = braid(root, ["report", "1", "--file", "-"], "Fresh\n");
  assert.equal(r.status, 0, r.stderr);
  assert.equal(readFileSync(report, "utf8"), "Fresh\n");
  assert.equal(braid(root, ["report", "1"]).status, 1);
});

test("braid log without a Git repository exits 1 and keeps the file", () => {
  const root = dir("plain-log");
  mkdirSync(join(root, "braids"));
  ok(root, "new", "Plain");
  const r = braid(root, ["log", "1", "note"]);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /wrote braids\/0001-plain\/log-.*-user\.md but git add failed/);
  assert.equal(readdirSync(join(root, "braids/0001-plain")).filter((n) => n.startsWith("log-")).length, 1);
});
