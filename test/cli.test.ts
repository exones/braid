import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const cli = fileURLToPath(new URL("../dist/cli.js", import.meta.url));
const pkg = JSON.parse(readFileSync(`${root}package.json`, "utf8")) as { version: string };

function braid(...args: string[]) {
  return spawnSync(process.execPath, [cli, ...args], { encoding: "utf8", cwd: root });
}

test("--version prints the package version", () => {
  const r = braid("--version");
  assert.equal(r.status, 0);
  assert.equal(r.stdout, `braid ${pkg.version}\n`);
});

test("help and --help print usage", () => {
  for (const arg of ["help", "--help"]) {
    const r = braid(arg);
    assert.equal(r.status, 0);
    assert.match(r.stdout, /^braid \d/);
    assert.match(r.stdout, /Usage: braid <command>/);
  }
});

test("unknown command fails", () => {
  const r = braid("nope");
  assert.equal(r.status, 1);
  assert.equal(r.stderr, "error: unknown command: nope\nRun braid help.\n");
});
