import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { git, load } from "./support/done-fixtures.ts";

const cli = fileURLToPath(new URL("../dist/cli.js", import.meta.url));
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as { version: string };

// Every command here runs in a throwaway repository with a throwaway home, never in braid's own. Each test
// file has its own process, so the environment set here reaches `run` and the spawned CLI and nothing else.
const scratch = mkdtempSync(join(tmpdir(), "braid-cli-test-"));
after(() => rmSync(scratch, { recursive: true, force: true, maxRetries: 20, retryDelay: 250 }));
const repo = join(scratch, "repo");
mkdirSync(repo);
git(repo, "init", "-q");
for (const name of ["HOME", "USERPROFILE", "APPDATA", "LOCALAPPDATA", "XDG_CONFIG_HOME", "XDG_DATA_HOME", "XDG_STATE_HOME", "XDG_CACHE_HOME"]) {
  process.env[name] = join(scratch, "home");
}

function braid(...args: string[]) {
  return spawnSync(process.execPath, [cli, ...args], { encoding: "utf8", cwd: repo });
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { run, helpText }: any = await load("../../dist/cli.js");

/** The commands `help` names that nothing dispatches: neither `run` nor, for those `main` handles first, the built CLI. */
function undispatched(help: string): string[] {
  const lines = help.split("\n");
  const section = lines.slice(lines.indexOf("Commands:") + 1, lines.indexOf("Options:"));
  const names = [...new Set(section.flatMap((l) => /^ {2}([a-z-]+)/.exec(l)?.[1] ?? []))];
  const unknown = /unknown command/;
  // Every command refuses `--nope` before it does anything.
  return names.filter((name) => unknown.test(run([name, "--nope"], repo).stderr) && unknown.test(braid(name, "--nope").stderr));
}

test("every command named in the help is known to run", () => {
  // The help was read: it names far more commands than these two, one run by `run`, one by `main`.
  assert.match(helpText("0"), /^ {2}eta [\s\S]*^ {2}help /m);
  assert.deepEqual(undispatched(helpText("0")), []);
});

test("a help entry that nothing dispatches is reported", () => {
  // One command of each kind beside the one nothing runs.
  const help = ["Commands:", "  eta <name>", "  wait <number>", "  nosuch", "Options:"].join("\n");
  assert.deepEqual(undispatched(help), ["nosuch"]);
});

test("importing the CLI module runs no command", () => {
  const code = `await import(${JSON.stringify(pathToFileURL(cli).href)})`;
  const r = spawnSync(process.execPath, ["--input-type=module", "-e", code], { encoding: "utf8", cwd: repo });
  assert.deepEqual([r.status, r.stdout, r.stderr], [0, "", ""]);
});
