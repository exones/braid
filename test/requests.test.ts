import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { existsSync, realpathSync, utimesSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, beforeEach, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const scratch = mkdtempSync(join(tmpdir(), "braid-requests-test-"));
after(() => rmSync(scratch, { recursive: true, force: true, maxRetries: 20, retryDelay: 250 }));

const load = (path: string) => import(pathToFileURL(fileURLToPath(new URL(path, import.meta.url))).href);
type Cmd = (root: string, args: string[], opts?: object) => string | Promise<string>;
const { handoverCommand, askCommand, requestsCommand, answerCommand } = (await load("../dist/commands/requests.js")) as {
  handoverCommand: Cmd;
  askCommand: Cmd;
  requestsCommand: Cmd;
  answerCommand: (root: string, cwd: string, args: string[]) => string;
};
const { startCommand } = (await load("../dist/commands/start.js")) as { startCommand: (root: string, args: string[], src: object, env: object) => Promise<string> };
const { acceptCommand } = (await load("../dist/commands/done.js")) as { acceptCommand: Cmd };
const { resetGithubMemory } = (await load("../dist/board/github.js")) as { resetGithubMemory: () => void };
const { loadRequests, loadRecord, legacyFile, openRequest, holding, filterLive, age, locked } = (await load("../dist/braids/requests.js")) as {
  loadRequests: (root: string) => { id: string; kind: string; text: string; head?: string }[];
  loadRecord: (root: string) => { requests: { code: string; id: string; state: string; events: { event: string; at: string; by: string; text?: string }[] }[] };
  legacyFile: (root: string) => string;
  openRequest: (root: string, request: object) => { code: string };
  holding: (requests: object[], prOf: (n: number) => { state: string; headRefOid: string } | null) => Map<string, { state: string }>;
  filterLive: (requests: object[], prOf: (n: number) => { state: string; headRefOid: string } | null) => object[];
  age: (at: string, now: Date) => string;
  locked: <T>(file: string, fn: () => T, what?: string, makeDir?: (dir: string) => void, waitMs?: number, clock?: { now: () => number; pause: () => void }) => T;
};
beforeEach(() => {
  resetGithubMemory();
});

const git = (cwd: string, ...args: string[]) => {
  const r = spawnSync("git", args, { cwd, encoding: "utf8" });
  assert.equal(r.status, 0, `git ${args.join(" ")}: ${r.stderr}`);
  return r.stdout.trim();
};
const ok = (data: unknown) => ({ status: 0, stdout: JSON.stringify(data), stderr: "" });
const brief = (id: string, status: string) => `---\nid: '${id}'\ntitle: "T ${id}"\nstatus: ${status}\nlabels: []\ndependencies: []\n---\n\n## Goal\n\nx\n`;
const THREAD = "mcp:launch:aaaaaaaa11111111";
const NOW = new Date("2026-11-15T12:00:00Z");

interface Pr {
  state: "OPEN" | "MERGED" | "CLOSED";
  checks: string;
  head: string;
}

/** The lock file the record's writers take turns with, in the main checkout's `.braid/`. */
const lockOf = (root: string) => join(dirname(legacyFile(root)), "requests.lock");

/** A repository with braid 0001 (strand A, PR #5 on its branch), a bare remote, and a second worktree of it. */
function world() {
  const base = mkdtempSync(join(scratch, "w-"));
  const root = join(base, "proj");
  const remote = join(base, "remote.git");
  const put = (path: string, text: string) => {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  };
  git(base, "init", "-q", "--bare", "remote.git");
  git(base, "init", "-q", "-b", "main", root);
  git(root, "config", "user.email", "t@example.com");
  git(root, "config", "user.name", "t");
  git(root, "remote", "add", "origin", remote);
  put("BRAID.md", "---\nmain: main\nci: [verify]\n---\n");
  put("braids/0001-alpha/brief.md", brief("0001", "In Progress"));
  put("braids/0001-alpha/A-first/brief.md", brief("0001/A", "To Do"));
  git(root, "add", "-A");
  git(root, "commit", "-q", "-m", "init");
  git(root, "push", "-q", "origin", "main");
  git(root, "push", "-q", "origin", "main:refs/heads/braid/0001-alpha");
  git(root, "checkout", "-q", "-b", "braid/0001/A-first");
  put("code.txt", "a\n");
  git(root, "add", "-A");
  git(root, "commit", "-q", "-m", "feat: A");
  git(root, "push", "-q", "origin", "braid/0001/A-first");
  const first = git(root, "rev-parse", "HEAD");
  git(root, "checkout", "-q", "main");
  const other = join(base, "other");
  git(root, "worktree", "add", "-q", "--detach", other, "main");
  const pr: Pr = { state: "OPEN", checks: "SUCCESS", head: first };
  /** Commits whose `verify` check passed, as `gh api .../check-runs` reports it. */
  const green = new Set<string>();
  const gh = (_r: string, args: readonly string[]) => {
    if (args[0] === "api") {
      const sha = /commits\/([0-9a-f]+)\/check-runs/.exec(args[1] ?? "")?.[1] ?? "";
      return ok({ check_runs: green.has(sha) ? [{ name: "verify", status: "completed", conclusion: "success" }] : [] });
    }
    const rollup = [{ name: "verify", conclusion: pr.checks === "PENDING" ? "" : pr.checks, status: pr.checks === "PENDING" ? "IN_PROGRESS" : "COMPLETED" }];
    if (args[1] === "list") {
      return ok([{ number: 5, url: "u/5", state: pr.state, headRefName: "braid/0001/A-first", statusCheckRollup: rollup }]);
    }
    return ok({ number: 5, url: "u/5", state: pr.state, baseRefName: "braid/0001-alpha", headRefName: "braid/0001/A-first", headRefOid: pr.head, mergeable: "MERGEABLE", statusCheckRollup: rollup });
  };
  return { root, other, pr, gh, first, green, clock: () => NOW };
}

test("ask opens a request that every worktree shares; a new ask replaces it; answer closes it", async () => {
  const w = world();
  const asked = askCommand(w.root, ["0001/A", "Which   name\nshould it have?", "--kind", "decision", "--key", "scope", "--thread", THREAD], { now: w.clock }) as string;
  assert.match(asked, /^q-[a-z0-9]{4} 0001\/A: decision request opened: Which name should it have\?/);
  const code = asked.slice(0, 6);
  assert.ok(git(w.root, "ls-tree", "-r", "--name-only", "origin/braid-requests").split("\n").includes(`requests/${code}.json`), "pushed to the record's branch");
  assert.equal(existsSync(join(w.other, ".braid")), false, "nothing is kept in the worktree");
  assert.equal(realpathSync.native(dirname(dirname(legacyFile(w.other)))), realpathSync.native(w.root), "found from any worktree");
  const listed = (await requestsCommand(w.other, [], { gh: w.gh, now: () => new Date("2026-11-15T12:30:00Z") })) as string;
  assert.equal(listed, `${code}  0001/A  decision  30m  Which name should it have?\n`);
  askCommand(w.other, ["0001/A", "Plan ok?", "--kind", "plan"], { now: w.clock });
  assert.deepEqual(loadRequests(w.root).map((r) => [r.id, r.kind, r.text]), [["0001/A", "plan", "Plan ok?"]]);
  assert.equal(readdirSync(join(w.root, ".braid")).filter((n) => n.endsWith(".tmp")).length, 0);
  assert.match(answerCommand(w.other, w.other, ["0001/A"]), /^q-[a-z0-9]{4} 0001\/A: answered by the user\n$/);
  assert.equal(await requestsCommand(w.root, [], { gh: w.gh }), "no open requests\n");
  assert.match(answerCommand(w.root, w.root, ["0001/A"]), /no open request/);
  // Nothing is deleted: the first is withdrawn as replaced, the second answered.
  const all = loadRecord(w.root).requests;
  const first = all.find((r) => r.code === code);
  const second = all.find((r) => r.code !== code);
  assert.deepEqual([all.length, first?.state, second?.state], [2, "withdrawn", "answered"]);
  assert.equal(first?.events.at(-1)?.text, `replaced by ${second?.code}`);
});

test("ask refuses a bad kind, an empty text, an unknown item and a bad thread", () => {
  const w = world();
  assert.throws(() => askCommand(w.root, ["0001/A", "x", "--kind", "review"]), /--kind is question, decision, plan or action/);
  assert.throws(() => askCommand(w.root, ["0001/A", "  "]), /must not be empty/);
  assert.throws(() => askCommand(w.root, ["0009", "x"]), /no braid 0009/);
  assert.throws(() => askCommand(w.root, ["0001/A", "x", "--thread", "abc"]), /--thread needs an id/);
  assert.deepEqual(loadRequests(w.root), []);
});

test("answer --log is the answer's text on the record: no braid log, no commit; an unreadable file leaves the request open", () => {
  const w = world();
  askCommand(w.root, ["0001", "Approve the plan?", "--kind", "plan"], { now: w.clock });
  assert.throws(() => answerCommand(w.root, w.root, ["0001", "--log", join(w.root, "nope.txt")]), /can't read/);
  assert.equal(loadRequests(w.root).length, 1);
  writeFileSync(join(w.root, "decision.txt"), "User approved the plan.\n");
  const head = git(w.root, "rev-parse", "HEAD");
  const out = answerCommand(w.root, w.root, ["0001", "--log", join(w.root, "decision.txt"), "--thread", THREAD]);
  assert.match(out, /answered by the user: User approved the plan\./);
  assert.equal(readdirSync(join(w.root, "braids/0001-alpha")).some((n) => n.startsWith("log-")), false, "no braid log entry");
  assert.equal(git(w.root, "rev-parse", "HEAD"), head, "no commit on the checkout's branch");
  assert.deepEqual(loadRequests(w.root), []);
  const e = loadRecord(w.root).requests[0]?.events.at(-1);
  assert.deepEqual([e?.event, e?.by, e?.text], ["answered", "user", "User approved the plan."]);
});

test("handover opens a review request and prints the recap draft", async () => {
  const w = world();
  const out = (await handoverCommand(w.other, ["0001/A", "--head", w.first.slice(0, 7), "--thread", THREAD], { gh: w.gh, now: w.clock })) as string;
  assert.match(out, new RegExp(`^q-[a-z0-9]{4} 0001/A: review request opened for PR #5 at ${w.first}`));
  assert.match(out, /ready for your merge/);
  assert.match(out, /braid log line:/);
  const [r] = loadRequests(w.root);
  assert.equal(r?.kind, "review");
  assert.equal(r?.head, w.first);
});

test("handover refuses a PR that is not open, not at the head or not green, and changes nothing", async () => {
  const w = world();
  const go = (head = w.first) => handoverCommand(w.root, ["0001/A", "--head", head], { gh: w.gh, now: w.clock }) as Promise<string>;
  await assert.rejects(go("deadbeef"), /head is .*, not deadbeef/);
  w.pr.checks = "FAILURE";
  await assert.rejects(go(), /not green.*verify failing/);
  w.pr.checks = "PENDING";
  await assert.rejects(go(), /verify pending/);
  w.pr.checks = "SUCCESS";
  w.pr.state = "MERGED";
  await assert.rejects(go(), /PR #5 is merged/);
  w.pr.state = "CLOSED";
  await assert.rejects(go(), /PR #5 is closed/);
  assert.deepEqual(loadRequests(w.root), []);
  await assert.rejects(handoverCommand(w.root, ["0001/A"], { gh: w.gh }) as Promise<string>, /usage: braid handover/);
});

test("a review request is void after a merge, a close or a moved head", async () => {
  const changes: ((p: Pr) => void)[] = [(p) => (p.state = "MERGED"), (p) => (p.state = "CLOSED"), (p) => (p.head = "f".repeat(40))];
  for (const change of changes) {
    const w = world();
    await handoverCommand(w.root, ["0001/A", "--head", w.first], { gh: w.gh, now: w.clock });
    assert.match((await requestsCommand(w.root, [], { gh: w.gh, now: w.clock })) as string, /^q-[a-z0-9]{4}  0001\/A  review  0m  review PR #5/);
    change(w.pr);
    // A read closes nothing: the request stays open, marked, for the board's tick to record.
    assert.match((await requestsCommand(w.root, [], { gh: w.gh, now: w.clock })) as string, /^q-[a-z0-9]{4} {2}0001\/A {2}review {2}0m {2}condition holds: the board (wakes the asker|withdraws it) {2}review PR #5/);
    assert.equal(loadRequests(w.root).length, 1, "still open");
    assert.equal(loadRecord(w.root).requests[0]?.events.length, 1, "no ending recorded");
    const ends = holding(loadRequests(w.root), () => ({ state: w.pr.state, headRefOid: w.pr.head }));
    assert.deepEqual([...ends.values()].map((e) => e.state), [w.pr.state === "MERGED" ? "met" : "withdrawn"]);
  }
});

test("a review request stays when GitHub can't be read; a question never self-closes on a PR", async () => {
  const w = world();
  await handoverCommand(w.root, ["0001/A", "--head", w.first], { gh: w.gh, now: w.clock });
  askCommand(w.root, ["0001", "Decide?", "--kind", "decision"], { now: w.clock });
  w.pr.state = "MERGED";
  const down = () => ({ status: 1, stdout: "", stderr: "offline" });
  const out = (await requestsCommand(w.root, [], { gh: down, now: w.clock })) as string;
  assert.match(out, /0001\/A  review/);
  assert.match(out, /0001  decision/);
  const lines = ((await requestsCommand(w.root, [], { gh: w.gh, now: w.clock })) as string).trim().split("\n");
  assert.match(lines.find((l) => l.includes(" 0001  decision")) ?? "", /^q-[a-z0-9]{4} {2}0001 {2}decision {2}0m {2}Decide\?$/, "a question never self-closes on a PR");
  assert.match(lines.find((l) => l.includes("0001/A")) ?? "", /review .*condition holds/, "the merged review stays open for the board");
});

test("braid start closes the request of the item it starts, and only that one", async () => {
  const w = world();
  askCommand(w.root, ["0001/A", "Start it?", "--kind", "decision"], { now: w.clock });
  askCommand(w.root, ["0001", "Other braid question", "--kind", "question"], { now: w.clock });
  const env = { BRAID_WORKTREES_DIR: join(dirname(w.root), "trees") };
  git(w.root, "branch", "-D", "braid/0001/A-first");
  git(w.root, "push", "-q", "origin", ":refs/heads/braid/0001/A-first");
  git(w.root, "checkout", "-q", "-b", "braid/0001-alpha", "origin/braid/0001-alpha");
  const none = () => ok([]);
  const t3 = async () => ({ status: 1, stdout: "", stderr: "no t3" });
  await startCommand(w.root, ["0001/A"], { gh: none, t3 }, env);
  assert.deepEqual(loadRequests(w.root).map((r) => r.id), ["0001"]);
  const started = loadRecord(w.root).requests.find((r) => r.id === "0001/A")?.events.at(-1);
  assert.deepEqual([started?.event, started?.by, started?.text], ["answered", "coordinator", "started"]);
});

test("braid accept closes the request when the item is accepted; a refused accept leaves it", async () => {
  const w = world();
  askCommand(w.root, ["0001/A", "Merge?", "--kind", "decision"], { now: w.clock });
  const t3 = async () => ({ status: 1, stdout: "", stderr: "no t3" });
  // No PR for the item: refused.
  await assert.rejects(acceptCommand(w.root, ["0001/A", "--thread", THREAD], { gh: () => ok([]), t3 }) as Promise<string>, /has no PR/);
  assert.equal(loadRequests(w.root).length, 1);
  // The PR merged: the acceptance is recorded (no log entry asked for, so nothing is committed on any branch).
  const merged = (_r: string, args: readonly string[]) => (args[1] === "list" ? ok([{ number: 5, url: "u/5", state: "MERGED", headRefName: "braid/0001/A-first", statusCheckRollup: [] }]) : ok({ number: 5, headRefOid: "abcdef0123456789" }));
  const out = (await acceptCommand(w.root, ["0001/A", "--thread", THREAD], { gh: merged, t3 })) as string;
  assert.match(out, /0001\/A accepted at abcdef0123456789; Done from the merge of PR #5/);
  assert.deepEqual(loadRequests(w.root), []);
  assert.deepEqual(loadRecord(w.root).requests.map((r) => [r.state, r.events.at(-1)?.text]), [["withdrawn", "the item is accepted"]]);
});

test("age is minutes, hours or days", () => {
  const at = "2026-11-15T12:00:00Z";
  assert.equal(age(at, new Date("2026-11-15T12:05:00Z")), "5m");
  assert.equal(age(at, new Date("2026-11-15T15:00:00Z")), "3h");
  assert.equal(age(at, new Date("2026-11-18T12:00:00Z")), "3d");
});

const req = (id: string, extra: object = {}) => ({ id, kind: "question", text: id, at: "2026-11-15T12:00:00Z", thread: null, ...extra });

test("holding writes nothing: a void request stays open on the record", () => {
  const w = world();
  const head = "a".repeat(40);
  openRequest(w.root, req("0001/A", { kind: "review", pr: 5, head }));
  const open = loadRequests(w.root);
  const ends = holding(open as never, () => ({ state: "MERGED", headRefOid: head }));
  assert.deepEqual([...ends.values()].map((e) => e.state), ["met"]);
  assert.deepEqual(loadRequests(w.root).map((r) => r.id), ["0001/A"], "still open");
});

test("overlapping writers in separate processes lose no update", async () => {
  const w = world();
  const script = join(scratch, "writer.mjs");
  writeFileSync(script, `import { openRequest } from ${JSON.stringify(pathToFileURL(fileURLToPath(new URL("../dist/braids/requests.js", import.meta.url))).href)};
const [root, id] = process.argv.slice(2);
for (let i = 0; i < 4; i++) openRequest(root, { id: id + i, kind: "question", text: "x", at: "2026-11-15T12:00:00Z", thread: null });`);
  const run = (id: string) => new Promise<number | null>((done) => spawn(process.execPath, [script, w.root, id]).on("close", done));
  const codes = await Promise.all(["0001/A", "0002/B", "0003/C", "0004/D"].map(run));
  assert.deepEqual(codes, [0, 0, 0, 0]);
  assert.equal(loadRequests(w.root).length, 16);
});

test("a waiter outlasts a queue of holders longer than its wait while the lock keeps changing hands", () => {
  const file = join(mkdtempSync(join(scratch, "queue-")), "queue.json");
  const lock = `${file}.lock`;
  // The test's own clock, so load can't decide it: each pause of the waiter is one second and one hand-off, 20 holders against a 4 s wait.
  // Every holder leaves the same file with the same times (ahead of now, so never stale): only the token says the lock changed hands.
  const taken = new Date(Date.now() + 3_600_000);
  let now = 0;
  let holder = 0;
  const hold = () => {
    writeFileSync(lock, `holder ${holder}`);
    utimesSync(lock, taken, taken);
  };
  const pause = () => {
    now += 1_000;
    if (++holder < 20) hold();
    else rmSync(lock);
  };
  hold();
  assert.equal(locked(file, () => "got", "q", undefined, 4_000, { now: () => now, pause }), "got");
  assert.equal(now, 20_000, "got only after the whole queue");
  assert.equal(existsSync(lock), false);
});

test("every hold of a lock writes its own token, so two holds never look like one", () => {
  const file = join(mkdtempSync(join(scratch, "token-")), "token.json");
  const held = () => locked(file, () => readFileSync(`${file}.lock`, "utf8"), "q");
  const first = held();
  assert.notEqual(first, "");
  assert.notEqual(held(), first);
});

test("a live lock that never changes hands is still given up on after the wait", () => {
  const file = join(mkdtempSync(join(scratch, "stuck-")), "stuck.json");
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(`${file}.lock`, "");
  const began = Date.now();
  assert.throws(() => locked(file, () => 1, "q", undefined, 300), /is locked/);
  assert.ok(Date.now() - began >= 300);
});

test("the board's asynchronous wait outlasts a moving lock queue too", async () => {
  const { lockedAsync } = (await load("../dist/braids/state.js")) as { lockedAsync: <T>(file: string, fn: () => Promise<T>, what?: string, makeDir?: undefined, waitMs?: number) => Promise<T> };
  const file = join(mkdtempSync(join(scratch, "queue-async-")), "queue.json");
  const lock = `${file}.lock`;
  // Waiter and holders share this process's timers, so load delays both alike: 12 holders of 250 ms each against a 2 s wait.
  let holder = 0;
  writeFileSync(lock, "holder 0");
  const timer = setInterval(() => {
    if (++holder < 12) writeFileSync(lock, `holder ${holder}`);
    else {
      clearInterval(timer);
      rmSync(lock);
    }
  }, 250);
  try {
    assert.equal(await lockedAsync(file, async () => holder, "q", undefined, 2_000), 12);
  } finally {
    clearInterval(timer);
  }
});

test("a stale lock is taken over and the lock is released", () => {
  const w = world();
  const lock = lockOf(w.root);
  mkdirSync(dirname(lock), { recursive: true });
  writeFileSync(lock, "");
  const old = new Date(Date.now() - 60_000);
  utimesSync(lock, old, old);
  openRequest(w.root, req("0001"));
  assert.equal(loadRequests(w.root).length, 1);
  assert.equal(existsSync(lock), false, "the lock is released");
});

test("filterLive is pure, and takes the state in either letter case", () => {
  const head = "a".repeat(40);
  const list = [req("0001/A", { kind: "review", pr: 5, head }), req("0001", { kind: "decision" })];
  const pr = (state: string, h = head) => () => ({ state, headRefOid: h });
  assert.equal(filterLive(list, pr("OPEN")).length, 2);
  assert.equal(filterLive(list, pr("open")).length, 2, "the board's lowercase state keeps the review");
  assert.deepEqual(filterLive(list, pr("merged")).map((r) => (r as { id: string }).id), ["0001"]);
  assert.equal(filterLive(list, pr("OPEN", "b".repeat(40))).length, 1);
  assert.equal(filterLive(list, () => null).length, 2);
});

const { takeOverStale } = (await load("../dist/braids/requests.js")) as { takeOverStale: (lock: string, staleMs?: number) => boolean };

test("a stale lock goes to one waiter only: the second looks again and leaves the first one's new lock alone", () => {
  const w = world();
  const lock = lockOf(w.root);
  mkdirSync(dirname(lock), { recursive: true });
  writeFileSync(lock, "");
  const old = new Date(Date.now() - 60_000);
  utimesSync(lock, old, old);
  // Both waiters found it stale. The first takes it over and creates its own lock.
  assert.equal(takeOverStale(lock), true);
  assert.equal(existsSync(lock), false);
  writeFileSync(lock, "", { flag: "wx" });
  // The second still believes the old one is stale: it must see the fresh lock and take nothing.
  assert.equal(takeOverStale(lock), false);
  assert.equal(existsSync(lock), true, "the first waiter's lock stands");
  assert.equal(existsSync(`${lock}.takeover`), false, "the guard is released");
  // A takeover that is under way blocks the other; one left by a dead process is cleared after 30 s.
  const guard = `${lock}.takeover`;
  writeFileSync(guard, "");
  utimesSync(lock, old, old);
  assert.equal(takeOverStale(lock), false, "someone else is taking over");
  assert.equal(existsSync(lock), true);
  utimesSync(guard, old, old);
  assert.equal(takeOverStale(lock), false, "the dead guard is cleared first");
  assert.equal(takeOverStale(lock), true);
});

test("overlapping writers in separate processes lose no update when they start on a stale lock", async () => {
  const w = world();
  const lock = lockOf(w.root);
  mkdirSync(dirname(lock), { recursive: true });
  writeFileSync(lock, "");
  const old = new Date(Date.now() - 60_000);
  utimesSync(lock, old, old);
  const script = join(scratch, "writer-stale.mjs");
  writeFileSync(script, `import { openRequest } from ${JSON.stringify(pathToFileURL(fileURLToPath(new URL("../dist/braids/requests.js", import.meta.url))).href)};
const [root, id] = process.argv.slice(2);
for (let i = 0; i < 3; i++) openRequest(root, { id: id + i, kind: "question", text: "x", at: "2026-11-15T12:00:00Z", thread: null });`);
  const run = (id: string) => new Promise<number | null>((done) => spawn(process.execPath, [script, w.root, id]).on("close", done));
  const codes = await Promise.all(["0001/A", "0002/B", "0003/C", "0004/D", "0005/E", "0006/F"].map(run));
  assert.deepEqual(codes, [0, 0, 0, 0, 0, 0]);
  assert.equal(loadRequests(w.root).length, 18);
  assert.equal(existsSync(lock), false);
});

test("the state folder ignores itself, so it never shows as untracked", () => {
  const w = world();
  openRequest(w.root, req("0001"));
  assert.equal(readFileSync(join(dirname(legacyFile(w.root)), ".gitignore"), "utf8"), "*\n");
  assert.equal(git(w.root, "status", "--porcelain", "--untracked-files=all"), "");
});

test("handover passes a head with no checks that only adds braids/ changes on a green commit, and names that commit", async () => {
  const w = world();
  w.green.add(w.first);
  let n = 0;
  const on = (path: string) => {
    git(w.root, "checkout", "-q", "braid/0001/A-first");
    mkdirSync(dirname(join(w.root, path)), { recursive: true });
    writeFileSync(join(w.root, path), `x${++n}\n`);
    git(w.root, "add", "-A");
    git(w.root, "commit", "-q", "-m", "next");
    git(w.root, "checkout", "-q", "main");
    return git(w.root, "rev-parse", "braid/0001/A-first");
  };
  w.pr.head = on("braids/0001-alpha/A-first/report.md");
  w.pr.checks = "PENDING";
  const out = (await handoverCommand(w.root, ["0001/A", "--head", w.pr.head], { gh: w.gh, now: w.clock })) as string;
  assert.match(out, new RegExp("checks skipped on " + w.pr.head.slice(0, 7) + ": only braids/ changed since " + w.first.slice(0, 7)));
  // A code change on top refuses; so does a failed check on the head.
  w.pr.head = on("code.txt");
  await assert.rejects(handoverCommand(w.root, ["0001/A", "--head", w.pr.head], { gh: w.gh, now: w.clock }) as Promise<string>, /verify pending/);
  w.pr.head = on("braids/0001-alpha/A-first/report.md");
  w.pr.checks = "FAILURE";
  await assert.rejects(handoverCommand(w.root, ["0001/A", "--head", w.pr.head], { gh: w.gh, now: w.clock }) as Promise<string>, /verify failing/);
});

test("handover: a cancelled, action-required or stale ci check is not green; success, neutral and skipped are", async () => {
  const w = world();
  const go = () => handoverCommand(w.root, ["0001/A", "--head", w.first], { gh: w.gh, now: w.clock }) as Promise<string>;
  for (const conclusion of ["CANCELLED", "ACTION_REQUIRED", "STALE"]) {
    w.pr.checks = conclusion;
    await assert.rejects(go(), /not green.*verify failing/, conclusion);
  }
  assert.deepEqual(loadRequests(w.root), []);
  for (const conclusion of ["NEUTRAL", "SKIPPED"]) {
    w.pr.checks = conclusion;
    await go();
  }
});

test("ask and answer find a braid that lives only on its branch, from the main checkout", () => {
  const w = world();
  git(w.root, "checkout", "-q", "-b", "braid/0002-beta", "main");
  mkdirSync(join(w.root, "braids", "0002-beta"), { recursive: true });
  writeFileSync(join(w.root, "braids", "0002-beta", "brief.md"), brief("0002", "To Do"));
  git(w.root, "add", "-A");
  git(w.root, "commit", "-q", "-m", "docs: plan 0002");
  git(w.root, "push", "-q", "origin", "braid/0002-beta");
  git(w.root, "checkout", "-q", "main");
  git(w.root, "branch", "-D", "braid/0002-beta");
  assert.equal(existsSync(join(w.root, "braids", "0002-beta")), false, "not in the working tree");
  assert.match(askCommand(w.root, ["0002", "Go?", "--kind", "decision"], { now: w.clock }) as string, /^q-[a-z0-9]{4} 0002: decision request opened/);
  assert.deepEqual(loadRequests(w.root).map((r) => r.id), ["0002"]);
  assert.match(answerCommand(w.root, w.root, ["0002"]), /answered by the user/);
  assert.throws(() => askCommand(w.root, ["0009", "x"]), /no braid 0009/);
});
