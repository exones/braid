import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, test } from "node:test";
import { expectErr, repoRoot, runCli, unknown, withRoot } from "./helpers.ts";

const packageMetadata = JSON.parse(await readFile(join(repoRoot, "package.json"), "utf8")) as { version: string };
const versionLine = `braid ${packageMetadata.version}`;
const helpText = [
  versionLine,
  "",
  "Usage:",
  "  braid [--root <dir>] [--help|-h] [--version|-v]",
  "  braid [--root <dir>] init",
  "  braid [--root <dir>] new <epic-id> --title <text> --outcome <text>",
  "  braid [--root <dir>] status [epic-id] [--json]",
  "  braid [--root <dir>] story add <epic-id> <item-id> --title <text> [--kind story|task|spike] [--note <text>] [--next <text>]",
  "  braid [--root <dir>] story start <epic-id> <item-id> [--note <text>] [--next <text>]",
  "  braid [--root <dir>] story block <epic-id> <item-id> --reason <text> [--note <text>] [--next <text>]",
  "  braid [--root <dir>] story complete <epic-id> <item-id> --evidence <text> [--note <text>] [--next <text>]",
  "",
  "Options:",
  "  --root <dir>     Project root. Defaults to the working directory.",
  "  -h, --help       Show help.",
  "  -v, --version    Print the version from this package.",
  "",
  "Commands:",
  "  init       Create an empty schema 1 ledger at .braid/.",
  "  new        Create an epic.",
  "  status     Show epic and item status.",
  "  story      Record manual progress for a story, task, or spike.",
  "",
  "Completion is a manual record, not gate acceptance.",
  "",
].join("\n");

async function withClean(check: (cwd: string) => Promise<void>): Promise<void> {
  await withRoot(async (cwd) => {
    await check(cwd);
    assert.equal(existsSync(join(cwd, ".braid")), false);
    assert.equal(existsSync(join(cwd, ".crew")), false);
  });
}

describe("braid help, version, and unknown commands", () => {
  test("the test process uses Node.js 26.13 or newer, below 27", () => {
    const match = /^v(\d+)\.(\d+)\.(\d+)/.exec(process.version);
    assert.ok(match);
    const major = Number(match[1]);
    const minor = Number(match[2]);
    assert.equal(major, 26);
    assert.ok(minor >= 13);
  });

  test("package metadata declares an ESM braid executable independently of registry identity", async () => {
    const parsed: unknown = JSON.parse(await readFile(join(repoRoot, "package.json"), "utf8"));
    assert.equal(typeof parsed, "object");
    assert.ok(parsed !== null);
    const pkg = parsed as {
      name: string;
      version: string;
      private: boolean;
      type: string;
      bin: { braid: string };
      engines: { node: string };
      repository: { url: string };
    };
    assert.equal(typeof pkg.name, "string");
    assert.ok(pkg.name.length > 0);
    assert.equal(typeof pkg.version, "string");
    assert.ok(pkg.version.length > 0);
    assert.equal(typeof pkg.private, "boolean");
    assert.equal(pkg.type, "module");
    assert.equal(pkg.bin.braid, "dist/cli.js");
    assert.equal(pkg.engines.node, ">=26.13.0 <27");
    assert.equal(pkg.repository.url, "git+https://github.com/exones/braid.git");

    const source = await readFile(join(repoRoot, "dist", "cli.js"), "utf8");
    assert.equal(source.startsWith("#!/usr/bin/env node\n"), true);
  });

  test("no arguments and help flags print the ledger help and write nothing else", async () => {
    await withClean(async (cwd) => {
      for (const args of [[], ["--help"], ["-h"], ["--version", "--help"], ["--root", cwd]]) {
        const result = await runCli(args, cwd);
        assert.equal(result.code, 0, args.join(" "));
        assert.equal(result.stdout, helpText, args.join(" "));
        assert.equal(result.stderr, "", args.join(" "));
      }
    });
  });

  test("help for a known command describes that command", async () => {
    const cases: readonly (readonly [readonly string[], string])[] = [
      [["--help", "init"], "Running init again on valid schema 1 changes nothing."],
      [["init", "--help"], "Running init again on valid schema 1 changes nothing."],
      [["init", "extra", "--help"], "Running init again on valid schema 1 changes nothing."],
      [["new", "--help"], "no current-epic pointer"],
      [["status", "-h"], "--json prints one JSON document"],
      [["status", "--json", "--help"], "--json prints one JSON document"],
      [["story", "--help"], "defaults to story"],
      [["story", "add", "--help"], "Add a story, task, or spike in the backlog."],
      [["story", "add", "DEMO-001", "--help"], "Add a story, task, or spike in the backlog."],
      [["--help", "story", "start"], "resume a blocked item"],
      [["story", "block", "--help"], "--reason is required"],
      [["story", "complete", "--help"], 'stores acceptance "manual"'],
    ];
    await withClean(async (cwd) => {
      for (const [args, phrase] of cases) {
        const result = await runCli(args, cwd);
        assert.equal(result.code, 0, args.join(" "));
        assert.equal(result.stderr, "", args.join(" "));
        assert.match(result.stdout, /Completion is a manual record, not gate acceptance\./u, args.join(" "));
        assert.match(result.stdout, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")), args.join(" "));
      }
    });
  });

  test("version prints the package version, including when other arguments are present", async () => {
    await withClean(async (cwd) => {
      for (const args of [["--version"], ["-v"], ["init", "--version"], ["--version", "story", "add"]]) {
        const result = await runCli(args, cwd);
        assert.equal(result.code, 0, args.join(" "));
        assert.equal(result.stdout, `${versionLine}\n`, args.join(" "));
        assert.equal(result.stderr, "", args.join(" "));
      }
    });
  });

  test("genuine unknown commands fail with the unknown-command error", async () => {
    const cases: readonly (readonly [readonly string[], string])[] = [
      [["task"], "task"],
      [["spike"], "spike"],
      [["nope"], "nope"],
      [["story", "resume"], "story resume"],
      [["story", "cancel"], "story cancel"],
      [["story", "set"], "story set"],
      [["--help", "task"], "task"],
      [["story", "resume", "--help"], "story resume"],
      [["nope", "--help", "--version"], "nope"],
    ];
    await withClean(async (cwd) => {
      for (const [args, words] of cases) {
        const result = await runCli(args, cwd);
        expectErr(result, 1, unknown(words));
      }
    });
  });

  test("option errors stay on stderr and do not create a root", async () => {
    await withClean(async (cwd) => {
      const missing = join(cwd, "missing root");
      const cases: readonly (readonly [readonly string[], string])[] = [
        [["--json"], "error: unknown option: --json\n"],
        [["--version", "--json"], "error: unknown option: --json\n"],
        [["init", "--json"], "error: unknown option: --json\n"],
        [["nope", "--json"], "error: unknown option: --json\n"],
        [["-q"], "error: unknown option: -q\n"],
        [["--help=yes"], "error: invalid option: --help\n"],
        [["status", "--json=true"], "error: invalid option: --json\n"],
        [["--root"], "error: missing required argument: --root\n"],
        [["--root", "a", "--root", "b"], "error: duplicate option: --root\n"],
        [["-h", "--help"], "error: duplicate option: --help\n"],
        [["--root", missing, "init"], "error: root does not exist\n"],
      ];
      for (const [args, stderr] of cases) {
        const result = await runCli(args, cwd);
        expectErr(result, 1, stderr);
      }
      assert.equal(existsSync(missing), false);
    });
  });

  test("the repository root gains no ledger directory", () => {
    assert.equal(existsSync(join(repoRoot, ".braid")), false);
    assert.equal(existsSync(join(repoRoot, ".crew")), false);
  });
});
