// `braid handover`, `braid ask`, `braid answer` and `braid requests`: the coordinator records that it
// needs the user (a request), and closes it again. The store is src/braids/requests.ts.
import { threadShort } from "../braids/logs.js";
import { loadBraids } from "../braids/store.js";
import { age, closeRequest, KINDS, liveRequests, openRequest, type Kind, type PrNow, type Request } from "../braids/requests.js";
import { readGithub, runGh, type GhRunner } from "../board/github.js";
import { UsageError } from "./braids.js";
import { ciChecks } from "./coordinate.js";
import { checksProblem, view } from "./done.js";
import { find, parse, readText, str } from "./edit.js";
import { logEntry } from "./logs.js";
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

/** The item's id (`0015` or `0015/C`), checked against the braids of this checkout. */
function itemId(root: string, raw: string | undefined, command: string): string {
  const { item } = find(loadBraids(root), raw, command);
  return item.brief.id;
}

export async function handoverCommand(root: string, args: readonly string[], opts: RequestOptions = {}): Promise<string> {
  const { positionals, values } = parse("braid handover", args, { head: { type: "string" }, thread: { type: "string" } });
  const head = str(values, "head");
  if (positionals.length !== 1 || head === undefined) {
    throw new UsageError("usage: braid handover <id> --head <sha> [--thread <id>]");
  }
  if (!/^[0-9a-fA-F]{7,40}$/.test(head)) {
    throw new UsageError(`--head needs a commit sha (7 to 40 hex digits); got: ${head}`);
  }
  const thread = threadOf(values);
  const id = itemId(root, positionals[0], "braid handover");
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
  openRequest(root, { id, kind: "review", text: `review PR #${pr.number} at ${pr.headRefOid.slice(0, 7)}`, at: at.toISOString(), thread, pr: pr.number, head: pr.headRefOid });
  const recap = await recapCommand(root, [id], { gh: run });
  return `${notes.map((n) => `${n}\n`).join("")}${id}: review request opened for PR #${pr.number} at ${pr.headRefOid}\n\n${recap}`;
}

export function askCommand(root: string, args: readonly string[], opts: RequestOptions = {}): string {
  const { positionals, values } = parse("braid ask", args, { kind: { type: "string" }, key: { type: "string" }, thread: { type: "string" }, file: { type: "string" } });
  const kind = str(values, "kind") ?? "question";
  if (!KINDS.includes(kind as Kind) || kind === "review") {
    throw new UsageError(`--kind is question, decision or plan (a review comes from braid handover); got: ${kind}`);
  }
  const file = str(values, "file");
  if (positionals.length !== (file === undefined ? 2 : 1)) {
    throw new UsageError('usage: braid ask <id> "<what is needed>" [--kind question|decision|plan] [--key <stop case>] [--thread <id>]  (or the text from --file -)');
  }
  const thread = threadOf(values);
  const id = itemId(root, positionals[0], "braid ask");
  const text = (file === undefined ? (positionals[1] ?? "") : readText({ file })).replace(/\s+/g, " ").trim();
  if (text === "") {
    throw new UsageError("braid ask: the text of what is needed must not be empty");
  }
  const key = str(values, "key");
  const at = (opts.now ?? (() => new Date()))();
  openRequest(root, { id, kind: kind as Kind, text, ...(key === undefined ? {} : { key }), at: at.toISOString(), thread });
  return `${id}: ${kind} request opened: ${text}\n`;
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
  return `${[...list].sort((a, b) => a.at.localeCompare(b.at)).map((r) => `${r.id}  ${r.kind}  ${age(r.at, now)}  ${r.text}`).join("\n")}\n`;
}
