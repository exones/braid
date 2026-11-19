#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { FormatError } from "./braids/frontmatter.js";
import { findRoot } from "./braids/store.js";
import { checkBraids } from "./braids/check.js";
import { runBoard } from "./commands/board.js";
import { GitError } from "./braids/numbers.js";
import { LockError } from "./braids/requests.js";
import { listBraids, listOpen, titleCommand, UsageError, viewItem } from "./commands/braids.js";
import { ImportRefusal, importBacklog } from "./backlog/import.js";
import { logEntry, reportItem } from "./commands/logs.js";
import { nextCommand, statusCommand } from "./commands/coordinate.js";
import { cleanCommand } from "./commands/clean.js";
import { startCommand } from "./commands/start.js";
import { acceptCommand } from "./commands/done.js";
import { factsCommand, recapCommand } from "./commands/facts.js";
import { answerCommand, askCommand, handoverCommand, requestsCommand, reviewCommand } from "./commands/requests.js";
import { inboxCommand, noteCommand, type Said } from "./commands/inbox.js";
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
    "  list [--open]               List braids and their strands in run order; --open: every unfinished braid on any branch, with its goal (--no-fetch)",
    "  view <id> [--links]         Show a braid (0002) or a strand (0002/A); --links adds the open braids that link to a braid",
    "  new <title>                 Create a braid with the next free number",
    "  strand new <braid> <title>  Create a strand with the next free letter",
    "  title <id> --role <role>    Print the thread title for an item: <emoji> <repo> <id> <role>: <title> (role coordinator, worker, review or research)",
    "  edit <id>                   Change --status, --title, --labels, --dep, --related, --order, --delivery (none clears a list or the order)",
    "  brief <id> <section>        Set a section of brief.md from --file <path>, --file - or --text",
    "  log <id> <text>             Append an entry to this thread's log and git add it (--thread, --checkpoint, --file)",
    "  report <id>                 Write report.md from --file <path>, --file - or --text (--append adds)",
    "  import-backlog              Turn backlog/ tasks into braids/ (--dry-run: print only; backlog/ is never touched)",
    "  check                       Check every brief under braids/; list each error with its file (exit 2 on any)",
    "  status <number>             One line per strand: status, lane (as the board shows it), ask:<key>, branch, PR, ci checks, T3 thread, and the request text of an item on your side (reads GitHub and T3, no fetch)",
    "  next <number>               The next strand to run, or why none is ready",
    "  start <id> [--force]        Create the strand branch from its braid branch, push it, add a worktree (--force: skip the ready check)",
    "  review <id> --thread <id>   Run by a reviewer from its checkout: record its thread, folder and branch; the board and status show the review while it runs, clean removes the checkout after the merge",
    "  accept <id> [--head <sha>] [--merge]  Accept an item and mark it Done after checks: a strand on the braid branch after its merge (--merge merges the reviewed head first), a story or final PR on its branch (--log adds a braid log entry, --review <url> names the review comment; the acceptance is also posted on the PR). `braid done` is the old name",
    "  facts <pr>                  The stop-case diff facts of a PR (dependency, process, deleted tests, skip markers, size), each with its case",
    "  recap <id>                  A draft recap and braid log line from report.md, the PR (head, checks) and the facts, to edit",
    "  handover <id> --head <sha>  Open a review request after checking the PR is open, at that head and green; prints the recap draft (--thread)",
    "  ask <id> <text>             Open a request for what the coordinator needs from you (--kind question|decision|plan, --key <stop case>, --thread, --file -)",
    "  answer <id>                 Close the item's request (--log <file>|- adds your decision to the braid log; --thread)",
    "  requests                    List the open requests: item, kind, age, text",
    "  note <text> --from <source>  Capture a leftover on the braid-inbox branch and push it (source: 0012/A, review 0012/A, PR #12 or user; --ref <url> repeats; --file -)",
    "  note --idea <text>          Capture an idea on the braid-inbox branch and push it (from: user unless --from; --file -)",
    "  inbox                       List the open inbox entries: kind, id, age, source, passed, title (--leftovers, --ideas, --all adds taken and dropped, --no-fetch)",
    "  inbox show <id>             Print one inbox entry in full, with the item folder its source names",
    "  inbox take <entry>... --into <braid id>[,<braid id>...]  Mark entries taken into braids (one commit on braid-inbox)",
    "  inbox pass <leftover>...    Pass leftovers over in a sweep: passed + 1; at 2 the leftover is dropped (an idea is refused)",
    "  inbox drop <entry>... --why <reason>  Drop entries with a reason",
    "  inbox reopen <entry>        Bring a dropped or taken entry back to open (why and into removed, passed 0)",
    "  clean [<number>|<id>] [--yes]  Remove worktrees and local branches of merged items (a dry run without --yes; never forces)",
    "  board                       Open the board in the browser (--no-open: only print the address; --demo: sample data; --host tailscale: also on this machine's Tailscale address, for its owner only; --port <n>: both listeners on that port)",
    "  help                        Show this help",
    "",
    "Options:",
    "  --version                   Print the version",
    "  --help                      Show this help",
    "",
    "new and strand new also take --status, --labels, --dep, --order, --related and --delivery (braids),",
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

const BRAID_COMMANDS = new Set(["review", "note", "inbox", "ask", "answer", "requests", "import-backlog", "check", "list", "view", "new", "strand", "edit", "brief", "log", "report", "title"]);

function dispatch(command: string, args: readonly string[], cwd: string, root: string): string | Said {
  switch (command) {
    case "review":
      return reviewCommand(root, cwd, args);
    case "note":
      return noteCommand(root, cwd, args);
    case "inbox":
      return inboxCommand(root, args);
    case "ask":
      return askCommand(root, args);
    case "answer":
      return answerCommand(root, cwd, args);
    case "requests":
      return requestsCommand(root, args);
    case "check": {
      if (args.length > 0) {
        throw new UsageError(`braid check takes no arguments; got: ${args.join(" ")}`);
      }
      const result = checkBraids(root);
      const warnings = result.warnings.map((w) => `warning: ${w}\n`).join("");
      if (result.errors.length > 0) {
        throw new CheckError(result.errors, warnings);
      }
      return { stdout: `braids OK: ${result.braids} braids, ${result.strands} strands\n`, stderr: warnings };
    }
    case "import-backlog": {
      const extra = args.filter((a) => a !== "--dry-run");
      if (extra.length > 0) {
        throw new UsageError(`braid import-backlog takes only --dry-run; got: ${extra.join(" ")}`);
      }
      return importBacklog(root, args.includes("--dry-run"));
    }
    case "list":
      if (args.includes("--open")) {
        const extra = args.filter((a) => a !== "--open" && a !== "--no-fetch");
        if (extra.length > 0) {
          throw new UsageError(`braid list --open takes only --no-fetch; got: ${extra.join(" ")}`);
        }
        return listOpen(root, !args.includes("--no-fetch"));
      }
      if (args.length > 0) {
        throw new UsageError(`braid list takes no arguments; got: ${args.join(" ")}`);
      }
      return listBraids(root);
    case "view": {
      const ids = args.filter((a) => a !== "--links");
      if (ids.length > 1) {
        throw new UsageError(`braid view takes one id; got: ${args.join(" ")}`);
      }
      return viewItem(root, ids[0], args.includes("--links"));
    }
    case "new":
      return newBraid(root, args);
    case "strand": {
      const [sub, ...rest] = args;
      if (sub !== "new") {
        throw new UsageError("usage: braid strand new <braid> <title>");
      }
      return newStrand(root, rest);
    }
    case "title":
      return titleCommand(root, args);
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
  constructor(
    readonly errors: readonly string[],
    readonly warnings = "",
  ) {
    super(errors.join("\n"));
  }
}

function braidsCommand(command: string, args: readonly string[], cwd: string): Output {
  const root = findRoot(cwd);
  try {
    const out = dispatch(command, args, cwd, root);
    return typeof out === "string" ? { code: 0, stdout: out, stderr: "" } : { code: 0, ...out };
  } catch (error) {
    if (error instanceof UsageError || error instanceof GitError || error instanceof LockError) {
      return fail(1, error.message);
    }
    if (error instanceof ImportRefusal) {
      return { code: error.code, stdout: "", stderr: error.problems.map((p) => `error: ${p}
`).join("") };
    }
    if (error instanceof CheckError) {
      return { code: 2, stdout: "", stderr: `${error.warnings}${error.errors.join("\n")}
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
  if (argv[0] === "status" || argv[0] === "next" || argv[0] === "start" || argv[0] === "clean" || argv[0] === "accept" || argv[0] === "done" || argv[0] === "facts" || argv[0] === "recap" || argv[0] === "handover") {
    try {
      const run = argv[0] === "status" ? statusCommand : argv[0] === "next" ? nextCommand : argv[0] === "start" ? startCommand : argv[0] === "accept" || argv[0] === "done" ? acceptCommand : argv[0] === "facts" ? factsCommand : argv[0] === "recap" ? recapCommand : argv[0] === "handover" ? handoverCommand : cleanCommand;
      if (argv[0] === "done") {
        process.stderr.write("braid done is now braid accept; running braid accept\n");
      }
      process.stdout.write(await run(findRoot(process.cwd()), argv.slice(1)));
    } catch (error) {
      if (error instanceof UsageError || error instanceof GitError) {
        process.stderr.write(`error: ${error.message}
`);
        process.exitCode = 1;
        return;
      }
      if (error instanceof FormatError) {
        process.stderr.write(`error: ${error.file}: ${error.message}
`);
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
