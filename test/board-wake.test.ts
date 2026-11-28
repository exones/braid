// 0071/A: the running board closes an open request whose "done when" holds (`pr:`, `braid:`, `time:`) on `braid-requests`
// and wakes its asking thread once: across refreshes and a restart, after a failed send, a failed push or a failed record
// write; never for a held or paused braid; and a board write racing a CLI write loses neither.
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { brief, git, load, scratch, world } from "./support/done-fixtures.ts";

/* eslint-disable @typescript-eslint/no-explicit-any */
const Cmd: any = await load("../../dist/commands/requests.js");
const Rec: any = await load("../../dist/braids/requests.js");
const { waker, wakeMessage }: any = await load("../../dist/board/wake.js");
const { steerer }: any = await load("../../dist/board/steerer.js");

const ASKER = "22222222-aaaa-4bbb-8ccc-333333333333";
const NOW = new Date("2026-11-23T12:00:00.000Z");
const codeOf = (out: string): string => `q-${/^(?:[a-z]+-[a-z]+-|q-)([a-z0-9]{4,})\b/.exec(out)?.[1] ?? assert.fail(`no code in: ${out}`)}`;
const recordOf = (root: string, code: string): any => Rec.loadRecord(root).requests.find((r: any) => r.code === code);
const nameOf = (root: string, code: string): string => Rec.handleOf(recordOf(root, code));

/** A board's good read, as far as the wake reads it. */
function good(opts: { prs?: { number: number; state: string }[]; paused?: string[]; archived?: string[] } = {}): any {
  return {
    sig: { pauses: new Map((opts.paused ?? []).map((b) => [b, { braid: b }])) },
    start: { main: "main", expected: null },
    github: { status: { state: "ok" }, prs: new Map((opts.prs ?? []).map((p) => [`b${p.number}`, { ...p, head: "a".repeat(40) }])) },
    t3: { states: new Map((opts.archived ?? []).map((t) => [t, "archived"])) },
  };
}

/** A fake `t3`: records each `thread send`; `fail` makes the next sends fail. */
function sender() {
  const sent: { thread: string; text: string }[] = [];
  let fail = 0;
  let during: (() => void) | null = null;
  const t3 = (_root: string, args: readonly string[]) => {
    assert.deepEqual(args.slice(0, 2), ["thread", "send"]);
    if (fail > 0) {
      fail--;
      return Promise.resolve({ status: 1, stdout: "", stderr: "t3 is not running" });
    }
    sent.push({ thread: args[2] as string, text: args[3] as string });
    during?.();
    return Promise.resolve({ status: 0, stdout: "", stderr: "" });
  };
  return { t3, sent, failNext: (n: number) => (fail = n), onSend: (f: (() => void) | null) => (during = f) };
}

const warnings: string[] = [];
const warn = (line: string) => void warnings.push(line);

test("a time: wait is met once its time comes: one wake, recorded as met by the board, not sent again on the next refresh", async () => {
  const w = world();
  const early = codeOf(Cmd.askCommand(w.root, ["0001", "Check the nightly run", "--to", "0002", "--done-when", "time:2026-11-23T11:00:00Z", "--thread", ASKER]));
  const late = codeOf(Cmd.askCommand(w.root, ["0001/A", "Look again tomorrow", "--done-when", "time:2026-11-24T11:00:00Z", "--thread", ASKER]));
  const s = sender();
  const wake = waker(s.t3);
  await wake({ root: w.root, good: good() }, NOW, warn);
  assert.deepEqual(s.sent, [{ thread: ASKER, text: `Wake: ${nameOf(w.root, early)} is met (time 2026-11-23T11:00:00.000Z reached): Check the nightly run. Go on where you left off.` }]);
  const r = recordOf(w.root, early);
  assert.deepEqual([r.state, r.events.at(-1).by, r.events.at(-1).at], ["met", "board", NOW.toISOString()]);
  assert.equal(recordOf(w.root, late).state, "open", "a time still to come stays open");
  await wake({ root: w.root, good: good() }, new Date(NOW.getTime() + 30_000), warn);
  assert.equal(s.sent.length, 1, "the second refresh sends nothing");
});

test("a pr: wait is woken when its PR merges; one whose PR closed unmerged is withdrawn without a wake; a request with no thread is closed without one", async () => {
  const w = world();
  const merged = codeOf(Cmd.askCommand(w.root, ["0001", "Wait for PR 5", "--done-when", "pr:5", "--thread", ASKER]));
  const closed = codeOf(Cmd.askCommand(w.root, ["0001/A", "Wait for PR 6", "--done-when", "pr:6", "--thread", ASKER]));
  const quiet = codeOf(Cmd.askCommand(w.root, ["0002", "Wait for PR 7", "--done-when", "pr:7"]));
  const s = sender();
  await waker(s.t3)({ root: w.root, good: good({ prs: [{ number: 5, state: "MERGED" }, { number: 6, state: "CLOSED" }, { number: 7, state: "MERGED" }] }) }, NOW, warn);
  assert.deepEqual(s.sent.map((x) => x.text), [`Wake: ${nameOf(w.root, merged)} is met (PR #5 merged): Wait for PR 5. Go on where you left off.`]);
  assert.deepEqual([recordOf(w.root, merged).state, recordOf(w.root, closed).state, recordOf(w.root, quiet).state], ["met", "withdrawn", "met"]);
  assert.equal(recordOf(w.root, closed).events.at(-1).text, "PR #6 closed");
});

test("a braid: wait is woken once that braid is Done on origin's main, not before", async () => {
  const w = world();
  const code = codeOf(Cmd.askCommand(w.root, ["0001", "Go on after 0002 lands", "--to", "0002", "--done-when", "braid:2", "--thread", ASKER]));
  assert.equal(recordOf(w.root, code).doneWhen, "braid:0002");
  const s = sender();
  const wake = waker(s.t3);
  await wake({ root: w.root, good: good() }, NOW, warn);
  assert.equal(s.sent.length, 0, "0002 is still To Do on main");
  // 0002 merges into main elsewhere; the wake fetches main itself.
  git(w.worker, "checkout", "-q", "-B", "m", "origin/main");
  writeFileSync(join(w.worker, "braids/0002-story/brief.md"), brief("0002", "Done"));
  git(w.worker, "commit", "-q", "-am", "0002 done");
  git(w.worker, "push", "-q", "origin", "m:main");
  await wake({ root: w.root, good: good() }, NOW, warn);
  assert.deepEqual(s.sent.map((x) => x.text), [`Wake: ${nameOf(w.root, code)} is met (braid 0002 merged into main): Go on after 0002 lands. Go on where you left off.`]);
  assert.equal(recordOf(w.root, code).state, "met");
  // `braid requests` uses the same check: nothing open is left to list.
  assert.match(Cmd.requestsCommand(w.root, [], { gh: w.opts.gh, now: () => NOW }), /no open requests/);
});

test("`braid requests` lists a due braid: or time: request as open and records nothing when no board runs", () => {
  const w = world();
  const code = codeOf(Cmd.askCommand(w.root, ["0001", "Later", "--done-when", "time:2026-11-23T11:00:00Z", "--thread", ASKER]));
  assert.match(Cmd.requestsCommand(w.root, [], { gh: w.opts.gh, now: () => NOW }), /condition holds: the board wakes the asker/);
  assert.equal(recordOf(w.root, code).state, "open");
});

test("a restarted board doesn't wake again: the met event is the memory", async () => {
  const w = world();
  codeOf(Cmd.askCommand(w.root, ["0001", "Later", "--done-when", "time:2026-11-23T11:00:00Z", "--thread", ASKER]));
  const s = sender();
  await waker(s.t3)({ root: w.root, good: good() }, NOW, warn);
  await waker(s.t3)({ root: w.root, good: good() }, NOW, warn);
  assert.equal(s.sent.length, 1);
});

test("a failed send records nothing and is sent at the next refresh, once", async () => {
  const w = world();
  const code = codeOf(Cmd.askCommand(w.root, ["0001", "Later", "--done-when", "time:2026-11-23T11:00:00Z", "--thread", ASKER]));
  const s = sender();
  const wake = waker(s.t3);
  s.failNext(1);
  warnings.length = 0;
  await wake({ root: w.root, good: good() }, NOW, warn);
  assert.equal(recordOf(w.root, code).state, "open", "not recorded: the wake isn't delivered");
  assert.match(warnings.join("\n"), new RegExp(`the wake of ${code} \\(0001\\) failed \\(t3 is not running\\)`));
  await wake({ root: w.root, good: good() }, NOW, warn);
  await wake({ root: w.root, good: good() }, NOW, warn);
  assert.equal(s.sent.length, 1);
  assert.equal(recordOf(w.root, code).state, "met");
});

test("a failed push keeps the met on the local branch: no second wake, from this board or a restarted one", async () => {
  const w = world();
  const code = codeOf(Cmd.askCommand(w.root, ["0001", "Later", "--done-when", "time:2026-11-23T11:00:00Z", "--thread", ASKER]));
  git(w.root, "remote", "set-url", "origin", join(scratch, "gone.git"));
  try {
    const s = sender();
    await waker(s.t3)({ root: w.root, good: good() }, NOW, warn);
    assert.equal(recordOf(w.root, code).state, "met", "on the local branch");
    await waker(s.t3)({ root: w.root, good: good() }, NOW, warn);
    assert.equal(s.sent.length, 1);
  } finally {
    git(w.root, "remote", "set-url", "origin", w.remote);
  }
  // The next write pushes it.
  Cmd.askCommand(w.root, ["0002", "Anything", "--thread", ASKER]);
  assert.equal(JSON.parse(git(w.remote, "show", `braid-requests:requests/${code}.json`)).events.at(-1).event, "met");
});

test("a record write that fails after a delivered wake is retried without waking again", async () => {
  const w = world();
  const code = codeOf(Cmd.askCommand(w.root, ["0001", "Later", "--done-when", "time:2026-11-23T11:00:00Z", "--thread", ASKER]));
  // A worktree on the record's branch makes every write refuse.
  const wt = join(mkdtempSync(join(scratch, "wt-")), "requests");
  git(w.root, "worktree", "add", "-q", wt, "braid-requests");
  const s = sender();
  const wake = waker(s.t3);
  warnings.length = 0;
  await wake({ root: w.root, good: good() }, NOW, warn);
  await wake({ root: w.root, good: good() }, NOW, warn);
  assert.equal(recordOf(w.root, code).state, "open");
  assert.match(warnings.join("\n"), new RegExp(`${code} \\(0001\\) couldn't be recorded as met`));
  git(w.root, "worktree", "remove", "--force", wt);
  await wake({ root: w.root, good: good() }, NOW, warn);
  assert.equal(recordOf(w.root, code).state, "met");
  assert.equal(s.sent.length, 1, "sent once in all three refreshes");
});

test("a held or paused asking braid's requests are neither closed nor woken until it resumes; an archived asker is closed without a send", async () => {
  const w = world();
  const held = codeOf(Cmd.askCommand(w.root, ["0001/A", "Later", "--done-when", "time:2026-11-23T11:00:00Z", "--thread", ASKER]));
  const gone = codeOf(Cmd.askCommand(w.root, ["0002", "Later too", "--done-when", "time:2026-11-23T11:00:00Z", "--thread", "archived-thread-1234"]));
  const s = sender();
  const wake = waker(s.t3);
  await wake({ root: w.root, good: good({ paused: ["0001"], archived: ["archived-thread-1234"] }) }, NOW, warn);
  assert.equal(recordOf(w.root, held).state, "open");
  assert.equal(recordOf(w.root, gone).state, "met");
  assert.equal(s.sent.length, 0);
  await wake({ root: w.root, good: good() }, NOW, warn);
  assert.deepEqual(s.sent.map((x) => x.thread), [ASKER], "woken once 0001 resumed");
});

test("a board write racing a CLI write from another clone: both land on origin", async () => {
  const w = world();
  const code = codeOf(Cmd.askCommand(w.root, ["0001", "Later", "--done-when", "time:2026-11-23T11:00:00Z", "--thread", ASKER]));
  const s = sender();
  let other = "";
  // Between the board's send and its write, a coordinator elsewhere opens a request and pushes it first.
  s.onSend(() => {
    git(w.worker, "fetch", "-q", "origin");
    other = codeOf(Cmd.askCommand(w.worker, ["0002", "Which rounding rule?", "--thread", ASKER]));
  });
  await waker(s.t3)({ root: w.root, good: good() }, NOW, warn);
  const onOrigin = (c: string) => JSON.parse(git(w.remote, "show", `braid-requests:requests/${c}.json`));
  assert.equal(onOrigin(code).events.at(-1).event, "met");
  assert.equal(onOrigin(other).events.at(-1).event, "opened");
});

test("the steerer runs the wake for each project after its pause steps", async () => {
  const seen: string[] = [];
  const st = steerer({ t3: () => Promise.resolve({ status: 0, stdout: "", stderr: "" }), wake: async (p: any) => void seen.push(p.root), warn: () => {} });
  st.observe({ name: "a", root: "/nowhere/a", repo: "a", folder: () => "/nowhere/a" }, { braids: [], t3: { states: new Map() }, board: { limits: null, programmes: [] } });
  await st.idle();
  assert.deepEqual(seen, ["/nowhere/a"]);
});

test("the wake message keeps shell characters out", () => {
  assert.equal(wakeMessage({ code: "q-abcd", text: 'Use "x" & <y>.' }, { state: "met", who: "board", text: "PR #5 merged" }), "Wake: q-abcd is met (PR #5 merged): Use x y. Go on where you left off.");
});

test("with a question and a wait open on one item, answer and withdraw by id refuse naming both codes, and forward hands on the question", () => {
  const w = world();
  writeFileSync(join(w.root, "braids", "0001-alpha", "brief.md"), brief("0001", "In Progress", `\n## Autonomy\n\nPM-run (thread ${ASKER}): security always ask.\n`));
  const question = codeOf(Cmd.askCommand(w.root, ["0001", "Which rounding rule?", "--thread", ASKER, "--to", "pm"]));
  const wait = codeOf(Cmd.askCommand(w.root, ["0001", "Go on after 0002", "--thread", ASKER, "--to", "0002", "--done-when", "braid:0002"]));
  const both = (e: Error) => e.message === `0001 has 2 open requests: ${nameOf(w.root, question)} (the coordinator's question), ${nameOf(w.root, wait)} (the coordinator's, waiting on braid 0002); give the name; nothing changed`;
  assert.throws(() => Cmd.answerCommand(w.root, w.root, ["0001"]), both);
  assert.throws(() => Cmd.withdrawCommand(w.root, ["0001", "--why", "not needed"]), both);
  // `--by coordinator` can't tell them apart: both are the coordinator's.
  assert.throws(() => Cmd.answerCommand(w.root, w.root, ["0001", "--by", "coordinator"]), both);
  assert.throws(() => Cmd.withdrawCommand(w.root, ["0001", "--why", "not needed", "--by", "coordinator"]), both);
  assert.deepEqual([recordOf(w.root, question).state, recordOf(w.root, wait).state], ["open", "open"], "nothing changed");
  assert.match(Cmd.forwardCommand(w.root, ["0001", "--note", "your call"]), /^0001: question request forwarded to the user: your call/);
  assert.deepEqual([recordOf(w.root, question).forwarded !== undefined, recordOf(w.root, wait).forwarded], [true, undefined], "the question is forwarded, the wait isn't");
  // By code, each one closes alone.
  assert.match(Cmd.withdrawCommand(w.root, [wait, "--why", "0002 is late"]), new RegExp(`^${nameOf(w.root, wait)} 0001: withdrawn`));
  assert.equal(recordOf(w.root, question).state, "open");
});

test("braid forward <id> with only a wait open changes nothing and says it is for that braid's coordinator", () => {
  const w = world();
  writeFileSync(join(w.root, "braids", "0001-alpha", "brief.md"), brief("0001", "In Progress", `
## Autonomy

PM-run (thread ${ASKER}): security always ask.
`));
  const wait = codeOf(Cmd.askCommand(w.root, ["0001", "Go on after 0002", "--thread", ASKER, "--to", "0002", "--done-when", "braid:0002"]));
  const before = JSON.stringify(recordOf(w.root, wait));
  assert.equal(Cmd.forwardCommand(w.root, ["0001", "--note", "your call"]), "0001: the question request is for braid 0002's coordinator; nothing changed\n");
  assert.equal(JSON.stringify(recordOf(w.root, wait)), before, "the wait is as it was");
});

// 0072/D: an answer recorded outside the asking thread (the PM's own, or the user's through the PM) wakes the asker once.
const { answerWakeMessage, ANSWER_WAKES_FROM }: any = await load("../../dist/board/wake.js");
const LATER = new Date("2026-11-27T12:00:00.000Z");
const answered = (root: string, code: string, by: string, text: string, at: string, reason?: string) =>
  Rec.endRequest(root, code, { state: "answered", who: by, text, at, ...(reason === undefined ? {} : { reason }) });
const marks = (root: string, code: string): number => recordOf(root, code).events.filter((e: any) => e.event === "reminded" && e.text === Rec.ANSWER_WOKEN).length;

test("a PM's answer recorded with braid answer --from pm wakes the asking thread once, across refreshes and a restarted board", async () => {
  const w = world();
  const code = codeOf(Cmd.askCommand(w.root, ["0001", "Which rounding rule?", "--thread", ASKER]));
  const file = join(mkdtempSync(join(scratch, "ans-")), "answer.txt");
  writeFileSync(file, "Half-up.\n");
  Cmd.answerCommand(w.root, w.root, [code, "--from", "pm", "--reason", 'the goal says "as the customer sees it"', "--file", file]);
  const s = sender();
  const now = new Date();
  await waker(s.t3)({ root: w.root, good: good() }, now, warn);
  assert.deepEqual(s.sent, [{ thread: ASKER, text: `Wake: ${nameOf(w.root, code)} answered by the PM: Half-up (reason: the goal says as the customer sees it). Recap it in one line, then act.` }]);
  assert.equal(recordOf(w.root, code).state, "answered", "still answered: the mark is not an ending");
  assert.deepEqual(recordOf(w.root, code).events.at(-1), { event: "reminded", at: now.toISOString(), by: "board", text: "answer sent to the asking thread" });
  await waker(s.t3)({ root: w.root, good: good() }, now, warn);
  await waker(s.t3)({ root: w.root, good: good() }, new Date(now.getTime() + 30_000), warn);
  assert.equal(s.sent.length, 1, "neither a refresh nor a restarted board sends again");
  assert.equal(marks(w.root, code), 1);
  // `braid requests <code>` still reads the request, with the mark in its history.
  assert.match(Cmd.requestsCommand(w.root, [code], { gh: w.opts.gh, now: () => now }), /reminded\s+.*answer sent to the asking thread/);
});

test("a second board finds the first one's mark and sends nothing; a mark is written only once", async () => {
  const w = world();
  const code = codeOf(Cmd.askCommand(w.root, ["0001", "Which rounding rule?", "--thread", ASKER]));
  answered(w.root, code, "pm", "Half-up.", "2026-11-27T11:00:00.000Z", "the goal");
  const a = sender();
  const b = sender();
  const boardA = waker(a.t3);
  const boardB = waker(b.t3);
  await boardB({ root: w.root, good: good() }, LATER, warn);
  await boardA({ root: w.root, good: good() }, LATER, warn);
  await boardB({ root: w.root, good: good() }, LATER, warn);
  assert.equal(a.sent.length + b.sent.length, 1);
  assert.equal(Rec.markAnswerWoken(w.root, code, LATER.toISOString()).added, false, "a second mark is refused inside the write");
  assert.equal(marks(w.root, code), 1);
});

test("a failed answer wake writes no mark and is sent at the next refresh, once", async () => {
  const w = world();
  const code = codeOf(Cmd.askCommand(w.root, ["0001", "Which rounding rule?", "--thread", ASKER]));
  answered(w.root, code, "pm", "Half-up.", "2026-11-27T11:00:00.000Z", "the goal");
  const s = sender();
  const wake = waker(s.t3);
  s.failNext(1);
  warnings.length = 0;
  await wake({ root: w.root, good: good() }, LATER, warn);
  assert.equal(marks(w.root, code), 0, "not marked: the wake isn't delivered");
  assert.match(warnings.join("\n"), new RegExp(`the wake of ${code} \\(0001\\) failed \\(t3 is not running\\)`));
  await wake({ root: w.root, good: good() }, LATER, warn);
  await wake({ root: w.root, good: good() }, LATER, warn);
  assert.equal(s.sent.length, 1);
  assert.equal(marks(w.root, code), 1);
});

test("a mark write that fails after a delivered answer wake is retried without waking again", async () => {
  const w = world();
  const code = codeOf(Cmd.askCommand(w.root, ["0001", "Which rounding rule?", "--thread", ASKER]));
  answered(w.root, code, "pm", "Half-up.", "2026-11-27T11:00:00.000Z", "the goal");
  const wt = join(mkdtempSync(join(scratch, "wt-")), "requests");
  git(w.root, "worktree", "add", "-q", wt, "braid-requests");
  const s = sender();
  const wake = waker(s.t3);
  warnings.length = 0;
  await wake({ root: w.root, good: good() }, LATER, warn);
  await wake({ root: w.root, good: good() }, LATER, warn);
  assert.equal(marks(w.root, code), 0);
  assert.match(warnings.join("\n"), new RegExp(`${code} \\(0001\\) couldn't be recorded as woken`));
  git(w.root, "worktree", "remove", "--force", wt);
  await wake({ root: w.root, good: good() }, LATER, warn);
  assert.equal(marks(w.root, code), 1);
  assert.equal(s.sent.length, 1, "sent once in all three refreshes");
});

test("an answer to an archived asker is skipped; a held braid's answer waits until it resumes", async () => {
  const w = world();
  const gone = codeOf(Cmd.askCommand(w.root, ["0002", "Later too", "--thread", "archived-thread-1234"]));
  const held = codeOf(Cmd.askCommand(w.root, ["0001/A", "Which rounding rule?", "--thread", ASKER]));
  answered(w.root, gone, "pm", "Yes.", "2026-11-27T11:00:00.000Z", "the goal");
  answered(w.root, held, "pm", "Half-up.", "2026-11-27T11:00:00.000Z", "the goal");
  const s = sender();
  const wake = waker(s.t3);
  await wake({ root: w.root, good: good({ paused: ["0001"], archived: ["archived-thread-1234"] }) }, LATER, warn);
  assert.equal(s.sent.length, 0);
  assert.deepEqual([marks(w.root, gone), marks(w.root, held)], [0, 0]);
  await wake({ root: w.root, good: good({ archived: ["archived-thread-1234"] }) }, LATER, warn);
  assert.deepEqual(s.sent.map((x) => x.thread), [ASKER], "woken once 0001 resumed; the archived thread never");
});

test("an answer recorded in the asker's own thread wakes no one; the user's answer through the PM wakes the coordinator", async () => {
  const w = world();
  writeFileSync(join(w.root, "braids", "0001-alpha", "brief.md"), brief("0001", "In Progress", `\n## Autonomy\n\nPM-run (thread ${ASKER}): security always ask.\n`));
  // The coordinator asked the user straight and recorded the user's answer itself.
  const own = codeOf(Cmd.askCommand(w.root, ["0002", "Which tax table?", "--thread", ASKER]));
  answered(w.root, own, "user", "B.", "2026-11-27T11:00:00.000Z");
  // The PM asked the user itself and recorded the user's answer.
  const pms = codeOf(Cmd.askCommand(w.root, ["0001", "Merge now?", "--by", "pm", "--thread", "pm-thread-1"]));
  answered(w.root, pms, "user", "Yes.", "2026-11-27T11:00:00.000Z");
  // A coordinator's question to the PM, forwarded to the user, whose answer the PM records.
  const fwd = codeOf(Cmd.askCommand(w.root, ["0001/A", "Which rounding rule?", "--thread", "coord-thread-1", "--to", "pm"]));
  Cmd.forwardCommand(w.root, ["0001/A", "--note", "your call"]);
  answered(w.root, fwd, "user", "Half-up.", "2026-11-27T11:00:00.000Z");
  const s = sender();
  await waker(s.t3)({ root: w.root, good: good() }, LATER, warn);
  assert.deepEqual(s.sent, [{ thread: "coord-thread-1", text: `Wake: ${nameOf(w.root, fwd)} answered by the user: Half-up. Recap it in one line, then act.` }]);
  assert.deepEqual([marks(w.root, own), marks(w.root, pms)], [0, 0]);
});

test("old answers wake no one: before this version, or older than a day", async () => {
  const w = world();
  const before = codeOf(Cmd.askCommand(w.root, ["0001", "Which rounding rule?", "--thread", ASKER]));
  const stale = codeOf(Cmd.askCommand(w.root, ["0002", "Which tax table?", "--thread", ASKER]));
  answered(w.root, before, "pm", "Half-up.", new Date(Date.parse(ANSWER_WAKES_FROM) - 60_000).toISOString(), "the goal");
  const s = sender();
  await waker(s.t3)({ root: w.root, good: good() }, new Date(Date.parse(ANSWER_WAKES_FROM) + 3600_000), warn);
  answered(w.root, stale, "pm", "B.", new Date(LATER.getTime() - 25 * 3600_000).toISOString(), "the goal");
  await waker(s.t3)({ root: w.root, good: good() }, LATER, warn);
  assert.equal(s.sent.length, 0);
  assert.deepEqual([marks(w.root, before), marks(w.root, stale)], [0, 0]);
});

test("the answer wake message keeps shell characters out and leaves out what the answer doesn't have", () => {
  assert.equal(answerWakeMessage({ code: "q-abcd" }, { by: "pm", text: 'Use "x" & <y>.', reason: "100% sure!" }), "Wake: q-abcd answered by the PM: Use x y (reason: 100 sure). Recap it in one line, then act.");
  assert.equal(answerWakeMessage({ code: "q-abcd", words: "yellow bear" }, { by: "board" }), "Wake: yellow-bear-abcd answered by the board. Recap it in one line, then act.");
});
