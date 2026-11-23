// 0071/B: `braid eta` sets and moves an estimate on an open request and refuses a closed one; the running board reminds a
// wait's addressee at most hourly and not before its estimate, escalates a missed estimate to the PM once per estimate, and
// skips the user and held or paused braids; a card with an open wait never reads stalled, a missed estimate or a gone
// addressee does.
import assert from "node:assert/strict";
import { test } from "node:test";
import { load, world } from "./support/done-fixtures.ts";

/* eslint-disable @typescript-eslint/no-explicit-any */
const Cmd: any = await load("../../dist/commands/requests.js");
const Rec: any = await load("../../dist/braids/requests.js");
const { reminder }: any = await load("../../dist/board/remind.js");
const { clock }: any = await load("../../dist/board/pause.js");
const model: any = await load("../../dist/board/model.js");
const signals: any = await load("../../dist/board/signals.js");
const demo: any = await load("../../dist/board/demo.js");

const ASKER = "22222222-aaaa-4bbb-8ccc-333333333333";
const CO2 = "c0002222-aaaa-4bbb-8ccc-333333333333";
const PM = "pm000000-aaaa-4bbb-8ccc-333333333333";
const T0 = new Date("2026-11-23T10:00:00.000Z");
const at = (minutes: number): Date => new Date(T0.getTime() + minutes * 60_000);
const codeOf = (out: string): string => /^(q-[a-z0-9]{4,})/.exec(out)?.[1] ?? assert.fail(`no code in: ${out}`);
const recordOf = (root: string, code: string): any => Rec.loadRecord(root).requests.find((r: any) => r.code === code);
const FIRST = "Gentle hourly reminder: I'm still waiting for you.";

/** A wait of 0001 on 0002, opened at T0. */
const waitOn2 = (root: string): string => codeOf(Cmd.askCommand(root, ["0001", "Can search ship before reports?", "--to", "0002", "--done-when", "braid:0002", "--thread", ASKER], { now: () => T0 }));
const eta = (root: string, args: string[], now: Date): string => Cmd.etaCommand(root, args, { now: () => now });

test("braid eta sets an estimate, a later call moves it, each an eta event with its why; `braid requests` shows them", () => {
  const w = world();
  const code = waitOn2(w.root);
  const out = eta(w.root, [code, "40m", "after strand 0002/C merges"], at(10));
  assert.equal(out, `${code} (0001, to braid 0002): expected by ${clock(at(50).toISOString(), at(10))} (in 40 min)\n`);
  let r = recordOf(w.root, code);
  assert.equal(r.eta, at(50).toISOString());
  assert.deepEqual(r.events.at(-1), { event: "eta", at: at(10).toISOString(), by: "coordinator", text: at(50).toISOString(), reason: "after strand 0002/C merges" });
  const moved = eta(w.root, [code, "1h30m"], at(20));
  assert.match(moved, new RegExp(`expected by ${clock(at(110).toISOString(), at(20))} \\(in 1h 30m\\); was ${clock(at(50).toISOString(), at(20))}`));
  r = recordOf(w.root, code);
  assert.equal(r.eta, at(110).toISOString(), "the newest eta event wins");
  assert.equal(r.events.filter((e: any) => e.event === "eta").length, 2);
  const history = Cmd.requestsCommand(w.root, [code]);
  assert.match(history, /eta 2026-11-23T11:50:00.000Z/);
  assert.match(history, /eta +the coordinator: 2026-11-23T10:50:00.000Z \(reason: after strand 0002\/C merges\)/);
  const list = Cmd.requestsCommand(w.root, [], { gh: w.opts.gh, now: () => at(20) });
  assert.match(list, new RegExp(`expected by ${clock(at(110).toISOString(), at(20))} {2}Can search ship`));
});

test("braid eta takes a time of day (tomorrow once passed) or an ISO time, and refuses a closed request, a past or unreadable time", () => {
  const w = world();
  const code = waitOn2(w.root);
  const now = at(0);
  const local = new Date(now);
  local.setHours(now.getHours() + 2, 15, 0, 0);
  const hhmm = `${String(local.getHours()).padStart(2, "0")}:15`;
  eta(w.root, [code, hhmm], now);
  assert.equal(recordOf(w.root, code).eta, local.toISOString());
  const earlier = new Date(now);
  earlier.setHours(now.getHours() - 1, 0, 0, 0);
  eta(w.root, [code, `${String(earlier.getHours()).padStart(2, "0")}:00`], now);
  assert.equal(Date.parse(recordOf(w.root, code).eta) - earlier.getTime(), 86_400_000, "a time already past today is tomorrow's");
  eta(w.root, [code, "2026-11-24T09:00:00Z"], now);
  assert.equal(recordOf(w.root, code).eta, "2026-11-24T09:00:00.000Z");
  assert.throws(() => eta(w.root, [code, "soon"], now), /soon is not a duration or a time to come/);
  assert.throws(() => eta(w.root, [code, "2026-11-01T09:00:00Z"], now), /not a duration or a time to come/);
  assert.throws(() => eta(w.root, [code], now), /usage: braid eta/);
  Cmd.withdrawCommand(w.root, [code, "--why", "not needed"]);
  const before = recordOf(w.root, code).events.length;
  assert.throws(() => eta(w.root, [code, "2h"], now), new RegExp(`${code} is withdrawn \\(closed .*\\); an estimate is only for an open request; nothing changed`));
  assert.equal(recordOf(w.root, code).events.length, before);
  assert.throws(() => eta(w.root, ["q-zzzz", "2h"], now), /no request q-zzzz/);
});

/** A board's good read as the reminder step reads it. */
function good(opts: { coordinators?: Record<string, string>; pm?: boolean; paused?: string[]; t3ok?: boolean } = {}): any {
  const states = new Map<string, string>([[ASKER, "idle"], ...Object.values(opts.coordinators ?? {}).map((t) => [t, "idle"] as [string, string]), ...(opts.pm === true ? [[PM, "idle"] as [string, string]] : [])]);
  return {
    sig: {
      pauses: new Map((opts.paused ?? []).map((b) => [b, { braid: b }])),
      plans: opts.pm === true ? [{ slug: "p", branch: "pm/p", error: null, plan: { thread: PM, rows: [{ row: "P1", braid: "0001", title: "x", state: "running" }] } }] : [],
    },
    t3: { status: { state: opts.t3ok === false ? "unavailable" : "ok", reason: "x" }, threads: new Map(), coordinators: new Map(), idleCoordinators: new Map(Object.entries(opts.coordinators ?? {}).map(([n, id]) => [n, { id, link: null, provider: null, model: null }])), states },
  };
}

function sender() {
  const sent: { thread: string; text: string }[] = [];
  let fail = 0;
  const t3 = (_root: string, args: readonly string[]) => {
    assert.deepEqual(args.slice(0, 2), ["thread", "send"]);
    if (fail > 0) {
      fail--;
      return Promise.resolve({ status: 1, stdout: "", stderr: "t3 is not running" });
    }
    sent.push({ thread: args[2] as string, text: args[3] as string });
    return Promise.resolve({ status: 0, stdout: "", stderr: "" });
  };
  return { t3, sent, failNext: (n: number) => (fail = n) };
}
const warnings: string[] = [];
const warn = (line: string) => void warnings.push(line);
const reminded = (root: string, code: string) => recordOf(root, code).events.filter((e: any) => e.event === "reminded");

test("the addressee is reminded an hour after the wait opened, then at most hourly, each recorded as reminded by the board", async () => {
  const w = world();
  const code = waitOn2(w.root);
  const s = sender();
  const step = reminder(s.t3);
  const g = good({ coordinators: { "0002": CO2 } });
  await step({ root: w.root, good: g }, at(59), warn);
  assert.equal(s.sent.length, 0, "not before an hour");
  await step({ root: w.root, good: g }, at(60), warn);
  assert.equal(s.sent.length, 1);
  assert.equal(s.sent[0]?.thread, CO2);
  assert.ok(s.sent[0]?.text.startsWith(FIRST), s.sent[0]?.text);
  assert.equal(s.sent[0]?.text, `${FIRST} ${code} from the 0001 coordinator (item 0001): Can search ship before reports? Done when braid 0002 is merged into main. Say when you expect it: braid eta ${code} 2h 'why' (a duration, or a time such as 16:30).`);
  assert.deepEqual(reminded(w.root, code), [{ event: "reminded", at: at(60).toISOString(), by: "board", text: "sent to the 0002 coordinator" }]);
  await step({ root: w.root, good: g }, at(100), warn);
  await reminder(s.t3)({ root: w.root, good: g }, at(110), warn);
  assert.equal(s.sent.length, 1, "within the hour nothing more, also from a restarted board");
  await step({ root: w.root, good: g }, at(121), warn);
  assert.equal(s.sent.length, 2);
  assert.equal(reminded(w.root, code).length, 2);
});

test("not before the estimate; once it has passed, reminded hourly, the PM told once per estimate, a new estimate starts again", async () => {
  const w = world();
  const code = waitOn2(w.root);
  eta(w.root, [code, "3h", "after 0002/C"], at(10)); // expected at(190)
  const s = sender();
  const step = reminder(s.t3);
  const g = good({ coordinators: { "0002": CO2 }, pm: true });
  await step({ root: w.root, good: g }, at(120), warn);
  assert.equal(s.sent.length, 0, "the estimate holds reminders off");
  await step({ root: w.root, good: g }, at(190), warn);
  const missed = clock(at(190).toISOString(), at(190));
  assert.deepEqual(s.sent.map((x) => x.thread), [PM, CO2]);
  assert.equal(s.sent[0]?.text, `From the board: 0001 waits on braid 0002 (${code}: Can search ship before reports?) past its estimate ${missed}. The 0002 coordinator is reminded hourly. See braid requests ${code}.`);
  assert.match(s.sent[1]?.text ?? "", new RegExp(`Your estimate ${missed} has passed; set a new one: braid eta ${code} 2h 'why'\\.$`));
  assert.deepEqual(reminded(w.root, code).map((e: any) => [e.text, e.reason]), [["sent to the PM", `missed its estimate ${missed}`], ["sent to the 0002 coordinator", undefined]]);
  await step({ root: w.root, good: g }, at(251), warn);
  assert.deepEqual(s.sent.map((x) => x.thread), [PM, CO2, CO2], "the PM once; the coordinator hourly");
  eta(w.root, [code, "1h"], at(260)); // expected at(320)
  await step({ root: w.root, good: g }, at(319), warn);
  assert.equal(s.sent.length, 3);
  await step({ root: w.root, good: g }, at(320), warn);
  assert.deepEqual(s.sent.slice(3).map((x) => x.thread), [PM, CO2], "a second miss escalates again");
});

test("a waited-on braid with no coordinator: the PM of a PM-run braid is reminded; with neither, nobody", async () => {
  const w = world();
  const code = waitOn2(w.root);
  const s = sender();
  await reminder(s.t3)({ root: w.root, good: good({ pm: true }) }, at(60), warn);
  assert.equal(s.sent[0]?.thread, PM);
  assert.match(s.sent[0]?.text ?? "", new RegExp(`^${FIRST} ${code} from the 0001 coordinator \\(item 0001\\) to braid 0002, which has no coordinator yet: `));
  assert.deepEqual(reminded(w.root, code).map((e: any) => e.text), ["sent to the PM"]);
  const w2 = world();
  waitOn2(w2.root);
  const s2 = sender();
  await reminder(s2.t3)({ root: w2.root, good: good() }, at(60), warn);
  await reminder(s2.t3)({ root: w2.root, good: good({ coordinators: { "0002": CO2 }, t3ok: false }) }, at(60), warn);
  assert.equal(s2.sent.length, 0, "gone: no thread to send to; T3 unread: nothing told");
});

test("never a held or paused braid, asking or waited on, and never the user; a request to the PM reminds the PM", async () => {
  const w = world();
  waitOn2(w.root);
  codeOf(Cmd.askCommand(w.root, ["0001/A", "Which rounding?", "--thread", ASKER], { now: () => T0 }));
  const s = sender();
  await reminder(s.t3)({ root: w.root, good: good({ coordinators: { "0002": CO2 }, paused: ["0001"] }) }, at(200), warn);
  await reminder(s.t3)({ root: w.root, good: good({ coordinators: { "0002": CO2 }, paused: ["0002"] }) }, at(200), warn);
  assert.equal(s.sent.length, 0, "held or paused asker or addressee, and the user's question, get nothing");
  const toPm = Rec.openRequest(w.root, { id: "0002", kind: "question", text: "Approve the layout?", at: T0.toISOString(), thread: ASKER, to: "pm", pm: PM }).code;
  await reminder(s.t3)({ root: w.root, good: good({ coordinators: { "0002": CO2 }, pm: true }) }, at(200), warn);
  assert.deepEqual(s.sent.map((x) => x.thread).sort(), [CO2, PM].sort());
  assert.deepEqual(reminded(w.root, toPm).map((e: any) => e.text), ["sent to the PM"]);
});

test("a failed send records nothing and is sent at the next refresh, once", async () => {
  const w = world();
  const code = waitOn2(w.root);
  const s = sender();
  const step = reminder(s.t3);
  s.failNext(1);
  warnings.length = 0;
  await step({ root: w.root, good: good({ coordinators: { "0002": CO2 } }) }, at(60), warn);
  assert.equal(reminded(w.root, code).length, 0);
  assert.match(warnings.join("\n"), new RegExp(`the reminder of ${code} \\(0001\\) failed \\(t3 is not running\\)`));
  await step({ root: w.root, good: good({ coordinators: { "0002": CO2 } }) }, at(61), warn);
  await step({ root: w.root, good: good({ coordinators: { "0002": CO2 } }) }, at(62), warn);
  assert.equal(s.sent.length, 1);
  assert.equal(reminded(w.root, code).length, 1);
});

// The cards: demo braid 0007 (three strands) and a lone braid, with an open wait of their own.
const NOW = new Date("2026-11-15T12:00:00Z");
const ago = (m: number) => new Date(NOW.getTime() - m * 60_000).toISOString();
const base = demo.demoBraids().find((b: any) => b.number === "0007");
const braid = (strands = true) => ({ ...base, brief: { ...base.brief, status: "In Progress" }, strands: strands ? base.strands.map((s: any, i: number) => ({ ...s, brief: { ...s.brief, status: i === 0 ? "Done" : i === 1 ? "In Progress" : "To Do" } })) : [] });
const GH = { status: { state: "ok" }, prs: new Map() };
const T3 = (coordinator2 = true, ok = true) => ({ status: ok ? { state: "ok" } : { state: "unavailable", reason: "x" }, threads: new Map(), coordinators: new Map(), idleCoordinators: new Map(coordinator2 ? [["0002", { id: CO2, link: null, provider: null, model: null }]] : []), states: new Map(coordinator2 ? [[CO2, "idle"]] : []) });
const wait = (extra: object = {}) => ({ ...Rec.newRecord({ id: "0007/B", kind: "question", text: "Can search ship?", at: ago(90), thread: ASKER, to: "0002", doneWhen: "braid:0002", code: "q-w001" }), ...extra });
function sig(waits: object[], held: Record<string, number> = {}, pauses: string[] = []) {
  const c = signals.brokeClock(Object.fromEntries(Object.entries(held).map(([k, m]) => [k, ago(m)])), NOW);
  return { now: NOW, requests: new Map(), waits, alarm: c.alarm, pauses: new Map(pauses.map((b) => [b, { braid: b, reason: "hold", by: "user", at: ago(5), provider: null, resumeAt: null }])), clock: c };
}

test("a card with an open wait never reads stalled, the braid's nor its strands', however long its clock ran", () => {
  for (const b of [braid(), braid(false)]) {
    const held = { "0007 coordinator stalled": 60, "0007 stalled": 60, "0007/B stalled": 60 };
    const c = model.toCard(b, GH, T3(), sig([wait()], held));
    assert.notEqual(c.reason, "stalled", `${b.strands.length} strands: ${c.need?.text}`);
    assert.ok(c.strands.every((s: any) => s.reason !== "stalled"));
    const without = model.toCard(b, GH, T3(), sig([], held));
    assert.equal(without.reason, "stalled", "the same card without the wait is stalled");
  }
});

test("a wait past its estimate reads stalled at once, with the estimate; a new estimate clears it", () => {
  for (const b of [braid(), braid(false)]) {
    const missed = model.toCard(b, GH, T3(), sig([wait({ eta: ago(20) })]));
    assert.deepEqual([missed.lane, missed.reason, missed.need?.text, missed.need?.since], ["Waiting", "stalled", `Stalled: waiting on braid 0002 past its estimate ${clock(ago(20), NOW)}`, ago(20)]);
    assert.equal(model.toCard(b, GH, T3(), sig([wait({ eta: ago(-30) })])).lane, "In Progress", "an estimate still to come");
    assert.equal(model.toCard(b, GH, T3(), sig([wait({ eta: ago(20) })], {}, ["0007"])).reason, null, "held: no stall");
    assert.equal(model.toCard(b, GH, T3(), sig([wait({ eta: ago(20) })], {}, ["0002"])).reason, null, "the braid it waits on is held: no stall");
  }
});

test("a wait whose addressee is gone reads stalled after ten minutes, naming the braid", () => {
  for (const b of [braid(), braid(false)]) {
    const first = sig([wait()]);
    assert.equal(model.toCard(b, GH, T3(false), first).lane, "In Progress", "not at once");
    assert.ok(Object.hasOwn(first.clock.seen(), "0007 wait stalled"), "its clock starts");
    const gone = model.toCard(b, GH, T3(false), sig([wait()], { "0007 wait stalled": 12 }));
    assert.deepEqual([gone.lane, gone.reason, gone.need?.text, gone.need?.since], ["Waiting", "stalled", "Stalled: waiting on braid 0002, whose coordinator is gone", ago(12)]);
    const back = sig([wait()], { "0007 wait stalled": 12 });
    assert.equal(model.toCard(b, GH, T3(true), back).lane, "In Progress", "a coordinator thread again");
    assert.ok(!Object.hasOwn(back.clock.seen(), "0007 wait stalled"), "clock cleared");
    assert.equal(model.toCard(b, GH, T3(false, false), sig([wait()], { "0007 wait stalled": 12 })).reason, null, "T3 unread: can't be told");
  }
});
