#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parsePlan } from "./braids/plan.js";
import { FormatError } from "./braids/frontmatter.js";
import { findRoot } from "./braids/store.js";
import { checkBraids } from "./braids/check.js";
import { boardUrl, runBoard } from "./commands/board.js";
import { serviceCommand } from "./commands/service.js";
import { notifyCommand } from "./commands/notify.js";
import { projectsCommand } from "./commands/projects.js";
import { ProjectsFileError } from "./projects/list.js";
import { GitError } from "./braids/numbers.js";
import { LockError } from "./braids/requests.js";
import { listBraids, listOpen, titleCommand, UsageError, viewItem } from "./commands/braids.js";
import { ImportRefusal, importBacklog } from "./backlog/import.js";
import { logEntry, reportItem } from "./commands/logs.js";
import { nextCommand, statusCommand } from "./commands/coordinate.js";
import { cleanCommand } from "./commands/clean.js";
import { startCommand } from "./commands/start.js";
import { launchCommand } from "./commands/launch.js";
import { acceptCommand } from "./commands/done.js";
import { waitCommand } from "./commands/wait.js";
import { factsCommand, recapCommand } from "./commands/facts.js";
import { answerCommand, askCommand, etaCommand, forwardCommand, handoverCommand, requestsCommand, reviewCommand, withdrawCommand } from "./commands/requests.js";
import { inboxCommand, noteCommand, type Said } from "./commands/inbox.js";
import { autonomyCommand } from "./commands/autonomy.js";
import { limitsCommand } from "./commands/limits.js";
import { pauseCommand, resumeCommand, resumeLimitCommand } from "./commands/pauses.js";
import { decisionsCommand } from "./commands/decisions.js";
import { editItem, newBraid, newStrand, setBriefSection } from "./commands/edit.js";
import { readVersion } from "./version.js";

export { readVersion };

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
    "  edit <id>                   Change --status, --title, --labels, --dep, --related, --order, --delivery, --autonomy (none clears a list, the order or the preset)",
    "  autonomy <number>           Print the autonomy preset a braid runs on, where its name and text come from, and the brief's ## Autonomy section (--list: the presets available here)",
    "  limits [<instance>]         Whether an agent may be launched on each provider in BRAID.md models, from T3's usage caches: windows, usage, verdict ok|pause|unknown, for pause the resume time (--role <role> [--tier <T>] [--kind <k>] narrows, e.g. --role worker --kind story; --json; exit 3 on pause)",
    "  pause <number> --provider <instance> --thread <id>  Record that a braid waits for a provider's usage window in .braid/pauses.json: window, usage and resume time from braid limits (refused unless its verdict is pause; --window <id> picks the window, --until <iso> sets the resume time and pauses anyway), --task <id> the scheduled resume task, --by coordinator|pm|board; refused on a held braid. The board and status show it",
    "  pause <number> --hold \"<words>\" --thread <id>  Record a deliberate hold (yours or the PM's): no provider, no resume time, never stalled; shows paused with your words until braid resume (--by coordinator|pm)",
    "  resume <number>             Clear a braid's pause and print what was cleared; --limit resumes a limit pause only, never a hold: the board's record is cleared and each paused agent gets its resume text by code (a send that fails stays pending and the board retries it); --limit --all: every board pause of the repository, a PM-run braid by one message to its PM",
    "  brief <id> <section>       Set a section of brief.md from --file <path>, --file - or --text",
    "  log <id> <text>             Append an entry to this thread's log and git add it (--thread, --checkpoint, --file)",
    "  report <id>                 Write report.md from --file <path>, --file - or --text (--append adds)",
    "  import-backlog              Turn backlog/ tasks into braids/ (--dry-run: print only; backlog/ is never touched)",
    "  check                       Check every brief under braids/; list each error with its file (exit 2 on any). --plan <file>: check a programme's plan file (pm/<slug>.md) instead; an error names its line",
    "  status <number>             One line per strand: status, lane (as the board shows it), ask:<key>, branch, PR, ci checks, T3 thread, and the request text of an item on your side (reads GitHub and T3, no fetch)",
    "  next <number>               The next strand to run, or why none is ready",
    "  start <id> [--force] [--no-worktree] [--thread <id>]  Create the strand branch from its braid branch, push it, add a worktree, and record the start on braid-requests (--no-worktree: only the branch, pushed and recorded, no worktree; --force: skip the ready check; --thread: the coordinator's thread)",
    "  launch <id> --role worker|review|research  Prepare one subagent launch and print the delegate_task input as JSON: the role's limits check (exit 3 on pause, nothing started), for a worker the item branch pushed with no worktree and the start recorded, the model from BRAID.md models by tier and kind, the title and the first message (--thread: the coordinator's thread; review: --pr <n> [--focus <text>]; research: --question <text>). With --child <thread id> it records the child delegate_task returned, with its role, as braid review does",
    "  review <id> --thread <id>   Record a reviewer subagent's thread with the folder and branch T3 gives for it: the board and status show the review while it runs, clean removes that checkout after the merge. A checkout that is the main one, yours, the thread's parent's or another recorded thread's is not recorded: clean keeps it and says why",
    "  decisions <number> [--since <date or sha>]  List the Decided: log entries of a braid and its strands and their requests, waits aside, answered by you or the PM (from braid-requests), oldest first",
    "  accept <id> [--head <sha>] [--merge [--preset]]  Accept an item after checks: records the acceptance on braid-requests and commits nothing on the PR's branch; the item is Done once its PR merged. A strand after its merge (--merge merges the reviewed head first; --preset makes it a merge under the braid's autonomy preset, refused unless the preset's merge value allows this PR; the BRAID.md merge-gate command, if any, runs last and a non-zero exit refuses the merge; --log adds a braid log entry on the braid branch), a story or final PR at its reviewed head (--merge merges that head; --review <url> names the review comment; the acceptance is also posted on the PR). `braid done` is the old name",
    "  wait <number> [--timeout <minutes>]  Wait for the braid branch's CI (reads only): each check is answered by the newest commit from the tip down to the newest one outside braids/ and epics/ that has a run for it (else a merge commit's second parent), and a cancelled run stays pending while a newer commit may still run it: exit 0 green, 1 a ci check failed, 2 no run within 5 minutes or an error, with ci: all every reported check is waited for after a 2-minute start grace, 3 still running when --timeout (minutes, default 30) is up: call again",
    "  facts <pr>                  The stop-case diff facts of a PR (dependency, process, deleted tests, skip markers, size), each with its case, and the BRAID.md merge-gate, if any, with whether it runs on this PR's merge",
    "  recap <id>                  A draft recap and braid log line from report.md, the Decided: entries and answered requests, the PR (head, checks) and the facts, to edit",
    "  handover <id> --head <sha>  Open a review request after checking the PR is open, at that head and green; prints its name (yellow-bear-7f3k) and the recap draft (--thread, --to pm)",
    "  ask <id> <text>             Open a request for what the coordinator needs from you and print its name (yellow-bear-7f3k: two words to say aloud and the four characters of its code q-7f3k) (--kind question|decision|plan|action|look (look: a look request or an FYI, blocking nothing), --option <text> repeated for the likely answers A to D, --context <text> or --context-file <file>|- (Markdown, at most 4000 characters), --key <stop case>, --thread, --file -; prints what it unblocks and decide|do|merge|look; --to pm: the PM answers first, from the braid's PM-run line; --to <braid number>: another braid's coordinator, reminded hourly by the running board; --to self --done-when time:<iso>: a timed wait, nobody asked: the card shows Waiting until <time>, no push, no stall until then, the board's wake ends it; --done-when answered|pr:<n>|braid:<number>|time:<iso>: met when that PR merges, that braid is Done on origin/<main>, that time comes; the running board then wakes the asking thread once). A question replaces its asker's question on the item, a wait its wait to that braid. Finds the item on any branch, on origin/<main> or in the record. The PM's own: --by pm on a braid, or ask pm/<slug> for the programme (--kind action: something only you can do, a coordinator may open one too); a PM request shows in Needs You, is pushed and opens the PM thread",
    "  forward <id>                The PM hands a request addressed to it on to you: it reaches you as the PM's ask (the programme's Needs you; a braid with no programme: its card's Needs You, a handover To Review) and is pushed, opening the PM's thread (the merges one PM forwards are one push listing them), at once or, while the braid is paused or held, after braid resume (--note <text>); a wait to another braid is never forwarded",
    "  answer <name>|<id> [<answer>]  Record the answer on braid-requests, never on a braid branch: the text after the name or from --file <file>|- (--log is the same), a lone letter of a stored option (A, any case) recorded as that option, who answered (--from user, the default, or --from pm --reason <why>); a wait (to a braid, or timed) takes no --from: met, by the coordinator, when its condition holds now, else refused (done when answered: answered by the coordinator); an answer recorded outside the asking thread (the PM's, or yours that the PM records) makes the running board wake that thread once with it; an id acts on its one open request: with both askers' open it needs the name or --by coordinator|pm (pm/<slug>: the PM's), with a question and a wait open it names both and needs the name. An already closed request is refused",
    "  withdraw <name>|<id> --why <reason>  Withdraw a request no longer needed; it stays on the record as withdrawn with the reason (an id as for answer: --by coordinator|pm, the name when a question and a wait are open)",
    "  eta <name> <duration|time> [<why>]  The addressee of an open request (another braid's coordinator; the PM for a request to the PM, or with --by pm) says when it expects to get to it: a duration (2h, 90m, 1h30m, 2d) or a time (16:30, today or tomorrow; 2026-11-24T09:00); sets its estimate and records an eta event with the why; a later call moves it; refused on a closed request. The running board reminds no sooner, and reads the wait as stalled once it passes",
    "  requests [<name>]           List the open requests on braid-requests: name, item, kind, age, what it blocks and decide|do|merge|look, who asks or whom it is for, done when, expected by, text, its options as A. lines and whether context is stored; with a name (yellow-bear-7f3k, yellow bear 7f3k, 7f3k or q-7f3k in any case; yellow bear alone for an open one): that request's whole history (each event's time, who and text); --closed [--since <YYYY-MM-DD>]: the closed ones, newest first, with state, who closed them and the answer",
    "  note <text> --from <source>  Capture a leftover on the braid-inbox branch and push it (source: 0012/A, review 0012/A, PR #12 or user; --ref <url> repeats; --file -)",
    "  note --idea <text>          Capture an idea on the braid-inbox branch and push it (from: user unless --from; --file -)",
    "  inbox                       List the open inbox entries: kind, id, age, source, passed, title (--leftovers, --ideas, --all adds taken and dropped, --no-fetch)",
    "  inbox show <id>             Print one inbox entry in full, with the item folder its source names",
    "  inbox take <entry>... --into <braid id>[,<braid id>...]  Mark entries taken into braids (one commit on braid-inbox)",
    "  inbox pass <leftover>...    Pass leftovers over in a sweep: passed + 1; at 2 the leftover is dropped (an idea is refused)",
    "  inbox drop <entry>... --why <reason>  Drop entries with a reason",
    "  inbox reopen <entry>        Bring a dropped or taken entry back to open (why and into removed, passed 0)",
    "  clean [<number>|<id>] [--yes]  Remove worktrees and local branches of merged items (a dry run without --yes; forces only a recorded subagent's t3/ branch whose tip is the PR head or on origin; keeps what the main checkout, this one or a running thread uses)",
    "  board                       Open the board in the browser (--no-open: only print the address; --no-pause: show the limits but don't pause or resume agents, and turn off the wake of a request whose done-when holds, with its reminders and nudges; --demo: sample data, never pauses, --demo-not-ready: a project with problems; --host tailscale: also on this machine's Tailscale address, for its owner only; --port <n>: both listeners on that port; --url [--port <n>]: print the running board's address with its token, from ~/.braid/board-<port>.url, or say that none runs; --service: the run of the task below)",
    "  board service <sub>         Windows: the board as a Task Scheduler task of yours, started at logon, again every 5 minutes if it stopped, no window: install [--port <n>, default 8765] [--host tailscale] (from your checkout), remove, restart [--if-installed: nothing when no task], status (state, last result (the previous run's while it runs, shown as previous run:), port, address, the running board's version against this one, the acting leases it and other boards hold, its log ~/.braid/board-<port>.log); elsewhere it points to the systemd recipe in docs/board.md",
    "  notify [setup|test|off]     Phone pushes from the running board over ntfy: setup [--topic <t>] [--server <url>] [--new-topic] once per machine, test sends a push, then one it clears, off stops them; alone: the state (token only from BRAID_NTFY_TOKEN)",
    "  notify send <line> --thread <id>  The PM's own push, sent at once without the board: the line (200 characters at most), opening the thread (--programme <slug>; a newer line of a programme replaces the older; off or not set up: says why, exit 0)",
    "  projects add [<path>]       Add a project to this machine's list in ~/.braid/projects.json (its main checkout; --name <n>, --port <n>) and print its readiness",
    "  projects remove <name>      Remove a project from the list",
    "  projects list               Each listed project: name, path, port and readiness (GitHub not checked)",
    "  help                        Show this help",
    "",
    "Options:",
    "  --version                   Print the version",
    "  --help                      Show this help",
    "",
    "new and strand new also take --status, --labels, --dep, --order, --related, --delivery and --autonomy (braids),",
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

const BRAID_COMMANDS = new Set(["autonomy", "limits", "pause", "resume", "decisions", "note", "inbox", "ask", "answer", "withdraw", "forward", "eta", "requests", "import-backlog", "check", "list", "view", "new", "strand", "edit", "brief", "log", "report", "title"]);

function dispatch(command: string, args: readonly string[], cwd: string, root: string): string | Said {
  switch (command) {
    case "autonomy":
      return autonomyCommand(root, args);
    case "limits":
      return limitsCommand(root, args);
    case "pause":
      return pauseCommand(root, args);
    case "resume":
      return resumeCommand(root, args);
    case "decisions":
      return decisionsCommand(root, args);
    case "note":
      return noteCommand(root, cwd, args);
    case "inbox":
      return inboxCommand(root, args);
    case "ask":
      return askCommand(root, args);
    case "answer":
      return answerCommand(root, cwd, args);
    case "withdraw":
      return withdrawCommand(root, args);
    case "forward":
      return forwardCommand(root, args);
    case "requests":
      return requestsCommand(root, args);
    case "eta":
      return etaCommand(root, args);
    case "check": {
      if (args[0] === "--plan") {
        if (args.length !== 2) {
          throw new UsageError("usage: braid check --plan <file>");
        }
        const file = resolve(cwd, args[1] ?? "");
        let text: string;
        try {
          text = readFileSync(file, "utf8");
        } catch {
          throw new UsageError(`braid check --plan: can't read ${args[1] ?? ""}`);
        }
        const plan = parsePlan(text, args[1] ?? "");
        return `plan OK: pm/${plan.programme}, ${plan.state}, ${plan.rows.length} row${plan.rows.length === 1 ? "" : "s"}
`;
      }
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

/** `braid board --help`: the board's lines of the help. */
export const boardHelp = (version: string): string => `${helpText(version).split("\n").filter((line) => /^ {2}board( |$)/.test(line)).join("\n")}\n`;

async function main(argv: readonly string[]): Promise<void> {
  if (argv[0] === "board") {
    if (argv.includes("--help")) {
      process.stdout.write(boardHelp(readVersion()));
      return;
    }
    try {
      if (argv[1] === "service") {
        const out = await serviceCommand(argv.slice(2));
        process.stdout.write(out.stdout);
        process.stderr.write(out.stderr);
        process.exitCode = out.code;
        return;
      }
      if (argv.includes("--url")) {
        const out = await boardUrl(argv.slice(1));
        process.stdout.write(out.stdout);
        process.stderr.write(out.stderr);
        process.exitCode = out.code;
        return;
      }
      // The demo reads no repository, so it does not look for one.
      await runBoard(argv.includes("--demo") || argv.includes("--demo-t3-down") || argv.includes("--demo-not-ready") ? process.cwd() : findRoot(process.cwd()), argv.slice(1));
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
      if (error instanceof ProjectsFileError) {
        process.stderr.write(`error: ${error.message}\n`);
        process.exitCode = 2;
        return;
      }
      throw error;
    }
    return;
  }
  if (argv[0] === "wait") {
    // The exit code is the answer, so an error is 2 (no answer), never 1 (CI failed).
    try {
      const out = await waitCommand(findRoot(process.cwd()), argv.slice(1));
      process.stdout.write(out.stdout);
      process.exitCode = out.code;
    } catch (error) {
      if (error instanceof UsageError || error instanceof GitError || error instanceof FormatError) {
        process.stderr.write(`error: ${error instanceof FormatError ? `${error.file}: ` : ""}${error.message}
`);
        process.exitCode = 2;
        return;
      }
      throw error;
    }
    return;
  }
  if (argv[0] === "notify") {
    try {
      process.stdout.write(await notifyCommand(argv.slice(1)));
    } catch (error) {
      if (error instanceof UsageError) {
        process.stderr.write(`error: ${error.message}
`);
        process.exitCode = 1;
        return;
      }
      throw error;
    }
    return;
  }
  if (argv[0] === "projects") {
    try {
      const out = projectsCommand(argv.slice(1));
      process.stdout.write(out.stdout);
      process.stderr.write(out.stderr);
    } catch (error) {
      if (error instanceof UsageError || error instanceof LockError || error instanceof ProjectsFileError) {
        process.stderr.write(`error: ${error.message}
`);
        process.exitCode = error instanceof ProjectsFileError ? 2 : 1;
        return;
      }
      throw error;
    }
    return;
  }
  if (argv[0] === "launch") {
    try {
      const out = await launchCommand(findRoot(process.cwd()), argv.slice(1));
      process.stdout.write(out.stdout);
      process.stderr.write(out.stderr);
      process.exitCode = out.code;
    } catch (error) {
      if (error instanceof UsageError || error instanceof GitError) {
        process.stderr.write(`error: ${error.message}
`);
        process.exitCode = 1;
        return;
      }
      throw error;
    }
    return;
  }
  if (argv[0] === "status" || argv[0] === "next" || argv[0] === "start" || argv[0] === "clean" || argv[0] === "accept" || argv[0] === "done" || argv[0] === "facts" || argv[0] === "recap" || argv[0] === "handover" || argv[0] === "review") {
    try {
      const run = argv[0] === "status" ? statusCommand : argv[0] === "next" ? nextCommand : argv[0] === "start" ? startCommand : argv[0] === "accept" || argv[0] === "done" ? acceptCommand : argv[0] === "facts" ? factsCommand : argv[0] === "recap" ? recapCommand : argv[0] === "handover" ? handoverCommand : argv[0] === "review" ? reviewCommand : cleanCommand;
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
  if (argv[0] === "resume" && argv.includes("--limit")) {
    // The board's resume path (0074/D): it sends by `t3`, so it runs here, not in the synchronous dispatch.
    try {
      process.stdout.write(await resumeLimitCommand(findRoot(process.cwd()), argv.slice(1)));
    } catch (error) {
      if (error instanceof UsageError || error instanceof GitError || error instanceof LockError) {
        process.stderr.write(`error: ${error.message}
`);
        process.exitCode = 1;
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
