// 0071/C: a coordinator or PM that is idle with nothing asked gets one nudge from the board when its stall has held ten minutes,
// and the card shows the stall only if it still holds ten minutes after; a stall that ends and comes back is nudged again; a held
// or paused braid or programme is never nudged; two boards on one record send each wake, reminder and nudge once.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { load, world } from "./support/done-fixtures.ts";

/* eslint-disable @typescript-eslint/no-explicit-any */
const Rec: any = await load("../../dist/braids/requests.js");
const { nudger }: any = await load("../../dist/board/nudge.js");
const { waker }: any = await load("../../dist/board/wake.js");
const { reminder }: any = await load("../../dist/board/remind.js");
const model: any = await load("../../dist/board/model.js");
const signals: any = await load("../../dist/board/signals.js");
const programme: any = await load("../../dist/board/programme.js");
const demo: any = await load("../../dist/board/demo.js");
const { planOf }: any = await load("../../dist/board/plans.js");

const CO7 = "c0007777-aaaa-4bbb-8ccc-333333333333";
const PM = "pm000000-aaaa-4bbb-8ccc-333333333333";
const T0 = new Date("2026-11-23T10:00:00.000Z");
const at = (minutes: number): Date => new Date(T0.getTime() + minutes * 60_000);
const GH = { status: { state: "ok" }, prs: new Map() };
const base = demo.demoBraids().find((b: any) => b.number === "0007");
/** Braid 0007 without strands, In Progress: its own stall is the one that reads. */
const lone = { ...base, brief: { ...base.brief, status: "In Progress" }, strands: [] };
/** With strands: the coordinator's stall is the braid-level one, when every strand is To Do or Done. */
const braided = { ...base, brief: { ...base.brief, status: "In Progress" }, strands: base.strands.map((s: any, i: number) => ({ ...s, brief: { ...s.brief, status: i === 0 ? "Done" : "To Do" } })) };

const T3 = (opts: { coordinator?: "idle" | "running" | "none"; pm?: string; agent?: boolean } = {}): any => {
  const c = { id: CO7, link: null, provider: null, model: null };
  const co = opts.coordinator ?? "idle";
  return {
    status: { state: "ok" },
    threads: new Map<string, unknown[]>(opts.agent === true ? [["0007", [{ id: "w1", role: "worker", pending: 0, link: null, provider: null }]]] : []),
    coordinators: new Map(co === "running" ? [["0007", c]] : []),
    idleCoordinators: new Map(co === "idle" ? [["0007", c]] : []),
    states: new Map<string, string>([...(co === "none" ? [] : [[CO7, co] as [string, string]]), ...(opts.pm === undefined ? [] : [[PM, opts.pm] as [string, string]])]),
    links: new Map(),
  };
};
const planText = (state: string): string => ["---", "programme: p", "title: P", "goal: G", `thread: ${PM}`, `state: ${state}`, "rows:", "  - P1 | 0007 | Seven | running", "---", ""].join("\n");
const plans = (state = "running"): any[] => [planOf("p", "pm/p", planText(state))];

/** One refresh of the board at `now`: the signals as read, the card, and the clock written. */
function refresh(root: string, now: Date, b: any, t3: any, extra: object = {}): { sig: any; card: any } {
  const sig = { ...signals.readSignals(root, GH, now), ...extra };
  const card = model.toCard(b, GH, t3, sig);
  sig.commit(card.alarms);
  return { sig, card };
}

function sender() {
  const sent: { thread: string; text: string }[] = [];
  let fail = 0;
  let during: ((text: string) => void) | null = null;
  const t3 = (_root: string, args: readonly string[]) => {
    assert.deepEqual(args.slice(0, 2), ["thread", "send"]);
    if (fail > 0) {
      fail--;
      return Promise.resolve({ status: 1, stdout: "", stderr: "t3 is not running" });
    }
    sent.push({ thread: args[2] as string, text: args[3] as string });
    during?.(args[3] as string);
    return Promise.resolve({ status: 0, stdout: "", stderr: "" });
  };
  return { t3, sent, failNext: (n: number) => (fail = n), onSend: (f: ((text: string) => void) | null) => (during = f) };
}
const warnings: string[] = [];
const warn = (line: string) => void warnings.push(line);
const brokeOf = (root: string): Record<string, string> => JSON.parse(readFileSync(join(root, ".braid", "broke.json"), "utf8"));
const AFTER = "Stalled after a nudge: the coordinator stopped and nothing was asked";
const NUDGE = "Nudge from the board: 0007 looks idle: no running agent, no open request or wait, no hold. Go on with the next step, or open a request or wait and end your turn.";

for (const [name, b, key] of [["a braid with no strands", lone, "0007"], ["a braid with strands, at its own level", braided, "0007 coordinator"]] as const) {
  test(`${name}: one nudge when the stall has held ten minutes, the card says nothing, and the stall shows ten minutes after the nudge`, async () => {
    const w = world();
    const s = sender();
    const step = nudger(s.t3);
    const t3 = T3();
    const run = async (m: number) => {
      const r = refresh(w.root, at(m), b, t3);
      await step({ root: w.root, good: { sig: r.sig } }, at(m), warn);
      return r.card;
    };
    assert.equal((await run(0)).reason, null, "the clock starts");
    await run(9);
    assert.equal(s.sent.length, 0, "not before ten minutes");
    const ten = await run(10);
    assert.equal(ten.reason, null, "the nudge is not on the card, and the stall waits");
    assert.equal(ten.need, null);
    assert.deepEqual(s.sent, [{ thread: CO7, text: NUDGE }]);
    assert.equal(brokeOf(w.root)[`${key} stalled nudged`], at(10).toISOString());
    assert.equal((await run(15)).reason, null);
    assert.equal((await run(19)).reason, null, "not until ten minutes after the nudge");
    const late = await run(20);
    assert.deepEqual([late.lane, late.reason, late.need?.text, late.need?.since], ["Waiting", "stalled", AFTER, at(0).toISOString()]);
    assert.equal(s.sent.length, 1, "one nudge, and nobody to tell: no PM");
  });
}

test("a stall that ends and comes back gets a new nudge; an agent running ends it", async () => {
  const w = world();
  const s = sender();
  const step = nudger(s.t3);
  const run = async (m: number, t3: any) => {
    const r = refresh(w.root, at(m), lone, t3);
    await step({ root: w.root, good: { sig: r.sig } }, at(m), warn);
    return r.card;
  };
  await run(0, T3());
  await run(10, T3());
  assert.equal(s.sent.length, 1);
  assert.equal((await run(20, T3())).reason, "stalled");
  assert.equal((await run(21, T3({ agent: true }))).reason, null, "an agent runs: the stall ends");
  assert.deepEqual(Object.keys(brokeOf(w.root)), [], "the first-seen and nudged times are dropped together");
  await run(30, T3());
  await run(40, T3());
  assert.equal(s.sent.length, 2, "the later stall is nudged again");
});

test("no idle coordinator thread, nobody to nudge: the stall shows after ten minutes as before", async () => {
  const w = world();
  const s = sender();
  refresh(w.root, at(0), lone, T3({ coordinator: "none" }));
  const r = refresh(w.root, at(10), lone, T3({ coordinator: "none" }));
  await nudger(s.t3)({ root: w.root, good: { sig: r.sig } }, at(10), warn);
  assert.equal(r.card.reason, "stalled");
  assert.equal(r.card.need.text, "Stalled: nobody is working and nothing was asked");
  assert.equal(s.sent.length, 0);
});

test("a PM-run braid: after the nudge fails the PM gets one message, once", async () => {
  const w = world();
  const s = sender();
  const step = nudger(s.t3);
  const extra = { plans: plans() };
  const t3 = T3({ pm: "idle" });
  const run = async (m: number) => {
    const r = refresh(w.root, at(m), braided, t3, extra);
    await step({ root: w.root, good: { sig: r.sig } }, at(m), warn);
    return r.card;
  };
  await run(0);
  await run(10);
  assert.deepEqual(s.sent.map((x) => x.thread), [CO7], "the coordinator is nudged first");
  await run(19);
  assert.equal(s.sent.length, 1);
  assert.equal((await run(20)).need.text, AFTER);
  assert.deepEqual(s.sent.map((x) => x.thread), [CO7, PM]);
  assert.match(s.sent[1]?.text ?? "", /^From the board: the coordinator of 0007 was nudged and stopped again ten minutes later, with nothing asked and no agent running\./);
  await run(30);
  await run(40);
  assert.equal(s.sent.length, 2, "the PM is told once");
  assert.equal(brokeOf(w.root)["0007 coordinator stalled escalated"], at(20).toISOString());
});

test("a held or paused braid is never nudged, and a held programme's braid is held too", async () => {
  const w = world();
  const s = sender();
  const pause = new Map([["0007", { braid: "0007", reason: "hold", by: "user", at: at(0).toISOString(), provider: null, resumeAt: null }]]);
  const heldPlans = plans("held");
  for (const extra of [{ pauses: pause }, { plans: heldPlans, pauses: programme.heldPauses(heldPlans, new Map(), at(0)) }]) {
    for (const m of [0, 10, 30]) {
      const r = refresh(w.root, at(m), braided, T3({ pm: "idle" }), extra);
      await nudger(s.t3)({ root: w.root, good: { sig: r.sig } }, at(m), warn);
      assert.notEqual(r.card.need?.kind, "stalled", "no stall of ours");
    }
  }
  assert.equal(s.sent.length, 0);
});

// ---- The PM

const card = (id: string, extra: object = {}): any => ({ id, title: `B ${id}`, lane: "In Progress", running: false, activity: null, pause: null, pm: null, ...extra });
function pmRefresh(root: string, now: Date, pm: string | null, state = "running") {
  const read = planOf("p", "pm/p", ["---", "programme: p", "title: P", "goal: G", `thread: ${PM}`, `state: ${state}`, "rows:", "  - P1 | 0001 | One | running", "---", ""].join("\n"));
  const sig = signals.readSignals(root, GH, now);
  const t3 = { status: { state: "ok" }, threads: new Map(), states: new Map(pm === null ? [] : [[PM, pm]]), links: new Map() };
  const alarms: unknown[] = [];
  const [p] = programme.toProgrammes("agento", [read], [card("0001")], t3, sig, GH, alarms);
  sig.commit(alarms);
  return { sig, p };
}

test("a programme stall nudges the PM once, then shows the stall after the nudge; a PM thread that is gone shows it as before", async () => {
  const w = world();
  const s = sender();
  const step = nudger(s.t3);
  const run = async (m: number, pm: string | null = "idle") => {
    const r = pmRefresh(w.root, at(m), pm);
    await step({ root: w.root, good: { sig: r.sig } }, at(m), warn);
    return r.p;
  };
  assert.equal((await run(0)).section, "working");
  assert.equal((await run(10)).section, "working", "the nudge first");
  assert.deepEqual(s.sent, [{ thread: PM, text: "Nudge from the board: the PM of p looks idle: no braid running, no open request, no hold. Go on with the next step, or open a request or wait and end your turn." }]);
  assert.equal((await run(15)).section, "working");
  const late = await run(20);
  assert.deepEqual([late.section, late.need.kind, late.need.text], ["needs", "stalled", "Stalled after a nudge: the PM stopped and none of its braids is running"]);
  assert.equal(s.sent.length, 1, "once; and the PM is the one stalled, nobody else to tell");
  assert.equal((await run(21, "running")).section, "working");
  assert.deepEqual(Object.keys(brokeOf(w.root)), [], "the stall ended");
  // A thread that is gone can't be nudged.
  await run(30, null);
  const gone = await run(40, null);
  assert.equal(gone.need.text, "Stalled: the PM stopped and none of its braids is running");
  assert.equal(s.sent.length, 1);
});

test("a held programme is never nudged", async () => {
  const w = world();
  const s = sender();
  for (const m of [0, 10, 30]) {
    const r = pmRefresh(w.root, at(m), "idle", "held");
    await nudger(s.t3)({ root: w.root, good: { sig: r.sig } }, at(m), warn);
    assert.equal(r.p.need, null);
  }
  assert.equal(s.sent.length, 0);
});

test("a failed nudge is sent again at the next refresh, once; two boards of one project send it once", async () => {
  const w = world();
  const s = sender();
  refresh(w.root, at(0), lone, T3());
  s.failNext(1);
  warnings.length = 0;
  const a = nudger(s.t3);
  const b = nudger(s.t3);
  let r = refresh(w.root, at(10), lone, T3());
  await a({ root: w.root, good: { sig: r.sig } }, at(10), warn);
  assert.equal(s.sent.length, 0);
  assert.match(warnings.join("\n"), /the nudge of 0007 failed \(t3 is not running\)/);
  r = refresh(w.root, at(11), lone, T3());
  await a({ root: w.root, good: { sig: r.sig } }, at(11), warn);
  // A second board, which read the same stall before the first recorded, finds the nudge on the file and skips it.
  await b({ root: w.root, good: { sig: r.sig } }, at(11), warn);
  assert.equal(s.sent.length, 1);
});

// ---- Two boards, the wake and the reminders; a held programme's request

const ASKER = "22222222-aaaa-4bbb-8ccc-333333333333";
const open = (root: string, id: string, text: string, extra: object = {}): string => Rec.openRequest(root, { id, kind: "question", text, at: at(0).toISOString(), thread: ASKER, doneWhen: `time:${at(5).toISOString()}`, ...extra }).code;
const stateOf = (root: string, code: string): string => Rec.loadRecord(root).requests.find((r: any) => r.code === code).state;
const wakeGood = (extra: object = {}): any => ({ sig: { pauses: new Map(), ...extra }, start: { main: "main", expected: null }, github: { status: { state: "ok" }, prs: new Map() }, t3: { states: new Map() } });

test("a second board that reads the record again right before a send skips a wake the first board recorded meanwhile", async () => {
  const w = world();
  const first = open(w.root, "0001/B", "first?");
  const second = open(w.root, "0001/C", "second?");
  const s = sender();
  // While this board's wake of the first request is on its way, the other board wakes and records the second.
  // (Whichever the board takes first, the other is the one the other board woke.)
  s.onSend((text) => {
    Rec.endRequest(w.root, text.includes(first.slice(2)) ? second : first, { state: "met", who: "board", text: "its time came", at: at(6).toISOString() });
  });
  await waker(s.t3)({ root: w.root, good: wakeGood() }, at(6), warn);
  assert.equal(s.sent.length, 1, "only one: the other was woken by the other board");
  assert.equal(stateOf(w.root, first), "met");
  assert.equal(stateOf(w.root, second), "met");
});

test("a request on a held or paused programme (pm/<slug>) is neither checked nor woken until it resumes", async () => {
  const w = world();
  const code = open(w.root, "pm/p", "Which scope?", { kind: "decision" });
  const s = sender();
  await waker(s.t3)({ root: w.root, good: wakeGood({ plans: plans("held") }) }, at(6), warn);
  assert.equal(s.sent.length, 0);
  assert.equal(stateOf(w.root, code), "open");
  const paused = new Map([["0007", { braid: "0007" }]]);
  await waker(s.t3)({ root: w.root, good: wakeGood({ plans: plans(), pauses: paused }) }, at(6), warn);
  assert.equal(s.sent.length, 0, "every open braid of it is paused");
  await waker(s.t3)({ root: w.root, good: wakeGood({ plans: plans() }) }, at(6), warn);
  assert.equal(s.sent.length, 1, "resumed: woken");
  assert.equal(stateOf(w.root, code), "met");
});

test("a second board that reads the record again right before a reminder skips one the first board recorded meanwhile", async () => {
  const w = world();
  const wait = (n: string, text: string) => open(w.root, `0001/${n}`, text, { to: "0002", doneWhen: "braid:0002" });
  const a = wait("B", "first?");
  const b = wait("C", "second?");
  const s = sender();
  s.onSend((text) => {
    Rec.addEvent(w.root, text.includes(a.slice(2)) ? b : a, { event: "reminded", at: at(60).toISOString(), by: "board", text: "sent to the 0002 coordinator" });
  });
  const g = { sig: { pauses: new Map(), plans: [] }, t3: { status: { state: "ok" }, threads: new Map(), coordinators: new Map(), idleCoordinators: new Map([["0002", { id: CO7 }]]), states: new Map([[CO7, "idle"]]) } };
  await reminder(s.t3)({ root: w.root, good: g }, at(60), warn);
  assert.equal(s.sent.length, 1, "only one: the other was reminded by the other board");
});
