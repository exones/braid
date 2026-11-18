import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const scratch = mkdtempSync(join(tmpdir(), "braid-start-"));
after(() => rmSync(scratch, { recursive: true, force: true }));

// Start on a braid, over the demo data and a fake `t3`. Computed specifiers keep the compiled modules out of the typecheck.
const load = (path: string) => import(pathToFileURL(fileURLToPath(new URL(path, import.meta.url))).href);

interface Result {
  status: number | null;
  stdout: string;
  stderr: string;
}
interface Call {
  root: string;
  args: readonly string[];
  input: string | undefined;
}
interface Start {
  base: string;
  branch: string;
  planned: boolean;
  expected: string | null;
  reason: string | null;
}
interface Card {
  id: string;
  lane: string;
  start: Start;
  coordinator: { link: string | null; warning: string | null } | null;
}
interface Sources {
  braids(): { number: string; source: unknown }[];
  github(fresh: boolean): unknown;
  signals(github: unknown): unknown;
  t3(fresh: boolean): Promise<unknown>;
  start(): unknown;
  [key: string]: unknown;
}
interface Started {
  ok: boolean;
  thread: string | null;
  link: string | null;
  base: string;
  branch: string;
  planned: boolean;
  warning: string | null;
}
const board = (await load("../dist/commands/board.js")) as {
  demoSources(down?: boolean): Sources;
  startAction(src: Sources, root: string, t3: (root: string, args: readonly string[], input?: string) => Promise<Result>, git?: (root: string, args: readonly string[]) => Result): (body: unknown) => Promise<Started>;
  readStartContext(root: string): { main: string; expected: { provider: string; model: string } | null };
  coordinatorMessage(id: string, start: { base: string; branch: string; planned: boolean }): string;
};
const model = (await load("../dist/board/model.js")) as { toBoard(repo: string, braids: unknown, gh: unknown, t3: unknown, sig: unknown, ctx: unknown): { braids: Card[] } };
const demo = await load("../dist/board/demo.js");

async function cards(src: Sources = board.demoSources()): Promise<Card[]> {
  const github = src.github(false);
  return model.toBoard("demo", src.braids(), github, await src.t3(false), src.signals(github), src.start()).braids;
}
const card = async (id: string, src?: Sources): Promise<Card> => {
  const c = (await cards(src)).find((x) => x.id === id);
  assert.ok(c, id);
  return c;
};

/** A fake `t3`: `start` answers with a thread id, `show` with the thread's provider and model. */
function fake(provider = "Claude_Everix", modelSlug = "claude-opus-5-5", startStatus = 0) {
  const calls: Call[] = [];
  const run = (root: string, args: readonly string[], input?: string): Promise<Result> => {
    calls.push({ root, args, input });
    if (startStatus !== 0) {
      return Promise.resolve({ status: startStatus, stdout: "", stderr: "T3 is not running\nmore" });
    }
    const out = args[1] === "start" ? { threadId: "new-1" } : { thread: { threadId: "new-1", link: "https://t3.example/thread/new-1", providerInstanceId: provider, model: modelSlug } };
    return Promise.resolve({ status: 0, stdout: JSON.stringify(out), stderr: "" });
  };
  return { calls, run };
}

/** A fake `git`: fetch works, every ref exists, and the listed branches are taken (locally or on origin). */
function fakeGit(opts: { local?: string[]; remote?: string[]; fetch?: number; missing?: string[] } = {}) {
  const calls: string[][] = [];
  const run = (_root: string, args: readonly string[]): Result => {
    calls.push([...args]);
    const [cmd] = args;
    if (cmd === "fetch") {
      return { status: opts.fetch ?? 0, stdout: "", stderr: opts.fetch ? "could not resolve host\nmore" : "" };
    }
    if (cmd === "branch") {
      return { status: 0, stdout: (opts.local ?? []).join("\n"), stderr: "" };
    }
    if (cmd === "ls-remote") {
      return { status: 0, stdout: (opts.remote ?? []).map((b) => `abc123	refs/heads/${b}`).join("\n"), stderr: "" };
    }
    return { status: (opts.missing ?? []).includes(args[args.length - 1] ?? "") ? 1 : 0, stdout: "", stderr: "" };
  };
  return { calls, run };
}

/** The demo with the braid's brief read from `branch`, as for a braid with a braid branch. */
function onBranch(number: string, branch: string): Sources {
  const base = board.demoSources();
  return { ...base, braids: () => base.braids().map((b) => (b.number === number ? { ...b, source: { branch, commit: "c0ffee" } } : b)) };
}

test("start launches one coordinator thread: title, base branch, first message on stdin, no model flags", async () => {
  const t3 = fake();
  const out = await board.startAction(board.demoSources(), scratch, t3.run, fakeGit().run)({ id: "0012" });
  assert.equal(out.ok, true);
  assert.equal(out.thread, "new-1");
  assert.equal(out.link, "https://t3.example/thread/new-1");
  const start = t3.calls[0];
  assert.deepEqual(start?.args, ["thread", "start", ".", "-", "--title", "demo 0012 coordinator: Sample CSV import", "--worktree", "origin/main", "--branch", "coordinator/0012-sample-import-csv", "--json"]);
  assert.match(start?.input ?? "", /^Use the braid skill and run 0012\./);
  assert.ok(!(start?.args ?? []).some((a) => a === "--model" || a === "--provider"));
  assert.deepEqual(t3.calls[1]?.args, ["thread", "show", "new-1", "--json"]);
  assert.equal(t3.calls.length, 2);
});

test("a braid with a braid branch starts from it, on a coordinator branch; one without a braid branch starts from origin/main", async () => {
  assert.deepEqual(await card("0012").then((c) => [c.start.base, c.start.branch, c.start.planned]), ["origin/main", "coordinator/0012-sample-import-csv", false]);
  const src = onBranch("0012", "origin/braid/0012-sample-import-csv");
  assert.deepEqual(await card("0012", src).then((c) => [c.start.base, c.start.branch, c.start.planned]), ["origin/braid/0012-sample-import-csv", "coordinator/0012-sample-import-csv", true]);
  const t3 = fake();
  await board.startAction(src, scratch, t3.run, fakeGit().run)({ id: "12" });
  assert.deepEqual(t3.calls[0]?.args.slice(6, 10), ["--worktree", "origin/braid/0012-sample-import-csv", "--branch", "coordinator/0012-sample-import-csv"]);
  assert.match(t3.calls[0]?.input ?? "", /resuming a braid you didn.t plan.*git switch braid\/0012-sample-import-csv.*checked out elsewhere/s);
  assert.match(board.coordinatorMessage("0012", { base: "origin/main", branch: "coordinator/0012-x", planned: false }), /already exists in braids\/ on the main branch.*Detail it or run it.*don't plan it again/);
});

test("Start fetches first and branches from origin, not from the local branch; the first message of an item without a braid branch says to detail or run it", async () => {
  const t3 = fake();
  const git = fakeGit();
  await board.startAction(board.demoSources(), scratch, t3.run, git.run)({ id: "0012" });
  assert.deepEqual(git.calls[0], ["fetch", "origin"]);
  assert.equal(t3.calls[0]?.args[7], "origin/main");
  assert.match(t3.calls[0]?.input ?? "", /already exists in braids\/ on the main branch.*don't plan it again/s);
  assert.doesNotMatch(t3.calls[0]?.input ?? "", /resuming a braid/);
  const braid = fake();
  await board.startAction(onBranch("0012", "braid/0012-sample-import-csv"), scratch, braid.run, fakeGit().run)({ id: "0012" });
  assert.equal(braid.calls[0]?.args[7], "origin/braid/0012-sample-import-csv");
});

test("a taken branch name gets -2, -3, …; Start never passes T3 an existing branch", async () => {
  for (const [git, want] of [
    [fakeGit({ local: ["main", "coordinator/0012-sample-import-csv"] }), "coordinator/0012-sample-import-csv-2"],
    [fakeGit({ remote: ["coordinator/0012-sample-import-csv", "coordinator/0012-sample-import-csv-2"] }), "coordinator/0012-sample-import-csv-3"],
    [fakeGit({ local: ["coordinator/0012-sample-import-csv"], remote: ["coordinator/0012-sample-import-csv-2"] }), "coordinator/0012-sample-import-csv-3"],
    [fakeGit({ local: ["plan/sample-import-csv"] }), "coordinator/0012-sample-import-csv"],
  ] as const) {
    const t3 = fake();
    const out = await board.startAction(board.demoSources(), scratch, t3.run, git.run)({ id: "0012" });
    assert.equal(out.branch, want);
    assert.equal(t3.calls[0]?.args[9], want);
    assert.match(t3.calls[0]?.input ?? "", new RegExp(`on \`${want}\``));
    assert.ok(git.calls.some((c) => c[0] === "ls-remote" && c.includes("--heads") && c.includes("origin")));
  }
});

test("a failed fetch, a missing base or a branch listing that can't run disables Start with its reason, and nothing launches", async () => {
  const t3 = fake();
  await assert.rejects(board.startAction(board.demoSources(), scratch, t3.run, fakeGit({ fetch: 1 }).run)({ id: "0012" }), /Start: git fetch failed \(could not resolve host\)$/);
  await assert.rejects(board.startAction(board.demoSources(), scratch, t3.run, fakeGit({ missing: ["origin/main"] }).run)({ id: "0012" }), /Start: origin\/main not found after the fetch/);
  const broken = (root: string, args: readonly string[]): Result => (args[0] === "ls-remote" ? { status: 128, stdout: "", stderr: "no remote\n" } : fakeGit().run(root, args));
  await assert.rejects(board.startAction(board.demoSources(), scratch, t3.run, broken)({ id: "0012" }), /Start: branches can't be listed \(no remote\)/);
  assert.deepEqual(t3.calls, []);
});

test("the launch warns when the thread's provider or model differ from BRAID.md's coordinator", async () => {
  const same = await board.startAction(board.demoSources(), scratch, fake().run, fakeGit().run)({ id: "0012" });
  assert.equal(same.warning, null);
  const other = await board.startAction(board.demoSources(), scratch, fake("Claude_Everix", "claude-sonnet-5-5").run, fakeGit().run)({ id: "0012" });
  assert.match(other.warning ?? "", /Claude_Everix \/ claude-sonnet-5-5; BRAID\.md names Claude_Everix \/ claude-opus-5-5/);
  const provider = await board.startAction(board.demoSources(), scratch, fake("cursor", "claude-opus-5-5").run, fakeGit().run)({ id: "0012" });
  assert.match(provider.warning ?? "", /cursor \/ claude-opus-5-5/);
});

test("the card of a running coordinator warns when its model differs, and says nothing when it matches", async () => {
  assert.equal((await card("0011")).coordinator?.warning, null);
  assert.match((await card("0013")).coordinator?.warning ?? "", /claude-sonnet-5-5; BRAID\.md names Claude_Everix \/ claude-opus-5-5/);
  assert.equal((await card("0012")).coordinator, null);
});

test("Start is off with its reason: not To Do, a coordinator runs, T3 isn't reachable", async () => {
  assert.equal((await card("0012")).start.reason, null);
  assert.equal((await card("0002")).start.reason, "the braid isn't To Do");
  assert.equal((await card("0011")).start.reason, "a coordinator for this braid is running");
  const down = board.demoSources(true);
  assert.equal((await card("0012", down)).start.reason, "T3 isn't reachable");
  const t3 = fake();
  for (const [id, src, reason] of [
    ["0002", board.demoSources(), /Start: the braid isn't To Do/],
    ["0011", board.demoSources(), /Start: a coordinator for this braid is running/],
    ["0012", down, /Start: T3 isn't reachable/],
  ] as const) {
    await assert.rejects(board.startAction(src, scratch, t3.run, fakeGit().run)({ id }), reason);
  }
  await assert.rejects(board.startAction(board.demoSources(), scratch, t3.run, fakeGit().run)({}), /start needs \{ id \}/);
  await assert.rejects(board.startAction(board.demoSources(), scratch, t3.run, fakeGit().run)({ id: "0099" }), /Start: no braid 0099/);
  assert.deepEqual(t3.calls, []);
});

test("a failed launch says why and claims nothing", async () => {
  await assert.rejects(board.startAction(board.demoSources(), scratch, fake("a", "b", 1).run, fakeGit().run)({ id: "0012" }), /Not started: T3 is not running$/);
});

test("a title can't carry a shell character to cmd.exe", async () => {
  const src = board.demoSources();
  const odd = { ...src, braids: () => src.braids().map((b) => (b.number === "0012" ? { ...b, brief: { ...(b as unknown as { brief: object }).brief, title: 'Say "hi" & 50% | <go>' } } : b)) };
  const t3 = fake();
  await board.startAction(odd as Sources, scratch, t3.run, fakeGit().run)({ id: "0012" });
  assert.equal(t3.calls[0]?.args[5], "demo 0012 coordinator: Say hi 50 go");
});

test("BRAID.md's coordinator is read for the main branch and the model", () => {
  writeFileSync(join(scratch, "BRAID.md"), "---\nmain: trunk\nmodels:\n  coordinator: Claude_Everix / claude-opus-5-5 / effort=medium\n  worker:\n    story: A / b / effort=medium\n---\n");
  assert.deepEqual(board.readStartContext(scratch), { main: "trunk", expected: { provider: "Claude_Everix", model: "claude-opus-5-5" } });
  assert.deepEqual(board.readStartContext(join(scratch, "none")), { main: "main", expected: null });
  assert.deepEqual(demo.DEMO_START, { main: "main", expected: { provider: "Claude_Everix", model: "claude-opus-5-5" } });
});

test("a running thread titled `<repo> <number> coordinator: …` is that braid's coordinator, with its provider and model; a stopped one is not", async () => {
  const t3 = (await load("../dist/board/t3.js")) as { readT3(root: string, o: { run: unknown; ttlMs: number; agents: string; project: string }): Promise<{ coordinators: Map<string, { id: string; link: string | null; provider: string | null; model: string | null }> }> };
  const root = join(scratch, "demo");
  const listed = [
    { threadId: "c1", status: "running", title: "demo 0012 coordinator: Sample", link: "http://t3/c1", providerInstanceId: "Claude_Everix", model: "claude-opus-5-5" },
    { threadId: "c2", status: "completed", title: "demo 0013 coordinator: Sample", providerInstanceId: "x", model: "y" },
    { threadId: "c3", status: "running", title: "other 0014 coordinator: Sample" },
    { threadId: "c4", status: "running", title: "demo 0015 worker: Sample" },
  ];
  const run = (_root: string, args: readonly string[]): Promise<Result> => Promise.resolve({ status: 0, stdout: args[1] === "list" ? JSON.stringify(listed) : "{}", stderr: "" });
  const read = await t3.readT3(root, { run, ttlMs: 0, agents: join(scratch, "agents"), project: root });
  assert.deepEqual([...read.coordinators], [["0012", { id: "c1", link: "http://t3/c1", provider: "Claude_Everix", model: "claude-opus-5-5" }]]);
});

test("Open thread: an idle, non-archived thread of an item or a braid's coordinator is kept for opening, a running one wins, an archived one is dropped", async () => {
  const t3 = (await load("../dist/board/t3.js")) as { readT3(root: string, o: { run: unknown; ttlMs: number; agents: string; project: string }): Promise<{ coordinators: Map<string, unknown>; idleCoordinators: Map<string, { id: string }>; threads: Map<string, { id: string }[]>; idle: Map<string, { id: string; link: string | null }[]> }> };
  const root = join(scratch, "demo");
  const agents = join(scratch, "agents-idle");
  const where: Record<string, string> = { w1: join(agents, "0020-A"), w2: join(agents, "0020-A"), w3: join(agents, "0020-B"), w4: join(agents, "0020-B") };
  const listed = [
    { threadId: "w1", status: "running", link: "http://t3/w1" },
    { threadId: "w2", status: "completed", link: "http://t3/w2" },
    { threadId: "w3", status: "idle", link: "http://t3/w3" },
    { threadId: "w4", status: "idle", archived: true, link: "http://t3/w4" },
    { threadId: "c1", status: "idle", title: "demo 0020 coordinator: Sample", link: "http://t3/c1" },
    { threadId: "c2", status: "idle", archivedAt: "2026-11-18T00:00:00Z", title: "demo 0021 coordinator: Sample", link: "http://t3/c2" },
  ];
  const run = (_root: string, args: readonly string[]): Promise<Result> => {
    const id = args[2] ?? "";
    const out = args[1] === "list" ? listed : { thread: { worktreePath: where[id] ?? null, pendingRequestCount: 0 } };
    return Promise.resolve({ status: 0, stdout: JSON.stringify(out), stderr: "" });
  };
  const read = await t3.readT3(root, { run, ttlMs: 0, agents, project: root });
  assert.deepEqual(read.threads.get("0020/A")?.map((t) => t.id), ["w1"]);
  assert.deepEqual(read.idle.get("0020/A")?.map((t) => t.id), ["w2"]);
  assert.deepEqual(read.idle.get("0020/B")?.map((t) => [t.id, t.link]), [["w3", "http://t3/w3"]]);
  assert.equal(read.threads.has("0020/B"), false, "an idle thread is no running agent");
  assert.deepEqual([...read.idleCoordinators.keys()], ["0020"]);
  assert.equal(read.coordinators.size, 0);
});

test("the card opens an idle worker thread and an idle coordinator, and Start stays off only for a running coordinator", async () => {
  assert.equal((await card("0002")).coordinator, null);
  const strand = (await cards()).find((c) => c.id === "0002") as unknown as { strands: { id: string; thread: string | null; running: boolean }[] };
  const b = strand.strands.find((s) => s.id === "0002/B");
  assert.equal(b?.thread, "https://t3.example/thread/demo-8");
  assert.equal(b?.running, false);
  const idle = await card("0010");
  assert.equal(idle.coordinator?.link, "https://t3.example/thread/demo-9");
  assert.equal((await card("0011")).start.reason, "a coordinator for this braid is running");
});
