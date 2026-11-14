import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

const cli = fileURLToPath(new URL("../dist/cli.js", import.meta.url));
const fixture = fileURLToPath(new URL("./fixtures/backlog-repo", import.meta.url));
const scratch = mkdtempSync(join(tmpdir(), "braid-import-"));
after(() => rmSync(scratch, { recursive: true, force: true }));

let count = 0;
/** A copy of the fixture backlog/ in a fresh folder, with an empty braids/. */
function project(): string {
  const root = join(scratch, `p${++count}`);
  cpSync(fixture, root, { recursive: true });
  mkdirSync(join(root, "braids"), { recursive: true });
  return root;
}

function braid(cwd: string, ...args: string[]) {
  return spawnSync(process.execPath, [cli, ...args], { encoding: "utf8", cwd });
}

const names = (dir: string) => readdirSync(dir).sort();
const find = (dir: string, prefix: string) => names(dir).find((n) => n.startsWith(prefix)) ?? assert.fail(`no ${prefix} in ${dir}`);
const read = (...path: string[]) => readFileSync(join(...path), "utf8");

test("imports tasks, subtasks, notes, summaries and docs, and the result passes braid check", () => {
  const root = project();
  const braids = join(root, "braids");
  const r = braid(root, "import-backlog");
  assert.equal(r.stderr, "");
  assert.equal(r.status, 0);
  assert.match(r.stdout, /Imported 3 braids, 3 strands/);
  assert.match(r.stdout, /1 archived task in backlog\/archive\/tasks\//);
  assert.match(r.stdout, /1 draft in backlog\/drafts\//);
  assert.match(r.stdout, /1 doc no task links: doc-9 - Unlinked-note\.md/);
  assert.match(r.stdout, /braids OK: 3 braids, 3 strands/);
  assert.equal(braid(root, "check").stdout, "braids OK: 3 braids, 3 strands\n");
  assert.ok(existsSync(join(root, "backlog", "tasks")), "backlog/ is left alone");

  const list = braid(root, "list").stdout;
  for (const id of ["0002", "0004", "0006"]) {
    assert.match(list, new RegExp(`^${id} `, "m"));
  }
  for (const id of ["0002/A", "0006/A", "0006/B"]) {
    assert.match(list, new RegExp(`^ {2}${id} `, "m"));
  }

  // A parent with subtasks: epic delivery, order from the ordinal, strands lettered by subtask number.
  const six = find(braids, "0006-");
  assert.equal(six, "0006-read-only-board-braid-board-with-live");
  const brief = read(braids, six, "brief.md");
  assert.match(brief, /^id: '0006'$/m);
  assert.match(brief, /^status: Done$/m);
  assert.match(brief, /^labels: \["kind:story", "tier:L", "ui"\]$/m);
  assert.match(brief, /^order: 60$/m);
  assert.match(brief, /^delivery: epic$/m);
  assert.match(brief, /^Goal: story 3 of the new braid/m);
  assert.match(brief, /^## Acceptance\n\n- \[x\] /m);
  assert.match(brief, /^## Definition of done\n\n- \[x\] The gate command from BRAID\.md passes$/m);
  const a = find(join(braids, six), "A-");
  const b = find(join(braids, six), "B-");
  assert.match(a, /^A-board-skeleton-and-braid-check$/);
  const strand = read(braids, six, b, "brief.md");
  assert.match(strand, /^id: '0006\/B'$/m);
  assert.match(strand, /^dependencies: \['0006\/A'\]$/m);
  assert.doesNotMatch(strand, /^delivery:/m);
  assert.match(strand, /^## Plan\n\n/m);
  assert.match(read(braids, six, a, "report.md"), /^What changed: /m);

  // A lone task is a braid delivered to main; its notes are a log, its summary the report.
  const four = find(braids, "0004-");
  assert.match(read(braids, four, "brief.md"), /^delivery: main$/m);
  const log = names(join(braids, four)).filter((n) => n.startsWith("log-"));
  assert.equal(log.length, 1);
  assert.match(log[0] ?? "", /^log-\d{4}-\d{2}-\d{2}-import\.md$/);
  assert.match(read(braids, four, log[0] ?? ""), /^## \d{4}-\d{2}-\d{2} \d{2}:\d{2}Z\n\n\S/);
  assert.match(read(braids, four, "report.md"), /\S/);

  // Docs: appended to the report of the task that links them (a folded path resolves).
  const two = find(braids, "0002-");
  assert.match(read(braids, two, "report.md"), /^## TASK-2 report: research results and the user's decisions$/m);
  const twoA = find(join(braids, two), "A-");
  assert.match(read(braids, two, twoA, "report.md"), /^## TASK-2\.1 report: Backlog\.md as braid's reference$/m);
});

test("--dry-run prints the files and writes nothing", () => {
  const root = project();
  const r = braid(root, "import-backlog", "--dry-run");
  assert.equal(r.status, 0);
  assert.match(r.stdout, /^would write braids\/0006-read-only-board-braid-board-with-live\/brief\.md$/m);
  assert.match(r.stdout, /Would import 3 braids, 3 strands/);
  assert.deepEqual(names(join(root, "braids")), []);
});

test("it refuses when a braid number exists, and writes nothing", () => {
  const root = project();
  mkdirSync(join(root, "braids", "0004-other"));
  const r = braid(root, "import-backlog");
  assert.equal(r.status, 1);
  assert.match(r.stderr, /braids\/0004-other: braid 0004 already exists \(TASK-4\)/);
  assert.deepEqual(names(join(root, "braids")), ["0004-other"]);
});

test("it refuses an input file that doesn't parse, and writes nothing", () => {
  const root = project();
  writeFileSync(
    join(root, "backlog/tasks/task-8 - Bad.md"),
    "---\nid: TASK-8\ntitle: Bad\nstatus: Doing\ncreated_date: 2026-11-14\n---\n",
  );
  const r = braid(root, "import-backlog");
  assert.equal(r.status, 2);
  assert.match(r.stderr, /backlog\/tasks\/task-8 - Bad\.md: status must be To Do, In Progress or Done; got: Doing/);
  assert.deepEqual(names(join(root, "braids")), []);
});

test("it refuses a dependency on a task that isn't imported", () => {
  const root = project();
  writeFileSync(
    join(root, "backlog/tasks/task-9 - Late.md"),
    "---\nid: TASK-9\ntitle: Late\nstatus: To Do\ncreated_date: 2026-11-14\ndependencies:\n  - TASK-3\n---\n",
  );
  const r = braid(root, "import-backlog");
  assert.equal(r.status, 2);
  assert.match(r.stderr, /task-9 - Late\.md: depends on TASK-3, which is not an imported task/);
  assert.deepEqual(names(join(root, "braids")), []);
});

test("a doc linked from a braid and from its strand goes to the strand only", () => {
  const root = project();
  const ref = "backlog/docs/doc-4 - TASK-2-report-research-results-and-the-users-decisions.md";
  const path = join(root, "backlog/tasks", find(join(root, "backlog/tasks"), "task-2.1 "));
  writeFileSync(path, read(path).replace("documentation:\n", `documentation:\n  - ${ref}\n`));
  assert.equal(braid(root, "import-backlog").status, 0);
  const braids = join(root, "braids");
  const two = find(braids, "0002-");
  assert.doesNotMatch(read(braids, two, "report.md"), /^## TASK-2 report: research results/m);
  const report = read(braids, two, find(join(braids, two), "A-"), "report.md");
  assert.match(report, /^## TASK-2 report: research results and the user's decisions$/m);
  assert.match(report, /^## TASK-2\.1 report: Backlog\.md as braid's reference$/m);
});
