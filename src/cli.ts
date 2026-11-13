#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { FormatError } from "./braids/frontmatter.js";
import { findRoot } from "./braids/store.js";
import { listBraids, UsageError, viewItem } from "./commands/braids.js";

export function readVersion(): string {
  const path = fileURLToPath(new URL("../package.json", import.meta.url));
  const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("version" in parsed) ||
    typeof parsed.version !== "string"
  ) {
    throw new Error("package.json version is missing");
  }
  return parsed.version;
}

export function helpText(version: string): string {
  return [
    `braid ${version}`,
    "",
    "Usage: braid <command>",
    "",
    "Commands:",
    "  list       List braids and their strands in run order",
    "  view <id>  Show a braid (0002) or a strand (0002/A)",
    "  help       Show this help",
    "",
    "Options:",
    "  --version  Print the version",
    "  --help     Show this help",
    "",
  ].join("\n");
}

export interface Output {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
}

function fail(code: number, message: string): Output {
  return { code, stdout: "", stderr: `error: ${message}
` };
}

function braidsCommand(command: string, args: readonly string[], cwd: string): Output {
  const root = findRoot(cwd);
  try {
    if (command === "list") {
      if (args.length > 0) {
        throw new UsageError(`braid list takes no arguments; got: ${args.join(" ")}`);
      }
      return { code: 0, stdout: listBraids(root), stderr: "" };
    }
    if (args.length > 1) {
      throw new UsageError(`braid view takes one id; got: ${args.join(" ")}`);
    }
    return { code: 0, stdout: viewItem(root, args[0]), stderr: "" };
  } catch (error) {
    if (error instanceof UsageError) {
      return fail(1, error.message);
    }
    if (error instanceof FormatError) {
      return fail(2, `${error.file}: ${error.message}`);
    }
    throw error;
  }
}

export function run(argv: readonly string[], cwd: string = process.cwd()): Output {
  const [first, ...rest] = argv;
  if (first === "--version") {
    return { code: 0, stdout: `braid ${readVersion()}\n`, stderr: "" };
  }
  if (first === undefined || first === "help" || first === "--help") {
    return { code: 0, stdout: helpText(readVersion()), stderr: "" };
  }
  if (first === "list" || first === "view") {
    return braidsCommand(first, rest, cwd);
  }
  return { code: 1, stdout: "", stderr: `error: unknown command: ${first}\nRun braid help.\n` };
}

try {
  const out = run(process.argv.slice(2));
  process.stdout.write(out.stdout);
  process.stderr.write(out.stderr);
  process.exitCode = out.code;
} catch {
  process.stderr.write("error: unexpected failure\n");
  process.exitCode = 5;
}
