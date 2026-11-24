import assert from "node:assert/strict";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

// Each lane rule and both broke alarms, with a fake GitHub, T3 and requests. Computed specifiers keep the compiled modules out of the typecheck.
const load = (path: string) => import(pathToFileURL(fileURLToPath(new URL(path, import.meta.url))).href);

interface Pr {
  number: number;
  url: string;
  state: "open" | "merged" | "closed";
  checks: string;
  failed?: string[];
}
interface Thread {
  id: string;
  role: "worker" | "reviewer";
  pending: number;
  link: null;
}
interface Derived {
  lane: string;
  reason: string | null;
  need: { kind: string; text: string; verb: string; age: string | null } | null;
  activity: string | null;
  agents: Thread[];
}
interface Signals {
  now: Date;
  requests: Map<string, object>;
  alarm: (id: string, reason: "checks failed" | "stalled", holds: boolean | null) => string | null;
}
const model = (await load("../dist/board/model.js")) as {
  derive: (status: string, labels: string[], key: string, gh: unknown, t3: unknown, sig: Signals) => Derived;
  toCard: (braid: unknown, gh: unknown, t3: unknown, sig: Signals) => { lane: string; running: boolean; activity: string | null; need: { text: string; who: string | null; more: number; age?: string | null; since?: string } | null; reason: string | null; strands: { lane: string }[] };
};
const signals = (await load("../dist/board/signals.js")) as {
  brokeClock: (initial: Record<string, string>, now: Date) => { alarm: Signals["alarm"]; seen: () => Record<string, string>; changed: () => boolean };
};
const demo = (await load("../dist/board/demo.js")) as { demoBraids: () => { number: string }[] };

const NOW = new Date("2026-11-15T12:00:00Z");
const ago = (minutes: number) => new Date(NOW.getTime() - minutes * 60_000).toISOString();
const KEY = "0001/A";

const pr = (state: Pr["state"], checks = "passing", failed: string[] = []): Pr => ({ number: 7, url: "u", state, checks, ...(failed.length > 0 ? { failed } : {}) });
const gh = (p: Pr | null, ok = true) => ({ status: ok ? { state: "ok" } : { state: "unavailable", reason: "x" }, prs: new Map(p === null ? [] : [[KEY, p]]) });
const thread = (role: Thread["role"] = "worker", pending = 0): Thread => ({ id: "t", role, pending, link: null });
const t3 = (threads: Thread[] = [], ok = true) => ({ status: ok ? { state: "ok" } : { state: "unavailable", reason: "x" }, threads: new Map(threads.length === 0 ? [] : [[KEY, threads]]) });
const request = (kind: string, extra: object = {}) => ({ id: KEY, kind, text: `a ${kind} text`, at: ago(35), thread: null, ...extra });

/** Signals with these requests and an alarm clock that has seen each condition for `held` minutes. */
function sig(requests: object[] = [], held: Record<string, number> = {}) {
  const clock = signals.brokeClock(Object.fromEntries(Object.entries(held).map(([k, m]) => [k, ago(m)])), NOW);
  const s: Signals = { now: NOW, requests: new Map(requests.map((r) => [(r as { id: string }).id, r])), alarm: clock.alarm };
  return Object.assign(s, { clock });
}
const lane = (status: string, g: unknown, t: unknown, s: Signals, labels: string[] = []) => model.derive(status, labels, KEY, g, t, s);

test("Done, as statusOf reads it (a merged PR, or a stored Done with no open PR), is Done, whatever else is open", () => {
  const s = sig([request("question")], {});
  assert.equal(lane("Done", gh(pr("merged")), t3([thread()]), s).lane, "Done");
  assert.equal(lane("Done", gh(null), t3(), s).lane, "Done");
  // A card reads it from the PR: a merged strand whose brief still says In Progress is Done.
  const story = demo.demoBraids().find((b: { strands: unknown[] }) => b.strands.length === 0);
  const merged = model.toCard({ ...story, brief: { ...story.brief, status: "In Progress" } }, { status: { state: "ok" }, prs: new Map([[story.number, pr("merged")]]) }, t3(), sig());
  assert.deepEqual([merged.lane, merged.status], ["Done", "Done"]);
});

test("an open review request is To Review; another open request is Needs You with its text", () => {
  const review = lane("In Progress", gh(pr("open")), t3([thread()]), sig([request("review", { pr: 7 })]));
  assert.deepEqual([review.lane, review.reason, review.need?.text, review.need?.age], ["In Review", null, "Merge PR #7", "35m"]);
  for (const kind of ["question", "decision", "plan"]) {
    const d = lane("To Do", gh(null), t3(), sig([request(kind)]));
    assert.deepEqual([d.lane, d.reason, d.need?.text, d.need?.verb], ["Waiting", kind, `a ${kind} text`, "asked"], kind);
  }
});

test("an open PR without a review request is Working: the agents still have it", () => {
  for (const checks of ["passing", "pending", "none"]) {
    assert.equal(lane("In Progress", gh(pr("open", checks)), t3([thread()]), sig()).lane, "In Progress", checks);
  }
  // Even with nobody running, the first ten minutes are Working.
  assert.equal(lane("In Progress", gh(pr("open", "passing")), t3(), sig()).lane, "In Progress");
});

test("an agent's pending question is Needs You", () => {
  const d = lane("In Progress", gh(null), t3([thread("worker", 1)]), sig());
  assert.deepEqual([d.lane, d.reason, d.need?.kind], ["Waiting", "question", "question"]);
});

test("a running reviewer (a recorded subagent) is Working, with a review mark", () => {
  const d = lane("In Progress", gh(pr("open", "failing", ["verify"])), t3([thread("reviewer")]), sig([], { [`${KEY} checks failed`]: 30 }));
  assert.deepEqual([d.lane, d.activity], ["In Progress", "review"]); // an agent of the item runs: no alarm, however long
  assert.equal(lane("To Do", gh(null), t3([thread("reviewer")]), sig()).lane, "In Progress");
  assert.equal(lane("In Progress", gh(pr("open")), t3([thread("worker")]), sig()).activity, "agent");
  assert.equal(lane("In Progress", gh(pr("open", "pending")), t3(), sig()).activity, "checks");
});

test("checks failed: red checks, no agent, held for ten minutes", () => {
  const failing = gh(pr("open", "failing", ["verify (windows-latest)"]));
  const at = (minutes: number | null) => lane("In Progress", failing, t3(), sig([], minutes === null ? {} : { [`${KEY} checks failed`]: minutes }));
  assert.equal(at(null).lane, "In Progress", "first seen now");
  assert.equal(at(9).lane, "In Progress", "a condition shorter than ten minutes shows no alarm");
  const d = at(14);
  assert.deepEqual([d.lane, d.reason, d.need?.verb, d.need?.age], ["Waiting", "checks failed", "for", "14m"]);
  assert.equal(d.need?.text, "Checks failed: verify (windows-latest); fix or retry");
  // An agent that runs, or a request that is open, cancels it.
  assert.equal(lane("In Progress", failing, t3([thread()]), sig([], { [`${KEY} checks failed`]: 14 })).lane, "In Progress");
  assert.equal(lane("In Progress", failing, t3(), sig([request("question")], { [`${KEY} checks failed`]: 14 })).reason, "question");
});

test("stalled: In Progress, no request, no agent, no checks pending, held for ten minutes", () => {
  const at = (g: unknown, minutes: number | null, status = "In Progress") => lane(status, g, t3(), sig([], minutes === null ? {} : { [`${KEY} stalled`]: minutes }));
  assert.equal(at(gh(null), null).lane, "In Progress", "first seen now");
  assert.equal(at(gh(null), 9).lane, "In Progress", "nine minutes");
  const d = at(gh(null), 25);
  assert.deepEqual([d.lane, d.reason, d.need?.text, d.need?.age], ["Waiting", "stalled", "Stalled: nobody is working and nothing was asked", "25m"]);
  assert.equal(at(gh(pr("open", "passing")), 25).reason, "stalled", "a green PR nobody handed over");
  assert.equal(at(gh(pr("open", "pending")), 25).lane, "In Progress", "checks are still pending");
  assert.equal(at(gh(null), 25, "To Do").lane, "To Do", "not started");
});

test("a condition that stops holding starts again from zero; what can't be told neither starts nor stops", () => {
  const clock = signals.brokeClock({ [`${KEY} stalled`]: ago(30) }, NOW);
  assert.equal(clock.alarm(KEY, "stalled", null), null, "unknown shows nothing");
  assert.deepEqual(Object.keys(clock.seen()), [`${KEY} stalled`], "and keeps the time");
  assert.equal(clock.alarm(KEY, "stalled", false), null);
  assert.deepEqual(clock.seen(), {});
  assert.equal(clock.alarm(KEY, "stalled", true), null, "back again: first seen now");
  assert.equal(clock.seen()[`${KEY} stalled`], NOW.toISOString());
  assert.equal(clock.changed(), true);
  // Nothing written when nothing changed.
  assert.equal(signals.brokeClock({}, NOW).changed(), false);
});

test("without GitHub or T3 no alarm can be told", () => {
  const held = { [`${KEY} stalled`]: 30, [`${KEY} checks failed`]: 30 };
  assert.equal(lane("In Progress", gh(null, false), t3(), sig([], held)).lane, "In Progress");
  assert.equal(lane("In Progress", gh(null), t3([], false), sig([], held)).lane, "In Progress");
});

test("a coordinator on a braid branch with strands is no agent, and a braid shows the most urgent of strands and own request", () => {
  const braids = demo.demoBraids();
  const braid = braids.find((b) => b.number === "0001");
  const coordinator = { status: { state: "ok" }, threads: new Map([["0001", [thread("worker", 1)]]]) };
  const card = model.toCard(braid, gh(null), coordinator, sig());
  assert.deepEqual([card.running, card.lane, card.need], [false, "In Progress", null], "its pending question counts for nothing");
  const own = model.toCard(braid, gh(null), coordinator, sig([{ ...request("plan"), id: "0001" }]));
  assert.deepEqual([own.lane, own.need?.who, own.need?.more], ["Waiting", null, 0]);
  const mixed = model.toCard(braid, gh(null), t3(), sig([{ ...request("question"), id: "0001/B" }, { ...request("review", { pr: 7 }), id: "0001/C" }, { ...request("plan"), id: "0001" }]));
  assert.deepEqual([mixed.lane, mixed.need?.who, mixed.need?.more], ["Waiting", null, 2], "the braid's own request first on a tie, the strands counted");
});

test("a braid's final PR: every strand Done, the braid's own PR open", () => {
  const braid = demo.demoBraids().find((b) => b.number === "0008"); // one strand, Done
  const braidKey = (status: string) => ({ ...(braid as object), brief: { ...(braid as unknown as { brief: object }).brief, status } });
  const gh2 = { status: { state: "ok" }, prs: new Map([["0008/A", { number: 15, url: "u", state: "merged", checks: "passing" }], ["0008", { number: 16, url: "u", state: "open", checks: "passing" }]]) };
  const coordinator = { status: { state: "ok" }, threads: new Map([["0008", [thread("worker", 1)]]]) };
  const done = model.toCard(braidKey("Done"), gh2, coordinator, sig());
  assert.deepEqual([done.lane, done.need?.text, done.need?.who, done.reason], ["In Review", "Merge PR #16", null, null], "stored Done, open PR, no request: To Review");
  const working = model.toCard(braidKey("In Progress"), gh2, coordinator, sig());
  assert.deepEqual([working.lane, working.need, working.running], ["In Progress", null, false], "the coordinator on the braid branch is no agent");
  const reviewed = model.toCard(braidKey("In Progress"), gh2, coordinator, sig([{ ...request("review", { pr: 16 }), id: "0008" }]));
  assert.deepEqual([reviewed.lane, reviewed.need?.text], ["In Review", "Merge PR #16"]);
  // Merged: Done again.
  const merged = { ...gh2, prs: new Map([...gh2.prs, ["0008", { number: 16, url: "u", state: "merged", checks: "passing" }]]) };
  assert.equal(model.toCard(braidKey("Done"), merged, coordinator, sig()).lane, "Done");
});

test("wrap-up: the braid's card shows its final PR's checks and counts its reviewers, never the coordinator", () => {
  const braid = demo.demoBraids().find((b) => b.number === "0008");
  const inProgress = { ...(braid as object), brief: { ...(braid as unknown as { brief: object }).brief, status: "In Progress" } };
  const prs = (checks: string) => ({ status: { state: "ok" }, prs: new Map([["0008/A", { number: 15, url: "u", state: "merged", checks: "passing" }], ["0008", { number: 16, url: "u", state: "open", checks, failed: ["verify"] }]]) });
  const coordinator = { status: { state: "ok" }, threads: new Map([["0008", [thread("worker", 0)]]]) };
  const reviewer = { status: { state: "ok" }, threads: new Map([["0008", [thread("reviewer", 0)]]]) };
  const pending = model.toCard(inProgress, prs("pending"), coordinator, sig());
  assert.deepEqual([pending.lane, pending.activity, pending.running], ["In Progress", "checks", false], "checks spinner while they run");
  const reviewing = model.toCard(inProgress, prs("pending"), reviewer, sig());
  assert.deepEqual([reviewing.activity, reviewing.running], ["review", true], "a reviewer is its agent");
  // Failing checks: the coordinator doesn't hold the alarm back, a reviewer does.
  const heldBack = model.toCard(inProgress, prs("failing"), reviewer, sig([], { "0008 checks failed": 30 }));
  assert.equal(heldBack.lane, "In Progress", "a reviewer running holds back checks failed");
  const failed = model.toCard(inProgress, prs("failing"), coordinator, sig([], { "0008 checks failed": 30 }));
  assert.equal(failed.lane, "Waiting");
});

test("a started braid whose strands are all To Do shows Working: its own status is In Progress, or a strand is Done", () => {
  const braid = demo.demoBraids().find((b) => b.number === "0007") as unknown as { brief: { status: string }; strands: { brief: { status: string } }[] }; // three strands, all To Do
  const withStatus = (status: string, firstStrand = "To Do") => ({
    ...braid,
    brief: { ...braid.brief, status },
    strands: braid.strands.map((s, i) => ({ ...s, brief: { ...s.brief, status: i === 0 ? firstStrand : "To Do" } })),
  });
  const card = (b: unknown) => model.toCard(b, gh(null), t3(), sig()).lane;
  assert.equal(card(withStatus("In Progress")), "In Progress", "the braid's own status says started");
  assert.equal(card(withStatus("To Do", "Done")), "In Progress", "a Done strand says started, between strands");
  assert.equal(card(withStatus("To Do")), "To Do", "nothing started stays To Do");
});

// A braid being planned: a running coordinator thread or an open planning PR lifts only To Do.
test("a braid being planned is Working: a running coordinator or an open planning PR lifts To Do, nothing else", () => {
  const base = demo.demoBraids().find((b) => b.number === "0007") as unknown as { brief: { status: string }; strands: { brief: { status: string } }[] };
  const todo = { ...base, brief: { ...base.brief, status: "To Do" }, strands: base.strands.map((s) => ({ ...s, brief: { ...s.brief, status: "To Do" } })) };
  const solo = { ...todo, strands: [] as unknown[] };
  const coordinator = (running = true) => ({ status: { state: "ok" }, threads: new Map(), coordinators: new Map(running ? [["0007", { id: "c", link: null, provider: null, model: null }]] : []) });
  const planning = (checks: string, state = "open") => ({ status: { state: "ok" }, prs: new Map(), planning: new Map(state === "open" ? [["0007", { number: 9, url: "u", state: "open", checks }]] : []) });
  const card = (b: unknown, g: unknown, t: unknown, s: Signals = sig()) => model.toCard(b, g, t, s);
  for (const b of [todo, solo]) {
    assert.equal(card(b, gh(null), coordinator()).lane, "In Progress", "a running coordinator");
    assert.equal(card(b, gh(null), coordinator(false)).lane, "To Do", "no coordinator, no planning PR");
    assert.equal(card(b, planning("passing"), coordinator(false)).lane, "In Progress", "an open planning PR");
    assert.equal(card(b, planning("pending"), coordinator(false)).activity, "checks", "its checks run");
    assert.equal(card(b, planning("passing", "merged"), coordinator(false)).lane, "To Do", "a merged or closed one lifts nothing and never makes Done");
    assert.equal(card(b, planning("passing"), coordinator(false), sig([{ ...request("plan"), id: "0007" }])).lane, "Waiting", "an open request wins");
    assert.equal(card(b, planning("passing"), coordinator(), sig([{ ...request("review", { pr: 7 }), id: "0007" }])).lane, "In Review", "so does a review request");
  }
  const c = card(todo, gh(null), coordinator());
  assert.deepEqual([c.running, c.need, c.strands.map((s) => s.lane)], [false, null, ["To Do", "To Do", "To Do"]], "the coordinator is no agent and changes no strand");
});

// A braid with strands whose coordinator stopped: its own braid-level `stalled` alarm.
test("a braid whose coordinator stopped is Needs You stalled after ten minutes, and in no other case", () => {
  const base = demo.demoBraids().find((b) => b.number === "0007") as unknown as { brief: { status: string }; strands: { brief: { status: string } }[] };
  const braid = (status = "In Progress", strands: string[] = ["Done", "To Do", "To Do"]) => ({ ...base, brief: { ...base.brief, status }, strands: base.strands.map((s, i) => ({ ...s, brief: { ...s.brief, status: strands[i] ?? "To Do" } })) });
  const T3 = (running = false, ok = true, threads: [string, Thread[]][] = []) => ({ status: { state: ok ? "ok" : "unavailable", reason: "x" }, threads: new Map(threads), coordinators: new Map(running ? [["0007", { id: "c", link: null, provider: null, model: null }]] : []) });
  const GH = (prs: [string, Pr][] = [], ok = true) => ({ status: { state: ok ? "ok" : "unavailable", reason: "x" }, prs: new Map(prs) });
  const held = (m: number) => sig([], { "0007 coordinator stalled": m });
  const card = (b: unknown, g: unknown, t: unknown, s: Signals) => model.toCard(b, g, t, s);

  const stalled = card(braid(), GH(), T3(), held(14));
  assert.deepEqual([stalled.lane, stalled.reason, stalled.need?.text, stalled.need?.who, stalled.need?.age], ["Waiting", "stalled", "Stalled: the coordinator stopped and nothing was asked", null, "14m"]);
  assert.equal(stalled.need?.since, ago(14), "since is the clock's start");
  assert.equal(card(braid(), GH(), T3(), held(9)).lane, "In Progress", "not before ten minutes");
  const first = sig();
  assert.equal(card(braid(), GH(), T3(), first).lane, "In Progress");
  assert.ok(Object.hasOwn((first as unknown as { clock: { seen: () => object } }).clock.seen(), "0007 coordinator stalled"), "the clock starts");
  // Each of these clears the clock and keeps it Working.
  const cleared = (label: string, b: unknown, g: unknown, t: unknown, extra: object[] = [], expect = "In Progress") => {
    const s = sig(extra, { "0007 coordinator stalled": 14 });
    assert.equal(card(b, g, t, s).lane, expect, label);
    assert.ok(!Object.hasOwn((s as unknown as { clock: { seen: () => object } }).clock.seen(), "0007 coordinator stalled"), `${label}: clock cleared`);
  };
  cleared("a running coordinator", braid(), GH(), T3(true));
  cleared("a running strand", braid("In Progress", ["Done", "To Do"]), GH(), T3(false, true, [["0007/B", [thread()]]]));
  cleared("a strand with pending checks", braid("In Progress", ["Done", "In Progress"]), GH([["0007/B", pr("open", "pending")]]), T3());
  cleared("a request on a strand", braid(), GH(), T3(), [{ ...request("question"), id: "0007/B" }], "Waiting");
  cleared("a request on the braid", braid(), GH(), T3(), [{ ...request("plan"), id: "0007" }], "Waiting");
  // No clock start when T3 or GitHub cannot be read: the earlier time is kept, nothing shows.
  for (const [g, t] of [[GH([], false), T3()], [GH(), T3(false, false)]]) {
    const s = held(14);
    assert.equal(card(braid(), g, t, s).lane, "In Progress", "unknown shows nothing");
    assert.ok(Object.hasOwn((s as unknown as { clock: { seen: () => object } }).clock.seen(), "0007 coordinator stalled"), "and keeps the time");
  }
  const fresh = sig();
  card(braid(), GH([], false), T3(), fresh);
  assert.ok(!Object.hasOwn((fresh as unknown as { clock: { seen: () => object } }).clock.seen(), "0007 coordinator stalled"), "no start while unknown");
  // A To Do braid never stalls; a final PR with checks pending stays Working.
  assert.equal(card(braid("To Do", ["To Do", "To Do", "To Do"]), GH(), T3(), held(14)).lane, "To Do");
  assert.equal(card(braid("In Progress", ["Done", "Done", "Done"]), GH([["0007", pr("open", "pending")]]), T3(), held(14)).activity, "checks");
});

test("the braid-level stall never leaks into wrap-up or a merged final PR", () => {
  const base = demo.demoBraids().find((b) => b.number === "0008") as unknown as { brief: { status: string } }; // one strand
  const braid = (strand: string) => ({ ...base, brief: { ...base.brief, status: "In Progress" }, strands: (base as unknown as { strands: { brief: object }[] }).strands.map((s) => ({ ...s, brief: { ...s.brief, status: strand } })) });
  const running = { status: { state: "ok" }, threads: new Map(), coordinators: new Map([["0008", { id: "c", link: null, provider: null, model: null }]]) };
  const G = (finalPr: Pr) => ({ status: { state: "ok" }, prs: new Map([["0008/A", { number: 15, url: "u", state: "merged", checks: "passing" }], ["0008", finalPr]]) });
  const held = () => sig([], { "0008 coordinator stalled": 14 });
  for (const checks of ["passing", "none"]) {
    const s = held();
    const c = model.toCard(braid("Done"), G(pr("open", checks)), running, s);
    assert.notEqual(c.reason, "stalled", `final PR ${checks}, coordinator running`);
    assert.ok(!Object.hasOwn((s as unknown as { clock: { seen: () => object } }).clock.seen(), "0008 coordinator stalled"), "the braid-level clock is cleared");
  }
  const s = held();
  const merged = model.toCard(braid("Done"), G(pr("merged")), { status: { state: "ok" }, threads: new Map(), coordinators: new Map() }, s);
  assert.equal(merged.lane, "Done");
  assert.ok(!Object.hasOwn((s as unknown as { clock: { seen: () => object } }).clock.seen(), "0008 coordinator stalled"), "a merged final PR clears it");
});
