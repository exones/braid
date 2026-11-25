// One acting board per provider account and per repository (0074/B): the lease files in a temporary braid home, two steerers on one
// repository, a stale lease taken over, a failed limit push kept across a restart, and two projects' children and BRAID.md kept apart.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const load = (path: string) => import(pathToFileURL(fileURLToPath(new URL(path, import.meta.url))).href);
const { steerer } = await load("../dist/board/steerer.js");
const { actingBoard, actingLines, providerKey, repoKey, readLeases } = await load("../dist/board/acting.js");
const { readLimitsView, mergeLimits } = await load("../dist/board/limits.js");
const { actingText } = await load("../dist/board/limits-view.js");
const { loadPauses, setPause } = await load("../dist/braids/pauses.js");
const { limitPusher, readSent } = await load("../dist/notify/notifier.js");

const scratch = mkdtempSync(join(tmpdir(), "braid-board-acting-"));
after(() => rmSync(scratch, { recursive: true, force: true, maxRetries: 20, retryDelay: 250 }));

const MIN = 60_000;
const NOW = new Date("2026-11-25T12:00:00.000Z");
const iso = (minutes: number, from: Date = NOW) => new Date(from.getTime() + minutes * MIN).toISOString();
const STALE = 90_000;

function git(cwd: string, ...args: string[]): void {
  const r = spawnSync("git", args, { cwd, encoding: "utf8" });
  assert.equal(r.status, 0, `git ${args.join(" ")}: ${r.stderr}`);
}
const brief = (id: string) => `---\nid: '${id}'\ntitle: "T ${id}"\nstatus: In Progress\nlabels: []\ndependencies: []\n---\n\n## Goal\n\nx\n`;

/** A repository with braid 0070 and a BRAID.md naming `claude` (with `limits` when given); `caches` may be shared between projects. */
function project(caches?: string, limits = ""): { root: string; caches: string } {
  const root = mkdtempSync(join(scratch, "p-"));
  const put = (path: string, text: string) => {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  };
  git(root, "init", "-q", "-b", "main");
  put("BRAID.md", `---\nmain: main\nmodels:\n  coordinator: claude / claude-opus-5-5 / effort=medium\n  worker: claude / claude-sonnet-5-5 / effort=medium\n  steering:\n    first: codex / gpt-6-luna / effort=low\n${limits}---\n`);
  put("braids/0070-a/brief.md", brief("0070"));
  git(root, "-c", "user.email=t@example.com", "-c", "user.name=t", "add", "-A");
  git(root, "-c", "user.email=t@example.com", "-c", "user.name=t", "commit", "-q", "-m", "x");
  const own = caches ?? join(root, "caches");
  mkdirSync(own, { recursive: true });
  return { root, caches: own };
}

function cache(caches: string, id: string, session: number, at: Date): void {
  const windows = [
    { id: "five_hour", kind: "session", label: "Session", usedPercent: session, resetsAt: iso(50, at) },
    { id: "seven_day", kind: "weekly", label: "Weekly", usedPercent: 20, resetsAt: iso(3 * 24 * 60, at) },
  ];
  writeFileSync(join(caches, `${id}.json`), JSON.stringify({ instanceId: id, usageLimits: { checkedAt: iso(-1, at), windows } }));
}

/** 0070's coordinator and worker on claude, with the thread ids prefixed; `known` are more threads T3's list names for the project. */
function threads(prefix: string, known: string[] = []) {
  return {
    status: { state: "ok" },
    coordinators: new Map([["0070", { id: `${prefix}coord`, link: null, provider: "claude", model: "claude-opus-5-5" }]]),
    threads: new Map([["0070", [{ id: `${prefix}work`, role: "worker", pending: 0, link: null, provider: "claude" }]]]),
    idle: new Map(),
    states: new Map(known.map((k) => [k, "running"])),
    providers: new Map(),
  };
}

const braidsOf = () => [{ number: "0070", folder: "braids/0070", brief: { id: "0070", title: "T 0070", status: "In Progress", labels: [], dependencies: [], body: "" }, strands: [], source: null, logs: [], hasReport: false }];

function good(root: string, caches: string, at: Date, t3: ReturnType<typeof threads>) {
  const pauses = new Map(loadPauses(root).pauses.map((p: { braid: string }) => [p.braid, p]));
  return { braids: braidsOf(), t3, board: { braids: [], limits: readLimitsView(root, t3, pauses, at, caches), programmes: [] } };
}

/** A fake `t3` shared by the boards: every call is recorded; show answers the Steering line `line()`. */
function fakeT3(line: () => string = () => "") {
  const calls: { root: string; args: string[] }[] = [];
  const run = async (root: string, args: string[]) => {
    calls.push({ root, args });
    if (args[1] === "start") {
      return { status: 0, stdout: JSON.stringify({ threadId: "steer-1", link: null }), stderr: "" };
    }
    if (args[1] === "show") {
      return { status: 0, stdout: JSON.stringify({ thread: { status: "idle" }, messages: [{ role: "assistant", text: line() }] }), stderr: "" };
    }
    return { status: 0, stdout: "{}", stderr: "" };
  };
  return { run, sends: () => calls.filter((c) => c.args[1] === "send"), starts: () => calls.filter((c) => c.args[1] === "start") };
}

/** A paused record of 0070 on claude, due at `due`, with the two threads of `prefix` as targets. */
function record(root: string, prefix: string, due: Date): void {
  setPause(root, {
    braid: "0070",
    reason: "limit",
    provider: "claude",
    window: "five_hour",
    label: "Session",
    usedPercent: 98,
    resetsAt: iso(-5, due),
    resumeAt: due.toISOString(),
    task: null,
    thread: "steer-0",
    by: "board",
    at: iso(-60, due),
    targets: [
      { thread: `${prefix}coord`, kind: "coordinator", item: "0070", project: root },
      { thread: `${prefix}work`, kind: "worker", item: "0070", project: root },
    ],
    steering: { thread: "steer-0", link: null, provider: "codex", model: "gpt-6-luna", started: iso(-60, due), outcome: "paused", answered: 2, total: 2, children: [], noAnswer: [], reason: null, self: false },
  });
}

test("two boards on one repository started at the same instant: one takes each lease, so one resume per thread, one wake and one push", async () => {
  const home = mkdtempSync(join(scratch, "home-"));
  const { root, caches } = project();
  record(root, "", NOW);
  cache(caches, "claude", 10, NOW);
  const t3 = fakeT3();
  const wakes: string[] = [];
  const pushes: string[] = [];
  const retries: string[] = [];
  const boards = [1, 2].map((n) => {
    const acting = actingBoard({ home, staleMs: STALE, now: () => NOW, port: () => 4000 + n });
    const s = steerer({
      t3: t3.run,
      now: () => NOW,
      caches,
      acting,
      push: (_r: string, p: { title: string }) => pushes.push(p.title),
      retry: (r: string) => retries.push(r),
      wake: async (p: { root: string }) => void wakes.push(p.root),
      warn: () => {},
    });
    return { s, acting };
  });
  // Both refreshes land together: both ticks are queued before either runs.
  for (const b of boards) {
    b.s.observe({ name: "p", root, repo: "repo", folder: () => root }, good(root, caches, NOW, threads("")));
  }
  await Promise.all(boards.map((b) => b.s.idle()));
  assert.deepEqual(t3.sends().map((c) => c.args[2]), ["coord", "work"], "each thread is resumed once");
  assert.deepEqual(pushes, ["claude resumed"]);
  assert.deepEqual(wakes, [root]);
  assert.deepEqual(retries, [root], "only the acting board sends the pending pushes");
  assert.deepEqual(loadPauses(root).pauses, []);
  // Each lease is one file, held by the first board; the second says who acts.
  const leases = readLeases(home);
  assert.deepEqual(leases.map((l: { key: string }) => l.key).sort(), [providerKey("claude"), providerKey("codex"), repoKey(root)].sort());
  assert.ok(leases.every((l: { board: string; port: number }) => l.board === boards[0]?.acting.id && l.port === 4001));
  const keys = [{ key: repoKey(root), label: "repo" }, { key: providerKey("claude"), label: "claude" }];
  assert.deepEqual(boards[0]?.acting.lines(keys).map((l: { state: string }) => l.state), ["acting", "acting"]);
  const watching = boards[1]?.acting.lines(keys);
  assert.deepEqual(watching.map((l: { state: string; by: string }) => [l.state, l.by]), [
    ["watching", `the board on port 4001 (pid ${process.pid}) acts`],
    ["watching", `the board on port 4001 (pid ${process.pid}) acts`],
  ]);
  // The page's lines, and braid board service status's.
  assert.deepEqual(actingText({ acting: watching }), ["Watching: the board on port 4001 (pid " + process.pid + ") acts for the wakes and reminders of repo.", "Watching: the board on port 4001 (pid " + process.pid + ") acts for the pause and resume of claude."]);
  assert.deepEqual(actingText({ acting: boards[0]?.acting.lines(keys) }), ["This board acts for the pauses, resumes and wakes."]);
  assert.equal(actingText({}), null, "a board that pauses nothing says nothing");
  const status = actingLines(4002, home, NOW, STALE);
  assert.equal(status.length, 3, "the repository, claude and codex (the steering line's provider)");
  assert.ok(status.every((l: string) => l.startsWith(`Watching: the board on port 4001 (pid ${process.pid}) acts for `)));
  assert.match(actingLines(4001, home, NOW, STALE)[0] ?? "", /^Acting: for the (wakes|pause) of /);
  // Combined projects show each key once.
  const view = (acting: unknown) => ({ limits: { session: 97, weekly: 95, buffer: 5, stale: 10 }, readAt: NOW.toISOString(), providers: [], note: null, acting });
  assert.equal(mergeLimits([{ project: "a", view: view(watching) }, { project: "b", view: view(watching) }]).acting.length, 2);
  // A board that stops gives its leases up: the other acts from its next refresh.
  boards[0]?.acting.release();
  assert.deepEqual(readLeases(home), []);
  assert.equal(boards[1]?.acting.hold(repoKey(root), "repo"), true);
  boards[1]?.acting.release();
});

test("a lease whose heartbeat went stale, or whose board's process is gone, is taken over; a live one is not", () => {
  const home = mkdtempSync(join(scratch, "home-"));
  const clock = { now: NOW };
  const gone = new Set<number>();
  const alive = (pid: number) => !gone.has(pid);
  const a = actingBoard({ home, staleMs: STALE, now: () => clock.now, pid: 111, alive });
  const b = actingBoard({ home, staleMs: STALE, now: () => clock.now, pid: 222, alive });
  const key = providerKey("claude");
  assert.equal(a.hold(key, "claude"), true);
  assert.equal(b.hold(key, "claude"), false);
  // A renews its heartbeat at each tick: a minute later it still holds, and B still watches.
  clock.now = new Date(NOW.getTime() + MIN);
  assert.equal(a.hold(key, "claude"), true);
  clock.now = new Date(NOW.getTime() + 2 * MIN);
  assert.equal(b.hold(key, "claude"), false);
  // A stops ticking (hung, or its machine slept): three refreshes later B takes over, and A then watches.
  clock.now = new Date(NOW.getTime() + 2 * MIN + STALE);
  assert.equal(b.hold(key, "claude"), true);
  assert.equal(a.hold(key, "claude"), false);
  assert.equal(a.lines([{ key, label: "claude" }])[0].state, "watching");
  // B's process is gone (killed outright, no release): A takes over at once, though the heartbeat is fresh.
  gone.add(222);
  assert.equal(a.hold(key, "claude"), true);
  assert.equal(readLeases(home)[0]?.pid, 111);
});

test("a failed limit push is kept in notified.json and sent after a board restart by the acting board", async () => {
  const dir = mkdtempSync(join(scratch, "n-"));
  const file = join(dir, ".braid", "notified.json");
  const config = () => ({ enabled: true, server: "https://ntfy.example", topic: "t" });
  const sent: string[] = [];
  const push = { key: "pause:claude:five_hour:x:resumed", title: "claude resumed", body: "b", tags: ["arrow_forward"], priority: "default", click: null };
  const first = limitPusher({ file, config, send: async () => Promise.reject(new Error("ntfy.example answered HTTP 502")), token: () => null, warn: () => {} });
  first(push);
  await first.idle();
  assert.deepEqual(readSent(file).pending, { [push.key]: push }, "the failed push waits in the file");
  assert.ok(!(push.key in readSent(file).keys));
  // The board stops; a new one starts. Its steerer calls retry for the repository it acts for.
  const second = limitPusher({ file, config, send: async (_c: unknown, p: { title: string }) => void sent.push(p.title), token: () => null, warn: () => {} });
  const { root, caches } = project();
  const s = steerer({ t3: fakeT3().run, now: () => NOW, caches, acting: actingBoard({ home: mkdtempSync(join(scratch, "home-")), staleMs: STALE, now: () => NOW }), retry: () => second.retry(), warn: () => {} });
  s.observe({ name: "p", root, repo: "repo", folder: () => root }, good(root, caches, NOW, threads("")));
  await s.idle();
  await second.idle();
  assert.deepEqual(sent, ["claude resumed"]);
  assert.deepEqual(readSent(file).pending, {});
  assert.ok(push.key in readSent(file).keys);
  // The need notifier's writes keep a pending push: only the keys are rewritten.
  first(push);
  await first.idle();
  assert.deepEqual(readSent(file).pending, {}, "a key already sent is not pushed again");
  assert.equal(JSON.parse(readFileSync(file, "utf8")).pending, undefined);
});

test("children are matched by project and braid, and the resume reads each project's own BRAID.md", async () => {
  const caches = mkdtempSync(join(scratch, "caches-"));
  // Project A pauses claude at 50%; B keeps the default (97%).
  const a = project(caches, "limits:\n  session: 50\n  weekly: 95\n  buffer: 5\n  stale: 10\n");
  const b = project(caches);
  cache(caches, "claude", 98, NOW);
  cache(caches, "codex", 10, NOW);
  const t3 = fakeT3(() => "Steering: claude paused 6/6; children: kid-a:0070, kid-b:0070; no answer: none");
  const clock = { now: NOW };
  const s = steerer({ t3: t3.run, now: () => clock.now, caches, warn: () => {} });
  const tick = async () => {
    s.observe({ name: "a", root: a.root, repo: "ra", folder: () => a.root }, good(a.root, caches, clock.now, threads("a-", ["kid-a"])));
    s.observe({ name: "b", root: b.root, repo: "rb", folder: () => b.root }, good(b.root, caches, clock.now, threads("b-", ["kid-b"])));
    await s.idle();
  };
  await tick();
  assert.equal(t3.starts().length, 1, "one steering thread for both projects");
  await tick();
  const kids = (root: string) => loadPauses(root).pauses[0].targets.filter((t: { kind: string }) => t.kind === "child").map((t: { thread: string; project: string }) => [t.thread, t.project]);
  assert.deepEqual(kids(a.root), [["kid-a", a.root]]);
  assert.deepEqual(kids(b.root), [["kid-b", b.root]]);
  // After the reset claude reads 60%: over A's threshold, under B's. A keeps its record; B resumes its own threads only.
  clock.now = new Date(NOW.getTime() + 60 * MIN);
  cache(caches, "claude", 60, clock.now);
  await tick();
  assert.deepEqual(t3.sends().map((c) => [c.args[2], c.root]), [
    ["b-coord", b.root],
    ["b-work", b.root],
    ["kid-b", b.root],
  ]);
  assert.equal(loadPauses(a.root).pauses.length, 1, "A is still over its own threshold");
  assert.equal(loadPauses(a.root).pauses[0].usedPercent, 60);
  assert.deepEqual(loadPauses(b.root).pauses, []);
});
