import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { load } from "./support/done-fixtures.ts";

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

test("braid done is an alias of braid accept and says so", () => {
  const r = braid("done");
  assert.match(r.stderr, /braid done is now braid accept/);
  assert.match(r.stderr, /usage: braid accept/);
  assert.equal(r.status, 1);
  assert.match(braid("--help").stdout, /accept <id>/);
});

test("every command named in the help is known to run", async () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { run, helpText }: any = await load("../../dist/cli.js");
  // These are handled in `main` before `run`, so they are not in its command list.
  const skip = new Set(["help", "board", "gate", "notify", "projects", "clean", "wait", "status", "next", "start", "accept", "facts", "recap", "handover", "review"]);
  const lines: string[] = helpText("0").split("\n");
  const section = lines.slice(lines.indexOf("Commands:") + 1, lines.indexOf("Options:"));
  const names = new Set<string>();
  for (const l of section) {
    const n = /^ {2}([a-z-]+)/.exec(l)?.[1];
    if (n !== undefined && !skip.has(n)) names.add(n);
  }
  assert.ok(names.has("eta") && names.size > 20);
  for (const name of names) {
    assert.doesNotMatch(run([name, "--nope"], root).stderr, /unknown command/, name);
  }
});
