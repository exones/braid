import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, renameSync, rmSync, writeFileSync } from "node:fs";
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
};
const gitio = (await load("../dist/braids/gitio.js")) as { spyOnGit: (observer: ((args: readonly string[]) => void) | undefined) => void };
const t3mod = (await load("../dist/board/t3.js")) as {
  readT3: (root: string, options: unknown) => Promise<{ status: { state: string } }>;
  resetT3Memory: () => void;
};
const board = (await load("../dist/commands/board.js")) as {
  repoSources: (root: string, gh: unknown, t3: unknown) => { braids(): unknown };
  startBoardWith: (src: unknown, web: string, refreshMs?: number) => Promise<{ server: Server; url: string }>;
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
  t3mod.resetT3Memory();
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
  const read = () => t3mod.readT3("/nowhere", { run, ttlMs: 0, agents: "/agents", project: "/p" });
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
  after(() => {
    started.server.close();
    started.server.closeAllConnections();
  });
  const began = Date.now();
  const page = await fetch(started.url);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /board/);
  assert.ok(Date.now() - began < 500, `served in ${Date.now() - began} ms during the read`);
});
