// 0084/A: any number of requests stay open per item and asker. Each is answered by its name, an id alone is refused
// while several are open, `braid status` shows them all and `braid forward` takes the one it is told.
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { brief, git, load, statusCommand, world } from "./support/done-fixtures.ts";

/* eslint-disable @typescript-eslint/no-explicit-any */
const Rec: any = await load("../../dist/braids/requests.js");
const Cmd: any = await load("../../dist/commands/requests.js");

const PM = "11111111-aaaa-4bbb-8ccc-222222222222";
const handleIn = (out: string): string => /^(\S+)/.exec(out)?.[1] ?? assert.fail(`no handle in: ${out}`);
const open = (root: string): string[] => Rec.loadRequests(root).map(Rec.handleOf).sort();
const states = (root: string): string[] => Rec.loadRecord(root).requests.map((r: any) => r.state);

/** Asks three questions on `id`, then answers them one by one by name: the others stay open. */
async function threeQuestions(root: string, opts: object, id: string, extra: string[]): Promise<void> {
  const asked = ["One?", "Two?", "Three?"].map((text) => Cmd.askCommand(root, [id, text, ...extra], opts) as string);
  asked.forEach((out) => assert.doesNotMatch(out, /replacing/));
  const handles = asked.map(handleIn);
  assert.deepEqual(open(root), [...handles].sort());
  const list = (await Cmd.requestsCommand(root, [], opts)) as string;
  handles.forEach((handle) => assert.ok(list.includes(`${handle}  ${id}  question`), list));
  for (const [i, handle] of handles.entries()) {
    assert.match(Cmd.answerCommand(root, root, [handle, `answer ${i}`]), new RegExp(`^${handle} ${id}: answered by the user: answer ${i}\\n`));
    assert.deepEqual(open(root), handles.slice(i + 1).sort());
  }
}

test("three questions on one item stay open, each answered by its name", async () => {
  const w = world();
  await threeQuestions(w.root, w.opts, "0001/A", []);
});

test("the PM's questions on a braid and on a programme stay open the same way", async () => {
  const w = world();
  git(w.root, "branch", "pm/working-product");
  await threeQuestions(w.root, w.opts, "0001", ["--by", "pm", "--thread", PM]);
  await threeQuestions(w.root, w.opts, "pm/working-product", ["--thread", PM]);
});

test("two coordinators asking on one braid number keep both requests (q-um22 on 0084)", () => {
  const w = world();
  const plan = handleIn(Cmd.askCommand(w.root, ["0001", "Approve the plan?", "--kind", "plan", "--thread", "mcp:launch:first000001"], w.opts));
  const other = Cmd.askCommand(w.root, ["0001", "Which scope?", "--kind", "decision", "--thread", "mcp:launch:second00001"], w.opts) as string;
  assert.doesNotMatch(other, /replacing/);
  assert.deepEqual(open(w.root), [plan, handleIn(other)].sort());
  assert.deepEqual(states(w.root), ["open", "open"]);
});

test("answer and withdraw by id with several open list each name with its kind and change nothing", () => {
  const w = world();
  const ask = (...args: string[]) => handleIn(Cmd.askCommand(w.root, ["0001", ...args], w.opts));
  const question = ask("Which name?");
  const plan = ask("Plan ok?", "--kind", "plan");
  const timed = ask("CI is slow", "--to", "self", "--done-when", `time:${new Date(Date.now() + 3_600_000).toISOString()}`);
  const pm = ask("Ship it?", "--kind", "decision", "--by", "pm", "--thread", PM);
  const refusal = (e: Error): boolean => {
    assert.ok(e.message.startsWith("0001 has 4 open requests: "), e.message);
    for (const entry of [`${question} (the coordinator's question)`, `${plan} (the coordinator's plan)`, `${timed} (the coordinator's timed wait)`, `${pm} (the PM's decision)`]) {
      assert.ok(e.message.includes(entry), e.message);
    }
    // Only the PM has exactly one open, so `--by` can still pick it.
    return e.message.endsWith("; give the name, or --by coordinator|pm; nothing changed");
  };
  assert.throws(() => Cmd.answerCommand(w.root, w.root, ["0001"]), refusal);
  assert.throws(() => Cmd.withdrawCommand(w.root, ["0001", "--why", "x"]), refusal);
  assert.throws(() => Cmd.answerCommand(w.root, w.root, ["0001", "--by", "coordinator"]), /has 3 open requests: .*; give the name; nothing changed$/);
  assert.deepEqual(states(w.root), ["open", "open", "open", "open"]);
  assert.match(Cmd.answerCommand(w.root, w.root, ["0001", "--by", "pm"]), new RegExp(`^${pm} 0001: answered`));
});

test("braid status shows every open request of an item, one line each with its name", async () => {
  const w = world();
  const ask = (id: string, ...args: string[]) => handleIn(Cmd.askCommand(w.root, [id, ...args], w.opts));
  const lines = [
    [ask("0001/A", "Which name?"), "Which name?"],
    [ask("0001/A", "Which colour?"), "Which colour?"],
    [ask("0001/A", "Go on after 0002", "--to", "0002"), "waiting on braid 0002: Go on after 0002"],
    [ask("0001/A", "Ship it?", "--by", "pm", "--thread", PM), "The PM asks you: Ship it?"],
    [ask("0001/A", "Which port?", "--by", "pm", "--thread", PM), "The PM asks you: Which port?"],
    [ask("0001", "Approve?"), "Approve?"],
    [ask("0001", "And the rest?"), "And the rest?"],
  ] as const;
  const out = await statusCommand(w.root, ["0001"], w.opts);
  for (const [handle, text] of lines) {
    const own = out.split("\n").filter((line) => line.includes(`${handle}  `) && line.includes(text));
    assert.ok(own.length >= 1, `${handle} ${text} is missing:\n${out}`);
  }
  // The strand's requests are each listed once under the strand (the braid line may repeat the one it shows).
  const strand = out.slice(out.indexOf("0001/A  "));
  for (const [handle] of lines.slice(0, 5)) {
    assert.equal(strand.split(`${handle}  `).length - 1, 1, out);
  }
});

test("braid forward takes a request's name, and refuses an id with several to forward", () => {
  const w = world();
  writeFileSync(join(w.root, "braids/0001-alpha/brief.md"), brief("0001", "In Progress", `\n## Autonomy\n\nPM-run (thread ${PM}): security always ask.\n`));
  const ask = (text: string) => handleIn(Cmd.askCommand(w.root, ["0001", text, "--to", "pm"], w.opts));
  const first = ask("Which name?");
  const second = ask("Which colour?");
  assert.throws(() => Cmd.forwardCommand(w.root, ["0001"]), new RegExp(`0001 has 2 requests to forward: ${first} \\(the coordinator's question\\), ${second} \\(the coordinator's question\\); give the name; nothing changed`));
  const forwarded = (): boolean[] => Rec.loadRequests(w.root).map((r: any) => [Rec.handleOf(r), r.forwarded !== undefined]).sort().map(([, f]: [string, boolean]) => f);
  assert.deepEqual(forwarded(), [false, false]);
  assert.match(Cmd.forwardCommand(w.root, [second]), /^0001: question request forwarded to the user/);
  assert.deepEqual(Rec.loadRequests(w.root).filter((r: any) => r.forwarded !== undefined).map(Rec.handleOf), [second]);
  assert.match(Cmd.forwardCommand(w.root, [second]), /already the user's \(forwarded\); nothing changed/);
  // One left to forward: the id names it.
  assert.match(Cmd.forwardCommand(w.root, ["0001"]), /forwarded to the user/);
  assert.deepEqual(forwarded(), [true, true]);
});
