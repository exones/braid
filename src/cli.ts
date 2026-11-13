#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { FormatError } from "./braids/frontmatter.js";
import { findRoot } from "./braids/store.js";
import { GitError } from "./braids/numbers.js";
import { listBraids, UsageError, viewItem } from "./commands/braids.js";
import { editItem, newBraid, newStrand, setBriefSection } from "./commands/edit.js";

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
    "  list                        List braids and their strands in run order",
    "  view <id>                   Show a braid (0002) or a strand (0002/A)",
    "  new <title>                 Create a braid with the next free number",
    "  strand new <braid> <title>  Create a strand with the next free letter",
    "  edit <id>                   Change --status, --title, --labels, --dep, --order, --delivery",
    "  brief <id> <section>        Set a section of brief.md from --file <path>, --file - or --text",
    "  help                        Show this help",
    "",
    "Options:",
    "  --version                   Print the version",
    "  --help                      Show this help",
    "",
    "new and strand new also take --status, --labels, --dep, --order, --delivery (braids),",
    "--slug, and --no-fetch (skip git fetch before choosing the number or letter).",
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

const BRAID_COMMANDS = new Set(["list", "view", "new", "strand", "edit", "brief"]);

function dispatch(command: string, args: readonly string[], cwd: string, root: string): string {
  switch (command) {
    case "list":
      if (args.length > 0) {
        throw new UsageError(`braid list takes no arguments; got: ${args.join(" ")}`);
      }
      return listBraids(root);
    case "view":
      if (args.length > 1) {
        throw new UsageError(`braid view takes one id; got: ${args.join(" ")}`);
      }
      return viewItem(root, args[0]);
    case "new":
      return newBraid(root, args);
    case "strand": {
      const [sub, ...rest] = args;
      if (sub !== "new") {
        throw new UsageError("usage: braid strand new <braid> <title>");
      }
      return newStrand(root, rest);
    }
    case "edit":
      return editItem(root, args);
    default:
      return setBriefSection(root, cwd, args);
  }
}

function braidsCommand(command: string, args: readonly string[], cwd: string): Output {
  const root = findRoot(cwd);
  try {
    return { code: 0, stdout: dispatch(command, args, cwd, root), stderr: "" };
  } catch (error) {
    if (error instanceof UsageError || error instanceof GitError) {
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
  if (BRAID_COMMANDS.has(first)) {
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
