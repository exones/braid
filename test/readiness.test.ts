import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const scratch = mkdtempSync(join(tmpdir(), "braid-ready-"));
after(() => rmSync(scratch, { recursive: true, force: true, maxRetries: 20, retryDelay: 250 }));

interface Problem {
  key: string;
  reason: string;
  todo: string;
}
type Gh = { status: { state: "ok" } | { state: "unavailable"; reason: string }; prs: Map<string, unknown> };
const load = (path: string) => import(pathToFileURL(fileURLToPath(new URL(path, import.meta.url))).href);
const { readiness } = (await load("../dist/braids/readiness.js")) as { readiness: (folder: string, github: Gh | null) => Problem[] };
const { readGithubAsync, resetGithubMemory } = (await load("../dist/board/github.js")) as {
  readGithubAsync: (root: string, run: (root: string, args: readonly string[]) => unknown, ttl: number) => Promise<Gh>;
  resetGithubMemory: () => void;
};
const { resetT3Memory } = (await load("../dist/board/t3.js")) as { resetT3Memory: () => void };
const { statusCommand } = (await load("../dist/commands/coordinate.js")) as { statusCommand: (root: string, args: string[], src: object) => Promise<string> };
const { startBoardWith, repoSources, runBoard } = (await load("../dist/commands/board.js")) as {
  runBoard: (root: string, args: string[], tailscale: undefined, run: { gh: (root: string, args: readonly string[]) => unknown; t3: unknown }) => Promise<{ server: import("node:http").Server; close(): Promise<void> }>;
  startBoardWith: (src: unknown, web: string, refreshMs?: number) => Promise<{ server: import("node:http").Server; url: string; close(): Promise<void> }>;
  repoSources: (root: string, gh: unknown, t3: unknown) => unknown;
};

const GOOD = "---\ngate: npm test\nmain: main\nci: [verify]\nmodels:\n  worker: a / b / effort=medium\n---\n";
const BRIEF = `---\nid: '0001'\ntitle: "T"\nstatus: To Do\nlabels: []\ndependencies: []\n---\n\n## Goal\n\nx\n`;
let n = 0;
function project(files: Record<string, string>): string {
  const root = join(scratch, `p-${++n}`);
  mkdirSync(root, { recursive: true });
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  }
  return root;
}
const ready = (): Record<string, string> => ({ "BRAID.md": GOOD, "braids/0001-a/brief.md": BRIEF });
const keys = (ps: Problem[]) => ps.map((p) => p.key);
const OK: Gh = { status: { state: "ok" }, prs: new Map() };

test("a working project has no problems", () => {
  assert.deepEqual(readiness(project(ready()), OK), []);
});

test("backlog/ without braids/ says to import the backlog", () => {
  const ps = readiness(project({ "BRAID.md": GOOD, "backlog/tasks/task-1 - x.md": "x" }), OK);
  assert.deepEqual(keys(ps), ["no-braids"]);
  assert.match(ps[0]?.todo ?? "", /braid import-backlog/);
});

test("no braids/ and no backlog/ is a problem of its own", () => {
  const ps = readiness(project({ "BRAID.md": GOOD }), OK);
  assert.deepEqual(keys(ps), ["no-braids"]);
  assert.doesNotMatch(ps[0]?.todo ?? "", /import-backlog/);
});

test("BRAID.md missing, unclosed or lacking keys", () => {
  assert.deepEqual(keys(readiness(project({ "braids/0001-a/brief.md": BRIEF }), OK)), ["braid-md"]);
  const bad = readiness(project({ ...ready(), "BRAID.md": "---\ngate: x\n" }), OK);
  assert.deepEqual(keys(bad), ["braid-md"]);
  assert.match(bad[0]?.reason ?? "", /unreadable/);
  const none = readiness(project({ ...ready(), "BRAID.md": "no front matter\n" }), OK);
  assert.match(none[0]?.reason ?? "", /unreadable/);
  const partial = readiness(project({ ...ready(), "BRAID.md": "---\ngate: x\nmain: main\n---\n" }), OK);
  assert.match(partial[0]?.reason ?? "", /no ci, models/);
});

test("braid check errors are one problem", () => {
  const ps = readiness(project({ ...ready(), "braids/0002-b/brief.md": "not a brief" }), OK);
  assert.deepEqual(keys(ps), ["check"]);
  assert.match(ps[0]?.reason ?? "", /1 error/);
});

test("unreadable GitHub is a problem, whatever the reason", async () => {
  const root = project(ready());
  for (const [result, text] of [
    [{ status: null, stdout: "", stderr: "", error: new Error("ENOENT") }, /not installed/],
    [{ status: 4, stdout: "", stderr: "To get started with GitHub CLI, please run: gh auth login", error: undefined }, /gh auth login/],
    [{ status: 1, stdout: "", stderr: "no git remotes found", error: undefined }, /no git remotes/],
  ] as const) {
    resetGithubMemory();
    const github = await readGithubAsync(root, () => result, 0);
    const ps = readiness(root, github);
    assert.deepEqual(keys(ps), ["github"]);
    assert.match(ps[0]?.reason ?? "", text);
  }
});

test("GitHub is left unchecked only when the caller passes null", () => {
  const down: Gh = { status: { state: "unavailable", reason: "gh is not installed or not on PATH" }, prs: new Map() };
  const root = project(ready());
  assert.deepEqual(keys(readiness(root, down)), ["github"]);
  assert.deepEqual(readiness(root, null), []);
});

test("readiness never throws: a file it can't read is a problem", () => {
  // `braids` is a file, and BRAID.md is a folder: reading either fails.
  const root = project({ braids: "x" });
  mkdirSync(join(root, "BRAID.md"));
  const ps = readiness(root, OK);
  assert.ok(ps.length >= 1);
  assert.ok(ps.every((p) => p.reason !== "" && p.todo !== ""));
  assert.ok(keys(ps).includes("braid-md"));
});

test("a malformed brief is a problem, not an error, and the board still serves", async () => {
  resetGithubMemory();
  resetT3Memory();
  const root = project({ ...ready(), "braids/0002-b/brief.md": "not a brief" });
  assert.deepEqual(keys(readiness(root, OK)), ["check"]);
  const web = project({ "index.html": "<html></html>" });
  const src = repoSources(root, () => ({ status: 0, stdout: "[]", stderr: "" }), () => Promise.resolve({ status: 0, stdout: "[]", stderr: "" }));
  const { close, url } = await startBoardWith(src, web, 60_000);
  try {
    const res = await fetch(`${url}api/board`);
    assert.equal(res.status, 200);
    const board = (await res.json()) as { problems: Problem[] };
    assert.deepEqual(keys(board.problems), ["check"]);
  } finally {
    await close();
  }
});

test("braid status on backlog/ without braids/ names braid import-backlog instead of failing", async () => {
  resetGithubMemory();
  resetT3Memory();
  const root = project({ "BRAID.md": GOOD, "backlog/tasks/t.md": "x" });
  const out = await statusCommand(root, ["1"], { gh: () => ({ status: 0, stdout: "[]", stderr: "" }), t3: () => Promise.resolve({ status: 0, stdout: "[]", stderr: "" }) });
  assert.match(out, /^not ready: it has backlog\/ but no braids\/; run braid import-backlog\n/);
  assert.match(out, /no braid 0001/);
});

test("braid status on a malformed brief prints the problem too", async () => {
  resetGithubMemory();
  resetT3Memory();
  const root = project({ ...ready(), "braids/0002-b/brief.md": "not a brief" });
  const out = await statusCommand(root, ["1"], { gh: () => ({ status: 0, stdout: "[]", stderr: "" }), t3: () => Promise.resolve({ status: 0, stdout: "[]", stderr: "" }) });
  assert.match(out, /^not ready: braid check reports 1 error/);
});

test("braid status prints a line per problem before the strand lines", async () => {
  resetGithubMemory();
  resetT3Memory();
  const root = project({ "BRAID.md": "---\nci: [verify]\n---\n", "braids/0001-a/brief.md": BRIEF.replace("To Do", "In Progress") });
  const out = await statusCommand(root, ["1"], {
    gh: () => ({ status: 0, stdout: "[]", stderr: "" }),
    t3: () => Promise.resolve({ status: 0, stdout: "[]", stderr: "" }),
  });
  const lines = out.split("\n");
  assert.match(lines[0] ?? "", /^not ready: BRAID\.md has no gate, main, models/);
  assert.match(lines[1] ?? "", /^0001 /);
});

test("the board snapshot carries the problems", async () => {
  resetGithubMemory();
  resetT3Memory();
  const root = project({ "BRAID.md": GOOD, "backlog/tasks/t.md": "x" });
  const web = project({ "index.html": "<html></html>" });
  const src = repoSources(root, () => ({ status: 0, stdout: "[]", stderr: "" }), () => Promise.resolve({ status: 0, stdout: "[]", stderr: "" }));
  const { close, url } = await startBoardWith(src, web, 60_000);
  try {
    const board = (await (await fetch(`${url}api/board`)).json()) as { braids: unknown[]; problems: Problem[] };
    assert.deepEqual(board.braids, []);
    assert.deepEqual(keys(board.problems), ["no-braids"]);
    assert.match(board.problems[0]?.todo ?? "", /braid import-backlog/);
  } finally {
    await close();
  }
});

test("braid board reads GitHub once from startup until it prints the not ready lines", async () => {
  resetGithubMemory();
  resetT3Memory();
  // The notifier and its settings live under the home folder: keep them in the scratch folder.
  const saved = { HOME: process.env["HOME"], USERPROFILE: process.env["USERPROFILE"] };
  process.env["HOME"] = scratch;
  process.env["USERPROFILE"] = scratch;
  const root = project({ "BRAID.md": GOOD, "backlog/tasks/t.md": "x" });
  let ghCalls = 0;
  const gh = () => {
    ghCalls += 1;
    return new Promise((done) => setTimeout(() => done({ status: 0, stdout: "[]", stderr: "" }), 150));
  };
  const written: string[] = [];
  const write = process.stdout.write.bind(process.stdout);
  process.stdout.write = ((chunk: string | Uint8Array) => {
    written.push(String(chunk));
    return true;
  }) as typeof process.stdout.write;
  let started: { server: import("node:http").Server; close(): Promise<void> } | undefined;
  try {
    started = await runBoard(root, ["--no-open"], undefined, { gh, t3: () => Promise.resolve({ status: 0, stdout: "[]", stderr: "" }) });
  } finally {
    process.stdout.write = write;
    process.env["HOME"] = saved.HOME;
    process.env["USERPROFILE"] = saved.USERPROFILE;
    if (saved.HOME === undefined) delete process.env["HOME"];
    if (saved.USERPROFILE === undefined) delete process.env["USERPROFILE"];
    await started?.close();
  }
  // runBoard returns after the not ready lines are printed: one `gh pr list` so far.
  assert.ok(written.some((l) => /^not ready: it has backlog\/ but no braids\/; run braid import-backlog/.test(l)), written.join(""));
  assert.equal(ghCalls, 1);
});

test("a BRAID.md with the nested docs key reads as before (0056)", async () => {
  // This repository's own BRAID.md, which has `docs:` with `update`, `public` and `internal` lists.
  const text = readFileSync(fileURLToPath(new URL("../BRAID.md", import.meta.url)), "utf8");
  assert.match(text, /^docs:\n {2}update: both\n {2}public:\n {4}- README\.md$/m);
  const root = project({ "BRAID.md": text, "braids/0001-a/brief.md": BRIEF });
  assert.deepEqual(readiness(root, OK), []);
  const { checkBraids } = (await load("../dist/braids/check.js")) as { checkBraids: (root: string) => { errors: string[] } };
  assert.deepEqual(checkBraids(root).errors, []);
  const { ciChecks } = (await load("../dist/commands/coordinate.js")) as { ciChecks: (root: string) => string[] };
  assert.deepEqual(ciChecks(root), ["verify (ubuntu-latest)", "verify (windows-latest)"]);
  const { mainBranch } = (await load("../dist/commands/start.js")) as { mainBranch: (root: string) => string };
  assert.equal(mainBranch(root), "main");
  const { projectDefault } = (await load("../dist/braids/autonomy.js")) as { projectDefault: (root: string) => string | null };
  assert.equal(projectDefault(root), "steady");
  const { readStartContext } = (await load("../dist/commands/board.js")) as { readStartContext: (root: string) => { main: string; expected: { provider: string; model: string } | null } };
  assert.deepEqual(readStartContext(root), { main: "main", expected: { provider: "Claude_Everix", model: "claude-opus-5-5" } });
});
