import assert from "node:assert/strict";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

interface Pr {
  number: number;
  failed?: string[];
}
interface Need {
  kind: string;
  text: string;
  verb: string;
  age: string | null;
  who: string | null;
  more: number;
}
interface Strand {
  id: string;
  lane: string;
  reason: string | null;
  need: Need | null;
  ask: string | null;
  running: boolean;
  activity: string | null;
  pr: Pr | null;
}
interface Card extends Strand {
  strands: Strand[];
}
interface Marks {
  reasons: { kind: string; tooltip: string }[];
  review: string | null;
  activities: { kind: string; tooltip: string }[];
  done: boolean;
}

// Computed specifiers keep the compiled modules out of the typecheck, which runs before the build.
const load = (path: string) => import(pathToFileURL(fileURLToPath(new URL(path, import.meta.url))).href);
const model = (await load("../dist/board/model.js")) as { toBoard: (repo: string, braids: unknown[], gh: unknown, t3: unknown, sig: unknown) => { braids: Card[] } };
const demo = (await load("../dist/board/demo.js")) as {
  demoBraids: () => unknown[];
  demoGithub: () => unknown;
  demoT3: (down?: boolean) => unknown;
  demoSignals: () => unknown;
};
const marks = (await load("../dist/board/marks.js")) as {
  LANE_LABEL: Record<string, string>;
  strandMarks: (s: Strand, details?: boolean) => Marks;
  cardMarks: (c: Card, details?: boolean) => Marks;
  ageText: (n: Need) => string;
  needLine: (n: Need) => string;
};

const cards = model.toBoard("demo", demo.demoBraids(), demo.demoGithub(), demo.demoT3(), demo.demoSignals()).braids;
const card = (id: string): Card => cards.find((c) => c.id === id) as Card;
const strand = (id: string): Strand => cards.flatMap((c) => c.strands).find((s) => s.id === id) as Strand;

test("lanes show as To Do, Working, To Review, Needs You, Done", () => {
  assert.deepEqual(Object.values(marks.LANE_LABEL), ["To Do", "Working", "To Review", "Needs You", "Done"]);
});

test("strand rows carry the live lane, not the stored status", () => {
  assert.equal(marks.LANE_LABEL[strand("0001/B").lane], "To Review"); // stored In Progress, a review request is open
  assert.equal(marks.LANE_LABEL[strand("0002/B").lane], "Needs You"); // red checks, no agent, for 14 min
  assert.equal(marks.LANE_LABEL[strand("0002/A").lane], "Working");
  assert.equal(marks.LANE_LABEL[strand("0001/C").lane], "To Do");
  assert.equal(marks.LANE_LABEL[strand("0001/A").lane], "Done");
  assert.equal(marks.LANE_LABEL[strand("0005/A").lane], "Working"); // an open PR with checks pending, nobody asked
});

test("each reason has its icon and a hover text", () => {
  const kind = (id: string) => marks.strandMarks(strand(id)).reasons.map((r) => r.kind);
  assert.deepEqual(kind("0003/A"), ["question"]); // the agent's pending question
  assert.deepEqual(kind("0004/B"), ["question"]); // a question request
  assert.deepEqual(kind("0002/B"), ["checks"]);
  assert.deepEqual(kind("0004/A"), ["stalled"]);
  assert.deepEqual(kind("0003/B"), ["ask"]); // a decision request; the ask label adds no second flag
  assert.deepEqual(kind("0002/A"), []);
  assert.equal(marks.strandMarks(strand("0002/B")).reasons[0]?.tooltip, "Checks failed: verify (windows-latest)");
  assert.equal(marks.strandMarks(strand("0003/B")).reasons[0]?.tooltip, "Decision needed: approve-layout");
  assert.equal(marks.strandMarks(strand("0004/A")).reasons[0]?.tooltip, "Stalled: nobody is working and nothing was asked");
  assert.deepEqual(marks.cardMarks(card("0007")).reasons.map((r) => r.kind), ["plan"]);
  assert.equal(marks.cardMarks(card("0007")).reasons[0]?.tooltip, "Plan approval needed");
});

test("an ask label without a request is only a flag; it never moves the lane", () => {
  const label = { ...strand("0002/A"), ask: "approve-ui" };
  assert.deepEqual(marks.strandMarks(label).reasons, [{ kind: "ask", tooltip: "Will need your decision: approve-ui" }]);
});

test("the request line carries its text, age and strand", () => {
  const need = strand("0004/B").need as Need;
  assert.equal(need.text, "Which rounding rule should refunds use, half-up or banker's?");
  assert.equal(marks.ageText(need), "asked 35 min ago");
  assert.equal(marks.ageText(strand("0002/B").need as Need), "for 14 min");
  assert.equal(marks.ageText(strand("0001/B").need as Need), "asked 2 h ago");
  assert.equal(strand("0001/B").need?.text, "Merge PR #12");
  const top = card("0003").need as Need;
  assert.deepEqual([top.who, top.more], ["0003/A", 2]);
  assert.equal(marks.needLine(top), "An agent asked a question: answer it in its thread (strand 0003/A)");
  const own = card("0007").need as Need;
  assert.deepEqual([own.who, own.text], [null, "Approve the plan: 3 strands, A to C"]);
  assert.equal(marks.needLine(own), "Approve the plan: 3 strands, A to C (asked 20 min ago)");
});

test("with Details off the text moves into the icon's tooltip", () => {
  assert.equal(marks.cardMarks(card("0004"), false).reasons[0]?.tooltip, "Stalled: nobody is working and nothing was asked — strand 0004/A · for 25 min (+1 more in strands)");
  assert.equal(marks.cardMarks(card("0007"), false).reasons[0]?.tooltip, "Approve the plan: 3 strands, A to C — braid, no strand involved · asked 20 min ago");
  assert.equal(marks.strandMarks(strand("0004/B"), false).reasons[0]?.tooltip, "Which rounding rule should refunds use, half-up or banker's? — asked 35 min ago");
  assert.equal(marks.cardMarks(card("0001"), false).review, "Merge PR #12 — strand 0001/B · asked 2 h ago");
});

test("the activity icon says whether an agent, a review or only CI runs", () => {
  const kinds = (c: Card) => marks.cardMarks(c).activities.map((a) => a.kind);
  assert.deepEqual(marks.strandMarks(strand("0002/A")).activities, [{ kind: "agent", tooltip: "agent running" }]);
  assert.deepEqual(marks.strandMarks(strand("0010/A")).activities, [{ kind: "review", tooltip: "review running" }]);
  assert.deepEqual(marks.strandMarks(strand("0005/A")).activities, [{ kind: "checks", tooltip: "checks running" }]);
  assert.deepEqual(marks.strandMarks(strand("0002/B")).activities, []);
  assert.deepEqual([kinds(card("0009")), kinds(card("0010")), kinds(card("0005"))], [["agent"], ["review"], ["checks"]]);
  // a card on the user's side carries only its one icon
  assert.deepEqual(kinds(card("0002")), []);
});

test("the eye marks a strand to review, and a card on the user's side once", () => {
  assert.equal(marks.strandMarks(strand("0001/B")).review, "PR #12 to review");
  assert.equal(marks.strandMarks(strand("0003/C")).review, "PR #17 to review");
  assert.equal(marks.strandMarks(strand("0002/B")).review, null);
  assert.equal(marks.cardMarks(card("0001")).review, "PR #12 to review");
  // 0003 needs you first (a question); its card carries that icon, not the eye
  assert.equal(marks.LANE_LABEL[card("0003").lane], "Needs You");
  assert.deepEqual([marks.cardMarks(card("0003")).review, marks.cardMarks(card("0003")).reasons.map((r) => r.kind)], [null, ["question"]]);
});

test("a braid shows the most urgent of its strands and its own request", () => {
  assert.deepEqual(cards.map((c) => [c.id, marks.LANE_LABEL[c.lane]]), [
    ["0001", "To Review"],
    ["0002", "Needs You"],
    ["0003", "Needs You"],
    ["0004", "Needs You"],
    ["0005", "Working"],
    ["0006", "Needs You"], // its strand is Done; the braid's own decision request is open
    ["0007", "Needs You"], // every strand To Do; the plan waits for approval
    ["0008", "Done"],
    ["0009", "Working"],
    ["0010", "Working"],
    ["0011", "To Do"],
    ["0012", "To Do"],
    ["0013", "To Do"],
  ]);
});

test("the tick marks Done strands only", () => {
  assert.equal(marks.strandMarks(strand("0001/A")).done, true);
  assert.equal(marks.strandMarks(strand("0008/A")).done, true);
  assert.equal(marks.strandMarks(strand("0001/B")).done, false);
});

test("without T3 no agent shows and no alarm can be told", () => {
  const down = model.toBoard("demo", demo.demoBraids(), demo.demoGithub(), demo.demoT3(true), demo.demoSignals()).braids;
  assert.equal(down.some((c) => marks.cardMarks(c).activities.some((a) => a.kind !== "checks")), false);
});

test("the tick marks Done cards too", () => {
  assert.equal(marks.cardMarks(card("0008")).done, true);
  assert.equal(marks.cardMarks(card("0001")).done, false);
});
