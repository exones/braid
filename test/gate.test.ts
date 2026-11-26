import assert from "node:assert/strict";
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test, type TestContext } from "node:test";
import { fileURLToPath } from "node:url";

// `braid gate`: BRAID.md's gate with at most two at once on a machine (0077/D). Every run uses a temporary home.

const cli = fileURLToPath(new URL("../dist/cli.js", import.meta.url));

// The fake gate: says it started, then runs until `<project>/release` exists and exits with the code written there.
const FAKE = `import { existsSync, readFileSync, writeFileSync } from "node:fs";
writeFileSync("started", String(process.pid));
console.log("gate output");
while (!existsSync("release")) await new Promise((r) => setTimeout(r, 20));
process.exit(Number(readFileSync("release", "utf8")));
`;

function machine(t: TestContext) {
  const base = mkdtempSync(join(tmpdir(), "braid-gate-"));
  const home = join(base, "home");
  const braid = join(home, ".braid");
  mkdirSync(braid, { recursive: true });
  const env = { ...process.env, HOME: home, USERPROFILE: home, APPDATA: home, LOCALAPPDATA: home, XDG_CONFIG_HOME: home };
  writeFileSync(join(base, "fake.mjs"), FAKE);
  const children: ChildProcess[] = [];
  const projects: string[] = [];
  t.after(async () => {
    for (const dir of projects) {
      writeFileSync(join(dir, "release"), "0");
    }
    await Promise.all(children.map((c) => (c.exitCode !== null || c.signalCode !== null ? null : new Promise((r) => c.on("close", r)))));
    rmSync(base, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  });
  const project = (name: string, gate = "node ../fake.mjs"): string => {
    const dir = join(base, name);
    mkdirSync(join(dir, "braids"), { recursive: true });
    writeFileSync(join(dir, "BRAID.md"), `---\ngate: ${gate}\nmain: main\n---\n`);
    projects.push(dir);
    return dir;
  };
  const run = (cwd: string, ...args: string[]) => {
    const child = spawn(process.execPath, [cli, "gate", ...args], { cwd, env });
    children.push(child);
    const out = { stdout: "", stderr: "" };
    child.stdout.on("data", (d: Buffer) => (out.stdout += d.toString()));
    child.stderr.on("data", (d: Buffer) => (out.stderr += d.toString()));
    const done = new Promise<number | null>((r) => child.on("close", r));
    return { child, out, done };
  };
  const slot = (n: number): string => join(braid, `gate-${n}.lock`);
  const hold = (n: number, pid: number): void => writeFileSync(slot(n), JSON.stringify({ pid, project: `other${n}`, worktree: `/work/other${n}`, since: "2026-11-26T00:00:00.000Z" }));
  return { project, run, slot, hold };
}

async function until(what: string, met: () => boolean): Promise<void> {
  const give = Date.now() + 60_000;
  while (!met()) {
    assert.ok(Date.now() < give, `timed out waiting for ${what}`);
    await new Promise((r) => setTimeout(r, 20));
  }
}

const started = (dir: string): boolean => existsSync(join(dir, "started"));

test("two gates run at once, a third waits and says who holds the slots, and the exit code passes through", async (t) => {
  const m = machine(t);
  const [a, b, c] = [m.project("a"), m.project("b"), m.project("c")];
  const first = m.run(a);
  const second = m.run(b);
  await until("two gates", () => started(a) && started(b));
  const third = m.run(c);
  await until("the waiting note", () => third.out.stderr.includes("waiting for one"));
  // Longer than one poll of the waiter: it stays out and doesn't repeat itself.
  await new Promise((r) => setTimeout(r, 1500));
  assert.equal(started(c), false);
  assert.equal(third.out.stderr.match(/both gate slots are held/g)?.length, 1);
  for (const [name, dir] of [["a", a], ["b", b]] as const) {
    assert.ok(third.out.stderr.includes(`  ${name} (${dir}) since 20`), third.out.stderr);
  }

  writeFileSync(join(a, "release"), "7");
  assert.equal(await first.done, 7);
  assert.match(first.out.stdout, /gate output/);
  await until("the third gate", () => started(c));
  writeFileSync(join(b, "release"), "0");
  writeFileSync(join(c, "release"), "0");
  assert.equal(await second.done, 0);
  assert.equal(await third.done, 0);
  assert.equal(existsSync(m.slot(1)), false);
  assert.equal(existsSync(m.slot(2)), false);
});

test("--no-wait exits 75 while both slots are held by running processes", async (t) => {
  const m = machine(t);
  const dir = m.project("a");
  m.hold(1, process.pid);
  m.hold(2, process.pid);
  const run = m.run(dir, "--no-wait");
  assert.equal(await run.done, 75);
  assert.match(run.out.stderr, /both gate slots are held:\n {2}other1 \(\/work\/other1\) since 2026-11-26T00:00:00\.000Z, pid \d+\n {2}other2 /);
  assert.equal(started(dir), false);
  assert.equal(JSON.parse(readFileSync(m.slot(1), "utf8")).project, "other1");
});

test("a slot whose process is gone is taken over, and released after a failing gate", async (t) => {
  const m = machine(t);
  const dir = m.project("a", `node -e "process.exit(3)"`);
  const gone = spawnSync(process.execPath, ["-e", ""]).pid;
  m.hold(1, gone);
  m.hold(2, process.pid);
  const run = m.run(dir, "--no-wait");
  assert.equal(await run.done, 3);
  assert.equal(run.out.stderr, "");
  assert.equal(existsSync(m.slot(1)), false);
  assert.equal(existsSync(m.slot(2)), true);
});

test("a SIGTERM to braid gate ends the gate's processes and releases the slot", { skip: process.platform === "win32" && "Windows has no SIGTERM to catch", timeout: 60_000 }, async (t) => {
  const m = machine(t);
  // A compound command, so the shell stays between braid and the gate's process.
  const dir = m.project("a", "node ../fake.mjs && true");
  const run = m.run(dir);
  await until("the gate", () => started(dir));
  run.child.kill("SIGTERM");
  assert.equal(await run.done, 143);
  assert.equal(existsSync(m.slot(1)), false);
  const gate = Number(readFileSync(join(dir, "started"), "utf8"));
  await until("the gate's process to end", () => {
    try {
      process.kill(gate, 0);
      return false;
    } catch {
      return true;
    }
  });
});

test("no gate in BRAID.md is a usage error that takes no slot", async (t) => {
  const m = machine(t);
  const dir = m.project("a", "");
  const run = m.run(dir);
  assert.equal(await run.done, 1);
  assert.match(run.out.stderr, /names no gate/);
  assert.equal(existsSync(m.slot(1)), false);
});
