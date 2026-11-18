import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

const cli = fileURLToPath(new URL("../dist/cli.js", import.meta.url));
const scratch = mkdtempSync(join(tmpdir(), "braid-sweep-test-"));
after(() => rmSync(scratch, { recursive: true, force: true }));

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

/** A bare remote with a main commit, a clone, and three leftovers and an idea noted from it. */
function setup() {
  const base = mkdtempSync(join(scratch, "w-"));
  const remote = join(base, "remote.git");
  const seed = join(base, "seed");
  git(base, "init", "-q", "--bare", "remote.git");
  git(base, "init", "-q", "-b", "main", seed);
  mkdirSync(join(seed, "braids"));
  writeFileSync(join(seed, "braids", ".keep"), "");
  git(seed, "add", "-A");
  git(seed, "commit", "-q", "-m", "init");
  git(seed, "remote", "add", "origin", remote);
  git(seed, "push", "-q", "origin", "main");
  git(base, "clone", "-q", remote, "a");
  const a = join(base, "a");
  const id = (out: string) => /Noted \w+ (\S+) /.exec(out)?.[1] ?? "";
  const l1 = id(ok(a, "note", "First", "--from", "0001/A").stdout);
  const l2 = id(ok(a, "note", "Second", "--from", "0001/A").stdout);
  const l3 = id(ok(a, "note", "Third", "--from", "user").stdout);
  const idea = id(ok(a, "note", "--idea", "An idea").stdout);
  const show = (e: string) => git(remote, "show", `braid-inbox:${e === idea ? "ideas" : "leftovers"}/${e}.md`);
  return { remote, a, l1, l2, l3, idea, show, head: () => git(remote, "rev-parse", "braid-inbox"), subject: () => git(remote, "log", "-1", "--format=%s", "braid-inbox") };
}

test("take, pass, drop and reopen change entries, one commit each, pushed", () => {
  const w = setup();
  let head = w.head();
  const r = ok(w.a, "inbox", "take", w.l1, w.idea, "--into", "0021,0022");
  assert.match(r.stdout, /took 2 into 0021, 0022 \(pushed to origin\/braid-inbox/);
  assert.notEqual(w.head(), head);
  assert.equal(git(w.remote, "rev-list", "--count", `${head}..braid-inbox`), "1");
  assert.equal(w.subject(), "docs(inbox): sweep: take 2");
  assert.match(w.show(w.l1), /status: taken\npassed: 0\ninto: \["0021", "0022"\]\n---\n\nFirst/);
  assert.match(w.show(w.idea), /status: taken\ninto: \["0021", "0022"\]\n---\n\nAn idea/);

  head = w.head();
  ok(w.a, "inbox", "pass", w.l2, w.l3);
  assert.equal(w.subject(), "docs(inbox): sweep: pass 2");
  assert.equal(git(w.remote, "rev-list", "--count", `${head}..braid-inbox`), "1");
  assert.match(w.show(w.l2), /status: open\npassed: 1\n/);

  // The second pass drops the leftover, recording why.
  const second = ok(w.a, "inbox", "pass", w.l2);
  assert.match(second.stdout, /passed over 1, 1 of them dropped/);
  assert.equal(w.subject(), "docs(inbox): sweep: pass 1, drop 1");
  assert.match(w.show(w.l2), /status: dropped\npassed: 2\nwhy: "passed over in 2 sweeps"\n/);

  ok(w.a, "inbox", "drop", w.l3, "--why", "obsolete since the rewrite");
  assert.match(w.show(w.l3), /status: dropped\npassed: 1\nwhy: "obsolete since the rewrite"\n/);
  assert.equal(w.subject(), "docs(inbox): sweep: drop 1");

  ok(w.a, "inbox", "reopen", w.l2);
  assert.match(w.show(w.l2), /^---\nfrom: "0001\/A"\nstatus: open\npassed: 0\n---\n\nSecond/);
  assert.equal(w.subject(), `docs(inbox): reopen ${w.l2}`);
  assert.match(ok(w.a, "inbox").stdout, new RegExp(`${w.l2}`));
});

test("an idea is never passed over, and nothing changes", () => {
  const w = setup();
  const head = w.head();
  const r = braid(w.a, "inbox", "pass", w.l1, w.idea);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /ideas are never passed over/);
  assert.equal(w.head(), head);
});

test("an unknown or malformed id makes a command change nothing", () => {
  const w = setup();
  const head = w.head();
  const unknown = braid(w.a, "inbox", "take", w.l1, "2020-01-01-zzzz", "--into", "0021");
  assert.equal(unknown.status, 1);
  assert.match(unknown.stderr, /no inbox entry 2020-01-01-zzzz/);
  assert.match(braid(w.a, "inbox", "drop", w.l1, "oops", "--why", "x").stderr, /looks like/);
  assert.match(braid(w.a, "inbox", "drop", w.l1).stderr, /usage/);
  assert.match(braid(w.a, "inbox", "take", w.l1).stderr, /usage/);
  assert.match(braid(w.a, "inbox", "take", w.l1, "--into", "x").stderr, /braid ids/);
  assert.equal(w.head(), head);
  assert.equal(git(w.a, "rev-parse", "braid-inbox"), head);
  // An entry already taken can't be taken again; only reopen brings it back.
  ok(w.a, "inbox", "take", w.l1, "--into", "0021");
  const again = braid(w.a, "inbox", "drop", w.l1, "--why", "x");
  assert.equal(again.status, 1);
  assert.match(again.stderr, /reopen it first/);
  assert.match(braid(w.a, "inbox", "reopen", w.l2).stderr, /only a dropped or taken entry/);
});
