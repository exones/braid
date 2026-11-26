// Stalled cards say why a thread failed (docs/board.md, "Why a thread failed").
import assert from "node:assert/strict";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

// Computed specifiers keep the compiled modules out of the typecheck, which runs before the build.
const load = (path: string) => import(pathToFileURL(fileURLToPath(new URL(path, import.meta.url))).href);
const { failureOf, failureReader } = await load("../dist/board/failure.js");
const { showThread } = await load("../dist/board/t3.js");
const { toBoard } = await load("../dist/board/model.js");
const { readInputs } = await load("../dist/board/inputs.js");
const { cardMarks, strandMarks, ageText } = await load("../dist/board/marks.js");
const { demoBraids, demoGithub } = await load("../dist/board/demo.js");

const failed = { status: "failed" };

test("failureOf reads the kind and a few words from the providers' real error texts", () => {
  // Claude Code's messages (code.claude.com/docs/en/errors) and Codex's (codex-rs/protocol/src/error.rs).
  const cases: [string, string, string][] = [
    ["You've hit your session limit · resets 3:45pm", "limit", "Usage limit · resets 3:45pm"],
    ["You've hit your session limit · resets 5:30pm (Europe/Kyiv)", "limit", "Usage limit · resets 5:30pm"],
    ["You've hit your weekly limit · resets Mon 12:00am", "limit", "Usage limit · resets Mon 12:00am"],
    ["You've hit your Opus limit · resets 3:45pm", "limit", "Usage limit · resets 3:45pm"],
    ["You’ve hit your usage limit. Visit https://chatgpt.com/settings/usage to purchase more credits or try again at 3:45 PM.", "limit", "Usage limit · resets 3:45 PM"],
    ["You’ve hit your usage limit. Try again later.", "limit", "Usage limit"],
    ["You hit your spend cap set in your workspace. Increase your spend cap to continue.", "limit", "Usage limit"],
    ["API Error: Repeated 529 Overloaded errors. The API is at capacity — this is usually temporary.", "provider", "Provider overloaded"],
    ['API Error: 529 {"type":"error","error":{"type":"overloaded_error","message":"Overloaded"}}', "provider", "Provider overloaded"],
    ["Selected model is at capacity. Please try a different model.", "provider", "Provider overloaded"],
    ["Server is temporarily limiting requests (not your usage limit) · Rate limited", "provider", "Provider rate limit"],
    ["API Error: 500 Internal server error. This is a server-side issue, usually temporary — try again in a moment.", "provider", "Provider error (500)"],
    ["stream disconnected before completion: stream closed before response.completed", "provider", "Network error"],
    ["API Error: Connection lost mid-response. The response above may be incomplete.", "provider", "Network error"],
    ["Request timed out", "provider", "Network error"],
    ["interrupted (Ctrl-C). Something went wrong? Hit `/feedback` to report the issue.", "stopped", "Run stopped"],
    ["Answer delivery not confirmed: the provider session ended before the answer arrived.", "other", "Answer delivery not confirmed"],
    ["Something nobody has seen before that goes on and on past what a card can hold on one line", "other", "Something nobody has seen before that goes on a…"],
  ];
  for (const [text, kind, short] of cases) {
    assert.deepEqual(failureOf(text, failed), { kind, short, full: text }, text);
  }
});

test("failureOf: a stop without a text, a failure without one, and a thread that didn't fail", () => {
  assert.equal(failureOf(null, { status: "interrupted" }).kind, "stopped");
  assert.equal(failureOf(null, failed).short, "Run failed");
  assert.equal(failureOf(null, { status: "completed" }), null);
  assert.equal(failureOf("You've hit your session limit", { status: "interrupted" }).kind, "limit");
});

const shown = (error: string | null) => ({ status: 0, stdout: JSON.stringify({ thread: { status: "failed" }, messages: [], error }), stderr: "" });

test("showThread reads the error beside the thread", async () => {
  assert.equal((await showThread(async () => shown("boom"), ".", "t")).error, "boom");
  assert.equal((await showThread(async () => shown(null), ".", "t")).error, null);
});

test("the reader shows each newly failed thread of an open item once, until its status changes", async () => {
  const asked: string[] = [];
  let down = false;
  const read = failureReader(async (_root: string, args: readonly string[]) => {
    asked.push(args[2] ?? "");
    return down ? { status: 1, stdout: "", stderr: "no" } : shown("Request timed out");
  }, ".");
  const worker = (id: string) => ({ id, role: "worker", pending: 0, link: null });
  const t3 = (states: [string, string][]) => ({
    status: { state: "ok" },
    threads: new Map(),
    // 0004/A is open, 0001/A is Done, 0004/B's newest thread ended well.
    idle: new Map([["0004/A", [worker("new")]], ["0001/A", [worker("done")]], ["0004/B", [worker("fine"), worker("old")]]]),
    idleCoordinators: new Map([["0004", { id: "coord", link: null, provider: null, model: null }]]),
    states: new Map(states),
  });
  const first = t3([["new", "failed"], ["done", "failed"], ["fine", "completed"], ["old", "failed"], ["coord", "interrupted"]]);
  assert.deepEqual([...(await read(first, demoBraids())).keys()].sort(), ["coord", "new"]);
  await read(first, demoBraids());
  assert.deepEqual(asked.sort(), ["coord", "new"]);
  // Another status is read again; a read T3 refuses is tried again.
  asked.length = 0;
  down = true;
  const stopped = t3([["new", "interrupted"]]);
  assert.equal((await read(stopped, demoBraids())).size, 0);
  down = false;
  assert.equal((await read(stopped, demoBraids())).get("new").kind, "stopped");
  assert.deepEqual(asked, ["new", "new"]);
});

const NOW = new Date("2026-11-26T10:00:00Z");
const signals = (failures: [string, unknown][]) => ({
  now: NOW,
  requests: new Map(),
  failures: new Map(failures),
  alarm: (_id: string, _reason: string, holds: boolean | null) => (holds === true ? new Date(NOW.getTime() - 14 * 60_000).toISOString() : null),
  commit() {},
});
const idleT3 = {
  status: { state: "ok" },
  threads: new Map(),
  idle: new Map([["0004/A", [{ id: "w", role: "worker", pending: 0, link: null }]]]),
  idleCoordinators: new Map([["0007", { id: "c", link: null, provider: null, model: null }]]),
};
const limit = failureOf("You've hit your session limit · resets 3:45pm", failed);
const stop = failureOf(null, { status: "interrupted" });
const cardsWith = (failures: [string, unknown][]) => toBoard("demo", demoBraids(), demoGithub(), idleT3, signals(failures)).braids;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const byId = (cards: any[], id: string): any => cards.find((c) => c.id === id);

test("a stalled card says why its thread failed, with the whole error in the tooltip", () => {
  const cards = cardsWith([["w", limit], ["c", stop]]);
  const strand = byId(byId(cards, "0004").strands, "0004/A");
  assert.equal(strand.need.text, "Usage limit · resets 3:45pm");
  assert.deepEqual(strand.need.failure, { kind: "limit", full: limit.full });
  assert.equal(ageText(strand.need), "stalled for 14 min");
  assert.deepEqual(strandMarks(strand).reasons, [{ kind: "failed-limit", tooltip: limit.full }]);
  assert.deepEqual(strandMarks(strand, false).reasons, [{ kind: "failed-limit", tooltip: limit.full }]);
  // 0007 has a failed coordinator thread: its strands are To Do, so the braid's own stall names it.
  const stalled = byId(cards, "0007");
  assert.equal(stalled.need.text, "Run stopped");
  assert.equal(cardMarks(stalled).reasons[0].kind, "failed-stopped");
});

test("a stall without a failed thread reads as before", () => {
  const strand = byId(byId(cardsWith([]), "0004").strands, "0004/A");
  assert.equal(strand.need.text, "Stalled: nobody is working and nothing was asked");
  assert.equal(ageText(strand.need), "for 14 min");
  assert.equal(strandMarks(strand).reasons[0].kind, "stalled");
});

test("readInputs hands the failures to the lanes, and a failed read of them leaves the lanes", async () => {
  const sources = (failures: () => Promise<unknown>) => ({
    braids: demoBraids,
    github: demoGithub,
    t3: async () => idleT3,
    signals: () => ({ ...signals([]), failures: undefined }),
    start: () => ({ main: "main", expected: null }),
    failures,
  });
  assert.equal((await readInputs(sources(async () => new Map([["w", limit]])))).sig.failures.get("w"), limit);
  const broken = await readInputs(sources(async () => Promise.reject(new Error("no t3"))));
  assert.equal(broken.sig.failures, undefined);
  assert.ok(broken.braids.length > 0);
});
