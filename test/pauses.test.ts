import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const fixtures = fileURLToPath(new URL("./fixtures/limits", import.meta.url));
const load = (path: string) => import(pathToFileURL(fileURLToPath(new URL(path, import.meta.url))).href);
const { setPause, clearPause, loadPauses, pausesFile, readPausesFile } = await load("../dist/braids/pauses.js");
const { pauseCommand, resumeCommand } = await load("../dist/commands/pauses.js");
const pause = await load("../dist/board/pause.js");
const model = await load("../dist/board/model.js");
const marks = await load("../dist/board/marks.js");
const demo = await load("../dist/board/demo.js");

const scratch = mkdtempSync(join(tmpdir(), "braid-pauses-test-"));
after(() => rmSync(scratch, { recursive: true, force: true }));

function git(cwd: string, ...args: string[]): string {
  const r = spawnSync("git", args, { cwd, encoding: "utf8" });
  assert.equal(r.status, 0, `git ${args.join(" ")}: ${r.stderr}`);
  return r.stdout.trim();
}

const brief = (id: string, status: string) => `---\nid: '${id}'\ntitle: "T ${id}"\nstatus: ${status}\nlabels: []\ndependencies: []\n---\n\n## Goal\n\nx\n`;

/** A repository with braid 0061 and a BRAID.md whose models name the limits fixtures' providers. */
function project(): string {
  const root = mkdtempSync(join(scratch, "p-"));
  const put = (path: string, text: string) => {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  };
  git(root, "init", "-q", "-b", "main");
  put("BRAID.md", "---\nmain: main\nmodels:\n  coordinator: claude_session_over / claude-opus-5-5 / effort=medium\n  worker: claude_ok / claude-sonnet-5-5 / effort=medium\n---\n");
  put("braids/0061-pause/brief.md", brief("0061", "In Progress"));
  put("braids/0061-pause/A-x/brief.md", brief("0061/A", "In Progress"));
  git(root, "-c", "user.email=t@example.com", "-c", "user.name=t", "add", "-A");
  git(root, "-c", "user.email=t@example.com", "-c", "user.name=t", "commit", "-q", "-m", "init");
  return root;
}

// The fixtures were checked at 18:00Z; claude_session_over's Session window is at 98% and resets 21:50Z.
const NOW = new Date("2026-11-21T18:05:00.000Z");
const THREAD = "3194eef8-be42-44a2-a629-d671c5689e4d";
const opts = { caches: fixtures, now: NOW };

const record = (over: Record<string, unknown> = {}) => ({
  braid: "0061",
  provider: "claude_session_over",
  window: "five_hour",
  label: "Session",
  usedPercent: 98,
  resetsAt: "2026-11-21T21:50:00.000Z",
  resumeAt: "2026-11-21T21:55:00.000Z",
  task: "9c1e42",
  thread: THREAD,
  by: "coordinator",
  at: NOW.toISOString(),
  ...over,
});

/** Local `HH:MM`, as the board and status print it. */
const hhmm = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

test("the store records, keeps the same pause unchanged, replaces another and clears once", () => {
  const root = project();
  assert.deepEqual(loadPauses(root), { pauses: [], note: null }, "no file: no pauses, no note");
  assert.equal(setPause(root, record()), "recorded");
  assert.equal(setPause(root, record({ at: "2026-11-21T18:06:00.000Z" })), "unchanged", "only the time differs");
  assert.equal(loadPauses(root).pauses[0].at, NOW.toISOString(), "an unchanged pause keeps its first time");
  assert.equal(setPause(root, record({ resumeAt: "2026-11-21T22:00:00.000Z" })), "updated");
  assert.equal(setPause(root, record({ braid: "0062" })), "recorded");
  assert.deepEqual(loadPauses(root).pauses.map((p: { braid: string }) => p.braid), ["0061", "0062"]);
  assert.equal(clearPause(root, "0061").resumeAt, "2026-11-21T22:00:00.000Z");
  assert.equal(clearPause(root, "0061"), null, "a second resume changes nothing");
  assert.deepEqual(loadPauses(root).pauses.map((p: { braid: string }) => p.braid), ["0062"]);
  assert.match(pausesFile(root), /[\\/]\.braid[\\/]pauses\.json$/);
  assert.equal(readFileSync(join(root, ".braid", ".gitignore"), "utf8"), "*\n");
});

test("a damaged pauses file reads as no pauses with a note; bad records are left out; a pause rewrites it", () => {
  const root = project();
  const file = pausesFile(root);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, "[{ not json");
  const broken = loadPauses(root);
  assert.deepEqual(broken.pauses, []);
  assert.match(broken.note, /is not valid JSON/);
  writeFileSync(file, '{"braid":"0061"}');
  assert.match(readPausesFile(file).note, /not a list of pauses/);
  writeFileSync(file, JSON.stringify([record(), { braid: "0062", provider: "x" }]));
  const partly = loadPauses(root);
  assert.deepEqual(partly.pauses.map((p: { braid: string }) => p.braid), ["0061"]);
  assert.match(partly.note, /1 record not readable, left out/);
  writeFileSync(file, "garbage");
  assert.equal(setPause(root, record()), "recorded");
  assert.deepEqual(loadPauses(root), { pauses: [record()], note: null });
});

test("braid pause takes the window, usage and resume time from braid limits, and is idempotent", () => {
  const root = project();
  const out = pauseCommand(root, ["61", "--provider", "claude_session_over", "--thread", THREAD, "--task", "9c1e42"], opts);
  assert.match(out, /^0061 paused: Paused: claude_session_over Session 98%, resumes /);
  assert.match(out, /by coordinator 3194eef8 at .*, task 9c1e42/);
  const [p] = loadPauses(root).pauses;
  assert.deepEqual({ ...p }, record());
  assert.match(pauseCommand(root, ["0061", "--provider", "claude_session_over", "--thread", THREAD, "--task", "9c1e42"], opts), /^0061 already paused, unchanged/);
  assert.match(pauseCommand(root, ["0061", "--provider", "claude_session_over", "--thread", THREAD, "--window", "seven_day"], opts), /^0061 pause updated: Paused: claude_session_over Weekly 29%/);
  const weekly = loadPauses(root).pauses[0];
  assert.equal(weekly.resumeAt, "2026-11-26T06:05:00.000Z", "the picked window's reset plus the 5 min buffer");
  assert.equal(weekly.task, null);
});

test("braid pause is refused when the verdict isn't pause, unless --until is given; it checks its arguments", () => {
  const root = project();
  assert.throws(() => pauseCommand(root, ["0061", "--provider", "claude_ok", "--thread", THREAD], opts), /not paused: braid limits says ok for claude_ok; give --until/);
  assert.deepEqual(loadPauses(root).pauses, []);
  const out = pauseCommand(root, ["0061", "--provider", "claude_ok", "--thread", THREAD, "--until", "2026-11-21T19:00:00Z", "--by", "pm"], opts);
  assert.match(out, /^0061 paused: Paused: claude_ok, resumes .* \(by PM 3194eef8/);
  const p = loadPauses(root).pauses[0];
  assert.equal(p.resumeAt, "2026-11-21T19:00:00.000Z");
  assert.equal(p.window, null, "an ok provider has no window over its threshold");
  assert.equal(p.by, "pm");
  assert.throws(() => pauseCommand(root, ["0061/A", "--provider", "claude_ok", "--thread", THREAD], opts), /not a strand/);
  assert.throws(() => pauseCommand(root, ["0099", "--provider", "claude_session_over", "--thread", THREAD], opts), /no braid 0099/);
  assert.throws(() => pauseCommand(root, ["0061", "--provider", "nobody", "--thread", THREAD], opts), /names no provider nobody/);
  assert.throws(() => pauseCommand(root, ["0061", "--provider", "claude_ok", "--thread", "short"], opts), /--thread needs an id/);
  assert.throws(() => pauseCommand(root, ["0061", "--provider", "claude_ok", "--thread", THREAD, "--until", "soon"], opts), /--until needs an ISO time/);
  assert.throws(() => pauseCommand(root, ["0061", "--provider", "claude_ok", "--thread", THREAD, "--until", "2026-11-21T19:00:00Z", "--by", "me"], opts), /--by is coordinator, pm, board/);
  assert.throws(() => pauseCommand(root, ["0061", "--provider", "claude_session_over", "--thread", THREAD, "--window", "nope"], opts), /has no window nope/);
});

test("braid resume prints what it cleared and names the task to delete; a second resume changes nothing", () => {
  const root = project();
  setPause(root, record());
  const out = resumeCommand(root, ["0061"], opts);
  assert.match(out, /^0061 resumed: cleared Paused: claude_session_over Session 98%, resumes /);
  assert.match(out, /delete it \(delete_scheduled_task\)/);
  assert.equal(resumeCommand(root, ["0061"], opts), "0061 was not paused; nothing changed\n");
  assert.throws(() => resumeCommand(root, [], opts), /usage: braid resume/);
});

test("the phase: paused until 15 min past resumeAt, then due, then over at 25 min; texts follow it", () => {
  const p = record();
  const at = (min: number) => new Date(Date.parse(p.resumeAt) + min * 60_000);
  assert.equal(pause.phaseOf(p, at(-60)), "paused");
  assert.equal(pause.phaseOf(p, at(14.9)), "paused");
  assert.equal(pause.phaseOf(p, at(15)), "due");
  assert.equal(pause.phaseOf(p, at(24.9)), "due");
  assert.equal(pause.phaseOf(p, at(25)), "over");
  const now = new Date(Date.parse(p.resumeAt) - 30 * 60_000);
  const paused = pause.pauseView({ ...p, at: new Date(now.getTime() - 18 * 60_000).toISOString() }, now);
  assert.equal(paused.state, "paused");
  assert.equal(paused.text, `Paused: claude_session_over Session 98%, resumes ${hhmm(p.resumeAt)}`);
  assert.equal(paused.note, "paused by the coordinator 18 min ago");
  const due = pause.pauseView(p, at(20));
  assert.equal(due.state, "due");
  assert.equal(due.text, `Paused: claude_session_over Session 98%; resume was due at ${hhmm(p.resumeAt)}`);
  assert.equal(due.note, `reads Stalled at ${hhmm(pause.stalledSince(p))} unless it resumes`);
  assert.equal(pause.laneNote(due), "paused, resume was due");
  assert.match(pause.statusLine(due, at(20)), /\(by coordinator 3194eef8, task 9c1e42\); reads Stalled at /);
  const box = pause.pauseBox(paused, now);
  assert.match(box.head, /^Paused · since /);
  assert.match(box.text, /Resumes .*, with the 5 min buffer\.$/);
  assert.match(box.foot, /braid resume 0061 clears it by hand/);
  assert.match(pause.pauseBox(due, at(20)).text, /The resume didn't come/);
  assert.equal(pause.stalledText(p, at(30)), `Stalled: paused for claude_session_over; resume was due at ${hhmm(p.resumeAt)} and nobody resumed it`);
  assert.match(pause.clock("2026-11-23T21:05:00.000Z", new Date("2026-11-21T12:00:00.000Z")), /^Nov 2[234] \d\d:\d\d$/, "another day shows the date");
});

// 0026 of the demo: one strand In Progress with no agent, so it is stalled unless a pause holds that back.
const braids = demo.demoBraids().filter((b: { number: string }) => b.number === "0026");
const gh = { status: { state: "ok" }, prs: new Map() };
const t3 = { status: { state: "ok" }, threads: new Map() };
const LONG_AGO = "2026-11-21T10:00:00.000Z";
const signals = (now: Date, pauses: Map<string, unknown> | undefined) => ({ now, requests: new Map(), alarm: (_id: string, _r: string, holds: boolean | null) => (holds === true ? LONG_AGO : null), pauses });
const card = (now: Date, p = record({ braid: "0026" })) => model.toBoard("t", braids, gh, t3, signals(now, new Map([["0026", p]]))).braids[0];

test("a paused braid isn't stalled: it stays Working with its pause until 25 min past its resume, then is stalled naming the pause", () => {
  const p = record({ braid: "0026" });
  const at = (min: number) => new Date(Date.parse(p.resumeAt) + min * 60_000);
  const none = model.toBoard("t", braids, gh, t3, signals(at(0), undefined)).braids[0];
  assert.equal(none.lane, "Waiting", "without a pause the same braid is stalled");
  assert.equal(none.pause, null);
  const paused = card(at(-30));
  assert.equal(paused.lane, "In Progress");
  assert.equal(paused.reason, null);
  assert.equal(paused.pause.state, "paused");
  assert.equal(paused.strands[0].pause.state, "paused");
  const due = card(at(20));
  assert.equal(due.lane, "In Progress", "still not stalled while the resume is only overdue");
  assert.equal(due.pause.state, "due");
  const over = card(at(30));
  assert.equal(over.lane, "Waiting");
  assert.equal(over.reason, "stalled");
  assert.match(over.need.text, /^Stalled: paused for claude_session_over; resume was due at .* and nobody resumed it$/);
  assert.equal(over.need.since, pause.stalledSince(p), "stalled from 25 min past the resume, not from the broke clock");
  assert.equal(over.need.age, "5m");
});

test("marks: the pause icon on a Working card and its strands, never on a card on the user's side", () => {
  const p = record({ braid: "0026" });
  const at = (min: number) => new Date(Date.parse(p.resumeAt) + min * 60_000);
  const paused = card(at(-30));
  const m = marks.cardMarks(paused);
  assert.equal(m.paused.state, "paused");
  assert.equal(m.paused.tooltip, paused.pause.text);
  assert.equal(marks.cardMarks(paused, false).paused.tooltip, `${paused.pause.text} — ${paused.pause.note}`, "Details off moves the small line into the tooltip");
  assert.equal(marks.strandMarks(paused.strands[0]).paused.tooltip, paused.pause.text);
  assert.equal(marks.cardMarks(card(at(20))).paused.state, "due");
  assert.equal(marks.cardMarks(card(at(30))).paused, null, "a stalled card in Needs You shows only its need");
  assert.deepEqual(marks.cardMarks(card(at(30))).reasons.map((r: { kind: string }) => r.kind), ["stalled"]);
});

test("the demo shows a paused, an overdue and a stalled-after-pause braid", () => {
  const cards = model.toBoard("demo", demo.demoBraids(), demo.demoGithub(), demo.demoT3(), demo.demoSignals()).braids;
  const of = (id: string) => cards.find((c: { id: string }) => c.id === id);
  assert.equal(of("0025").pause.state, "paused");
  assert.equal(of("0025").strands.find((s: { id: string }) => s.id === "0025/A").pause, null, "a Done strand carries no pause");
  assert.equal(of("0025").strands.find((s: { id: string }) => s.id === "0025/C").pause.state, "paused");
  assert.equal(of("0026").pause.state, "due");
  assert.equal(of("0027").lane, "Waiting");
  assert.match(of("0027").need.text, /nobody resumed it/);
  assert.equal(of("0027").need.age, "17m");
});
