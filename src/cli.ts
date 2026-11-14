#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { FormatError } from "./braids/frontmatter.js";
import { findRoot } from "./braids/store.js";
import { checkBraids } from "./braids/check.js";
import { runBoard } from "./commands/board.js";
import { GitError } from "./braids/numbers.js";
import { listBraids, UsageError, viewItem } from "./commands/braids.js";
import { ImportRefusal, importBacklog } from "./backlog/import.js";
import { logEntry, reportItem } from "./commands/logs.js";
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
    "  log <id> <text>             Append an entry to this thread's log and git add it (--thread, --checkpoint, --file)",
    "  report <id>                 Write report.md from --file <path>, --file - or --text (--append adds)",
    "  import-backlog              Turn backlog/ tasks into braids/ (--dry-run: print only; backlog/ is never touched)",
    "  check                       Check every brief under braids/; list each error with its file (exit 2 on any)",
    "  board                       Open the read-only board in the browser (--no-open: only print the address; --demo: sample data)",
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

const BRAID_COMMANDS = new Set(["import-backlog", "check", "list", "view", "new", "strand", "edit", "brief", "log", "report"]);

function dispatch(command: string, args: readonly string[], cwd: string, root: string): string {
  switch (command) {
    case "check": {
      if (args.length > 0) {
        throw new UsageError(`braid check takes no arguments; got: ${args.join(" ")}`);
      }
      const result = checkBraids(root);
      if (result.errors.length > 0) {
        throw new CheckError(result.errors);
      }
      return `braids OK: ${result.braids} braids, ${result.strands} strands\n`;
    }
    case "import-backlog": {
      const extra = args.filter((a) => a !== "--dry-run");
      if (extra.length > 0) {
        throw new UsageError(`braid import-backlog takes only --dry-run; got: ${extra.join(" ")}`);
      }
      return importBacklog(root, args.includes("--dry-run"));
    }
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
    case "log":
      return logEntry(root, cwd, args);
    case "report":
      return reportItem(root, cwd, args);
    default:
      return setBriefSection(root, cwd, args);
  }
}

class CheckError extends Error {
  constructor(readonly errors: readonly string[]) {
    super(errors.join("\n"));
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
    if (error instanceof ImportRefusal) {
      return { code: error.code, stdout: "", stderr: error.problems.map((p) => `error: ${p}
`).join("") };
    }
    if (error instanceof CheckError) {
      return { code: 2, stdout: "", stderr: `${error.errors.join("\n")}
${error.errors.length} error${error.errors.length === 1 ? "" : "s"}
` };
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

async function main(argv: readonly string[]): Promise<void> {
  if (argv[0] === "board") {
    try {
      // The demo reads no repository, so it does not look for one.
      await runBoard(argv.includes("--demo") || argv.includes("--demo-t3-down") ? process.cwd() : findRoot(process.cwd()), argv.slice(1));
    } catch (error) {
      if (error instanceof UsageError) {
        process.stderr.write(`error: ${error.message}\n`);
        process.exitCode = 1;
        return;
      }
      if (error instanceof FormatError) {
        process.stderr.write(`error: ${error.file}: ${error.message}\n`);
        process.exitCode = 2;
        return;
      }
      throw error;
    }
    return;
  }
  const out = run(argv);
  process.stdout.write(out.stdout);
  process.stderr.write(out.stderr);
  process.exitCode = out.code;
}

try {
  await main(process.argv.slice(2));
} catch {
  process.stderr.write("error: unexpected failure\n");
  process.exitCode = 5;
}
