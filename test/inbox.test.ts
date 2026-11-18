import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

const cli = fileURLToPath(new URL("../dist/cli.js", import.meta.url));
const scratch = mkdtempSync(join(tmpdir(), "braid-inbox-test-"));
after(() => rmSync(scratch, { recursive: true, force: true }));

// Git and braid run with a home of their own, so no user configuration or real state is read.
const home = join(scratch, "home");
mkdirSync(home);
const env: NodeJS.ProcessEnv = {
  ...process.env,
  HOME: home,
  USERPROFILE: home,
  APPDATA: join(home, "AppData"),
  LOCALAPPDATA: join(home, "Local"),
  XDG_CONFIG_HOME: join(home, ".config"),
  GIT_CONFIG_NOSYSTEM: "1",
  GIT_CONFIG_GLOBAL: join(home, ".gitconfig"),
  GIT_TERMINAL_PROMPT: "0",
};
writeFileSync(join(home, ".gitconfig"), "[user]\n\tname = t\n\temail = t@example.com\n[init]\n\tdefaultBranch = main\n");

const git = (cwd: string, ...args: string[]) => {
  const r = spawnSync("git", args, { cwd, encoding: "utf8", env });
  assert.equal(r.status, 0, `git ${args.join(" ")}: ${r.stderr}`);
  return r.stdout.trim();
};
const braid = (cwd: string, ...args: string[]) => spawnSync(process.execPath, [cli, ...args], { cwd, encoding: "utf8", env });
const ok = (cwd: string, ...args: string[]) => {
  const r = braid(cwd, ...args);
  assert.equal(r.status, 0, `braid ${args.join(" ")}: ${r.stderr}`);
  return r;
};
const brief = (id: string) => `---\nid: '${id}'\ntitle: "T ${id}"\nstatus: To Do\nlabels: []\ndependencies: []\n---\n\n## Goal\n\nx\n`;

/** A bare remote with one main commit (braid 0001 with strand A), and a function to clone it. */
function world() {
  const base = mkdtempSync(join(scratch, "w-"));
  const remote = join(base, "remote.git");
  const seed = join(base, "seed");
  git(base, "init", "-q", "--bare", "remote.git");
  git(base, "init", "-q", "-b", "main", seed);
  for (const [path, text] of [
    ["braids/0001-alpha/brief.md", brief("0001")],
    ["braids/0001-alpha/A-first/brief.md", brief("0001/A")],
  ] as const) {
    mkdirSync(dirname(join(seed, path)), { recursive: true });
    writeFileSync(join(seed, path), text);
  }
  git(seed, "add", "-A");
  git(seed, "commit", "-q", "-m", "init");
  git(seed, "remote", "add", "origin", remote);
  git(seed, "push", "-q", "origin", "main");
  const clone = (name: string) => {
    git(base, "clone", "-q", remote, name);
    return join(base, name);
  };
  return { base, remote, clone };
}

const remoteFiles = (remote: string) => git(remote, "ls-tree", "-r", "--name-only", "braid-inbox").split("\n").filter((l) => l !== "");
const idOf = (stdout: string) => /Noted \w+ (\S+) /.exec(stdout)?.[1] ?? "";

test("the first note creates braid-inbox as its own history and pushes it", () => {
  const w = world();
  const a = w.clone("a");
  const r = ok(a, "note", "Retry the fetch in braid start\n\nstartCommand gives up on one network error.", "--from", "0001/A", "--ref", "https://example.com/pr/5#c1", "--ref", "https://example.com/pr/5");
  const id = idOf(r.stdout);
  assert.match(id, /^\d{4}-\d{2}-\d{2}-[a-z0-9]{4}$/);
  assert.match(r.stdout, /pushed to origin\/braid-inbox/);
  assert.equal(r.stderr, "");
  assert.deepEqual(remoteFiles(w.remote), [`leftovers/${id}.md`]);
  // An orphan: no common history with main, and one commit.
  assert.equal(spawnSync("git", ["merge-base", "main", "braid-inbox"], { cwd: w.remote, env }).status, 1);
  assert.equal(git(w.remote, "log", "--format=%s", "braid-inbox"), `docs(inbox): ${id} note`);
  const file = git(w.remote, "show", `braid-inbox:leftovers/${id}.md`);
  assert.match(file, /^---\nfrom: "0001\/A"\nref: \["https:\/\/example.com\/pr\/5#c1", "https:\/\/example.com\/pr\/5"\]\nstatus: open\npassed: 0\n---\n\nRetry the fetch/);
  // The capturer's own branch never moved.
  assert.equal(git(a, "branch", "--show-current"), "main");

  const idea = ok(a, "note", "--idea", "A phone view of the board");
  const ideaId = idOf(idea.stdout);
  assert.match(git(w.remote, "show", `braid-inbox:ideas/${ideaId}.md`), /^---\nfrom: "user"\nstatus: open\n---\n\nA phone view of the board$/);

  const list = ok(a, "inbox").stdout;
  assert.match(list, new RegExp(`^leftover  ${id}  0m  0001/A  passed 0  Retry the fetch in braid start$`, "m"));
  assert.match(list, new RegExp(`^idea      ${ideaId}  0m  user\\s+A phone view of the board$`, "m"));
  assert.doesNotMatch(ok(a, "inbox", "--ideas").stdout, /leftover/);
  assert.doesNotMatch(ok(a, "inbox", "--leftovers").stdout, /idea/);

  const show = ok(a, "inbox", "show", id).stdout;
  assert.match(show, /^leftover .*\nfrom: 0001\/A\nref: https:\/\/example.com\/pr\/5#c1\nref: https:\/\/example.com\/pr\/5\nstatus: open\npassed: 0\ncreated: .*\nitem: braids\/0001-alpha\/A-first\n\nRetry the fetch in braid start\n\nstartCommand gives up on one network error.\n$/);
});

test("a leftover without --from is refused, and so is a malformed source", () => {
  const w = world();
  const a = w.clone("a");
  const r = braid(a, "note", "something");
  assert.equal(r.status, 1);
  assert.match(r.stderr, /needs --from/);
  assert.match(braid(a, "note", "x", "--from", "someone").stderr, /--from must be/);
  assert.equal(spawnSync("git", ["rev-parse", "--verify", "braid-inbox"], { cwd: w.remote, env }).status, 128);
});

test("the text can come from standard input", () => {
  const w = world();
  const a = w.clone("a");
  const r = spawnSync(process.execPath, [cli, "note", "--from", "PR #7", "--file", "-"], { cwd: a, env, encoding: "utf8", input: "# From stdin\n\nbody\n" });
  assert.equal(r.status, 0, r.stderr);
  assert.match(ok(a, "inbox").stdout, /PR #7\s+passed 0\s+From stdin/);
});

test("two clones capturing at once: the refused push is redone on top, both land, nothing is forced", () => {
  const w = world();
  const a = w.clone("a");
  const b = w.clone("b");
  const first = idOf(ok(b, "note", "--idea", "seed").stdout);
  // While a pushes, b pushes first: a's pre-push hook notes in b once, so a's first push is refused.
  const marker = join(w.base, "raced");
  const slash = (p: string) => p.replaceAll("\\", "/");
  const hook = join(a, ".git", "hooks", "pre-push");
  writeFileSync(
    hook,
    `#!/bin/sh\n[ -f "${slash(marker)}" ] && exit 0\ntouch "${slash(marker)}"\nunset $(git rev-parse --local-env-vars)\ncd "${slash(b)}" && "${slash(process.execPath)}" "${slash(cli)}" note "from b" --from 0001/A > "${slash(join(w.base, "b.out"))}" 2>&1\nexit 0\n`,
  );
  chmodSync(hook, 0o755);
  const r = ok(a, "note", "from a", "--from", "0001/A");
  assert.match(r.stdout, /pushed to origin/);
  assert.equal(r.stderr, "");
  const fromB = idOf(readFileSync(join(w.base, "b.out"), "utf8"));
  assert.notEqual(fromB, "");
  const fromA = idOf(r.stdout);
  const files = remoteFiles(w.remote);
  for (const id of [fromA, fromB]) {
    assert.ok(files.includes(`leftovers/${id}.md`), `${id} in ${files.join(", ")}`);
  }
  assert.ok(files.includes(`ideas/${first}.md`));
  // b's commit is in the remote history: a built on top of it instead of replacing it.
  const subjects = git(w.remote, "log", "--format=%s", "braid-inbox").split("\n");
  assert.deepEqual(subjects, [`docs(inbox): ${fromA} note`, `docs(inbox): ${fromB} note`, `docs(inbox): ${first} note`]);
  // Nothing was forced: b's own braid-inbox commit is an ancestor of the remote tip.
  const tip = git(w.remote, "rev-parse", "braid-inbox");
  assert.equal(spawnSync("git", ["merge-base", "--is-ancestor", git(b, "rev-parse", "braid-inbox"), tip], { cwd: w.remote, env }).status, 0);
  assert.equal(git(w.remote, "reflog", "show", "--format=%gs", "braid-inbox").includes("forced"), false);
});

test("offline, a note stays on the local branch with a warning, and the next note pushes it", () => {
  const w = world();
  const a = w.clone("a");
  git(a, "remote", "set-url", "origin", join(w.base, "missing.git"));
  const r = ok(a, "note", "written offline", "--from", "user");
  const offline = idOf(r.stdout);
  assert.match(r.stdout, /kept on the local braid-inbox/);
  assert.match(r.stderr, /^warning: can't reach origin .*next write pushes it/);
  assert.equal(git(a, "ls-tree", "-r", "--name-only", "braid-inbox"), `leftovers/${offline}.md`);
  // The local copy is listed, with a warning that the fetch failed.
  const list = braid(a, "inbox");
  assert.match(list.stdout, /written offline/);
  assert.match(list.stderr, /can't fetch braid-inbox/);

  git(a, "remote", "set-url", "origin", w.remote);
  const next = idOf(ok(a, "note", "back online", "--from", "user").stdout);
  assert.deepEqual(remoteFiles(w.remote).sort(), [`leftovers/${next}.md`, `leftovers/${offline}.md`].sort());
});

test("an offline note made while someone else pushed is replayed on top of the remote branch", () => {
  const w = world();
  const a = w.clone("a");
  const b = w.clone("b");
  ok(b, "note", "--idea", "first");
  git(a, "remote", "set-url", "origin", join(w.base, "missing.git"));
  const offline = idOf(ok(a, "note", "offline in a", "--from", "user").stdout);
  const second = idOf(ok(b, "note", "--idea", "second").stdout);
  git(a, "remote", "set-url", "origin", w.remote);
  // Before a writes again, its listing (fetch OK, branches diverged) shows its unpushed leftover and b's newer idea.
  const listed = ok(a, "inbox");
  assert.equal(listed.stderr, "");
  assert.match(listed.stdout, new RegExp(`^leftover\\s+${offline}\\s.*offline in a$`, "m"));
  assert.match(listed.stdout, new RegExp(`^idea\\s+${second}\\s.*second$`, "m"));
  assert.match(listed.stdout, /^idea\s+\S+\s.*first$/m);
  const last = idOf(ok(a, "note", "--idea", "third").stdout);
  const files = remoteFiles(w.remote);
  assert.equal(files.length, 4);
  assert.ok(files.includes(`leftovers/${offline}.md`) && files.includes(`ideas/${last}.md`));
});

test("two offline notes in one clone while the other pushes: both are listed and both land with the next write", () => {
  const w = world();
  const a = w.clone("a");
  const b = w.clone("b");
  const first = idOf(ok(b, "note", "--idea", "first").stdout);
  git(a, "remote", "set-url", "origin", join(w.base, "missing.git"));
  const one = idOf(ok(a, "note", "offline one", "--from", "user").stdout);
  const two = idOf(ok(a, "note", "offline two", "--from", "0001/A").stdout);
  const fromB = idOf(ok(b, "note", "pushed by b", "--from", "0001").stdout);
  git(a, "remote", "set-url", "origin", w.remote);
  const listed = ok(a, "inbox");
  assert.equal(listed.stderr, "");
  for (const [id, title] of [[first, "first"], [one, "offline one"], [two, "offline two"], [fromB, "pushed by b"]]) {
    assert.match(listed.stdout, new RegExp(`^\\w+\\s+${id}\\s.*${title}$`, "m"));
  }
  const last = idOf(ok(a, "note", "--idea", "online again").stdout);
  assert.deepEqual(remoteFiles(w.remote).sort(), [`ideas/${first}.md`, `ideas/${last}.md`, `leftovers/${fromB}.md`, `leftovers/${one}.md`, `leftovers/${two}.md`].sort());
  // Linear: b's commit stays in the remote history, a's two offline notes replayed on top in order.
  assert.deepEqual(git(w.remote, "log", "--format=%s", "braid-inbox").split("\n"), [last, two, one, fromB, first].map((id) => `docs(inbox): ${id} note`));
});

test("a note from a worktree with uncommitted changes leaves its files, index and branch alone", () => {
  const w = world();
  const a = w.clone("a");
  const wt = join(w.base, "wt");
  git(a, "worktree", "add", "-q", "-b", "feature", wt);
  writeFileSync(join(wt, "staged.txt"), "staged\n");
  git(wt, "add", "staged.txt");
  writeFileSync(join(wt, "braids", "0001-alpha", "brief.md"), "changed, not staged\n");
  writeFileSync(join(wt, "untracked.txt"), "u\n");
  const state = () => [git(wt, "status", "--porcelain=v1"), git(wt, "diff", "--cached"), git(wt, "diff"), git(wt, "rev-parse", "HEAD"), git(wt, "branch", "--show-current"), git(a, "status", "--porcelain=v1")];
  const before = state();
  ok(wt, "note", "from a worktree", "--from", "0001/A");
  assert.deepEqual(state(), before);
  assert.equal(remoteFiles(w.remote).length, 1);
});

test("a malformed entry is named with its file and field, and the rest are still listed", () => {
  const w = world();
  const a = w.clone("a");
  ok(a, "note", "good one", "--from", "0001");
  // Someone edits the branch by hand.
  const hand = w.clone("hand");
  git(hand, "checkout", "-q", "-b", "inbox", "origin/braid-inbox");
  mkdirSync(join(hand, "ideas"));
  writeFileSync(join(hand, "ideas", "2026-11-18-bad1.md"), "---\nstatus: maybe\n---\n\nbroken\n");
  writeFileSync(join(hand, "ideas", "2026-11-18-done.md"), "---\nfrom: user\nstatus: dropped\nwhy: done elsewhere\n---\n\nold idea\n");
  git(hand, "add", "-A");
  git(hand, "commit", "-q", "-m", "by hand");
  git(hand, "push", "-q", "origin", "inbox:braid-inbox");
  const list = ok(a, "inbox").stdout;
  assert.match(list, /good one/);
  assert.doesNotMatch(list, /old idea/);
  assert.match(list, /^malformed: ideas\/2026-11-18-bad1.md: status: expected one of open, taken, dropped; got: maybe$/m);
  assert.match(ok(a, "inbox", "--all").stdout, /^idea\s+2026-11-18-done\s+\S+\s+dropped\s+user\s+old idea$/m);
  assert.match(ok(a, "inbox", "show", "2026-11-18-done").stdout, /why: done elsewhere/);
  assert.match(braid(a, "inbox", "show", "2026-11-18-bad1").stderr, /ideas\/2026-11-18-bad1.md is malformed: status/);
  assert.match(braid(a, "inbox", "show", "2026-11-18-none").stderr, /no inbox entry/);
});

test("braid inbox with no branch anywhere says so", () => {
  const w = world();
  const a = w.clone("a");
  assert.equal(ok(a, "inbox").stdout, "No open entries in braid-inbox.\n");
});
