import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, beforeEach, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const scratch = mkdtempSync(join(tmpdir(), "braid-coordinate-"));
after(() => rmSync(scratch, { recursive: true, force: true }));

interface Result {
  status: number | null;
  stdout: string;
  stderr: string;
  error?: Error;
}
const load = (path: string) => import(pathToFileURL(fileURLToPath(new URL(path, import.meta.url))).href);
const { statusCommand, nextCommand } = (await load("../dist/commands/coordinate.js")) as {
  statusCommand: (root: string, args: string[], src: object) => Promise<string>;
  nextCommand: (root: string, args: string[], src: object) => Promise<string>;
};
const { resetGithubMemory } = (await load("../dist/board/github.js")) as { resetGithubMemory: () => void };
const { resetT3Memory } = (await load("../dist/board/t3.js")) as { resetT3Memory: () => void };

beforeEach(() => {
  resetGithubMemory();
  resetT3Memory();
});

const git = (root: string, ...args: string[]) => {
  const r = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  return r.stdout.trim();
};

let repos = 0;
interface Strand {
  letter: string;
  status: string;
  deps?: string[];
  order: number;
}
function repo(strands: Strand[], ci = "[verify (ubuntu-latest), verify (windows-latest)]"): string {
  const root = join(scratch, `repo-${++repos}`);
  const put = (path: string, text: string) => {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  };
  const brief = (id: string, status: string, deps = "", order = "") =>
    `---\nid: '${id}'\ntitle: "T ${id}"\nstatus: ${status}\nlabels: []\ndependencies: [${deps}]\n${order}---\n\n## Goal\n\nx\n`;
  put("BRAID.md", `---\nci: ${ci}\n---\n`);
  put("braids/0001-a/brief.md", brief("0001", "In Progress"));
  for (const s of strands) {
    const deps = (s.deps ?? []).map((d) => `'${d}'`).join(", ");
    put(`braids/0001-a/${s.letter}-s/brief.md`, brief(`0001/${s.letter}`, s.status, deps, `order: ${s.order}\n`));
  }
  git(root, "init", "-q", "-b", "main");
  git(root, "config", "user.email", "t@example.com");
  git(root, "config", "user.name", "t");
  git(root, "add", "-A");
  git(root, "commit", "-q", "-m", "init");
  return root;
}

const ok = (data: unknown): Result => ({ status: 0, stdout: JSON.stringify(data), stderr: "" });
const ghWith = (prs: object[]) => () => ok(prs);
const t3With = (threads: object[]) => (_root: string, args: readonly string[]) =>
  Promise.resolve(args[1] === "list" ? ok(threads) : ok({ thread: { branch: null, worktreePath: null, pendingRequestCount: 0 } }));
const noWorktrees = () => new Map<string, string>();
const check = (name: string, conclusion: string, status = "COMPLETED") => ({ name, conclusion, status });
const pr = (n: number, branch: string, rollup: object[]) => ({ number: n, url: `https://github.com/o/r/pull/${n}`, state: "OPEN", headRefName: branch, statusCheckRollup: rollup });
const src = (prs: object[] = [], threads: object[] = []) => ({ gh: ghWith(prs), t3: t3With(threads), worktrees: noWorktrees });

test("status shows stored status, lane, branches, PR, ci checks and thread per strand", async () => {
  const root = repo([
    { letter: "A", status: "In Progress", order: 10 },
    { letter: "B", status: "To Do", order: 20 },
  ]);
  const head = git(root, "rev-parse", "HEAD");
  git(root, "branch", "braid/0001/A-s");
  git(root, "update-ref", "refs/remotes/origin/braid/0001/A-s", head);
  const out = await statusCommand(root, ["1"], {
    gh: ghWith([pr(7, "braid/0001/A-s", [check("verify (ubuntu-latest)", "SUCCESS"), check("verify (windows-latest)", "", "IN_PROGRESS")])]),
    t3: t3With([{ threadId: "x", status: "interrupted", linkedPullRequest: { number: 7 } }]),
    worktrees: noWorktrees,
  });
  const lines = out.split("\n");
  assert.match(lines[0] ?? "", /^0001 {2}In Progress {2}In Review /);
  const a = lines.find((l) => l.includes("0001/A")) ?? "";
  assert.match(a, /In Progress {2}In Review {2}branch local\+pushed {2}PR #7 open {2}ci verify \(ubuntu-latest\): passing, verify \(windows-latest\): pending {2}thread stopped/);
  const b = lines.find((l) => l.includes("0001/B")) ?? "";
  assert.match(b, /To Do {2}To Do {2}branch - {2}PR - {2}ci - {2}thread -/);
  assert.match(out, /remote branches: as of this clone's last fetch \(it never fetched/);
  assert.doesNotMatch(out, /note:/);
});

test("status reports failing checks and says when GitHub or T3 cannot be read", async () => {
  const root = repo([{ letter: "A", status: "In Progress", order: 10 }]);
  const red = await statusCommand(root, ["0001"], {
    gh: ghWith([pr(8, "braid/0001/A-s", [check("verify (ubuntu-latest)", "FAILURE"), check("verify (windows-latest)", "SUCCESS")])]),
    t3: t3With([{ threadId: "r", status: "running", linkedPullRequest: { number: 8 } }]),
    worktrees: noWorktrees,
  });
  assert.match(red, /ci verify \(ubuntu-latest\): failing, verify \(windows-latest\): passing {2}thread running/);

  resetGithubMemory();
  resetT3Memory();
  const down = await statusCommand(root, ["1"], {
    gh: () => ({ status: 1, stdout: "", stderr: "gh auth login needed" }),
    t3: () => Promise.resolve({ status: 1, stdout: "", stderr: "not running" }),
    worktrees: noWorktrees,
  });
  assert.match(down, /note: GitHub could not be read \(gh is not logged in; run gh auth login\)/);
  assert.match(down, /note: T3 could not be read \(T3 is not running \(not running\)\)/);
  assert.match(down, /thread \?/);
});

test("next picks the first To Do strand in run order whose dependencies are Done", async () => {
  const root = repo([
    { letter: "A", status: "Done", order: 10 },
    { letter: "B", status: "Outline", order: 20 },
    { letter: "C", status: "To Do", order: 30, deps: ["0001/B"] },
    { letter: "D", status: "To Do", order: 40, deps: ["0001/A"] },
    { letter: "E", status: "To Do", order: 50 },
  ]);
  assert.match(await nextCommand(root, ["1"], src()), /^0001\/D {2}T 0001\/D\n/);
});

test("next skips a strand with an open PR, a pushed branch or an Outline, and says why none is ready", async () => {
  const root = repo([
    { letter: "A", status: "To Do", order: 10 },
    { letter: "B", status: "To Do", order: 20 },
    { letter: "C", status: "To Do", order: 30, deps: ["0001/B"] },
    { letter: "D", status: "Outline", order: 40 },
  ]);
  git(root, "update-ref", "refs/remotes/origin/braid/0001/B-s", git(root, "rev-parse", "HEAD"));
  const out = await nextCommand(root, ["1"], src([pr(9, "braid/0001/A-s", [])]));
  assert.match(out, /^none ready in 0001:\n/);
  assert.match(out, /0001\/A: PR #9 is open \(In Review\)/);
  assert.match(out, /0001\/B: branch already pushed/);
  assert.match(out, /0001\/C: blocked by 0001\/B/);
  assert.match(out, /0001\/D: Outline/);
});

test("next names a running agent, and says when everything is done", async () => {
  const root = repo([{ letter: "A", status: "To Do", order: 10 }]);
  const running = await nextCommand(root, ["1"], {
    gh: ghWith([]),
    t3: (_r: string, args: readonly string[]) =>
      Promise.resolve(args[1] === "list" ? ok([{ threadId: "t", status: "running", pullRequests: [] }]) : ok({ thread: { branch: "braid/0001/A-s", worktreePath: null, pendingRequestCount: 0 } })),
    worktrees: noWorktrees,
  });
  assert.match(running, /0001\/A: running/);

  const done = repo([
    { letter: "A", status: "Done", order: 10 },
    { letter: "B", status: "Done", order: 20 },
  ]);
  resetT3Memory();
  assert.match(await nextCommand(done, ["1"], src()), /^none: all strands of 0001 are done\n/);
});

test("status and next take one braid number", async () => {
  const root = repo([{ letter: "A", status: "To Do", order: 10 }]);
  await assert.rejects(statusCommand(root, ["1/A"], src()), /usage: braid status <number>/);
  await assert.rejects(nextCommand(root, [], src()), /usage: braid next <number>/);
  await assert.rejects(nextCommand(root, ["7"], src()), /no braid 0007/);
});

test("a remote-only branch shows +pushed, and a check missing from the rollup is pending", async () => {
  const root = repo([{ letter: "A", status: "In Progress", order: 10 }]);
  git(root, "update-ref", "refs/remotes/origin/braid/0001/A-s", git(root, "rev-parse", "HEAD"));
  const out = await statusCommand(root, ["1"], src([pr(5, "braid/0001/A-s", [check("verify (ubuntu-latest)", "SUCCESS")])]));
  assert.match(out, /branch \+pushed {2}PR #5 open {2}ci verify \(ubuntu-latest\): passing, verify \(windows-latest\): pending/);
});

test("next treats another braid as a dependency until its lane is Done, and notes unreadable sources", async () => {
  const root = repo([{ letter: "A", status: "To Do", order: 10, deps: ["0002"] }]);
  const put = (path: string, text: string) => {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  };
  const other = (status: string) => `---\nid: '0002'\ntitle: "Other"\nstatus: ${status}\nlabels: []\ndependencies: []\n---\n\n## Goal\n\nx\n`;
  put("braids/0002-other/brief.md", other("In Progress"));
  const down = { gh: () => ({ status: 1, stdout: "", stderr: "boom" }), t3: () => Promise.resolve({ status: 1, stdout: "", stderr: "" }), worktrees: noWorktrees };
  const blocked = await nextCommand(root, ["1"], down);
  assert.match(blocked, /0001\/A: blocked by 0002/);
  assert.match(blocked, /note: GitHub could not be read/);
  assert.match(blocked, /note: T3 could not be read .*a running agent can't be ruled out/);

  put("braids/0002-other/brief.md", other("Done"));
  resetGithubMemory();
  resetT3Memory();
  const ready = await nextCommand(root, ["1"], down);
  assert.match(ready, /^0001\/A {2}T 0001\/A\n/);
  assert.match(ready, /a running agent can't be ruled out/);
});
