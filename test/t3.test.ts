import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import type { Server } from "node:http";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
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

// braid's worktrees are `<worktrees>/<repo>/<NNNN>[-<L>][-review]`; a thread anywhere else is no agent of an item.
process.env.BRAID_WORKTREES_DIR = join(scratch, "worktrees");
const at = (root: string, folder: string) => join(process.env.BRAID_WORKTREES_DIR as string, basename(root), folder);

const threads = [
  { threadId: "t-run", status: "running", link: "t3://a" },
  { threadId: "t-ask", status: "running" },
  { threadId: "t-stop", status: "interrupted" },
  { threadId: "t-rev", status: "running" },
  { threadId: "t-coord", status: "running" },
  { threadId: "t-hand", status: "running" },
  { threadId: "t-done", status: "completed" },
];

// `show` tells where a thread lives.
function placed(root: string): Record<string, object> {
  return {
    "t-run": { worktreePath: at(root, "0001-A"), pendingRequestCount: 0 },
    "t-ask": { worktreePath: at(root, "0001-B"), pendingRequestCount: 2 },
    "t-stop": { worktreePath: at(root, "0001-C") },
    "t-rev": { worktreePath: at(root, "0001-D-review"), pendingRequestCount: 0 },
    "t-coord": { worktreePath: at(root, "0001"), pendingRequestCount: 0 },
    "t-hand": { worktreePath: join(scratch, "by-hand", "0001-E"), branch: "braid/0001/E-stoppr", pendingRequestCount: 0 },
  };
}

function t3Stub(root: string, calls: string[] = [], list: object[] = threads): T3Run {
  const shown = placed(root);
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

test("only threads in braid's worktrees are agents: workers, reviewers and their questions", async () => {
  const root = files();
  const { get } = await start(root, t3Stub(root));
  const data = await get("api/board");
  assert.deepEqual(data.t3, { state: "ok" });
  const s = Object.fromEntries(data.braids[0].strands.map((x: any) => [x.id.slice(5), x]));
  assert.deepEqual([s.A.lane, s.A.activity, s.A.running], ["In Progress", "agent", true]); // stored To Do, but an agent runs
  assert.deepEqual([s.B.lane, s.B.reason, s.B.need.kind], ["Waiting", "question", "question"]);
  assert.deepEqual([s.C.lane, s.C.running], ["In Progress", false]); // an interrupted thread is nothing; stalled shows only after 10 minutes
  assert.deepEqual([s.D.lane, s.D.reason, s.D.activity], ["In Progress", null, "review"]); // failing checks, but a reviewer runs on its checkout
  assert.deepEqual([s.E.lane, s.E.running], ["In Progress", false]); // a thread started by hand elsewhere is no agent
  assert.deepEqual([s.F.lane, s.F.running], ["In Progress", false]);
  assert.equal(data.braids[0].lane, "Waiting");
  assert.equal(data.braids[0].need.text, "An agent asked a question: answer it in its thread");
  assert.equal(data.braids[0].need.who, "0001/B");
  assert.equal((await get("api/item?id=0001/B")).reason, "question");
});

test("a coordinator on a braid branch with strands is no agent; a story's own worker is", async () => {
  const root = repo({
    "braids/0001-a/brief.md": brief("0001", "To Do"),
    "braids/0001-a/A-run/brief.md": brief("0001/A", "To Do"),
    "braids/0002-story/brief.md": brief("0002", "To Do"),
  });
  const shown: Record<string, object> = {
    "t-coord": { worktreePath: at(root, "0001"), pendingRequestCount: 1 },
    "t-story": { worktreePath: at(root, "0002"), pendingRequestCount: 0 },
  };
  const run: T3Run = (_root, args) =>
    Promise.resolve(args[1] === "list" ? ok([{ threadId: "t-coord", status: "running" }, { threadId: "t-story", status: "running" }]) : ok({ thread: shown[args[2] ?? ""] ?? {} }));
  const { get } = await start(root, run);
  const [braid, story] = (await get("api/board")).braids;
  assert.deepEqual([braid.lane, braid.running, braid.need], ["To Do", false, null]); // not even its question counts
  assert.deepEqual([story.lane, story.running, story.activity], ["In Progress", true, "agent"]);
});

test("a running thread is shown once per refresh; an idle one is not shown at all", async () => {
  const calls: string[] = [];
  const root = files();
  const { get } = await start(root, t3Stub(root, calls));
  await get("api/board?fresh=1");
  await get("api/board?fresh=1");
  const shows = calls.filter((c) => c.startsWith("thread show"));
  assert.equal(shows.filter((c) => c.includes("t-stop")).length, 0);
  assert.equal(shows.filter((c) => c.includes("t-done")).length, 0);
  assert.equal(shows.filter((c) => c.includes("t-run ")).length, 2);
});

test("a refresh inside the share window reads t3 once; fresh=1 reads again", async () => {
  const calls: string[] = [];
  const root = files();
  const { get } = await start(root, t3Stub(root, calls));
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
    assert.deepEqual(lanes, ["To Do", "In Progress", "In Progress", "In Progress", "In Progress", "In Progress"]);
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
  const root = files();
  const { url } = await start(root, t3Stub(root), 100);
  assert.match(await firstRefresh(url), /data: refresh/);
});

test("a change under braids/ pushes a refresh at once", async () => {
  const root = files();
  const { url } = await start(root, t3Stub(root), 600_000);
  const pending = firstRefresh(url);
  await new Promise((r) => setTimeout(r, 300));
  writeFileSync(join(root, "braids/0001-a/A-run/brief.md"), brief("0001/A", "Done"));
  assert.match(await pending, /data: refresh/);
});

test("the demo shows every lane and every reason, request and alarm from built-in samples", async () => {
  const { server, url } = await board.startBoardWith(board.demoSources(), join(scratch, "no-web"));
  after(() => server.close());
  const data = (await (await fetch(`${url}api/board`)).json()) as any;
  assert.equal(data.repo, "demo");
  assert.deepEqual(new Set(data.braids.map((b: any) => b.lane)), new Set(data.lanes));
  const strands = data.braids.flatMap((b: any) => b.strands);
  const reasons = new Set(strands.map((s: any) => s.reason).filter((r: unknown) => r !== null));
  const braidReasons = data.braids.map((b: any) => b.reason).filter((r: unknown) => r !== null);
  assert.deepEqual(new Set([...reasons, ...braidReasons]), new Set(["question", "decision", "plan", "checks failed", "stalled"]));
  assert.deepEqual(new Set(strands.map((s: any) => s.activity).filter((a: unknown) => a !== null)), new Set(["agent", "review", "checks"]));
  assert.equal(strands.some((s: any) => s.need?.kind === "review" && s.need.age === "2h"), true);
  assert.equal(strands.some((s: any) => s.ask === "approve-layout"), true);
  assert.equal(strands.some((s: any) => s.lane === "In Progress"), true);
  assert.equal(((await (await fetch(`${url}api/item?id=0008/A`)).json()) as any).report.startsWith("# Report"), true);
  const down = await board.startBoardWith(board.demoSources(true), join(scratch, "no-web"));
  after(() => down.server.close());
  assert.equal(((await (await fetch(`${down.url}api/board`)).json()) as any).t3.state, "unavailable");
});

test("the demo data is reusable and loads without a repository", () => {
  assert.equal(demo.demoBraids().length, 24);
  assert.ok(demo.demoGithub());
  assert.ok(demo.demoT3());
});

test("thread list is asked for the main checkout, also when the board starts in a linked worktree", async () => {
  const git = (cwd: string, ...args: string[]) => {
    const r = spawnSync("git", ["-c", "user.name=t", "-c", "user.email=t@example.com", ...args], { cwd, encoding: "utf8" });
    assert.equal(r.status, 0, r.stderr);
  };
  const main = realpathSync.native(repo({ "braids/0001-a/brief.md": brief("0001", "In Progress") }));
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
  assert.equal(realpathSync.native(list[at + 1] ?? ""), main);
  assert.equal(calls.some((c) => c[1] === "show" && c.includes("--project")), false);
});
