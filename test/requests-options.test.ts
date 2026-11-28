import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { brief, git, load, scratch, world } from "./support/done-fixtures.ts";

// 0082/C: a request carries its context and up to four likely answers; `look` is a kind of its own, which blocks nothing;
// `braid answer <handle> A` records the option's text.

const Cmd: any = await load("../../dist/commands/requests.js");
const Rec: any = await load("../../dist/braids/requests.js");
const model: any = await load("../../dist/board/model.js");
const marks: any = await load("../../dist/board/marks.js");
const message: any = await load("../../dist/notify/message.js");
const { readSignals }: any = await load("../../dist/board/signals.js");

const cli = fileURLToPath(new URL("../dist/cli.js", import.meta.url));
const t3: any = { status: { state: "ok" }, threads: new Map(), states: new Map(), links: new Map() };
const github: any = { status: { state: "ok" }, prs: new Map() };
const braid = (number: string): any => ({ logs: [], hasReport: false, number, folder: `braids/${number}-a`, brief: { id: number, title: `B${number}`, status: "In Progress", labels: [], dependencies: [], order: null, delivery: null, body: "" }, strands: [] });
const codeOf = (out: string): string => `q-${/^(?:[a-z]+-[a-z]+-|q-)([a-z0-9]{4,})\b/.exec(out)?.[1] ?? assert.fail(`no code in: ${out}`)}`;
const record = (root: string, code: string): any => Rec.loadRecord(root).requests.find((r: any) => r.code === code) ?? assert.fail(`no ${code}`);
const fileOf = (root: string, text: string): string => {
  const path = join(dirname(root), `o-${Math.random().toString(36).slice(2)}.txt`);
  writeFileSync(path, text);
  return path;
};
const OLD = {
  code: "q-old1",
  item: "0002",
  kind: "question",
  text: "Which rounding rule?",
  by: "coordinator",
  thread: null,
  to: "user",
  doneWhen: "answered",
  eta: null,
  events: [{ event: "opened", at: "2026-11-20T10:00:00.000Z", by: "coordinator" }],
};

test("context and options round-trip on the record, written only when given; an old record reads unchanged", () => {
  const old = Rec.parseRecord("requests/q-old1.json", JSON.stringify(OLD));
  assert.equal(old.context, undefined);
  assert.equal(old.options, undefined);
  assert.ok(!("context" in old) && !("options" in old), "no empty fields on an old record");
  const fields = { ...OLD, context: "## Why\n\nThe refunds report rounds twice.", options: ["Half-up", "Banker's"] };
  const read = Rec.parseRecord("requests/q-old1.json", JSON.stringify(fields));
  assert.equal(read.context, fields.context);
  assert.deepEqual(read.options, fields.options);
  // A malformed field is left out; the request still reads.
  const bad = Rec.parseRecord("requests/q-old1.json", JSON.stringify({ ...OLD, options: ["A", "B", "C", "D", "E"], context: 7 }));
  assert.equal(bad.code, "q-old1");
  assert.ok(!("options" in bad) && !("context" in bad));
  // Merging two versions (an offline replay) keeps the fields.
  const merged = JSON.parse(Rec.mergeRecord("requests/q-old1.json", JSON.stringify(fields), JSON.stringify(fields)));
  assert.equal(merged.context, fields.context);
  assert.deepEqual(merged.options, fields.options);
});

test("braid ask --option and --context write them; braid requests prints the options and says the context is stored", () => {
  const w = world();
  const ctx = fileOf(w.root, "Refunds are rounded **twice** today.\r\n\r\nSee the report.\n");
  const out = Cmd.askCommand(w.root, ["0002", "Which rounding rule?", "--option", "Half-up", "--option", " Banker's  rounding ", "--context-file", ctx], w.opts);
  assert.match(out, /\nA\. Half-up\nB\. Banker's rounding\ncontext stored \(\d+ characters\)\n/);
  const code = codeOf(out);
  const r = record(w.root, code);
  assert.deepEqual(r.options, ["Half-up", "Banker's rounding"]);
  assert.equal(r.context, "Refunds are rounded **twice** today.\n\nSee the report.", "Markdown kept, line ends normalised");
  const listed = Cmd.requestsCommand(w.root, [], { gh: w.opts.gh });
  assert.match(listed, /Which rounding rule\?\n {4}A\. Half-up\n {4}B\. Banker's rounding\n {4}context stored: braid requests <name> prints it\n$/);
  const shown = Cmd.requestsCommand(w.root, [code], { gh: w.opts.gh });
  assert.match(shown, /\nWhich rounding rule\?\nA\. Half-up\nB\. Banker's rounding\ncontext:\n {2}Refunds are rounded \*\*twice\*\* today\.\n\n {2}See the report\.\n/);
  // A request without them reads as before.
  const plain = codeOf(Cmd.askCommand(w.root, ["0001", "Go on?", "--context", "inline context"], w.opts));
  assert.equal(record(w.root, plain).context, "inline context");
  assert.ok(!("options" in record(w.root, plain)));
});

test("--option takes one to four, none empty; the context at most 4000 characters; nothing opens when refused", () => {
  const w = world();
  const five = ["A", "B", "C", "D", "E"].flatMap((o) => ["--option", o]);
  assert.throws(() => Cmd.askCommand(w.root, ["0002", "Pick one", ...five], w.opts), /at most 4 --option \(A to D\); got 5; nothing opened/);
  assert.throws(() => Cmd.askCommand(w.root, ["0002", "Pick one", "--option", "  "], w.opts), /an --option must not be empty/);
  assert.throws(() => Cmd.askCommand(w.root, ["0002", "Pick one", "--context", "x".repeat(4001)], w.opts), /4001 characters, more than 4000/);
  assert.throws(() => Cmd.askCommand(w.root, ["0002", "Pick one", "--context", "a", "--context-file", "b"], w.opts), /--context or --context-file, not both/);
  assert.throws(() => Cmd.askCommand(w.root, ["0002", "--file", "-", "--context-file", "-"], w.opts), /both read standard input/);
  assert.equal(Rec.loadRecord(w.root).requests.length, 0);
  const four = codeOf(Cmd.askCommand(w.root, ["0002", "Pick one", ...five.slice(0, 8)], w.opts));
  assert.deepEqual(record(w.root, four).options, ["A", "B", "C", "D"]);
});

test("braid answer <handle> <letter> records the stored option's text, in any case; other text records as given", () => {
  const w = world();
  const code = codeOf(Cmd.askCommand(w.root, ["0002", "Which rounding rule?", "--option", "Half-up", "--option", "Banker's"], w.opts));
  assert.match(Cmd.answerCommand(w.root, w.root, [code, "b"]), /answered by the user: B\. Banker's\n$/);
  assert.equal(record(w.root, code).events.at(-1).text, "B. Banker's");
  // A letter with no stored option, and the same letter from --file, on other requests.
  const two = codeOf(Cmd.askCommand(w.root, ["0001", "Go on?", "--option", "Yes", "--option", "No"], w.opts));
  assert.match(Cmd.answerCommand(w.root, w.root, [two, "--file", fileOf(w.root, "A\n")]), /answered by the user: A\. Yes\n$/);
  const free = codeOf(Cmd.askCommand(w.root, ["0001/A", "Go on?", "--option", "Yes"], w.opts));
  assert.match(Cmd.answerCommand(w.root, w.root, [free, "C"]), /answered by the user: C\n$/, "no option C: recorded as given");
  const text = codeOf(Cmd.askCommand(w.root, ["0001/A", "Name it?"], w.opts));
  assert.match(Cmd.answerCommand(w.root, w.root, [text, "A"]), /answered by the user: A\n$/, "no options stored: a letter stays a letter");
  const named = codeOf(Cmd.askCommand(w.root, ["0001/A", "Name it?"], w.opts));
  assert.match(Cmd.answerCommand(w.root, w.root, [named, "A short name"]), /answered by the user: A short name\n$/);
  assert.throws(() => Cmd.answerCommand(w.root, w.root, [named, "x", "--file", "-"]), /as text or with --file, not both/);
});

test("a look request opens, lists and answers; it reads as a look, never as a decision, and pushes at default priority", () => {
  const w = world();
  const out = Cmd.askCommand(w.root, ["0002", "FYI: the export now runs nightly", "--kind", "look"], w.opts);
  assert.match(out, /: look request opened: FYI: the export now runs nightly\n/);
  assert.match(out, /\nlook\n/, "a look blocks nothing: the act word alone");
  const code = codeOf(out);
  assert.equal(record(w.root, code).kind, "look");
  assert.match(Cmd.requestsCommand(w.root, [], { gh: w.opts.gh }), new RegExp(`${code.slice(2)}  0002  look  \\d+m  look  FYI`));
  assert.equal(Rec.actOf("look"), "look");
  const b = model.toBoard("agento", [braid("0001"), braid("0002")], github, t3, readSignals(w.root, github));
  const card = b.braids.find((c: any) => c.id === "0002");
  assert.equal(card.lane, "Waiting");
  assert.equal(card.reason, "look");
  assert.equal(card.need.kind, "look");
  assert.equal(card.need.act, "look");
  assert.deepEqual(card.need.blocks, []);
  assert.equal(marks.reasonIcon("look").kind, "look");
  const [push] = message.pushesOf(b);
  assert.deepEqual([push.tags, push.priority], [["eye"], "default"]);
  assert.match(Cmd.answerCommand(w.root, w.root, [code, "seen"]), /answered by the user: seen/);
  assert.equal(record(w.root, code).state, "answered");
  // The PM's own look pushes at default priority too.
  Cmd.askCommand(w.root, ["0001", "FYI: billing moved", "--by", "pm", "--kind", "look", "--thread", "11111111-aaaa-4bbb-8ccc-222222222222"], w.opts);
  const pm = message.pushesOf(model.toBoard("agento", [braid("0001"), braid("0002")], github, t3, readSignals(w.root, github))).find((p: any) => p.item === "0001#pm");
  assert.deepEqual([pm.tags, pm.priority], [["compass"], "default"]);
});

test("a need carries the request's context, options and kind for the board", () => {
  const w = world();
  writeFileSync(join(w.root, "braids", "0001-alpha", "brief.md"), brief("0001", "In Progress", "\n## Autonomy\n\nPM-run (thread 11111111-aaaa-4bbb-8ccc-222222222222): x.\n"));
  Cmd.askCommand(w.root, ["0002", "Which rounding rule?", "--kind", "decision", "--option", "Half-up", "--option", "Banker's", "--context", "Two rules disagree."], w.opts);
  Cmd.askCommand(w.root, ["0001", "Install the runner", "--by", "pm", "--kind", "action", "--option", "Done", "--thread", "11111111-aaaa-4bbb-8ccc-222222222222"], w.opts);
  const b = model.toBoard("agento", [braid("0001"), braid("0002")], github, t3, readSignals(w.root, github));
  const need = b.braids.find((c: any) => c.id === "0002").need;
  assert.deepEqual([need.kind, need.context, need.options], ["decision", "Two rules disagree.", ["Half-up", "Banker's"]]);
  const pm = b.braids.find((c: any) => c.id === "0001");
  const ask = pm.pmAsk ?? pm.need;
  assert.deepEqual([ask.kind, ask.options, "context" in ask], ["action", ["Done"], false]);
});

test("braid ask --context-file - reads the context from standard input", () => {
  const w = world();
  const home = join(scratch, `home-${Math.random().toString(36).slice(2)}`);
  mkdirSync(home);
  const env = { ...process.env, HOME: home, USERPROFILE: home, APPDATA: join(home, "AppData"), LOCALAPPDATA: join(home, "Local"), XDG_CONFIG_HOME: join(home, ".config"), GH_TOKEN: "", GH_HOST: "invalid.example" };
  const r = spawnSync(process.execPath, [cli, "ask", "0002", "Which rule?", "--option", "Half-up", "--context-file", "-"], { cwd: w.root, env, encoding: "utf8", input: "From **stdin**\n\nsecond paragraph\n" });
  assert.equal(r.status, 0, r.stderr);
  git(w.root, "fetch", "-q", "origin");
  const code = codeOf(r.stdout);
  assert.equal(record(w.root, code).context, "From **stdin**\n\nsecond paragraph");
});
