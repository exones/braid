// 0082/B: every place the user reads a request names it and marks it the same way: handles for a replaced wait and in
// decisions, a wait's own words, the escalated mark on the Requests tab, and an open request that stays with its Done item.
import assert from "node:assert/strict";
import { test } from "node:test";
import { load, world } from "./support/done-fixtures.ts";

/* eslint-disable @typescript-eslint/no-explicit-any */
const Rec: any = await load("../../dist/braids/requests.js");
const B: any = await load("../../dist/braids/gitbranch.js");
const Cmd: any = await load("../../dist/commands/requests.js");
const model: any = await load("../../dist/board/model.js");
const view: any = await load("../../dist/board/record.js");
const { pushesOf }: any = await load("../../dist/notify/message.js");
const { decisionsCommand }: any = await load("../../dist/commands/decisions.js");
const { boardHelp }: any = await load("../../dist/cli.js");

const handleIn = (out: string): string => /^(\S+)/.exec(out)?.[1] ?? assert.fail(`no handle in: ${out}`);

const now = new Date("2026-11-25T12:00:00Z");
const at = (minutes: number): string => new Date(now.getTime() - minutes * 60_000).toISOString();
const t3: any = { status: { state: "ok" }, threads: new Map() };
const github: any = { status: { state: "ok" }, prs: new Map() };
const item = (id: string, status: string): any => ({ id, title: id, status, labels: [], dependencies: [], order: null, delivery: null, body: "" });
const braid = (status: string, strands: [string, string][] = []): any => ({
  logs: [],
  hasReport: false,
  number: "0072",
  folder: "braids/0072-a",
  brief: item("0072", status),
  strands: strands.map(([l, s]) => ({ letter: l, folder: `braids/0072-a/${l}`, brief: item(`0072/${l}`, s) })),
});
const open = (id: string, kind: string, text: string, extra: object = {}): any =>
  Rec.newRecord({ id, kind, text, at: at(5), thread: null, code: `q-${id.replace(/\W/g, "").toLowerCase()}${kind.slice(0, 1)}`, words: "yellow bear", ...extra });
const sigOf = (requests: any[], extra: object = {}): any => ({ now, requests: new Map(requests.map((r) => [r.id, r])), alarm: () => null, ...extra });
const board = (b: any, sig: any): any => model.toBoard("agento", [b], github, t3, sig);

test("a replaced wait and braid decisions name requests by their handle, and braid ask says which one it replaced", () => {
  const w = world();
  const until = (hours: number) => `time:${new Date(Date.now() + hours * 3_600_000).toISOString()}`;
  const first = handleIn(Cmd.askCommand(w.root, ["0001/A", "CI is slow", "--to", "self", "--done-when", until(1)]));
  const out = Cmd.askCommand(w.root, ["0001/A", "CI is slower", "--to", "self", "--done-when", until(2)]);
  const second = handleIn(out);
  assert.match(out, new RegExp(`^${second} 0001/A: timed wait opened, replacing ${first}, waiting until `));
  const old = Rec.loadRecord(w.root).requests.find((r: any) => Rec.handleOf(r) === first);
  assert.equal(old.events.at(-1).text, `replaced by ${second}`);
  const asked = handleIn(Cmd.askCommand(w.root, ["0001/A", "Which name?"]));
  assert.doesNotMatch(Cmd.askCommand(w.root, ["0001/A", "Which name, really?"]), /replacing/);
  Cmd.answerCommand(w.root, w.root, [asked]);
  assert.match(decisionsCommand(w.root, ["0001"]), new RegExp(`${asked} answered by the user: Which name\\?`));
});

test("a wait reads what it waits for, never decide or question", () => {
  const w = world();
  const out = Cmd.askCommand(w.root, ["0001", "Does 0002 ship first?", "--to", "0002"]);
  assert.match(out, /\nblocks 0001\/A · waits for 0002\n/);
  const timed = open("0072", "question", "Wait an hour", { to: "self", doneWhen: `time:${new Date(now.getTime() + 3_600_000).toISOString()}` });
  const braidWait = open("0072/A", "question", "Is 0077 in?", { to: "0077" });
  const tab = view.requestsOf(() => true, sigOf([], { waits: [timed, braidWait] }), t3);
  assert.deepEqual(tab.waiting.map((r: any) => r.act).sort(), [`until ${new Date(now.getTime() + 3_600_000).toTimeString().slice(0, 5)}`, "waits for 0077"]);
});

test("the Requests tab marks a request the PM escalated as its card does, and a forwarded one; not a paused or direct one", () => {
  const rowOf = (extra: object, sig: object = {}): any => view.requestsOf(() => true, sigOf([{ ...open("0072/A", "question", "Match accents?"), at: at(25), ...extra }], sig), t3).open[0];
  const escalated = rowOf({ to: "pm", pm: "t" });
  assert.deepEqual(escalated.mark, { words: "Escalated to you:", why: " (the PM hasn't answered for 25 min)" });
  const need = board(braid("In Progress", [["A", "In Progress"]]), sigOf([{ ...open("0072/A", "question", "Match accents?"), at: at(25), to: "pm", pm: "t" }])).braids[0].strands[0].need;
  assert.equal(`${escalated.mark.words} ${escalated.text}${escalated.mark.why}`, need.text);
  assert.deepEqual(rowOf({ forwarded: at(1), note: "your call" }).mark, { words: "Forwarded by the PM:", why: "" });
  assert.equal(rowOf({}).mark, null);
  assert.equal(rowOf({ to: "pm", pm: "t" }, { pauses: new Map([["0072", {}]]) }).mark, null);
});

test("an open request stays on a Done braid: the need of the card, the PM's too; it pushes nothing new", () => {
  const story = board(braid("Done"), sigOf([open("0072", "question", "Keep the old API?")], { asks: new Map([["0072", open("0072", "action", "rotate the key", { by: "pm" })]]) }));
  const card = story.braids[0];
  assert.equal(card.lane, "Done");
  assert.equal(card.need.text, "Keep the old API?");
  assert.equal(card.need.handle, "yellow-bear-0072q");
  assert.match(card.pmAsk.text, /rotate the key/);
  assert.equal(card.reason, null);
  assert.deepEqual(pushesOf(story).map((p: any) => p.kind), ["done"]);
});

test("an open request stays on a Done braid with strands, from the braid and from a strand", () => {
  const done = braid("Done", [["A", "Done"], ["B", "Done"]]);
  const own = board(done, sigOf([open("0072", "question", "Braid's own?")])).braids[0];
  assert.deepEqual([own.lane, own.need.text, own.need.who], ["Done", "Braid's own?", null]);
  const strand = board(done, sigOf([open("0072/B", "question", "Strand's?")])).braids[0];
  assert.deepEqual([strand.lane, strand.need.text, strand.need.who], ["Done", "Strand's?", "0072/B"]);
  assert.equal(strand.strands[1].need.text, "Strand's?");
});

test("a Done strand of a live braid keeps its open request, without moving the braid or pushing", () => {
  const live = board(braid("In Progress", [["A", "Done"], ["B", "In Progress"]]), sigOf([open("0072/A", "question", "Still open?")]));
  const card = live.braids[0];
  assert.equal(card.lane, "In Progress");
  assert.equal(card.need.who, "0072/A");
  assert.equal(card.strands[0].need.text, "Still open?");
  assert.deepEqual(pushesOf(live), []);
});

test("the Done lane lists the braids that still ask first, then newest first", () => {
  const cards = [
    { id: "0003", doneAt: "2026-11-20T00:00:00Z", need: null, pmAsk: null },
    { id: "0001", doneAt: "2026-11-01T00:00:00Z", need: { text: "?" }, pmAsk: null },
    { id: "0002", doneAt: "2026-11-10T00:00:00Z", need: null, pmAsk: null },
  ];
  assert.deepEqual(model.doneNewestFirst(cards).map((c: any) => c.id), ["0001", "0003", "0002"]);
});

test("a need carries the request's handle; a q-code of four digits is taken as q-0123 or with its words, 0123 alone is an item", () => {
  const need = board(braid("In Progress"), sigOf([open("0072", "question", "Which?", { code: "q-0123" })])).braids[0].need;
  assert.deepEqual([need.code, need.handle], ["q-0123", "yellow-bear-0123"]);
  const w = world();
  for (const name of ["q-0123", "Q-0123.", "yellow bear 0123", "yellow-bear-0123"]) {
    const r = Rec.newRecord({ id: "0001", kind: "question", text: "x", at: new Date().toISOString(), thread: null, code: "q-0123", words: "yellow bear" });
    const { id, events, state: _state, eta, at: _at, ...file } = r;
    B.writeBranch(w.root, Rec.REQUESTS, () => ({ files: new Map([["requests/q-0123.json", `${JSON.stringify({ ...file, item: id, by: "coordinator", to: "user", eta, events }, null, 2)}\n`]]), message: "test: q-0123" }));
    assert.throws(() => Cmd.withdrawCommand(w.root, ["0123", "--why", "x"]), /0123/);
    assert.equal(Rec.loadRequests(w.root).length, 1, "0123 alone names no request");
    assert.match(Cmd.withdrawCommand(w.root, [name, "--why", "no"]), /^yellow-bear-0123 0001: withdrawn: no\n/, name);
  }
});

test("braid board --help says --no-pause also turns off the wake", () => {
  const help = boardHelp("1.0.0");
  assert.match(help, /^ {2}board /);
  assert.match(help, /--no-pause: .*turn off the wake/);
});
