// A request the PM forwarded to the user, then answered: the asking thread gets one wake and the record its mark, from the
// board's page and from `braid answer`.
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { brief, load, world } from "./support/done-fixtures.ts";

/* eslint-disable @typescript-eslint/no-explicit-any */
const Cmd: any = await load("../../dist/commands/requests.js");
const Rec: any = await load("../../dist/braids/requests.js");
const Board: any = await load("../../dist/commands/board.js");
const { waker }: any = await load("../../dist/board/wake.js");

const ASKER = "coord-thread-1111";
const PM = "pm-thread-2222";
const good: any = { sig: { pauses: new Map() }, start: { main: "main", expected: null }, github: { status: { state: "ok" }, prs: new Map() }, t3: { states: new Map() } };

function forwarded() {
  const w = world();
  writeFileSync(join(w.root, "braids", "0001-alpha", "brief.md"), brief("0001", "In Progress", `\n## Autonomy\n\nPM-run (thread ${PM}): security always ask.\n`));
  const out = Cmd.askCommand(w.root, ["0001/A", "Which rounding rule?", "--thread", ASKER, "--to", "pm"], w.opts);
  Cmd.forwardCommand(w.root, ["0001/A", "--note", "your call"]);
  const code = `q-${/^[a-z]+-[a-z]+-([a-z0-9]{4,})\b/.exec(out)?.[1]}`;
  const sent: string[] = [];
  const t3 = (_root: string, args: readonly string[]) => {
    sent.push(args[2] as string);
    return Promise.resolve({ status: 0, stdout: "", stderr: "" });
  };
  const record = (): any => Rec.loadRecord(w.root).requests.find((r: any) => r.code === code);
  return { w, code, t3, sent, record };
}

test("forwarded, then answered on the board: one wake to the asker and the mark", async () => {
  const f = forwarded();
  await Board.answerAction(() => new Map(), f.w.root, (root: string, args: readonly string[]) => (args[1] === "show" ? Promise.resolve({ status: 0, stdout: "{}", stderr: "" }) : f.t3(root, args)))({ handle: f.code, text: "Half-up." });
  await waker(f.t3)({ root: f.w.root, good }, new Date(), () => {});
  assert.deepEqual(f.sent, [ASKER]);
  assert.ok(Rec.answerWoken(f.record()));
});

test("forwarded, then the user's answer recorded with braid answer: one wake to the asker and the mark", async () => {
  const f = forwarded();
  Cmd.answerCommand(f.w.root, f.w.root, [f.code, "Half-up."], f.w.opts);
  const wake = waker(f.t3);
  await wake({ root: f.w.root, good }, new Date(), () => {});
  await wake({ root: f.w.root, good }, new Date(), () => {});
  assert.deepEqual(f.sent, [ASKER]);
  assert.ok(Rec.answerWoken(f.record()));
});
