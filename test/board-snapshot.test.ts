import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import type { Server } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const scratch = mkdtempSync(join(tmpdir(), "braid-snapshot-"));
after(() => rmSync(scratch, { recursive: true, force: true, maxRetries: 20, retryDelay: 250 }));
const web = join(scratch, "web");
mkdirSync(web);
writeFileSync(join(web, "index.html"), "<p>board</p>");

interface Sources {
  github(fresh: boolean): unknown;
  t3(fresh: boolean): Promise<unknown>;
  action(name: string): ((body: unknown, board?: () => Promise<unknown>) => unknown) | undefined;
  braids(): unknown[];
}
interface Result {
  status: number | null;
  stdout: string;
  stderr: string;
}
const load = (path: string) => import(pathToFileURL(fileURLToPath(new URL(path, import.meta.url))).href);
const board = (await load("../dist/commands/board.js")) as {
  demoSources(): Sources;
  startBoardWith(src: Sources, web: string, refreshMs?: number, token?: string): Promise<{ server: Server; url: string; token: string; close(): Promise<void> }>;
  openAction(src: Sources, open: (url: string) => Promise<void>): (body: unknown, board?: () => Promise<unknown>) => Promise<{ url: string }>;
  startAction(src: Sources, root: string, t3: (root: string, args: readonly string[], input?: string) => Promise<Result>, git: (root: string, args: readonly string[]) => Result): (body: unknown) => Promise<unknown>;
  mergeAction(src: Sources, root: string, t3: (root: string, args: readonly string[]) => Promise<Result>): (body: unknown) => Promise<unknown>;
};

const sleep = (ms: number) => new Promise((done) => setTimeout(done, ms));

/** The demo with `github` and `t3` slow, counting how often each is read (and whether fresh). */
function slow(ms: number) {
  const base = board.demoSources();
  const calls = { github: [] as boolean[], t3: [] as boolean[], delay: ms };
  const src: Sources = {
    ...base,
    github: async (fresh) => {
      calls.github.push(fresh);
      await sleep(calls.delay);
      return base.github(fresh);
    },
    t3: async (fresh) => {
      calls.t3.push(fresh);
      await sleep(calls.delay);
      return base.t3(fresh);
    },
  };
  return { src, calls };
}

async function serve(src: Sources) {
  const started = await board.startBoardWith(src, web, 600_000);
  after(() => started.close());
  const timed = async (path: string, init?: RequestInit) => {
    const began = Date.now();
    const response = await fetch(`${started.url}${path}`, init);
    return { response, ms: Date.now() - began };
  };
  return { ...started, timed };
}

test("once a snapshot exists, /api/item and Open thread answer without reading gh or t3", async () => {
  const { src, calls } = slow(1000);
  const opened: string[] = [];
  const withOpen: Sources = {
    ...src,
    action: (name) => (name === "open" ? (body, snap) => board.openAction(src, (url) => (opened.push(url), Promise.resolve()))(body, snap) : undefined),
  };
  const { timed, token, url } = await serve(withOpen);
  const first = await timed("api/board");
  assert.equal(first.response.status, 200);
  assert.ok(first.ms >= 900, "the first open waits for the first complete snapshot");
  const readsBefore = [calls.github.length, calls.t3.length];
  const item = await timed("api/item?id=0002/A");
  assert.equal(item.response.status, 200);
  assert.ok(item.ms < 500, `item took ${item.ms} ms`);
  const began = Date.now();
  const open = await fetch(`${url}api/action/open`, { method: "POST", headers: { "x-braid-token": token, "content-type": "application/json" }, body: JSON.stringify({ id: "0002/A" }) });
  assert.equal(open.status, 200);
  assert.ok(Date.now() - began < 500, "Open thread answered from the snapshot");
  assert.deepEqual(opened, ["t3code://threads/thread/demo-1"]);
  assert.deepEqual([calls.github.length, calls.t3.length], readsBefore, "neither source was read again");
});

test("a static file and /api/board are served while a slow gh read runs", async () => {
  const { src, calls } = slow(0);
  const { timed } = await serve(src);
  assert.equal((await timed("api/board")).response.status, 200);
  calls.delay = 1500;
  const refresh = timed("api/board?fresh=1"); // a slow read starts and is awaited by this request only
  await sleep(100);
  const page = await timed("");
  assert.equal(page.response.status, 200);
  assert.match(await page.response.text(), /board/);
  const old = await timed("api/board");
  assert.equal(old.response.status, 200);
  assert.ok(page.ms < 500 && old.ms < 500, `static ${page.ms} ms, board ${old.ms} ms`);
  assert.ok((await refresh).ms >= 1000, "fresh=1 answers when its read is done");
});

test("asks for a refresh while one runs queue exactly one more read", async () => {
  const { src, calls } = slow(300);
  const { timed } = await serve(src);
  await timed("api/board");
  const before = calls.github.length;
  await Promise.all([timed("api/board?fresh=1"), timed("api/board?fresh=1"), timed("api/board?fresh=1")]);
  assert.ok(calls.github.length - before <= 2, `${calls.github.length - before} reads`);
});

test("Start and Merge still read GitHub and T3 fresh", async () => {
  const { src, calls } = slow(0);
  const t3 = (_root: string, args: readonly string[]): Promise<Result> =>
    Promise.resolve({ status: 0, stdout: JSON.stringify(args[1] === "start" ? { threadId: "new-1" } : { thread: { threadId: "new-1" } }), stderr: "" });
  const git = (_root: string, args: readonly string[]): Result => ({ status: 0, stdout: args[0] === "branch" || args[0] === "ls-remote" ? "" : "", stderr: "" });
  const { startAction, mergeAction } = board;
  await startAction(src, scratch, t3, git)({ id: "0012" });
  assert.deepEqual([calls.github, calls.t3], [[true], [true]], "start");
  calls.github.length = 0;
  calls.t3.length = 0;
  const head = "a".repeat(40);
  await mergeAction(src, scratch, t3)({ id: "0001/B", head }).catch(() => {});
  assert.deepEqual(calls.github, [true], "merge reads GitHub fresh");
});

test("a read ends only when every source it started has settled; the next successful read replaces a failed one", async () => {
  const base = board.demoSources();
  const events: string[] = [];
  let broken = true;
  const src: Sources = {
    ...base,
    braids: () => {
      if (broken) {
        throw new Error("braids unreadable");
      }
      return base.braids();
    },
    github: async (fresh) => {
      events.push("github start");
      await sleep(600);
      events.push("github end");
      return base.github(fresh);
    },
  };
  const { timed } = await serve(src);
  // The read at start fails at once on braids while its slow gh still runs; a second read is asked for meanwhile.
  await sleep(50);
  broken = false;
  const second = timed("api/board?fresh=1");
  const failed = await timed("api/board");
  assert.equal((await second).response.status, 200, "the next successful read replaces the failure");
  assert.ok([200, 500].includes(failed.response.status));
  assert.deepEqual(events, ["github start", "github end", "github start", "github end"], "gh was not started again before the first call settled");
  assert.equal((await timed("api/board")).response.status, 200);
});

test("Open thread with thread: coordinator takes the coordinator link from the snapshot, and refuses a strand or another thread value", async () => {
  const base = board.demoSources();
  const src: Sources = {
    ...base,
    github: () => assert.fail("gh must not be read"),
    t3: () => assert.fail("t3 must not be read"),
  };
  const card = { id: "0010", thread: "http://127.0.0.1:3773/env/worker", coordinator: { link: "http://127.0.0.1:3773/env/coord" }, strands: [{ id: "0010/A", thread: "http://127.0.0.1:3773/env/a" }] };
  const snapshot = () => Promise.resolve({ braids: [card] });
  const opened: string[] = [];
  const run = (body: unknown) => board.openAction(src, (url) => (opened.push(url), Promise.resolve()))(body, snapshot);
  await run({ id: "0010", thread: "coordinator" });
  await run({ id: "0010" });
  assert.deepEqual(opened, ["t3code://threads/env/coord", "t3code://threads/env/worker"]);
  await assert.rejects(run({ id: "0010/A", thread: "coordinator" }), /is a strand; only a braid has a coordinator thread/);
  await assert.rejects(run({ id: "0010", thread: "worker" }), /thread can only be "coordinator"/);
});

test("Open thread with a link in the snapshot doesn't reload the braids", async () => {
  const base = board.demoSources();
  let loads = 0;
  const src: Sources = { ...base, braids: () => (loads++, base.braids()) };
  const opened: string[] = [];
  const { token, url, timed } = await serve({
    ...src,
    action: (name) => (name === "open" ? (body, snap) => board.openAction(src, (u) => (opened.push(u), Promise.resolve()))(body, snap) : undefined),
  });
  assert.equal((await timed("api/board")).response.status, 200);
  const before = loads;
  const open = await fetch(`${url}api/action/open`, { method: "POST", headers: { "x-braid-token": token, "content-type": "application/json" }, body: JSON.stringify({ id: "0002/A" }) });
  assert.equal(open.status, 200);
  assert.deepEqual(opened, ["t3code://threads/thread/demo-1"]);
  assert.equal(loads, before, "the braids weren't loaded again");
});
