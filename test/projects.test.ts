// braid projects add|remove|list: run as `node dist/cli.js` (never the installed shim, which fails when
// LOCALAPPDATA points elsewhere) with every home folder in a temporary folder, never the real ~/.braid.
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, sep } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

// realpathSync.native expands Windows 8.3 short names (RUNNER~1 on CI), as Git does.
const scratch = realpathSync.native(mkdtempSync(join(tmpdir(), "braid-projects-")));
after(() => rmSync(scratch, { recursive: true, force: true, maxRetries: 20, retryDelay: 250 }));
const cli = fileURLToPath(new URL("../dist/cli.js", import.meta.url));
let n = 0;
const fresh = (prefix: string): string => {
  n += 1;
  const d = join(scratch, `${prefix}${n}`);
  mkdirSync(d, { recursive: true });
  return d;
};

const GOOD = "---\ngate: npm test\nmain: main\nci: [verify]\nmodels:\n  worker: a / b / effort=medium\n---\n";

/** A Git repository with BRAID.md and an empty braids/ (ready), under its own parent folder so names can repeat. */
function repo(name: string, ready = true): string {
  const root = join(fresh("r"), name);
  mkdirSync(join(root, "braids"), { recursive: true });
  if (ready) {
    writeFileSync(join(root, "BRAID.md"), GOOD);
  }
  const r = spawnSync("git", ["init", "-q", root], { encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  return root;
}

function envFor(home: string): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env, HOME: home, USERPROFILE: home, APPDATA: home, LOCALAPPDATA: home };
  for (const k of ["XDG_CONFIG_HOME", "XDG_DATA_HOME", "XDG_STATE_HOME", "XDG_CACHE_HOME"]) {
    env[k] = join(home, k);
  }
  return env;
}

interface Run {
  code: number | null;
  stdout: string;
  stderr: string;
}

function braid(home: string, args: string[], cwd: string = scratch): Run {
  const r = spawnSync(process.execPath, [cli, ...args], { cwd, env: envFor(home), encoding: "utf8" });
  return { code: r.status, stdout: r.stdout, stderr: r.stderr };
}

function braidAsync(home: string, args: string[]): Promise<Run> {
  return new Promise((done) => {
    const child = spawn(process.execPath, [cli, ...args], { cwd: scratch, env: envFor(home) });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d: Buffer) => (stdout += d.toString()));
    child.stderr.on("data", (d: Buffer) => (stderr += d.toString()));
    child.on("close", (code) => done({ code, stdout, stderr }));
  });
}

const listFile = (home: string): string => join(home, ".braid", "projects.json");
const stored = (home: string): { version: number; projects: { name: string; path: string; port?: number }[] } => JSON.parse(readFileSync(listFile(home), "utf8"));

test("a missing list reads as empty, and add creates it with the main checkout and the readiness", () => {
  const home = fresh("h");
  const list = braid(home, ["projects", "list"]);
  assert.equal(list.code, 0, list.stderr);
  assert.match(list.stdout, /No projects yet/);
  assert.equal(existsSync(listFile(home)), false, "list alone writes nothing");

  const alpha = repo("alpha");
  mkdirSync(join(alpha, "sub"));
  const added = braid(home, ["projects", "add", "--port", "4100"], join(alpha, "sub"));
  assert.equal(added.code, 0, added.stderr);
  assert.match(added.stdout, /Added alpha {2}.*alpha {2}port 4100/);
  assert.match(added.stdout, /ready \(GitHub not checked here\)/);
  assert.deepEqual(stored(home), { version: 1, projects: [{ name: "alpha", path: alpha, port: 4100 }] });
});

test("add from a worktree lists the main checkout", () => {
  const home = fresh("h");
  const main = repo("gamma");
  const commit = spawnSync("git", ["-c", "user.name=t", "-c", "user.email=t@example.com", "commit", "-q", "--allow-empty", "-m", "x"], { cwd: main, encoding: "utf8" });
  assert.equal(commit.status, 0, commit.stderr);
  const wt = join(fresh("w"), "gamma-wt");
  const made = spawnSync("git", ["worktree", "add", "-q", "-b", "side", wt], { cwd: main, encoding: "utf8" });
  assert.equal(made.status, 0, made.stderr);
  const added = braid(home, ["projects", "add", wt]);
  assert.equal(added.code, 0, added.stderr);
  assert.deepEqual(stored(home).projects, [{ name: "gamma", path: main }]);
});

test("add refuses a duplicate name, a duplicate path, a folder outside Git and a bad port", () => {
  const home = fresh("h");
  const alpha = repo("alpha");
  assert.equal(braid(home, ["projects", "add", alpha]).code, 0);
  const before = readFileSync(listFile(home), "utf8");

  const samePath = braid(home, ["projects", "add", alpha, "--name", "other"]);
  assert.equal(samePath.code, 1);
  assert.match(samePath.stderr, /already listed as alpha/);

  const sameName = braid(home, ["projects", "add", repo("beta"), "--name", "alpha"]);
  assert.equal(sameName.code, 1);
  assert.match(sameName.stderr, /a project named alpha is already listed/);

  const plain = fresh("plain");
  const notGit = braid(home, ["projects", "add", plain]);
  assert.equal(notGit.code, 1);
  assert.match(notGit.stderr, /is not in a Git repository/);

  const badPort = braid(home, ["projects", "add", repo("delta"), "--port", "70000"]);
  assert.equal(badPort.code, 1);
  assert.match(badPort.stderr, /--port takes a number from 1 to 65535/);

  assert.equal(readFileSync(listFile(home), "utf8"), before, "a refused add leaves the list alone");
});

test("add warns when two projects share a folder name (one worktrees folder)", () => {
  const home = fresh("h");
  assert.equal(braid(home, ["projects", "add", repo("app")]).code, 0);
  const second = braid(home, ["projects", "add", repo("app"), "--name", "app2"]);
  assert.equal(second.code, 0, second.stderr);
  assert.match(second.stderr, /warning: app \(.*\) has the same folder name app; both projects' item worktrees go to ~\/braid-worktrees\/app\//);
  assert.equal(stored(home).projects.length, 2);
});

test("remove takes a project off the list and refuses an unknown name", () => {
  const home = fresh("h");
  const alpha = repo("alpha");
  const beta = repo("beta");
  assert.equal(braid(home, ["projects", "add", alpha]).code, 0);
  assert.equal(braid(home, ["projects", "add", beta]).code, 0);
  const removed = braid(home, ["projects", "remove", "alpha"]);
  assert.equal(removed.code, 0, removed.stderr);
  assert.match(removed.stdout, /Removed alpha/);
  assert.deepEqual(stored(home).projects, [{ name: "beta", path: beta }]);
  const unknown = braid(home, ["projects", "remove", "alpha"]);
  assert.equal(unknown.code, 1);
  assert.match(unknown.stderr, /no project named alpha/);
});

test("a corrupt list or an unknown version: every command reports it, and nothing rewrites it", () => {
  for (const text of ["{ not json", `${JSON.stringify({ version: 2, projects: [] })}\n`, `${JSON.stringify({ version: 1, projects: [{ name: "x" }] })}\n`, twicePath()]) {
    const home = fresh("h");
    mkdirSync(join(home, ".braid"), { recursive: true });
    writeFileSync(listFile(home), text);
    for (const args of [["projects", "list"], ["projects", "add", repo("alpha")], ["projects", "remove", "x"]]) {
      const r = braid(home, args);
      assert.equal(r.code, 2, `${args.join(" ")}: ${r.stdout}${r.stderr}`);
      assert.match(r.stderr, /projects\.json/);
      assert.equal(readFileSync(listFile(home), "utf8"), text, `${args.join(" ")} left the file alone`);
    }
  }
});

test("adds run at once: no entry is lost", async () => {
  const home = fresh("h");
  const repos = Array.from({ length: 6 }, (_, i) => repo(`p${i}`));
  const runs = await Promise.all(repos.map((r) => braidAsync(home, ["projects", "add", r])));
  for (const r of runs) {
    assert.equal(r.code, 0, r.stderr);
  }
  assert.deepEqual(stored(home).projects.map((p) => p.name).sort(), repos.map((_, i) => `p${i}`).sort());
  assert.equal(existsSync(`${listFile(home)}.lock`), false, "the lock is released");
});

test("list shows a project whose folder is gone as a problem, and still lists the others", () => {
  const home = fresh("h");
  const gone = repo("gone");
  const kept = repo("kept", false);
  assert.equal(braid(home, ["projects", "add", gone]).code, 0);
  assert.equal(braid(home, ["projects", "add", kept]).code, 0);
  rmSync(gone, { recursive: true, force: true });
  const r = braid(home, ["projects", "list"]);
  assert.equal(r.code, 0, r.stderr);
  assert.match(r.stdout, /^gone {2}.*\n {2}problem: the folder no longer exists; run braid projects remove gone/m);
  assert.match(r.stdout, /^kept {2}.*\n {2}not ready: BRAID\.md is missing/m);
});

/** A list naming one folder twice, the second time with a trailing separator (and other case on Windows). */
function twicePath(): string {
  const same = join(scratch, "Same");
  const again = `${process.platform === "win32" ? same.toLowerCase() : same}${sep}`;
  return `${JSON.stringify({ version: 1, projects: [{ name: "a", path: same }, { name: "b", path: again }] })}\n`;
}

const { samePath } = (await import(pathToFileURL(fileURLToPath(new URL("../dist/projects/list.js", import.meta.url))).href)) as { samePath: (a: string, b: string) => boolean };

test("samePath: one folder in its spellings is the same, two folders are not", () => {
  const base = join(scratch, "Same");
  assert.equal(samePath(base, `${base}${sep}`), true, "a trailing separator");
  assert.equal(samePath(base, join(scratch, "x", "..", "Same")), true, "a .. segment");
  assert.equal(samePath(base, join(scratch, "Other")), false);
  if (process.platform === "win32") {
    assert.equal(samePath("C:\\Code\\Agento", "c:/code/agento/"), true, "case, / for \\ and a trailing slash");
    assert.equal(samePath("C:\\code\\agento", "C:\\code\\agento2"), false);
  } else {
    assert.equal(samePath("/src/Agento", "/src/agento"), false, "case counts outside Windows");
  }
});
