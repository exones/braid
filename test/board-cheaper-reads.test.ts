import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import type { Server } from "node:http";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, beforeEach, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const scratch = mkdtempSync(join(tmpdir(), "braid-cheap-"));
after(() => rmSync(scratch, { recursive: true, force: true, maxRetries: 20, retryDelay: 250 }));
// Git here reads no real user settings.
const home = join(scratch, "home");
mkdirSync(home);
for (const key of ["HOME", "USERPROFILE", "XDG_CONFIG_HOME"]) {
  process.env[key] = home;
}
process.env["GIT_CONFIG_NOSYSTEM"] = "1";

const load = (path: string) => import(pathToFileURL(fileURLToPath(new URL(path, import.meta.url))).href);
interface Source {
  branch: string;
  commit: string;
}
const done = (await load("../dist/board/done.js")) as {
  doneDate: (root: string, folder: string, source: Source | null, run?: (root: string, args: readonly string[]) => { status: number | null; stdout: string }, head?: string | null) => string | null;
  prefetchDoneDates: (root: string, items: { folder: string; source: Source | null }[], head: string | null) => Promise<void>;
  resetDoneDates: () => void;
};
const branches = (await load("../dist/braids/branches.js")) as {
  loadLiveBraidsAsync: (root: string) => Promise<{ number: string; brief: { title: string; status: string }; strands: { letter: string; brief: { title: string; status: string } }[] }[]>;
  loadLiveBraids: (root: string) => unknown[];
  loadKnownBraids: (root: string) => { number: string; brief: { title: string }; strands: { letter: string; brief: { title: string } }[] }[];
  treeOf: (root: string, item: { source: Source | null }) => { read(file: string): string | null };
};
const gitio = (await load("../dist/braids/gitio.js")) as {
  spyOnGit: (observer: ((args: readonly string[], sync?: boolean) => void) | undefined) => void;
  catBatch: (root: string, specs: readonly string[], timeoutMs?: number, command?: readonly string[]) => Promise<(string | null)[]>;
  catBatchSync: (root: string, specs: readonly string[], timeoutMs?: number, command?: readonly string[]) => (string | null)[];
};
const t3mod = (await load("../dist/board/t3.js")) as {
  readT3: (root: string, options: unknown) => Promise<{ status: { state: string } }>;
};
const board = (await load("../dist/commands/board.js")) as {
  repoSources: (root: string, gh: unknown, t3: unknown) => { braids(): unknown };
  startBoardWith: (src: unknown, web: string, refreshMs?: number) => Promise<{ server: Server; url: string; close(): Promise<void> }>;
};

const brief = (id: string, status: string, title = `T ${id}`) => `---\nid: '${id}'\ntitle: ${title}\nstatus: ${status}\n---\n\n## Goal\n\n${"Some text of the brief that is long enough to be paired as a rename. ".repeat(6)}\n`;

let clock = 0;
function repo(name: string) {
  const root = join(scratch, name);
  mkdirSync(root);
  const git = (...args: string[]) => {
    const r = spawnSync("git", ["-c", "user.name=t", "-c", "user.email=t@example.com", ...args], { cwd: root, encoding: "utf8", env: { ...process.env, GIT_COMMITTER_DATE: `2026-11-${String(10 + clock).padStart(2, "0")}T12:00:00+02:00` } });
    assert.equal(r.status, 0, r.stderr);
    return r.stdout.trim();
  };
  const commit = (day: number, files: Record<string, string>, message: string) => {
    clock = day;
    for (const [file, text] of Object.entries(files)) {
      mkdirSync(dirname(join(root, file)), { recursive: true });
      writeFileSync(join(root, file), text);
    }
    git("add", "-A");
    git("commit", "-q", "--allow-empty", "-m", message);
  };
  git("init", "-q", "-b", "main");
  return { root, git, commit };
}

const processes: (readonly string[])[] = [];
beforeEach(() => {
  processes.length = 0;
  done.resetDoneDates();
  gitio.spyOnGit((args) => processes.push(args));
});
after(() => gitio.spyOnGit(undefined));

test("the Done dates of several items, one with a renamed folder, come from one batched git read and equal doneDate", async () => {
  const { root, commit, git } = repo("done");
  commit(1, { "braids/0001-solo/brief.md": brief("0001", "In Progress") }, "start 0001");
  commit(3, { "braids/0001-solo/brief.md": brief("0001", "Done") }, "0001 done");
  commit(5, { "braids/0001-solo/brief.md": brief("0001", "Done").replace("Goal", "Goal edited") }, "edit 0001");
  commit(2, { "braids/0002-pair/brief.md": brief("0002", "In Progress"), "braids/0002-pair/A-a/brief.md": brief("0002/A", "In Progress") }, "start 0002");
  commit(4, { "braids/0002-pair/A-a/brief.md": brief("0002/A", "Done") }, "0002/A done");
  commit(6, { "braids/0003-moved/brief.md": brief("0003", "In Progress") }, "start 0003");
  commit(7, { "braids/0003-moved/brief.md": brief("0003", "Done") }, "0003 done");
  renameSync(join(root, "braids/0003-moved"), join(root, "braids/0003-renamed"));
  commit(12, {}, "rename 0003");
  commit(13, { "braids/0004-todo/brief.md": brief("0004", "To Do") }, "0004");
  const items = ["braids/0001-solo", "braids/0002-pair/A-a", "braids/0003-renamed", "braids/0004-todo"].map((folder) => ({ folder, source: null }));
  const head = git("rev-parse", "HEAD");
  const expected = items.map((i) => done.doneDate(root, i.folder, null, undefined, head));
  assert.ok(expected[0] !== null && expected[1] !== null);
  assert.ok(expected[2]?.startsWith("2026-11-17"), `the rename keeps the date of the old folder: ${expected[2]}`);
  assert.equal(expected[3], null);
  done.resetDoneDates();
  processes.length = 0;
  await done.prefetchDoneDates(root, items, head);
  assert.equal(processes.filter((a) => a[0] === "log").length, 1, `one git log, saw ${JSON.stringify(processes)}`);
  assert.equal(processes.filter((a) => a[0] === "cat-file").length, 1, "one cat-file --batch");
  const boom = (): never => {
    throw new Error("doneDate ran git again");
  };
  assert.deepEqual(items.map((i) => done.doneDate(root, i.folder, null, boom, head)), expected);
});

test("the braids from branches are read through one git cat-file --batch process and come out as the briefs say", async () => {
  const { root, commit, git } = repo("branches");
  commit(1, { "braids/0001-one/brief.md": brief("0001", "To Do", "One"), "braids/0001-one/A-a/brief.md": brief("0001/A", "To Do", "A") }, "base");
  for (const letter of ["a", "b", "c"]) {
    const upper = letter.toUpperCase();
    git("checkout", "-q", "-b", `braid/0001/${upper}-${letter}`, "main");
    commit(2, { [`braids/0001-one/${upper}-${letter}/brief.md`]: brief(`0001/${upper}`, "In Progress", `Live ${letter}`) }, `work ${letter}`);
  }
  git("checkout", "-q", "main");
  processes.length = 0;
  const live = await branches.loadLiveBraidsAsync(root);
  assert.equal(processes.filter((a) => a[0] === "cat-file").length, 1, `one cat-file --batch process: ${JSON.stringify(processes)}`);
  assert.equal(live.length, 1);
  assert.deepEqual(
    live[0]?.strands.map((s) => [s.letter, s.brief.title, s.brief.status]),
    [["A", "Live a", "In Progress"], ["B", "Live b", "In Progress"], ["C", "Live c", "In Progress"]],
  );
  assert.deepEqual(live, branches.loadLiveBraids(root));
});

test("the synchronous reader behind list --open, view --links and check runs no merge-base and one cat-file --batch per kind of branch", () => {
  const { root, commit, git } = repo("known");
  commit(1, { "braids/0001-one/brief.md": brief("0001", "To Do", "One") }, "base");
  git("checkout", "-q", "-b", "braid/0001-one", "main");
  commit(2, { "braids/0001-one/brief.md": brief("0001", "In Progress", "Live one") }, "braid branch");
  git("checkout", "-q", "-b", "braid/0001/A-a");
  commit(3, { "braids/0001-one/A-a/brief.md": brief("0001/A", "In Progress", "Merged A") }, "strand a");
  git("checkout", "-q", "braid/0001-one");
  git("merge", "-q", "--no-ff", "-m", "merge a", "braid/0001/A-a");
  git("checkout", "-q", "-b", "braid/0001/B-b");
  commit(4, { "braids/0001-one/B-b/brief.md": brief("0001/B", "In Progress", "Live B") }, "strand b");
  git("checkout", "-q", "-b", "braid/0002-done", "main");
  commit(5, { "braids/0002-done/brief.md": brief("0002", "To Do", "Merged two") }, "two");
  git("checkout", "-q", "main");
  git("merge", "-q", "--no-ff", "-m", "merge two", "braid/0002-done");
  git("checkout", "-q", "-b", "plan/three", "main");
  commit(6, { "braids/0003-three/brief.md": brief("0003", "To Do", "Planned three") }, "plan three");
  git("checkout", "-q", "main");
  const sync: (readonly string[])[] = [];
  gitio.spyOnGit((args) => sync.push(args));
  const known = branches.loadKnownBraids(root);
  assert.deepEqual(sync.filter((a) => a[0] === "merge-base"), [], `no merge-base: ${JSON.stringify(sync)}`);
  assert.equal(sync.filter((a) => a[0] === "cat-file").length, 2, `one batch for braid branches, one for plan branches: ${JSON.stringify(sync)}`);
  assert.deepEqual(
    known.map((b) => [b.number, b.brief.title, b.strands.map((s) => [s.letter, s.brief.title])]),
    [
      ["0001", "Live one", [["A", "Merged A"], ["B", "Live B"]]],
      ["0002", "Merged two", []],
      ["0003", "Planned three", []],
    ],
  );
});

const ok = (data: unknown) => ({ status: 0, stdout: JSON.stringify(data), stderr: "" });
test("every running thread is shown on every read, also with an unchanged updatedAt", async () => {
  const shows: string[] = [];
  let updatedAt = "2026-11-18T10:00:00Z";
  const run = async (_root: string, args: readonly string[]) => {
    if (args[1] === "list") {
      return ok([{ threadId: "t1", status: "running", updatedAt }, { threadId: "t2", status: "running", updatedAt: "2026-11-18T09:00:00Z" }]);
    }
    shows.push(args[2] ?? "");
    return ok({ thread: { worktreePath: null, pendingRequestCount: 2 } });
  };
  const read = () => t3mod.readT3("/nowhere", { run, agents: "/agents", project: "/p" });
  assert.equal((await read()).status.state, "ok");
  assert.deepEqual(shows.sort(), ["t1", "t2"]);
  shows.length = 0;
  await read();
  assert.deepEqual(shows.sort(), ["t1", "t2"], "nothing changed, every thread is shown again");
  updatedAt = "2026-11-18T11:00:00Z";
  shows.length = 0;
  await read();
  assert.deepEqual(shows.sort(), ["t1", "t2"]);
});

test("a static file is served while a slow read of the board's git sources runs", async () => {
  const { root, commit } = repo("serve");
  commit(1, { "braids/0001-one/brief.md": brief("0001", "To Do") }, "base");
  const web = join(scratch, "web");
  mkdirSync(web);
  writeFileSync(join(web, "index.html"), "<p>board</p>");
  const fail = () => Promise.resolve({ status: 1, stdout: "", stderr: "down" });
  const src = board.repoSources(root, fail, fail);
  const slow = { ...src, braids: async () => (await new Promise((r) => setTimeout(r, 1500)), src.braids()) };
  const started = await board.startBoardWith(slow, web, 600_000);
  after(() => started.close());
  const began = Date.now();
  const page = await fetch(started.url);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /board/);
  assert.ok(Date.now() - began < 500, `served in ${Date.now() - began} ms during the read`);
});

test("a hung git cat-file --batch ends the read with an error after the timeout and the process is killed", async () => {
  const pidFile = join(scratch, "hung.pid");
  const hang = [process.execPath, "-e", `require("node:fs").writeFileSync(${JSON.stringify(pidFile)}, String(process.pid)); setInterval(() => {}, 1000)`];
  const began = Date.now();
  await assert.rejects(gitio.catBatch(scratch, ["HEAD:x"], 3000, hang), /timed out after 3000 ms/);
  assert.ok(Date.now() - began < 10_000, "ended by the timeout");
  const pid = Number(readFileSync(pidFile, "utf8"));
  let alive = true;
  for (let i = 0; i < 50 && alive; i++) {
    try {
      process.kill(pid, 0);
      await new Promise((r) => setTimeout(r, 100));
    } catch {
      alive = false;
    }
  }
  assert.equal(alive, false, "the hung process was killed");
});

test("opening a branch-sourced item's detail runs no synchronous git: its report and logs come from the batch", async () => {
  const { root, commit, git } = repo("detail");
  commit(1, { "braids/0001-one/brief.md": brief("0001", "To Do", "One") }, "base");
  git("checkout", "-q", "-b", "braid/0001-one", "main");
  commit(2, { "braids/0001-one/brief.md": brief("0001", "In Progress", "Live"), "braids/0001-one/report.md": "REPORT TEXT\n", "braids/0001-one/log-2026-11-18-abcd1234.md": "LOG TEXT\n" }, "work");
  git("checkout", "-q", "main");
  const live = await branches.loadLiveBraidsAsync(root);
  const item = live[0] as unknown as { source: Source | null };
  assert.ok(item.source !== null, "read from the branch");
  const sync: (readonly string[])[] = [];
  gitio.spyOnGit((args, isSync) => {
    if (isSync === true) {
      sync.push(args);
    }
  });
  const tree = branches.treeOf(root, item as never);
  const detailFiles = [tree.read("braids/0001-one/report.md"), tree.read("braids/0001-one/log-2026-11-18-abcd1234.md")];
  assert.deepEqual(detailFiles, ["REPORT TEXT\n", "LOG TEXT\n"]);
  assert.deepEqual(sync, [], `synchronous git ran: ${JSON.stringify(sync)}`);
});

test("catBatchSync: a missing object is null, the others still read", () => {
  const { root, commit } = repo("sync-missing");
  commit(1, { "a.txt": "A\n" }, "base");
  assert.deepEqual(gitio.catBatchSync(root, ["HEAD:a.txt", "HEAD:nope.txt"]), ["A\n", null]);
});

test("catBatchSync: a git that fails (not a repository) gives nulls for every spec", () => {
  const plain = join(scratch, "sync-plain");
  mkdirSync(plain);
  assert.deepEqual(gitio.catBatchSync(plain, ["HEAD:a", "HEAD:b"]), [null, null]);
});

test("catBatchSync: a hung process is killed at the timeout and gives nulls", () => {
  const hang = [process.execPath, "-e", "setInterval(() => {}, 1000)"];
  const began = Date.now();
  assert.deepEqual(gitio.catBatchSync(scratch, ["HEAD:x", "HEAD:y"], 3000, hang), [null, null]);
  assert.ok(Date.now() - began < 15_000, "ended by the timeout");
});
