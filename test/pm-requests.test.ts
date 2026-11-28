import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

// Requests addressed to the PM (0062/B): the lane and escalation rules, the pushes, the commands, and the hold in the pause store.
// Computed specifiers keep the compiled modules out of the typecheck.
const load = (path: string) => import(pathToFileURL(fileURLToPath(new URL(path, import.meta.url))).href);
/* eslint-disable @typescript-eslint/no-explicit-any */
const model: any = await load("../dist/board/model.js");
const signals: any = await load("../dist/board/signals.js");
const marks: any = await load("../dist/board/marks.js");
const pauseMod: any = await load("../dist/board/pause.js");
const message: any = await load("../dist/notify/message.js");
const sender: any = await load("../dist/notify/sender.js");
const notifierMod: any = await load("../dist/notify/notifier.js");
const { askCommand, forwardCommand, requestsCommand, handoverCommand }: any = await load("../dist/commands/requests.js");
const { pauseCommand, resumeCommand }: any = await load("../dist/commands/pauses.js");
const { loadRequests }: any = await load("../dist/braids/requests.js");
const { loadPauses, setPause, readPausesFile }: any = await load("../dist/braids/pauses.js");
const { statusCommand }: any = await load("../dist/commands/coordinate.js");

const NOW = new Date("2026-11-22T12:00:00Z");
const ago = (minutes: number) => new Date(NOW.getTime() - minutes * 60_000).toISOString();
const KEY = "0001/A";
const PM = "11111111-aaaa-4bbb-8ccc-222222222222";

const gh = (pr: object | null = null): any => ({ status: { state: "ok" }, prs: new Map(pr === null ? [] : [[KEY, pr]]) });
const PR = { number: 7, url: "u", state: "open", checks: "passing" };
/** T3 as read: the PM thread has this status (null: unknown to T3); `ok` false: T3 couldn't be read. */
const t3 = (pm: string | null = "idle", ok = true): any => ({ status: ok ? { state: "ok" } : { state: "unavailable", reason: "x" }, threads: new Map(), states: new Map(pm === null ? [] : [[PM, pm]]) });
const request = (kind: string, minutes: number, extra: object = {}): any => ({ id: KEY, kind, text: `a ${kind} text`, at: ago(minutes), thread: null, to: "pm", pm: PM, ...extra });
const hold = (extra: object = {}): any => ({ braid: "0001", reason: "hold", words: "Please freeze work", provider: null, window: null, label: null, usedPercent: null, resetsAt: null, resumeAt: null, task: null, thread: PM, by: "pm", at: ago(30), ...extra });
const limit = (extra: object = {}): any => ({ braid: "0001", provider: "claude", window: "five_hour", label: "Session", usedPercent: 97, resetsAt: ago(-5), resumeAt: ago(-10), task: null, thread: PM, by: "pm", at: ago(30), ...extra });

function sig(requests: object[], pauses: object[] = []): any {
  const clock = signals.brokeClock({}, NOW);
  return { now: NOW, requests: new Map(requests.map((r) => [(r as { id: string }).id, r])), pauses: new Map(pauses.map((p) => [(p as { braid: string }).braid, p])), alarm: clock.alarm };
}
const derive = (status: string, g: object, t: object, s: object, accepted: string | null = null): any => model.derive(status, [], KEY, g, t, s, accepted);

test("a request to the PM keeps the lane the other state gives, with the PM line and no need", () => {
  const working = derive("In Progress", gh(PR), t3(), sig([request("question", 3)]));
  assert.equal(working.lane, "In Progress");
  assert.equal(working.need, null);
  assert.equal(working.reason, null);
  assert.equal(working.pm.text, "The PM is handling: a question text");
  assert.equal(working.pm.age, "3m");
  const todo = derive("To Do", gh(), t3(), sig([request("decision", 3)]));
  assert.equal(todo.lane, "To Do");
  assert.equal(todo.pm.text, "The PM is handling: a decision text");
  // A handover is "checking", and the PR still reads Working (not To Review) until it comes to the user.
  const review = derive("In Progress", gh(PR), t3(), sig([request("review", 3, { pr: 7 })]));
  assert.equal(review.lane, "In Progress");
  assert.equal(review.pm.text, "The PM is checking: PR #7, its live check runs");
  // Nothing reads stalled while the PM has it: something was asked.
  const stall = derive("In Progress", gh(), t3(), { ...sig([request("question", 15)]), alarm: signals.brokeClock({ [`${KEY} stalled`]: ago(30) }, NOW).alarm });
  assert.equal(stall.lane, "In Progress");
});

test("a request without `to` reads as the user's, as before", () => {
  const old = { id: KEY, kind: "question", text: "old one", at: ago(300), thread: null };
  const d = derive("In Progress", gh(), t3(null), sig([old]));
  assert.equal(d.lane, "Waiting");
  assert.equal(d.need.text, "old one");
  assert.equal(d.need.via, undefined);
  assert.equal(d.pm, null);
  assert.equal(derive("In Progress", gh(), t3(null), sig([{ ...old, to: "user" }])).lane, "Waiting");
});

test("a question escalates after 20 min and a handover after 60, to Needs You and To Review", () => {
  assert.equal(derive("In Progress", gh(), t3(), sig([request("question", 19)])).lane, "In Progress");
  const q = derive("In Progress", gh(), t3(), sig([request("question", 21)]));
  assert.equal(q.lane, "Waiting");
  assert.equal(q.reason, "question");
  assert.equal(q.need.via, "timeout");
  assert.equal(q.need.text, "Escalated to you: a question text (the PM hasn't answered for 21 min)");
  assert.equal(q.pm, null);
  for (const kind of ["decision", "plan"]) {
    assert.equal(derive("In Progress", gh(), t3(), sig([request(kind, 20)])).lane, "Waiting", kind);
  }
  assert.equal(derive("In Progress", gh(PR), t3(), sig([request("review", 59, { pr: 7 })])).lane, "In Progress");
  const h = derive("In Progress", gh(PR), t3(), sig([request("review", 61, { pr: 7 })]));
  assert.equal(h.lane, "In Review");
  assert.equal(h.need.via, "timeout");
  assert.equal(h.need.text, "Escalated to you: Merge PR #7 (the PM hasn't answered for 1 h)");
});

test("a PM thread that is archived, failed or unknown escalates at once; a running or idle one doesn't; unreadable T3 can't tell", () => {
  for (const state of ["archived", "failed", null]) {
    const d = derive("In Progress", gh(), t3(state), sig([request("question", 1)]));
    assert.equal(d.lane, "Waiting", String(state));
    assert.equal(d.need.via, "gone");
    assert.equal(d.need.text, "Escalated to you: a question text (the PM thread is gone)");
  }
  for (const state of ["running", "idle", "ready"]) {
    assert.equal(derive("In Progress", gh(), t3(state), sig([request("question", 1)])).lane, "In Progress", state);
  }
  assert.equal(derive("In Progress", gh(), t3(null, false), sig([request("question", 1)])).lane, "In Progress");
  // Without a recorded PM thread there is no one to ask: it counts as gone.
  assert.equal(derive("In Progress", gh(), t3("running"), sig([request("question", 1, { pm: undefined })])).lane, "Waiting");
});

test("the PM's forward reads as the user's with 'Forwarded by the PM:' and the note", () => {
  const forwarded = request("question", 2, { to: "user", forwarded: ago(1), note: "needs your call" });
  const d = derive("In Progress", gh(), t3("running"), sig([forwarded]));
  assert.equal(d.lane, "Waiting");
  assert.equal(d.need.via, "forwarded");
  assert.equal(d.need.since, ago(1));
  assert.equal(d.need.text, "Forwarded by the PM: a question text — needs your call");
  const h = derive("In Progress", gh(PR), t3("running"), sig([{ ...forwarded, kind: "review", pr: 7 }]));
  assert.equal(h.lane, "In Review");
  assert.equal(h.need.text, "Forwarded by the PM: Merge PR #7 — needs your call");
});

test("a paused or held braid never escalates a request to the PM", () => {
  for (const pause of [hold(), limit()]) {
    const d = derive("In Progress", gh(), t3("archived"), sig([request("question", 120)], [pause]));
    assert.equal(d.lane, "In Progress", "neither a timeout nor a gone thread escalates");
    assert.equal(d.need, null);
    assert.equal(d.pm.text, "The PM is handling: a question text");
  }
  // Without the pause the same request escalates.
  assert.equal(derive("In Progress", gh(), t3("archived"), sig([request("question", 120)])).lane, "Waiting");
});

const braidOf = (strands: boolean): any => ({
  number: "0001",
  folder: "braids/0001-a",
  brief: { id: "0001", title: "A", status: "In Progress", labels: [], dependencies: [] },
  strands: strands ? [{ letter: "A", folder: "braids/0001-a/A", brief: { id: "0001/A", title: "S", status: "In Progress", labels: [], dependencies: [] } }] : [],
});

test("a braid card shows its strand's PM line; the braid's own request to the PM leaves the card's lane alone", () => {
  const card = model.toCard(braidOf(true), gh(PR), t3(), sig([request("question", 3)]));
  assert.equal(card.lane, "In Progress");
  assert.equal(card.strands[0].pm.text, "The PM is handling: a question text");
  assert.equal(card.pm.text, card.strands[0].pm.text);
  assert.equal(card.need, null);
  const own = model.toCard(braidOf(true), gh(PR), t3(), sig([{ ...request("plan", 3), id: "0001" }]));
  assert.equal(own.lane, "In Progress");
  assert.equal(own.pm.text, "The PM is handling: a plan text");
  const late = model.toCard(braidOf(true), gh(PR), t3(), sig([{ ...request("plan", 30), id: "0001" }]));
  assert.equal(late.lane, "Waiting");
  assert.equal(late.need.via, "timeout");
});

test("the compass mark and the Merge button: a request the PM handles shows 🧭 and offers no merge", () => {
  const s = sig([{ ...request("review", 3, { pr: 7 }), id: "0001", head: "abc" }]);
  const card = model.toCard(braidOf(false), { status: { state: "ok" }, prs: new Map([["0001", { ...PR, head: "abc" }]]) }, t3(), s);
  assert.equal(card.merge, null);
  assert.match(marks.cardMarks(card).pm, /^The PM is checking: PR #7/);
  const need = { kind: "question", text: "x", verb: "asked", age: "1m", since: null, key: null, pr: null, who: null, more: 0 };
  assert.equal(marks.cardMarks({ ...card, lane: "Waiting", need }).pm, null);
});

const board = (card: object): any => ({ repo: "agento", github: { state: "ok" }, t3: { state: "ok" }, braids: [card] });
const cardOf = (d: any): any => ({ id: "0001", title: "T", lane: d.lane, need: d.need, pm: d.pm, thread: null, pr: null, strands: [], coordinator: { link: "http://127.0.0.1:3773/env1/thread1" } });

test("a request the PM handles is never pushed; an escalation or forward is pushed once at high priority, a handover too", () => {
  const handled = derive("In Progress", gh(), t3(), sig([request("question", 3)]));
  assert.deepEqual(message.pushesOf(board(cardOf(handled))), []);
  const escalated = derive("In Progress", gh(), t3(), sig([request("question", 30)]));
  const [a] = message.pushesOf(board(cardOf(escalated)));
  assert.match(a.title, /agento 0001: Escalated to you$/);
  assert.equal(a.priority, "high");
  assert.equal(a.click, "t3code://threads/env1/thread1");
  assert.equal(a.sequence, "braid-agento-0001");
  const review = derive("In Progress", gh(PR), t3(), sig([request("review", 90, { pr: 7 })]));
  const [b] = message.pushesOf(board(cardOf(review)));
  assert.match(b.title, /agento 0001: Escalated to you$/);
  assert.equal(b.priority, "high", "an escalated handover is high; an ordinary review stays default");
  const fwd = derive("In Progress", gh(), t3(), sig([request("question", 1, { to: "user", forwarded: ago(0) })]));
  const [c] = message.pushesOf(board(cardOf(fwd)));
  assert.match(c.title, /agento 0001: the PM asks$/);
  assert.equal(c.tags[0], "compass");
  assert.equal(c.body, "T\ndecide\nThe PM asks you: a question text");
  assert.notEqual(c.key, a.key);
  const ordinary = derive("In Progress", gh(PR), t3(), sig([{ id: KEY, kind: "review", text: "r", at: ago(5), thread: null, pr: 7 }]));
  assert.equal(message.pushesOf(board(cardOf(ordinary)))[0].priority, "default");
});

test("push priority has a low level (ntfy priority 2), and the sequence ID goes into the JSON", () => {
  const cfg = { server: "https://ntfy.example", topic: "t", enabled: true };
  const base = { title: "t", body: "b", tags: [], click: null, sequence: null };
  assert.equal(sender.ntfyBody(cfg, { ...base, priority: "low" }).priority, 2);
  assert.equal(sender.ntfyBody(cfg, { ...base, priority: "high" }).priority, 4);
  assert.equal("sequence_id" in sender.ntfyBody(cfg, { ...base, priority: "default" }), false);
  assert.equal(sender.ntfyBody(cfg, { ...base, priority: "default", sequence: "braid-x-0001" }).sequence_id, "braid-x-0001");
});

test("the real clearer PUTs <server>/<topic>/<sequence>/clear with the token, and names no topic on errors", async () => {
  const calls: { url: string; method: string; auth: string | null }[] = [];
  const fetcher = (async (url: string, init: RequestInit) => {
    calls.push({ url, method: String(init.method), auth: (init.headers as Record<string, string>).authorization ?? null });
    return new Response(null, { status: url.includes("bad") ? 500 : 200 });
  }) as unknown as typeof fetch;
  const clear = sender.ntfyClearer(fetcher);
  const cfg = { server: "https://ntfy.example", topic: "braid-secret", enabled: true };
  await clear(cfg, "braid-agento-0001", "tok");
  assert.deepEqual(calls, [{ url: "https://ntfy.example/braid-secret/braid-agento-0001/clear", method: "PUT", auth: "Bearer tok" }]);
  await assert.rejects(clear(cfg, "bad", null), (e: Error) => /HTTP 500/.test(e.message) && !e.message.includes("braid-secret"));
});

test("a push is cleared when its request closes, once, and not when the item has a push again", async () => {
  const dir = mkdtempSync(join(tmpdir(), "braid-pm-notify-"));
  after(() => rmSync(dir, { recursive: true, force: true }));
  const sent: string[] = [];
  const cleared: string[] = [];
  const notify = notifierMod.notifier({
    file: join(dir, "notified.json"),
    config: () => ({ server: "https://ntfy.example", topic: "braid-abcdefghijklmnopqrstuvwx", enabled: true }),
    send: async (_c: unknown, p: { sequence: string | null }) => void sent.push(p.sequence ?? ""),
    clear: async (_c: unknown, sequence: string) => void cleared.push(sequence),
    token: () => null,
    warn: () => {},
  });
  const asking = board(cardOf(derive("In Progress", gh(), t3(), sig([request("question", 30)]))));
  notify(asking);
  await notify.idle();
  notify(asking);
  await notify.idle();
  assert.deepEqual(sent, ["braid-agento-0001"]);
  assert.deepEqual(cleared, []);
  // Answered: the need is gone, so the push leaves the phone, once.
  const answered = board(cardOf(derive("In Progress", gh(), t3(), sig([]))));
  notify(answered);
  await notify.idle();
  notify(answered);
  await notify.idle();
  assert.deepEqual(cleared, ["braid-agento-0001"]);
  // A new need of the same item replaces the old push by its sequence ID: no clear in between.
  notify(asking);
  await notify.idle();
  notify(board(cardOf(derive("In Progress", gh(PR), t3(), sig([request("review", 90, { pr: 7 })])))));
  await notify.idle();
  assert.deepEqual(cleared, ["braid-agento-0001"]);
  assert.equal(sent.length, 3);
});

test("a forward made during a pause or hold reads with the PM until resume, then escalates", () => {
  const forwarded = request("question", 2, { to: "user", forwarded: ago(1), note: "your call" });
  for (const pause of [hold(), limit()]) {
    const d = derive("In Progress", gh(), t3("running"), sig([forwarded], [pause]));
    assert.equal(d.lane, "In Progress");
    assert.equal(d.need, null);
    assert.equal(d.pm.text, "The PM is handling: a question text");
    assert.deepEqual(message.pushesOf(board(cardOf(d))), []);
  }
  // After `braid resume` the pause record is gone and the forward reaches the user.
  const after = derive("In Progress", gh(), t3("running"), sig([forwarded]));
  assert.equal(after.lane, "Waiting");
  assert.equal(after.need.via, "forwarded");
  // Merge stays off for a forwarded handover during a pause.
  const s = sig([{ ...request("review", 3, { pr: 7, to: "user", forwarded: ago(1) }), id: "0001", head: "abc" }], [hold()]);
  const card = model.toCard(braidOf(false), { status: { state: "ok" }, prs: new Map([["0001", { ...PR, head: "abc" }]]) }, t3("running"), s);
  assert.equal(card.merge, null);
});

// ---- commands ----

const scratch = mkdtempSync(join(tmpdir(), "braid-pm-requests-"));
after(() => rmSync(scratch, { recursive: true, force: true }));
const git = (cwd: string, ...args: string[]) => {
  const r = spawnSync("git", args, { cwd, encoding: "utf8" });
  assert.equal(r.status, 0, `git ${args.join(" ")}: ${r.stderr}`);
};
const brief = (id: string, status: string, extra = "") => `---\nid: '${id}'\ntitle: "T ${id}"\nstatus: ${status}\nlabels: []\ndependencies: []\n---\n\n## Goal\n\nx\n${extra}`;

/** Braid 0001 has a PM-run line; braid 0002 has none. */
function project(pm: string = PM): string {
  const root = mkdtempSync(join(scratch, "p-"));
  const put = (path: string, text: string) => {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  };
  git(root, "init", "-q", "-b", "main");
  put("BRAID.md", "---\nmain: main\n---\n");
  put("braids/0001-a/brief.md", brief("0001", "In Progress", `\n## Autonomy\n\nPM-run (thread ${pm}): security always ask.\n`));
  put("braids/0001-a/A-x/brief.md", brief("0001/A", "In Progress"));
  put("braids/0002-b/brief.md", brief("0002", "In Progress"));
  git(root, "-c", "user.email=t@example.com", "-c", "user.name=t", "add", "-A");
  git(root, "-c", "user.email=t@example.com", "-c", "user.name=t", "commit", "-q", "-m", "init");
  return root;
}

test("braid ask --to pm stores the PM thread from the brief's PM-run line, and fails without one, opening nothing", () => {
  const root = project();
  const out = askCommand(root, ["0001/A", "Which name?", "--to", "pm", "--kind", "decision"], { now: () => NOW });
  assert.match(out, /decision request to the PM opened/);
  const [r] = loadRequests(root);
  assert.equal(r.to, "pm");
  assert.equal(r.pm, PM);
  assert.throws(() => askCommand(root, ["0002", "x", "--to", "pm"]), /needs braid 0002's brief to have a "PM-run \(thread <id>\)" line/);
  assert.throws(() => askCommand(root, ["0001", "x", "--to", "nobody"]), /--to is user, pm or a braid number/);
  assert.equal(loadRequests(root).length, 1, "the refused ask opened nothing");
  askCommand(root, ["0001", "for you", "--to", "user"], { now: () => NOW });
  assert.equal(loadRequests(root).find((x: { id: string }) => x.id === "0001").to, undefined);
  // Real T3 ids carry `:`, `%` and `.`: any id up to the closing parenthesis is taken.
  for (const id of ["mcp:launch:aaaaaaaa11111111", "thread:delegated-task:command%3A7b2f.9", "mcp:8b23b4e6-161b-4f0c-ae32-37abd5c25d5f"]) {
    const p = project(id);
    askCommand(p, ["0001", "x", "--to", "pm"], { now: () => NOW });
    assert.equal(loadRequests(p)[0].pm, id);
  }
  return assert.rejects(Promise.resolve().then(() => handoverCommand(root, ["0002", "--head", "abcdef0", "--to", "pm"], {})), /PM-run/);
});

test("braid requests shows the addressee; braid forward hands the request on once, with a note", async () => {
  const root = project();
  askCommand(root, ["0001/A", "Which name?", "--to", "pm"], { now: () => NOW });
  askCommand(root, ["0001", "Approve?", "--kind", "plan"], { now: () => NOW });
  const list = (await requestsCommand(root, [], { now: () => NOW })) as string;
  assert.match(list, /^[a-z]+-[a-z]+-[a-z0-9]{4} {2}0001 {2}plan {2}0m {2}blocks 0001\/A · decide {2}Approve\?$/m);
  assert.match(list, /^[a-z]+-[a-z]+-[a-z0-9]{4} {2}0001\/A {2}question {2}0m {2}blocks 0001\/A · decide {2}to the PM {2}Which name\?$/m);
  assert.match(forwardCommand(root, ["0001/A", "--note", "your call: it changes the name"], { now: () => NOW }), /0001\/A: question request forwarded to the user: your call: it changes the name/);
  const f = loadRequests(root).find((x: { id: string }) => x.id === "0001/A");
  assert.deepEqual([f.to, f.forwarded, f.note], ["user", NOW.toISOString(), "your call: it changes the name"]);
  assert.match((await requestsCommand(root, [], { now: () => NOW })) as string, /forwarded by the PM {2}Which name\?/);
  assert.match(forwardCommand(root, ["0001/A"], { now: () => NOW }), /already the user's \(forwarded\); nothing changed/);
  assert.match(forwardCommand(root, ["0001"], { now: () => NOW }), /already the user's; nothing changed/);
  assert.throws(() => forwardCommand(root, ["0002"], {}), /no open request to forward/);
});

// ---- the hold ----

test("a hold: no provider or resume time, shown paused with its words, never amber or stalled, resume clears it", () => {
  const root = project();
  const out = pauseCommand(root, ["0001", "--hold", "Please   freeze work", "--thread", PM, "--by", "pm"], { now: NOW });
  assert.match(out, /^0001 held: Held: “Please freeze work” \(by PM 11111111 at \d\d:\d\d/);
  const [p] = loadPauses(root).pauses;
  assert.deepEqual([p.reason, p.words, p.provider, p.resumeAt, p.window, p.task, p.by], ["hold", "Please freeze work", null, null, null, null, "pm"]);
  assert.match(pauseCommand(root, ["0001", "--hold", "Please freeze work", "--thread", PM, "--by", "pm"], { now: new Date(NOW.getTime() + 1000) }), /already held, unchanged/);
  // Days later it is still paused: no due or over phase.
  const later = new Date(NOW.getTime() + 5 * 86_400_000);
  const view = pauseMod.pauseView(p, later);
  assert.deepEqual([view.state, view.phase], ["paused", "paused"]);
  assert.equal(view.text, "Held: “Please freeze work”");
  assert.match(view.note, /^held by the PM since /);
  const box = pauseMod.pauseBox(view, later);
  assert.match(box.head, /^Held · since /);
  assert.match(box.foot, /braid resume 0001 clears it/);
  assert.equal(pauseMod.laneNote(view), "held");
  // On the board: a held item that nobody works on is not stalled, however long it lasts.
  const clock = signals.brokeClock({ [`${KEY} stalled`]: new Date(later.getTime() - 3_600_000).toISOString() }, later);
  const d = derive("In Progress", gh(), t3(), { now: later, requests: new Map(), pauses: new Map([["0001", p]]), alarm: clock.alarm });
  assert.equal(d.lane, "In Progress");
  assert.equal(d.pause.text, "Held: “Please freeze work”");
  assert.match(resumeCommand(root, ["0001"], { now: NOW }), /^0001 resumed: cleared Held: “Please freeze work”/);
  assert.deepEqual(loadPauses(root).pauses, []);
});

test("pause --hold refuses provider options, empty words and a missing thread; a limit still needs --provider", () => {
  const root = project();
  assert.throws(() => pauseCommand(root, ["0001", "--hold", "x", "--provider", "p", "--thread", PM]), /--hold takes no --provider/);
  assert.throws(() => pauseCommand(root, ["0001", "--hold", "  ", "--thread", PM]), /--hold needs the words/);
  assert.throws(() => pauseCommand(root, ["0001", "--hold", "x"]), /usage: braid pause/);
  assert.throws(() => pauseCommand(root, ["0001", "--thread", PM]), /usage: braid pause/);
  assert.deepEqual(loadPauses(root).pauses, []);
});

test("0061's limit records without `reason` still read as limits and go overdue as before; a malformed hold is left out", () => {
  const root = project();
  setPause(root, limit({ resumeAt: ago(30) }));
  const file = join(root, ".braid", "pauses.json");
  assert.equal(JSON.parse(readFileSync(file, "utf8"))[0].reason, undefined);
  const read = readPausesFile(file);
  assert.equal(read.pauses.length, 1);
  assert.equal(pauseMod.phaseOf(read.pauses[0], NOW), "over", "30 min past the resume: the stalled phase, as in 0061");
  assert.match(pauseMod.pauseView(read.pauses[0], NOW).text, /resume was due/);
  writeFileSync(file, JSON.stringify([hold({ words: "" }), hold({ provider: "claude" }), hold({ resumeAt: ago(1) }), limit({ reason: "limit", provider: null }), hold()]));
  const bad = readPausesFile(file);
  assert.equal(bad.pauses.length, 1);
  assert.match(bad.note, /4 records not readable/);
});

test("braid status shows a request to the PM and a hold", async () => {
  const root = project();
  askCommand(root, ["0001/A", "Which name?", "--to", "pm"], { now: () => new Date(Date.now() - 3 * 60_000) });
  pauseCommand(root, ["0001", "--hold", "Freeze", "--thread", PM, "--by", "pm"], { now: new Date() });
  const ok = (data: unknown) => ({ status: 0, stdout: JSON.stringify(data), stderr: "" });
  const out = (await statusCommand(root, ["1"], { gh: () => ok([]), t3: () => Promise.resolve(ok([{ threadId: PM, status: "idle" }])) })) as string;
  assert.match(out, /🧭 The PM is handling: Which name\? \(to the PM 3m ago\)/);
  assert.match(out, /Held: “Freeze”/);
  assert.equal(existsSync(join(root, ".braid", "pauses.json")), true);
});

test("T3's thread ids are kept exactly as given: a PM thread whose id matches byte for byte reads as running", async () => {
  const mixed = "AbCd1111-aaaa-4bbb-8ccc-222222222222";
  const run = async (_root: string, args: readonly string[]) => ({
    status: 0,
    stderr: "",
    stdout: args[0] === "thread" && args[1] === "list" ? JSON.stringify([{ threadId: mixed, status: "running", title: "PM" }]) : "{}",
  });
  const t3mod: any = await load("../dist/board/t3.js");
  const read = await t3mod.readT3("/nowhere", { run, agents: "/agents", project: "/p", reviews: [] });
  assert.equal(read.states.get(mixed), "running");
  const pmMod: any = await load("../dist/board/pm.js");
  assert.equal(pmMod.pmGone(read, mixed), false);
  assert.equal(pmMod.pmGone(read, mixed.toLowerCase()), true, "a different case is a different thread, as in T3");
});

test("a gone need is cleared even when its item has a Done push in the same snapshot", async () => {
  const dir = mkdtempSync(join(tmpdir(), "braid-pm-notify-"));
  after(() => rmSync(dir, { recursive: true, force: true }));
  const cleared: string[] = [];
  const notify = notifierMod.notifier({
    file: join(dir, "notified.json"),
    config: () => ({ server: "https://ntfy.example", topic: "braid-abcdefghijklmnopqrstuvwx", enabled: true }),
    send: async () => {},
    clear: async (_c: unknown, sequence: string) => void cleared.push(sequence),
    token: () => null,
    warn: () => {},
  });
  notify(board(cardOf(derive("In Progress", gh(), t3(), sig([request("question", 30)])))));
  await notify.idle();
  const done = { ...cardOf(derive("In Progress", gh(), t3(), sig([]))), lane: "Done", need: null };
  notify(board(done));
  await notify.idle();
  assert.deepEqual(cleared, ["braid-agento-0001"]);
});

test("a hold with no words (a plan's state: held) reads without empty quotes", () => {
  const view = pauseMod.pauseView({ ...hold(), words: null }, NOW);
  assert.equal(view.text, "Held: the plan says held");
  assert.equal(pauseMod.pauseView({ ...hold(), words: "  " }, NOW).text, "Held: the plan says held");
});

test("0069/A: a story accepted with its PR open and a review forwarded by the PM is To Review, forwarded, pushed once (0068's case)", () => {
  const forwarded = request("review", 5, { pr: 7, to: "user", forwarded: ago(1), note: "live check passed · merge PR #7" });
  // `braid accept` records the acceptance on the record branch; the brief keeps In Progress (statusOf gives `accepted`).
  const d = derive("In Progress", gh(PR), t3(), sig([forwarded]), "abc1234");
  assert.equal(d.lane, "In Review");
  assert.equal(d.need.via, "forwarded");
  assert.match(d.need.text, /live check passed/);
  const pushes = message.pushesOf(board({ ...cardOf(d), pr: { number: 7 } }));
  assert.equal(pushes.length, 1);
  assert.match(pushes[0].title, /the PM asks$/);
  assert.equal(pushes[0].priority, "high");
  // While the PM still checks it, the acceptance shows the merge as To Review but the card says the PM is on it.
  const handled = derive("In Progress", gh(PR), t3(), sig([request("review", 5, { pr: 7 })]), "abc1234");
  assert.equal(handled.lane, "In Review");
  // When the PR lookup misses the story's PR, the item isn't Done (no merge seen), so the open request still decides.
  const missed = derive("In Progress", gh(), t3(), sig([forwarded]));
  assert.equal(missed.lane, "In Review");
  assert.equal(missed.need.via, "forwarded");
  assert.equal(message.pushesOf(board({ ...cardOf(missed), pr: null })).length, 1, "the missed PR is pushed once too");
  // Still with the PM: a missed PR and a review read Working with the PM line, never Done or To Review.
  const still = derive("In Progress", gh(), t3(), sig([request("review", 5, { pr: 7 })]));
  assert.equal(still.lane, "In Progress");
  assert.equal(still.need, null);
  assert.equal(still.pm.text, "The PM is checking: PR #7, its live check runs");
  assert.deepEqual(message.pushesOf(board({ ...cardOf(still), pr: null })), []);
  // Done (a merged PR, or an older stored Done with no PR) is Done whatever is open.
  assert.equal(derive("Done", gh(), t3(), sig([])).lane, "Done");
  assert.equal(derive("Done", gh({ ...PR, state: "merged" }), t3(), sig([forwarded])).lane, "Done");
});

test("0075/B fix round: a strand stamped Done by an older CLI whose PR the lookup missed keeps its forwarded review: To Review, as before 0075 (0068, 0069/A)", () => {
  const forwarded = request("review", 5, { pr: 7, to: "user", forwarded: ago(1), note: "live check passed · merge PR #7" });
  const braid = { number: "0001", folder: "braids/0001-x", source: null, brief: { id: "0001", title: "T", status: "In Progress", labels: [], dependencies: [], related: [], order: null, delivery: "epic", autonomy: null, sections: [] }, strands: [{ letter: "A", folder: "braids/0001-x/A-a", source: null, brief: { id: "0001/A", title: "A", status: "Done", labels: [], dependencies: [], related: [], order: 1, delivery: "epic", autonomy: null, sections: [] } }] };
  const card = model.toCard(braid, gh(), t3(), sig([forwarded]));
  assert.deepEqual([card.strands[0].status, card.strands[0].lane], ["To Do", "In Review"]);
  // Without the request, the stored Done reads Done, as before.
  assert.equal(model.toCard(braid, gh(), t3(), sig([])).strands[0].lane, "Done");
});

test("0078/G: a stored Done whose PR the lookup missed, its review with the PM or forwarded under a programme: a braid with strands reads Working, a story To Do", () => {
  const brief = (id: string, status: string) => ({ id, title: "T", status, labels: [], dependencies: [], related: [], order: 1, delivery: "epic", autonomy: null, sections: [] });
  const goal: any = { number: "0001", folder: "braids/0001-x", source: null, brief: brief("0001", "Done"), strands: [{ letter: "A", folder: "braids/0001-x/A-a", source: null, brief: brief("0001/A", "Done") }] };
  const story: any = { ...goal, strands: [] };
  const withPm = request("review", 5, { id: "0001", pr: 7 });
  const forwarded = { ...withPm, to: "user", forwarded: ago(1) };
  const underProgramme = { ...sig([forwarded]), plans: [{ plan: { slug: "w", state: "active", rows: [{ braid: "0001" }] } }] };
  for (const s of [sig([withPm]), underProgramme]) {
    for (const [braid, lane] of [[goal, "In Progress"], [story, "To Do"]]) {
      const card = model.toCard(braid, gh(), t3(), s);
      assert.deepEqual([card.lane, card.need, card.pm !== null], [lane, null, true]);
    }
  }
});
