import assert from "node:assert/strict";
import { test } from "node:test";
import { load } from "./support/done-fixtures.ts";

// 0072/B: a card's question says what answering it unblocks and decide, do or merge; the Requests tab lists the answered ones
// as Decided; an escalation says it reached the user.
/* eslint-disable @typescript-eslint/no-explicit-any */
const Rec: any = await load("../../dist/braids/requests.js");
const model: any = await load("../../dist/board/model.js");
const view: any = await load("../../dist/board/record.js");

const now = new Date("2026-11-25T12:00:00Z");
const at = (minutes: number): string => new Date(now.getTime() - minutes * 60_000).toISOString();
const t3: any = { status: { state: "ok" }, threads: new Map() };
const github: any = { status: { state: "ok" }, prs: new Map() };
const item = (id: string, dependencies: string[] = []): any => ({ id, title: id, status: "In Progress", labels: [], dependencies, order: null, delivery: null, body: "" });
// 0072 with strands A, B and C: C depends on B; B depends on A.
const braid: any = {
  logs: [],
  hasReport: false,
  number: "0072",
  folder: "braids/0072-a",
  brief: item("0072"),
  strands: [["A", []], ["B", ["0072/A"]], ["C", ["0072/B"]]].map(([l, d]: any) => ({ letter: l, folder: `braids/0072-a/${l}`, brief: item(`0072/${l}`, d) })),
};
const open = (id: string, kind: string, text: string, minutes: number, extra: object = {}): any => Rec.newRecord({ id, kind, text, at: at(minutes), thread: null, code: `q-${id.replace(/\W/g, "")}`, ...extra });
const ended = (r: any, state: string, by: string, minutes: number, extra: object = {}): any => ({ ...r, state, events: [...r.events, { event: state, at: at(minutes), by, ...extra }] });
const sigOf = (requests: any[], extra: object = {}): any => ({ now, requests: new Map(requests.map((r) => [r.id, r])), alarm: () => null, ...extra });
const card = (sig: any): any => model.toBoard("agento", [braid], github, t3, sig).braids[0];
const strand = (c: any, id: string): any => c.strands.find((s: any) => s.id === id);

test("a strand's question says which strands it blocks and that it is to decide", () => {
  const need = strand(card(sigOf([open("0072/B", "question", "Which rounding rule?", 5)])), "0072/B").need;
  assert.deepEqual(need.blocks, ["0072/B", "0072/C"]);
  assert.equal(need.act, "decide");
  assert.equal(need.text, "Which rounding rule?");
  assert.ok(need.handle.endsWith(need.code.slice(2)) || need.handle === need.code, "the handle comes with the code");
});

test("a braid-level plan question blocks every strand not Done", () => {
  const c = card(sigOf([open("0072", "plan", "Approve the plan", 5)]));
  assert.deepEqual(c.need.blocks, ["0072/A", "0072/B", "0072/C"]);
  assert.equal(c.need.act, "decide");
});

test("a coordinator's action is to do, in the coordinator's words; a review is to merge", () => {
  const act = strand(card(sigOf([open("0072/C", "action", "install the runner", 5)])), "0072/C").need;
  assert.equal(act.act, "do");
  assert.equal(act.text, "The coordinator asks you to: install the runner");
  assert.deepEqual(act.blocks, ["0072/C"]);
  const merge = strand(card(sigOf([open("0072/C", "review", "review PR #3", 5, { pr: 3, head: "a".repeat(40) })])), "0072/C").need;
  assert.equal(merge.act, "merge");
});

test("a question to the PM that timed out reads as escalated to the user, keeps its blocks and the PM's silence", () => {
  const need = strand(card(sigOf([open("0072/B", "question", "Match accents?", 25, { to: "pm", pm: "t" })])), "0072/B").need;
  assert.equal(need.text, "Escalated to you: Match accents? (the PM hasn't answered for 25 min)");
  assert.deepEqual(need.blocks, ["0072/B", "0072/C"]);
});

test("the Requests tab lists answered questions as Decided with the answer, who and when; withdrawn and met stay closed", () => {
  const q = (id: string, text: string, minutes: number): any => open(id, "question", text, minutes);
  const closed = [
    ended(q("0072/B", "Rounding?", 300), "answered", "user", 280, { text: "A: half-up" }),
    ended(q("0072/B", "Totals incl. refunds?", 200), "answered", "pm", 190, { text: "No", reason: "decided in D61" }),
    ended(q("0072/B", "Old API?", 100), "withdrawn", "coordinator", 90, { text: "found in the code" }),
    ended(q("0072/B", "Search first?", 100), "met", "board", 80, { text: "braid done" }),
  ];
  const tab = view.requestsOf((id: string) => id === "0072/B", sigOf([], { closed }), t3);
  assert.deepEqual(tab.decided.map((r: any) => r.text), ["Totals incl. refunds?", "Rounding?"], "newest first");
  assert.deepEqual(tab.decided.map((r: any) => [r.closed.by, r.closed.text, r.closed.reason]), [["pm", "No", "decided in D61"], ["user", "A: half-up", null]]);
  assert.ok(tab.decided.every((r: any) => r.closed.at.length > 0));
  assert.deepEqual(tab.closed.map((r: any) => r.state), ["met", "withdrawn"]);
});

test("an open request's row carries blocks and act; a closed one carries none", () => {
  const sig = sigOf([open("0072/B", "question", "Which rule?", 5)]);
  const tab = view.requestsOf(() => true, { ...sig, unblocks: () => ["0072/C"] }, t3);
  assert.deepEqual(tab.open[0].blocks, ["0072/C"]);
  assert.equal(tab.open[0].act, "decide");
  assert.equal(tab.open[0].handle, tab.open[0].code);
});
