import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, beforeEach, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const scratch = mkdtempSync(join(tmpdir(), "braid-facts-test-"));
after(() => rmSync(scratch, { recursive: true, force: true }));

const load = (path: string) => import(pathToFileURL(fileURLToPath(new URL(path, import.meta.url))).href);
const { factsCommand, recapCommand, expectedSize } = (await load("../dist/commands/facts.js")) as {
  factsCommand: (root: string, args: string[], opts: object) => Promise<string>;
  recapCommand: (root: string, args: string[], opts: object) => Promise<string>;
  expectedSize: (brief: string) => number | null;
};
const { resetGithubMemory } = (await load("../dist/board/github.js")) as { resetGithubMemory: () => void };
beforeEach(() => resetGithubMemory());

const git = (cwd: string, ...args: string[]) => {
  const r = spawnSync("git", args, { cwd, encoding: "utf8" });
  assert.equal(r.status, 0, `git ${args.join(" ")}: ${r.stderr}`);
  return r.stdout.trim();
};
const ok = (data: unknown) => ({ status: 0, stdout: JSON.stringify(data), stderr: "" });
const brief = (size: string, labels = "[]") => `---\nid: '0001'\ntitle: "Alpha story"\nstatus: In Progress\nlabels: ${labels}\ndependencies: []\n---\n\n## Goal\n\nx\n\nExpected size: ${size}\n`;

/** A repository with a bare remote and PR 7 from braid/0001-alpha into main; `change` edits the worker's clone before the commit. */
function world(size: string, change: (put: (path: string, text: string) => void, rm: (path: string) => void) => void, report = "", labels = "[]") {
  const base = mkdtempSync(join(scratch, "w-"));
  const root = join(base, "proj");
  const worker = join(base, "worker");
  git(base, "init", "-q", "--bare", "-b", "main", "remote.git");
  git(base, "init", "-q", "-b", "main", root);
  for (const dir of [root]) {
    git(dir, "config", "user.email", "t@example.com");
    git(dir, "config", "user.name", "t");
  }
  const put = (dir: string) => (path: string, text: string) => {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), text);
  };
  put(root)("BRAID.md", "---\nmain: main\nci: [verify]\n---\n");
  put(root)("test/old.test.ts", "test('a', () => {});\n");
  put(root)("braids/0001-alpha/brief.md", brief(size, labels));
  git(root, "add", "-A");
  git(root, "commit", "-q", "-m", "init");
  git(root, "remote", "add", "origin", join(base, "remote.git"));
  git(root, "push", "-q", "origin", "main");
  git(base, "clone", "-q", join(base, "remote.git"), "worker");
  git(worker, "config", "user.email", "w@example.com");
  git(worker, "config", "user.name", "w");
  git(worker, "checkout", "-q", "-b", "braid/0001-alpha");
  change(put(worker), (path) => rmSync(join(worker, path)));
  if (report !== "") {
    put(worker)("braids/0001-alpha/report.md", report);
  }
  git(worker, "add", "-A");
  git(worker, "commit", "-q", "-m", "feat: x");
  git(worker, "push", "-q", "origin", "braid/0001-alpha");
  const head = git(worker, "rev-parse", "HEAD");
  const rollup = [{ name: "verify", conclusion: "SUCCESS", status: "COMPLETED" }];
  const gh = (_r: string, args: readonly string[]) => {
    if (args[1] === "list") {
      return ok([{ number: 7, url: "u/7", state: "OPEN", headRefName: "braid/0001-alpha", statusCheckRollup: rollup }]);
    }
    return ok({ number: 7, url: "u/7", state: "OPEN", baseRefName: "main", headRefName: "braid/0001-alpha", headRefOid: head, mergeable: "MERGEABLE", statusCheckRollup: rollup });
  };
  return { root, head, gh };
}

test("expectedSize takes the number of lines, the upper bound of a range", () => {
  assert.equal(expectedSize(brief("about 40 to 80 lines in 4 files")), 80);
  assert.equal(expectedSize(brief("about 250 to 400 lines with tests")), 400);
  assert.equal(expectedSize(brief("about 30 lines in 2 files")), 30);
  assert.equal(expectedSize(brief("about 10-20 lines")), 20);
  assert.equal(expectedSize(brief("about 3 files")), null);
  assert.equal(expectedSize("## Goal\n\nnothing\n"), null);
});

test("braid facts: a plain change shows no stop-case fact", async () => {
  const w = world("about 100 lines", (put) => put("src/a.ts", "export const a = 1;\n"));
  const out = await factsCommand(w.root, ["7"], { gh: w.gh });
  assert.match(out, /^PR #7: main <- braid\/0001-alpha at [0-9a-f]{40}\n/);
  assert.match(out, /no stop-case facts/);
});

test("braid facts: dependency, process, deleted test and skip markers each name their case", async () => {
  const w = world("about 100 lines", (put, rm) => {
    put("package.json", "{}\n");
    put(".agents/skills/x/SKILL.md", "x\n");
    put("AGENTS.md", "x\n");
    rm("test/old.test.ts");
    put("test/new.test.ts", "test.skip('a', () => {});\n");
  });
  const out = await factsCommand(w.root, ["#7"], { gh: w.gh });
  assert.match(out, /^dependency: manifest or lockfile changed: package\.json$/m);
  assert.match(out, /^process: workflow, BRAID\.md, AGENTS\.md, CLAUDE\.md or skill changed: .*AGENTS\.md.*SKILL\.md|^process: workflow.*: .*SKILL\.md.*AGENTS\.md/m);
  assert.match(out, /^process: deleted test: test\/old\.test\.ts$/m);
  assert.match(out, /^process: skip or only marker added or removed: test\/new\.test\.ts$/m);
  assert.doesNotMatch(out, /quality or scope/);
});

test("braid facts: a diff over twice the expected size is a quality or scope fact", async () => {
  const w = world("about 10 lines", (put) => put("src/big.ts", "x\n".repeat(60)));
  const out = await factsCommand(w.root, ["7"], { gh: w.gh });
  assert.match(out, /^quality or scope: \d+ lines changed, over twice the brief's expected size of 10$/m);
});

test("braid facts: lines under braids/ are not counted in the size fact", async () => {
  const w = world("about 10 lines", (put) => {
    put("braids/0001-alpha/report.md", "x\n".repeat(200));
    put("src/small.ts", "x\n".repeat(5));
  });
  const out = await factsCommand(w.root, ["7"], { gh: w.gh });
  assert.doesNotMatch(out, /quality or scope/);
});

test("braid facts: bad arguments are usage errors", async () => {
  const w = world("about 10 lines", (put) => put("a.txt", "a\n"));
  await assert.rejects(factsCommand(w.root, [], { gh: w.gh }), /usage: braid facts/);
  await assert.rejects(factsCommand(w.root, ["x"], { gh: w.gh }), /usage: braid facts/);
});

test("braid recap: drafts the recap from report.md, the PR head and checks, and the facts", async () => {
  const report = "# Report\n\n## What changed\n\n- added facts\n- added recap\n\nDecisions: none\n\nFor later items: none\n\nNeeds the user: `none`\n";
  const w = world("about 10 lines", (put) => put("package.json", "{}\n"), report);
  const out = await recapCommand(w.root, ["1"], { gh: w.gh });
  assert.match(out, /^\*\*0001: Alpha story\*\* — ready for your merge\. PR: u\/7 at [0-9a-f]{40}$/m);
  assert.match(out, /\*\*Done:\*\* - added facts\n- added recap/);
  assert.match(out, /^\*\*Needs the user:\*\* dependency \(facts\): manifest or lockfile changed: package\.json$/m);
  assert.match(out, /^checks: verify passing \(green on this head\)$/m);
  assert.match(out, /^braid log line: 0001 merged: PR #7, [0-9a-f]{7}\. Done: <edit: short report>\. For later items: none\. Plan changes: <edit: or none>\. User decided: <edit: or none>\. \(Alpha story; checks green; needs the user: see recap\)$/m);
  assert.match(out, /^\*\*Screenshots:\*\* none$/m);
});

test("braid recap: a ui item gets a Screenshots placeholder and a size fact keeps the full case name", async () => {
  const w = world("about 10 lines", (put) => put("src/big.ts", "x\n".repeat(60)), "## What changed\n\n- a\n", "[ui]");
  const out = await recapCommand(w.root, ["0001"], { gh: w.gh });
  assert.match(out, /^\*\*Screenshots:\*\* <edit: /m);
  assert.match(out, /^\*\*Needs the user:\*\* quality or scope \(facts\): /m);
});

test("braid recap: no facts and a quiet worker gives Needs the user: none; a missing PR is refused", async () => {
  const w = world("about 100 lines", (put) => put("src/a.ts", "a\n"), "## What changed\n\n- a\n\nNeeds the user: none\n");
  const out = await recapCommand(w.root, ["0001"], { gh: w.gh });
  assert.match(out, /^\*\*Needs the user:\*\* none$/m);
  const none = (_r: string, args: readonly string[]) => (args[1] === "list" ? ok([]) : w.gh(_r, args));
  await assert.rejects(recapCommand(w.root, ["0001"], { gh: none }), /0001 has no PR/);
  await assert.rejects(recapCommand(w.root, ["nope"], { gh: w.gh }), /usage: braid recap/);
});
