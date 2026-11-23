// `braid handover`, `braid ask`, `braid answer` and `braid requests`: the coordinator records that it
// needs the user (a request), and closes it again. The record is src/braids/requests.ts.
import { spawnSync } from "node:child_process";
import { threadShort } from "../braids/logs.js";
import { loadKnownBraids } from "../braids/branches.js";
import { fetchBranch } from "../braids/gitbranch.js";
import { age, askerOf, closeRequest, forwardRequest, KINDS, liveRequests, loadRecord, loadRequests, openRequest, programmeOf, REQUESTS, type Asker, type Kind, type PrNow, type Request } from "../braids/requests.js";
import { readGithub, runGh, type GhRunner } from "../board/github.js";
import { runT3, showThread, type T3Runner } from "../board/t3.js";
import { UsageError } from "./braids.js";
import { ciChecks } from "./coordinate.js";
import { checksProblem, view } from "./done.js";
import { find, parse, readText, str } from "./edit.js";
import { logEntry } from "./logs.js";
import { recordReview } from "../braids/reviews.js";
import { recapCommand } from "./facts.js";

/** A push that didn't happen: the request is on the local branch, and the next write pushes it. */
const warned = (warning: string | null): string => (warning === null ? "" : `warning: ${warning}\n`);

export interface RequestOptions {
  readonly gh?: GhRunner;
  /** The clock, for ages; replaced in tests. */
  readonly now?: () => Date;
}

function threadOf(values: Parameters<typeof str>[0]): string | null {
  const thread = str(values, "thread");
  if (threadShort(thread) === null) {
    throw new UsageError(`--thread needs an id with at least 8 letters or digits; got: ${thread ?? ""}`);
  }
  return thread ?? null;
}

/** The braid's exception line names its PM: `PM-run (thread <id>)`. */
const PM_RUN = /PM-run \(thread ([^\s)]+)\)/;

/** The PM's thread named by the braid's brief (`PM-run (thread <id>)`), or null. */
function pmOfBraid(root: string, id: string): string | null {
  const number = id.slice(0, 4);
  const braid = loadKnownBraids(root, number).find((b) => b.number === number);
  return braid === undefined ? null : (PM_RUN.exec(braid.brief.body)?.[1] ?? null);
}

/** `--to user|pm`: whom the request is for; `pm` needs the PM's thread from the braid's `PM-run (thread <id>)` line, and fails (opening nothing) without it. */
function addressee(root: string, values: Parameters<typeof str>[0], id: string): { to?: "pm"; pm?: string } {
  const to = str(values, "to");
  if (to === undefined || to === "user") {
    return {};
  }
  if (to !== "pm") {
    throw new UsageError(`--to is user or pm; got: ${to}`);
  }
  const number = id.slice(0, 4);
  const braid = loadKnownBraids(root, number).find((b) => b.number === number);
  const pm = braid === undefined ? null : (PM_RUN.exec(braid.brief.body)?.[1] ?? null);
  if (pm === null) {
    throw new UsageError(`${id} not opened: --to pm needs braid ${number}'s brief to have a "PM-run (thread <id>)" line, and it has none; nothing changed`);
  }
  return { to: "pm", pm };
}

/** The item's id (`0015` or `0015/C`), checked against the braids `braid view` finds: this checkout's and those that live only on their branch. */
function itemId(root: string, raw: string | undefined, command: string): string {
  const number = raw === undefined ? undefined : /^(\d{1,4})(?:\/|$)/.exec(raw)?.[1]?.padStart(4, "0");
  const { item } = find(loadKnownBraids(root, number), raw, command);
  return item.brief.id;
}

/**
 * `braid review <id> --thread <thread id>`, run by the coordinator right after it launched the reviewer as a T3 subagent: records the
 * thread with the folder and branch T3 gives for it at that moment (`t3 thread show`: `worktreePath`, `branch`), so the board and
 * `braid status` count it as the item's reviewer while it runs, and `braid clean` removes that checkout after the merge without asking
 * T3 again. When T3 has no folder for it yet, or can't be read, the thread is recorded without one and `braid clean` asks T3 later.
 */
export async function reviewCommand(root: string, args: readonly string[], opts: RequestOptions & { readonly t3?: T3Runner } = {}): Promise<string> {
  const { positionals, values } = parse("braid review", args, { thread: { type: "string" } });
  const thread = str(values, "thread");
  if (positionals.length !== 1 || thread === undefined) {
    throw new UsageError("usage: braid review <id> --thread <thread id>  (the reviewer's child thread id, from delegate_task)");
  }
  threadOf(values);
  const id = itemId(root, positionals[0], "braid review");
  const at = (opts.now ?? (() => new Date()))();
  const where = await showThread(opts.t3 ?? runT3, root, thread);
  const folder = where?.worktreePath ?? null;
  const added = recordReview(root, id, thread, at.toISOString(), folder === null ? null : { folder, branch: where?.branch ?? null });
  const what = folder === null ? `no checkout yet (${where === null ? "T3 doesn't know the thread or can't be read" : "T3 gives no folder"}); braid clean will ask T3` : `checkout ${folder}${where?.branch == null ? "" : `, branch ${where.branch}`}`;
  return `${id}: review thread ${thread} ${added ? "recorded" : "already recorded"} (${what})
`;
}

export async function handoverCommand(root: string, args: readonly string[], opts: RequestOptions = {}): Promise<string> {
  const { positionals, values } = parse("braid handover", args, { head: { type: "string" }, thread: { type: "string" }, to: { type: "string" } });
  const head = str(values, "head");
  if (positionals.length !== 1 || head === undefined) {
    throw new UsageError("usage: braid handover <id> --head <sha> [--thread <id>] [--to user|pm]");
  }
  if (!/^[0-9a-fA-F]{7,40}$/.test(head)) {
    throw new UsageError(`--head needs a commit sha (7 to 40 hex digits); got: ${head}`);
  }
  const thread = threadOf(values);
  const id = itemId(root, positionals[0], "braid handover");
  const route = addressee(root, values, id);
  const run = opts.gh ?? runGh;
  const github = readGithub(root, run, 0);
  if (github.status.state !== "ok") {
    throw new UsageError(`${id} not handed over: GitHub could not be read (${github.status.reason}); nothing changed`);
  }
  const found = github.prs.get(id);
  if (found === undefined) {
    throw new UsageError(`${id} not handed over: it has no PR; nothing changed`);
  }
  const pr = view(run, root, found.number);
  const fail = (why: string) => {
    throw new UsageError(`${id} not handed over: ${why}; nothing changed`);
  };
  if (pr.state !== "OPEN") {
    fail(`PR #${pr.number} is ${pr.state.toLowerCase()}`);
  }
  if (!pr.headRefOid.startsWith(head.toLowerCase())) {
    fail(`PR #${pr.number}'s head is ${pr.headRefOid.slice(0, 7)}, not ${head}`);
  }
  const notes: string[] = [];
  const checks = checksProblem(ciChecks(root), pr, { root, run, notes });
  if (checks !== null) {
    fail(checks.why);
  }
  const at = (opts.now ?? (() => new Date()))();
  const opened = openRequest(root, { id, kind: "review", text: `review PR #${pr.number} at ${pr.headRefOid.slice(0, 7)}`, at: at.toISOString(), thread, pr: pr.number, head: pr.headRefOid, ...route });
  const recap = await recapCommand(root, [id], { gh: run });
  return `${notes.map((n) => `${n}\n`).join("")}${opened.code} ${id}: review request ${route.to === "pm" ? "to the PM " : ""}opened for PR #${pr.number} at ${pr.headRefOid}\n${warned(opened.warning)}\n${recap}`;
}

/** Whether the project has this `pm/<slug>` branch, local or on `origin`. */
function programmeBranch(root: string, slug: string): boolean {
  return ["refs/heads", "refs/remotes/origin"].some((ns) => spawnSync("git", ["rev-parse", "--verify", "--quiet", `${ns}/pm/${slug}`], { cwd: root }).status === 0);
}

/** `--by coordinator|pm`: who asks. A programme id (`pm/<slug>`) is always the PM's. */
function askerFlag(values: Parameters<typeof str>[0], programme: boolean): Asker {
  const by = str(values, "by");
  if (by !== undefined && by !== "coordinator" && by !== "pm") {
    throw new UsageError(`--by is coordinator or pm; got: ${by}`);
  }
  if (programme && by === "coordinator") {
    throw new UsageError("a programme request (pm/<slug>) is the PM's: drop --by coordinator");
  }
  return programme ? "pm" : (by ?? "coordinator");
}

export function askCommand(root: string, args: readonly string[], opts: RequestOptions = {}): string {
  const { positionals, values } = parse("braid ask", args, { kind: { type: "string" }, key: { type: "string" }, thread: { type: "string" }, file: { type: "string" }, to: { type: "string" }, by: { type: "string" } });
  const kind = str(values, "kind") ?? "question";
  if (!KINDS.includes(kind as Kind) || kind === "review") {
    throw new UsageError(`--kind is question, decision, plan or action (a review comes from braid handover); got: ${kind}`);
  }
  const file = str(values, "file");
  if (positionals.length !== (file === undefined ? 2 : 1)) {
    throw new UsageError('usage: braid ask <id>|pm/<slug> "<what is needed>" [--kind question|decision|plan|action] [--key <stop case>] [--thread <id>] [--to user|pm] [--by coordinator|pm]  (or the text from --file -)');
  }
  const thread = threadOf(values);
  const slug = programmeOf(positionals[0] ?? "");
  const by = askerFlag(values, slug !== null);
  if (kind === "action" && by !== "pm") {
    throw new UsageError("--kind action is something only the user can do, and only the PM asks it: add --by pm, or ask on pm/<slug>");
  }
  if (by === "pm" && str(values, "to") !== undefined) {
    throw new UsageError("--to is for a coordinator's request; a PM request is already the user's");
  }
  if (slug !== null && !programmeBranch(root, slug)) {
    throw new UsageError(`pm/${slug} is not a programme of this project: no branch pm/${slug}, local or on origin; nothing opened`);
  }
  const id = slug === null ? itemId(root, positionals[0], "braid ask") : `pm/${slug}`;
  const text = (file === undefined ? (positionals[1] ?? "") : readText({ file })).replace(/\s+/g, " ").trim();
  if (text === "") {
    throw new UsageError("braid ask: the text of what is needed must not be empty");
  }
  const key = str(values, "key");
  const route = by === "pm" ? {} : addressee(root, values, id);
  // A PM request is answered in the PM's thread: --thread, else the PM-run line of the braid's brief.
  const pmThread = by === "pm" ? (thread ?? (slug === null ? pmOfBraid(root, id) : null)) : thread;
  const at = (opts.now ?? (() => new Date()))();
  const opened = openRequest(root, { id, ...(by === "pm" ? { by } : {}), kind: kind as Kind, text, ...(key === undefined ? {} : { key }), at: at.toISOString(), thread: pmThread, ...route });
  return `${opened.code} ${id}: ${kind} request ${by === "pm" ? "from the PM " : route.to === "pm" ? "to the PM " : ""}opened: ${text}\n${warned(opened.warning)}`;
}

/** `braid forward <id> [--note <text>]`: the PM hands a request on to the user; it reaches the user (on the braid's card, or for a braid a programme runs as the PM asking in the programme's Needs you) and is pushed, at once or, while the braid is paused or held, after `braid resume`. */
export function forwardCommand(root: string, args: readonly string[], opts: RequestOptions = {}): string {
  const { positionals, values } = parse("braid forward", args, { note: { type: "string" } });
  if (positionals.length !== 1) {
    throw new UsageError("usage: braid forward <id> [--note <text>]");
  }
  const id = itemId(root, positionals[0], "braid forward");
  const note = str(values, "note")?.replace(/\s+/g, " ").trim();
  const open = loadRequests(root).find((r) => r.id === id && askerOf(r) === "coordinator");
  if (open === undefined) {
    throw new UsageError(`${id}: no open request to forward`);
  }
  if (open.to !== "pm" || open.forwarded !== undefined) {
    return `${id}: the ${open.kind} request is already the user's${open.forwarded === undefined ? "" : " (forwarded)"}; nothing changed\n`;
  }
  const given = note === undefined || note === "" ? undefined : note;
  forwardRequest(root, id, (opts.now ?? (() => new Date()))().toISOString(), given);
  return `${id}: ${open.kind} request forwarded to the user${given === undefined ? "" : `: ${given}`}\n`;
}

export function answerCommand(root: string, cwd: string, args: readonly string[]): string {
  const { positionals, values } = parse("braid answer", args, { log: { type: "string" }, thread: { type: "string" }, by: { type: "string" } });
  if (positionals.length !== 1) {
    throw new UsageError("usage: braid answer <id>|pm/<slug> [--by coordinator|pm] [--log <file>|-] [--thread <id>]");
  }
  threadOf(values);
  const slug = programmeOf(positionals[0] ?? "");
  const by = askerFlag(values, slug !== null);
  // A programme has no brief to log on.
  if (slug !== null && str(values, "log") !== undefined) {
    throw new UsageError("a programme request has no braid log: drop --log");
  }
  const id = slug === null ? itemId(root, positionals[0], "braid answer") : `pm/${slug}`;
  const logFile = str(values, "log");
  const thread = str(values, "thread");
  // The log entry first: a refused one leaves the request open.
  const logged = logFile === undefined ? "" : logEntry(root, cwd, [id, "--file", logFile, ...(thread === undefined ? [] : ["--thread", thread])]);
  const closed = closeRequest(root, id, by, { state: "answered", who: by });
  const other = loadRequests(root).find((r) => r.id === id && askerOf(r) !== by);
  const hint = closed || other === undefined ? "" : ` (the ${askerOf(other) === "pm" ? "PM's" : "coordinator's"} is open: --by ${askerOf(other)})`;
  return `${closed ? `${id}: ${by === "pm" ? "the PM's " : ""}request closed` : `${id}: no open ${by === "pm" ? "PM " : ""}request${hint}`}\n${logged}`;
}

export function requestsCommand(root: string, args: readonly string[], opts: RequestOptions = {}): string {
  if (args.length > 0) {
    throw new UsageError(`braid requests takes no arguments; got: ${args.join(" ")}`);
  }
  const run = opts.gh ?? runGh;
  // Only a review request needs GitHub, and only when there is one.
  const prOf = (number: number): PrNow => {
    try {
      const pr = view(run, root, number);
      return { state: pr.state, headRefOid: pr.headRefOid };
    } catch {
      return null;
    }
  };
  // Fetched first, outside any lock, as `braid inbox` does; offline, the local copy is listed.
  const fetched = fetchBranch(root, REQUESTS);
  const offline = fetched.state === "offline" ? `warning: can't fetch ${REQUESTS.branch} from origin (${fetched.why}); listing the local copy\n` : "";
  const list: Request[] = liveRequests(root, prOf);
  const skipped = loadRecord(root)
    .problems.map((p) => `warning: skipped ${p.file}: ${p.message}\n`)
    .join("");
  if (list.length === 0) {
    return `${offline}${skipped}no open requests\n`;
  }
  const now = (opts.now ?? (() => new Date()))();
  return `${offline}${skipped}${[...list].sort((a, b) => a.at.localeCompare(b.at)).map((r) => `${r.code}  ${r.id}  ${r.kind}  ${age(r.at, now)}  ${askerOf(r) === "pm" ? "from the PM  " : ""}${r.forwarded !== undefined ? "forwarded by the PM  " : r.to === "pm" ? "to the PM  " : ""}${r.text}`).join("\n")}\n`;
}
