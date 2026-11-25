// The board's limits pause (0064/C, 0074/C): the targets from T3's snapshot, the claim under the lock, the pause texts sent by code,
// the replies counted from the threads, the escalation, the resume clock, the pushes and the hold rule, with a fake T3 runner and
// cache files written here. No steering thread starts.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const load = (path: string) => import(pathToFileURL(fileURLToPath(new URL(path, import.meta.url))).href);
const { steerer, COUNT_MS } = await load("../dist/board/steerer.js");
const steer = await load("../dist/board/steer.js");
const { readLimitsView } = await load("../dist/board/limits.js");
const { repliesLine } = await load("../dist/board/limits-view.js");
const { loadPauses, setPause } = await load("../dist/braids/pauses.js");
const { pauseCommand, resumeCommand, resumeLimitCommand } = await load("../dist/commands/pauses.js");
const { limitsCommand } = await load("../dist/commands/limits.js");
const pause = await load("../dist/board/pause.js");
const { notifier, limitPusher } = await load("../dist/notify/notifier.js");
const { limitsLine, demoSources, resumeAction } = await load("../dist/commands/board.js");

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

/** A repository with braids 0070 and 0071, a BRAID.md naming `claude` and `codex` (with the unused `steering` role unless told), and its own caches folder. */
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

/** T3's own ids, exactly as `thread list` gives them: a colon and a percent sign included, case kept. */
const COORD = "mcp:launch:Co70%3Aab";
const WORK = "mcp:Work-70";
const LINK = (id: string) => `http://127.0.0.1:3773/env/${id}`;

/** The T3 snapshot: 0070's running coordinator and worker on claude, 0071's worker on codex, a PM over 0070 on claude. */
function threads() {
  return {
    status: { state: "ok" },
    coordinators: new Map([["0070", { id: COORD, link: LINK(COORD), provider: "claude", model: "claude-opus-5-5" }]]),
    threads: new Map([
      ["0070", [{ id: WORK, role: "worker", pending: 0, link: LINK(WORK), provider: "claude" }]],
      ["0071", [{ id: "work-71", role: "worker", pending: 0, link: null, provider: "codex" }]],
    ]),
    idle: new Map(),
    states: new Map([["pm-1", "idle"]]),
    providers: new Map([["pm-1", "claude"]]),
  };
}

const braidsOf = () =>
  ["0070", "0071"].map((n) => ({ number: n, folder: `braids/${n}`, brief: { id: n, title: `T ${n}`, status: "In Progress", labels: [], dependencies: [], body: "" }, strands: [], source: null, logs: [], hasReport: false }));

function good(root: string, caches: string, at: Date, t3: ReturnType<typeof threads> = threads(), pm = true) {
  const pauses = new Map(loadPauses(root).pauses.map((p: { braid: string }) => [p.braid, p]));
  const limits = readLimitsView(root, t3, pauses, at, caches);
  return { braids: braidsOf(), t3, board: { braids: [], limits, programmes: pm ? [{ thread: "pm-1", braids: ["0070"], section: "working" }] : [] } };
}

/** What `t3 thread show --messages 10 --json` gives for a thread: still working, stopped with its `Paused:` line after the board's text, or stopped without it. */
const WORKING = { thread: { status: "running" }, messages: [{ role: "user", text: "Pause for claude Session until 12:55." }] };
const ANSWERED = (line = "Paused: 0070 at 1a2b3c4") => ({ thread: { status: "completed", pendingBackgroundTasks: [] }, messages: [{ role: "assistant", text: "Paused: 0070 at 0000000 (an older pause)" }, { role: "user", text: "Pause for claude Session until 12:55." }, { role: "assistant", text: `Committed.\n\n${line}` }] });
const NO_LINE = { thread: { status: "completed" }, messages: [{ role: "user", text: "Pause for claude Session until 12:55." }, { role: "assistant", text: "Done with the step." }] };

interface Call {
  root: string;
  args: string[];
  input?: string;
}
/** A fake `t3`: show answers `shown(thread)` (working by default), send fails for the ids in `failSend`. Any `start` is recorded. */
function fakeT3(o: { shown?: (thread: string) => unknown; failSend?: Set<string> } = {}) {
  const calls: Call[] = [];
  const run = async (root: string, args: string[], input?: string) => {
    calls.push({ root, args, ...(input === undefined ? {} : { input }) });
    if (args[1] === "show") {
      return { status: 0, stdout: JSON.stringify(o.shown?.(args[2] ?? "") ?? WORKING), stderr: "" };
    }
    if (args[1] === "send") {
      return o.failSend?.has(args[2] ?? "") === true ? { status: 1, stdout: "", stderr: "unknown thread" } : { status: 0, stdout: "{}", stderr: "" };
    }
    return { status: 1, stdout: "", stderr: "unexpected" };
  };
  const sends = () => calls.filter((c) => c.args[1] === "send");
  return {
    run,
    calls,
    starts: () => calls.filter((c) => c.args[1] === "start"),
    sends,
    /** The pause texts and other messages sent by code (on standard input). */
    texts: () => sends().filter((c) => c.args[3] === "-"),
    resumes: () => sends().filter((c) => c.args[3] !== "-"),
  };
}

/** A steerer at a settable clock, with its pushes collected. */
function board(root: string, caches: string, t3: ReturnType<typeof fakeT3>, clock: { now: Date }, snapshot: () => ReturnType<typeof threads> = threads, pm = true) {
  const pushes: { key: string; title: string; priority: string; body: string }[] = [];
  const warnings: string[] = [];
  const s = steerer({ t3: t3.run, now: () => clock.now, caches, push: (_r: string, p: (typeof pushes)[number]) => pushes.push(p), warn: (l: string) => warnings.push(l) });
  const tick = async () => {
    s.observe({ name: "p", root, repo: "repo", folder: () => root }, good(root, caches, clock.now, snapshot(), pm));
    await s.idle();
  };
  return { tick, pushes, warnings };
}

const records = (root: string) => loadPauses(root).pauses;
const later = (min: number) => new Date(NOW.getTime() + min * MIN);

test("over its threshold the board records 0070 and sends each working thread its text by code, with T3's own ids; no thread starts; codex's 0071 is untouched", async () => {
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
  assert.deepEqual([r.by, r.reason, r.provider, r.window, r.usedPercent, r.thread], ["board", "limit", "claude", "five_hour", 98, ""]);
  assert.equal(r.resumeAt, iso(55));
  assert.deepEqual(r.targets.map((t: { thread: string; kind: string; link: string | null }) => [t.thread, t.kind, t.link]), [[COORD, "coordinator", LINK(COORD)], [WORK, "worker", LINK(WORK)], ["pm-1", "pm", null]]);
  assert.deepEqual([r.replies.outcome, r.replies.total, r.replies.sent, r.replies.got, r.replies.failed], ["pausing", 2, NOW.toISOString(), [], []]);
  assert.equal(r.steering, undefined);
  assert.deepEqual(t3.starts(), [], "no steering thread");
  // The ids sent are exactly T3's, the text on standard input; the coordinator's has its braid number filled in by code.
  const sent = t3.texts();
  assert.deepEqual(sent.map((c) => c.args), [["thread", "send", COORD, "-"], ["thread", "send", WORK, "-"], ["thread", "send", "pm-1", "-"]]);
  assert.match(sent[0]?.input ?? "", /^Pause for claude Session until \d\d:\d\d: the board is pausing braid 0070's agents on claude .*End your turn with the line `Paused: 0070`/);
  assert.match(sent[1]?.input ?? "", /^Pause for claude Session until \d\d:\d\d\. Finish or undo your current step; never stop mid-commit\..*end your turn with the line `Paused: <id> at <sha>`/);
  assert.match(sent[2]?.input ?? "", /^Direct pause: the board paused braid 0070 on claude \(Session\) until \d\d:\d\d.*No reply is needed\.$/);
  for (const c of sent) {
    assert.doesNotMatch(c.input ?? "", /steering|<steering thread id>|send `Paused/, "no text names a reply thread");
  }
  assert.deepEqual(b.pushes, [], "no push for a pause that is still counting");
  assert.equal(pause.pauseView(r, NOW).state, "pausing");
  // A later refresh, and a second board on the same repository, send nothing again: the record is the claim.
  await b.tick();
  const other = board(root, caches, t3, clock);
  await other.tick();
  assert.equal(t3.texts().length, 3);
  assert.equal(records(root).length, 1);
});

test("only braids with an agent working on the provider are paused, and only their working threads, the coordinator and the PM's summary are messaged", () => {
  const t3 = {
    status: { state: "ok" },
    coordinators: new Map(),
    idleCoordinators: new Map([
      ["0070", { id: "co-70", link: null, provider: "claude", model: null }],
      ["0071", { id: "co-71", link: "l-71", provider: "claude", model: null }],
      ["0073", { id: "co-73", link: null, provider: "codex", model: null }],
    ]),
    threads: new Map([
      // 0071: a running reviewer (a recorded thread, whatever its role) on claude, a worker on codex and an archived worker.
      ["0071/A", [{ id: "rev-71", role: "reviewer", pending: 0, link: null, provider: "claude" }, { id: "codex-71", role: "worker", pending: 0, link: null, provider: "codex" }, { id: "gone-71", role: "worker", pending: 0, link: null, provider: "claude" }]],
      ["0073", [{ id: "work-73", role: "worker", pending: 0, link: null, provider: "claude" }]],
    ]),
    // 0070: its worker finished (idle, waiting for CI): no agent works, so the braid gets no pause.
    idle: new Map([["0070/A", [{ id: "idle-70", role: "worker", pending: 0, link: null, provider: "claude" }]]]),
    states: new Map([["gone-71", "archived"], ["pm-1", "idle"], ["pm-old", "archived"]]),
    links: new Map([["rev-71", "l-rev"]]),
  };
  assert.deepEqual(steer.targetsOf("0070", "claude", t3, "/p"), [], "only a finished worker and an idle coordinator: nothing");
  assert.deepEqual(steer.targetsOf("0072", "claude", t3, "/p"), [], "an Outline or a braid with no started item: nothing");
  assert.deepEqual(
    steer.targetsOf("0071", "claude", t3, "/p").map((t: { thread: string; kind: string; item: string; link: string | null }) => [t.thread, t.kind, t.item, t.link]),
    [["co-71", "coordinator", "0071", "l-71"], ["rev-71", "reviewer", "0071/A", "l-rev"]],
    "its working reviewer, and its coordinator though idle; never a thread on codex or an archived one",
  );
  assert.deepEqual(steer.targetsOf("0073", "claude", t3, "/p").map((t: { thread: string }) => t.thread), ["work-73"], "a coordinator on another provider is no target");
  const pms = [{ thread: "pm-1", braids: ["0071", "0072"] }, { thread: "pm-old", braids: ["0071"] }];
  assert.deepEqual(steer.pmsOf("0071", t3, pms, "/p").map((t: { thread: string; kind: string; item: string }) => [t.thread, t.kind, t.item]), [["pm-1", "pm", "0071,0072"]], "an archived PM thread gets nothing");
});

test("a braid whose agents all finished gets no record and no message", async () => {
  const { root, caches } = project();
  cache(caches, "claude", 98, NOW);
  cache(caches, "codex", 20, NOW);
  const t3 = fakeT3();
  const finished = () => ({ ...threads(), coordinators: new Map(), idleCoordinators: new Map([["0070", { id: COORD, link: null, provider: "claude", model: null }]]), threads: new Map(), idle: new Map([["0070", [{ id: WORK, role: "worker", pending: 0, link: null, provider: "claude" }]]]) });
  await board(root, caches, t3, { now: NOW }, finished).tick();
  assert.deepEqual(records(root), []);
  assert.deepEqual(t3.calls, []);
});

test("replies are counted from the threads: a Paused line after the board's text answers; when all answered the pause settles with a quiet push", async () => {
  const { root, caches } = project();
  cache(caches, "claude", 98, NOW);
  cache(caches, "codex", 20, NOW);
  const shown = new Map<string, unknown>();
  const t3 = fakeT3({ shown: (id) => shown.get(id) });
  const clock = { now: NOW };
  const b = board(root, caches, t3, clock);
  await b.tick();
  // A minute on: the coordinator stopped with its line; the worker still works (an older Paused line before the text doesn't count).
  shown.set(COORD, ANSWERED("`Paused: 0070`"));
  clock.now = later(1);
  await b.tick();
  let r = records(root)[0];
  assert.deepEqual([r.replies.outcome, r.replies.got], ["pausing", [COORD]]);
  assert.match(pause.pauseView(r, clock.now).note, /^sent 1 min ago · 1 of 2 answered so far$/);
  const shows = t3.calls.filter((c) => c.args[1] === "show");
  assert.deepEqual(shows.map((c) => c.args), [["thread", "show", COORD, "--messages", "10", "--json"], ["thread", "show", WORK, "--messages", "10", "--json"]], "the PM is told, not counted");
  // The worker stops with its line: every target answered, so the pause settles before the 10 minutes.
  shown.set(WORK, ANSWERED());
  clock.now = later(3);
  await b.tick();
  r = records(root)[0];
  assert.deepEqual([r.replies.outcome, r.replies.answered, r.replies.total, r.replies.noAnswer], ["paused", 2, 2, []]);
  assert.equal(t3.calls.filter((c) => c.args[1] === "show" && c.args[2] === COORD).length, 1, "an answered thread is not read again");
  assert.deepEqual(b.pushes.map((p) => [p.title, p.priority]), [[`claude paused until ${pause.clock(iso(55), NOW)}`, "low"]]);
  const view = pause.pauseView(r, clock.now);
  assert.equal(view.state, "paused");
  assert.equal(view.note, "paused by the board 3 min ago · 2 of 2 agents answered · the PM resumes it");
  assert.equal(pause.limitNeed(r, clock.now), null);
  assert.equal(t3.texts().length, 3, "no escalation for a full pause");
  await b.tick();
  assert.equal(b.pushes.length, 1);
});

test("a silent target at 10 minutes makes the card Needs You, sends one failed push and one message to the PM", async () => {
  const { root, caches } = project();
  cache(caches, "claude", 98, NOW);
  cache(caches, "codex", 20, NOW);
  const shown = new Map<string, unknown>([[COORD, ANSWERED("Paused: 0070")]]);
  const t3 = fakeT3({ shown: (id) => shown.get(id) });
  const clock = { now: NOW };
  const b = board(root, caches, t3, clock);
  await b.tick();
  clock.now = new Date(NOW.getTime() + COUNT_MS - 1000);
  await b.tick();
  assert.equal(records(root)[0].replies.outcome, "pausing", "still counting before the 10 minutes");
  assert.equal(b.pushes.length, 0);
  clock.now = new Date(NOW.getTime() + COUNT_MS);
  await b.tick();
  const r = records(root)[0];
  assert.deepEqual([r.replies.outcome, r.replies.answered, r.replies.total], ["partial", 1, 2]);
  assert.deepEqual(r.replies.noAnswer, [{ item: "0070", thread: WORK, link: LINK(WORK), why: "working" }]);
  const need = pause.limitNeed(r, clock.now);
  assert.equal(need?.text, `Pause for claude: paused 1/2; no answer: 0070 (${LINK(WORK)}). Those may still be running: open their threads, or pause by hand`);
  assert.equal(need?.since, NOW.toISOString());
  assert.equal(pause.pauseView(r, clock.now).state, "due");
  assert.equal(b.pushes.length, 1);
  assert.deepEqual([b.pushes[0]?.title, b.pushes[0]?.priority], ["claude: pause reached 1/2", "high"]);
  assert.match(b.pushes[0]?.key ?? "", /^pause:claude:five_hour:.*:failed$/);
  assert.match(b.pushes[0]?.body ?? "", new RegExp(`1 of 2 agents paused; no answer: 0070 \\(${LINK(WORK).replace(/[.]/g, "\\.")}\\)\\. 0070 may still be running on claude\\.`));
  const pm = t3.texts().filter((c) => c.args[2] === "pm-1");
  assert.equal(pm.length, 2, "the summary at the pause, then one escalation");
  assert.equal(pm[1]?.input, `The board's pause of 0070 for claude: paused 1/2; no answer: 0070 (${LINK(WORK)}). The agents listed may still be running on claude: check their threads and pause them by hand if needed. No reply is needed.`);
  assert.match(repliesLine({ replies: r.replies }, clock.now) ?? "", /^Pause sent .+ by the board: 1 of 2 agents answered Paused:; no answer: 0070 \(http:\/\/127\.0\.0\.1:3773\/env\/mcp:Work-70\)\.$/);
  // Later refreshes add nothing: one push, one message.
  clock.now = later(12);
  await b.tick();
  assert.equal(b.pushes.length, 1);
  assert.equal(t3.texts().filter((c) => c.args[2] === "pm-1").length, 2);
  // A target that stopped without its line reads so.
  const other = project();
  cache(other.caches, "claude", 98, NOW);
  cache(other.caches, "codex", 20, NOW);
  const t3b = fakeT3({ shown: (id) => (id === COORD ? ANSWERED("Paused: 0070") : NO_LINE) });
  const c = { now: NOW };
  const ob = board(other.root, other.caches, t3b, c, threads, false);
  await ob.tick();
  c.now = later(10);
  await ob.tick();
  assert.deepEqual(records(other.root)[0].replies.noAnswer.map((n: { why: string }) => n.why), ["no line"]);
  // Without a PM the braid's coordinator gets the escalation.
  const esc = t3b.texts().filter((x) => x.args[2] === COORD);
  assert.equal(esc.length, 2);
  assert.match(esc[1]?.input ?? "", /^The board's pause of 0070 for claude: paused 1\/2; no answer: 0070 \(.*\): no line\./);
});

test("a send that fails twice is tried once more, counts as no answer, and a pause no send reached fails at once", async () => {
  const { root, caches } = project();
  cache(caches, "claude", 98, NOW);
  cache(caches, "codex", 20, NOW);
  const t3 = fakeT3({ failSend: new Set([COORD, WORK, "pm-1"]) });
  const b = board(root, caches, t3, { now: NOW });
  await b.tick();
  assert.deepEqual(t3.texts().map((c) => c.args[2]), [COORD, COORD, WORK, WORK, "pm-1", "pm-1", "pm-1", "pm-1"], "two tries each; the escalation to the PM too");
  const r = records(root)[0];
  assert.deepEqual([r.replies.outcome, r.replies.reason, r.replies.failed], ["failed", "every send failed", [COORD, WORK]]);
  assert.deepEqual(r.replies.noAnswer.map((n: { why: string }) => n.why), ["send failed", "send failed"]);
  assert.match(pause.limitNeed(r, NOW)?.text ?? "", /^Pause failed for claude: every send failed; paused 0\/2; no answer: 0070 .*: send failed, 0070 .*: send failed\. Its agents may still be running/);
  assert.equal(pause.pauseView(r, NOW).text, "Pause failed: every send failed");
  assert.deepEqual(b.pushes.map((p) => p.title), ["claude: pause failed"]);
  assert.match(b.pushes[0]?.body ?? "", /^The pause failed: every send failed\. 0070 may still be running on claude\.$/);

  // One send fails; the other target answers: the pause settles early as partial, the failed send named.
  const other = project();
  cache(other.caches, "claude", 98, NOW);
  cache(other.caches, "codex", 20, NOW);
  const t3b = fakeT3({ failSend: new Set([WORK]), shown: () => ANSWERED("Paused: 0070") });
  const c = { now: NOW };
  const ob = board(other.root, other.caches, t3b, c);
  await ob.tick();
  c.now = later(1);
  await ob.tick();
  const o = records(other.root)[0];
  assert.deepEqual([o.replies.outcome, o.replies.answered, o.replies.total], ["partial", 1, 2]);
  assert.deepEqual(o.replies.noAnswer, [{ item: "0070", thread: WORK, link: LINK(WORK), why: "send failed" }]);
  assert.equal(ob.pushes.at(-1)?.title, "claude: pause reached 1/2");
});

test("BRAID.md with or without models.steering pauses the same; braid limits says the role is unused; the start line names no steering thread", async () => {
  const { root, caches } = project(false);
  cache(caches, "claude", 98, NOW);
  const t3 = fakeT3();
  await board(root, caches, t3, { now: NOW }).tick();
  assert.equal(records(root).length, 1);
  assert.equal(t3.texts().length, 3);
  const withRole = project();
  cache(withRole.caches, "codex", 20, NOW);
  const out = limitsCommand(withRole.root, [], { caches: withRole.caches, now: NOW });
  assert.match(out.stdout, /codex {2}roles: worker, steering\.fallback \(unused\)/);
  assert.match(limitsLine("on"), /^Limits: pauses the working agents over a threshold by sending each its pause text, counts their replies/);
  assert.doesNotMatch(limitsLine("on"), /steering/);
  assert.match(limitsLine("off"), /--no-pause/);
  assert.match(limitsLine("demo"), /demo/);
  assert.equal(demoSources().act, undefined, "--demo never acts");
  for (const gone of ["steeringLines", "pickSteering", "steeringMessage", "parseSteeringLine"]) {
    assert.equal(steer[gone], undefined, `${gone} is removed`);
  }
});

test("an older record with a steering part still reads, as its replies", () => {
  const { root } = project();
  const steering = { thread: "steer-0", link: null, provider: "codex", model: "gpt-6-luna", started: iso(-10), outcome: "partial", answered: 3, total: 4, children: ["kid"], noAnswer: ["0070/B"], reason: null, self: false };
  setPause(root, { braid: "0070", reason: "limit", provider: "claude", window: "five_hour", label: "Session", usedPercent: 98, resetsAt: iso(50), resumeAt: iso(55), task: null, thread: "steer-0", by: "board", at: iso(-10), targets: [{ thread: "w", kind: "child", item: "0070/B" }], steering });
  const [r] = records(root);
  assert.equal(r.steering, undefined);
  assert.deepEqual(r.replies, { sent: iso(-10), outcome: "partial", answered: 3, total: 4, got: [], failed: [], noAnswer: [{ item: "0070/B", thread: "", link: null, why: "working" }], reason: null });
  assert.equal(pause.limitNeed(r, NOW)?.text, "Pause for claude: paused 3/4; no answer: 0070/B. Those may still be running: open their threads, or pause by hand");
});

test("at the reset plus the buffer the board re-checks: still over keeps the record with the new time; under, a PM-run braid's PM gets one message and its braid resume --limit resumes each thread", async () => {
  const { root, caches } = project();
  cache(caches, "claude", 98, NOW);
  cache(caches, "codex", 20, NOW);
  const t3 = fakeT3({ shown: () => ANSWERED() });
  const clock = { now: NOW };
  const b = board(root, caches, t3, clock);
  await b.tick();
  await b.tick();
  // At 12:56 the session reset hasn't come: the reading is over again, resetting 50 min later.
  clock.now = new Date(NOW.getTime() + 56 * MIN);
  cache(caches, "claude", 99, clock.now);
  await b.tick();
  assert.equal(t3.resumes().length, 0);
  assert.equal(records(root)[0].resumeAt, iso(55, clock.now));
  assert.match(b.pushes.at(-1)?.title ?? "", /^claude still over: resumes /);
  assert.match(b.pushes.at(-1)?.key ?? "", /:extended:/);
  assert.match(b.pushes.at(-1)?.body ?? "", / [0-9]{4} stays paused[.]$/, "one braid: stays paused");
  // At the new time it is under: 0070 is the PM's, so the PM gets one message and nothing else is sent.
  clock.now = new Date(clock.now.getTime() + 56 * MIN);
  cache(caches, "claude", 3, clock.now);
  const texts = t3.texts().length;
  await b.tick();
  await b.tick();
  assert.equal(t3.resumes().length, 0, "no agent is resumed before the PM runs braid resume --limit");
  const ask = t3.texts().slice(texts);
  assert.deepEqual(ask.map((c) => c.args[2]), ["pm-1"], "one message, to the PM, once");
  assert.equal(ask[0]?.input, "The window is open again (its resume time came): claude reads Session 3%. Paused braid: 0070. Resume each, in your order: braid resume <number> --limit (it clears the board's record and sends each agent its resume text by code). No reply is needed.");
  assert.equal(records(root).length, 1, "the record stays until the PM resumes it");
  assert.match(pause.pauseView(records(root)[0], clock.now).note, /^asked the PM to resume at \d\d:\d\d$/);
  // The PM's braid resume --limit: each thread its resume text by code, the PM none, the record cleared.
  const out = await resumeLimitCommand(root, ["0070", "--limit"], { t3: t3.run, now: clock.now });
  assert.deepEqual(
    t3.resumes().map((c) => [c.args[2], c.args[3]]),
    [
      [COORD, "Resume: 0070 was paused by the board for claude; go on where you left off"],
      [WORK, "Resume: continue 0070 from your checkpoint"],
    ],
  );
  assert.equal(out.split("; cleared ")[0], `0070 resumed: sent the resume text to 0070 coordinator (${COORD}), 0070 worker (${WORK})`);
  assert.deepEqual(records(root), []);
});

test("a resume missed while no board ran happens at the first refresh after a start; a failed send stays pending, is retried at each refresh without giving up, and the card says so", async () => {
  const { root, caches } = project();
  cache(caches, "claude", 98, NOW);
  cache(caches, "codex", 20, NOW);
  const t3 = fakeT3({ shown: () => ANSWERED() });
  await board(root, caches, t3, { now: NOW }, threads, false).tick();
  await board(root, caches, t3, { now: NOW }, threads, false).tick();
  // The board was down at the resume time; a new one starts three hours later, and T3 doesn't take the worker's send.
  const later = new Date(NOW.getTime() + 3 * 60 * MIN);
  cache(caches, "claude", 2, later);
  const failSend = new Set([WORK]);
  const t3b = fakeT3({ failSend });
  const clock = { now: later };
  const b = board(root, caches, t3b, clock, threads, false);
  for (let i = 0; i < 8; i++) {
    await b.tick();
    clock.now = new Date(clock.now.getTime() + MIN);
    cache(caches, "claude", 2, clock.now);
  }
  const r = records(root)[0];
  assert.equal(records(root).length, 1, "kept while a send fails");
  assert.deepEqual(r.resumed, [COORD]);
  assert.equal(r.resuming.failedSince, later.toISOString(), "pending since the first failure");
  assert.equal(t3b.resumes().filter((c) => c.args[2] === WORK).length, 8, "retried at each refresh, past the old give-up of 5");
  const view = pause.pauseView(r, clock.now);
  assert.equal(view.state, "due");
  assert.equal(view.text, `Paused: claude Session 98%; resume pending: T3 unreachable since ${pause.clock(later.toISOString(), clock.now)}`);
  assert.match(view.note, /^retried at each refresh · last try \d\d:\d\d · 1 of 2 agents reached$/);
  failSend.clear();
  await b.tick();
  assert.deepEqual(t3b.resumes().filter((c) => c.args[2] === COORD).length, 1, "the coordinator is sent once");
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
  const t3b = fakeT3({ shown: () => ANSWERED() });
  const clock = { now: NOW };
  const b = board(other.root, other.caches, t3b, clock);
  await b.tick();
  await b.tick();
  setPause(other.root, hold);
  clock.now = new Date(NOW.getTime() + 60 * MIN);
  cache(other.caches, "claude", 2, clock.now);
  await b.tick();
  assert.equal(t3b.resumes().length, 0);
  assert.deepEqual(records(other.root).map((p: { reason: string }) => p.reason), ["hold"]);
  assert.match(resumeCommand(other.root, ["0070"]), /0070 resumed: cleared Held/, "plain braid resume still lifts a hold");
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

test("a board restart (braid board service restart, an update) keeps a running limits pause: the new board picks the record up from disk", async () => {
  const { root, caches } = project();
  cache(caches, "claude", 98, NOW);
  cache(caches, "codex", 20, NOW);
  const t3 = fakeT3({ shown: () => ANSWERED() });
  const first = board(root, caches, t3, { now: NOW });
  await first.tick();
  await first.tick();
  const before = records(root);
  assert.equal(before.length, 1);
  assert.equal(before[0].replies.outcome, "paused");
  // The old board is gone; a new process starts ten minutes later, still before the resume time and still over.
  const later = new Date(NOW.getTime() + 10 * MIN);
  cache(caches, "claude", 99, later);
  const restarted = board(root, caches, t3, { now: later });
  await restarted.tick();
  assert.deepEqual(records(root), before, "the record is kept as it was");
  assert.equal(t3.texts().length, 3, "no second pause");
  assert.deepEqual(t3.resumes(), [], "nothing resumed early");
  assert.equal(pause.pauseView(records(root)[0], later).state, "paused");
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

// ---- 0074/D: one resume path for the timer, early resume, the Resume now buttons and braid resume --limit.

/** A board record of `braid` on claude paused at `at`, with these targets (a PM target makes it PM-run). */
function boardRecord(root: string, braid: string, at: Date, targets: { thread: string; kind: string; item: string }[], extra: Record<string, unknown> = {}): void {
  setPause(root, { braid, reason: "limit", provider: "claude", window: "five_hour", label: "Session", usedPercent: 98, resetsAt: iso(50, at), resumeAt: iso(55, at), task: null, thread: "", by: "board", at: at.toISOString(), targets: targets.map((t) => ({ ...t, project: root })), replies: { sent: at.toISOString(), outcome: "paused", answered: 2, total: 2, got: [], failed: [], noAnswer: [], reason: null }, ...extra });
}
const AGENTS = [
  { thread: COORD, kind: "coordinator", item: "0070" },
  { thread: WORK, kind: "worker", item: "0070" },
];

test("Resume now on a braid without a PM sends each thread its resume text once and clears the record", async () => {
  const { root, caches } = project();
  // The reading is under the threshold but from before the pause began, so only the button resumes it.
  cache(caches, "claude", 40, later(-10));
  cache(caches, "codex", 20, NOW);
  boardRecord(root, "0070", later(-5), AGENTS);
  const t3 = fakeT3();
  const b = board(root, caches, t3, { now: NOW }, threads, false);
  const marked = await resumeAction(root, () => NOW)({ braid: "0070" });
  assert.deepEqual(marked, { ok: true, braids: ["0070"], mode: "direct" });
  assert.match(pause.pauseView(records(root)[0], NOW).note, /^resume asked for at \d\d:\d\d · the acting board sends it$/);
  await b.tick();
  assert.deepEqual(t3.resumes().map((c) => c.args[2]), [COORD, WORK], "each thread once");
  assert.equal(t3.texts().length, 0);
  assert.deepEqual(records(root), []);
  assert.equal(b.pushes.at(-1)?.title, "claude resumed");
});

test("Resume now on a PM-run braid sends the PM one message and nothing else until braid resume --limit; a programme's Resume now asks its PM once for all its braids", async () => {
  const { root, caches } = project();
  cache(caches, "claude", 98, NOW);
  cache(caches, "codex", 20, NOW);
  boardRecord(root, "0070", later(-5), [...AGENTS, { thread: "pm-1", kind: "pm", item: "0070" }]);
  const t3 = fakeT3();
  const b = board(root, caches, t3, { now: NOW });
  assert.equal((await resumeAction(root, () => NOW)({ braid: "0070" })).mode, "pm");
  await b.tick();
  await b.tick();
  assert.equal(t3.resumes().length, 0, "no agent hears from the board");
  assert.deepEqual(t3.texts().map((c) => c.args[2]), ["pm-1"]);
  assert.match(t3.texts()[0]?.input ?? "", /^Resume now, from the board \(the user asked\): claude reads Session 98%\. Paused braid: 0070\. Resume each, in your order: braid resume <number> --limit/);
  assert.match(pause.pauseView(records(root)[0], NOW).note, /^asked the PM to resume at \d\d:\d\d$/);
  // Asked again from the programme's card: one more message, still none to the agents.
  const plan = async () => ({ programmes: [{ slug: "reliability", braids: ["0070", "0071"] }] });
  assert.deepEqual(await resumeAction(root, () => NOW)({ programme: "reliability" }, plan), { ok: true, braids: ["0070"], mode: "pm" });
  await b.tick();
  assert.deepEqual(t3.texts().map((c) => c.args[2]), ["pm-1", "pm-1"]);
  assert.equal(t3.resumes().length, 0);
  // The PM resumes it.
  await resumeLimitCommand(root, ["0070", "--limit"], { t3: t3.run, now: NOW });
  assert.deepEqual(t3.resumes().map((c) => c.args[2]), [COORD, WORK]);
  assert.deepEqual(records(root), []);
});

test("a fresh reading under the threshold resumes early, before the resume time; a reading from before the pause doesn't", async () => {
  const { root, caches } = project();
  cache(caches, "claude", 98, NOW);
  cache(caches, "codex", 20, NOW);
  const t3 = fakeT3({ shown: () => ANSWERED() });
  const clock = { now: NOW };
  const b = board(root, caches, t3, clock, threads, false);
  await b.tick();
  await b.tick();
  assert.equal(records(root)[0].replies.outcome, "paused");
  // Two minutes on, a reading under the threshold but checked before the pause began: no resume.
  clock.now = later(2);
  cache(caches, "claude", 40, later(-5));
  await b.tick();
  assert.equal(t3.resumes().length, 0);
  // Five minutes on, a fresh reading at 40%: it resumes now, 50 minutes before its resume time.
  clock.now = later(5);
  cache(caches, "claude", 40, clock.now);
  await b.tick();
  assert.deepEqual(t3.resumes().map((c) => c.args[2]), [COORD, WORK]);
  assert.deepEqual(records(root), []);
  assert.deepEqual([b.pushes.at(-1)?.title, b.pushes.at(-1)?.body], ["claude resumed", "Session at 40% after the reset. 0070 goes on."]);
});

test("a pause whose window no longer applies resumes at the next refresh, and its old steering banner goes with the record", async () => {
  const { root, caches } = project();
  cache(caches, "claude", 30, NOW);
  cache(caches, "codex", 20, NOW);
  // The cursor "Other Models" pause from before #300: its window is not in the reading, its resume days away, an old 0-of-2 banner.
  boardRecord(root, "0070", later(-24 * 60), AGENTS, { window: "other_models", label: "Other Models", resumeAt: iso(8 * 24 * 60), replies: undefined, steering: { thread: "steer-0", link: null, provider: "claude", model: "m", started: later(-24 * 60).toISOString(), outcome: "partial", answered: 0, total: 2, children: [], noAnswer: ["0070"], reason: null, self: false } });
  assert.equal(records(root)[0].replies.answered, 0);
  const t3 = fakeT3();
  const b = board(root, caches, t3, { now: NOW }, threads, false);
  await b.tick();
  assert.deepEqual(t3.resumes().map((c) => c.args[2]), [COORD, WORK]);
  assert.deepEqual(records(root), [], "the record, and the banner read from it, are gone");
  const view = readLimitsView(root, threads(), new Map(), NOW, caches);
  assert.ok(!JSON.stringify(view).includes("0 of 2"), "no old banner");
});

test("braid resume --limit --all resumes every board pause: directly without a PM, by one PM message for a PM-run braid; a hold is never cleared by any resume", async () => {
  const { root, caches } = project();
  cache(caches, "claude", 30, NOW);
  boardRecord(root, "0070", later(-5), [...AGENTS, { thread: "pm-1", kind: "pm", item: "0070" }]);
  boardRecord(root, "0071", later(-5), [{ thread: "work-71", kind: "worker", item: "0071" }]);
  const t3 = fakeT3();
  const out = await resumeLimitCommand(root, ["--limit", "--all"], { t3: t3.run, now: NOW });
  assert.deepEqual(t3.resumes().map((c) => c.args[2]), ["work-71"]);
  assert.deepEqual(t3.texts().map((c) => c.args[2]), ["pm-1"]);
  assert.match(out, /^0071 resumed: sent the resume text to 0071 worker \(work-71\); cleared /m);
  assert.match(out, /^0070: asked the PM to resume it$/m);
  assert.deepEqual(records(root).map((p: { braid: string }) => p.braid), ["0070"]);

  // A hold: Resume now refuses it, --all and the board leave it, braid resume --limit keeps it.
  const hold = { braid: "0071", reason: "hold", words: "freeze", provider: null, window: null, label: null, usedPercent: null, resetsAt: null, resumeAt: null, task: null, thread: "pm-1", by: "pm", at: NOW.toISOString() };
  setPause(root, hold);
  await assert.rejects(resumeAction(root, () => NOW)({ braid: "0071" }), /0071 is held, not paused for a limit/);
  assert.match(await resumeLimitCommand(root, ["--limit", "--all"], { t3: t3.run, now: NOW }), /^0071: held, left alone$/m);
  assert.match(await resumeLimitCommand(root, ["0071", "--limit"], { t3: t3.run, now: NOW }), /is held, not paused for a limit/);
  const b = board(root, caches, t3, { now: later(120) }, threads, false);
  await b.tick();
  assert.equal(records(root).find((p: { braid: string }) => p.braid === "0071")?.reason, "hold");
  await assert.rejects(resumeLimitCommand(root, ["0071"], { t3: t3.run, now: NOW }), /usage: braid resume/);
});

test("Resume now on a stale over-threshold cache resumes without a new pause until a reading checked after the click; a fresh one still over pauses once", async () => {
  const { root, caches } = project();
  // T3's cache still holds the old reading, over the threshold, checked before the click (the usage-reset case).
  cache(caches, "claude", 98, later(-10));
  cache(caches, "codex", 20, NOW);
  boardRecord(root, "0070", later(-5), AGENTS);
  const t3 = fakeT3();
  const clock = { now: NOW };
  const b = board(root, caches, t3, clock, threads, false);
  await resumeAction(root, () => NOW)({ braid: "0070" });
  await b.tick();
  clock.now = later(1);
  await b.tick();
  assert.deepEqual(t3.resumes().map((c) => c.args[2]), [COORD, WORK]);
  assert.equal(t3.texts().length, 0, "no pause text on the stale reading");
  assert.deepEqual(records(root), []);
  // A reading checked after the click, still over: the board pauses once.
  clock.now = later(3);
  cache(caches, "claude", 98, clock.now);
  await b.tick();
  await b.tick();
  assert.deepEqual(t3.texts().map((c) => c.args[2]).sort(), [COORD, WORK].sort(), "each working thread its pause text once");
  assert.equal(records(root).length, 1);
});

test("braid resume --limit also holds off a new pause until a reading checked after it", async () => {
  const { root, caches } = project();
  cache(caches, "claude", 98, later(-10));
  cache(caches, "codex", 20, NOW);
  boardRecord(root, "0070", later(-5), AGENTS);
  const t3 = fakeT3();
  await resumeLimitCommand(root, ["0070", "--limit"], { t3: t3.run, now: NOW });
  const b = board(root, caches, t3, { now: later(1) }, threads, false);
  await b.tick();
  assert.equal(t3.texts().length, 0);
  assert.deepEqual(records(root), []);
});
