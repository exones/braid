import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { brief, load, scratch, world } from "./support/done-fixtures.ts";

// 0070/C: the board shows each request with its code and its asking thread, the closed ones with who answered, a request to
// another braid on the asking braid's card; pushes carry the code; a withdrawn or met request takes its push off the phone.
/* eslint-disable @typescript-eslint/no-explicit-any */
const Cmd: any = await load("../../dist/commands/requests.js");
const Rec: any = await load("../../dist/braids/requests.js");
const model: any = await load("../../dist/board/model.js");
const view: any = await load("../../dist/board/record.js");
const message: any = await load("../../dist/notify/message.js");
const notifierMod: any = await load("../../dist/notify/notifier.js");
const { readSignals }: any = await load("../../dist/board/signals.js");

const ASKER = "22222222-aaaa-4bbb-8ccc-333333333333";
const PM = "11111111-aaaa-4bbb-8ccc-222222222222";
const base = "http://127.0.0.1:3773/env1/";
const url = (thread: string) => `t3code://threads/env1/${thread}`;
const t3: any = { status: { state: "ok" }, threads: new Map(), states: new Map([[PM, "idle"]]), links: new Map([ASKER, PM].map((id) => [id, base + id])) };
const github = (prs: object[] = []): any => ({ status: { state: "ok" }, prs: new Map(prs.map((p: any) => [p.branch, p])) });
const pr = (number: number, state: string): any => ({ number, url: "u", state, checks: "passing", base: "main", branch: `b${number}`, head: "a".repeat(40) });
const braid = (number: string, strands: string[] = []): any => ({
  logs: [],
  hasReport: false,
  number,
  folder: `braids/${number}-a`,
  brief: { id: number, title: `B${number}`, status: "In Progress", labels: [], dependencies: [], order: null, delivery: null, body: "" },
  strands: strands.map((l) => ({ letter: l, folder: `braids/${number}-a/${l}`, brief: { id: `${number}/${l}`, title: `S${l}`, status: "In Progress", labels: [], dependencies: [] } })),
});
const codeOf = (out: string): string => `q-${/^(?:[a-z]+-[a-z]+-|q-)([a-z0-9]{4,})\b/.exec(out)?.[1] ?? assert.fail(`no code in: ${out}`)}`;
const answerFile = (root: string, text: string): string => {
  const path = join(dirname(root), `a-${Math.random().toString(36).slice(2)}.txt`);
  writeFileSync(path, text);
  return path;
};
const boardOf = (root: string, gh: any, braids: any[] = [braid("0001", ["A"]), braid("0002")]): any => model.toBoard("agento", braids, gh, t3, readSignals(root, gh));

test("an open request carries its code and its asking thread; the push leads with the code and opens that thread", () => {
  const w = world();
  const code = codeOf(Cmd.askCommand(w.root, ["0002", "Which rounding rule?", "--thread", ASKER]));
  const b = boardOf(w.root, github());
  const card = b.braids.find((c: any) => c.id === "0002");
  assert.equal(card.need.code, code);
  assert.equal(card.need.asking, base + ASKER, "the T3 link of the asking thread");
  const [p, ...rest] = message.pushesOf(b);
  assert.equal(rest.length, 0);
  assert.equal(p.body, `${code} · B0002\nWhich rounding rule?`);
  assert.equal(p.click, url(ASKER));
});

test("a forwarded request keeps the asker's thread for the link and opens the PM's thread from the push; the PM's own request carries its code", () => {
  const w = world();
  // Braid 0001 is run by a PM, so `--to pm` is allowed and the record keeps the PM's thread.
  writeFileSync(join(w.root, "braids", "0001-alpha", "brief.md"), brief("0001", "In Progress", `
## Autonomy

PM-run (thread ${PM}): security always ask.
`));
  const fwd = codeOf(Cmd.askCommand(w.root, ["0001", "Merge it?", "--thread", ASKER, "--kind", "decision", "--to", "pm"]));
  Rec.forwardRequest(w.root, "0001", "2026-11-23T10:00:00Z", "your call");
  const ask = codeOf(Cmd.askCommand(w.root, ["0001/A", "Install the runner", "--by", "pm", "--kind", "action", "--thread", PM]));
  const b = boardOf(w.root, github());
  const pushes = message.pushesOf(b);
  const forwarded = pushes.find((p: any) => p.item === "0001");
  assert.match(forwarded.body, new RegExp(`^${fwd} · B0001\n`));
  assert.equal(forwarded.click, url(PM), "the push opens the PM's thread");
  const need = b.braids.find((c: any) => c.id === "0001").need;
  assert.deepEqual([need.code, need.link, need.asking], [fwd, base + PM, base + ASKER], "the link the page shows stays the coordinator's");
  const byPm = pushes.find((p: any) => p.item.endsWith("#pm"));
  assert.match(byPm.body, new RegExp(`^${ask} · `));
});

test("an answered request is listed with who answered, the answer and the PM's reason, newest first", () => {
  const w = world();
  const a = codeOf(Cmd.askCommand(w.root, ["0002", "Half-up or banker's?", "--thread", ASKER]));
  Cmd.answerCommand(w.root, w.root, [a, "--file", answerFile(w.root, "Half-up.")]);
  const c = codeOf(Cmd.askCommand(w.root, ["0001", "Include refunds?", "--thread", ASKER]));
  Cmd.answerCommand(w.root, w.root, [c, "--from", "pm", "--reason", "the goal says net", "--file", answerFile(w.root, "Yes, net.")]);
  const d = codeOf(Cmd.askCommand(w.root, ["0001/A", "Which locale?"]));
  Cmd.withdrawCommand(w.root, [d, "--why", "the brief says en-GB"]);
  const sig = readSignals(w.root, github());
  const all = view.requestsOf(() => true, sig, t3);
  assert.deepEqual(all.open, []);
  assert.deepEqual(all.closed.map((r: any) => [r.code, r.state, r.closed.by]), [[d, "withdrawn", "coordinator"]]);
  assert.deepEqual(all.decided.map((r: any) => [r.code, r.state, r.closed.by]), [[c, "answered", "pm"], [a, "answered", "user"]], "answered ones are Decided, newest first");
  const byPm = all.decided.find((r: any) => r.code === c);
  assert.deepEqual([byPm.closed.text, byPm.closed.reason, byPm.link], ["Yes, net.", "the goal says net", base + ASKER]);
  assert.equal(all.closed.find((r: any) => r.code === d).closed.text, "the brief says en-GB");
  // An item's tab holds its own requests only; a braid's holds its strands' too.
  assert.deepEqual(view.requestsOf((id: string) => id === "0001/A", sig, t3).closed.map((r: any) => r.code), [d]);
  assert.deepEqual(view.requestsOf((id: string) => id === "0001" || id.startsWith("0001/"), sig, t3).closed.map((r: any) => r.code), [d]);
  assert.deepEqual(view.requestsOf((id: string) => id === "0001" || id.startsWith("0001/"), sig, t3).decided.map((r: any) => r.code), [c]);
  // The detail of the item carries the same view.
  const parent = braid("0001", ["A"]);
  const detail = model.toDetail({ read: () => "" }, parent, parent, github(), t3, sig);
  assert.deepEqual([...detail.requests.closed, ...detail.requests.decided].map((r: any) => r.code), [d, c]);
});

test("a request to another braid shows on the asking braid's card with its done-when, and nowhere as the user's", () => {
  const w = world();
  const code = codeOf(Cmd.askCommand(w.root, ["0001/A", "Does 0002 rename the flag?", "--to", "2", "--done-when", "braid:2", "--thread", ASKER]));
  const b = boardOf(w.root, github());
  const card = b.braids.find((c: any) => c.id === "0001");
  assert.deepEqual(card.waits.map((r: any) => [r.code, r.item, r.to, r.doneWhen, r.link]), [[code, "0001/A", "0002", "braid:0002", base + ASKER]]);
  assert.equal(card.need, null);
  assert.equal(card.lane, "In Progress");
  assert.deepEqual(message.pushesOf(b), []);
  assert.deepEqual(b.braids.find((c: any) => c.id === "0002").waits, []);
  const tab = view.requestsOf((id: string) => id.startsWith("0001"), readSignals(w.root, github()), t3);
  assert.deepEqual([tab.open.length, tab.waiting.map((r: any) => r.code)], [0, [code]]);
});

test("a PR that merged or closed closes its waits for the board at once, as met or withdrawn (a closed PR is withdrawn)", () => {
  const w = world();
  const wait = codeOf(Cmd.askCommand(w.root, ["0001", "Wait for PR 5", "--done-when", "pr:5"]));
  const gone = codeOf(Cmd.askCommand(w.root, ["0002", "Wait for PR 6", "--done-when", "pr:6"]));
  const gh = github([pr(5, "merged"), pr(6, "closed")]);
  const sig = readSignals(w.root, gh);
  assert.deepEqual([...sig.requests.keys()], [], "neither is open for the board");
  const closed = view.requestsOf(() => true, sig, t3).closed;
  assert.deepEqual(closed.map((r: any) => [r.code, r.state, r.closed.by, r.closed.text]).sort(), [[gone, "withdrawn", "board", "PR #6 closed"], [wait, "met", "board", "PR #5 merged"]].sort());
  // Nothing was written: the record still has both open until the board's tick records them.
  assert.deepEqual(Rec.loadRequests(w.root).map((r: any) => r.code).sort(), [wait, gone].sort());
});

test("filterLive keeps the right request and a pr: wait whose PR closed unmerged is withdrawn (0070/B's review)", () => {
  const closed = () => ({ state: "CLOSED", headRefOid: "x" });
  const kept = Rec.filterLive([{ id: "a", kind: "question", doneWhen: "pr:5" }, { id: "b", kind: "question", doneWhen: "answered" }], closed);
  assert.deepEqual(kept.map((r: any) => r.id), ["b"], "the pr: wait goes, the plain question stays");
  assert.deepEqual(Rec.voidEnding({ kind: "question", doneWhen: "pr:5" }, closed()), { state: "withdrawn", who: "board", text: "PR #5 closed" });
  assert.deepEqual(Rec.voidEnding({ kind: "question", doneWhen: "pr:5" }, { state: "MERGED", headRefOid: "x" }), { state: "met", who: "board", text: "PR #5 merged" });
  // Only the board's tick records it (test/board-wake.test.ts); `holding` reads and writes nothing.
  const w = world();
  const code = codeOf(Cmd.askCommand(w.root, ["0001", "Wait for PR 5", "--done-when", "pr:5"]));
  const ends = Rec.holding(Rec.loadRequests(w.root), () => closed());
  assert.deepEqual(ends.get(code), { state: "withdrawn", who: "board", text: "PR #5 closed" });
  assert.equal(Rec.loadRequests(w.root).length, 1, "still open");
});

test("a withdrawn or met request takes its push off the phone, as an answered one does", async () => {
  const w = world();
  const withdrawn = codeOf(Cmd.askCommand(w.root, ["0002", "Which rounding rule?", "--thread", ASKER]));
  const met = codeOf(Cmd.askCommand(w.root, ["0001", "Merge when ready", "--kind", "decision", "--done-when", "pr:5", "--thread", ASKER]));
  const dir = join(scratch, `n${Math.random().toString(36).slice(2)}`);
  mkdirSync(dir, { recursive: true });
  const sent: any[] = [];
  const cleared: string[] = [];
  const notify = notifierMod.notifier({
    file: join(dir, ".braid", "notified.json"),
    config: () => ({ server: "https://ntfy.example", topic: "braid-abcdefghijklmnopqrstuvwx", enabled: true }),
    send: async (_c: unknown, push: any) => void sent.push(push),
    token: () => null,
    warn: () => {},
    clear: async (_c: unknown, sequence: string) => void cleared.push(sequence),
  });
  const run = async (gh: any) => {
    notify(boardOf(w.root, gh));
    await notify.idle();
  };
  await run(github([pr(5, "open")]));
  assert.deepEqual(sent.map((p) => p.body.split(" · ")[0]).sort(), [met, withdrawn].sort(), "both pushed with their codes");
  // The PM's side withdraws one; the other's PR merges.
  Cmd.withdrawCommand(w.root, [withdrawn, "--why", "no longer needed"]);
  await run(github([pr(5, "open")]));
  assert.deepEqual(cleared, [sent.find((p) => p.body.startsWith(withdrawn)).sequence], "the withdrawn request's push is cleared");
  await run(github([pr(5, "merged")]));
  assert.equal(cleared.length, 2);
  assert.ok(cleared.includes(sent.find((p) => p.body.startsWith(met)).sequence), "the met request's push is cleared");
});
