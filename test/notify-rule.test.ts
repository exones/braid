import assert from "node:assert/strict";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

// 0069/B: one rule (`forUser`) says which needs push the user and which thread each push opens, from the request record.
// Computed specifiers keep the compiled modules out of the typecheck.
const load = (path: string) => import(pathToFileURL(fileURLToPath(new URL(path, import.meta.url))).href);
/* eslint-disable @typescript-eslint/no-explicit-any */
const model: any = await load("../dist/board/model.js");
const signals: any = await load("../dist/board/signals.js");
const message: any = await load("../dist/notify/message.js");
const { planOf }: any = await load("../dist/board/plans.js");

const NOW = new Date("2026-11-22T12:00:00Z");
const ago = (minutes: number) => new Date(NOW.getTime() - minutes * 60_000).toISOString();
const PM = "11111111-aaaa-4bbb-8ccc-222222222222";
const ASKER = "22222222-aaaa-4bbb-8ccc-333333333333";
const COORD = "33333333-aaaa-4bbb-8ccc-444444444444";
const base = "http://127.0.0.1:3773/env1/";
const url = (thread: string) => `t3code://threads/env1/${thread}`;

const t3 = (extra: object = {}, listed: string[] = [PM, ASKER]): any => ({
  status: { state: "ok" },
  threads: new Map(),
  states: new Map([[PM, "idle"]]),
  links: new Map(listed.map((id) => [id, base + id])),
  ...extra,
});
const PR = { number: 7, url: "u", state: "open", checks: "passing", base: "main", branch: "braid/0001-a", head: "a".repeat(40) };
const gh = (pr: object | null = null): any => ({ status: { state: "ok" }, prs: new Map(pr === null ? [] : [["0001", pr]]) });
const request = (kind: string, minutes: number, extra: object = {}): any => ({ id: "0001", kind, text: `a ${kind} text`, at: ago(minutes), thread: ASKER, ...extra });
const braid = (status = "In Progress", number = "0001"): any => ({ number, folder: `braids/${number}-a`, brief: { id: number, title: `B${number}`, status, labels: [], dependencies: [] }, strands: [] });
const plan = (): any =>
  planOf("working-product", "pm/working-product", `---\nprogramme: working-product\ntitle: W\ngoal: G\nthread: ${PM}\nstate: running\nrows:\n  - P1 | 0001 | One | running\n---\n`);

function boardOf(requests: any[], opts: { github?: any; t3?: any; plans?: any[]; braids?: any[]; coordinator?: boolean } = {}): any {
  const clock = signals.brokeClock({}, NOW);
  const sig = { now: NOW, requests: new Map(requests.map((r) => [r.id, r])), alarm: clock.alarm, plans: opts.plans ?? [] };
  const threads = opts.t3 ?? t3(opts.coordinator === true ? { coordinators: new Map([["0001", { link: base + COORD, provider: null, model: null }]]) } : {});
  return model.toBoard("agento", opts.braids ?? [braid()], opts.github ?? gh(), threads, sig);
}
const pushes = (b: any): any[] => message.pushesOf(b);

test("a request to the user pushes and opens its asking thread, any kind", () => {
  for (const kind of ["question", "decision", "plan", "action"]) {
    const [p, ...rest] = pushes(boardOf([request(kind, 3)]));
    assert.equal(rest.length, 0);
    assert.equal(p.title, "agento 0001: Needs You");
    assert.equal(p.click, url(ASKER), kind);
  }
  const [r] = pushes(boardOf([request("review", 3, { pr: 7 })], { github: gh(PR) }));
  assert.deepEqual([r.title, r.click], ["agento 0001: To Review", url(ASKER)]);
  const [u] = pushes(boardOf([request("question", 3, { to: "user" })]));
  assert.equal(u.click, url(ASKER), "to: user is the same");
});

test("the thread is the request's, else the braid's coordinator, else one built from its id, else the board", () => {
  // No thread on the request: the braid's coordinator.
  const [a] = pushes(boardOf([request("question", 3, { thread: null })], { coordinator: true }));
  assert.equal(a.click, url(COORD));
  // The request's thread isn't listed in T3: built from the id with the environment of a listed thread.
  const [b] = pushes(boardOf([request("question", 3, { thread: "unlisted-thread" })]));
  assert.equal(b.click, url("unlisted-thread"));
  // Nothing to open: the push still goes, and says where to go.
  const [c] = pushes(boardOf([request("question", 3, { thread: null })], { t3: t3({}, []) }));
  assert.equal(c.click, null);
  assert.match(c.body, /\nOpen the board$/);
  for (const p of [a, b]) {
    assert.doesNotMatch(p.body, /Open the board/);
  }
});

test("a request to the PM is no push while the PM handles it; escalated, it opens the asking thread", () => {
  assert.deepEqual(pushes(boardOf([request("question", 3, { to: "pm", pm: PM })])), []);
  const [t] = pushes(boardOf([request("question", 30, { to: "pm", pm: PM })]));
  assert.deepEqual([t.title, t.click], ["agento 0001: Needs You (escalated)", url(ASKER)]);
  const gone = pushes(boardOf([request("question", 3, { to: "pm", pm: PM })], { t3: t3({ states: new Map([[PM, "archived"]]) }) }));
  assert.deepEqual([gone[0].title, gone[0].click], ["agento 0001: Needs You (escalated)", url(ASKER)]);
});

test("a request the PM forwarded is the PM asking: 🧭, high, the PM's thread (a braid no programme lists)", () => {
  const [p, ...rest] = pushes(boardOf([request("question", 5, { to: "user", pm: PM, forwarded: ago(1), note: "your call" })]));
  assert.equal(rest.length, 0);
  assert.deepEqual([p.title, p.tags, p.priority, p.click], ["agento 0001: the PM asks", ["compass"], "high", url(PM)]);
  assert.equal(p.body, "B0001\nThe PM asks you: a question text — your call");
});

test("the PM's own request and a programme's stall push, opening the PM's thread", () => {
  const clock = signals.brokeClock({ "agento/working-product pm stalled": ago(30) }, NOW);
  const sig = { now: NOW, requests: new Map(), alarm: clock.alarm, plans: [plan()] };
  const board = model.toBoard("agento", [braid()], gh(), t3(), sig);
  const [stall] = pushes(board);
  assert.deepEqual([stall.title, stall.tags, stall.click], ["agento working-product: Needs You", ["hourglass"], url(PM)]);
  const asked = { ...sig, programmes: [{ id: "pm/working-product", kind: "action", by: "pm", text: "protect main", at: ago(1), thread: PM }], asks: new Map([["0001", { id: "0001", kind: "question", by: "pm", text: "which?", at: ago(1), thread: PM }]]) };
  const out = pushes(model.toBoard("agento", [braid()], gh(), t3(), asked));
  assert.deepEqual(out.map((p) => [p.item, p.title, p.click]), [
    ["pm/working-product#pm", "agento working-product: the PM asks", url(PM)],
    ["0001#pm", "agento 0001: the PM asks", url(PM)],
  ]);
});

test("nothing else pushes: an alarm, a pending question, a Done waiting for its merge, a strand PR with no request, a Done braid a programme runs", () => {
  // A broke alarm: checks failing on an open PR (held 20 min), and a stalled braid.
  const clock = signals.brokeClock({ "0001 checks failed": ago(20), "0001 stalled": ago(30) }, NOW);
  const failing = model.toBoard("agento", [braid()], gh({ ...PR, checks: "failing", failed: ["verify"] }), t3(), { now: NOW, requests: new Map(), alarm: clock.alarm });
  assert.equal(failing.braids[0].need.kind, "checks failed");
  assert.deepEqual(pushes(failing), []);
  const stalled = model.toBoard("agento", [braid()], gh(), t3(), { now: NOW, requests: new Map(), alarm: signals.brokeClock({ "0001 stalled": ago(30) }, NOW).alarm });
  assert.equal(stalled.braids[0].need.kind, "stalled");
  assert.deepEqual(pushes(stalled), []);
  // An agent's pending question in T3.
  const asking = t3({ threads: new Map([["0001", [{ role: "worker", pending: 1, link: base + "w" }]]]) });
  const q = model.toBoard("agento", [braid()], gh(), asking, { now: NOW, requests: new Map(), alarm: () => null });
  assert.equal(q.braids[0].need.kind, "question");
  assert.deepEqual(pushes(q), []);
  // A story stamped Done, its PR open, no request: waiting for the handover.
  const waiting = model.toBoard("agento", [braid("Done")], gh(PR), t3(), { now: NOW, requests: new Map(), alarm: () => null });
  assert.equal(waiting.braids[0].lane, "In Review");
  assert.deepEqual(pushes(waiting), []);
  // A strand PR in To Review with no request.
  const strand = { ...braid(), strands: [{ letter: "A", folder: "braids/0001-a/A-s", brief: { id: "0001/A", title: "S", status: "Done", labels: [], dependencies: [] } }] };
  const strandBoard = model.toBoard("agento", [strand], { status: { state: "ok" }, prs: new Map([["0001/A", PR]]) }, t3(), { now: NOW, requests: new Map(), alarm: () => null });
  assert.equal(strandBoard.braids[0].strands[0].lane, "In Review");
  assert.deepEqual(pushes(strandBoard), []);
  // A braid Done: pushes unless a programme runs it.
  assert.equal(pushes(boardOf([], { braids: [braid("Done")] })).length, 1);
  assert.deepEqual(pushes(boardOf([], { braids: [braid("Done")], plans: [plan()] })), []);
});

test("under a PM a forwarded request is the PM asking: the panel says so, the card keeps its lane and one push opens the PM's thread", () => {
  const forwarded = request("question", 5, { to: "user", pm: PM, forwarded: ago(1), note: "your call" });
  const b = boardOf([forwarded], { plans: [plan()] });
  const [card] = b.braids;
  assert.equal(card.lane, "In Progress", "the card stays in the lane of its work");
  assert.equal(card.need, null);
  assert.equal(card.pm.text, "Waiting on the user, through the PM: a question text");
  assert.equal(card.pm.forwarded, true);
  const [prog] = b.programmes;
  assert.equal(prog.section, "needs");
  assert.equal(prog.forwards.length, 1);
  assert.equal(prog.forwards[0].id, "0001");
  assert.equal(prog.forwards[0].need.text, "The PM asks you: a question text — your call");
  assert.equal(prog.handling.length, 0, "the PM isn't handling it, the user is asked");
  const out = pushes(b);
  assert.equal(out.length, 1);
  assert.deepEqual([out[0].title, out[0].tags, out[0].priority, out[0].click, out[0].item], ["agento 0001: the PM asks", ["compass"], "high", url(PM), "0001"]);
  // The same request without a programme keeps the braid's card in Needs You, as before.
  const alone = boardOf([forwarded]);
  assert.equal(alone.braids[0].lane, "Waiting");
  assert.equal(alone.braids[0].need.via, "forwarded");
  assert.equal(pushes(alone).length, 1);
});

test("under a PM an escalation by timeout or a gone PM thread still puts the card in Needs You", () => {
  const timeout = boardOf([request("question", 30, { to: "pm", pm: PM })], { plans: [plan()] });
  assert.equal(timeout.braids[0].lane, "Waiting");
  assert.equal(timeout.braids[0].need.via, "timeout");
  assert.equal(timeout.programmes[0].forwards.length, 0);
  assert.deepEqual(pushes(timeout).map((p) => [p.title, p.click]), [["agento 0001: Needs You (escalated)", url(ASKER)]]);
  const gone = boardOf([request("question", 3, { to: "pm", pm: PM })], { plans: [plan()], t3: t3({ states: new Map([[PM, "failed"]]) }) });
  assert.equal(gone.braids[0].lane, "Waiting");
  assert.equal(gone.braids[0].need.via, "gone");
  assert.equal(pushes(gone).length, 1);
});
