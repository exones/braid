// 0077/B: nothing in the board process blocks the event loop on git or gh: a read, the wake, the reminders, the nudges and the actions
// run every process asynchronously, so the server answers while a read is slow; a `t3` or `gh` that times out reads as not answering.
import assert from "node:assert/strict";
import childProcess from "node:child_process";
import { syncBuiltinESMExports } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { after, mock, test } from "node:test";
import { brief, git, load, scratch, world } from "./support/done-fixtures.ts";

/* eslint-disable @typescript-eslint/no-explicit-any */
const gitio: any = await load("../../dist/braids/gitio.js");
const feedMod: any = await load("../../dist/board/feed.js");
const board: any = await load("../../dist/commands/board.js");
const Cmd: any = await load("../../dist/commands/requests.js");
const github: any = await load("../../dist/board/github.js");
const t3mod: any = await load("../../dist/board/t3.js");
const { waker }: any = await load("../../dist/board/wake.js");
const { reminder }: any = await load("../../dist/board/remind.js");
const { nudger }: any = await load("../../dist/board/nudge.js");

const ASKER = "22222222-aaaa-4bbb-8ccc-333333333333";
const ok = (data: unknown) => ({ status: 0, stdout: typeof data === "string" ? data : JSON.stringify(data), stderr: "" });

/** Records every synchronous child process the board process starts (the builtin's own functions are wrapped, then the ESM bindings follow). */
function watchSync(): { calls: string[]; stop: () => void } {
  const calls: string[] = [];
  const mod = syncBuiltinESMExports;
  for (const name of ["spawnSync", "execFileSync", "execSync"] as const) {
    const original = (childProcess as any)[name];
    mock.method(childProcess as any, name, (...args: any[]) => {
      calls.push(`${name} ${String(args[0])} ${Array.isArray(args[1]) ? args[1].join(" ") : ""}`.trim());
      return original(...args);
    });
  }
  mod();
  return {
    calls,
    stop: () => {
      mock.restoreAll();
      mod();
    },
  };
}

test("a full board read, the wake, the reminders, the nudges and an action start no synchronous git or gh", async () => {
  const w = world();
  // A braid waiting on another braid (the wake reads `main` as origin has it), a timed wait that is due, and a To Do braid to start.
  Cmd.askCommand(w.root, ["0001", "Wait for the story", "--to", "0002", "--done-when", "braid:0002", "--thread", ASKER]);
  Cmd.askCommand(w.root, ["0001/A", "Look again", "--done-when", "time:2026-11-23T11:00:00Z", "--thread", ASKER]);
  mkdirSync(join(w.root, "braids", "0003-new"), { recursive: true });
  // It names a related braid, so the readiness check (`braid check`) also looks at every braid and plan/ branch; a plan branch has a braid of its own.
  writeFileSync(join(w.root, "braids", "0003-new", "brief.md"), brief("0003", "To Do").replace("labels: []", "labels: []\nrelated: ['0001', '0004']"));
  git(w.root, "add", "-A");
  git(w.root, "commit", "-q", "-m", "docs: 0003");
  git(w.root, "push", "-q", "origin", "main");
  git(w.root, "branch", "plan/four", "HEAD");
  git(w.root, "worktree", "add", "-q", join(scratch, "plan-four"), "plan/four");
  mkdirSync(join(scratch, "plan-four", "braids", "0004-planned"), { recursive: true });
  writeFileSync(join(scratch, "plan-four", "braids", "0004-planned", "brief.md"), brief("0004", "To Do"));
  git(join(scratch, "plan-four"), "add", "-A");
  git(join(scratch, "plan-four"), "commit", "-q", "-m", "docs: plan 0004");
  const sent: string[] = [];
  const t3 = (_root: string, args: readonly string[]) => {
    if (args[1] === "list") {
      return Promise.resolve(ok([]));
    }
    if (args[1] === "send") {
      sent.push(args[3] ?? "");
    }
    return Promise.resolve(ok({ threadId: "new-thread", thread: { worktreePath: null } }));
  };
  const src = board.repoSources(w.root, w.opts.gh, t3);
  const watch = watchSync();
  try {
    const snap = await feedMod.readSnapshot(src, true);
    assert.equal(snap.ok, true, String(snap.error));
    const at = new Date("2026-11-24T00:00:00Z");
    const warn = (line: string) => assert.fail(`warning: ${line}`);
    await waker(t3)({ root: w.root, good: snap }, at, warn);
    await reminder(t3)({ root: w.root, good: snap }, at, warn);
    await nudger(t3)({ root: w.root, good: snap }, at, warn);
    await src.inbox(true);
    await src.action("start")({ id: "0003" });
    assert.ok(sent.length > 0, "the wake sent something, so the record write ran");
  } finally {
    watch.stop();
  }
  assert.deepEqual(watch.calls, [], `synchronous processes ran: ${JSON.stringify(watch.calls)}`);
});

test("/api/session answers within a second while a read's git calls take seconds", async () => {
  const w = world();
  const web = join(scratch, "web-slow");
  mkdirSync(web, { recursive: true });
  writeFileSync(join(web, "index.html"), "<p>board</p>");
  const src = board.repoSources(w.root, w.opts.gh, w.opts.t3);
  // The first read is quick; the later ones run with a git that takes 700 ms per call.
  const started = await board.startBoardWith(src, web, 300);
  after(() => started.close());
  const get = () => fetch(`${started.url}api/session`, { headers: { "x-braid-token": started.token } });
  assert.equal((await get()).status, 204);
  let reads = 0;
  gitio.delayGit(async () => {
    reads++;
    await new Promise((done) => setTimeout(done, 700));
  });
  after(() => gitio.delayGit(undefined));
  const times: number[] = [];
  const until = Date.now() + 4000;
  while (Date.now() < until) {
    const began = performance.now();
    assert.equal((await get()).status, 204);
    times.push(performance.now() - began);
    await new Promise((done) => setTimeout(done, 100));
  }
  assert.ok(reads >= 3, `a read ran slow git meanwhile (${reads} calls)`);
  assert.ok(Math.max(...times) < 1000, `slowest /api/session ${Math.round(Math.max(...times))} ms during the read`);
});

const cli = fileURLToPath(new URL("../dist/cli.js", import.meta.url));
const note = (cwd: string, ...args: string[]) => {
  const r = childProcess.spawnSync(process.execPath, [cli, "note", ...args], { cwd, encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
};

test("an inbox whose local and origin branches have diverged is read without a synchronous process", async () => {
  const w = world();
  const away = join(scratch, "missing.git");
  const remote = git(w.root, "remote", "get-url", "origin");
  note(w.root, "first", "--from", "user");
  // Someone else pushes an idea; this clone writes a note while offline, then fetches: its branch and origin's have diverged.
  note(w.worker, "--idea", "pushed elsewhere");
  git(w.root, "remote", "set-url", "origin", away);
  note(w.root, "written offline", "--from", "user");
  git(w.root, "remote", "set-url", "origin", remote);
  git(w.root, "fetch", "-q", "origin", "braid-inbox:refs/remotes/origin/braid-inbox");
  const src = board.repoSources(w.root, w.opts.gh, w.opts.t3);
  const watch = watchSync();
  let inbox: any;
  try {
    inbox = await src.inbox(false);
  } finally {
    watch.stop();
  }
  assert.deepEqual(watch.calls, [], `synchronous processes ran: ${JSON.stringify(watch.calls)}`);
  const texts = [...inbox.ideas, ...inbox.leftovers].map((e: any) => e.title);
  assert.ok(texts.includes("pushed elsewhere") && texts.includes("written offline") && texts.includes("first"), `both sides are listed: ${texts.join(", ")}`);
});

const killed = Object.assign(new Error("Command failed"), { killed: true, signal: "SIGTERM", code: null });
const missing = Object.assign(new Error("spawn t3 ENOENT"), { code: "ENOENT" });

test("a t3 call that times out reads as not answering within 30 s; only a missing command says not installed", async () => {
  const read = (error: Error) => t3mod.readT3("/nowhere", { run: () => Promise.resolve({ status: null, stdout: "", stderr: "", error }), agents: "/agents", project: "/p", reviews: [] });
  assert.equal((await read(killed)).status.reason, "T3 didn't answer within 30 s; retrying");
  assert.match((await read(missing)).status.reason, /t3 is not installed/);
});

test("a gh call that times out reads as not answering within 30 s; only a missing command says not installed", async () => {
  const run = (error: Error) => () => Promise.resolve({ status: null, stdout: "", stderr: "", error });
  assert.equal((await github.readGithubAsync("/nowhere-gh-a", run(killed))).status.reason, "GitHub didn't answer within 30 s; retrying");
  assert.match((await github.readGithubAsync("/nowhere-gh-b", run(Object.assign(new Error("spawn gh ENOENT"), { code: "ENOENT" })))).status.reason, /gh is not installed/);
  // The blocking runner of the CLI commands reports its timeout as ETIMEDOUT.
  const sync = github.readGithub("/nowhere-gh-c", () => ({ status: null, stdout: "", stderr: "", error: Object.assign(new Error("spawnSync gh ETIMEDOUT"), { code: "ETIMEDOUT" }) }));
  assert.equal(sync.status.reason, "GitHub didn't answer within 30 s; retrying");
});

test("an old .braid/requests.json is carried over by the board's read without a synchronous process", async () => {
  const w = world();
  const requests: any = await load("../../dist/braids/requests.js");
  mkdirSync(join(w.root, ".braid"), { recursive: true });
  writeFileSync(join(w.root, ".braid", "requests.json"), JSON.stringify([{ id: "0001", kind: "question", text: "carried", at: "2026-11-01T00:00:00Z", thread: ASKER }]));
  // The main checkout is asked of Git once, when a project is set up.
  requests.legacyFile(w.root);
  board.repoSources(w.root, w.opts.gh, w.opts.t3);
  const watch = watchSync();
  let record: any;
  try {
    record = await requests.loadRecordAsync(w.root);
  } finally {
    watch.stop();
  }
  assert.deepEqual(watch.calls, [], `synchronous processes ran: ${JSON.stringify(watch.calls)}`);
  assert.deepEqual(record.requests.map((r: any) => r.text), ["carried"]);
});
