import assert from "node:assert/strict";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

interface Pr {
  number: number;
  failed?: string[];
}
interface Strand {
  id: string;
  lane: string;
  reason: string | null;
  running: boolean;
  pr: Pr | null;
}
interface Card extends Strand {
  strands: Strand[];
}
interface Marks {
  reasons: { kind: string; tooltip: string }[];
  review: string | null;
  running: boolean;
  done: boolean;
}

// Computed specifiers keep the compiled modules out of the typecheck, which runs before the build.
const load = (path: string) => import(pathToFileURL(fileURLToPath(new URL(path, import.meta.url))).href);
const model = (await load("../dist/board/model.js")) as { toBoard: (repo: string, braids: unknown[], gh: unknown, t3: unknown) => { braids: Card[] } };
const demo = (await load("../dist/board/demo.js")) as { demoBraids: () => unknown[]; demoGithub: () => unknown; demoT3: (down?: boolean) => unknown };
const marks = (await load("../dist/board/marks.js")) as {
  LANE_LABEL: Record<string, string>;
  strandMarks: (s: Strand) => Marks;
  cardMarks: (c: Card) => Marks;
};

const cards = model.toBoard("demo", demo.demoBraids(), demo.demoGithub(), demo.demoT3()).braids;
const card = (id: string): Card => cards.find((c) => c.id === id) as Card;
const strand = (id: string): Strand => cards.flatMap((c) => c.strands).find((s) => s.id === id) as Strand;

test("lanes show as To Do, Working, To Review, Needs You, Done", () => {
  assert.deepEqual(Object.values(marks.LANE_LABEL), ["To Do", "Working", "To Review", "Needs You", "Done"]);
});

test("strand rows carry the live lane, not the stored status", () => {
  // 0001/B is stored In Progress but its PR is open; 0002/B is stored In Progress but its checks fail.
  assert.equal(strand("0001/B").lane, "In Review");
  assert.equal(marks.LANE_LABEL[strand("0001/B").lane], "To Review");
  assert.equal(marks.LANE_LABEL[strand("0002/B").lane], "Needs You");
  assert.equal(marks.LANE_LABEL[strand("0002/A").lane], "Working");
  assert.equal(marks.LANE_LABEL[strand("0001/C").lane], "To Do");
  assert.equal(marks.LANE_LABEL[strand("0001/A").lane], "Done");
});

test("each Waiting reason has its icon and a hover text", () => {
  const kind = (id: string) => marks.strandMarks(strand(id)).reasons.map((r) => r.kind);
  assert.deepEqual(kind("0003/A"), ["question"]);
  assert.deepEqual(kind("0002/B"), ["checks"]);
  assert.deepEqual(kind("0004/A"), ["stopped"]);
  assert.deepEqual(kind("0003/B"), ["ask"]);
  assert.deepEqual(kind("0002/A"), []);
  assert.equal(marks.strandMarks(strand("0002/B")).reasons[0]?.tooltip, "Checks failed: verify (windows-latest)");
  assert.equal(marks.strandMarks(strand("0003/B")).reasons[0]?.tooltip, "Needs your decision: approve-layout");
});

test("the wrench marks running strands and cards", () => {
  assert.equal(marks.strandMarks(strand("0002/A")).running, true);
  assert.equal(marks.strandMarks(strand("0003/A")).running, true); // runs and asks a question
  assert.equal(marks.strandMarks(strand("0007/A")).running, true);
  assert.equal(marks.strandMarks(strand("0004/A")).running, false); // stopped
  assert.equal(marks.strandMarks(strand("0002/B")).running, false);
  assert.deepEqual(cards.filter((c) => marks.cardMarks(c).running).map((c) => c.id), ["0002", "0003", "0007"]);
});

test("the eye marks a strand with a PR to review, and its card once", () => {
  assert.equal(marks.strandMarks(strand("0001/B")).review, "PR #12 to review");
  assert.equal(marks.strandMarks(strand("0003/C")).review, "PR #17 to review");
  assert.equal(marks.strandMarks(strand("0002/B")).review, null); // an open PR, but waiting on checks
  assert.equal(marks.cardMarks(card("0001")).review, "PR #12 to review");
  // 0003 sits in Needs You and still shows it has something to review
  assert.equal(marks.LANE_LABEL[card("0003").lane], "Needs You");
  assert.equal(marks.cardMarks(card("0003")).review, "PR #17 to review");
});

test("a card shows each distinct reason once", () => {
  assert.deepEqual(marks.cardMarks(card("0003")).reasons.map((r) => r.kind), ["question", "ask"]);
  assert.deepEqual(marks.cardMarks(card("0002")).reasons.map((r) => r.kind), ["checks"]);
  assert.deepEqual(marks.cardMarks(card("0001")).reasons, []);
});

test("the tick marks Done strands only", () => {
  assert.equal(marks.strandMarks(strand("0001/A")).done, true);
  assert.equal(marks.strandMarks(strand("0008/A")).done, true);
  assert.equal(marks.strandMarks(strand("0001/B")).done, false);
});

test("without T3 no wrench shows", () => {
  const down = model.toBoard("demo", demo.demoBraids(), demo.demoGithub(), demo.demoT3(true)).braids;
  assert.equal(down.some((c) => marks.cardMarks(c).running), false);
});
