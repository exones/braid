// What the page shows while an answer, an acknowledgement or a dismissal goes (0084/C, the user's shiny-monkey-mo72): the
// stages of a send, kept across a reload, and the board's log of actions that arrive, are refused or fail.
import assert from "node:assert/strict";
import { test } from "node:test";
import { load, world } from "./support/done-fixtures.ts";

/* eslint-disable @typescript-eslint/no-explicit-any */
const sends: any = await load("../../dist/board/sends.js");
const Board: any = await load("../../dist/commands/board.js");
const Cmd: any = await load("../../dist/commands/requests.js");
const Rec: any = await load("../../dist/braids/requests.js");

const send = (extra: object = {}): any => ({ project: "p", handle: "calm-otter-7k2m", press: "A", label: "A · Half-up", started: 1000, phase: "sending", note: null, gone: null, ...extra });

test("a send reads sending, then still sending; after a reload it is unconfirmed only once the record had time to show it", () => {
  assert.equal(sends.stageOf(send(), 2000, true), "sending");
  assert.equal(sends.stageOf(send(), 1000 + sends.STILL_AFTER_MS, true), "still");
  assert.equal(sends.stageOf(send(), 1000 + 600_000, true), "still", "this page still waits for the reply");
  assert.equal(sends.stageOf(send(), 20_000, false), "still", "reloaded: the buttons stay off");
  assert.equal(sends.stageOf(send(), 1000 + sends.UNCONFIRMED_AFTER_MS, false), "unconfirmed");
  assert.equal(sends.stageOf(send({ phase: "sent" }), 2000, true), "sent");
  assert.deepEqual(["sending", "still", "sent", "closed"].map(sends.mayPress), [false, false, false, false]);
  assert.deepEqual([null, "failed", "unconfirmed"].map(sends.mayPress), [true, true, true]);
});

test("the list survives a reload; a send stays while its request is listed and leaves a while after it is gone", () => {
  const kept = sends.parseSends(JSON.stringify([send(), { nonsense: true }]));
  assert.deepEqual(kept, [send()]);
  assert.deepEqual(sends.parseSends("{oops"), []);
  const open = new Set([sends.sendKey("p", "calm-otter-7k2m")]);
  assert.deepEqual(sends.settle(kept, open, 5000), kept);
  const [gone] = sends.settle(kept, new Set(), 5000);
  assert.equal(gone.gone, 5000);
  assert.equal(sends.settle([gone], new Set(), 5000 + sends.KEPT_MS - 1).length, 1);
  assert.deepEqual(sends.settle([gone], new Set(), 5000 + sends.KEPT_MS), []);
  assert.equal(sends.goneLine(gone, { by: "user", answer: "A. Half-up", outcome: null }), "answered by you: A. Half-up");
  assert.equal(sends.goneLine(gone, { by: "user", answer: "", outcome: "dismissed" }), "dismissed by you");
});

test("a request already closed is refused saying who and with what, and the page reads it as closed", async () => {
  const w = world();
  const out = Cmd.askCommand(w.root, ["0001", "Which rounding rule?", "--option", "Half-up", "--thread", "33333333-aaaa-4bbb-8ccc-444444444444"], w.opts);
  const handle = out.split(" ")[0];
  Cmd.answerCommand(w.root, w.root, [handle, "A"], w.opts);
  const act = Board.answerAction(() => new Map(), w.root, () => Promise.resolve({ status: 0, stdout: "", stderr: "" }));
  const message: string = await act({ handle, text: "A" }).then(() => "", (e: Error) => e.message);
  assert.match(message, /is already answered by the user at .*Z: A\. Half-up; nothing changed$/);
  assert.deepEqual(sends.refusal(message).phase, "closed");
  assert.match(sends.refusal(message).note, /^[a-z]+-[a-z]+-\w+ \(0001\) is already answered by the user at .*: A\. Half-up$/);
  assert.equal(sends.refusal("The board couldn't do it: requests: the lock is held").phase, "failed");
  assert.ok(Rec.loadRecord(w.root).requests.length === 1);
});

test("the board logs an action that arrives, is refused or fails, with its route, peer and reason, and never the token or the text", async () => {
  const lines: string[] = [];
  const write = process.stderr.write.bind(process.stderr);
  (process.stderr as any).write = (chunk: any, ...rest: any[]) => {
    if (String(chunk).startsWith("braid board: ")) {
      lines.push(String(chunk));
      return true;
    }
    return write(chunk, ...rest);
  };
  const failing = { ...Board.demoSources(), action: (name: string) => (name === "answer" ? () => Promise.reject(new Error("requests: another braid holds the lock\nmore")) : () => new Promise((done) => setTimeout(() => done({ ok: true }), 1500))) };
  const board = await Board.startBoardWith(failing);
  try {
    const url = new URL(board.url);
    const post = (token: string) => fetch(`${url.origin}/api/action/answer`, { method: "POST", headers: { "content-type": "application/json", "x-braid-token": token }, body: JSON.stringify({ handle: "x", text: "secret answer" }) });
    const refused = await post("0".repeat(64));
    assert.equal(refused.status, 403);
    // A page that goes away before the reply (a reload, a dropped phone) is said too.
    const gone = new AbortController();
    const late = fetch(`${url.origin}/api/action/resume`, { method: "POST", headers: { "content-type": "application/json", "x-braid-token": board.token }, body: "{}", signal: gone.signal }).catch(() => "aborted");
    await new Promise((done) => setTimeout(done, 300));
    gone.abort();
    await late;
    await new Promise((done) => setTimeout(done, 300));
    const failed = await post(board.token);
    assert.equal(failed.status, 500);
    assert.equal(((await failed.json()) as any).error, "The board couldn't do it: requests: another braid holds the lock");
  } finally {
    await board.close();
    (process.stderr as any).write = write;
  }
  const said = lines.join("");
  assert.match(said, /POST \/api\/action\/answer from local 127\.0\.0\.1: arrived/);
  assert.match(said, /from local 127\.0\.0\.1: refused 403 after [\d.]+ s: This page's token is from another/);
  assert.match(said, /: failed after [\d.]+ s: requests: another braid holds the lock more/);
  assert.match(said, /POST \/api\/action\/resume from local 127\.0\.0\.1: the page went away after [\d.]+ s, before the reply/);
  assert.ok(!said.includes(board.token) && !said.includes("secret answer"), said);
});
