// 0077/G: the board reads braids/ without a synchronous file-system call, and reads nothing again while no file
// changed and no branch tip moved; the item page is served from what the read already holds.
import assert from "node:assert/strict";
import fs from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import { mock, test } from "node:test";
import { brief, git, load, world } from "./support/done-fixtures.ts";

/* eslint-disable @typescript-eslint/no-explicit-any */
const gitio: any = await load("../../dist/braids/gitio.js");
const feedMod: any = await load("../../dist/board/feed.js");
const board: any = await load("../../dist/commands/board.js");
const model: any = await load("../../dist/board/model.js");
const worktree: any = await load("../../dist/braids/worktree.js");
const readinessMod: any = await load("../../dist/braids/readiness.js");
const store: any = await load("../../dist/braids/store.js");

const SYNC = ["accessSync", "existsSync", "lstatSync", "openSync", "opendirSync", "readFileSync", "readdirSync", "realpathSync", "statSync"] as const;

/** Records every synchronous file-system read of a path under `<root>/braids`. */
function watchSync(root: string): { calls: string[]; stop: () => void } {
  const calls: string[] = [];
  const braids = resolve(root, "braids");
  for (const name of SYNC) {
    const original = (fs as any)[name];
    const wrapped = (...args: any[]) => {
      const path = typeof args[0] === "string" ? resolve(args[0]) : "";
      if (path === braids || path.startsWith(`${braids}${sep}`)) {
        calls.push(`${name} ${path.slice(braids.length)}`);
      }
      return original(...args);
    };
    mock.method(fs as any, name, Object.assign(wrapped, original));
  }
  syncBuiltinESMExports();
  return {
    calls,
    stop: () => {
      mock.restoreAll();
      syncBuiltinESMExports();
    },
  };
}

/** A braid in the working tree with a report, a log and a strand, committed. */
function addBraid(root: string): void {
  const dir = join(root, "braids", "0003-new");
  mkdirSync(join(dir, "A-part"), { recursive: true });
  writeFileSync(join(dir, "brief.md"), brief("0003", "To Do").replace("labels: []", "labels: []\nrelated: ['0001']"));
  writeFileSync(join(dir, "report.md"), "the report\n");
  writeFileSync(join(dir, "log-2026-11-25-user.md"), "the log\n");
  writeFileSync(join(dir, "sources.md"), "not read by the board\n");
  writeFileSync(join(dir, "A-part", "brief.md"), brief("0003/A", "To Do"));
  git(root, "add", "-A");
  git(root, "commit", "-q", "-m", "docs: 0003");
}

test("a board read, its readiness check and an item page read braids/ with no synchronous file-system call", async () => {
  const w = world();
  addBraid(w.root);
  const src = board.repoSources(w.root, w.opts.gh, w.opts.t3);
  const watch = watchSync(w.root);
  let snap: any;
  let detail: any;
  try {
    snap = await feedMod.readSnapshot(src, false);
    assert.equal(snap.ok, true, String(snap.error));
    const braid = snap.braids.find((b: any) => b.number === "0003");
    detail = model.toDetail(src.tree(braid), braid, braid, snap.github, snap.t3, snap.sig, snap.start);
  } finally {
    watch.stop();
  }
  assert.deepEqual(watch.calls, [], `synchronous reads of braids/: ${JSON.stringify(watch.calls)}`);
  assert.equal(detail.report, "the report\n");
  assert.deepEqual(detail.logs, [{ name: "log-2026-11-25-user.md", text: "the log\n" }]);
  assert.deepEqual(snap.board.problems.filter((p: any) => p.key === "check"), []);
});

test("the watch for synchronous reads sees the blocking loader", () => {
  const w = world();
  const watch = watchSync(w.root);
  try {
    store.loadBraids(w.root);
  } finally {
    watch.stop();
  }
  assert.ok(watch.calls.length > 0);
});

test("a read with no change to braids/ and no moved tip loads nothing; an edit or a moved tip loads again", async () => {
  const w = world();
  addBraid(w.root);
  const src = board.repoSources(w.root, w.opts.gh, w.opts.t3);
  const read = async () => {
    const snap = await feedMod.readSnapshot(src, false);
    assert.equal(snap.ok, true, String(snap.error));
    return snap;
  };
  const find = (snap: any, number: string) => snap.braids.find((b: any) => b.number === number);
  const first = await read();
  const tree = await worktree.readWorkingTree(w.root);

  const calls: string[] = [];
  gitio.spyOnGit((args: readonly string[]) => void calls.push(args[0] ?? ""));
  try {
    const again = await read();
    // The same objects: neither the files nor the braids were loaded again.
    assert.equal(await worktree.readWorkingTree(w.root), tree);
    assert.equal(find(again, "0003"), find(first, "0003"));
    assert.deepEqual(
      calls.filter((c) => c !== "for-each-ref" && c !== "rev-parse"),
      [],
      `only the tips are asked for: ${calls.join(", ")}`,
    );
  } finally {
    gitio.spyOnGit(undefined);
  }

  const file = join(w.root, "braids", "0003-new", "brief.md");
  writeFileSync(file, brief("0003", "In Progress"));
  const edited = await read();
  assert.equal(find(edited, "0003").brief.status, "In Progress");
  assert.notEqual(await worktree.readWorkingTree(w.root), tree);

  // A new strand branch is a moved tip.
  const home = git(w.root, "branch", "--show-current").trim();
  git(w.root, "checkout", "-q", "-b", "braid/0003/A-part");
  writeFileSync(join(w.root, "braids", "0003-new", "A-part", "brief.md"), brief("0003/A", "In Progress"));
  git(w.root, "commit", "-q", "-am", "docs: start 0003/A");
  git(w.root, "checkout", "-q", home);
  const moved = await read();
  assert.equal(find(moved, "0003").strands[0].brief.status, "In Progress");

  rmSync(join(w.root, "braids", "0003-new"), { recursive: true });
  assert.deepEqual((await worktree.readWorkingTree(w.root)).list("braids").map((e: any) => e.name).includes("0003-new"), false);
});

test("the board's readiness says what braid check says, and follows an edit", async () => {
  const w = world();
  addBraid(w.root);
  const both = async () => {
    const mine = await readinessMod.readinessAsync(w.root, null);
    assert.deepEqual(mine, readinessMod.readiness(w.root, null));
    return mine.map((p: any) => p.key);
  };
  assert.ok(!(await both()).includes("check"));
  writeFileSync(join(w.root, "braids", "0003-new", "brief.md"), "no front matter\n");
  assert.ok((await both()).includes("check"));
  mkdirSync(join(w.root, "autonomy"), { recursive: true });
  writeFileSync(join(w.root, "autonomy", "Bad Name.md"), "x\n");
  writeFileSync(join(w.root, "BRAID.md"), "---\ngate: x\nautonomy: nope\ndocs: x\n---\n");
  assert.ok((await both()).includes("check"));
  rmSync(join(w.root, "braids"), { recursive: true });
  assert.ok((await both()).includes("no-braids"));
});
