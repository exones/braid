// 0075/G: no false stalls. A thread T3 shows `completed` or `waiting` while it has background work pending
// (`pendingBackgroundTasks`) or is blocked on a thread wait (`blockedOnThreadWait`) is working: the board counts it as
// running for workers, reviewers, coordinators and the PM (the 0010/B case). A timed wait (`braid ask <id> "<why>" --to self
// --done-when time:<iso>`) asks nobody: it shows quietly as "waiting until", is never pushed, keeps the item from reading
// stalled until its time, and the board's time wake ends it; after that the stall reads as before (the 0012/B case).
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { load, scratch, world } from "./support/done-fixtures.ts";

/* eslint-disable @typescript-eslint/no-explicit-any */
const Rec: any = await load("../../dist/braids/requests.js");
const R: any = await load("../../dist/commands/requests.js");
const { readT3, working }: any = await load("../../dist/board/t3.js");
const { nudger }: any = await load("../../dist/board/nudge.js");
const { waker }: any = await load("../../dist/board/wake.js");
const { remindable }: any = await load("../../dist/board/waits.js");
const { titleRepoName }: any = await load("../../dist/braids/title.js");
const model: any = await load("../../dist/board/model.js");
const signals: any = await load("../../dist/board/signals.js");
const programme: any = await load("../../dist/board/programme.js");
const demo: any = await load("../../dist/board/demo.js");
const { planOf }: any = await load("../../dist/board/plans.js");

const CO7 = "c0007777-aaaa-4bbb-8ccc-333333333333";
const PM = "pm000000-aaaa-4bbb-8ccc-333333333333";
const T0 = new Date("2026-11-24T04:00:00.000Z");
const at = (minutes: number): Date => new Date(T0.getTime() + minutes * 60_000);
const GH = { status: { state: "ok" }, prs: new Map() };
const base = demo.demoBraids().find((b: any) => b.number === "0007");
const lone = { ...base, brief: { ...base.brief, status: "In Progress" }, strands: [] };
const braided = { ...base, brief: { ...base.brief, status: "In Progress" }, strands: base.strands.map((s: any, i: number) => ({ ...s, brief: { ...s.brief, status: i === 0 ? "Done" : "To Do" } })) };
const ok = (data: unknown) => ({ status: 0, stdout: JSON.stringify(data), stderr: "" });
const BG = [{ taskId: "turn-item:command:1", kind: "command", description: "npm run verify" }];

function sender() {
  const sent: { thread: string; text: string }[] = [];
  const t3 = (_root: string, args: readonly string[]) => {
    sent.push({ thread: args[2] as string, text: args[3] as string });
    return Promise.resolve({ status: 0, stdout: "", stderr: "" });
  };
  return { t3, sent };
}
const warn = () => undefined;

/** Reads T3 through `readT3` from `thread list` and `thread show` answers shaped as T3 gives them. */
async function readFrom(root: string, list: object[], shown: Record<string, object>, reviews: object[] = []): Promise<any> {
  const agents = mkdtempSync(join(scratch, "agents-"));
  const run = (_root: string, args: readonly string[]) => {
    if (args[0] === "thread" && args[1] === "list") {
      return Promise.resolve(ok(list));
    }
    const thread = shown[args[2] as string];
    return Promise.resolve(thread === undefined ? { status: 1, stdout: "", stderr: "no such thread" } : ok({ thread: { ...thread, worktreePath: (thread as any).folder === undefined ? null : join(agents, (thread as any).folder) } }));
  };
  return readT3(root, { run, agents, project: root, reviews, ttlMs: 0 });
}

test("the running rule: T3's running, background work pending, or blocked on a thread wait", () => {
  assert.equal(working({ status: "running" }), true);
  assert.equal(working({ status: "completed", pendingBackgroundTasks: BG }), true);
  assert.equal(working({ status: "waiting", blockedOnThreadWait: true }), true);
  assert.equal(working({ status: "completed", pendingBackgroundTasks: [], blockedOnThreadWait: false }), false);
  assert.equal(working({ status: "waiting" }), true);
  assert.equal(working({ status: "idle" }), false);
});

test("dctl-studio 0011/E: a worker T3 shows `waiting` while its turn awaits its local gate counts as running, and is never nudged or stalled", async () => {
  const w = world();
  const repo = titleRepoName(w.root);
  const gate = [{ taskId: "bl9xjm2bz", kind: "command", description: "npm run verify", awaited: true }];
  const list = [
    { threadId: "w-wait", status: "waiting", pendingBackgroundTasks: gate, blockedOnThreadWait: false, title: `💻 ${repo} 0007 worker: Seven` },
    { threadId: CO7, status: "waiting", pendingBackgroundTasks: [], blockedOnThreadWait: false, title: `🧠 ${repo} 0007 coordinator: Seven` },
  ];
  const t3 = await readFrom(w.root, list, { "w-wait": { status: "waiting", pendingBackgroundTasks: gate, folder: "0007" }, "r-waiting": { status: "waiting" } }, [{ id: "0007", thread: "r-waiting", at: at(0).toISOString() }]);
  assert.deepEqual((t3.threads.get("0007") ?? []).map((t: any) => t.id), ["w-wait", "r-waiting"], "the worker and a recorded reviewer T3 shows waiting");
  assert.equal(t3.coordinators.get("0007")?.id, CO7, "a coordinator T3 shows waiting runs");
  assert.equal(t3.states.get("w-wait"), "running");
  const s = sender();
  const step = nudger(s.t3);
  for (const m of [0, 10, 20, 30]) {
    const sig = signals.readSignals(w.root, GH, at(m));
    const card = model.toCard(lone, GH, t3, sig);
    sig.commit(card.alarms);
    await step({ root: w.root, good: { sig } }, at(m), warn);
    assert.deepEqual([card.reason, card.need, card.running], [null, null, true], `minute ${m}`);
  }
  assert.equal(s.sent.length, 0, "never nudged");
});

test("0010/B: a worker `completed` with a background command, a coordinator blocked on a thread wait, a reviewer and the PM with background work all count as running", async () => {
  const w = world();
  const repo = titleRepoName(w.root);
  const list = [
    { threadId: "w-bg", status: "completed", pendingBackgroundTasks: BG, blockedOnThreadWait: false, title: `💻 ${repo} 0007 worker: Seven` },
    { threadId: CO7, status: "waiting", pendingBackgroundTasks: [], blockedOnThreadWait: true, title: `🧠 ${repo} 0007 coordinator: Seven` },
    { threadId: PM, status: "completed", pendingBackgroundTasks: [{ taskId: "x", kind: "subagent" }], blockedOnThreadWait: false },
    { threadId: "done", status: "completed", pendingBackgroundTasks: [], blockedOnThreadWait: false },
  ];
  const shown = {
    "w-bg": { status: "completed", pendingBackgroundTasks: BG, folder: "0007" },
    "r-wait": { status: "completed", blockedOnThreadWait: true },
  };
  const t3 = await readFrom(w.root, list, shown, [{ id: "0007", thread: "r-wait", at: at(0).toISOString() }]);
  assert.deepEqual((t3.threads.get("0007") ?? []).map((t: any) => [t.id, t.role]), [["w-bg", "worker"], ["r-wait", "reviewer"]]);
  assert.equal(t3.coordinators.get("0007")?.id, CO7, "the coordinator runs");
  assert.equal(t3.idleCoordinators.has("0007"), false, "so it is nobody to nudge");
  assert.equal(t3.states.get(PM), "running");
  assert.equal(t3.states.get("done"), "completed", "a finished thread without background work is not running");

  // The worker's item: never nudged, never stalled.
  const s = sender();
  const step = nudger(s.t3);
  for (const m of [0, 10, 20, 30]) {
    const sig = signals.readSignals(w.root, GH, at(m));
    const card = model.toCard(lone, GH, t3, sig);
    sig.commit(card.alarms);
    await step({ root: w.root, good: { sig } }, at(m), warn);
    assert.deepEqual([card.reason, card.need, card.running], [null, null, true], `minute ${m}`);
  }
  // The coordinator of a braid with strands, no agent on any strand: it runs, so the braid isn't stalled.
  const coordinatorOnly = { ...t3, threads: new Map() };
  for (const m of [40, 50, 60, 70]) {
    const sig = signals.readSignals(w.root, GH, at(m));
    const card = model.toCard(braided, GH, coordinatorOnly, sig);
    sig.commit(card.alarms);
    await step({ root: w.root, good: { sig } }, at(m), warn);
    assert.equal(card.reason, null, `minute ${m}`);
  }
  // The PM, with none of its braids running: it works in the background, so its programme isn't stalled.
  const read = planOf("p", "pm/p", ["---", "programme: p", "title: P", "goal: G", `thread: ${PM}`, "state: running", "rows:", "  - P1 | 0001 | One | running", "---", ""].join("\n"));
  const idleCard = { id: "0001", title: "B 0001", lane: "In Progress", running: false, activity: null, pause: null, pm: null };
  for (const m of [80, 90, 100, 110]) {
    const sig = signals.readSignals(w.root, GH, at(m));
    const alarms: any[] = [];
    const [p] = programme.toProgrammes("agento", [read], [idleCard], coordinatorOnly, sig, GH, alarms);
    sig.commit(alarms);
    await step({ root: w.root, good: { sig } }, at(m), warn);
    assert.deepEqual([p.section, p.need], ["working", null], `minute ${m}`);
  }
  assert.deepEqual(s.sent, [], "nobody was nudged");
});

const T3idle = (): any => {
  const c = { id: CO7, link: null, provider: null, model: null };
  return { status: { state: "ok" }, threads: new Map(), coordinators: new Map(), idleCoordinators: new Map([["0007", c]]), states: new Map([[CO7, "idle"]]), links: new Map() };
};

test("0012/B: a timed wait shows quietly as waiting until its time, is never pushed or nudged, the time wake ends it, and then the stall reads as before", async () => {
  const w = world();
  const until = at(15);
  Rec.openRequest(w.root, { id: "0007", kind: "question", text: "idle until my wake at 04:15", at: at(0).toISOString(), thread: CO7, to: "self", doneWhen: `time:${until.toISOString()}` });
  const s = sender();
  const nudge = nudger(s.t3);
  const wake = waker(s.t3);
  const run = async (m: number) => {
    const sig = signals.readSignals(w.root, GH, at(m));
    const card = model.toCard(lone, GH, T3idle(), sig);
    sig.commit(card.alarms);
    await wake({ root: w.root, good: { sig, t3: T3idle(), start: { main: "main" }, github: GH } }, at(m), warn);
    await nudge({ root: w.root, good: { sig } }, at(m), warn);
    return { sig, card };
  };
  for (const m of [0, 10, 14]) {
    const { sig, card } = await run(m);
    assert.deepEqual([card.lane, card.reason, card.need], ["In Progress", null, null], `minute ${m}: no lane change, no need, so no push`);
    assert.equal(sig.requests.has("0007"), false, "not a request to the user");
    assert.deepEqual(card.waits.map((r: any) => [r.to, r.doneWhen]), [["self", `time:${until.toISOString()}`]], "the card's quiet wait line");
    assert.equal(remindable(sig.waits[0]), false, "nobody to remind");
  }
  assert.equal(s.sent.length, 0, "no nudge while it waits");
  // The time comes: the board's wake ends it, and the asking thread is woken once.
  const woke = await run(15);
  assert.deepEqual(woke.card.waits, []);
  const [r] = Rec.loadRecord(w.root).requests;
  assert.equal(r.state, "met");
  assert.equal(s.sent.length, 1);
  assert.equal(s.sent[0]?.thread, CO7);
  assert.match(s.sent[0]?.text ?? "", /^Wake: q-\w+ is met \(time .* reached\): idle until my wake at 04:15\. Go on where you left off\.$/);
  // Nothing happens after it: the stall clock runs from the time, nudge at ten minutes, the stall ten after, as before.
  await run(24);
  assert.equal(s.sent.length, 1);
  await run(25);
  assert.equal(s.sent.length, 2, "the nudge");
  assert.equal(s.sent[1]?.thread, CO7);
  const late = await run(35);
  assert.deepEqual([late.card.lane, late.card.reason], ["Waiting", "stalled"]);
});

test("a timed wait whose time passed holds nothing off, even before the board's wake closes it", () => {
  const w = world();
  Rec.openRequest(w.root, { id: "0007", kind: "question", text: "wait", at: at(0).toISOString(), thread: CO7, to: "self", doneWhen: `time:${at(5).toISOString()}` });
  const open = Rec.loadRecord(w.root).requests;
  const sig = { ...signals.readSignals(w.root, GH, at(0)), now: at(20), waits: open, alarm: (_id: string, _r: string, holds: boolean | null) => (holds === true ? at(0).toISOString() : null) };
  const card = model.toCard(lone, GH, T3idle(), sig);
  assert.equal(card.reason, "stalled");
});

test("braid ask --to self: a timed wait needs a time, opens as one, and braid requests lists it as waiting until", () => {
  const w = world();
  assert.throws(() => R.askCommand(w.root, ["0002", "idle", "--to", "self"]), /--to self is a timed wait: give --done-when time:<iso>/);
  assert.throws(() => R.askCommand(w.root, ["0002", "idle", "--to", "self", "--done-when", "pr:3"]), /--to self is a timed wait/);
  const out = R.askCommand(w.root, ["0002", "idle until my wake", "--to", "self", "--done-when", "time:2026-11-24T04:15:00Z"], { now: () => at(0) });
  assert.match(out, /^q-\w+ 0002: timed wait opened, waiting until .+ \(the board's wake ends it; nobody is asked\): idle until my wake\n$/);
  const [r] = Rec.loadRecord(w.root).requests;
  assert.deepEqual([r.to, r.doneWhen, Rec.isWait(r), Rec.isTimedWait(r)], ["self", "time:2026-11-24T04:15:00.000Z", true, true]);
  assert.match(R.requestsCommand(w.root, [], { now: () => at(0) }), new RegExp(`^${r.code}  0002  wait  0m  waiting until 2026-11-24 04:15Z  idle until my wake\\n$`));
  assert.match(R.requestsCommand(w.root, [r.code]), /a timed wait, nobody asked/);
  // A question to the user beside it doesn't replace it, and a new timed wait does.
  R.askCommand(w.root, ["0002", "Which name?"], { now: () => at(1) });
  R.askCommand(w.root, ["0002", "idle a bit longer", "--to", "self", "--done-when", "time:2026-11-24T05:00:00Z"], { now: () => at(2) });
  const open = Rec.loadRecord(w.root).requests.filter((x: any) => x.state === "open");
  assert.deepEqual(open.map((x: any) => [x.to ?? "user", x.text]).sort(), [["self", "idle a bit longer"], ["user", "Which name?"]]);
});
