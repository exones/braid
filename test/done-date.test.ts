import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const scratch = mkdtempSync(join(tmpdir(), "braid-done-"));
after(() => rmSync(scratch, { recursive: true, force: true, maxRetries: 20, retryDelay: 250 }));
// Git here reads no real user settings.
const home = join(scratch, "home");
mkdirSync(home);
for (const key of ["HOME", "USERPROFILE", "XDG_CONFIG_HOME"]) {
  process.env[key] = home;
}
process.env["GIT_CONFIG_NOSYSTEM"] = "1";

const load = (path: string) => import(pathToFileURL(fileURLToPath(new URL(path, import.meta.url))).href);
const { doneDate, headOf, resetDoneDates } = (await load("../dist/board/done.js")) as {
  doneDate: (root: string, folder: string, source: { branch: string; commit: string } | null, run?: (root: string, args: readonly string[]) => { status: number | null; stdout: string }, head?: string | null) => string | null;
  headOf: (root: string) => string | null;
  resetDoneDates: () => void;
};
const { toBoard, doneNewestFirst } = (await load("../dist/board/model.js")) as {
  toBoard: (repo: string, braids: unknown[], gh: unknown, t3: unknown, sig: unknown) => { braids: { id: string; lane: string; doneAt: string | null; strands: { id: string; doneAt: string | null }[] }[] };
  doneNewestFirst: <T extends { id: string; doneAt: string | null }>(c: T[]) => T[];
};
const { loadLiveBraids } = (await load("../dist/braids/branches.js")) as { loadLiveBraids: (root: string) => unknown[] };
const { readSignals } = (await load("../dist/board/signals.js")) as { readSignals: (root: string, gh: unknown, now?: Date) => unknown };

const brief = (id: string, status: string) => `---\nid: '${id}'\ntitle: T ${id}\nstatus: ${status}\n---\n\n## Goal\n\nx\n`;

let clock = 0;
const root = join(scratch, "repo");
mkdirSync(root);
const git = (...args: string[]) => {
  const r = spawnSync("git", ["-c", "user.name=t", "-c", "user.email=t@example.com", ...args], { cwd: root, encoding: "utf8", env: { ...process.env, GIT_COMMITTER_DATE: `2026-11-${String(10 + clock).padStart(2, "0")}T12:00:00+02:00`, GIT_AUTHOR_DATE: "2026-01-01T00:00:00Z" } });
  assert.equal(r.status, 0, r.stderr);
};
/** Commits the files at "2026-11-<10 + day>"; the committer date is the one the board reads. */
const commit = (day: number, files: Record<string, string>, message: string) => {
  clock = day;
  for (const [file, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, file)), { recursive: true });
    writeFileSync(join(root, file), text);
  }
  git("add", "-A");
  git("commit", "-q", "-m", message);
};

git("init", "-q", "-b", "main");
// 0001: a story set Done on day 3 (an unrelated edit on day 5 must not move the date).
commit(1, { "braids/0001-solo/brief.md": brief("0001", "In Progress") }, "start 0001");
commit(3, { "braids/0001-solo/brief.md": brief("0001", "Done") }, "0001 done");
commit(5, { "braids/0001-solo/brief.md": brief("0001", "Done").replace("x", "x edited") }, "edit 0001");
// 0002: a braid with strands: A Done on day 4, B Done on day 8, the braid itself Done on day 9.
commit(2, { "braids/0002-pair/brief.md": brief("0002", "In Progress"), "braids/0002-pair/A-a/brief.md": brief("0002/A", "In Progress"), "braids/0002-pair/B-b/brief.md": brief("0002/B", "In Progress") }, "start 0002");
commit(4, { "braids/0002-pair/A-a/brief.md": brief("0002/A", "Done") }, "0002/A done");
commit(8, { "braids/0002-pair/B-b/brief.md": brief("0002/B", "Done") }, "0002/B done");
commit(9, { "braids/0002-pair/brief.md": brief("0002", "Done") }, "0002 done");
// 0003: a braid with strands whose own brief never says Done (every strand Done, its PR merged): the newest strand counts.
commit(6, { "braids/0003-trio/brief.md": brief("0003", "In Progress"), "braids/0003-trio/A-a/brief.md": brief("0003/A", "Done") }, "0003 start, A done");
// 0004: set Done on day 2, set back to In Progress, set Done again on day 7: the newest setting counts.
commit(2, { "braids/0004-again/brief.md": brief("0004", "Done") }, "0004 done");
commit(3, { "braids/0004-again/brief.md": brief("0004", "In Progress") }, "0004 reopened");
commit(7, { "braids/0004-again/brief.md": brief("0004", "Done") }, "0004 done again");
commit(7, { "braids/0005-open/brief.md": brief("0005", "To Do") }, "0005");

// 0006: set Done on day 4, then its folder renamed on day 12 (braid folders get renamed): the date stays day 4.
commit(4, { "braids/0006-old/brief.md": brief("0006", "Done") }, "0006 done");
clock = 12;
git("mv", "braids/0006-old", "braids/0006-new");
git("commit", "-q", "-m", "rename 0006");

const noGithub = { status: { state: "unavailable", reason: "no gh" }, prs: new Map() };

test("doneDate is the committer date of the commit that set status: Done, not a later edit", () => {
  resetDoneDates();
  assert.equal(doneDate(root, "braids/0001-solo", null), "2026-11-13T10:00:00.000Z");
  assert.equal(doneDate(root, "braids/0002-pair/A-a", null), "2026-11-14T10:00:00.000Z");
  assert.equal(doneDate(root, "braids/0005-open", null), null, "never Done: no date");
  assert.equal(doneDate(join(scratch, "elsewhere"), "braids/0001-solo", null), null, "not a repository: no date, no error");
});

test("a renamed folder keeps the original Done date", () => {
  resetDoneDates();
  assert.equal(doneDate(root, "braids/0006-new", null), "2026-11-14T10:00:00.000Z", "the rename day is day 12");
});

test("a miss is kept per commit searched: no git log again until HEAD moves", () => {
  resetDoneDates();
  const calls: string[][] = []; // the `git log` searches (a search also reads versions with `git show`)
  const run = (r: string, args: readonly string[]) => {
    if (args[0] === "log") {
      calls.push([...args]);
    }
    return spawnSync("git", args, { cwd: r, encoding: "utf8" }) as { status: number | null; stdout: string };
  };
  const head = headOf(root);
  assert.notEqual(head, null);
  assert.equal(doneDate(root, "braids/0005-open", null, run, head), null);
  assert.equal(doneDate(root, "braids/0005-open", null, run, head), null);
  assert.equal(calls.length, 1, "the second miss came from the cache");
  commit(13, { "braids/0007-new/brief.md": brief("0007", "To Do") }, "0007");
  assert.equal(doneDate(root, "braids/0005-open", null, run, headOf(root)), null);
  assert.equal(calls.length, 2, "HEAD moved: searched again");
  assert.equal(doneDate(root, "braids/0001-solo", null, run, headOf(root)), "2026-11-13T10:00:00.000Z");
  assert.equal(doneDate(root, "braids/0001-solo", null, run, headOf(root)), "2026-11-13T10:00:00.000Z");
  assert.equal(calls.length, 3, "a hit is kept too");
});

test("the board dates Done braids from Git alone, a braid with strands by its own Done commit, else its newest strand", () => {
  resetDoneDates();
  const board = toBoard("repo", loadLiveBraids(root), noGithub, { status: { state: "ok" }, threads: new Map() }, readSignals(root, noGithub));
  const by = Object.fromEntries(board.braids.map((b) => [b.id, b]));
  assert.equal(by["0001"]?.lane, "Done");
  assert.equal(by["0001"]?.doneAt, "2026-11-13T10:00:00.000Z");
  assert.equal(by["0002"]?.doneAt, "2026-11-19T10:00:00.000Z", "its own Done commit (day 9), not strand B (day 8)");
  assert.deepEqual(by["0002"]?.strands.map((s) => s.doneAt), ["2026-11-14T10:00:00.000Z", "2026-11-18T10:00:00.000Z"]);
  assert.equal(by["0003"]?.lane, "In Progress", "every strand Done is no Done braid without its own Done or its merged PR");
  assert.equal(by["0003"]?.doneAt, null);
  assert.equal(by["0004"]?.doneAt, "2026-11-17T10:00:00.000Z");
  assert.equal(by["0005"]?.doneAt, null, "not Done: no date");
  const order = doneNewestFirst(board.braids.filter((b) => b.lane === "Done")).map((b) => b.id);
  assert.deepEqual(order, ["0002", "0004", "0006", "0001"]);
});
