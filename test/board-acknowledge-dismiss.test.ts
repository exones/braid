// 0084/C: Acknowledge (a look or an FYI, seen: nobody woken) and Dismiss (any request, no answer: the asker told once), from
// `braid answer` and the board's page, both under Decided; and several open questions on one item: the card's count, a push
// each, a programme's several, a handover beside a question.
import assert from "node:assert/strict";
import { test } from "node:test";
import { load, world } from "./support/done-fixtures.ts";

/* eslint-disable @typescript-eslint/no-explicit-any */
const Cmd: any = await load("../../dist/commands/requests.js");
const Rec: any = await load("../../dist/braids/requests.js");
const Board: any = await load("../../dist/commands/board.js");
const model: any = await load("../../dist/board/model.js");
const marks: any = await load("../../dist/board/marks.js");
const plans: any = await load("../../dist/board/plans.js");
const message: any = await load("../../dist/notify/message.js");
const demo: any = await load("../../dist/board/demo.js");
const { waker }: any = await load("../../dist/board/wake.js");

const ASKER = "33333333-aaaa-4bbb-8ccc-444444444444";
const PM = "11111111-aaaa-4bbb-8ccc-222222222222";
const NOW = new Date("2026-11-28T12:00:00.000Z");
const codeOf = (out: string): string => `q-${/^(?:[a-z]+-[a-z]+-|q-)([a-z0-9]{4,})\b/.exec(out)?.[1] ?? assert.fail(`no code in: ${out}`)}`;
const recordOf = (root: string, code: string): any => Rec.loadRecord(root).requests.find((r: any) => r.code === code);
const nameOf = (root: string, code: string): string => Rec.handleOf(recordOf(root, code));
const ask = (w: any, id: string, text: string, ...more: string[]): string => codeOf(Cmd.askCommand(w.root, [id, text, "--thread", ASKER, ...more], w.opts));

function sender() {
  const sent: { thread: string; text: string }[] = [];
  const t3 = (_root: string, args: readonly string[]) => {
    sent.push({ thread: args[2] as string, text: args[3] as string });
    return Promise.resolve({ status: 0, stdout: "", stderr: "" });
  };
  return { t3, sent };
}
const good = (): any => ({ sig: { pauses: new Map() }, start: { main: "main", expected: null }, github: { status: { state: "ok" }, prs: new Map() }, t3: { states: new Map() } });
const warn = () => {};
const reads = () => new Map([[ASKER, "completed"]]);
/** The waker's next two refreshes. */
async function refreshes(root: string, t3: any): Promise<void> {
  const wake = waker(t3);
  await wake({ root, good: good() }, new Date(), warn);
  await wake({ root, good: good() }, new Date(), warn);
}

test("braid answer --ack closes a look as the user's, wakes no one; any other kind is refused", async () => {
  const w = world();
  const look = ask(w, "0001", "FYI: the export runs nightly", "--kind", "look");
  const question = ask(w, "0001", "Which name?");
  assert.throws(() => Cmd.answerCommand(w.root, w.root, [question, "--ack"], w.opts), /only a look or an FYI is acknowledged; .* is a question.*nothing changed/);
  assert.equal(recordOf(w.root, question).state, "open");
  assert.throws(() => Cmd.answerCommand(w.root, w.root, [look, "ok", "--ack"], w.opts), /carries no answer/);
  assert.throws(() => Cmd.answerCommand(w.root, w.root, [look, "--ack", "--dismiss"], w.opts), /not both/);
  assert.match(Cmd.answerCommand(w.root, w.root, [look, "--ack"], w.opts), /0001: acknowledged by the user/);
  const r = recordOf(w.root, look);
  assert.deepEqual([r.state, Rec.closing(r).by, Rec.closing(r).text, Rec.answerWoken(r), Rec.outcomeOf(r)], ["answered", "user", "Acknowledged", true, "acknowledged"]);
  const s = sender();
  await refreshes(w.root, s.t3);
  assert.deepEqual(s.sent, []);
});

test("braid answer --dismiss withdraws any request as the user's; the board tells the asking thread once", async () => {
  const w = world();
  const code = ask(w, "0001", "Which name?");
  const other = ask(w, "0001", "Which colour?");
  assert.match(Cmd.answerCommand(w.root, w.root, [code, "--dismiss"], w.opts), /0001: dismissed by the user/);
  const r = recordOf(w.root, code);
  assert.deepEqual([r.state, Rec.closing(r).by, Rec.closing(r).text, Rec.outcomeOf(r)], ["withdrawn", "user", "dismissed by the user without an answer", "dismissed"]);
  assert.equal(recordOf(w.root, other).state, "open", "the other question stays");
  const s = sender();
  await refreshes(w.root, s.t3);
  assert.deepEqual(s.sent, [{ thread: ASKER, text: `Wake: ${nameOf(w.root, code)} dismissed by the user without an answer; if you still need it, ask again with what changed.` }]);
  assert.ok(Rec.answerWoken(recordOf(w.root, code)));
  const withdrawn = ask(w, "0002", "Mine to withdraw?");
  Cmd.withdrawCommand(w.root, [withdrawn, "--why", "no longer needed"]);
  await refreshes(w.root, s.t3);
  assert.equal(s.sent.length, 1, "the asker's own withdrawal wakes nobody");
  assert.equal(Rec.outcomeOf(recordOf(w.root, withdrawn)), null);
});

test("the board's answer action acknowledges and dismisses: a dismissal wakes at once, an acknowledgement never", async () => {
  const w = world();
  const look = ask(w, "0001", "FYI: live on the test site", "--kind", "look");
  const question = ask(w, "0001", "Which name?");
  const s = sender();
  const act = Board.answerAction(reads, w.root, s.t3, () => NOW);
  const acked = await act({ handle: nameOf(w.root, look), close: "ack" });
  assert.deepEqual([acked.ok, acked.woken, acked.wake], [true, false, null]);
  await assert.rejects(act({ handle: question, close: "ack" }), /only a look or an FYI/);
  const dismissed = await act({ handle: question, close: "dismiss" });
  assert.deepEqual([dismissed.woken, dismissed.wake], [true, null]);
  await assert.rejects(act({ handle: question, close: "dismiss" }), /already withdrawn by the user/);
  await refreshes(w.root, s.t3);
  assert.deepEqual(s.sent.map((x) => x.text), [`Wake: ${nameOf(w.root, question)} dismissed by the user without an answer; if you still need it, ask again with what changed.`]);
});

const braid = (id: string): any => ({ number: id, folder: `braids/${id}-a`, brief: { id, title: `T ${id}`, status: "In Progress", labels: [], dependencies: [], order: null, delivery: null, body: "" }, strands: [], logs: [], hasReport: false });
const gh: any = { status: { state: "ok" }, prs: new Map() };
const t3: any = { status: { state: "ok" }, threads: new Map(), states: new Map([[PM, "idle"]]), links: new Map() };
const open = (code: string, id: string, minutes: number, extra: object = {}): any => Rec.newRecord({ id, kind: "question", text: `text ${code}`, at: new Date(NOW.getTime() - minutes * 60_000).toISOString(), thread: ASKER, code, ...extra });
const sigOf = (requests: any[], extra: object = {}): any => ({ now: NOW, requests: new Map(), open: requests, alarm: () => null, closed: [], waits: [], programmes: [], plans: [], ...extra });

test("three open questions: the card holds all three, shows the oldest, counts them with Details off; each pushes on its own", () => {
  const three = [open("q-one1", "0001", 30), open("q-two2", "0001", 20), open("q-thr3", "0001", 10, { by: "pm", thread: PM })];
  const board = model.toBoard("shop", [braid("0001")], gh, t3, sigOf(three));
  const card = board.braids[0];
  assert.deepEqual([card.need.code, card.asks.map((n: any) => n.code), card.lane], ["q-one1", ["q-one1", "q-two2", "q-thr3"], "Waiting"]);
  assert.equal(board.questions.length, 3);
  const [icon] = marks.cardMarks(card, false).reasons;
  assert.equal(icon.count, 3);
  assert.match(icon.tooltip, /text q-one1[^\n]*\n[^\n]*text q-two2[^\n]*\n[^\n]*text q-thr3/);
  assert.equal(marks.cardMarks(card).reasons[0].count, undefined, "no count with Details on");
  const pushes = message.pushesOf(board);
  assert.deepEqual(pushes.map((p: any) => p.sequence).sort(), ["braid-shop-0001-q-one1", "braid-shop-0001-q-thr3", "braid-shop-0001-q-two2"]);
  const fewer = message.pushesOf(model.toBoard("shop", [braid("0001")], gh, t3, sigOf(three.slice(1))));
  assert.deepEqual(fewer.map((p: any) => p.key).sort(), pushes.filter((p: any) => !p.item.endsWith("q-one1")).map((p: any) => p.key).sort(), "closing one leaves the others' pushes as they were");
});

test("a programme's two open requests both show on its card, in the Questions panel and as pushes", () => {
  const plan = plans.planOf("shop", "pm/shop", `---\nprogramme: shop\ntitle: Shop\ngoal: g\nthread: ${PM}\nstate: running\nrows:\n  - P1 | 0001 | One | running\n---\n`);
  const programmes = [open("q-aaaa", "pm/shop", 30, { by: "pm", thread: PM }), open("q-bbbb", "pm/shop", 8, { by: "pm", thread: PM })];
  const board = model.toBoard("shop", [braid("0001")], gh, t3, sigOf([], { programmes, plans: [plan] }));
  assert.deepEqual(board.programmes[0].asks.map((n: any) => n.code), ["q-aaaa", "q-bbbb"]);
  assert.deepEqual(board.questions.map((q: any) => q.code), ["q-aaaa", "q-bbbb"]);
  assert.deepEqual(message.pushesOf(board).map((p: any) => p.sequence), ["braid-shop-pm-shop-q-aaaa", "braid-shop-pm-shop-q-bbbb"]);
});

test("an acknowledged and a dismissed request show under Decided, marked", () => {
  const closedBy = (code: string, state: string, kind: string, text: string): any => {
    const r = open(code, "0001", 30, { kind });
    return { ...r, state, events: [...r.events, { event: state, at: NOW.toISOString(), by: "user", text }] };
  };
  const closed = [closedBy("q-seen", "answered", "look", "Acknowledged"), closedBy("q-gone", "withdrawn", "question", "dismissed by the user without an answer")];
  const board = model.toBoard("shop", [braid("0001")], gh, t3, sigOf([], { closed }));
  assert.deepEqual(board.decided.map((d: any) => [d.code, d.outcome, d.answer]).sort(), [["q-gone", "dismissed", ""], ["q-seen", "acknowledged", ""]]);
  const detail = model.toDetail({ read: () => null }, braid("0001"), braid("0001"), gh, t3, sigOf([], { closed }));
  assert.deepEqual([detail.requests.decided.length, detail.requests.closed.length], [2, 0]);
});

test("the demo has an item with three open requests, a programme with two, and a dismissed and an acknowledged one", () => {
  const board = model.toBoard("demo", demo.demoBraids(), demo.demoGithub(), demo.demoT3(), demo.demoSignals(NOW), undefined, undefined);
  const strand = board.braids.flatMap((b: any) => b.strands).find((s: any) => s.id === "0004/B");
  assert.equal(strand.asks.length, 3);
  const programmes = model.toBoard("demo", demo.demoBraids(), demo.demoGithub(), demo.demoT3(), { ...demo.demoSignals(NOW), plans: demo.demoPlans(NOW) }).programmes;
  assert.equal(programmes.find((p: any) => p.slug === "working-product").asks.length, 2);
  assert.deepEqual(board.decided.map((d: any) => d.outcome).filter((o: any) => o !== null).sort(), ["acknowledged", "dismissed"]);
});
