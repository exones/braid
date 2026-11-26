// The lock writers take turns with (src/braids/state.ts, 0078/L): a live holder keeps it however long it takes; a dead one loses it.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, unlinkSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const scratch = mkdtempSync(join(tmpdir(), "braid-lock-test-"));
after(() => rmSync(scratch, { recursive: true, force: true, maxRetries: 20, retryDelay: 250 }));

const stateUrl = pathToFileURL(fileURLToPath(new URL("../dist/braids/state.js", import.meta.url))).href;
const { locked, takeOverStale, checkHeld } = (await import(stateUrl)) as {
  locked: <T>(file: string, fn: () => T, what?: string, makeDir?: (dir: string) => void, waitMs?: number, clock?: object, refreshMs?: number) => T;
  takeOverStale: (lock: string, staleMs?: number) => boolean;
  checkHeld: () => void;
};
const { writeBranch } = (await import(pathToFileURL(fileURLToPath(new URL("../dist/braids/gitbranch.js", import.meta.url))).href)) as {
  writeBranch: (root: string, b: object, change: () => { files: Map<string, string>; message: string }) => unknown;
};

const noDir = () => {};
const old = () => new Date(Date.now() - 3_600_000);
const sleep = (ms: number) => void Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
const place = (name: string) => join(mkdtempSync(join(scratch, `${name}-`)), `${name}.json`);

test("a holder blocked in a synchronous child process past the stale time keeps its lock", () => {
  const file = place("slow");
  const lock = `${file}.lock`;
  const kept = locked(
    file,
    () => {
      const token = readFileSync(lock, "utf8");
      // The lock looks an hour old, as if this hold had run that long. The holder now sits in a synchronous child process, as in a git push;
      // the child returns once the lock was touched again, so only the refresher, not a timer of the main thread, can end it.
      utimesSync(lock, old(), old());
      const child = spawnSync(
        process.execPath,
        ["-e", `const { statSync } = require("node:fs"); while (Date.now() - statSync(process.argv[1]).mtimeMs > 60000) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 10);`, lock],
        { encoding: "utf8", timeout: 60_000 },
      );
      assert.equal(child.status, 0, `the lock was never refreshed: ${child.stderr}`);
      assert.equal(takeOverStale(lock), false, "a waiter finds it fresh");
      assert.doesNotThrow(() => checkHeld());
      return readFileSync(lock, "utf8") === token;
    },
    "q",
    noDir,
    undefined,
    undefined,
    20,
  );
  assert.equal(kept, true, "still our own lock");
  assert.equal(existsSync(lock), false, "released");
});

test("a dead holder's lock is no longer refreshed and is taken over after the stale time", () => {
  const file = place("dead");
  const lock = `${file}.lock`;
  // The holder exits inside its hold: no `finally` runs, so its lock stays; its refresher dies with the process.
  const holder = spawnSync(
    process.execPath,
    ["--input-type=module", "-e", `import { locked } from ${JSON.stringify(stateUrl)}; locked(process.argv[1], () => { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100); process.exit(0); }, "q", () => {}, undefined, undefined, 10);`, file],
    { encoding: "utf8", timeout: 60_000 },
  );
  assert.equal(holder.status, 0, holder.stderr);
  assert.equal(existsSync(lock), true, "the dead holder's lock is left");
  utimesSync(lock, old(), old());
  const at = statSync(lock).mtimeMs;
  sleep(200);
  assert.equal(statSync(lock).mtimeMs, at, "nothing refreshes it after the holder died");
  assert.equal(locked(file, () => "got", "q", noDir), "got", "taken over as stale");
  assert.equal(existsSync(lock), false);
});

test("a holder that lost its lock leaves the new holder's lock alone, never refreshes it, and checkHeld refuses", () => {
  const file = place("lost");
  const lock = `${file}.lock`;
  locked(
    file,
    () => {
      // A waiter took it over as stale and made its own.
      unlinkSync(lock);
      writeFileSync(lock, "another writer");
      utimesSync(lock, old(), old());
      assert.throws(() => checkHeld(), /lost the lock/);
      sleep(200);
      assert.ok(Date.now() - statSync(lock).mtimeMs > 60_000, "the other writer's lock is not ours to refresh");
    },
    "q",
    noDir,
    undefined,
    undefined,
    10,
  );
  assert.equal(readFileSync(lock, "utf8"), "another writer", "release leaves it");
  assert.doesNotThrow(() => checkHeld(), "nothing held any more");
});

test("a branch write whose lock was taken over fails before it pushes or moves the branch", () => {
  const base = mkdtempSync(join(scratch, "branch-"));
  const root = join(base, "proj");
  const run = (cwd: string, ...args: string[]) => {
    const r = spawnSync("git", args, { cwd, encoding: "utf8" });
    assert.equal(r.status, 0, r.stderr);
    return r.stdout.trim();
  };
  run(base, "init", "-q", "--bare", "remote.git");
  run(base, "init", "-q", "-b", "main", root);
  run(root, "config", "user.email", "t@example.com");
  run(root, "config", "user.name", "t");
  run(root, "remote", "add", "origin", join(base, "remote.git"));
  run(root, "commit", "-q", "--allow-empty", "-m", "init");
  mkdirSync(join(root, ".braid"), { recursive: true });
  const spec = { branch: "data", folders: ["d"], lock: "data", what: "the data", noun: "entry" };
  const lock = join(root, ".braid", "data.lock");
  assert.throws(
    () =>
      writeBranch(root, spec, () => {
        unlinkSync(lock);
        writeFileSync(lock, "another writer");
        return { files: new Map([["d/one.md", "one\n"]]), message: "add one" };
      }),
    /lost the lock/,
  );
  assert.equal(spawnSync("git", ["rev-parse", "--verify", "-q", "refs/heads/data"], { cwd: root }).status, 1, "the local branch didn't move");
  assert.equal(run(join(base, "remote.git"), "branch", "--list", "data"), "", "nothing pushed");
  assert.equal(readFileSync(lock, "utf8"), "another writer");
});
