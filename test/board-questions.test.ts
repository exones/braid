import assert from "node:assert/strict";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

// The Questions panel's model (0082/E): one ranked list of the open requests that reach the user, and Decided.
const load = (path: string) => import(pathToFileURL(fileURLToPath(new URL(path, import.meta.url))).href);
/* eslint-disable @typescript-eslint/no-explicit-any */
const model: any = await load("../dist/board/model.js");
const list: any = await load("../dist/board/question-list.js");
const signals: any = await load("../dist/board/signals.js");
const plans: any = await load("../dist/board/plans.js");
const combined: any = await load("../dist/board/combined.js");
const { newRecord }: any = await load("../dist/braids/requests.js");

const NOW = new Date("2026-11-27T12:00:00Z");
const ago = (minutes: number) => new Date(NOW.getTime() - minutes * 60_000).toISOString();
let n = 0;
const req = (id: string, kind: string, minutes: number, extra: object = {}): any => newRecord({ id, kind, text: `a ${kind} on ${id}`, at: ago(minutes), thread: null, code: `q-t${String((n += 1)).padStart(3, "0")}`, ...extra });
const ended = (r: any, by: string, text: string, minutes: number, reason?: string): any => ({ ...r, state: "answered", events: [...r.events, { event: "answered", at: ago(minutes), by, text, ...(reason === undefined ? {} : { reason }) }] });

const item = (id: string, title: string, status: string, dependencies: string[] = []) => ({ id, title, status, labels: [], dependencies, order: null, delivery: null, body: "" });
const braid = (number: string, status: string, strands: [string, string, string[]?][] = []): any => ({
  logs: [],
  hasReport: false,
  number,
  folder: `braids/${number}-a`,
  brief: item(number, `Braid ${number}`, status),
  strands: strands.map(([letter, state, deps]) => ({ letter, folder: `braids/${number}-a/${letter}`, logs: [], hasReport: false, brief: item(`${number}/${letter}`, `Strand ${letter}`, state, deps ?? []) })),
});
const BRAIDS = [
  // 0001: B and C wait for A; D stands alone.
  braid("0001", "In Progress", [["A", "In Progress"], ["B", "To Do", ["0001/A"]], ["C", "To Do", ["0001/A"]], ["D", "In Progress"]]),
  // 0002: E and F wait for D; so D blocks three, A (below) two.
  braid("0002", "In Progress", [["A", "In Progress"], ["B", "To Do", ["0002/A"]], ["D", "In Progress"], ["E", "To Do", ["0002/D"]], ["F", "To Do", ["0002/D"]], ["G", "In Progress"]]),
  braid("0003", "In Progress"),
  braid("0004", "Done", [["A", "Done"]]),
  braid("0005", "In Progress", [["A", "Done"], ["B", "In Progress"], ["C", "In Progress"]]),
];
const PLAN = plans.planOf("shop", "pm/shop", "---\nprogramme: shop\ntitle: Shop\ngoal: g\nstate: running\nrows:\n  - P1 | 0003 | Three | running\n---\n");

const gh: any = { status: { state: "ok" }, prs: new Map([["0003", { number: 7, url: "https://example.test/7", state: "open", checks: "passing", base: "main", branch: "b", head: "a".repeat(40) }]]) };
const t3: any = { status: { state: "ok" }, threads: new Map(), states: new Map([["pm", "idle"]]), links: new Map() };

function board(open: any[], more: { closed?: any[]; waits?: any[] } = {}): any {
  const mine = open.filter((r) => !r.id.startsWith("pm/"));
  const sig = {
    now: NOW,
    requests: new Map(mine.filter((r) => r.by !== "pm").map((r) => [r.id, r])),
    asks: new Map(mine.filter((r) => r.by === "pm").map((r) => [r.id, r])),
    programmes: open.filter((r) => r.id.startsWith("pm/")),
    plans: [PLAN],
    closed: more.closed ?? [],
    waits: more.waits ?? [],
    alarm: signals.brokeClock({}, NOW).alarm,
  };
  return model.toBoard("agento", BRAIDS, gh, t3, sig);
}

test("every rank, in order; the oldest first inside a rank; more blocked first among several", () => {
  const b = board([
    req("0001/D", "question", 5),
    req("0002/G", "question", 40),
    req("0001/A", "decision", 50),
    req("0002/D", "decision", 2),
    req("0002/A", "question", 90),
    req("pm/shop", "decision", 10, { by: "pm" }),
    req("0001", "plan", 30),
    req("0005/B", "question", 25, { to: "pm", pm: "pm" }),
    req("0004/A", "question", 600),
    req("0005/C", "look", 700),
  ]);
  assert.deepEqual(
    b.questions.map((q: any) => [q.rank, q.id]),
    [
      ["escalated", "0005/B"],
      ["stops", "0001"],
      ["stops", "pm/shop"],
      ["several", "0001/A"],
      ["several", "0002/D"],
      ["several", "0002/A"],
      ["one", "0002/G"],
      ["one", "0001/D"],
      ["none", "0004/A"],
      ["look", "0005/C"],
    ],
  );
  const [escalated, , programme] = b.questions;
  assert.match(escalated.escalated, /^The PM hasn't answered for 25 min/);
  assert.deepEqual([programme.programme, programme.who, programme.blocks], ["shop", "PM of shop", []]);
  const { ranked, looks } = list.splitQuestions(b.questions);
  assert.deepEqual([ranked.length, looks.map((q: any) => q.id)], [9, ["0005/C"]], "the rail counts the ranked ones: looks are folded");
});

test("a request the PM is still handling, and a wait, aren't listed; the PM's own is", () => {
  const b = board([req("0001/D", "question", 3, { to: "pm", pm: "pm" }), req("0003", "action", 4, { by: "pm", thread: "pm" })], { waits: [req("0002/A", "question", 9, { to: "0001" })] });
  assert.deepEqual(b.questions.map((q: any) => [q.id, q.act, q.who]), [["0003", "do", "PM of shop, for 0003 Braid 0003"]]);
});

test("a question that is the last thing open in its braid stops it", () => {
  const b = board([req("0003", "question", 5)]);
  assert.equal(b.questions[0].rank, "stops");
});

test("a PR waiting for the user's merge is ranked, with its PR link and Merge; context and options come along", () => {
  const b = board([
    req("0003", "review", 50, { pr: 7, head: "a".repeat(40), thread: "coordinator" }),
    req("0002/G", "question", 5, { context: "Why", options: ["Yes", "No"] }),
  ]);
  const [review, question] = b.questions;
  assert.deepEqual([review.text, review.act, review.pr, review.merge.pr, review.merge.reason], ["Merge PR #7: Braid 0003", "merge", { number: 7, url: "https://example.test/7" }, 7, null]);
  assert.deepEqual([question.context, question.options, question.who, question.blocks], ["Why", ["Yes", "No"], "coordinator of 0002 Braid 0002", ["0002/G"]]);
});

test("a strand's own request is listed under a braid whose card shows another; a Done strand's too", () => {
  const b = board([req("0005", "question", 5), req("0005/B", "question", 15), req("0005/A", "question", 20), req("0005/B", "action", 4, { by: "pm", thread: "pm" })]);
  assert.deepEqual(b.questions.map((q: any) => q.id).sort(), ["0005", "0005/A", "0005/B", "0005/B"]);
  const card = b.braids.find((c: any) => c.id === "0005");
  assert.deepEqual(model.doneAsks(card).map((s: any) => s.id), ["0005/A"], "the Done strand's line shows on the compact card with Details off");
  assert.deepEqual(model.doneAsks(b.braids.find((c: any) => c.id === "0001")), []);
});

test("Decided lists the answered requests of braids and programmes, newest first, with who and why; waits are left out", () => {
  const b = board([], {
    closed: [
      ended(req("0001/D", "question", 100), "user", "half-up", 90),
      ended(req("pm/shop", "decision", 80, { by: "pm" }), "user", "A. export first", 40),
      ended(req("0003", "question", 70), "pm", "no", 60, "the goal says so"),
      ended(req("0002/A", "question", 50, { to: "0001" }), "coordinator", "yes", 5),
      ended(req("0002/A", "question", 50, { to: "0001" }), "user", "yes", 4),
      { ...req("0001/A", "question", 30), state: "withdrawn" },
    ],
  });
  assert.deepEqual(
    b.decided.map((d: any) => [d.id, d.by, d.answer, d.reason, d.programme, d.who]),
    [
      ["pm/shop", "user", "A. export first", null, "shop", "PM of shop"],
      ["0003", "pm", "no", "the goal says so", null, "coordinator of 0003 Braid 0003"],
      ["0001/D", "user", "half-up", null, null, "coordinator of 0001 Braid 0001"],
    ],
  );
});

test("the combined board ranks the questions of every project together and tags each with its project", () => {
  const one = board([req("0002/G", "question", 5)], { closed: [ended(req("0001/D", "question", 100), "user", "a", 90)] });
  const two = board([req("0003", "question", 4)], { closed: [ended(req("0001/D", "question", 100), "user", "b", 10)] });
  const held = (name: string, b: any) => ({ name, repo: name, board: b, readAt: NOW.getTime(), failure: null, problems: [] });
  const all = combined.combine([held("x", one), held("y", two)], false);
  assert.deepEqual(all.questions.map((q: any) => [q.project, q.rank]), [["y", "stops"], ["x", "one"]]);
  assert.deepEqual(all.decided.map((d: any) => d.answer), ["b", "a"]);
});

test("after an answer the next question opens", () => {
  assert.equal(list.nextAfter(["a", "b", "c"], "b"), "c");
  assert.equal(list.nextAfter(["a", "b"], "b"), "a");
  assert.equal(list.nextAfter(["a"], "a"), null);
});
