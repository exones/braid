import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { git, load, world } from "./support/done-fixtures.ts";

// 0072/H: a wait closed by hand reads met (or is refused), never "answered by the user", and is nobody's decision.

type Cmd = (root: string, args: string[], opts?: object) => string;
const R = (await load("../../dist/commands/requests.js")) as {
  askCommand: Cmd;
  answerCommand: (root: string, cwd: string, args: string[], opts?: object) => string;
};
const { decisionsCommand } = (await load("../../dist/commands/decisions.js")) as { decisionsCommand: (root: string, args: string[]) => string };
const Rec = (await load("../../dist/braids/requests.js")) as {
  loadRecord: (root: string) => { requests: { code: string; state: string; events: { event: string; by: string; text?: string }[] }[] };
  endRequest: (root: string, code: string, end: object) => unknown;
};
const { readSignals } = (await load("../../dist/board/signals.js")) as { readSignals: (root: string, github: object) => object };
const view = (await load("../../dist/board/record.js")) as { requestsOf: (match: () => boolean, sig: object, t3: object) => { decided: { code: string }[]; closed: { code: string }[] } };

const codeOf = (out: string): string => `q-${/^(?:[a-z]+-[a-z]+-|q-)([a-z0-9]{4,})\b/.exec(out)?.[1] ?? assert.fail(`no code in: ${out}`)}`;
const record = (root: string, code: string) => Rec.loadRecord(root).requests.find((r) => r.code === code) ?? assert.fail(`no ${code}`);
const tip = (root: string) => git(root, "rev-parse", "refs/heads/braid-requests");
const file = (root: string, text: string): string => {
  const path = join(dirname(root), "answer.txt");
  writeFileSync(path, text);
  return path;
};

test("an answer on a met wait records met by the coordinator, with the condition's text", () => {
  const w = world();
  const pr = codeOf(R.askCommand(w.root, ["0001", "Wait for PR 5", "--to", "0002", "--done-when", "pr:5"]));
  const timed = codeOf(R.askCommand(w.root, ["0002", "Sleep a while", "--to", "self", "--done-when", "time:2026-11-23T11:00:00Z"]));
  w.prs[0]!.state = "MERGED";
  assert.match(R.answerCommand(w.root, w.root, [pr, "--file", file(w.root, "It landed.")], { gh: w.opts.gh }), /0001: met: PR #5 merged \(the board sends no wake for a wait closed by hand; your text isn't recorded\)\n$/);
  assert.match(R.answerCommand(w.root, w.root, [timed], { now: () => new Date("2026-11-23T12:00:00Z") }), /0002: met: time 2026-11-23T11:00:00\.000Z reached \(the board sends no wake for a wait closed by hand\)\n$/);
  for (const [code, text] of [[pr, "PR #5 merged"], [timed, "time 2026-11-23T11:00:00.000Z reached"]] as const) {
    const r = record(w.root, code);
    assert.deepEqual([r.state, r.events.at(-1)?.event, r.events.at(-1)?.by, r.events.at(-1)?.text], ["met", "met", "coordinator", text]);
  }
  assert.throws(() => R.answerCommand(w.root, w.root, [pr]), /is already met by the coordinator/);
});

test("an answer on an unmet wait, or with --from, is refused and nothing is written", () => {
  const w = world();
  const code = codeOf(R.askCommand(w.root, ["0001", "Go on after 0002", "--to", "0002", "--done-when", "braid:2"]));
  const pr = codeOf(R.askCommand(w.root, ["0002", "Wait for PR 5", "--to", "0001", "--done-when", "pr:5"]));
  const before = tip(w.root);
  assert.throws(() => R.answerCommand(w.root, w.root, [code], { gh: w.opts.gh }), /is a wait and its condition \(done when braid:0002\) doesn't hold now\. A wait ends when its condition holds \(the board closes it and wakes the asker\); `braid withdraw \S+ --why <reason>` ends one no longer needed; nothing changed/);
  // A PR closed unmerged is not a condition that holds.
  w.prs[0]!.state = "CLOSED";
  assert.throws(() => R.answerCommand(w.root, w.root, [pr], { gh: w.opts.gh }), /doesn't hold now/);
  for (const from of [["--from", "user"], ["--from", "pm", "--reason", "x"]]) {
    assert.throws(() => R.answerCommand(w.root, w.root, [code, ...from]), /is a wait, which asks neither the user nor the PM: drop --from; nothing changed/);
  }
  assert.equal(tip(w.root), before, "no write");
});

test("a wait with no condition is answered by the coordinator; a wait answered before this change is no decision", () => {
  const w = world();
  const open = codeOf(R.askCommand(w.root, ["0001", "Does 0002 rename the flag?", "--to", "0002"]));
  assert.match(R.answerCommand(w.root, w.root, [open, "--file", file(w.root, "No.")]), /0001: answered by the coordinator: No\.\n$/);
  // As older braid versions wrote it.
  const old = codeOf(R.askCommand(w.root, ["0001", "Go on after 0002", "--to", "0002", "--done-when", "braid:0002"]));
  Rec.endRequest(w.root, old, { state: "answered", who: "user" });
  const question = codeOf(R.askCommand(w.root, ["0001", "Half-up?"]));
  R.answerCommand(w.root, w.root, [question]);
  const sig = readSignals(w.root, { status: { state: "unavailable", reason: "test" }, prs: new Map() });
  const tab = view.requestsOf(() => true, sig, { status: { state: "unavailable", reason: "test" } });
  assert.deepEqual(tab.decided.map((r) => r.code), [question]);
  assert.deepEqual(tab.closed.map((r) => r.code).sort(), [open, old].sort(), "waits stay listed, as closed");
  const decisions = decisionsCommand(w.root, ["0001"]);
  assert.match(decisions, new RegExp(`-${question.slice(2)} answered by the user`));
  assert.ok(!decisions.includes(old.slice(2)) && !decisions.includes(open.slice(2)), decisions);
});
