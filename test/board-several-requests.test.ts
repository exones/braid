import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

// The board with several open requests on one item (0084/F, 0084/C): a card shows the oldest question, and none of the others is lost.
const load = (path: string) => import(pathToFileURL(fileURLToPath(new URL(path, import.meta.url))).href);
/* eslint-disable @typescript-eslint/no-explicit-any */
const model: any = await load("../dist/board/model.js");
const signals: any = await load("../dist/board/signals.js");
const plans: any = await load("../dist/board/plans.js");
const message: any = await load("../dist/notify/message.js");
const board: any = await load("../dist/commands/board.js");
const { newRecord, openRequest }: any = await load("../dist/braids/requests.js");

const scratch = mkdtempSync(join(tmpdir(), "braid-several-"));
after(() => rmSync(scratch, { recursive: true, force: true, maxRetries: 20, retryDelay: 250 }));

const NOW = new Date("2026-11-28T12:00:00Z");
const ago = (minutes: number) => new Date(NOW.getTime() - minutes * 60_000).toISOString();
const HEAD = "a".repeat(40);
let n = 0;
const req = (id: string, kind: string, minutes: number, extra: object = {}): any => newRecord({ id, kind, text: `a ${kind} ${(n += 1)}`, at: ago(minutes), thread: `coordinator-${n}`, code: `q-s${String(n).padStart(3, "0")}`, ...extra });

const item = (id: string, status: string) => ({ id, title: `Item ${id}`, status, labels: [], dependencies: [], order: null, delivery: null, body: "" });
const BRAIDS: any = [{ logs: [], hasReport: false, number: "0001", folder: "braids/0001-a", brief: item("0001", "In Progress"), strands: [] }];
const PLAN = plans.planOf("shop", "pm/shop", "---\nprogramme: shop\ntitle: Shop\ngoal: g\nstate: running\nrows:\n  - P1 | 0001 | One | running\n---\n");
const gh: any = { status: { state: "ok" }, prs: new Map([["0001", { number: 7, url: "https://example.test/7", state: "open", checks: "passing", base: "main", branch: "b", head: HEAD }]]) };
const t3: any = { status: { state: "ok" }, threads: new Map(), states: new Map([["pm", "idle"]]), links: new Map() };

/** The signals as `readSignals` makes them of these open requests, oldest first. */
function signalsOf(open: any[], programme = false): any {
  const sorted = [...open].sort((a, b) => a.at.localeCompare(b.at));
  const byAsker = (pm: boolean) => new Map(sorted.filter((r) => (r.by === "pm") === pm).map((r) => [r.id, r]));
  return { now: NOW, requests: byAsker(false), asks: byAsker(true), open: sorted, programmes: [], plans: programme ? [PLAN] : [], closed: [], waits: [], alarm: signals.brokeClock({}, NOW).alarm };
}
const boardOf = (open: any[], programme = false): any => model.toBoard("shop", BRAIDS, gh, t3, signalsOf(open, programme));

test("a newer question still with the PM doesn't hide one that is yours: lane, need and push", () => {
  const mine = req("0001", "decision", 10);
  const b = boardOf([mine, req("0001", "question", 1, { to: "pm", pm: "pm" })]);
  assert.equal(b.braids[0].lane, "Waiting");
  assert.equal(b.braids[0].need.code, mine.code);
  assert.equal(b.braids[0].pm, null);
  assert.deepEqual(message.pushesOf(b).map((p: any) => p.body.includes(mine.text)), [true]);
});

test("an escalated question is shown over a younger one still with the PM", () => {
  const old = req("0001", "question", 30, { to: "pm", pm: "pm" });
  const b = boardOf([old, req("0001", "question", 1, { to: "pm", pm: "pm" })]);
  assert.equal(b.braids[0].need.code, old.code);
  assert.equal(b.braids[0].need.via, "timeout");
});

test("the Questions panel and the Requests tab list every open question; the card shows the oldest", () => {
  const open = [req("0001", "question", 30), req("0001", "decision", 20), req("0001", "question", 10, { by: "pm" }), req("0001", "question", 5, { by: "pm" })];
  const b = boardOf(open);
  assert.deepEqual(b.questions.map((q: any) => q.code).sort(), open.map((r) => r.code).sort());
  assert.equal(b.braids[0].need.code, open[0].code);
  assert.equal(b.braids[0].pmAsk.code, open[2].code);
  assert.deepEqual(b.braids[0].asks.map((n: any) => n.code), open.map((r) => r.code));
  const detail = model.toDetail({ read: () => null }, BRAIDS[0], BRAIDS[0], gh, t3, signalsOf(open));
  assert.deepEqual(detail.requests.open.map((r: any) => r.code).sort(), open.map((r) => r.code).sort());
});

test("a forwarded question stays on the programme and pushes when a newer one is still with the PM, or is yours", () => {
  const forwarded = req("0001", "question", 15, { to: "pm", pm: "pm", forwarded: ago(10) });
  for (const newer of [req("0001", "question", 1, { to: "pm", pm: "pm" }), req("0001", "decision", 1)]) {
    const b = boardOf([forwarded, newer], true);
    assert.deepEqual(b.programmes[0].forwards.map((f: any) => f.need.code), [forwarded.code]);
    const pushed = message.pushesOf(b).filter((p: any) => p.body.includes(forwarded.text));
    assert.equal(pushed.length, 1);
    if (newer.to === undefined) {
      assert.equal(b.braids[0].need.code, newer.code);
      assert.ok(message.pushesOf(b).some((p: any) => p.body.includes(newer.text)));
    }
  }
});

test("a question after a review: Needs You, the Merge button kept (D122)", () => {
  const review = req("0001", "review", 20, { pr: 7, head: HEAD });
  const question = req("0001", "question", 5);
  const b = boardOf([review, question]);
  assert.equal(b.braids[0].lane, "Waiting");
  assert.equal(b.braids[0].need.code, question.code);
  assert.equal(b.braids[0].merge.pr, 7);
  assert.equal(b.questions.find((q: any) => q.code === review.code).merge.pr, 7);
});

test("the merge action asks the review's thread, whatever was asked after it", async () => {
  const review = req("0001", "review", 20, { pr: 7, head: HEAD });
  const calls: string[][] = [];
  const src = { ...board.demoSources(), github: () => gh, t3: () => t3, signals: () => signalsOf([review, req("0001", "question", 5)]) };
  const run = board.mergeAction(src, scratch, (_root: string, args: string[]) => (calls.push(args), Promise.resolve({ status: 0, stdout: "", stderr: "" })));
  await run({ id: "0001", head: HEAD });
  assert.deepEqual(calls, [["thread", "send", review.thread, `Merge #7 at ${HEAD}, from the board.`]]);
});

test("the signals hold every open question of an item, not only the newest", () => {
  const git = (...args: string[]) => assert.equal(spawnSync("git", args, { cwd: scratch }).status, 0, args.join(" "));
  git("init", "-q");
  git("-c", "user.name=t", "-c", "user.email=t@example.test", "commit", "-q", "--allow-empty", "-m", "x");
  const codes = [1, 2, 3].map((i) => openRequest(scratch, { id: "0001", kind: "question", text: `q ${i}`, at: ago(10 - i), thread: null }).code);
  const sig = signals.readSignals(scratch, gh, NOW);
  assert.deepEqual(sig.open.map((r: any) => r.code), codes);
  assert.equal(sig.requests.get("0001").code, codes[2]);
});
