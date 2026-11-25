// 0072/A: a request says what answering it unblocks and whether to decide, do or merge; a code in any letter case is found.
import assert from "node:assert/strict";
import { test } from "node:test";
import { load, world } from "./support/done-fixtures.ts";

/* eslint-disable @typescript-eslint/no-explicit-any */
const Rec: any = await load("../../dist/braids/requests.js");
const Cmd: any = await load("../../dist/commands/requests.js");
const { answerCommand, askCommand, etaCommand, requestsCommand, withdrawCommand } = Cmd;

const item = (status: string, dependencies: string[] = []) => ({ status, dependencies });
const strand = (letter: string, status: string, dependencies: string[] = []) => ({ letter, brief: item(status, dependencies) });
const braids = [
  { number: "0010", brief: item("In Progress"), strands: [strand("A", "In Progress"), strand("B", "To Do", ["0010/A"]), strand("C", "To Do", ["0010/B"]), strand("D", "Done", ["0010/A"]), strand("E", "To Do")] },
  { number: "0011", brief: item("To Do", ["0010/C"]), strands: [] },
  { number: "0012", brief: item("To Do"), strands: [] },
  { number: "0013", brief: item("Done"), strands: [] },
];
const req = (code: string, id: string, extra: object = {}) => ({ code, id, doneWhen: "answered", state: "open", ...extra });

test("a strand's request unblocks itself and its dependents, directly or not, but not a Done one", () => {
  assert.deepEqual(Rec.unblocksOf(req("q-aaaa", "0010/A"), braids, []), ["0010/A", "0010/B", "0010/C", "0011"]);
});

test("a request on a braid with strands unblocks its strands not Done; a story's request, the story", () => {
  assert.deepEqual(Rec.unblocksOf(req("q-aaaa", "0010"), braids, []), ["0010/A", "0010/B", "0010/C", "0010/E", "0011"]);
  assert.deepEqual(Rec.unblocksOf(req("q-aaaa", "0012"), braids, []), ["0012"]);
  assert.deepEqual(Rec.unblocksOf(req("q-aaaa", "0013"), braids, []), []);
  assert.deepEqual(Rec.unblocksOf(req("q-aaaa", "pm/slug"), braids, []), []);
});

test("a braid with an open wait on the request's braid is unblocked; a Done, closed or own one is not; no duplicates", () => {
  const waits = [
    req("q-bbbb", "0012", { to: "0010" }),
    req("q-cccc", "0012", { doneWhen: "braid:0010" }),
    req("q-dddd", "0013", { to: "0010" }),
    req("q-eeee", "0011/A", { to: "0010", state: "answered" }),
    req("q-ffff", "0010/E", { to: "0010" }),
  ];
  assert.deepEqual(Rec.unblocksOf(req("q-aaaa", "0010/E"), braids, waits), ["0010/E", "0012"]);
});

test("an act word per kind", () => {
  assert.deepEqual(["action", "review", "question", "decision", "plan"].map(Rec.actOf), ["do", "merge", "decide", "decide", "decide"]);
});

test("braid ask and braid requests say what the request blocks and decide, do or merge", async () => {
  const w = world();
  const first = askCommand(w.root, ["0001/A", "Which name?", "--kind", "decision"]);
  assert.match(first, /^[a-z]+-[a-z]+-[a-z0-9]{4} 0001\/A: decision request opened: Which name\?\nblocks 0001\/A · decide\n/);
  const code = /^(?:[a-z]+-[a-z]+-|q-)([a-z0-9]{4})/.exec(first)?.[1] ?? "";
  // A coordinator may ask the user to do something outside braid.
  assert.match(askCommand(w.root, ["0002", "Add secret X", "--kind", "action"]), /action request opened: Add secret X\nblocks 0002 · do\n/);
  const list = (await requestsCommand(w.root, [], { gh: w.opts.gh })) as string;
  assert.match(list, new RegExp(`^${code} {2}0001/A {2}decision {2}\\d+m {2}blocks 0001/A · decide {2}Which name\\?$`, "m"));
  assert.match(list, /^[a-z]+-[a-z]+-[a-z0-9]{4} {2}0002 {2}action {2}\d+m {2}blocks 0002 · do {2}Add secret X$/m);
  const one = (await requestsCommand(w.root, [code.toUpperCase()], { gh: w.opts.gh })) as string;
  assert.match(one, new RegExp(`^${code} {2}0001/A {2}decision {2}open {2}blocks 0001/A · decide\\n`));
});

test("a request code in any letter case is found, and a malformed one is refused as not a request code", async () => {
  const w = world();
  const code = /^(?:[a-z]+-[a-z]+-|q-)([a-z0-9]{4})/.exec(askCommand(w.root, ["0001/A", "Which name?"]))?.[1] ?? "";
  const upper = code.toUpperCase();
  assert.match(etaCommand(w.root, [upper, "2h"]), new RegExp(`^${code} `));
  assert.match((await requestsCommand(w.root, [upper], { gh: w.opts.gh })) as string, new RegExp(`^${code} `));
  assert.match(answerCommand(w.root, w.root, [upper, "--log", "-"].slice(0, 1)), new RegExp(`^${code} 0001/A: answered`));
  const again = askCommand(w.root, ["0001/A", "Another?"]);
  const second = /^(?:[a-z]+-[a-z]+-|q-)([a-z0-9]{4})/.exec(again)?.[1] ?? "";
  assert.match(withdrawCommand(w.root, [second.toUpperCase(), "--why", "no"]), new RegExp(`^${second} 0001/A: withdrawn`));
  for (const bad of ["Q-!!", "q-ab", "Q-"]) {
    assert.throws(() => answerCommand(w.root, w.root, [bad]), /is not a request code/);
    assert.throws(() => withdrawCommand(w.root, [bad, "--why", "x"]), /is not a request code/);
    assert.throws(() => etaCommand(w.root, [bad, "2h"]), /is not a request code/);
    await assert.rejects(async () => requestsCommand(w.root, [bad], { gh: w.opts.gh }), /is not a request code/);
  }
});

test("braid ask reads Done from a merged PR, as braid requests does, and still asks when GitHub can't be read", async () => {
  const { resetGithubMemory }: any = await load("../../dist/board/github.js");
  const w = world();
  resetGithubMemory();
  assert.match(askCommand(w.root, ["0001/A", "Open one", "--kind", "decision"], { gh: w.opts.gh }), /\nblocks 0001\/A · decide\n/);
  (w.prs[0] as { state: string }).state = "MERGED";
  resetGithubMemory();
  const merged = askCommand(w.root, ["0001/A", "After the merge", "--kind", "decision", "--by", "pm"], { gh: w.opts.gh });
  assert.match(merged, /\ndecide\n/);
  assert.doesNotMatch(merged, /blocks/);
  assert.match((await requestsCommand(w.root, [], { gh: w.opts.gh })) as string, /0001\/A {2}decision {2}\d+m {2}decide {2}from the PM {2}After the merge/);
  resetGithubMemory();
  assert.match(askCommand(w.root, ["0002", "No GitHub", "--kind", "decision"], { gh: () => ({ status: 1, stdout: "", stderr: "down" }) }), /\nblocks 0002 · decide\n/);
});
