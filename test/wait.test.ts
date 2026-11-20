import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const scratch = mkdtempSync(join(tmpdir(), "braid-wait-test-"));
after(() => rmSync(scratch, { recursive: true, force: true }));

const load = (path: string) => import(pathToFileURL(fileURLToPath(new URL(path, import.meta.url))).href);
const { waitCommand } = (await load("../dist/commands/wait.js")) as {
  waitCommand: (root: string, args: string[], opts: object) => Promise<{ code: number; stdout: string }>;
};

const git = (cwd: string, ...args: string[]) => {
  const r = spawnSync("git", args, { cwd, encoding: "utf8" });
  assert.equal(r.status, 0, `git ${args.join(" ")}: ${r.stderr}`);
  return r.stdout.trim();
};
const brief = (id: string) => `---\nid: '${id}'\ntitle: "T ${id}"\nstatus: In Progress\nlabels: []\ndependencies: []\n---\n\n## Goal\n\nx\n`;

type Run = { name: string; status: string; conclusion: string | null };
const done = (name: string, conclusion: string): Run => ({ name, status: "completed", conclusion });
const running = (name: string): Run => ({ name, status: "in_progress", conclusion: null });
const NAMES = ["verify (ubuntu-latest)", "verify (windows-latest)"];

/**
 * A repository with a bare remote and braid 0001 on braid/0001-alpha: a code commit (the strand's merge) on top
 * of main. `braidsOnlyTip` adds a commit on top that changes only braids/ (the Done stamp), pushed too.
 * `gh` answers each check-runs call for a commit with the next answer in `answers[sha]` (the last one repeats);
 * the clock moves only when the command sleeps.
 */
function world(braidsOnlyTip = false) {
  const base = mkdtempSync(join(scratch, "w-"));
  const root = join(base, "proj");
  const put = (path: string, text: string) => {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  };
  git(base, "init", "-q", "--bare", "remote.git");
  git(base, "init", "-q", "-b", "main", root);
  git(root, "config", "user.email", "t@example.com");
  git(root, "config", "user.name", "t");
  git(root, "remote", "add", "origin", join(base, "remote.git"));
  put("BRAID.md", `---\nmain: main\nci: [${NAMES.join(", ")}]\n---\n`);
  put("braids/0001-alpha/brief.md", brief("0001"));
  git(root, "add", "-A");
  git(root, "commit", "-q", "-m", "init");
  git(root, "push", "-q", "origin", "main");
  git(root, "checkout", "-q", "-b", "braid/0001-alpha");
  put("code.txt", "a\n");
  git(root, "add", "-A");
  git(root, "commit", "-q", "-m", "Merge PR #5");
  const code = git(root, "rev-parse", "HEAD");
  let tip = code;
  if (braidsOnlyTip) {
    put("braids/0001-alpha/brief.md", brief("0001").replace("In Progress", "Done"));
    put("epics/old.md", "x\n");
    git(root, "add", "-A");
    git(root, "commit", "-q", "-m", "docs(braids): 0001/A done");
    tip = git(root, "rev-parse", "HEAD");
  }
  git(root, "push", "-q", "origin", "braid/0001-alpha");

  const answers = new Map<string, (Run[] | null)[]>();
  const asked: string[] = [];
  const gh = (_r: string, args: readonly string[]) => {
    const sha = /commits\/([0-9a-f]+)\/check-runs/.exec(args[1] ?? "")?.[1];
    if (args[0] !== "api" || sha === undefined) {
      return { status: 1, stdout: "", stderr: `unexpected gh ${args.join(" ")}` };
    }
    asked.push(sha);
    const list = answers.get(sha) ?? [[]];
    const next = list.length > 1 ? list.shift() : list[0];
    return next === null || next === undefined ? { status: 1, stdout: "", stderr: "HTTP 502" } : { status: 0, stdout: JSON.stringify({ check_runs: next }), stderr: "" };
  };
  let clock = 0;
  const opts = { gh, now: () => clock, sleep: async (ms: number) => void (clock += ms) };
  return { root, code, tip, answers, asked, opts, minutes: () => clock / 60_000 };
}

test("exit 0 once every ci check has passed, after polling while they run", async () => {
  const w = world();
  w.answers.set(w.code, [[running(NAMES[0]!)], [done(NAMES[0]!, "success"), running(NAMES[1]!)], NAMES.map((n) => done(n, "success"))]);
  const r = await waitCommand(w.root, ["1"], w.opts);
  assert.equal(r.code, 0);
  assert.match(r.stdout, new RegExp(`^green at ${w.code.slice(0, 7)} on braid/0001-alpha`));
  assert.equal(w.asked.length, 3);
});

test("exit 1 naming the failed checks, only after all have finished", async () => {
  const w = world();
  w.answers.set(w.code, [[done(NAMES[0]!, "failure"), running(NAMES[1]!)], [done(NAMES[0]!, "failure"), done(NAMES[1]!, "cancelled")]]);
  const r = await waitCommand(w.root, ["0001"], w.opts);
  assert.equal(r.code, 1);
  assert.match(r.stdout, /^failed at [0-9a-f]{7} on braid\/0001-alpha: verify \(ubuntu-latest\), verify \(windows-latest\)\n$/);
  assert.equal(w.asked.length, 2);
});

test("exit 2 at the timeout while a check is still running", async () => {
  const w = world();
  w.answers.set(w.code, [[done(NAMES[0]!, "success"), running(NAMES[1]!)]]);
  const r = await waitCommand(w.root, ["1", "--timeout", "10"], w.opts);
  assert.equal(r.code, 2);
  assert.match(r.stdout, /timed out after 10 minutes at [0-9a-f]{7} on braid\/0001-alpha; still running: verify \(windows-latest\)/);
  assert.equal(w.minutes(), 10);
});

test("exit 2 when no run appears within five minutes", async () => {
  const w = world();
  const r = await waitCommand(w.root, ["1"], w.opts);
  assert.equal(r.code, 2);
  assert.match(r.stdout, /^no run appeared for verify \(ubuntu-latest\), verify \(windows-latest\) at [0-9a-f]{7} on braid\/0001-alpha after 5 minutes/);
});

test("a run that starts late is still waited for, and GitHub errors are retried", async () => {
  const w = world();
  w.answers.set(w.code, [null, [], [], [running(NAMES[0]!), running(NAMES[1]!)], NAMES.map((n) => done(n, "success"))]);
  const r = await waitCommand(w.root, ["1"], w.opts);
  assert.equal(r.code, 0);
});

test("once a run was seen, a GitHub error or an empty answer after five minutes is retried until the timeout", async () => {
  const w = world();
  const pending = NAMES.map((n) => running(n));
  // 21 polls of 15 s keep it running past five minutes, then GitHub fails, answers empty, and the runs finish.
  w.answers.set(w.code, [...Array.from({ length: 21 }, () => pending), null, [], NAMES.map((n) => done(n, "success"))]);
  const r = await waitCommand(w.root, ["1"], w.opts);
  assert.equal(r.code, 0, r.stdout);
  assert.ok(w.minutes() > 5);
});

test("the timeout names a failed check next to one still running", async () => {
  const w = world();
  w.answers.set(w.code, [[done(NAMES[0]!, "failure"), running(NAMES[1]!)], null]);
  const r = await waitCommand(w.root, ["1", "--timeout", "2"], w.opts);
  assert.equal(r.code, 2);
  assert.match(r.stdout, /timed out after 2 minutes at [0-9a-f]{7} on braid\/0001-alpha; failed: verify \(ubuntu-latest\); still running: verify \(windows-latest\); GitHub could not be read at the last poll\n$/);
});

test("a BRAID.md without ci names ends at once with exit 0", async () => {
  const w = world();
  writeFileSync(join(w.root, "BRAID.md"), "---\nmain: main\n---\n");
  const r = await waitCommand(w.root, ["1"], w.opts);
  assert.equal(r.code, 0);
  assert.match(r.stdout, /^BRAID.md names no ci checks; nothing to wait for on braid\/0001-alpha\n$/);
  assert.equal(w.asked.length, 0);
  assert.equal(w.minutes(), 0);
});

test("a braids-only tip waits on the commit before it", async () => {
  const w = world(true);
  assert.notEqual(w.tip, w.code);
  w.answers.set(w.code, [NAMES.map((n) => done(n, "success"))]);
  const r = await waitCommand(w.root, ["1"], w.opts);
  assert.equal(r.code, 0);
  assert.match(r.stdout, new RegExp(`^tip ${w.tip.slice(0, 7)} of braid/0001-alpha only changes braids/ or epics/; CI runs on ${w.code.slice(0, 7)}\ngreen at ${w.code.slice(0, 7)}`));
  assert.deepEqual([...new Set(w.asked)], [w.code]);
});

test("the remote's tip counts, not the local branch", async () => {
  const w = world();
  // A local commit not pushed yet: CI can't run on it.
  writeFileSync(join(w.root, "local.txt"), "x\n");
  git(w.root, "add", "-A");
  git(w.root, "commit", "-q", "-m", "local");
  w.answers.set(w.code, [NAMES.map((n) => done(n, "success"))]);
  const r = await waitCommand(w.root, ["1"], w.opts);
  assert.equal(r.code, 0);
  assert.match(r.stdout, new RegExp(`green at ${w.code.slice(0, 7)}`));
});

test("the braid in this checkout wins over another braid with the same number; elsewhere a clash is refused", async () => {
  const w = world();
  // Another braid 0001 on its own branch (a number clash), pushed and fetched.
  git(w.root, "push", "-q", "origin", `${w.code}:refs/heads/braid/0001-other`);
  git(w.root, "fetch", "-q", "origin");
  w.answers.set(w.code, [NAMES.map((n) => done(n, "success"))]);
  const r = await waitCommand(w.root, ["1"], w.opts);
  assert.match(r.stdout, /green at [0-9a-f]{7} on braid\/0001-alpha/);
  // A checkout without the braid's folder: only the branches can say, and there are two.
  git(w.root, "checkout", "-q", "-b", "elsewhere", "main");
  git(w.root, "rm", "-q", "-r", "braids");
  git(w.root, "commit", "-q", "-m", "no braids");
  await assert.rejects(waitCommand(w.root, ["1"], w.opts), /braid 0001 has several branches \(braid\/0001-alpha, braid\/0001-other\)/);
  git(w.root, "branch", "-q", "-r", "-d", "origin/braid/0001-other");
  const alone = await waitCommand(w.root, ["1"], w.opts);
  assert.match(alone.stdout, /green at [0-9a-f]{7} on braid\/0001-alpha/);
});

test("refuses a strand id, a bad timeout and an unknown braid", async () => {
  const w = world();
  await assert.rejects(waitCommand(w.root, ["0001/A"], w.opts), /usage: braid wait <number>/);
  await assert.rejects(waitCommand(w.root, ["1", "--timeout", "0"], w.opts), /--timeout needs a number of minutes above 0/);
  await assert.rejects(waitCommand(w.root, ["1", "--timeout", "soon"], w.opts), /--timeout needs a number of minutes above 0/);
  await assert.rejects(waitCommand(w.root, ["9"], w.opts), /no braid 0009/);
});

test("the CLI exits 2 on an error, so 1 always means a failed check", () => {
  const w = world();
  const cli = fileURLToPath(new URL("../dist/cli.js", import.meta.url));
  const r = spawnSync(process.execPath, [cli, "wait", "0001/A"], { cwd: w.root, encoding: "utf8" });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /^error: usage: braid wait <number>/);
});
