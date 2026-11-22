// `braid handover`, `braid ask`, `braid answer` and `braid requests`: the coordinator records that it
// needs the user (a request), and closes it again. The store is src/braids/requests.ts.
import { threadShort } from "../braids/logs.js";
import { loadKnownBraids } from "../braids/branches.js";
import { age, closeRequest, forwardRequest, KINDS, liveRequests, loadRequests, openRequest, type Kind, type PrNow, type Request } from "../braids/requests.js";
import { readGithub, runGh, type GhRunner } from "../board/github.js";
import { runT3, showThread, type T3Runner } from "../board/t3.js";
import { UsageError } from "./braids.js";
import { ciChecks } from "./coordinate.js";
import { checksProblem, view } from "./done.js";
import { find, parse, readText, str } from "./edit.js";
import { logEntry } from "./logs.js";
import { recordReview } from "../braids/reviews.js";
import { recapCommand } from "./facts.js";

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
  openRequest(root, { id, kind: "review", text: `review PR #${pr.number} at ${pr.headRefOid.slice(0, 7)}`, at: at.toISOString(), thread, pr: pr.number, head: pr.headRefOid, ...route });
  const recap = await recapCommand(root, [id], { gh: run });
  return `${notes.map((n) => `${n}\n`).join("")}${id}: review request ${route.to === "pm" ? "to the PM " : ""}opened for PR #${pr.number} at ${pr.headRefOid}\n\n${recap}`;
}

export function askCommand(root: string, args: readonly string[], opts: RequestOptions = {}): string {
  const { positionals, values } = parse("braid ask", args, { kind: { type: "string" }, key: { type: "string" }, thread: { type: "string" }, file: { type: "string" }, to: { type: "string" } });
  const kind = str(values, "kind") ?? "question";
  if (!KINDS.includes(kind as Kind) || kind === "review") {
    throw new UsageError(`--kind is question, decision or plan (a review comes from braid handover); got: ${kind}`);
  }
  const file = str(values, "file");
  if (positionals.length !== (file === undefined ? 2 : 1)) {
    throw new UsageError('usage: braid ask <id> "<what is needed>" [--kind question|decision|plan] [--key <stop case>] [--thread <id>] [--to user|pm]  (or the text from --file -)');
  }
  const thread = threadOf(values);
  const id = itemId(root, positionals[0], "braid ask");
  const text = (file === undefined ? (positionals[1] ?? "") : readText({ file })).replace(/\s+/g, " ").trim();
  if (text === "") {
    throw new UsageError("braid ask: the text of what is needed must not be empty");
  }
  const key = str(values, "key");
  const route = addressee(root, values, id);
  const at = (opts.now ?? (() => new Date()))();
  openRequest(root, { id, kind: kind as Kind, text, ...(key === undefined ? {} : { key }), at: at.toISOString(), thread, ...route });
  return `${id}: ${kind} request ${route.to === "pm" ? "to the PM " : ""}opened: ${text}\n`;
}

/** `braid forward <id> [--note <text>]`: the PM hands a request on to the user; it reaches Needs You (a handover: To Review) at once and is pushed. */
export function forwardCommand(root: string, args: readonly string[], opts: RequestOptions = {}): string {
  const { positionals, values } = parse("braid forward", args, { note: { type: "string" } });
  if (positionals.length !== 1) {
    throw new UsageError("usage: braid forward <id> [--note <text>]");
  }
  const id = itemId(root, positionals[0], "braid forward");
  const note = str(values, "note")?.replace(/\s+/g, " ").trim();
  const open = loadRequests(root).find((r) => r.id === id);
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
  const { positionals, values } = parse("braid answer", args, { log: { type: "string" }, thread: { type: "string" } });
  if (positionals.length !== 1) {
    throw new UsageError("usage: braid answer <id> [--log <file>|-] [--thread <id>]");
  }
  threadOf(values);
  const id = itemId(root, positionals[0], "braid answer");
  const logFile = str(values, "log");
  const thread = str(values, "thread");
  // The log entry first: a refused one leaves the request open.
  const logged = logFile === undefined ? "" : logEntry(root, cwd, [id, "--file", logFile, ...(thread === undefined ? [] : ["--thread", thread])]);
  const closed = closeRequest(root, id);
  return `${closed ? `${id}: request closed` : `${id}: no open request`}\n${logged}`;
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
  const list: Request[] = liveRequests(root, prOf);
  if (list.length === 0) {
    return "no open requests\n";
  }
  const now = (opts.now ?? (() => new Date()))();
  return `${[...list].sort((a, b) => a.at.localeCompare(b.at)).map((r) => `${r.id}  ${r.kind}  ${age(r.at, now)}  ${r.forwarded !== undefined ? "forwarded by the PM  " : r.to === "pm" ? "to the PM  " : ""}${r.text}`).join("\n")}\n`;
}
