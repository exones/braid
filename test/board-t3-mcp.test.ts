// 0080/F: signed in, the board reads T3 over MCP (src/board/t3-mcp.ts) and builds the snapshot the CLI read builds; one live
// list per refresh, per-thread reads only for threads not cached, the full list every 5 minutes or on a `braids/` change; T3's
// events refresh a project; signed out, refused or unanswered it reads by the CLI. The MCP side is the mock T3
// (test/fixtures/t3-mcp-mock.ts), the CLI side a fake runner over the same threads; no test reaches a real T3.
import assert from "node:assert/strict";
import childProcess, { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { after, mock, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { detailOf, listItem, MOCK_TOKEN, startT3Mock, type MockThread } from "./fixtures/t3-mcp-mock.ts";

/* eslint-disable @typescript-eslint/no-explicit-any */
const load = (path: string) => import(pathToFileURL(fileURLToPath(new URL(path, import.meta.url))).href);
const { boardT3 }: any = await load("../dist/board/t3-mcp.js");
const { readT3 }: any = await load("../dist/board/t3.js");
const { failureReader }: any = await load("../dist/board/failure.js");
const { mcpClient }: any = await load("../dist/t3mcp/client.js");
const boardMod: any = await load("../dist/commands/board.js");
const { agentsDirs }: any = await load("../dist/braids/worktree-folders.js");

const scratch = mkdtempSync(join(tmpdir(), "braid-t3-mcp-"));
after(() => rmSync(scratch, { recursive: true, force: true, maxRetries: 20, retryDelay: 250 }));
process.env.BRAID_WORKTREES_DIR = join(scratch, "worktrees");

const PROJECT = "p-braid";
const NOW = Date.parse("2026-11-28T12:00:00.000Z");
const brief = (id: string) => `---\nid: '${id}'\ntitle: "T ${id}"\nstatus: In Progress\nlabels: []\ndependencies: []\n---\n\n## Goal\n\nx\n`;

function git(cwd: string, ...args: string[]): void {
  const r = spawnSync("git", ["-c", "user.email=t@example.com", "-c", "user.name=t", ...args], { cwd, encoding: "utf8" });
  assert.equal(r.status, 0, `git ${args.join(" ")}: ${r.stderr}`);
}

let repos = 0;
/** A repository named `app-<n>` with braid 0001, and the threads T3 has of it. */
function project(): { root: string; threads: MockThread[]; repo: string } {
  const root = join(scratch, `app-${++repos}`);
  const put = (path: string, text: string) => {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  };
  mkdirSync(root, { recursive: true });
  git(root, "init", "-q", "-b", "main");
  put("braids/0001-a/brief.md", brief("0001"));
  git(root, "add", "-A");
  git(root, "commit", "-q", "-m", "x");
  const repo = basename(root);
  const tree = (agentsDirs(root) as string | string[]).toString().split(",")[0] as string;
  let age = 100;
  const thread = (threadId: string, status: string, extra: Record<string, unknown> = {}): MockThread => ({
    threadId,
    projectId: PROJECT,
    title: `${threadId} title`,
    status,
    link: `http://127.0.0.1:3773/env/${threadId}`,
    providerInstanceId: "claude",
    model: "m",
    latestRunId: `run-${threadId}`,
    settled: false,
    pendingBackgroundTasks: [],
    blockedOnThreadWait: false,
    relationshipToParent: null,
    updatedAt: new Date(NOW - age++ * 1000).toISOString(),
    ...extra,
  });
  const threads = [
    thread("t-work", "running", { detail: { worktreePath: join(tree, "0001-A"), branch: "braid/0001/A-x", pendingRequestCount: 0 } }),
    thread("t-ask", "running", { detail: { worktreePath: join(tree, "0001-B"), pendingRequestCount: 2 } }),
    thread("t-coord", "waiting", { title: `🧠 ${repo} 0001 coordinator: a`, detail: { worktreePath: join(tree, "0001") } }),
    thread("t-idea", "running", { detail: { branch: "coordinator/idea-2026-11-28-abcd" } }),
    thread("t-bg", "completed", { pendingBackgroundTasks: [{ taskId: "b", kind: "command" }], detail: { worktreePath: join(tree, "0001-C") } }),
    thread("t-idle", "completed", { title: `💻 ${repo} 0001/D worker: d` }),
    thread("t-old-coord", "completed", { title: `🧠 ${repo} 0001 coordinator: old`, settled: true }),
    thread("t-failed", "failed", { title: `💻 ${repo} 0001/E worker: e` }),
    thread("t-gone", "completed", { archived: true }),
    thread("t-other", "running", { projectId: "p-other" }),
    thread("t-review", "running", { relationshipToParent: "subagent", detail: { worktreePath: join(scratch, "rev"), branch: "t3/ab", parentThreadId: "t-coord" } }),
    thread("t-check", "completed", { relationshipToParent: "subagent" }),
  ];
  mkdirSync(join(root, ".braid"), { recursive: true });
  writeFileSync(
    join(root, ".braid", "reviews.json"),
    JSON.stringify([
      { id: "0001/A", thread: "t-review", at: new Date(NOW).toISOString() },
      { id: "pm/prog", thread: "t-check", at: new Date().toISOString() },
    ]),
  );
  return { root, threads, repo };
}

/** `t3 thread list` and `show` over the same threads. */
function cliRunner(threads: readonly MockThread[], calls: string[] = []) {
  return (_root: string, args: readonly string[]) => {
    calls.push(args.join(" "));
    const out =
      args[1] === "list"
        ? threads
            .filter((t) => t.projectId === PROJECT && t.archived !== true && t.relationshipToParent !== "subagent")
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
            .map(listItem)
        : { thread: detailOf(threads.find((t) => t.threadId === args[2]) as MockThread) };
    return Promise.resolve({ status: 0, stdout: JSON.stringify(out), stderr: "" });
  };
}

async function setup() {
  const t3 = await startT3Mock();
  after(() => t3.close());
  const p = project();
  t3.switches.world = { projects: [{ id: "p-x", title: "x", workspaceRoot: join(scratch, "x") }, { id: PROJECT, title: "app", workspaceRoot: p.root }], threads: p.threads };
  const state = { signedIn: true, token: MOCK_TOKEN, clock: NOW, warned: [] as string[] };
  const hub = boardT3({
    client: () => (state.signedIn ? mcpClient(t3.url, () => state.token, { timeoutMs: 5_000 }) : null),
    now: () => state.clock,
    warn: (line: string) => void state.warned.push(line),
  });
  const cliCalls: string[] = [];
  const cli = () => readT3(p.root, { run: cliRunner(p.threads, cliCalls) });
  const signed = hub.project(p.root);
  /** The tool calls of one read: the clock moves past the shared list's life first. */
  const read = async () => {
    state.clock += 30_000;
    const from = t3.requests.length;
    const out = await signed.read(cli);
    const calls = t3.requests.slice(from).filter((r) => r.method === "tools/call").map((r) => ({ name: r.params["name"] as string, args: r.params["arguments"] as any }));
    return { out, calls, reads: calls.filter((c) => c.name === "t3_thread_read").map((c) => c.args.threadId as string).sort(), live: calls.filter((c) => c.args?.statuses !== undefined).length, full: calls.filter((c) => c.args?.settled !== undefined).map((c) => c.args.settled as boolean) };
  };
  return { t3, ...p, state, hub, signed, cli, cliCalls, read };
}

const until = async (what: () => boolean, ms = 8_000): Promise<void> => {
  const end = Date.now() + ms;
  while (!what()) {
    assert.ok(Date.now() < end, "timed out");
    await new Promise((done) => setTimeout(done, 20));
  }
};

test("the signed-in read builds the snapshot the CLI read builds, without a t3 process or a synchronous call", async () => {
  const w = await setup();
  const expected = await w.cli();
  w.cliCalls.length = 0;
  const sync: string[] = [];
  for (const name of ["spawnSync", "execFileSync", "execSync"] as const) {
    mock.method(childProcess as any, name, (...args: unknown[]) => void sync.push(`${name} ${String(args[0])}`));
  }
  syncBuiltinESMExports();
  let got: any;
  try {
    got = await w.read();
  } finally {
    mock.restoreAll();
    syncBuiltinESMExports();
  }
  assert.deepEqual(got.out, expected);
  assert.equal(got.out.status.state, "ok");
  assert.deepEqual(w.cliCalls, []);
  assert.deepEqual(sync, []);
  assert.deepEqual(w.state.warned, []);
  assert.equal(got.live, 1);
  // The full list: the settled threads once, apart from the others; never one unfiltered or with a finished status.
  assert.deepEqual(got.full, [false, true]);
  assert.deepEqual(got.reads, ["t-ask", "t-bg", "t-coord", "t-idea", "t-review", "t-work"]);
});

test("a later refresh asks for one live list, reads only what isn't cached, and the full list every 5 minutes or on a braids/ change", async () => {
  const w = await setup();
  await w.hub.pollEvents(); // the events cover what comes after
  await w.read();
  const second = await w.read();
  assert.equal(second.live, 1);
  assert.deepEqual(second.full, []);
  // A pending question is asked about until it is answered; background work that isn't listed live, while it lasts.
  assert.deepEqual(second.reads, ["t-ask", "t-bg"]);
  assert.equal(second.calls.length, 3);

  // A thread that finished is read once, and its new status shows.
  const work = w.threads.find((t) => t.threadId === "t-work") as MockThread;
  work.status = "completed";
  const done = await w.read();
  assert.deepEqual(done.reads, ["t-ask", "t-bg", "t-work"]);
  assert.equal(done.out.states.get("t-work"), "completed");
  assert.equal(done.out.threads.has("0001/A"), true); // the reviewer still runs on it
  assert.deepEqual((await w.read()).reads, ["t-ask", "t-bg"]);

  w.signed.stale();
  assert.deepEqual((await w.read()).full, [false]);
  assert.deepEqual((await w.read()).full, []);
  w.state.clock += 5 * 60_000;
  assert.deepEqual((await w.read()).full, [false]);

  // A thread archived since is dropped, as the CLI list drops it.
  const idle = w.threads.findIndex((t) => t.threadId === "t-idle");
  w.threads[idle] = { ...(w.threads[idle] as MockThread), archived: true };
  w.signed.stale();
  const after5 = await w.read();
  assert.equal(after5.out.states.has("t-idle"), false);
  assert.deepEqual(after5.out, await w.cli());
});

test("an event for a served project asks for its refresh and reads that thread; a truncated page reads everything again", async () => {
  const w = await setup();
  let refreshes = 0;
  const stop = w.signed.subscribe(() => void refreshes++);
  after(stop);
  await w.hub.pollEvents();
  await w.read();
  await w.read();

  const event = (id: string, type: string, threadId: string, projectId = PROJECT) => ({ id, type, projectId, threadId, isSubagentChild: false });
  w.t3.hub.publish(event("e0", "thread.run_settled", "t-other", "p-other"));
  await w.hub.pollEvents();
  w.t3.hub.publish(event("e1", "thread.needs_input", "t-work"));
  w.threads[0] = { ...(w.threads[0] as MockThread), detail: { ...(w.threads[0] as MockThread).detail, pendingRequestCount: 1 } };
  await w.hub.pollEvents();
  await until(() => refreshes === 1);
  const polled = w.t3.requests.filter((r) => r.method === "events/poll");
  assert.deepEqual([...new Set(polled.map((r) => r.params["name"]))].sort(), ["pr.watch_wake", "thread.needs_input", "thread.run_settled"]);
  const next = await w.read();
  assert.ok(next.reads.includes("t-work"));
  assert.equal(next.out.threads.get("0001/A")[0].pending, 1);
  assert.deepEqual(next.full, []);

  // The mock keeps five milestones: more than that and the page is truncated.
  for (let i = 0; i < 8; i++) {
    w.t3.hub.publish(event(`f${i}`, "thread.run_settled", "t-idle"));
  }
  await w.hub.pollEvents();
  await until(() => refreshes === 2);
  const again = await w.read();
  assert.deepEqual(again.full, [false, true]);
  assert.deepEqual(again.reads, ["t-ask", "t-bg", "t-coord", "t-idea", "t-idle", "t-review", "t-work"]);
});

test("signed out, refused or unanswered, the read is the CLI's and events ask T3 nothing while signed out", async () => {
  const w = await setup();
  const expected = await w.cli();
  w.state.signedIn = false;
  const out = await w.read();
  assert.deepEqual(out.out, expected);
  await w.hub.pollEvents();
  assert.equal(w.t3.requests.length, 0);
  assert.equal(await w.signed.errorOf("t-failed"), "cli");

  w.state.signedIn = true;
  w.t3.switches.unauthorized = true;
  w.cliCalls.length = 0;
  assert.deepEqual((await w.read()).out, expected);
  assert.ok(w.cliCalls.some((c) => c.startsWith("thread list")));
  assert.equal(await w.signed.errorOf("t-failed"), "cli");

  w.t3.switches.unauthorized = false;
  await w.t3.down();
  w.cliCalls.length = 0;
  assert.deepEqual((await w.read()).out, expected);
  assert.ok(w.cliCalls.some((c) => c.startsWith("thread list")));
  assert.ok(w.state.warned.some((line) => line.includes("by the t3 command line")));

  // Back again: the full list and every busy thread are read anew.
  await w.t3.up();
  const back = await w.read();
  assert.deepEqual(back.full, [false, true]); // no signed-in read had listed the settled threads yet
  assert.ok(back.reads.includes("t-work"));
});

test("a failed thread's error is read over MCP when signed in, a few at a time, and never by a thread show", async () => {
  const w = await setup();
  const failed = w.threads.find((t) => t.threadId === "t-failed") as MockThread;
  const item = (position: number, type: string, runId: string, text: string) => ({ position, type, runId, text });
  Object.assign(failed, { activity: [item(1, "error", "run-old", "an older run's"), item(2, "error", "run-t-failed", "API Error: 529 overloaded"), item(3, "tool_call", "run-t-failed", "x")] });
  const t3 = { status: { state: "ok" }, threads: new Map(), states: new Map([["t-failed", "failed"]]), idle: new Map([["0001", [{ id: "t-failed" }]]]) };
  const braid = { number: "0001", brief: { status: "In Progress" }, strands: [] };
  const shows: string[] = [];
  const got = await failureReader(cliRunner(w.threads, shows), w.root, w.signed.errorOf)(t3, [braid]);
  assert.equal(got.get("t-failed").short, "Provider overloaded");
  assert.deepEqual(shows, []);

  // Twenty failed together: four reads at a time.
  let running = 0;
  let most = 0;
  const ids = Array.from({ length: 20 }, (_, i) => `x${i}`);
  const many = { ...t3, states: new Map(ids.map((id) => [id, "failed"])), idle: new Map(ids.map((id, i) => [`0001/${i}`, [{ id }]])) };
  const strands = ids.map((_, i) => ({ letter: String(i), brief: { status: "In Progress" } }));
  await failureReader(cliRunner(w.threads), w.root, async () => {
    most = Math.max(most, ++running);
    await new Promise((done) => setTimeout(done, 5));
    running--;
    return { error: null };
  })(many, [{ ...braid, strands }]);
  assert.equal(most, 4);
});

test("the running board refreshes a project within seconds of T3's event, long before its timed refresh", async () => {
  const w = await setup();
  const gh = () => Promise.resolve({ status: 0, stdout: "[]", stderr: "" });
  const src = boardMod.repoSources(w.root, gh, cliRunner(w.threads, w.cliCalls), w.hub);
  const started = await boardMod.startBoardWith(src, join(scratch, "no-web"), 600_000);
  after(() => started.close());
  const board = async () => (await (await fetch(`${started.url}api/board`)).json()) as any;
  assert.equal((await board()).t3.state, "ok");
  await until(() => w.t3.requests.some((r) => r.method === "events/poll"));
  await w.hub.pollEvents();
  const lists = () => w.t3.requests.filter((r) => (r.params["arguments"] as any)?.statuses !== undefined).length;
  const before = lists();
  w.t3.hub.publish({ id: "e1", type: "thread.run_settled", projectId: PROJECT, threadId: "t-work", isSubagentChild: false });
  await until(() => lists() > before, 8_000);
  assert.deepEqual(w.cliCalls, []);
  await started.close();
});
