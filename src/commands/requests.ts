// `braid handover`, `braid ask`, `braid answer`, `braid withdraw` and `braid requests`: the coordinator
// records that it needs someone (a request), and closes it again. The record is src/braids/requests.ts.
import { spawnSync } from "node:child_process";
import { threadShort } from "../braids/logs.js";
import { braidAt, loadKnownBraids } from "../braids/branches.js";
import { fetchBranch, git } from "../braids/gitbranch.js";
import { readFileSync } from "node:fs";
import { addEvent, age, askerOf, BRAID_TO, closing, CODE, CONTEXT_MAX, conditionEnding, endRequest, OPTION_LETTERS, optionAnswer, optionLines, forwardRequest, handleOf, resolveName, isTimedWait, isWait, holding, KINDS, loadRecord, loadRequests, openRequest, programmeOf, REQUESTS, unblocksOf, type Asker, type Conditions, type Ending, type Kind, type PrNow, type Request, type Who } from "../braids/requests.js";
import type { Braid } from "../braids/store.js";
import { loadLifecycle, withStatuses } from "../braids/lifecycle.js";
import { readGithub, runGh, type GhRunner, type PullRequest } from "../board/github.js";
import { mainCheckout, parentsCheckout, runT3, showThread, type T3Runner } from "../board/t3.js";
import { normPath } from "../braids/worktrees.js";
import { clock } from "../board/pause.js";
import { actWord } from "../board/record.js";
import { braidDoneOn } from "../board/wake.js";
import { normaliseId, UsageError } from "./braids.js";
import { ciAll, ciChecks } from "./coordinate.js";
import { checksProblem, view } from "./done.js";
import { find, parse, readText, str } from "./edit.js";
import { mainBranch } from "./start.js";
import { loadReviews, recordReview, type ChildRole } from "../braids/reviews.js";
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

/**
 * Braid `number` wherever braid can see it: this checkout, its braid and plan branches (as `braid view`),
 * then `origin/<main>`, where a merged story is after its branch is gone and before this checkout pulls it.
 */
function braidOf(root: string, number: string): Braid | undefined {
  return loadKnownBraids(root, number).find((b) => b.number === number) ?? braidAt(root, `origin/${mainBranch(root)}`, number) ?? undefined;
}

/** The PM's thread named by the braid's brief (`PM-run (thread <id>)`), or null. */
function pmOfBraid(root: string, id: string): string | null {
  const braid = braidOf(root, id.slice(0, 4));
  return braid === undefined ? null : (PM_RUN.exec(braid.brief.body)?.[1] ?? null);
}

/**
 * `--to user|pm|<braid number>`: whom the request is for. `pm` needs the PM's thread from the braid's
 * `PM-run (thread <id>)` line, and fails (opening nothing) without it. A braid number is another braid's
 * coordinator, stored as the number; nothing routes it yet.
 */
function addressee(root: string, values: Parameters<typeof str>[0], id: string): { to?: string; pm?: string } {
  const to = str(values, "to");
  if (to === undefined || to === "user") {
    return {};
  }
  if (/^\d{1,4}$/.test(to)) {
    const number = to.padStart(4, "0");
    if (braidOf(root, number) === undefined) {
      throw new UsageError(`${id} not opened: --to ${to}: no braid ${number}; nothing changed`);
    }
    return { to: number };
  }
  if (to !== "pm") {
    throw new UsageError(`--to is user, pm or a braid number; got: ${to}`);
  }
  const pm = pmOfBraid(root, id);
  if (pm === null) {
    throw new UsageError(`${id} not opened: --to pm needs braid ${id.slice(0, 4)}'s brief to have a "PM-run (thread <id>)" line, and it has none; nothing changed`);
  }
  return { to: "pm", pm };
}

/** `--done-when answered|pr:<n>|braid:<number>|time:<iso>`, normalised; `answered` when not given. */
function doneWhenFlag(values: Parameters<typeof str>[0]): string {
  const raw = str(values, "done-when");
  if (raw === undefined || raw === "answered") {
    return "answered";
  }
  const pr = /^pr:#?(\d+)$/.exec(raw);
  if (pr !== null) {
    return `pr:${Number(pr[1])}`;
  }
  const braid = /^braid:(\d{1,4})$/.exec(raw);
  if (braid !== null) {
    return `braid:${(braid[1] ?? "").padStart(4, "0")}`;
  }
  const time = /^time:(.+)$/.exec(raw)?.[1];
  if (time !== undefined && /^\d{4}-\d{2}-\d{2}/.test(time) && !Number.isNaN(Date.parse(time))) {
    return `time:${new Date(time).toISOString()}`;
  }
  throw new UsageError(`--done-when is answered, pr:<n>, braid:<number> or time:<iso>; got: ${raw}`);
}

/**
 * The item's id (`0015` or `0015/C`), checked against the braids braid can see (`braidOf`); an id the
 * record already has requests for is known too, though its braid is out of sight here.
 */
export function itemId(root: string, raw: string | undefined, command: string): string {
  const number = raw === undefined ? undefined : /^(\d{1,4})(?:\/|$)/.exec(raw)?.[1]?.padStart(4, "0");
  const braid = number === undefined ? undefined : braidOf(root, number);
  try {
    return find(braid === undefined ? [] : [braid], raw, command).item.brief.id;
  } catch (error) {
    const id = raw !== undefined && /^\d{1,4}(?:\/[A-Za-z])?$/.test(raw) ? normaliseId(raw) : null;
    if (id !== null && loadRecord(root).requests.some((r) => r.id === id)) {
      return id;
    }
    throw error;
  }
}

/**
 * `braid review <id> --thread <thread id>`, run by the coordinator right after it launched the reviewer as a T3 subagent: records the
 * thread with the folder and branch T3 gives for it at that moment (`t3 thread show`: `worktreePath`, `branch`), so the board and
 * `braid status` count it as the item's reviewer while it runs, and `braid clean` removes that checkout after the merge without asking
 * T3 again. When T3 has no folder for it yet, or can't be read, the thread is recorded without one and `braid clean` asks T3 later.
 * A checkout that isn't the child's own (`notOwn`, or a research child's) is not recorded as one; the thread is, so the board still sees it.
 */
export async function reviewCommand(root: string, args: readonly string[], opts: RequestOptions & { readonly t3?: T3Runner } = {}): Promise<string> {
  const { positionals, values } = parse("braid review", args, { thread: { type: "string" } });
  const thread = str(values, "thread");
  if (positionals.length !== 1 || thread === undefined) {
    throw new UsageError("usage: braid review <id> --thread <thread id>  (the reviewer's child thread id, from delegate_task; a PM's checker: braid review pm/<slug> --thread <thread id>)");
  }
  threadOf(values);
  // A PM's live checker is recorded on its programme (`pm/<slug>`): T3 lists no subagent threads, so this is how the board sees it run (0071/C).
  const pm = /^pm\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(positionals[0] ?? "");
  const id = pm ? (positionals[0] ?? "") : itemId(root, positionals[0], "braid review");
  return recordChild(root, id, thread, "review", pm, opts);
}

/** Why a checkout T3 gives for a child isn't its own: it is the main checkout or the caller's, or is on their branch, or is another recorded thread's or its parent's; null when it is. */
async function notOwn(run: T3Runner, root: string, thread: string, parent: string | null, folder: string, branch: string | null): Promise<string | null> {
  for (const [dir, name] of [[mainCheckout(root), "the main checkout"], [root, "the caller's own checkout"]] as const) {
    if (normPath(folder) === normPath(dir)) {
      return `it is ${name}`;
    }
    if (branch !== null && git(dir, ["symbolic-ref", "--short", "-q", "HEAD"]).stdout.trim() === branch) {
      return `${name} is on its branch ${branch}`;
    }
  }
  const other = loadReviews(root).find((r) => r.thread !== thread && ((r.folder !== undefined && normPath(r.folder) === normPath(folder)) || (branch !== null && r.branch === branch)));
  return other === undefined ? parentsCheckout(run, root, parent, folder, branch) : `thread ${other.thread} is recorded with that checkout or branch`;
}

/** Records a child thread of the item with its role and the checkout T3 gives for it (`braid review`, `braid launch --child`). */
export async function recordChild(root: string, id: string, thread: string, role: ChildRole, pm: boolean, opts: RequestOptions & { readonly t3?: T3Runner } = {}): Promise<string> {
  const at = (opts.now ?? (() => new Date()))();
  // A researcher is launched `shared`: T3 gives the parent's checkout as its folder, which is not the child's to remove.
  const shared = role === "research";
  const run = opts.t3 ?? runT3;
  const where = await showThread(run, root, thread);
  const folder = pm ? null : (where?.worktreePath ?? null);
  const branch = where?.branch ?? null;
  const why = folder === null ? null : shared ? "a research child shares its parent's checkout" : await notOwn(run, root, thread, where?.parent ?? null, folder, branch);
  const added = recordReview(root, id, thread, at.toISOString(), folder === null ? null : why === null ? { folder, branch } : { kept: { folder, why } }, role);
  let what: string;
  if (shared) {
    what = "shared checkout: no folder or branch recorded";
  } else if (folder === null) {
    what = `no checkout yet (${where === null ? "T3 doesn't know the thread or can't be read" : "T3 gives no folder"}); braid clean will ask T3`;
  } else if (why !== null) {
    what = `no folder or branch recorded; braid clean keeps checkout ${folder}: ${why}`;
  } else {
    what = `checkout ${folder}${branch === null ? "" : `, branch ${branch}`}`;
  }
  return `${id}: ${role} thread ${thread} ${added ? "recorded" : "already recorded"} (${what})
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
  const checks = checksProblem(ciChecks(root), pr, { root, run, notes }, ciAll(root));
  if (checks !== null) {
    fail(checks.why);
  }
  const at = (opts.now ?? (() => new Date()))();
  const opened = openRequest(root, { id, kind: "review", text: `review PR #${pr.number} at ${pr.headRefOid.slice(0, 7)}`, at: at.toISOString(), thread, pr: pr.number, head: pr.headRefOid, ...route });
  const recap = await recapCommand(root, [id], { gh: run });
  return `${notes.map((n) => `${n}\n`).join("")}${opened.handle} ${id}: review request ${route.to === "pm" ? "to the PM " : ""}opened for PR #${pr.number} at ${pr.headRefOid}\n${warned(opened.warning)}\n${recap}`;
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

/** `--context <text>` or `--context-file <path|->`: the request's context, Markdown kept as written, at most `CONTEXT_MAX` characters; undefined without either. */
function contextFlag(values: Parameters<typeof str>[0]): string | undefined {
  const text = str(values, "context");
  const file = str(values, "context-file");
  if (text !== undefined && file !== undefined) {
    throw new UsageError("braid ask: give --context or --context-file, not both");
  }
  if (file === "-" && str(values, "file") === "-") {
    throw new UsageError("braid ask: --file - and --context-file - both read standard input; give one of them a file");
  }
  let raw = text;
  if (file === "-") {
    if (process.stdin.isTTY) {
      throw new UsageError("--context-file - reads standard input; pipe the context in");
    }
    raw = readFileSync(0, "utf8");
  } else if (file !== undefined) {
    try {
      raw = readFileSync(file, "utf8");
    } catch {
      throw new UsageError(`can't read ${file}`);
    }
  }
  const context = raw?.replace(/\r\n/g, "\n").trim();
  if (context === undefined || context === "") {
    return undefined;
  }
  if (context.length > CONTEXT_MAX) {
    throw new UsageError(`braid ask: the context has ${context.length} characters, more than ${CONTEXT_MAX}; shorten it; nothing opened`);
  }
  return context;
}

/** `--option <text>`, repeated: the likely answers in order, one line each, one to four. */
function optionsFlag(values: Parameters<typeof str>[0]): string[] | undefined {
  const raw = values["option"];
  const given = Array.isArray(raw) ? raw.map((o) => String(o).replace(/\s+/g, " ").trim()) : [];
  if (given.length === 0) {
    return undefined;
  }
  if (given.length > OPTION_LETTERS.length) {
    throw new UsageError(`braid ask: at most ${OPTION_LETTERS.length} --option (A to D); got ${given.length}; nothing opened`);
  }
  if (given.some((o) => o === "")) {
    throw new UsageError("braid ask: an --option must not be empty; nothing opened");
  }
  return given;
}

export function askCommand(root: string, args: readonly string[], opts: RequestOptions = {}): string {
  const { positionals, values } = parse("braid ask", args, { kind: { type: "string" }, key: { type: "string" }, thread: { type: "string" }, file: { type: "string" }, to: { type: "string" }, by: { type: "string" }, "done-when": { type: "string" }, context: { type: "string" }, "context-file": { type: "string" }, option: { type: "string", multiple: true } });
  const kind = str(values, "kind") ?? "question";
  if (!KINDS.includes(kind as Kind) || kind === "review") {
    throw new UsageError(`--kind is question, decision, plan, action or look (a review comes from braid handover); got: ${kind}`);
  }
  const context = contextFlag(values);
  const options = optionsFlag(values);
  const file = str(values, "file");
  if (positionals.length !== (file === undefined ? 2 : 1)) {
    throw new UsageError(`${ASK_USAGE}  (or the text from --file -)`);
  }
  const thread = threadOf(values);
  const doneWhen = doneWhenFlag(values);
  const slug = programmeOf(positionals[0] ?? "");
  const by = askerFlag(values, slug !== null);
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
  // `--to self`: a timed wait (0075/G). The coordinator waits on purpose until a time; nobody is asked, and the board's time wake ends it.
  const self = str(values, "to") === "self";
  if (self && !doneWhen.startsWith("time:")) {
    throw new UsageError("--to self is a timed wait: give --done-when time:<iso>; nothing opened");
  }
  const route = by === "pm" ? {} : self ? { to: "self" } : addressee(root, values, id);
  // A PM request is answered in the PM's thread: --thread, else the PM-run line of the braid's brief.
  const pmThread = by === "pm" ? (thread ?? (slug === null ? pmOfBraid(root, id) : null)) : thread;
  const at = (opts.now ?? (() => new Date()))();
  const opened = openRequest(root, { id, ...(by === "pm" ? { by } : {}), kind: kind as Kind, text, ...(context === undefined ? {} : { context }), ...(options === undefined ? {} : { options }), ...(key === undefined ? {} : { key }), at: at.toISOString(), thread: pmThread, ...route, doneWhen });
  // "…opened, replacing calm-heron-q2ra": the open wait this wait withdrew (a question withdraws nothing).
  const replacing = opened.replaced.length === 0 ? "" : `, replacing ${opened.replaced.join(", ")}`;
  if (self) {
    return `${opened.handle} ${id}: timed wait opened${replacing}, waiting until ${clock(doneWhen.slice(5), at)} (the board's wake ends it; nobody is asked): ${text}\n${warned(opened.warning)}`;
  }
  const gist = unblockLine({ code: opened.code, id, kind: kind as Kind, doneWhen, ...(route.to === undefined ? {} : { to: route.to }) }, loadRequests(root), statused(root, prsOf(root, opts.gh ?? runGh)));
  const whom = by === "pm" ? "from the PM " : route.to === "pm" ? "to the PM " : route.to !== undefined ? `to braid ${route.to} ` : "";
  const extra = [...optionLines({ ...(options === undefined ? {} : { options }) }), ...(context === undefined ? [] : [`context stored (${context.length} characters)`])].map((l) => `${l}\n`).join("");
  return `${opened.handle} ${id}: ${kind} request ${whom}opened${replacing}${doneWhen === "answered" ? "" : ` (done when ${doneWhen})`}: ${text}\n${extra}${gist}\n${warned(opened.warning)}`;
}

const ASK_USAGE = 'usage: braid ask <id>|pm/<slug> "<what is needed>" [--kind question|decision|plan|action|look] [--option <text>]... [--context <text>|--context-file <file>|-] [--key <stop case>] [--thread <id>] [--to user|pm|<braid number>|self] [--done-when answered|pr:<n>|braid:<number>|time:<iso>] [--by coordinator|pm]  (--to self --done-when time:<iso>: a timed wait, nobody asked)';

/** Whether `braid forward` can hand it on: a coordinator's question to the PM, not forwarded yet. */
const forwardable = (r: Request): boolean => askerOf(r) === "coordinator" && !isWait(r) && r.to === "pm" && r.forwarded === undefined;

/**
 * The request `braid forward` means: the one a name or code gives, else the item's only one still to forward (several are
 * listed and refused); with none to forward, one that says why. Undefined when the item has none open.
 */
function forwardTarget(root: string, raw: string): { id: string; open: Request | undefined } {
  if (!idLike(raw)) {
    const code = namedCode(root, raw, "braid forward");
    const r = loadRecord(root).requests.find((x) => x.code === code) ?? fail(`braid forward: no request ${code}; nothing changed`);
    if (r.state !== "open" || askerOf(r) !== "coordinator") {
      return fail(`braid forward: ${handleOf(r)} (${r.id}) is ${r.state !== "open" ? `already ${r.state}` : "the PM's own"}; nothing changed`);
    }
    return { id: r.id, open: r };
  }
  const id = itemId(root, raw, "braid forward");
  fetchBranch(root, REQUESTS);
  const own = loadRequests(root).filter((r) => r.id === id && askerOf(r) === "coordinator");
  const waiting = own.filter(forwardable);
  if (waiting.length > 1) {
    return fail(`braid forward: ${id} has ${waiting.length} requests to forward: ${waiting.map(listed).join(", ")}; give the name; nothing changed`);
  }
  // A wait to another braid is never forwarded: the coordinator's question is.
  return { id, open: waiting[0] ?? own.find((r) => !isWait(r)) ?? own[0] };
}

/** `braid forward <name|code>|<id> [--note <text>]`: the PM hands a request on to the user; it reaches the user (on the braid's card, or for a braid a programme runs as the PM asking in the programme's Needs you) and is pushed, at once or, while the braid is paused or held, after `braid resume`. */
export function forwardCommand(root: string, args: readonly string[], opts: RequestOptions = {}): string {
  const { positionals, values } = parse("braid forward", args, { note: { type: "string" } });
  if (positionals.length !== 1) {
    throw new UsageError("usage: braid forward <name|code>|<id> [--note <text>]");
  }
  const note = str(values, "note")?.replace(/\s+/g, " ").trim();
  const { id, open } = forwardTarget(root, positionals[0] ?? "");
  if (open === undefined) {
    throw new UsageError(`${id}: no open request to forward`);
  }
  if (!forwardable(open)) {
    const whose = isTimedWait(open) ? "a timed wait" : open.to !== undefined && BRAID_TO.test(open.to) ? `for braid ${open.to}'s coordinator` : `already the user's${open.forwarded === undefined ? "" : " (forwarded)"}`;
    return `${id}: the ${open.kind} request is ${whose}; nothing changed\n`;
  }
  const given = note === undefined || note === "" ? undefined : note;
  const done = forwardRequest(root, id, (opts.now ?? (() => new Date()))().toISOString(), given, open.code);
  return `${id}: ${open.kind} request forwarded to the user${given === undefined ? "" : `: ${given}`}\n${warned(done.warning)}`;
}

/** `user`, `pm`, `coordinator`, `board` as the words a line says. */
const WHO: Readonly<Record<Who, string>> = { user: "the user", pm: "the PM", coordinator: "the coordinator", board: "the board" };

/** Every braid braid knows, each item with the status it reads as (from its lifecycle and, when given, the PRs). */
function statused(root: string, prs: ReadonlyMap<string, PullRequest> = new Map()): Braid[] {
  const life = loadLifecycle(root);
  return loadKnownBraids(root).map((b) => withStatuses(b, life, prs));
}

/** What a request unblocks and its act word on one line: `blocks 0072/B, 0072/C · decide`, or just `decide` when nothing waits on it; a wait: `waits for 0077`. */
function unblockLine(r: Pick<Request, "code" | "id" | "kind" | "to" | "doneWhen">, requests: readonly Request[], braids: readonly Braid[]): string {
  const blocked = unblocksOf(r, braids, requests);
  return `${blocked.length === 0 ? "" : `blocks ${blocked.join(", ")} · `}${actWord(r, new Date())}`;
}

/** A q-code in any letter case, with any punctuation after it (`Q-L9EN.`), lower-cased; null for anything else. */
function strictCode(raw: string): string | null {
  const code = raw.trim().toLowerCase().replace(/[^a-z0-9]+$/, "");
  return CODE.test(code) ? code : null;
}

/** An item id (`15`, `0015/c`) or a programme (`pm/<slug>`): these keep their meaning, so a suffix of four digits is given as `q-0123` or with its words. */
const idLike = (raw: string): boolean => /^\d{1,4}(?:\/[A-Za-z])?$/.test(raw) || programmeOf(raw) !== null;

const fail = (message: string): never => {
  throw new UsageError(message);
};

/**
 * The code of the request a name means (src/braids/words.ts `resolveName`): a q-code as given; otherwise the record as
 * origin has it is read and the handle, the words with the suffix, the suffix (any request) or the words alone (an open
 * one) looked up, loosely. Several matched: refused with their handles, nothing changed. Null when nothing matched.
 */
function codeOf(root: string, raw: string, command: string): string | null {
  const code = strictCode(raw);
  if (code !== null) {
    return code;
  }
  fetchBranch(root, REQUESTS);
  const found = resolveName(raw, loadRecord(root).requests);
  if (found === null) {
    return null;
  }
  if ("several" in found) {
    const list = found.several.map((r) => `${handleOf(r)} (${r.id}, ${r.state})`).join(", ");
    return fail(`${command}: "${raw}" names ${found.several.length} requests: ${list}; give the whole name; nothing changed`);
  }
  return found.one.code;
}

/** `codeOf`, refusing a name nothing matched. */
const namedCode = (root: string, raw: string, command: string): string => codeOf(root, raw, command) ?? fail(`${command}: no request named ${raw}; nothing changed`);

/** The PRs of the project when GitHub can be read, else none: only an item's Done reading needs them. */
function prsOf(root: string, run: GhRunner): ReadonlyMap<string, PullRequest> {
  const g = readGithub(root, run);
  return g.status.state === "ok" ? g.prs : new Map();
}

/** One of several open requests, as a refusal lists it: its name, whose it is and its kind. */
function listed(r: Request): string {
  const whose = askerOf(r) === "pm" ? "the PM's" : "the coordinator's";
  const what = isTimedWait(r) ? " timed wait" : isWait(r) ? `, waiting on braid ${r.to ?? ""}` : ` ${r.kind}`;
  return `${handleOf(r)} (${whose}${what})`;
}

/** The code of the one open request a name, a code or an id means; an id with several open is refused, listing them. */
function target(root: string, raw: string, values: Parameters<typeof str>[0], command: string): { code: string; id: string } | { none: string } {
  const named = idLike(raw) ? null : namedCode(root, raw, command);
  if (named !== null) {
    if (str(values, "by") !== undefined) {
      throw new UsageError(`${command}: --by is for an id; the code ${raw} names one request`);
    }
    return { code: named, id: "" };
  }
  const slug = programmeOf(raw);
  const by = str(values, "by") === undefined && slug === null ? undefined : askerFlag(values, slug !== null);
  const id = slug === null ? (/^\d{1,4}(?:\/[A-Za-z])?$/.test(raw) ? normaliseId(raw) : itemId(root, raw, command)) : `pm/${slug}`;
  // Someone else may have opened or closed one: read the record as it is on origin.
  fetchBranch(root, REQUESTS);
  const open = loadRequests(root).filter((r) => r.id === id && (by === undefined || askerOf(r) === by));
  if (open.length > 1) {
    // Only the name tells them apart, unless one asker has exactly one open.
    const askers = open.map(askerOf);
    const byHelps = new Set(askers).size > 1 && askers.some((a) => askers.indexOf(a) === askers.lastIndexOf(a));
    const list = [...open].sort((a, b) => Number(askerOf(a) === "pm") - Number(askerOf(b) === "pm")).map(listed).join(", ");
    throw new UsageError(`${id} has ${open.length} open requests: ${list}; give the name${byHelps ? ", or --by coordinator|pm" : ""}; nothing changed`);
  }
  const [one] = open;
  if (one !== undefined) {
    return { code: one.code, id };
  }
  if (slug === null) {
    itemId(root, id, command);
  }
  const others = by === undefined ? [] : loadRequests(root).filter((r) => r.id === id && askerOf(r) !== by);
  const [other] = others;
  const hint = other === undefined ? "" : ` (the ${askerOf(other) === "pm" ? "PM's" : "coordinator's"} ${others.length === 1 ? "is" : "are"} open: ${others.map(handleOf).join(", ")})`;
  return { none: `${id}: no open ${by === "pm" ? "PM " : ""}request${hint}\n` };
}

/** Closes the request `target` found; a request already closed is refused, naming its state and who closed it. */
function end(root: string, found: { code: string; id: string }, command: string, ending: Ending | ((r: Request) => Ending)): { request: Request; warning: string | null } {
  const done = endRequest(root, found.code, ending);
  if (done === null) {
    throw new UsageError(`${command}: no request ${found.code} on ${REQUESTS.branch}; nothing changed`);
  }
  if (!done.ended) {
    const last = closing(done.request);
    throw new UsageError(`${command}: ${handleOf(done.request)} (${done.request.id}) is already ${done.request.state}${last === null ? "" : ` by ${WHO[last.by] ?? last.by} at ${stamp(last.at)}`}; nothing changed`);
  }
  return done;
}

/** `2026-11-23 12:05Z`. */
const stamp = (iso: string): string => `${iso.slice(0, 10)} ${iso.slice(11, 16)}Z`;

/** The text of `--file` or `--log` (the same: a file, or `-` for standard input); undefined without either. */
function answerText(values: Parameters<typeof str>[0]): string | undefined {
  const file = str(values, "file");
  const log = str(values, "log");
  if (file !== undefined && log !== undefined) {
    throw new UsageError("braid answer: --log is the same as --file; give one");
  }
  const from = file ?? log;
  if (from === undefined) {
    return undefined;
  }
  const text = readText({ file: from }).trim();
  return text === "" ? undefined : text;
}

const ANSWER_USAGE = "usage: braid answer <name|code>|<id>|pm/<slug> [<answer>|<option letter>] [--from user|pm] [--reason <text>] [--file <file>|-] [--by coordinator|pm] [--thread <id>]  (a wait takes no --from: met when its condition holds)";

/** What a "done when" is checked against here: GitHub's PRs, and main as origin has it (offline, the last fetched one). */
function conditions(root: string, requests: readonly Pick<Request, "doneWhen">[], run: GhRunner, now: Date): Conditions {
  // Only a request waiting on a PR needs GitHub, and only when there is one.
  const pr = (number: number): PrNow => {
    try {
      const found = view(run, root, number);
      return { state: found.state, headRefOid: found.headRefOid };
    } catch {
      return null;
    }
  };
  const main = mainBranch(root);
  if (requests.some((r) => r.doneWhen.startsWith("braid:"))) {
    git(root, ["fetch", "-q", "origin", main]);
  }
  const prs = () => {
    const g = readGithub(root, run);
    return g.status.state === "ok" ? g.prs : null;
  };
  return { pr, braidDone: braidDoneOn(root, main, prs), now };
}

/**
 * How `braid answer` ends a wait (`isWait`), which asks neither the user nor the PM: `met`, by the coordinator, when its
 * condition holds now, refused otherwise. A wait on another braid without a condition (done when answered) ends with
 * that coordinator's answer, recorded as the coordinator's.
 */
function waitEnding(root: string, r: Request, text: string | undefined, opts: RequestOptions): Ending {
  if (r.doneWhen === "answered") {
    return { state: "answered", who: "coordinator", ...(text === undefined ? {} : { text }) };
  }
  const e = conditionEnding(r, conditions(root, [r], opts.gh ?? runGh, (opts.now ?? (() => new Date()))()));
  if (e?.state !== "met") {
    return fail(`braid answer: ${handleOf(r)} (${r.id}) is a wait and its condition (done when ${r.doneWhen}) doesn't hold now. A wait ends when its condition holds (the board closes it and wakes the asker); \`braid withdraw ${handleOf(r)} --why <reason>\` ends one no longer needed; nothing changed`);
  }
  return { ...e, who: "coordinator" };
}

/**
 * `braid answer`: records the answer on the request record, with who answered (`--from`, the user by
 * default; a wait: `waitEnding`) and the PM's reason. It writes only to braid-requests, never to a braid branch, so a PR head stays
 * where it was. `--log` is the old name of `--file`.
 */
export function answerCommand(root: string, _cwd: string, args: readonly string[], opts: RequestOptions = {}): string {
  const { positionals, values } = parse("braid answer", args, { log: { type: "string" }, file: { type: "string" }, thread: { type: "string" }, by: { type: "string" }, from: { type: "string" }, reason: { type: "string" } });
  if (positionals.length !== 1 && positionals.length !== 2) {
    throw new UsageError(ANSWER_USAGE);
  }
  threadOf(values);
  const from = str(values, "from") ?? "user";
  if (from !== "user" && from !== "pm") {
    throw new UsageError(`--from is user or pm; got: ${from}`);
  }
  const reason = str(values, "reason")?.replace(/\s+/g, " ").trim();
  if (from === "pm" && (reason === undefined || reason === "")) {
    throw new UsageError("--from pm needs --reason <text>: why the PM answered so");
  }
  if (from === "user" && reason !== undefined) {
    throw new UsageError("--reason is the PM's: add --from pm");
  }
  const given = positionals[1]?.trim();
  if (given !== undefined && (str(values, "file") !== undefined || str(values, "log") !== undefined)) {
    throw new UsageError("braid answer: give the answer as text or with --file, not both");
  }
  const text = given === undefined ? answerText(values) : given === "" ? undefined : given;
  const found = target(root, positionals[0] ?? "", values, "braid answer");
  if ("none" in found) {
    return found.none;
  }
  // A closed wait goes on to `end`, which names who closed it.
  const wait = loadRecord(root).requests.find((r) => r.code === found.code && r.state === "open" && isWait(r));
  if (wait !== undefined && str(values, "from") !== undefined) {
    throw new UsageError(`braid answer: ${handleOf(wait)} (${wait.id}) is a wait, which asks neither the user nor the PM: drop --from; nothing changed`);
  }
  const ending: Ending | ((r: Request) => Ending) = wait === undefined ? answerEnding(from, text, reason) : waitEnding(root, wait, text, opts);
  const done = end(root, found, "braid answer", ending);
  const name = `${handleOf(done.request)} ${done.request.id}`;
  const last = closing(done.request);
  if (last?.event === "met") {
    return `${name}: met: ${last.text ?? ""} (the board sends no wake for a wait closed by hand${text === undefined ? "" : "; your text isn't recorded"})\n${warned(done.warning)}`;
  }
  return `${name}: answered by ${WHO[last?.by ?? from]}${last?.text === undefined ? "" : `: ${oneLine(last.text)}`}\n${warned(done.warning)}`;
}

/** The ending `braid answer` records: a lone letter of a stored option (`A`, any case) records that option's text, read from the record inside the write. */
const answerEnding =
  (who: "user" | "pm", text: string | undefined, reason: string | undefined) =>
  (r: Request): Ending => ({ state: "answered", who, ...(text === undefined ? {} : { text: optionAnswer(r, text) }), ...(reason === undefined ? {} : { reason }) });

/** The longest answer the board's page sends (0082/D): one line. */
export const BOARD_ANSWER_MAX = 500;

/**
 * The board's `answer` action (0082/D): the user's answer from the board's page, recorded as `braid answer <handle> <text>`
 * records it (`by: user`, a lone letter as its option). `handle` names a request of this project's record (its name or code);
 * a wait, which asks no one, and a request already answered, withdrawn or met are refused with the reason. A UsageError
 * is the refusal the page shows.
 */
export function boardAnswer(root: string, handle: string, text: string): { readonly request: Request; readonly warning: string | null } {
  const answer = text.trim();
  if (answer === "" || /[\r\n]/.test(answer) || answer.length > BOARD_ANSWER_MAX) {
    throw new UsageError(`Answer: one line of text or an option letter, at most ${BOARD_ANSWER_MAX} characters`);
  }
  const code = codeOf(root, handle.trim(), "Answer") ?? fail(`Answer: no request ${handle} in this project; nothing changed`);
  const r = loadRecord(root).requests.find((x) => x.code === code);
  if (r !== undefined && r.state === "open" && isWait(r)) {
    throw new UsageError(`Answer: ${handleOf(r)} (${r.id}) is a wait, which asks no one: it ends when its condition holds; nothing changed`);
  }
  return end(root, { code, id: r?.id ?? "" }, "Answer", answerEnding("user", answer, undefined));
}

/** `braid withdraw <code>|<id> --why <reason>`: the asker no longer needs it; it stays on the record as withdrawn. */
export function withdrawCommand(root: string, args: readonly string[]): string {
  const { positionals, values } = parse("braid withdraw", args, { why: { type: "string" }, by: { type: "string" } });
  const why = str(values, "why")?.replace(/\s+/g, " ").trim();
  if (positionals.length !== 1 || why === undefined || why === "") {
    throw new UsageError("usage: braid withdraw <name|code>|<id>|pm/<slug> --why <reason> [--by coordinator|pm]");
  }
  const found = target(root, positionals[0] ?? "", values, "braid withdraw");
  if ("none" in found) {
    return found.none;
  }
  const done = end(root, found, "braid withdraw", (r) => ({ state: "withdrawn", who: askerOf(r), text: why }));
  return `${handleOf(done.request)} ${done.request.id}: withdrawn: ${why}\n${warned(done.warning)}`;
}

const oneLine = (text: string): string => text.replace(/\s+/g, " ").trim();

const ETA_USAGE = 'usage: braid eta <name|code> <duration|time> ["<why>"] [--by coordinator|pm]  (a duration: 2h, 90m, 1h30m, 2d; a time: 16:30, or 2026-11-24T09:00)';

/**
 * When an estimate given as `2h`, `90m`, `1h30m`, `2d` (from now), `16:30` (today, or tomorrow once it has passed)
 * or an ISO time (`2026-11-24T09:00`) comes, as ISO; null when it is none of them or an ISO time already past.
 */
export function etaAt(raw: string, now: Date): string | null {
  const d = /^(?:(\d+)d)?(?:(\d+)h)?(?:(\d+)m)?$/.exec(raw);
  if (d !== null && raw !== "") {
    const ms = ((Number(d[1] ?? 0) * 24 + Number(d[2] ?? 0)) * 60 + Number(d[3] ?? 0)) * 60_000;
    return ms > 0 ? new Date(now.getTime() + ms).toISOString() : null;
  }
  const t = /^(\d{1,2}):(\d{2})$/.exec(raw);
  if (t !== null) {
    const [h, m] = [Number(t[1]), Number(t[2])];
    if (h > 23 || m > 59) {
      return null;
    }
    const at = new Date(now);
    at.setHours(h, m, 0, 0);
    if (at.getTime() <= now.getTime()) {
      at.setDate(at.getDate() + 1);
    }
    return at.toISOString();
  }
  const iso = /^\d{4}-\d{2}-\d{2}/.test(raw) ? Date.parse(raw) : Number.NaN;
  return Number.isNaN(iso) || iso <= now.getTime() ? null : new Date(iso).toISOString();
}

/** `in 40 min`, `in 2h 10m`, `in 1d 3h`. */
function inSpan(ms: number): string {
  const min = Math.max(0, Math.round(ms / 60_000));
  if (min < 60) {
    return `in ${min} min`;
  }
  const [big, small, a, b] = min < 1440 ? [Math.floor(min / 60), min % 60, "h", "m"] : [Math.floor(min / 1440), Math.floor((min % 1440) / 60), "d", "h"];
  return `in ${big}${a}${small === 0 ? "" : ` ${small}${b}`}`;
}

/**
 * `braid eta <code> <duration|time> ["<why>"]`: the addressee of an open request says when it expects to get to it. Sets the
 * request's `eta` and appends an `eta` event with the why; a later call moves it. The running board reminds no sooner, and
 * reads the wait as stalled once it passes. By the coordinator, or the PM for a request to the PM (`--by` to say otherwise).
 */
export function etaCommand(root: string, args: readonly string[], opts: RequestOptions = {}): string {
  const { positionals, values } = parse("braid eta", args, { by: { type: "string" } });
  const [given, raw, ...rest] = positionals;
  if (given === undefined || raw === undefined || rest.length > 1) {
    throw new UsageError(ETA_USAGE);
  }
  const code = idLike(given) ? fail(`braid eta: ${given} is an item; give the request's name or code (yellow-bear-5asx, 5asx or q-5asx)`) : namedCode(root, given, "braid eta");
  const now = (opts.now ?? (() => new Date()))();
  const at = etaAt(raw, now);
  if (at === null) {
    throw new UsageError(`braid eta: ${raw} is not a duration or a time to come (2h, 90m, 1h30m, 2d, 16:30 or 2026-11-24T09:00)`);
  }
  const by = str(values, "by");
  if (by !== undefined && by !== "coordinator" && by !== "pm") {
    throw new UsageError(`--by is coordinator or pm; got: ${by}`);
  }
  const why = rest[0] === undefined ? "" : oneLine(rest[0]);
  // Someone else may have moved it or closed it: read the record as it is on origin.
  fetchBranch(root, REQUESTS);
  const was = loadRecord(root).requests.find((r) => r.code === code);
  const who: Who = by === "pm" || by === "coordinator" ? by : was?.to === "pm" ? "pm" : "coordinator";
  const done = addEvent(root, code, { event: "eta", at: now.toISOString(), by: who, text: at, ...(why === "" ? {} : { reason: why }) });
  if (done === null) {
    throw new UsageError(`braid eta: no request ${code} on ${REQUESTS.branch}; nothing changed`);
  }
  const r = done.request;
  if (!done.added) {
    const last = closing(r);
    throw new UsageError(`braid eta: ${handleOf(r)} is ${r.state}${last === null ? "" : ` (closed ${stamp(last.at)})`}; an estimate is only for an open request; nothing changed`);
  }
  const before = was?.eta ?? null;
  const whom = whomOf(r).trim();
  return `${handleOf(r)} (${r.id}${whom === "" ? "" : `, ${whom}`}): expected by ${clock(at, now)} (${inSpan(Date.parse(at) - now.getTime())})${before === null || before === at ? "" : `; was ${clock(before, now)}`}\n${warned(done.warning)}`;
}

/** Whom a request is for, as `braid requests` says it. */
function whomOf(r: Request): string {
  return askerOf(r) === "pm" ? "from the PM  " : r.forwarded !== undefined ? "forwarded by the PM  " : r.to === "pm" ? "to the PM  " : isTimedWait(r) ? `waiting until ${stamp(r.doneWhen.slice(5))}  ` : r.to !== undefined && BRAID_TO.test(r.to) ? `to braid ${r.to}  ` : "";
}

/** Who an event is by; an estimate's coordinator is named by its braid (the addressee's), as the board's details panel says. */
function whoOf(r: Request, event: string, by: Who): string {
  return by === "coordinator" && event === "eta" ? `the ${BRAID_TO.test(r.to ?? "") ? (r.to ?? "") : r.id.slice(0, 4)} coordinator` : (WHO[by] ?? by);
}

/** One request with every event: `braid requests <code>`. */
function history(r: Request, unblocks: string): string {
  const facts = [
    `asked by ${WHO[askerOf(r)]}`,
    isTimedWait(r) ? "a timed wait, nobody asked" : `for ${r.to === undefined || r.to === "user" ? "the user" : r.to === "pm" ? "the PM" : `braid ${r.to}`}`,
    `done when ${r.doneWhen}`,
    ...(r.key === undefined ? [] : [`stop case ${r.key}`]),
    ...(r.pr === undefined ? [] : [`PR #${r.pr}${r.head === undefined ? "" : ` at ${r.head.slice(0, 7)}`}`]),
    ...(r.thread === null ? [] : [`thread ${r.thread}`]),
    ...(r.eta === null ? [] : [`eta ${r.eta}`]),
  ];
  const events = r.events.map((e) => `${stamp(e.at)}  ${e.event.padEnd(9)}  ${whoOf(r, e.event, e.by)}${e.text === undefined ? "" : `: ${oneLine(e.text)}`}${e.reason === undefined ? "" : ` (reason: ${e.reason})`}`);
  const options = optionLines(r).map((l) => `${l}\n`).join("");
  const context = r.context === undefined ? "" : `context:\n${r.context.split("\n").map((l) => `  ${l}`.trimEnd()).join("\n")}\n`;
  return `${handleOf(r)}  ${r.id}  ${isTimedWait(r) ? "wait" : r.kind}  ${r.state}${r.state === "open" && !isTimedWait(r) ? `  ${unblocks}` : ""}\n${r.text}\n${options}${context}${facts.join("; ")}\n${events.join("\n")}\n`;
}

/** One closed request on a line: code, item, kind, state, when, who, the request, and the answer or reason. */
function closedLine(r: Request): string {
  const last = closing(r);
  const said = last?.text === undefined ? "" : ` -> ${oneLine(last.text)}`;
  const reason = last?.reason === undefined ? "" : ` (reason: ${last.reason})`;
  return `${handleOf(r)}  ${r.id}  ${isTimedWait(r) ? "wait" : r.kind}  ${r.state}  ${last === null ? "" : `${stamp(last.at)}  by ${WHO[last.by] ?? last.by}`}  ${r.text}${said}${reason}`;
}

/** Under a request's line in `braid requests`: its options as `A. …` lines and, when it has one, that its context is stored. */
const extras = (r: Request): string => [...optionLines(r), ...(r.context === undefined ? [] : ["context stored: braid requests <name> prints it"])].map((l) => `\n    ${l}`).join("");

const REQUESTS_USAGE = "usage: braid requests [<name|code>] [--closed [--since <YYYY-MM-DD>]]";

export function requestsCommand(root: string, args: readonly string[], opts: RequestOptions = {}): string {
  const { positionals, values } = parse("braid requests", args, { closed: { type: "boolean" }, since: { type: "string" } });
  const given = positionals[0];
  const closed = values["closed"] === true;
  const since = str(values, "since");
  if (given !== undefined && idLike(given)) {
    throw new UsageError(`braid requests: ${given} is an item; give the request's name or code (yellow-bear-5asx, 5asx or q-5asx)`);
  }
  if (positionals.length > 1 || (given !== undefined && closed) || (since !== undefined && !closed)) {
    throw new UsageError(REQUESTS_USAGE);
  }
  if (since !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(since)) {
    throw new UsageError(`--since needs a date (YYYY-MM-DD); got: ${since}`);
  }
  // Fetched first, outside any lock, as `braid inbox` does; offline, the local copy is listed.
  const fetched = fetchBranch(root, REQUESTS);
  const offline = fetched.state === "offline" ? `warning: can't fetch ${REQUESTS.branch} from origin (${fetched.why}); listing the local copy\n` : "";
  const skipped = () =>
    loadRecord(root)
      .problems.map((p) => `warning: skipped ${p.file}: ${p.message}\n`)
      .join("");
  if (given !== undefined) {
    const code = codeOf(root, given, "braid requests");
    const r = loadRecord(root).requests.find((x) => x.code === code);
    if (r === undefined) {
      throw new UsageError(`no request ${code ?? `named ${given}`} on ${REQUESTS.branch}`);
    }
    return `${offline}${history(r, unblockLine(r, loadRequests(root), statused(root, prsOf(root, opts.gh ?? runGh))))}`;
  }
  if (closed) {
    const done = loadRecord(root)
      .requests.filter((r) => r.state !== "open" && (since === undefined || (closing(r)?.at.slice(0, 10) ?? "") >= since))
      .sort((a, b) => (closing(b)?.at ?? "").localeCompare(closing(a)?.at ?? ""));
    return `${offline}${skipped()}${done.length === 0 ? `no closed requests${since === undefined ? "" : ` since ${since}`}\n` : `${done.map(closedLine).join("\n")}\n`}`;
  }
  const run = opts.gh ?? runGh;
  const list: Request[] = loadRequests(root);
  const now = (opts.now ?? (() => new Date()))();
  const ends = holding(list, conditions(root, list, run, now));
  const braids = statused(root, prsOf(root, run));
  if (list.length === 0) {
    return `${offline}${skipped()}no open requests\n`;
  }
  const when = (r: Request): string => (r.doneWhen === "answered" || r.kind === "review" || isTimedWait(r) ? "" : `done when ${r.doneWhen}  `);
  const eta = (r: Request): string => (r.eta === null ? "" : `expected by ${clock(r.eta, now)}  `);
  // A condition that holds is still open: only the running board's tick closes it (and wakes the asker).
  const holds = (r: Request): string => (ends.get(r.code)?.state === "met" ? "condition holds: the board wakes the asker  " : ends.has(r.code) ? "condition holds: the board withdraws it  " : "");
  return `${offline}${skipped()}${[...list].sort((a, b) => a.at.localeCompare(b.at)).map((r) => `${handleOf(r)}  ${r.id}  ${isTimedWait(r) ? "wait" : r.kind}  ${age(r.at, now)}  ${isTimedWait(r) ? "" : `${unblockLine(r, list, braids)}  `}${whomOf(r)}${when(r)}${eta(r)}${holds(r)}${r.text}${extras(r)}`).join("\n")}\n`;
}
