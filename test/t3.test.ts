import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import type { Server } from "node:http";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, beforeEach, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const scratch = mkdtempSync(join(tmpdir(), "braid-t3-"));
after(() => rmSync(scratch, { recursive: true, force: true }));

interface Result {
  status: number | null;
  stdout: string;
  stderr: string;
  error?: Error;
}
type Gh = (root: string, args: readonly string[]) => Result;
type T3Run = (root: string, args: readonly string[]) => Promise<Result>;
interface Demo {
  demoBraids: () => unknown[];
  demoGithub: () => unknown;
  demoT3: (down?: boolean) => unknown;
}

// Computed specifiers keep the compiled modules out of the typecheck, which runs before the build.
const load = (path: string) => import(pathToFileURL(fileURLToPath(new URL(path, import.meta.url))).href);
const board = (await load("../dist/commands/board.js")) as {
  startBoard: (root: string, web: string, gh: Gh, t3: T3Run, refreshMs?: number) => Promise<{ server: Server; url: string }>;
  startBoardWith: (src: unknown, web: string, refreshMs?: number) => Promise<{ server: Server; url: string }>;
  demoSources: (down?: boolean) => unknown;
};
const { resetGithubMemory } = (await load("../dist/board/github.js")) as { resetGithubMemory: () => void };
const { resetT3Memory } = (await load("../dist/board/t3.js")) as { resetT3Memory: () => void };
const demo = (await load("../dist/board/demo.js")) as Demo;

beforeEach(() => {
  resetGithubMemory();
  resetT3Memory();
});

let repos = 0;
function repo(files: Record<string, string>): string {
  const root = join(scratch, `repo-${++repos}`);
  mkdirSync(join(root, ".git"), { recursive: true });
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  }
  return root;
}
const brief = (id: string, status: string, extra = "") => `---\nid: '${id}'\ntitle: T ${id}\nstatus: ${status}\n${extra}---\n\n## Goal\n\nDo it.\n`;
const files = () =>
  repo({
    "braids/0001-a/brief.md": brief("0001", "In Progress"),
    "braids/0001-a/A-run/brief.md": brief("0001/A", "To Do"),
    "braids/0001-a/B-ask/brief.md": brief("0001/B", "In Progress"),
    "braids/0001-a/C-stop/brief.md": brief("0001/C", "In Progress"),
    "braids/0001-a/D-redrun/brief.md": brief("0001/D", "In Progress"),
    "braids/0001-a/E-stoppr/brief.md": brief("0001/E", "In Progress"),
    "braids/0001-a/F-idle/brief.md": brief("0001/F", "In Progress"),
  });

const ok = (data: unknown): Result => ({ status: 0, stdout: JSON.stringify(data), stderr: "" });
const red = [{ conclusion: "FAILURE", status: "COMPLETED" }];
const prs = [
  { number: 40, url: "https://github.com/o/r/pull/40", state: "OPEN", headRefName: "braid/0001/D-redrun", statusCheckRollup: red },
  { number: 41, url: "https://github.com/o/r/pull/41", state: "OPEN", headRefName: "braid/0001/E-stoppr", statusCheckRollup: [] },
];
const gh: Gh = () => ok(prs);

const threads = [
  { threadId: "t-run", status: "running", link: "t3://a", pullRequests: [] },
  { threadId: "t-ask", status: "running", pullRequests: [] },
  { threadId: "t-stop", status: "interrupted", pullRequests: [] },
  { threadId: "t-red", status: "running", pullRequests: [{ number: 40 }] },
  { threadId: "t-stoppr", status: "cancelled", linkedPullRequest: { url: "https://github.com/o/r/pull/41" } },
  { threadId: "t-done", status: "completed", pullRequests: [] },
];

// `show` tells where a thread lives: here by branch, since a worktree match needs a real `git worktree`.
const shown: Record<string, object> = {
  "t-run": { branch: "braid/0001/A-run", worktreePath: null, pendingRequestCount: 0 },
  "t-ask": { branch: "braid/0001/B-ask", worktreePath: null, pendingRequestCount: 2 },
  "t-stop": { branch: "braid/0001/C-stop", worktreePath: null },
  "t-red": { branch: null, worktreePath: null, pendingRequestCount: 0 },
};

function t3Stub(calls: string[] = [], list: object[] = threads): T3Run {
  return (_root, args) => {
    calls.push(args.join(" "));
    if (args[1] === "list") {
      return Promise.resolve(ok(list));
    }
    return Promise.resolve(ok({ thread: shown[args[2] ?? ""] ?? {} }));
  };
}

async function start(root: string, t3: T3Run, refreshMs = 30_000) {
  const { server, url } = await board.startBoard(root, join(scratch, "no-web"), gh, t3, refreshMs);
  after(() => {
    server.close();
    server.closeAllConnections();
  });
  return { url, get: async (path: string) => (await (await fetch(`${url}${path}`)).json()) as any };
}

test("running, question and stopped threads put strands in the right lanes", async () => {
  const { get } = await start(files(), t3Stub());
  const data = await get("api/board");
  assert.deepEqual(data.t3, { state: "ok" });
  const s = Object.fromEntries(data.braids[0].strands.map((x: any) => [x.id.slice(5), x]));
  assert.deepEqual([s.A.lane, s.A.reason], ["In Progress", null]); // stored To Do, but an agent runs
  assert.deepEqual([s.B.lane, s.B.reason], ["Waiting", "question"]);
  assert.deepEqual([s.C.lane, s.C.reason], ["Waiting", "agent stopped"]);
  assert.deepEqual([s.D.lane, s.D.reason], ["In Progress", null]); // failing checks, but an agent runs
  assert.deepEqual([s.E.lane, s.E.reason], ["In Review", null]); // its agent stopped, but it has a PR
  assert.deepEqual([s.F.lane, s.F.reason], ["In Progress", null]); // no thread: the stored status
  assert.equal(data.braids[0].lane, "Waiting");
  assert.equal((await get("api/item?id=0001/B")).reason, "question");
});

test("a thread is joined once: show is cached per thread, stopped threads with a PR need none", async () => {
  const calls: string[] = [];
  const { get } = await start(files(), t3Stub(calls));
  await get("api/board?fresh=1");
  await get("api/board?fresh=1");
  const shows = calls.filter((c) => c.startsWith("thread show"));
  // Running threads are shown on every refresh (pending questions); t-stop only on the first.
  assert.equal(shows.filter((c) => c.includes("t-stop ")).length, 1);
  assert.equal(shows.filter((c) => c.includes("t-stoppr")).length, 0);
  assert.equal(shows.filter((c) => c.includes("t-done")).length, 0);
  assert.equal(shows.filter((c) => c.includes("t-run ")).length, 2);
});

test("a refresh inside the share window reads t3 once; fresh=1 reads again", async () => {
  const calls: string[] = [];
  const { get } = await start(files(), t3Stub(calls));
  await get("api/board");
  await get("api/item?id=0001/A");
  const lists = () => calls.filter((c) => c.startsWith("thread list")).length;
  assert.equal(lists(), 1);
  await get("api/board?fresh=1");
  assert.equal(lists(), 2);
});

test("without T3 the board still works and says so", async () => {
  const cases: [T3Run, RegExp][] = [
    [() => Promise.resolve({ status: null, stdout: "", stderr: "", error: new Error("ENOENT") }), /not installed/],
    [() => Promise.resolve({ status: 1, stdout: "", stderr: "connect ECONNREFUSED\nmore" }), /T3 is not running \(connect ECONNREFUSED\)/],
    [() => Promise.resolve({ status: 0, stdout: "nope", stderr: "" }), /unreadable/],
  ];
  for (const [run, reason] of cases) {
    resetT3Memory();
    const { get } = await start(files(), run);
    const data = await get("api/board");
    assert.equal(data.t3.state, "unavailable");
    assert.match(data.t3.reason, reason);
    const lanes = data.braids[0].strands.map((x: any) => x.lane);
    assert.deepEqual(lanes, ["To Do", "In Progress", "In Progress", "Waiting", "In Review", "In Progress"]);
  }
});

async function firstRefresh(url: string): Promise<string> {
  const controller = new AbortController();
  const response = await fetch(`${url}api/events`, { signal: controller.signal });
  assert.equal(response.headers.get("content-type"), "text/event-stream");
  const reader = (response.body as ReadableStream<Uint8Array>).getReader();
  let text = "";
  const deadline = Date.now() + 8000;
  while (!text.includes("data: refresh") && Date.now() < deadline) {
    text += new TextDecoder().decode((await reader.read()).value);
  }
  controller.abort();
  return text;
}

test("the event stream pushes a refresh on a timer", async () => {
  const { url } = await start(files(), t3Stub(), 100);
  assert.match(await firstRefresh(url), /data: refresh/);
});

test("a change under braids/ pushes a refresh at once", async () => {
  const root = files();
  const { url } = await start(root, t3Stub(), 600_000);
  const pending = firstRefresh(url);
  await new Promise((r) => setTimeout(r, 300));
  writeFileSync(join(root, "braids/0001-a/A-run/brief.md"), brief("0001/A", "Done"));
  assert.match(await pending, /data: refresh/);
});

test("the demo shows every lane and every Waiting reason from built-in samples", async () => {
  const { server, url } = await board.startBoardWith(board.demoSources(), join(scratch, "no-web"));
  after(() => server.close());
  const data = (await (await fetch(`${url}api/board`)).json()) as any;
  assert.equal(data.repo, "demo");
  assert.deepEqual(new Set(data.braids.map((b: any) => b.lane)), new Set(data.lanes));
  const strands = data.braids.flatMap((b: any) => b.strands);
  const reasons = new Set(strands.map((s: any) => s.reason).filter((r: unknown) => r !== null));
  assert.deepEqual(reasons, new Set(["question", "agent stopped", "checks failed", "approve-layout"]));
  assert.equal(strands.some((s: any) => s.lane === "In Progress"), true);
  assert.equal(((await (await fetch(`${url}api/item?id=0008/A`)).json()) as any).report.startsWith("# Report"), true);
  const down = await board.startBoardWith(board.demoSources(true), join(scratch, "no-web"));
  after(() => down.server.close());
  assert.equal(((await (await fetch(`${down.url}api/board`)).json()) as any).t3.state, "unavailable");
});

test("the demo data is reusable and loads without a repository", () => {
  assert.equal(demo.demoBraids().length, 8);
  assert.ok(demo.demoGithub());
  assert.ok(demo.demoT3());
});

test("a coordinator listing many PRs joins no strand; a linked PR wins over a longer list", async () => {
  // The TASK-2.2 sample: a running coordinator thread with a dozen PRs of its own and no linked one.
  const many = Array.from({ length: 18 }, (_, i) => ({ number: 39 + i, url: `https://github.com/o/r/pull/${39 + i}`, state: "open" }));
  const coordinator = { threadId: "t-coord", status: "running", linkedPullRequest: null, pullRequests: many };
  const { get } = await start(files(), t3Stub([], [coordinator]));
  const s = Object.fromEntries((await get("api/board")).braids[0].strands.map((x: any) => [x.id.slice(5), x]));
  assert.deepEqual([s.D.lane, s.D.reason], ["Waiting", "checks failed"]); // PR 40 is in its list, but it is not its PR
  assert.equal(s.E.lane, "In Review"); // PR 41 too

  resetT3Memory();
  const worker = { threadId: "t-worker", status: "running", linkedPullRequest: { number: 40 }, pullRequests: many };
  const linked = await start(files(), t3Stub([], [worker]));
  const d = (await linked.get("api/board")).braids[0].strands.find((x: any) => x.id === "0001/D");
  assert.equal(d.lane, "In Progress");
});

test("thread list is asked for the main checkout, also when the board starts in a linked worktree", async () => {
  const git = (cwd: string, ...args: string[]) => {
    const r = spawnSync("git", ["-c", "user.name=t", "-c", "user.email=t@example.com", ...args], { cwd, encoding: "utf8" });
    assert.equal(r.status, 0, r.stderr);
  };
  const main = realpathSync(repo({ "braids/0001-a/brief.md": brief("0001", "In Progress") }));
  rmSync(join(main, ".git"), { recursive: true });
  git(main, "init", "-q");
  git(main, "add", "-A");
  git(main, "commit", "-q", "-m", "x");
  const linked = join(scratch, "linked-worktree");
  git(main, "worktree", "add", "-q", linked, "-b", "other");
  const calls: string[][] = [];
  const run: T3Run = (_root, args) => {
    calls.push([...args]);
    return Promise.resolve(ok([]));
  };
  const { get } = await start(linked, run);
  await get("api/board");
  const list = calls.find((c) => c[1] === "list") ?? [];
  const at = list.indexOf("--project");
  assert.notEqual(at, -1);
  assert.equal(realpathSync(list[at + 1] ?? ""), main);
  assert.equal(calls.some((c) => c[1] === "show" && c.includes("--project")), false);
});
