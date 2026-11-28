// 0080/E: signed in to T3, the board stops a braid's working top-level threads with `stop: true` before its pause or hold text
// (children stop with their parent), shows the threads still working and the refused stops on the card, pushes once at 2 minutes,
// and falls back to the CLI on a 401; signed out it sends exactly as before and a hold stays a record. The MCP side is the mock T3
// (test/fixtures/t3-mcp-mock.ts), the CLI side a fake runner; no test reaches a real T3.
import assert from "node:assert/strict";
import childProcess, { spawnSync } from "node:child_process";
import { syncBuiltinESMExports } from "node:module";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, mock, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { MOCK_TOKEN, startT3Mock } from "./fixtures/t3-mcp-mock.ts";

/* eslint-disable @typescript-eslint/no-explicit-any */
const load = (path: string) => import(pathToFileURL(fileURLToPath(new URL(path, import.meta.url))).href);
const { steerer }: any = await load("../dist/board/steerer.js");
const { readLimitsView }: any = await load("../dist/board/limits.js");
const { loadPauses, setPause }: any = await load("../dist/braids/pauses.js");
const { pauseView }: any = await load("../dist/board/pause.js");
const { mcpClient }: any = await load("../dist/t3mcp/client.js");

const scratch = mkdtempSync(join(tmpdir(), "braid-board-stop-"));
after(() => rmSync(scratch, { recursive: true, force: true, maxRetries: 20, retryDelay: 250 }));

const MIN = 60_000;
const NOW = new Date("2026-11-22T12:00:00.000Z");
const iso = (minutes: number, from: Date = NOW) => new Date(from.getTime() + minutes * MIN).toISOString();
const later = (min: number) => new Date(NOW.getTime() + min * MIN);

function git(cwd: string, ...args: string[]): void {
  const r = spawnSync("git", ["-c", "user.email=t@example.com", "-c", "user.name=t", ...args], { cwd, encoding: "utf8" });
  assert.equal(r.status, 0, `git ${args.join(" ")}: ${r.stderr}`);
}
const brief = (id: string) => `---\nid: '${id}'\ntitle: "T ${id}"\nstatus: In Progress\nlabels: []\ndependencies: []\n---\n\n## Goal\n\nx\n`;

/** A repository with braid 0070 on `claude`, and its own caches folder. */
function project(): { root: string; caches: string } {
  const root = mkdtempSync(join(scratch, "p-"));
  const put = (path: string, text: string) => {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  };
  git(root, "init", "-q", "-b", "main");
  put("BRAID.md", "---\nmain: main\nmodels:\n  coordinator: claude / claude-opus-5-5 / effort=medium\n  worker: claude / claude-sonnet-5-5 / effort=medium\n---\n");
  put("braids/0070-a/brief.md", brief("0070"));
  git(root, "add", "-A");
  git(root, "commit", "-q", "-m", "x");
  const caches = join(root, "caches");
  mkdirSync(caches);
  return { root, caches };
}

function cache(caches: string, session: number): void {
  const windows = [{ id: "five_hour", kind: "session", label: "Session", usedPercent: session, resetsAt: iso(50) }];
  writeFileSync(join(caches, "claude.json"), JSON.stringify({ instanceId: "claude", usageLimits: { checkedAt: iso(-1), windows } }));
}

const COORD = "co-70";
const WORK = "work-70";
const REV = "rev-70";

/** T3 as the CLI snapshot reads it: 0070's running coordinator, a worker and a reviewer on claude. */
function snapshot() {
  return {
    status: { state: "ok" },
    coordinators: new Map([["0070", { id: COORD, link: null, provider: "claude", model: null }]]),
    threads: new Map([["0070/A", [{ id: WORK, role: "worker", pending: 0, link: null, provider: "claude" }, { id: REV, role: "reviewer", pending: 0, link: null, provider: "claude" }]]]),
    idle: new Map(),
    states: new Map(),
  };
}

const braids = () => [{ number: "0070", folder: "braids/0070-a", brief: { id: "0070", title: "T 0070", status: "In Progress", labels: [], dependencies: [], body: "" }, strands: [], source: null, logs: [], hasReport: false }];

function good(root: string, caches: string, at: Date) {
  const t3 = snapshot();
  const pauses = new Map(loadPauses(root).pauses.map((p: any) => [p.braid, p]));
  return { braids: braids(), t3, board: { braids: [], limits: readLimitsView(root, t3, pauses, at, caches), programmes: [] }, sig: {} };
}

/** A fake `t3` command line: show answers `shown(thread)`; each send notes how many MCP calls had gone out by then. */
function fakeT3(mcpCalls: () => number, shown: (thread: string) => unknown = () => ({ thread: { status: "running" }, messages: [] })) {
  const sends: { thread: string; input: string; mcpBefore: number }[] = [];
  const run = async (_root: string, args: string[], input?: string) => {
    if (args[1] === "show") {
      return { status: 0, stdout: JSON.stringify(shown(args[2] ?? "")), stderr: "" };
    }
    if (args[1] === "send") {
      sends.push({ thread: args[2] ?? "", input: input ?? args[3] ?? "", mcpBefore: mcpCalls() });
      return { status: 0, stdout: "{}", stderr: "" };
    }
    return { status: 1, stdout: "", stderr: "unexpected" };
  };
  return { run, sends };
}

async function setup(o: { signedIn?: boolean; shown?: (thread: string) => unknown } = {}) {
  const mock = await startT3Mock();
  after(() => mock.close());
  const { root, caches } = project();
  const tools = () => mock.requests.filter((r) => r.method === "tools/call");
  const interrupts = () => tools().filter((r) => r.params["name"] === "t3_thread_interrupt").map((r) => r.params["arguments"] as { threadId: string; stop: boolean });
  const lists = () => tools().filter((r) => r.params["name"] === "t3_thread_list");
  const t3 = fakeT3(() => tools().length, o.shown);
  const client = mcpClient(mock.url, () => MOCK_TOKEN);
  const clock = { now: NOW };
  const pushes: { key: string; title: string; body: string }[] = [];
  const warnings: string[] = [];
  const s = steerer({ t3: t3.run, now: () => clock.now, caches, push: (_r: string, p: any) => pushes.push(p), warn: (l: string) => warnings.push(l), ...(o.signedIn === false ? {} : { mcp: () => client }) });
  const tick = async (at: Date = clock.now) => {
    clock.now = at;
    s.observe({ name: "p", root, repo: "repo", folder: () => root }, good(root, caches, at));
    await s.idle();
  };
  const record = () => loadPauses(root).pauses.find((p: any) => p.braid === "0070");
  return { mock, root, caches, t3, tools, interrupts, lists, tick, pushes, warnings, record };
}

/** The live list: the coordinator top-level, the worker its delegated child, the reviewer top-level, and a child of the worker. */
const LIVE = [
  { threadId: COORD, status: "running", parentThreadId: null },
  { threadId: WORK, status: "running", parentThreadId: COORD },
  { threadId: REV, status: "running", parentThreadId: null },
  { threadId: "kid-of-work-1234abcd", status: "running", parentThreadId: WORK },
];

const holdOf = (thread = "pm-thread") => ({ braid: "0070", reason: "hold", words: "Freeze for the release", provider: null, window: null, label: null, usedPercent: null, resetsAt: null, resumeAt: null, task: null, thread, by: "pm", at: NOW.toISOString() });

test("signed in, a limit pause stops each working top-level thread with stop: true before any text, never a child directly", async () => {
  const x = await setup();
  cache(x.caches, 98);
  x.mock.switches.threads = LIVE;
  await x.tick();
  assert.equal(x.lists().length, 1, "one live list in the tick");
  assert.deepEqual(x.lists()[0]?.params["arguments"], { allProjects: true, includeSubagents: true, statuses: ["queued", "preparing", "starting", "running", "waiting"], limit: 100 });
  assert.deepEqual(x.interrupts().map((a) => [a.threadId, a.stop]), [[COORD, true], [REV, true]], "the worker stops with its parent");
  assert.deepEqual(x.t3.sends.map((s) => s.thread), [COORD, WORK, REV], "then every target gets its text, as today");
  assert.ok(x.t3.sends.every((s) => s.mcpBefore === 3), "every text after the list and both stops");
  assert.match(x.t3.sends[0]?.input ?? "", /^Pause for claude Session/);
  const r = x.record();
  assert.deepEqual([r.stop.stopped, r.stop.refused, r.stop.still, r.stop.pushed], [[COORD, REV], [], [], false]);
  // A later tick stops nothing again; it reads the list once to see who still works.
  await x.tick(later(1));
  assert.equal(x.interrupts().length, 2);
  assert.equal(x.lists().length, 2);
  assert.deepEqual(x.record().stop.still.map((s: any) => s.thread), [COORD, WORK, REV, "kid-of-work-1234abcd"]);
  assert.match(pauseView(x.record(), later(1)).note, /still working: 0070, 0070\/A, 0070\/A, 0070\/A \(child 1234abcd\)$/);
});

test("signed in, threads already idle get only the text", async () => {
  const x = await setup();
  cache(x.caches, 98);
  x.mock.switches.threads = [];
  await x.tick();
  assert.equal(x.interrupts().length, 0);
  assert.deepEqual(x.t3.sends.map((s) => s.thread), [COORD, WORK, REV]);
  assert.deepEqual(x.record().stop.stopped, []);
});

test("a refused stop falls back to the text alone and the card says why", async () => {
  const x = await setup();
  cache(x.caches, 98);
  x.mock.switches.threads = LIVE;
  x.mock.switches.aboveLevel.add(COORD);
  await x.tick();
  assert.deepEqual(x.interrupts().map((a) => a.threadId), [COORD, REV]);
  assert.deepEqual(x.t3.sends.map((s) => s.thread), [COORD, WORK, REV], "the refused thread still gets its text");
  const r = x.record();
  assert.deepEqual(r.stop.refused, [{ item: "0070", thread: COORD, why: "thread runs above the board's level" }]);
  assert.match(pauseView(r, NOW).note, /stop refused: 0070 \(thread runs above the board's level\)$/);
});

test("a 401 mid-tick turns the rest of the tick to the CLI: no more MCP calls, every text still sent", async () => {
  const x = await setup();
  cache(x.caches, 98);
  x.mock.switches.threads = LIVE;
  x.mock.switches.revokeOn.add(COORD);
  await x.tick();
  assert.deepEqual(x.interrupts().map((a) => a.threadId), [COORD], "nothing by MCP after the 401");
  assert.deepEqual(x.t3.sends.map((s) => s.thread), [COORD, WORK, REV]);
  assert.ok(x.warnings.some((w) => /refused the board's sign-in; the board goes on by the t3 command line/.test(w)));
});

test("signed out, the pause sends exactly as before and nothing reaches the MCP endpoint", async () => {
  const out = await setup({ signedIn: false });
  const inn = await setup();
  for (const x of [out, inn]) {
    cache(x.caches, 98);
    x.mock.switches.threads = [];
    await x.tick();
  }
  assert.equal(out.mock.requests.length, 0);
  assert.deepEqual(out.t3.sends.map((s) => [s.thread, s.input]), inn.t3.sends.map((s) => [s.thread, s.input]), "the same texts to the same threads");
  assert.equal(out.record().stop, undefined, "no stop part");
});

test("signed in, a hold stops the working threads once, sends each the hold text, and counts its Held: replies", async () => {
  let answered = false;
  const x = await setup({ shown: () => (answered ? { thread: { status: "completed" }, messages: [{ role: "user", text: "Hold from the board: braid 0070 is held" }, { role: "assistant", text: "Committed.\n\nHeld: 0070/A" }] } : { thread: { status: "running" }, messages: [] }) });
  cache(x.caches, 10);
  x.mock.switches.threads = LIVE;
  setPause(x.root, holdOf());
  await x.tick();
  assert.deepEqual(x.interrupts().map((a) => [a.threadId, a.stop]), [[COORD, true], [REV, true]]);
  assert.deepEqual(x.t3.sends.map((s) => s.thread), [COORD, WORK, REV], "the pausing PM thread isn't one of them");
  assert.ok(x.t3.sends.every((s) => s.mcpBefore === 3));
  assert.match(x.t3.sends[0]?.input ?? "", /^Hold from the board: braid 0070 is held \(“Freeze for the release”\)\. .*start nothing, and don't restart your stopped tasks until a resume message\. End your turn with the line `Held: <id>`/);
  let r = x.record();
  assert.deepEqual([r.reason, r.by, r.replies.outcome, r.replies.total, r.stop.stopped], ["hold", "pm", "pausing", 3, [COORD, REV]]);
  assert.match(pauseView(r, NOW).note, /^held by the PM since \d\d:\d\d · 0 of 3 agents answered so far$/);
  answered = true;
  x.mock.switches.threads = [];
  await x.tick(later(1));
  r = x.record();
  assert.equal(r.replies.outcome, "paused");
  assert.equal(x.interrupts().length, 2, "stopped once");
  assert.equal(x.t3.sends.length, 3, "the text once");
  assert.match(pauseView(r, later(1)).note, /· held 3\/3$/);
});

test("signed out, a hold stays a record only", async () => {
  const x = await setup({ signedIn: false });
  cache(x.caches, 10);
  setPause(x.root, holdOf());
  await x.tick();
  assert.equal(x.t3.sends.length, 0);
  assert.equal(x.mock.requests.length, 0);
  assert.equal(x.record().replies, undefined);
});

test("threads still working 2 minutes after a stop show on the card and push once", async () => {
  const x = await setup();
  cache(x.caches, 10);
  x.mock.switches.threads = LIVE;
  setPause(x.root, holdOf());
  await x.tick();
  await x.tick(later(1));
  assert.deepEqual(x.pushes, [], "not before 2 minutes");
  x.mock.switches.threads = [{ threadId: WORK, status: "running", parentThreadId: COORD }];
  await x.tick(later(2));
  assert.equal(x.pushes.length, 1);
  assert.deepEqual([x.pushes[0]?.key, x.pushes[0]?.title], [`pause:still:0070:${NOW.toISOString()}`, "0070: 1 thread still working after the hold"]);
  assert.match(pauseView(x.record(), later(2)).note, /still working: 0070\/A$/);
  await x.tick(later(3));
  assert.equal(x.pushes.length, 1, "once");
  x.mock.switches.threads = [];
  await x.tick(later(4));
  assert.doesNotMatch(pauseView(x.record(), later(4)).note, /still working/, "gone quiet: the card says nothing more");
  assert.ok(x.lists().length <= 5, "at most one list per tick");
});

test("the limit clash: a thread whose last run failed on a usage limit counts as paused, not as missing its reply", async () => {
  const limited = { thread: { status: "failed" }, messages: [{ role: "user", text: "Pause for claude Session until 12:55." }], error: "You've hit your usage limit · resets 3:45pm" };
  const answered = { thread: { status: "completed" }, messages: [{ role: "user", text: "Pause for claude Session until 12:55." }, { role: "assistant", text: "Paused: 0070" }] };
  const x = await setup({ signedIn: false, shown: (thread) => (thread === REV ? limited : answered) });
  cache(x.caches, 98);
  await x.tick();
  await x.tick(later(1));
  const r = x.record();
  assert.deepEqual([r.replies.outcome, r.replies.answered, r.replies.total, r.replies.noAnswer], ["paused", 3, 3, []]);
});

test("a signed-in pause starts no synchronous process: the stop is MCP calls and the texts async t3 sends", async () => {
  const x = await setup();
  // A first refresh under the threshold reads the repository once (its main checkout is cached from then on, as on a running board).
  cache(x.caches, 10);
  await x.tick();
  cache(x.caches, 98);
  x.mock.switches.threads = LIVE;
  const calls: string[] = [];
  for (const name of ["spawnSync", "execFileSync", "execSync"] as const) {
    const original = (childProcess as any)[name];
    mock.method(childProcess as any, name, (...args: any[]) => {
      calls.push(`${name} ${String(args[0])}`);
      return original(...args);
    });
  }
  syncBuiltinESMExports();
  try {
    await x.tick();
    await x.tick(later(1));
  } finally {
    mock.restoreAll();
    syncBuiltinESMExports();
  }
  assert.equal(x.interrupts().length, 2);
  assert.deepEqual(calls, []);
});
