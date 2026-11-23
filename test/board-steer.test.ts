// The board's limits pause (0064/C): the steering lines, the targets, the claim under the lock, the steering thread's outcome,
// the resume clock, the pushes and the hold rule, with a fake T3 runner and cache files written here.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const load = (path: string) => import(pathToFileURL(fileURLToPath(new URL(path, import.meta.url))).href);
const { steerer } = await load("../dist/board/steerer.js");
const steer = await load("../dist/board/steer.js");
const { readLimitsView } = await load("../dist/board/limits.js");
const { loadPauses, setPause } = await load("../dist/braids/pauses.js");
const { pauseCommand, resumeCommand } = await load("../dist/commands/pauses.js");
const pause = await load("../dist/board/pause.js");
const { toBoard } = await load("../dist/board/model.js");
const { pushesOf } = await load("../dist/notify/message.js");
const { notifier, limitPusher } = await load("../dist/notify/notifier.js");
const { limitsLine, demoSources } = await load("../dist/commands/board.js");

const scratch = mkdtempSync(join(tmpdir(), "braid-board-steer-"));
after(() => rmSync(scratch, { recursive: true, force: true, maxRetries: 20, retryDelay: 250 }));

const MIN = 60_000;
const NOW = new Date("2026-11-22T12:00:00.000Z");
const iso = (minutes: number, from: Date = NOW) => new Date(from.getTime() + minutes * MIN).toISOString();

function git(cwd: string, ...args: string[]): void {
  const r = spawnSync("git", args, { cwd, encoding: "utf8" });
  assert.equal(r.status, 0, `git ${args.join(" ")}: ${r.stderr}`);
}
const brief = (id: string, status = "In Progress") => `---\nid: '${id}'\ntitle: "T ${id}"\nstatus: ${status}\nlabels: []\ndependencies: []\n---\n\n## Goal\n\nx\n`;
const STEERING = "  steering:\n    first: claude / claude-haiku-5-5 / effort=low\n    fallback: codex / gpt-6-luna / effort=low";

/** A repository with braids 0070 and 0071, a BRAID.md naming `claude` and `codex`, and its own caches folder. */
function project(steering = true): { root: string; caches: string } {
  const root = mkdtempSync(join(scratch, "p-"));
  const put = (path: string, text: string) => {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  };
  git(root, "init", "-q", "-b", "main");
  put("BRAID.md", `---\nmain: main\nmodels:\n  coordinator: claude / claude-opus-5-5 / effort=medium\n  worker: codex / gpt-6-luna / effort=medium\n${steering ? `${STEERING}\n` : ""}---\n`);
  put("braids/0070-a/brief.md", brief("0070"));
  put("braids/0071-b/brief.md", brief("0071"));
  git(root, "-c", "user.email=t@example.com", "-c", "user.name=t", "add", "-A");
  git(root, "-c", "user.email=t@example.com", "-c", "user.name=t", "commit", "-q", "-m", "x");
  const caches = join(root, "caches");
  mkdirSync(caches);
  return { root, caches };
}

/** Writes a provider's cache: a session window at `session`% and a weekly one at `weekly`%, checked a minute before `at`. */
function cache(caches: string, id: string, session: number, at: Date, weekly = 30, sessionReset = 50): void {
  const windows = [
    { id: "five_hour", kind: "session", label: "Session", usedPercent: session, resetsAt: iso(sessionReset, at) },
    { id: "seven_day", kind: "weekly", label: "Weekly", usedPercent: weekly, resetsAt: iso(3 * 24 * 60, at) },
  ];
  writeFileSync(join(caches, `${id}.json`), JSON.stringify({ instanceId: id, usageLimits: { checkedAt: iso(-1, at), windows } }));
}

/** The T3 snapshot: 0070's coordinator and worker on claude, 0071's worker on codex, a PM over 0070 on claude. */
function threads() {
  return {
    status: { state: "ok" },
    coordinators: new Map([["0070", { id: "coord-70", link: null, provider: "claude", model: "claude-opus-5-5" }]]),
    threads: new Map([
      ["0070", [{ id: "work-70", role: "worker", pending: 0, link: null, provider: "claude" }]],
      ["0071", [{ id: "work-71", role: "worker", pending: 0, link: null, provider: "codex" }]],
    ]),
    idle: new Map(),
    states: new Map([["pm-1", "idle"]]),
    providers: new Map([["pm-1", "claude"]]),
  };
}

const braidsOf = () =>
  ["0070", "0071"].map((n) => ({ number: n, folder: `braids/${n}`, brief: { id: n, title: `T ${n}`, status: "In Progress", labels: [], dependencies: [], body: "" }, strands: [], source: null, logs: [], hasReport: false }));

function good(root: string, caches: string, at: Date, t3 = threads()) {
  const pauses = new Map(loadPauses(root).pauses.map((p: { braid: string }) => [p.braid, p]));
  const limits = readLimitsView(root, t3, pauses, at, caches);
  return { braids: braidsOf(), t3, board: { limits, programmes: [{ thread: "pm-1", braids: ["0070"], section: "working" }] } };
}

interface Call {
  args: string[];
  input?: string;
}
/** A fake `t3`: start answers `steer-<n>` unless `failStart`, show answers `shown`, send fails for the ids in `failSend`. */
function fakeT3(o: { failStart?: number; shown?: () => unknown; failSend?: Set<string>; noId?: boolean; throwStart?: boolean } = {}) {
  const calls: Call[] = [];
  let starts = 0;
  const run = async (_root: string, args: string[], input?: string) => {
    calls.push({ args, ...(input === undefined ? {} : { input }) });
    if (args[1] === "start") {
      starts++;
      if (o.throwStart === true) {
        throw new Error("t3 crashed");
      }
      if (o.noId === true) {
        return { status: 0, stdout: JSON.stringify({ ok: true }), stderr: "" };
      }
      if (starts <= (o.failStart ?? 0)) {
        return { status: 1, stdout: "", stderr: "provider unavailable" };
      }
      return { status: 0, stdout: JSON.stringify({ threadId: `steer-${starts}`, link: `http://127.0.0.1:3773/env/steer-${starts}` }), stderr: "" };
    }
    if (args[1] === "show") {
      return { status: 0, stdout: JSON.stringify(o.shown?.() ?? { thread: { status: "running" }, messages: [] }), stderr: "" };
    }
    if (args[1] === "send") {
      return o.failSend?.has(args[2] ?? "") === true ? { status: 1, stdout: "", stderr: "unknown thread" } : { status: 0, stdout: "{}", stderr: "" };
    }
    return { status: 1, stdout: "", stderr: "unexpected" };
  };
  return { run, calls, starts: () => calls.filter((c) => c.args[1] === "start"), sends: () => calls.filter((c) => c.args[1] === "send") };
}

/** A steerer at a settable clock, with its pushes collected. */
function board(root: string, caches: string, t3: ReturnType<typeof fakeT3>, clock: { now: Date }) {
  const pushes: { key: string; title: string; priority: string; body: string }[] = [];
  const warnings: string[] = [];
  const s = steerer({ t3: t3.run, now: () => clock.now, caches, push: (_r: string, p: (typeof pushes)[number]) => pushes.push(p), warn: (l: string) => warnings.push(l) });
  const tick = async () => {
    s.observe({ name: "p", root, repo: "repo", folder: () => root }, good(root, caches, clock.now));
    await s.idle();
  };
  return { tick, pushes, warnings };
}

const records = (root: string) => loadPauses(root).pauses;

test("over its threshold the board records 0070 under the lock, then starts one steering thread on the free fallback; codex's 0071 is untouched", async () => {
  const { root, caches } = project();
  cache(caches, "claude", 98, NOW);
  cache(caches, "codex", 20, NOW);
  const t3 = fakeT3();
  const clock = { now: NOW };
  const b = board(root, caches, t3, clock);
  await b.tick();
  const [r, ...rest] = records(root);
  assert.equal(rest.length, 0, "only the braid with agents on claude");
  assert.equal(r.braid, "0070");
  assert.deepEqual([r.by, r.reason, r.provider, r.window, r.usedPercent, r.thread], ["board", "limit", "claude", "five_hour", 98, "steer-1"]);
  assert.equal(r.resumeAt, iso(55));
  assert.deepEqual(r.targets.map((t: { thread: string; kind: string }) => [t.thread, t.kind]), [["coord-70", "coordinator"], ["work-70", "worker"], ["pm-1", "pm"]]);
  assert.deepEqual([r.steering.provider, r.steering.model, r.steering.outcome, r.steering.self, r.steering.total], ["codex", "gpt-6-luna", "pausing", false, 3]);
  const [start] = t3.starts();
  assert.deepEqual(start?.args.slice(0, 8), ["thread", "start", root, "-", "--provider", "codex", "--model", "gpt-6-luna"]);
  assert.match(start?.args[9] ?? "", /^🚦 repo steering: pause claude Session 98$/);
  const message = start?.input ?? "";
  assert.match(message, /- coord-70 {2}coordinator {2}0070/);
  assert.match(message, /Pause for claude Session until \d\d:\d\d\. Finish or undo your current step; never stop mid-commit\./);
  assert.match(message, /Reply `Paused: <number>`/);
  assert.match(message, /includeSubagents: true/);
  assert.match(message, /Steering: claude paused <answered>\/<targets and children>; children: /);
  assert.deepEqual(b.pushes, [], "no push for a pause that has just started");
  // A later refresh, and a second board on the same repository, start nothing: the record is the claim.
  await b.tick();
  const other = board(root, caches, t3, clock);
  await other.tick();
  assert.equal(t3.starts().length, 1);
  assert.equal(records(root).length, 1);
});

test("the Steering line settles the pause: children join the targets; a missing answer is a high push", async () => {
  const { root, caches } = project();
  cache(caches, "claude", 98, NOW);
  cache(caches, "codex", 20, NOW);
  let text = "";
  const t3 = fakeT3({ shown: () => ({ thread: { status: "idle" }, messages: [{ role: "assistant", text }] }) });
  const clock = { now: NOW };
  const b = board(root, caches, t3, clock);
  await b.tick();
  text = "Done.\nSteering: claude paused 3/4; children: mcp:launch:abc123:0070, child-2; no answer: 0070";
  clock.now = new Date(NOW.getTime() + 40_000);
  await b.tick();
  const r = records(root)[0];
  assert.deepEqual([r.steering.outcome, r.steering.answered, r.steering.total, r.steering.noAnswer], ["partial", 3, 4, ["0070"]]);
  assert.deepEqual(r.targets.filter((t: { kind: string }) => t.kind === "child").map((t: { thread: string; item: string }) => [t.thread, t.item]), [["mcp:launch:abc123", "0070"], ["child-2", "0070"]]);
  assert.equal(b.pushes.length, 1);
  assert.deepEqual([b.pushes[0]?.title, b.pushes[0]?.priority], ["claude paused; 1 agent didn’t answer", "high"]);
  assert.match(b.pushes[0]?.key ?? "", /^pause:claude:five_hour:.*:paused$/);
  const view = pause.pauseView(r, clock.now);
  assert.equal(view.state, "due");
  assert.match(view.text, /1 agent didn’t answer/);
});

test("every agent answered: a quiet push, and the card says paused by the board with the count", async () => {
  const { root, caches } = project();
  cache(caches, "claude", 98, NOW);
  cache(caches, "codex", 20, NOW);
  const t3 = fakeT3({ shown: () => ({ thread: { status: "idle" }, messages: [{ role: "assistant", text: "Steering: claude paused 3/3; children: none; no answer: none" }] }) });
  const clock = { now: NOW };
  const b = board(root, caches, t3, clock);
  await b.tick();
  await b.tick();
  const r = records(root)[0];
  assert.equal(r.steering.outcome, "paused");
  assert.deepEqual([b.pushes[0]?.title, b.pushes[0]?.priority], [`claude paused until ${pause.clock(iso(55), NOW)}`, "low"]);
  const view = pause.pauseView(r, NOW);
  assert.equal(view.state, "paused");
  assert.equal(view.note, "paused by the board 0 min ago · 3 of 3 agents answered");
});

test("a pause still running after a minute is pushed once as pausing; a failed run or 15 minutes without the line fails it", async () => {
  const { root, caches } = project();
  cache(caches, "claude", 98, NOW);
  cache(caches, "codex", 20, NOW);
  let status = "running";
  const t3 = fakeT3({ shown: () => ({ thread: { status }, messages: [] }) });
  const clock = { now: NOW };
  const b = board(root, caches, t3, clock);
  await b.tick();
  clock.now = new Date(NOW.getTime() + 2 * MIN);
  await b.tick();
  assert.deepEqual(b.pushes.map((p) => p.title), ["claude: pausing"]);
  assert.equal(pause.pauseView(records(root)[0], clock.now).state, "pausing");
  status = "failed";
  await b.tick();
  const r = records(root)[0];
  assert.deepEqual([r.steering.outcome, r.steering.reason], ["failed", "stopped (failed) before every agent answered"]);
  assert.deepEqual([b.pushes[1]?.title, b.pushes[1]?.priority, b.pushes[1]?.key.endsWith(":failed")], ["claude: pause failed", "high", true]);
  // Needs You "Pause failed", derived from the record, and not pushed again as a need.
  const card = toBoard("repo", braidsOf(), { status: { state: "ok" }, prs: new Map() }, threads(), { now: clock.now, requests: new Map(), alarm: () => null, pauses: new Map([["0070", r]]) }).braids[0];
  assert.deepEqual([card.lane, card.reason], ["Waiting", "limit"]);
  assert.match(card.need.text, /^Pause failed: the 🚦 steering thread stopped \(failed\)/);
  assert.equal(pushesOf({ repo: "repo", braids: [card], programmes: [] }).length, 0);

  const late = project();
  cache(late.caches, "claude", 98, NOW);
  cache(late.caches, "codex", 20, NOW);
  const lateClock = { now: NOW };
  const l = board(late.root, late.caches, fakeT3(), lateClock);
  await l.tick();
  lateClock.now = new Date(NOW.getTime() + 15 * MIN);
  await l.tick();
  assert.equal(records(late.root)[0].steering.reason, "gave no Steering line in 15 min");
});

test("a start that fails tries the fallback once; both failing is a failed pause; every steering line over steers from the over provider", async () => {
  const one = project();
  cache(one.caches, "claude", 98, NOW);
  cache(one.caches, "codex", 20, NOW);
  // codex (the free one) fails, then claude is tried: the fallback of the pick is the other line.
  const t3 = fakeT3({ failStart: 1 });
  const b = board(one.root, one.caches, t3, { now: NOW });
  await b.tick();
  assert.deepEqual(t3.starts().map((c) => c.args[5]), ["codex", "claude"]);
  assert.deepEqual([records(one.root)[0].steering.provider, records(one.root)[0].steering.self], ["claude", true]);
  assert.deepEqual(b.pushes.map((p) => p.title), ["claude over, steering from it"]);

  const two = project();
  cache(two.caches, "claude", 98, NOW);
  cache(two.caches, "codex", 20, NOW);
  const failing = fakeT3({ failStart: 2 });
  const c = board(two.root, two.caches, failing, { now: NOW });
  await c.tick();
  assert.equal(failing.starts().length, 2, "the fallback once, no more");
  assert.deepEqual([records(two.root)[0].steering.outcome, records(two.root)[0].steering.reason], ["failed", "could not start (provider unavailable)"]);
  await c.tick();
  assert.equal(failing.starts().length, 2, "a failed pause isn't retried every refresh");

  const three = project();
  cache(three.caches, "claude", 98, NOW);
  cache(three.caches, "codex", 99, NOW);
  const both = fakeT3();
  await board(three.root, three.caches, both, { now: NOW }).tick();
  // Both over: one pause per provider (0070 on claude, 0071 on codex), each steered by steering.first in the margin of an over provider.
  assert.deepEqual(both.starts().map((s) => [s.args[5], s.args[9]]), [["claude", "🚦 repo steering: pause claude Session 98"], ["claude", "🚦 repo steering: pause codex Session 99"]]);
});

test("without a steering role nothing is paused, and the start line says so", async () => {
  const { root, caches } = project(false);
  cache(caches, "claude", 98, NOW);
  const t3 = fakeT3();
  const b = board(root, caches, t3, { now: NOW });
  await b.tick();
  assert.deepEqual(records(root), []);
  assert.equal(t3.calls.length, 0);
  assert.match(b.warnings[0] ?? "", /no models\.steering: nothing is paused/);
  assert.match(limitsLine("on", [{ name: "", root }]), /BRAID\.md has no models\.steering, so nothing is paused/);
  assert.match(limitsLine("on", [{ name: "", root: project().root }]), /steering claude \/ claude-haiku-5-5, then codex \/ gpt-6-luna/);
  assert.match(limitsLine("off", []), /--no-pause/);
  assert.match(limitsLine("demo", []), /demo/);
  assert.equal(demoSources().act, undefined, "--demo never acts");
});

test("at the reset plus the buffer the board re-checks: still over keeps the record with the new time; under resumes every thread and clears it", async () => {
  const { root, caches } = project();
  cache(caches, "claude", 98, NOW);
  cache(caches, "codex", 20, NOW);
  const t3 = fakeT3({ shown: () => ({ thread: { status: "idle" }, messages: [{ role: "assistant", text: "Steering: claude paused 4/4; children: child-1:0070; no answer: none" }] }) });
  const clock = { now: NOW };
  const b = board(root, caches, t3, clock);
  await b.tick();
  await b.tick();
  // At 12:56 the session reset hasn't come: the reading is over again, resetting 50 min later.
  clock.now = new Date(NOW.getTime() + 56 * MIN);
  cache(caches, "claude", 99, clock.now);
  await b.tick();
  assert.equal(t3.sends().length, 0);
  assert.equal(records(root)[0].resumeAt, iso(55, clock.now));
  assert.match(b.pushes.at(-1)?.title ?? "", /^claude still over: resumes /);
  assert.match(b.pushes.at(-1)?.key ?? "", /:extended:/);
  assert.match(b.pushes.at(-1)?.body ?? "", / [0-9]{4} stays paused[.]$/, "one braid: stays paused");
  // At the new time it is under.
  clock.now = new Date(clock.now.getTime() + 56 * MIN);
  cache(caches, "claude", 3, clock.now);
  await b.tick();
  assert.deepEqual(
    t3.sends().map((c) => [c.args[2], c.args[3]]),
    [
      ["coord-70", "Resume: 0070 was paused by the board for claude; go on where you left off"],
      ["work-70", "Resume: continue 0070 from your checkpoint"],
      ["pm-1", "Resume: 0070 were paused by the board for claude; go on where you left off"],
      ["child-1", "Resume: continue 0070 from your checkpoint"],
    ],
  );
  assert.deepEqual(records(root), []);
  assert.deepEqual([b.pushes.at(-1)?.title, b.pushes.at(-1)?.body], ["claude resumed", "Session at 3% after the reset. 0070 goes on."]);
});

test("a resume missed while no board ran happens at the first refresh after a start; a failed send keeps the record and retries only that thread", async () => {
  const { root, caches } = project();
  cache(caches, "claude", 98, NOW);
  cache(caches, "codex", 20, NOW);
  const t3 = fakeT3({ shown: () => ({ thread: { status: "idle" }, messages: [{ role: "assistant", text: "Steering: claude paused 3/3; children: none; no answer: none" }] }) });
  await board(root, caches, t3, { now: NOW }).tick();
  await board(root, caches, t3, { now: NOW }).tick();
  // The board was down at the resume time; a new one starts three hours later.
  const later = new Date(NOW.getTime() + 3 * 60 * MIN);
  cache(caches, "claude", 2, later);
  const failSend = new Set(["work-70"]);
  const t3b = fakeT3({ failSend });
  const b = board(root, caches, t3b, { now: later });
  await b.tick();
  assert.equal(records(root).length, 1, "kept while a send fails");
  assert.deepEqual(records(root)[0].resumed, ["coord-70", "pm-1"]);
  failSend.clear();
  await b.tick();
  assert.deepEqual(t3b.sends().map((c) => c.args[2]), ["coord-70", "work-70", "pm-1", "work-70"], "the retry sends only to the one that failed");
  assert.deepEqual(records(root), []);
  assert.equal(b.pushes.at(-1)?.title, `claude resumed (was due ${pause.clock(iso(55), later)})`);
});

test("a weekly window is pushed once at high priority and reads Needs You until the reset", async () => {
  const { root, caches } = project();
  cache(caches, "claude", 40, NOW, 96);
  cache(caches, "codex", 20, NOW);
  const b = board(root, caches, fakeT3(), { now: NOW });
  await b.tick();
  const r = records(root)[0];
  assert.equal(r.window, "seven_day");
  const weekly = b.pushes.find((p) => p.key.endsWith(":weekly"));
  assert.deepEqual([weekly?.title, weekly?.priority], ["claude weekly limit: needs you", "high"]);
  assert.match(weekly?.body ?? "", /move coordinator to another provider in BRAID\.md models/);
  const need = pause.limitNeed(r, NOW);
  assert.match(need?.text ?? "", /^Weekly limit: claude Weekly 96% until .*Wait for the reset, or move its roles/);
  assert.equal(pause.limitNeed(r, new Date(Date.parse(r.resumeAt) + MIN)), null, "not after the reset");
});

test("a hold outlives a limit pause: the board skips a held braid and never clears a hold; braid pause refuses it, resume --limit keeps it", async () => {
  const { root, caches } = project();
  cache(caches, "claude", 98, NOW);
  cache(caches, "codex", 20, NOW);
  const hold = { braid: "0070", reason: "hold", words: "freeze", provider: null, window: null, label: null, usedPercent: null, resetsAt: null, resumeAt: null, task: null, thread: "user-thread-1", by: "pm", at: NOW.toISOString() };
  setPause(root, hold);
  const t3 = fakeT3();
  await board(root, caches, t3, { now: NOW }).tick();
  assert.equal(t3.calls.length, 0, "a held braid's agents are already stopped: no target");
  assert.deepEqual(records(root).map((p: { reason: string }) => p.reason), ["hold"]);
  assert.throws(() => pauseCommand(root, ["0070", "--provider", "claude", "--thread", "coordinator-1"], { caches, now: NOW }), /it is held .* a hold outlives a limit pause/);
  assert.match(resumeCommand(root, ["0070", "--limit"]), /is held, not paused for a limit; --limit leaves the hold/);
  assert.equal(records(root)[0].reason, "hold");

  // A hold put on a braid the board paused replaces the board's record; the board's resume then leaves the hold alone.
  const other = project();
  cache(other.caches, "claude", 98, NOW);
  cache(other.caches, "codex", 20, NOW);
  const t3b = fakeT3({ shown: () => ({ thread: { status: "idle" }, messages: [{ role: "assistant", text: "Steering: claude paused 3/3; children: none; no answer: none" }] }) });
  const clock = { now: NOW };
  const b = board(other.root, other.caches, t3b, clock);
  await b.tick();
  await b.tick();
  setPause(other.root, hold);
  clock.now = new Date(NOW.getTime() + 60 * MIN);
  cache(other.caches, "claude", 2, clock.now);
  await b.tick();
  assert.equal(t3b.sends().length, 0);
  assert.deepEqual(records(other.root).map((p: { reason: string }) => p.reason), ["hold"]);
  assert.match(resumeCommand(other.root, ["0070"]), /0070 resumed: cleared Held/, "plain braid resume still lifts a hold");
});

test("the Steering line parser takes the last line and T3 ids with colons", () => {
  const r = steer.parseSteeringLine("x\nSteering: a paused 1/2; children: none; no answer: 0001/A\n`Steering: Claude_Everix paused 4/5; children: mcp:launch:ff:0064/C,abc; no answer: none`");
  assert.deepEqual(r, { provider: "Claude_Everix", answered: 4, total: 5, children: [{ thread: "mcp:launch:ff", item: "0064/C" }, { thread: "abc", item: null }], noAnswer: [] });
  assert.equal(steer.parseSteeringLine("no line here"), null);
});

test("the need notifier keeps limit keys while the limit pusher sends each once", async () => {
  const dir = mkdtempSync(join(scratch, "n-"));
  git(dir, "init", "-q");
  const file = join(dir, ".braid", "notified.json");
  const sent: string[] = [];
  const config = () => ({ enabled: true, server: "https://ntfy.example", topic: "t" });
  const send = async (_c: unknown, p: { title: string }) => void sent.push(p.title);
  const push = limitPusher({ file, config, send, token: () => null, warn: () => {} });
  const p = { key: "pause:claude:five_hour:x:paused", title: "claude paused until 12:55", body: "", tags: [], priority: "low", click: null };
  push(p);
  await push.idle();
  push(p);
  await push.idle();
  assert.deepEqual(sent, ["claude paused until 12:55"]);
  // A refresh of the need notifier, with no need at all, keeps the limit key.
  const needs = notifier({ file, config, send, clear: async () => {}, token: () => null, warn: () => {} });
  needs({ repo: "r", github: { state: "ok" }, t3: { state: "ok" }, braids: [], programmes: [] });
  await needs.idle();
  assert.ok("pause:claude:five_hour:x:paused" in JSON.parse(readFileSync(file, "utf8")).keys);
});

test("a start that exits 0 without a thread id is a failed start: the fallback once, then Pause failed", async () => {
  const { root, caches } = project();
  cache(caches, "claude", 98, NOW);
  cache(caches, "codex", 20, NOW);
  const t3 = fakeT3({ noId: true });
  const b = board(root, caches, t3, { now: NOW });
  await b.tick();
  assert.equal(t3.starts().length, 2);
  const r = records(root)[0];
  assert.deepEqual([r.steering.outcome, r.steering.thread, r.steering.reason], ["failed", null, "could not start (t3 thread start gave no thread id)"]);
  assert.equal(b.pushes.at(-1)?.title, "claude: pause failed");
  await b.tick();
  assert.equal(t3.starts().length, 2, "not retried");
});

test("a start that throws after the claim is a failed start; a claimed record never given a thread fails after 15 min", async () => {
  const { root, caches } = project();
  cache(caches, "claude", 98, NOW);
  cache(caches, "codex", 20, NOW);
  const t3 = fakeT3({ throwStart: true });
  const b = board(root, caches, t3, { now: NOW });
  await b.tick();
  assert.equal(t3.starts().length, 2, "the fallback once");
  assert.deepEqual([records(root)[0].steering.outcome, records(root)[0].steering.reason], ["failed", "could not start (t3 crashed)"]);

  // A board that stopped between the claim and the start left a pausing record with no thread: a later board fails it.
  const other = project();
  cache(other.caches, "claude", 98, NOW);
  cache(other.caches, "codex", 20, NOW);
  const steering = { thread: null, link: null, provider: "codex", model: "gpt-6-luna", started: NOW.toISOString(), outcome: "pausing", answered: null, total: 1, children: [], noAnswer: [], reason: null, self: false };
  setPause(other.root, { braid: "0070", reason: "limit", provider: "claude", window: "five_hour", label: "Session", usedPercent: 98, resetsAt: iso(50), resumeAt: iso(55), task: null, thread: "", by: "board", at: NOW.toISOString(), targets: [{ thread: "work-70", kind: "worker", item: "0070" }], steering });
  const clock = { now: new Date(NOW.getTime() + 5 * MIN) };
  const c = board(other.root, other.caches, fakeT3(), clock);
  await c.tick();
  assert.equal(records(other.root)[0].steering.outcome, "pausing", "not before the 15 minutes");
  clock.now = new Date(NOW.getTime() + 15 * MIN);
  await c.tick();
  assert.deepEqual([records(other.root)[0].steering.outcome, records(other.root)[0].steering.reason], ["failed", "never started: no steering thread was recorded"]);
  assert.equal(c.pushes.at(-1)?.title, "claude: pause failed");
});

test("a limit push whose send failed is sent again at the next refresh, and only then keyed", async () => {
  const dir = mkdtempSync(join(scratch, "r-"));
  git(dir, "init", "-q");
  const file = join(dir, ".braid", "notified.json");
  let down = true;
  const sent: string[] = [];
  const send = async (_c: unknown, p: { title: string }) => {
    if (down) {
      throw new Error("ntfy.example answered HTTP 502");
    }
    sent.push(p.title);
  };
  const warnings: string[] = [];
  const push = limitPusher({ file, config: () => ({ enabled: true, server: "https://ntfy.example", topic: "t" }), send, token: () => null, warn: (l: string) => warnings.push(l) });
  push({ key: "pause:claude:five_hour:x:resumed", title: "claude resumed", body: "", tags: [], priority: "default", click: null });
  await push.idle();
  assert.deepEqual([sent, push.pending()], [[], 1]);
  assert.match(warnings[0] ?? "", /a limit push failed .*retrying at each refresh/);
  push.retry();
  await push.idle();
  assert.equal(push.pending(), 1, "still down: still pending, no key");
  down = false;
  push.retry();
  await push.idle();
  assert.deepEqual([sent, push.pending()], [["claude resumed"], 0]);
  assert.ok("pause:claude:five_hour:x:resumed" in JSON.parse(readFileSync(file, "utf8")).keys);
  push.retry();
  await push.idle();
  assert.equal(sent.length, 1, "sent once");
});

test("0069/A: a limit push whose send fails while a refresh retries stays waiting and goes out at the next refresh, on a two-project board", async () => {
  const dirs = [mkdtempSync(join(scratch, "a-")), mkdtempSync(join(scratch, "b-"))];
  const files: string[] = dirs.map((d) => join(d as string, ".braid", "notified.json"));
  const sent: string[] = [];
  let release: (() => void) | undefined;
  let fail = true;
  const send = async (_c: unknown, p: { title: string }) => {
    if (fail) {
      await new Promise<void>((done) => (release = done));
      throw new Error("ntfy.example answered HTTP 502");
    }
    sent.push(p.title);
  };
  const config = () => ({ enabled: true, server: "https://ntfy.example", topic: "t" });
  const pushers = files.map((file) => limitPusher({ file, config, send, token: () => null, warn: () => {} }));
  // The board retries every project's pusher at each refresh, whichever project refreshed.
  const refresh = () => pushers.forEach((p) => p.retry());
  pushers[0]({ key: "pause:claude:five_hour:x:paused", title: "claude paused", body: "", tags: [], priority: "low", click: null });
  refresh(); // the other project's refresh arrives while the first send is still in flight
  await new Promise((done) => setImmediate(done)); // the send has started and waits
  release?.();
  await pushers[0].idle();
  assert.equal(pushers[0].pending(), 1, "the failed send is still waiting");
  fail = false;
  refresh(); // the second project's refresh sends it
  await Promise.all(pushers.map((p) => p.idle()));
  assert.deepEqual(sent, ["claude paused"]);
  assert.equal(pushers[0].pending(), 0);
  assert.ok("pause:claude:five_hour:x:paused" in JSON.parse(readFileSync(files[0] as string, "utf8")).keys);
});
