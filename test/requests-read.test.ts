// 0071/G: a read never closes a request. `braid requests` shows a request whose condition holds as still open and writes
// nothing; only the running board's tick records its ending, with its one wake, also after a list, and never for a held braid.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { load, world } from "./support/done-fixtures.ts";

/* eslint-disable @typescript-eslint/no-explicit-any */
const Cmd: any = await load("../../dist/commands/requests.js");
const Rec: any = await load("../../dist/braids/requests.js");
const { waker }: any = await load("../../dist/board/wake.js");

const ASKER = "22222222-aaaa-4bbb-8ccc-333333333333";
const codeOf = (out: string): string => `q-${/^(?:[a-z]+-[a-z]+-|q-)([a-z0-9]{4,})\b/.exec(out)?.[1] ?? assert.fail(`no code in: ${out}`)}`;
const stateOf = (root: string, code: string): string => Rec.loadRecord(root).requests.find((r: any) => r.code === code).state;
const nameOf = (root: string, code: string): string => Rec.handleOf(Rec.loadRecord(root).requests.find((r: any) => r.code === code));
const list = (root: string): string => {
  const r = spawnSync(process.execPath, [fileURLToPath(new URL("../dist/cli.js", import.meta.url)), "requests"], { encoding: "utf8", cwd: root });
  assert.equal(r.status, 0, r.stderr);
  return r.stdout;
};
const tip = (root: string): string => spawnSync("git", ["rev-parse", "braid-requests"], { cwd: root, encoding: "utf8" }).stdout.trim();
const good = (held: string[] = []): any => ({
  sig: { pauses: new Map(held.map((b) => [b, { braid: b }])) },
  start: { main: "main", expected: null },
  github: { status: { state: "ok" }, prs: new Map() },
  t3: { states: new Map() },
});

test("braid requests shows a request whose condition holds as open and writes nothing; the board's tick then wakes once", async () => {
  const w = world();
  const code = codeOf(Cmd.askCommand(w.root, ["0001", "Check the nightly run", "--to", "0002", "--done-when", "time:2026-11-23T11:00:00Z", "--thread", ASKER]));
  const before = tip(w.root);
  assert.match(before, /^[0-9a-f]{40}$/);
  const out = list(w.root);
  assert.match(out, new RegExp(`${nameOf(w.root, code)}.*condition holds: the board wakes the asker`));
  assert.equal(tip(w.root), before, "nothing was written on braid-requests");
  assert.equal(stateOf(w.root, code), "open");
  const sent: string[] = [];
  const t3 = (_r: string, args: readonly string[]) => (sent.push(args[3] as string), Promise.resolve({ status: 0, stdout: "", stderr: "" }));
  await waker(t3)({ root: w.root, good: good() }, new Date("2026-11-23T12:00:00Z"), () => undefined);
  assert.equal(sent.length, 1);
  assert.match(sent[0] ?? "", new RegExp(`Wake: ${nameOf(w.root, code)} is met`));
  assert.equal(stateOf(w.root, code), "met");
});

test("a held braid's request whose condition holds stays open after a list, and after the board skips it", async () => {
  const w = world();
  const code = codeOf(Cmd.askCommand(w.root, ["0001", "Check the nightly run", "--done-when", "time:2026-11-23T11:00:00Z", "--thread", ASKER]));
  const before = tip(w.root);
  assert.match(before, /^[0-9a-f]{40}$/);
  list(w.root);
  const sent: string[] = [];
  await waker((_r: string, args: readonly string[]) => (sent.push(args[3] as string), Promise.resolve({ status: 0, stdout: "", stderr: "" })))({ root: w.root, good: good(["0001"]) }, new Date("2026-11-23T12:00:00Z"), () => undefined);
  assert.deepEqual([tip(w.root), stateOf(w.root, code), sent.length], [before, "open", 0]);
});

test("the CLI history names the estimating coordinator's braid, as the details panel does", () => {
  const w = world();
  const code = codeOf(Cmd.askCommand(w.root, ["0001", "Can search ship?", "--to", "0002", "--done-when", "braid:0002", "--thread", ASKER]));
  Cmd.etaCommand(w.root, [code, "2h"], { now: () => new Date() });
  const r = spawnSync(process.execPath, [fileURLToPath(new URL("../dist/cli.js", import.meta.url)), "requests", code], { encoding: "utf8", cwd: w.root });
  assert.match(r.stdout, /eta\s+the 0002 coordinator/);
  assert.match(r.stdout, /opened {5}the coordinator\n/);
});
