import assert from "node:assert/strict";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

// Promote to Braid on an idea, over the demo data and fake `t3` and `git`. Computed specifiers keep the compiled modules out of the typecheck.
const load = (path: string) => import(pathToFileURL(fileURLToPath(new URL(path, import.meta.url))).href);

interface Result {
  status: number | null;
  stdout: string;
  stderr: string;
}
interface Call {
  args: readonly string[];
  input: string | undefined;
}
interface Sources {
  inbox(fetch: boolean): unknown;
  start(): unknown;
  t3(fresh: boolean): Promise<unknown>;
  [key: string]: unknown;
}
interface Promoted {
  ok: boolean;
  id: string;
  thread: string | null;
  link: string | null;
  base: string;
  branch: string;
  warning: string | null;
}
type Git = (root: string, args: readonly string[]) => Result;
const board = (await load("../dist/commands/board.js")) as {
  demoSources(down?: boolean): Sources;
  promoteAction(src: Sources, root: string, t3: (root: string, args: readonly string[], input?: string) => Promise<Result>, git?: Git): (body: unknown) => Promise<Promoted>;
  openAction(src: Sources, open: (url: string) => Promise<void>): (body: unknown, snapshot?: () => Promise<unknown>) => Promise<{ url: string }>;
};
const t3mod = (await load("../dist/board/t3.js")) as { ideaPlanning(t3: unknown, id: string): { link: string | null } | null };
const reader = (await load("../dist/board/t3.js")) as { readT3(root: string, o: { run: (root: string, args: readonly string[]) => Promise<Result>; ttlMs: number; agents: string; project: string }): Promise<{ ideaThreads?: Map<string, { link: string | null }> }> };
const model = (await load("../dist/board/model.js")) as { toBoard(repo: string, braids: unknown, gh: unknown, t3: unknown, sig: unknown, ctx: unknown, inbox: unknown): { inbox: { base?: string; ideas: { id: string; planning: { link: string | null } | null }[] } }; noSignals(): unknown };

const IDEA = "2026-11-18-q1wd"; // an open idea of the demo, not being planned
const PLANNED = "2026-11-15-w8nn"; // an open idea of the demo with a running coordinator
const LEFTOVER = "2026-11-18-k3fa";

function fake(provider = "Claude_Everix", modelSlug = "claude-opus-5-5", startStatus = 0) {
  const calls: Call[] = [];
  const run = (_root: string, args: readonly string[], input?: string): Promise<Result> => {
    calls.push({ args, input });
    if (startStatus !== 0) {
      return Promise.resolve({ status: startStatus, stdout: "", stderr: "T3 is not running\nmore" });
    }
    const out = args[1] === "start" ? { threadId: "new-1" } : { thread: { threadId: "new-1", link: "https://t3.example/thread/new-1", providerInstanceId: provider, model: modelSlug } };
    return Promise.resolve({ status: 0, stdout: JSON.stringify(out), stderr: "" });
  };
  return { calls, run };
}

function fakeGit(opts: { local?: string[]; remote?: string[]; fetch?: number; missing?: string[] } = {}) {
  const calls: string[][] = [];
  const run: Git = (_root, args) => {
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

const refused = (run: Promise<unknown>, message: RegExp) => assert.rejects(run, (e: Error) => e.name === "UsageError" && message.test(e.message));

test("Promote on an open idea starts a coordinator: branch, title, first message, no model flags", async () => {
  const t3 = fake();
  const git = fakeGit();
  const out = await board.promoteAction(board.demoSources(), "/repo", t3.run, git.run)({ id: IDEA });
  assert.equal(out.ok, true);
  assert.equal(out.branch, `coordinator/idea-${IDEA}`);
  assert.equal(out.base, "origin/main");
  assert.equal(out.thread, "new-1");
  assert.equal(out.link, "https://t3.example/thread/new-1");
  assert.equal(out.warning, null);
  assert.deepEqual(git.calls[0], ["fetch", "origin"]);
  const start = t3.calls[0];
  assert.ok(start);
  assert.deepEqual(start.args.slice(0, 3), ["thread", "start", "."]);
  assert.equal(start.args[start.args.indexOf("--title") + 1], '🧠 demo idea coordinator: A what changed since I looked view');
  assert.equal(start.args[start.args.indexOf("--worktree") + 1], "origin/main");
  assert.equal(start.args[start.args.indexOf("--branch") + 1], `coordinator/idea-${IDEA}`);
  assert.ok(!start.args.some((a) => /model|provider/i.test(a)));
  const message = start.input ?? "";
  assert.ok(message.startsWith(`Use the braid skill and plan a braid from the idea ${IDEA}: A "what changed since I looked" view.`));
  assert.match(message, /> When I come back after a day/);
  assert.match(message, /> Unsure whether the board should remember my last visit/);
  assert.match(message, /Promote to Braid, which is the user's request to plan this idea \(not to start it\)/);
  assert.match(message, new RegExp(`braid inbox take ${IDEA} --into <braid ids>`));
});

test("a taken branch name gets -2, -3", async () => {
  const taken = `coordinator/idea-${IDEA}`;
  const out = await board.promoteAction(board.demoSources(), "/repo", fake().run, fakeGit({ local: [taken], remote: [`${taken}-2`] }).run)({ id: IDEA });
  assert.equal(out.branch, `${taken}-3`);
});

test("the model warning is the one Start gives", async () => {
  const out = await board.promoteAction(board.demoSources(), "/repo", fake("Claude_Everix", "claude-sonnet-5-5").run, fakeGit().run)({ id: IDEA });
  assert.match(out.warning ?? "", /sonnet/);
});

test("refused with Promote: <reason> for an unknown entry, a leftover, a running coordinator, T3 down and git failures", async () => {
  const run = (src: Sources, id: unknown, git = fakeGit()) => {
    const t3 = fake();
    return { t3, go: board.promoteAction(src, "/repo", t3.run, git.run)({ id }) };
  };
  const a = run(board.demoSources(), "2099-01-01-nope");
  await refused(a.go, /^Promote: no open idea 2099-01-01-nope/);
  const b = run(board.demoSources(), LEFTOVER);
  await refused(b.go, /^Promote: no open idea .*leftover/);
  const c = run(board.demoSources(), PLANNED);
  await refused(c.go, /^Promote: a coordinator is already planning idea/);
  const d = run(board.demoSources(true), IDEA);
  await refused(d.go, /^Promote: T3 isn't reachable \(T3 is not running\)/);
  await refused(run(board.demoSources(), IDEA, fakeGit({ fetch: 1 })).go, /^Promote: git fetch failed \(could not resolve host\)/);
  await refused(run(board.demoSources(), IDEA, fakeGit({ missing: ["origin/main"] })).go, /^Promote: origin\/main not found/);
  await refused(run(board.demoSources(), undefined).go, /promote needs \{ id \}/);
  for (const r of [a, b, c, d]) {
    assert.equal(r.t3.calls.length, 0, "nothing was launched");
  }
});

test("a failed launch is Not started: <first line>", async () => {
  await refused(board.promoteAction(board.demoSources(), "/repo", fake("x", "y", 1).run, fakeGit().run)({ id: IDEA }), /^Not started: T3 is not running$/);
});

test("the planning check: a running thread on coordinator/idea-<id>, -2 or -3, and no other", () => {
  const thread = (link: string) => ({ id: "t", link, provider: null, model: null });
  const t3 = { status: { state: "ok" }, threads: new Map(), ideaThreads: new Map([[`coordinator/idea-${IDEA}-2`, thread("l2")], ["coordinator/idea-2026-11-18-abcd", thread("lx")]]) };
  assert.equal(t3mod.ideaPlanning(t3, IDEA)?.link, "l2");
  assert.equal(t3mod.ideaPlanning(t3, "2026-11-18-ab"), null);
  assert.equal(t3mod.ideaPlanning(t3, "2026-11-18-zzzz"), null);
  assert.equal(t3mod.ideaPlanning({ status: { state: "ok" }, threads: new Map() }, IDEA), null);
});

test("the board marks the planned idea with its thread link; the others have none", async () => {
  const src = board.demoSources();
  const inbox = await src.inbox(false);
  const data = model.toBoard("demo", [], { status: { state: "ok" } }, await src.t3(false), model.noSignals(), src.start(), inbox);
  assert.equal(data.inbox.base, "origin/main");
  const planned = data.inbox.ideas.filter((i) => i.planning !== null);
  assert.deepEqual(planned.map((i) => [i.id, i.planning?.link]), [[PLANNED, "https://t3.example/thread/demo-11"]]);
});

test("Open thread on an idea opens the server's link for it, and is refused without a running coordinator", async () => {
  const opened: string[] = [];
  const open = board.openAction(board.demoSources(), (url) => {
    opened.push(url);
    return Promise.resolve();
  });
  const out = await open({ idea: PLANNED });
  assert.equal(opened.length, 1);
  assert.equal(opened[0], out.url);
  await refused(open({ idea: IDEA }), /^Open thread: no coordinator is planning idea/);
});

test("reading T3: a running thread on a coordinator/idea- branch is a planning thread; an idle one and other branches are not", async () => {
  const list = [
    { threadId: "a", status: "running", link: "t3://a" },
    { threadId: "b", status: "completed", link: "t3://b" },
    { threadId: "c", status: "running", link: "t3://c" },
  ];
  const branches: Record<string, string> = { a: `coordinator/idea-${IDEA}`, b: "coordinator/idea-2026-11-10-t5cc", c: "braid/0043-x" };
  const run = (_root: string, args: readonly string[]): Promise<Result> =>
    Promise.resolve({ status: 0, stdout: JSON.stringify(args[1] === "list" ? list : { thread: { branch: branches[args[2] ?? ""] ?? null } }), stderr: "" });
  const t3 = await reader.readT3("/nowhere-promote", { run, ttlMs: 0, agents: "/nowhere-agents", project: "/nowhere" });
  assert.deepEqual([...(t3.ideaThreads ?? [])].map(([b, c]) => [b, c.link]), [[`coordinator/idea-${IDEA}`, "t3://a"]]);
});
