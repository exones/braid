// 0082/D: the user answers an open request from the board's page (`POST /api/action/answer`): an option letter or one line,
// recorded as `braid answer` records it, by the user; a request no longer open, a wait or another project's request is
// refused; the action sits behind the guard of the other actions on both listeners; the asking thread is woken once.
import assert from "node:assert/strict";
import { request, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { join } from "node:path";
import { test } from "node:test";
import { load, scratch, world } from "./support/done-fixtures.ts";

/* eslint-disable @typescript-eslint/no-explicit-any */
const Cmd: any = await load("../../dist/commands/requests.js");
const Rec: any = await load("../../dist/braids/requests.js");
const Board: any = await load("../../dist/commands/board.js");
const { waker }: any = await load("../../dist/board/wake.js");
const { setPause }: any = await load("../../dist/braids/pauses.js");

const ASKER = "33333333-aaaa-4bbb-8ccc-444444444444";
const NOW = new Date("2026-11-27T12:00:00.000Z");
const codeOf = (out: string): string => `q-${/^(?:[a-z]+-[a-z]+-|q-)([a-z0-9]{4,})\b/.exec(out)?.[1] ?? assert.fail(`no code in: ${out}`)}`;
const recordOf = (root: string, code: string): any => Rec.loadRecord(root).requests.find((r: any) => r.code === code);
const nameOf = (root: string, code: string): string => Rec.handleOf(recordOf(root, code));

/** A fake `t3`: records each `thread send`; `failNext` makes the next sends fail. */
function sender() {
  const sent: { thread: string; text: string }[] = [];
  let fail = 0;
  const t3 = (_root: string, args: readonly string[]) => {
    assert.deepEqual(args.slice(0, 2), ["thread", "send"]);
    if (fail > 0) {
      fail--;
      return Promise.resolve({ status: 1, stdout: "", stderr: "t3 is not running" });
    }
    sent.push({ thread: args[2] as string, text: args[3] as string });
    return Promise.resolve({ status: 0, stdout: "", stderr: "" });
  };
  return { t3, sent, failNext: (n: number) => (fail = n) };
}

/** The thread states of the board's last T3 read, as the action takes them. */
const reads = (archived: string[] = []) => () => new Map([[ASKER, "completed"], ...archived.map((t): [string, string] => [t, "archived"])]);

/** A board's good read, as far as the wake reads it. */
const good = (paused: string[] = []): any => ({
  sig: { pauses: new Map(paused.map((b) => [b, { braid: b }])) },
  start: { main: "main", expected: null },
  github: { status: { state: "ok" }, prs: new Map() },
  t3: { states: new Map() },
});

const warn = () => {};

test("an option letter records that option as the user's answer and wakes the asking thread once; the next refresh sends nothing", async () => {
  const w = world();
  const code = codeOf(Cmd.askCommand(w.root, ["0001", "Which rounding rule?", "--option", "Half-up", "--option", "Banker's rounding", "--thread", ASKER], w.opts));
  const s = sender();
  const out = await Board.answerAction(reads(), w.root, s.t3, () => NOW)({ project: "proj", handle: nameOf(w.root, code), text: "b" });
  assert.deepEqual([out.ok, out.id, out.answer, out.woken, out.wake], [true, "0001", "B. Banker's rounding", true, null]);
  const r = recordOf(w.root, code);
  assert.equal(r.state, "answered");
  assert.deepEqual([r.events.at(-2).event, r.events.at(-2).by, r.events.at(-2).text], ["answered", "user", "B. Banker's rounding"]);
  assert.ok(Rec.answerWoken(r), "the reminded mark is the memory");
  assert.deepEqual(s.sent, [{ thread: ASKER, text: `Wake: ${nameOf(w.root, code)} answered by the user: B. Banker's rounding. Recap it in one line, then act.` }]);
  await waker(s.t3)({ root: w.root, good: good() }, new Date(NOW.getTime() + 30_000), warn);
  assert.equal(s.sent.length, 1, "the next refresh sends nothing");
});

test("one line of free text is recorded as it is, by the user, as `braid answer` records it; its code names it too", async () => {
  const w = world();
  const code = codeOf(Cmd.askCommand(w.root, ["0002", "Ship it today?", "--option", "Yes", "--thread", ASKER], w.opts));
  const s = sender();
  const out = await Board.answerAction(reads(), w.root, s.t3, () => NOW)({ project: "proj", handle: code, text: "  Tomorrow, after the review  " });
  assert.equal(out.answer, "Tomorrow, after the review");
  const e = Rec.closing(recordOf(w.root, code));
  assert.deepEqual([e.event, e.by, e.text], ["answered", "user", "Tomorrow, after the review"]);
  assert.equal(s.sent.length, 1);
});

test("a request answered meanwhile, a wait, another project's request and text that isn't one line are refused; nothing changes", async () => {
  const w = world();
  const other = world();
  const code = codeOf(Cmd.askCommand(w.root, ["0001", "Go on?", "--thread", ASKER], w.opts));
  const wait = codeOf(Cmd.askCommand(w.root, ["0001/A", "Wait for 0002", "--to", "0002", "--thread", ASKER], w.opts));
  const theirs = codeOf(Cmd.askCommand(other.root, ["0002", "Theirs?", "--thread", ASKER], other.opts));
  const s = sender();
  const answer = Board.answerAction(reads(), w.root, s.t3, () => NOW);
  Cmd.answerCommand(w.root, w.root, [code, "yes"], w.opts);
  await assert.rejects(answer({ handle: nameOf(w.root, code), text: "A" }), /Answer: .* is already answered by the user at .*; nothing changed/);
  await assert.rejects(answer({ handle: wait, text: "done" }), /is a wait, which asks no one/);
  await assert.rejects(answer({ handle: nameOf(other.root, theirs), text: "yes" }), /no request .* in this project|no request named/);
  await assert.rejects(answer({ handle: theirs, text: "yes" }), /no request q-/);
  await assert.rejects(answer({ handle: code, text: "two\nlines" }), /one line of text or an option letter, at most 500 characters/);
  await assert.rejects(answer({ handle: code, text: "x".repeat(501) }), /at most 500 characters/);
  await assert.rejects(answer({ handle: code }), /answer needs \{ handle, text \}/);
  assert.equal(recordOf(other.root, theirs).state, "open");
  assert.equal(recordOf(w.root, wait).state, "open");
  assert.deepEqual(s.sent, []);
});

test("the user's answer from the board wakes the asker whoever the request was for; a failed send is sent once at a later refresh", async () => {
  const w = world();
  const code = codeOf(Cmd.askCommand(w.root, ["0002", "Use the new API?", "--thread", ASKER], w.opts));
  const s = sender();
  s.failNext(1);
  const out = await Board.answerAction(reads(), w.root, s.t3, () => NOW)({ handle: code, text: "Yes" });
  assert.deepEqual([out.woken, recordOf(w.root, code).state], [false, "answered"]);
  assert.match(out.wake, /the wake failed \(t3 is not running\)/);
  assert.equal(Rec.answerWoken(recordOf(w.root, code)), false);
  const wake = waker(s.t3);
  await wake({ root: w.root, good: good() }, NOW, warn);
  await wake({ root: w.root, good: good() }, new Date(NOW.getTime() + 30_000), warn);
  assert.deepEqual(s.sent.map((x) => x.text), [`Wake: ${nameOf(w.root, code)} answered by the user: Yes. Recap it in one line, then act.`]);
  assert.ok(Rec.answerWoken(recordOf(w.root, code)));
});

test("a paused asking braid is woken only once it resumes; an archived asker is not woken", async () => {
  const w = world();
  const held = codeOf(Cmd.askCommand(w.root, ["0001/A", "Which name?", "--thread", ASKER], w.opts));
  const gone = codeOf(Cmd.askCommand(w.root, ["0002", "Still needed?", "--thread", "archived-thread-0000"], w.opts));
  setPause(w.root, { braid: "0001", reason: "hold", words: "wait", provider: null, window: null, label: null, usedPercent: null, resetsAt: null, resumeAt: null, task: null, thread: "user-thread-1", by: "pm", at: NOW.toISOString() });
  const s = sender();
  const out = await Board.answerAction(reads(["archived-thread-0000"]), w.root, s.t3, () => NOW)({ handle: held, text: "Lark" });
  assert.equal(out.woken, false);
  assert.match(out.wake, /braid 0001 is paused/);
  const archived = await Board.answerAction(reads(["archived-thread-0000"]), w.root, s.t3, () => NOW)({ handle: gone, text: "No" });
  assert.match(archived.wake, /archived/);
  const wake = waker(s.t3);
  await wake({ root: w.root, good: good(["0001"]) }, NOW, warn);
  assert.equal(s.sent.length, 0, "held: nothing sent");
  await wake({ root: w.root, good: good() }, NOW, warn);
  await wake({ root: w.root, good: good() }, NOW, warn);
  assert.deepEqual(s.sent.map((x) => x.thread), [ASKER], "sent once after it resumed; the archived one never");
});

test("an answer reads no thread list: the board's last read gives the asker's state, else one thread show of that thread alone", async () => {
  const w = world();
  const calls: string[] = [];
  const t3 = (_root: string, args: readonly string[]) => {
    calls.push(args.slice(0, 3).join(" "));
    const out = args[1] === "list" ? [{ threadId: ASKER, status: "completed" }] : { thread: { status: "completed", archived: args[2] === "archived-child-0000" } };
    return Promise.resolve({ status: 0, stdout: args[1] === "send" ? "" : JSON.stringify(out), stderr: "" });
  };
  const src = Board.repoSources(w.root, w.opts.gh, t3);
  const answer = async (id: string, thread: string) => {
    const code = codeOf(Cmd.askCommand(w.root, [id, "Go on?", "--thread", thread], w.opts));
    calls.length = 0;
    return src.action("answer")({ handle: code, text: "Yes" });
  };
  // Before any read, and for a subagent `thread list` leaves out: one show.
  const child = await answer("0001", "archived-child-0000");
  assert.match(child.wake, /archived/);
  assert.deepEqual(calls, ["thread show archived-child-0000"]);
  await src.t3();
  const listed = await answer("0002", ASKER);
  assert.equal(listed.woken, true);
  assert.deepEqual(calls, [`thread send ${ASKER}`], "the last read names the thread: no show");
});

// --- the guard: the answer action through the board server, on the local and the Tailscale listener

function call(port: number, path: string, headers: Record<string, string>, body: string): Promise<{ status: number; text: string }> {
  return new Promise((resolve, reject) => {
    const req = request({ host: "127.0.0.1", port, path, method: "POST", headers: { "content-type": "application/json", ...headers } }, (res) => {
      let text = "";
      res.on("data", (c: Buffer) => (text += c.toString()));
      res.on("end", () => resolve({ status: res.statusCode ?? 0, text }));
    });
    req.on("error", reject);
    req.end(body);
  });
}

test("the answer action needs the run's token on the local listener and the page's header from the owner on the Tailscale one", async () => {
  const w = world();
  const first = codeOf(Cmd.askCommand(w.root, ["0001", "First?", "--thread", ASKER], w.opts));
  const second = codeOf(Cmd.askCommand(w.root, ["0002", "Second?", "--thread", ASKER], w.opts));
  const s = sender();
  const src = { ...Board.demoSources(), action: (name: string) => (name === "answer" ? Board.answerAction(reads(), w.root, s.t3, () => NOW) : undefined) };
  let owner = false;
  const started: { server: Server; token: string; tailnet: { server: Server }; close(): Promise<void> } = await Board.startBoardWith(src, join(scratch, "no-web"), undefined, undefined, { address: "127.0.0.1", name: "pc.tail.ts.net", gate: () => Promise.resolve(owner) });
  try {
    const local = (started.server.address() as AddressInfo).port;
    const tail = (started.tailnet.server.address() as AddressInfo).port;
    const body = (code: string) => JSON.stringify({ project: "demo", handle: code, text: "yes" });
    const path = "/api/action/answer";
    assert.equal((await call(local, path, {}, body(first))).status, 403, "no token");
    assert.equal((await call(local, path, { "x-braid-token": "nope" }, body(first))).status, 403, "a wrong token");
    assert.equal((await call(local, path, { "x-braid-token": started.token, origin: "http://evil.example" }, body(first))).status, 403, "a foreign Origin");
    const host = `pc.tail.ts.net:${tail}`;
    assert.equal((await call(tail, path, { host, origin: `http://${host}`, "x-braid-request": "1" }, body(first))).status, 403, "not the tailnet's owner");
    owner = true;
    assert.equal((await call(tail, path, { host, origin: `http://${host}` }, body(first))).status, 403, "no request header");
    assert.equal(recordOf(w.root, first).state, "open", "nothing refused was recorded");
    const ok = await call(local, path, { "x-braid-token": started.token, origin: `http://127.0.0.1:${local}` }, body(first));
    assert.equal(ok.status, 200, ok.text);
    const phone = await call(tail, path, { host, origin: `http://${host}`, "x-braid-request": "1" }, body(second));
    assert.equal(phone.status, 200, phone.text);
    assert.deepEqual([recordOf(w.root, first).state, recordOf(w.root, second).state], ["answered", "answered"]);
    const again = await call(local, path, { "x-braid-token": started.token }, body(first));
    assert.equal(again.status, 400);
    assert.match(JSON.parse(again.text).error, /already answered by the user/);
    const elsewhere = await call(local, path, { "x-braid-token": started.token }, JSON.stringify({ project: "mail", handle: second, text: "x" }));
    assert.equal(elsewhere.status, 400, "a project the board doesn't serve");
    assert.equal(s.sent.length, 2);
  } finally {
    await started.close();
  }
});
