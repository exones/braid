import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

// The PM asks through the board (0062/C): the store keyed by item and asker, `braid ask --by pm` and `pm/<slug>`,
// the board's lanes and cards, and the pushes. Computed specifiers keep the compiled modules out of the typecheck.
const load = (path: string) => import(pathToFileURL(fileURLToPath(new URL(path, import.meta.url))).href);
/* eslint-disable @typescript-eslint/no-explicit-any */
const model: any = await load("../dist/board/model.js");
const signals: any = await load("../dist/board/signals.js");
const marks: any = await load("../dist/board/marks.js");
const message: any = await load("../dist/notify/message.js");
const plans: any = await load("../dist/board/plans.js");
const { askCommand, answerCommand, forwardCommand, requestsCommand }: any = await load("../dist/commands/requests.js");
const { loadRequests, openRequest, closeRequest }: any = await load("../dist/braids/requests.js");
const { statusCommand }: any = await load("../dist/commands/coordinate.js");

const NOW = new Date("2026-11-22T12:00:00Z");
const ago = (minutes: number) => new Date(NOW.getTime() - minutes * 60_000).toISOString();
const PM = "11111111-aaaa-4bbb-8ccc-222222222222";
const LINK = `http://127.0.0.1:3773/env1/${PM}`;

const gh = (): any => ({ status: { state: "ok" }, prs: new Map() });
const t3 = (): any => ({ status: { state: "ok" }, threads: new Map(), states: new Map([[PM, "idle"]]), links: new Map([[PM, LINK]]) });
const req = (id: string, kind: string, minutes: number, extra: object = {}): any => ({ id, kind, text: `a ${kind} text`, at: ago(minutes), thread: null, ...extra });
const ask = (id: string, kind: string, minutes: number, extra: object = {}): any => req(id, kind, minutes, { by: "pm", thread: PM, ...extra });
const board = (...braids: object[]): any => ({ repo: "agento", github: { state: "ok" }, t3: { state: "ok" }, braids });

function sig(requests: any[], asks: any[] = [], programmes: any[] = []): any {
  const clock = signals.brokeClock({}, NOW);
  return { now: NOW, requests: new Map(requests.map((r) => [r.id, r])), asks: new Map(asks.map((r) => [r.id, r])), programmes, alarm: clock.alarm };
}
const braidOf = (strands: boolean): any => ({
  number: "0001",
  folder: "braids/0001-a",
  brief: { id: "0001", title: "A", status: "In Progress", labels: [], dependencies: [] },
  strands: strands ? [{ letter: "A", folder: "braids/0001-a/A", brief: { id: "0001/A", title: "S", status: "In Progress", labels: [], dependencies: [] } }] : [],
});

const scratch = mkdtempSync(join(tmpdir(), "braid-pm-asks-"));
after(() => rmSync(scratch, { recursive: true, force: true }));
const git = (cwd: string, ...args: string[]) => {
  const r = spawnSync("git", args, { cwd, encoding: "utf8" });
  assert.equal(r.status, 0, `git ${args.join(" ")}: ${r.stderr}`);
};
const brief = (id: string, extra = "") => `---\nid: '${id}'\ntitle: "T ${id}"\nstatus: In Progress\nlabels: []\ndependencies: []\n---\n\n## Goal\n\nx\n${extra}`;

/** Braid 0001 (a strand A) has a PM-run line; braid 0002 has none; the project has a branch pm/working-product. */
function project(): string {
  const root = mkdtempSync(join(scratch, "p-"));
  const put = (path: string, text: string) => {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  };
  git(root, "init", "-q", "-b", "main");
  put("BRAID.md", "---\nmain: main\n---\n");
  put("braids/0001-a/brief.md", brief("0001", `\n## Autonomy\n\nPM-run (thread ${PM}): security always ask.\n`));
  put("braids/0001-a/A-x/brief.md", brief("0001/A"));
  put("braids/0002-b/brief.md", brief("0002"));
  git(root, "-c", "user.email=t@example.com", "-c", "user.name=t", "add", "-A");
  git(root, "-c", "user.email=t@example.com", "-c", "user.name=t", "commit", "-q", "-m", "init");
  git(root, "branch", "pm/working-product");
  return root;
}
const opts = { now: () => NOW };

test("the store keys by item and asker: both open, each replaced and closed on its own, old records are the coordinator's", () => {
  const root = project();
  const old = { id: "0001", kind: "question", text: "old record", at: ago(5), thread: null };
  openRequest(root, old);
  openRequest(root, ask("0001", "decision", 4));
  assert.equal(loadRequests(root).length, 2, "the PM's request doesn't replace the coordinator's");
  openRequest(root, ask("0001", "plan", 3));
  openRequest(root, { ...old, text: "newer coordinator" });
  const open = loadRequests(root);
  assert.deepEqual(open.map((r: any) => [r.by ?? "coordinator", r.kind, r.text]).sort(), [["coordinator", "question", "newer coordinator"], ["pm", "plan", "a plan text"]]);
  assert.equal(closeRequest(root, "0001", "pm", { state: "answered", who: "pm" }).found, true);
  assert.equal(closeRequest(root, "0001", "pm", { state: "answered", who: "pm" }).found, false);
  assert.equal(loadRequests(root).length, 1);
  openRequest(root, ask("0001", "plan", 3));
  assert.equal(closeRequest(root, "0001", undefined, { state: "withdrawn", who: "coordinator" }).found, true, "without an asker both close (start and accept)");
  assert.equal(loadRequests(root).length, 0);
});

test("the board shows a PM request and the coordinator's on the same braid, both", () => {
  const both = model.toCard(braidOf(false), gh(), t3(), sig([req("0001", "question", 9)], [ask("0001", "decision", 4)]));
  assert.equal(both.lane, "Waiting");
  assert.equal(both.need.text, "a question text", "the coordinator's request is still the need");
  assert.equal(both.pmAsk.text, "The PM asks you: a decision text");
  assert.equal(both.pmAsk.by, "pm");
  const only = model.toCard(braidOf(false), gh(), t3(), sig([], [ask("0001", "decision", 4)]));
  assert.equal(only.lane, "Waiting");
  assert.equal(only.reason, "decision");
  assert.equal(only.need.text, "The PM asks you: a decision text");
  // On a braid with strands: the strand's, and the braid's own.
  const strand = model.toCard(braidOf(true), gh(), t3(), sig([], [ask("0001/A", "question", 4)]));
  assert.equal(strand.lane, "Waiting");
  assert.equal(strand.strands[0].pmAsk.text, "The PM asks you: a question text");
  const own = model.toCard(braidOf(true), gh(), t3(), sig([req("0001/A", "plan", 8)], [ask("0001", "question", 4)]));
  assert.equal(own.need.by, "pm");
  assert.equal(own.strands[0].need.text, "a plan text");
  assert.equal(own.lane, "Waiting");
  // A request that isn't the PM's reads as before.
  assert.equal(model.toCard(braidOf(false), gh(), t3(), sig([req("0001", "question", 9)])).pmAsk, null);
});

test("--kind action reads 'The PM asks you to: …' on the card, the push and the status", async () => {
  const card = model.toCard(braidOf(false), gh(), t3(), sig([], [ask("0001", "action", 2, { text: "install the runner" })]));
  assert.equal(card.need.text, "The PM asks you to: install the runner");
  assert.equal(card.reason, "action");
  assert.match(marks.cardMarks(card).reasons[0].tooltip, /PM asks you to/);
  const [push] = message.pushesOf(board(card));
  assert.match(push.body, /The PM asks you to: install the runner$/);
  assert.equal(push.title, "agento 0001: the PM asks");
  const root = project();
  askCommand(root, ["0001", "install the runner", "--by", "pm", "--kind", "action", "--thread", PM], opts);
  askCommand(root, ["0001", "which?"], opts);
  const ok = (data: unknown) => ({ status: 0, stdout: JSON.stringify(data), stderr: "" });
  const status = (await statusCommand(root, ["1"], { gh: () => ok([]), t3: () => Promise.resolve(ok([{ threadId: PM, status: "idle" }])) })) as string;
  assert.match(status, /The PM asks you to: install the runner/);
});

test("a PM request is pushed under its braid at high priority with the compass tag and the PM thread, apart from the coordinator's push", () => {
  const card = model.toCard(braidOf(false), gh(), t3(), sig([req("0001", "question", 9)], [ask("0001", "decision", 4)]));
  const pushes = message.pushesOf(board(card));
  assert.equal(pushes.length, 2);
  const coordinator = pushes.find((p: any) => p.title === "agento 0001: Needs You");
  const pm = pushes.find((p: any) => p.title === "agento 0001: the PM asks");
  assert.ok(coordinator !== undefined && pm !== undefined);
  assert.equal(pm.priority, "high");
  assert.deepEqual(pm.tags, ["compass"]);
  assert.equal(pm.click, `t3code://threads/env1/${PM}`);
  assert.notEqual(pm.sequence, coordinator.sequence);
  assert.notEqual(pm.key, coordinator.key);
  // Only the PM's request: one push, not two.
  const lone = model.toCard(braidOf(false), gh(), t3(), sig([], [ask("0001", "decision", 4)]));
  assert.equal(message.pushesOf(board(lone)).length, 1);
  // A strand's request is pushed once, under the strand's id.
  const strand = model.toCard(braidOf(true), gh(), t3(), sig([], [ask("0001/A", "question", 4)]));
  assert.deepEqual(message.pushesOf(board(strand)).map((p: any) => p.title), ["agento 0001/A: the PM asks"]);
});

test("braid ask pm/<slug> opens a programme request; an unknown slug is refused; it shows in Needs You and is pushed", () => {
  const root = project();
  assert.throws(() => askCommand(root, ["pm/nothing", "x"], opts), /pm\/nothing is not a programme of this project/);
  assert.throws(() => askCommand(root, ["pm/working-product", "x", "--by", "coordinator"], opts), /is the PM's/);
  assert.equal(loadRequests(root).length, 0, "a refused ask opens nothing");
  const out = askCommand(root, ["pm/working-product", "A. keep the plan\nB. cut a strand", "--thread", PM, "--kind", "decision"], opts);
  assert.match(out, /^q-[a-z0-9]{4} pm\/working-product: decision request from the PM opened: /);
  const [r] = loadRequests(root);
  assert.deepEqual([r.id, r.by, r.kind, r.thread], ["pm/working-product", "pm", "decision", PM]);
  // Read like the board reads it: the programme request is no braid's request.
  const read = signals.readSignals(root, gh(), NOW);
  assert.equal(read.requests.size, 0);
  assert.equal(read.asks.size, 0);
  assert.equal(read.programmes.length, 1);
  // 0062/D: the programme request puts its programme in the panel's Needs you; no card in the lanes.
  const planned = [plans.planOf("working-product", "pm/working-product", `---
programme: working-product
title: Working product
goal: A working product
thread: ${PM}
state: running
---
`)];
  const shown = model.toBoard("agento", [], gh(), t3(), { ...read, now: NOW, plans: planned });
  assert.equal(shown.braids.length, 0, "no programme card in the lanes");
  const [programme] = shown.programmes;
  assert.equal(programme.section, "needs");
  assert.equal(programme.need.text, "The PM asks you: A. keep the plan B. cut a strand");
  assert.equal(programme.link, LINK);
  const pushes = message.pushesOf(shown);
  assert.equal(pushes.length, 1);
  assert.equal(pushes[0].title, "agento working-product: the PM asks");
  assert.equal(pushes[0].priority, "high");
  assert.deepEqual(pushes[0].tags, ["compass"]);
  assert.equal(pushes[0].click, `t3code://threads/env1/${PM}`);
  // A programme action reads "to:"; one request per programme: the new one replaces the old.
  askCommand(root, ["pm/working-product", "protect main", "--kind", "action", "--thread", PM], opts);
  assert.equal(loadRequests(root).length, 1);
  const again = model.toBoard("agento", [], gh(), t3(), { ...signals.readSignals(root, gh(), NOW), now: NOW, plans: planned });
  assert.equal(again.programmes[0].need.text, "The PM asks you to: protect main");
});

test("--by pm: the thread falls back to the brief's PM-run line; --kind action and --to need the right asker", () => {
  const root = project();
  askCommand(root, ["0001/A", "Q?", "--by", "pm"], opts);
  assert.equal(loadRequests(root)[0].thread, PM);
  assert.match(askCommand(root, ["0001", "Create the token", "--kind", "action"], opts), /action request opened/);
  assert.throws(() => askCommand(root, ["0001", "x", "--by", "pm", "--to", "pm"], opts), /already the user's/);
  assert.throws(() => askCommand(root, ["0001", "x", "--by", "me"], opts), /--by is coordinator or pm/);
  assert.equal(loadRequests(root).length, 2);
});

test("braid requests and braid answer name which request; a forward touches only the coordinator's", async () => {
  const root = project();
  askCommand(root, ["0001/A", "coordinator asks", "--to", "pm"], opts);
  askCommand(root, ["0001/A", "PM asks", "--by", "pm", "--thread", PM], opts);
  askCommand(root, ["pm/working-product", "programme asks", "--thread", PM], opts);
  const list = (await requestsCommand(root, [], opts)) as string;
  assert.match(list, /^q-[a-z0-9]{4} {2}0001\/A {2}question {2}0m {2}blocks 0001\/A · decide {2}to the PM {2}coordinator asks$/m);
  assert.match(list, /^q-[a-z0-9]{4} {2}0001\/A {2}question {2}0m {2}blocks 0001\/A · decide {2}from the PM {2}PM asks$/m);
  assert.match(list, /^q-[a-z0-9]{4} {2}pm\/working-product {2}question {2}0m {2}decide {2}from the PM {2}programme asks$/m);
  assert.match(forwardCommand(root, ["0001/A"], opts), /question request forwarded to the user/);
  assert.equal(loadRequests(root).find((r: any) => r.by === "pm" && r.id === "0001/A").to, undefined);
  assert.match(answerCommand(root, root, ["0001/A", "--by", "pm"]), /^q-[a-z0-9]{4} 0001\/A: answered by the user/);
  assert.equal(loadRequests(root).length, 2);
  assert.match(answerCommand(root, root, ["0001/A", "--by", "pm"]), /no open PM request/);
  assert.match(answerCommand(root, root, ["pm/working-product"]), /^q-[a-z0-9]{4} pm\/working-product: answered by the user/);
  askCommand(root, ["0001/A", "again", "--by", "pm", "--thread", PM], opts);
  // Both askers have one open: the id alone names both codes and changes nothing.
  assert.throws(() => answerCommand(root, root, ["0001/A"]), /0001\/A has 2 open requests: q-[a-z0-9]{4} \(the coordinator's\), q-[a-z0-9]{4} \(the PM's\); give the code, or --by coordinator\|pm; nothing changed/);
  assert.equal(loadRequests(root).length, 2);
  assert.match(answerCommand(root, root, ["0001/A", "--by", "coordinator"]), /answered by the user/);
  assert.equal(loadRequests(root).length, 1, "the PM's stays open when the coordinator's is answered");
  assert.match(answerCommand(root, root, ["0001/A", "--by", "coordinator"]), /no open request \(the PM's is open: q-[a-z0-9]{4}\)/);
});
