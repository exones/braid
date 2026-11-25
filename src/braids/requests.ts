// Requests: what a coordinator or the PM needs from someone, on the record. Each request is one JSON file,
// `requests/<code>.json`, on the branch `braid-requests`, written only by braid commands through the shared
// data branch code (src/braids/gitbranch.ts). Its fields are fixed when it opens; every later change is an
// event appended to `events`, and its state is read from them. Nothing is ever deleted.
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, renameSync } from "node:fs";
import { dirname, join } from "node:path";
import { catBatch, catBatchSync } from "./gitio.js";
import { currentFiles, currentFilesAsync, lockedBranch, lockedBranchAsync, tips, tipsAsync, writeBranchUnlocked, writeBranchUnlockedAsync, type BranchSpec, type BranchView, type WriteResult } from "./gitbranch.js";
import { mergeLifecycle } from "./lifecycle.js";
import { mainCheckout } from "./state.js";

export { ensureStateDir, LockError, locked, mainCheckout, takeOverStale } from "./state.js";

/** `action` is something only the user can do (an install, a login); only the PM opens one. */
export const KINDS = ["review", "question", "decision", "plan", "action"] as const;
export type Kind = (typeof KINDS)[number];

/** Who opened a request: the braid's coordinator, or the programme manager asking the user itself. */
export type Asker = "coordinator" | "pm";

/** Whom a request is for: the user, the PM, another braid's coordinator by its four-digit number, or `self` (a timed wait: the asker waits until a time, 0075/G). */
export type To = "user" | "pm" | "self" | (string & {});

/** A braid number as an addressee. */
export const BRAID_TO = /^\d{4}$/;

/** The addressee of a timed wait: no one is asked; the asker waits on purpose until its `time:` "done when", and the board's time wake ends it. */
export const SELF = "self";

/** Who did something to a request. */
export type Who = "user" | "pm" | "coordinator" | "board";

export const STATES = ["open", "answered", "withdrawn", "met"] as const;
/** `answered`, `withdrawn` (with a reason) and `met` (its "done when" held) are final. */
export type State = (typeof STATES)[number];

/** `eta`: the addressee's estimate (its time in `text`, its why in `reason`); `reminded`: the board sent a reminder (`text`: to whom), or, with a `reason`, escalated a missed estimate. */
export const EVENTS = ["opened", "forwarded", "answered", "withdrawn", "met", "eta", "reminded"] as const;
export type EventKind = (typeof EVENTS)[number];

export interface RequestEvent {
  readonly event: EventKind;
  /** ISO time. */
  readonly at: string;
  readonly by: Who;
  /** The answer, the forward's note, the reason it was withdrawn or met, the estimate (ISO), to whom a reminder went. */
  readonly text?: string;
  /** The PM's reason, when the PM answered for the user (filled by 0070/B); an estimate's why; an escalation's cause. */
  readonly reason?: string;
}

/** The record's branch. */
export const REQUESTS_BRANCH = "braid-requests";
const FOLDER = "requests";
/** The items' lifecycle files on the same branch (src/braids/lifecycle.ts). */
export const LIFECYCLE_FOLDER = "lifecycle";
/** `q-` and four lowercase letters or digits. */
export const CODE = /^q-[a-z0-9]{4,}$/;

export interface Request {
  /** `q-7f3k`: the file name without `.json`. */
  readonly code: string;
  /** The item: `0015` or `0015/C`; for a programme request `pm/<slug>`. */
  readonly id: string;
  /** Who asks: a record without it is the coordinator's. An item has at most one open request per asker. */
  readonly by?: Asker;
  readonly kind: Kind;
  /** One line: what is needed. */
  readonly text: string;
  /** The stop case the request comes from (`ask --key`), when given. */
  readonly key?: string;
  /** When it was opened, ISO (the `opened` event's time). */
  readonly at: string;
  /** The asking thread (its id), when given. */
  readonly thread: string | null;
  /** A review request: the PR and the head commit handed over. */
  readonly pr?: number;
  readonly head?: string;
  /** Whom it is for: `pm` (the programme manager answers first), `user`, or another braid's coordinator by its number (`0042`); `user` once forwarded. Without it, the user's. */
  readonly to?: To;
  /** The PM's thread (id) of a request to the PM, from the brief's `PM-run (thread <id>)` line. */
  readonly pm?: string;
  /** When the PM forwarded it to the user (`braid forward`), ISO: the `forwarded` event. */
  readonly forwarded?: string;
  /** The PM's note with the forward. */
  readonly note?: string;
  /** When it is done: `answered` (the default), `pr:<n>` merged, `braid:<number>` merged into main, `time:<iso>`. */
  readonly doneWhen: string;
  /** The estimate (ISO): the newest `eta` event's, else the field; null until set. */
  readonly eta: string | null;
  readonly state: State;
  readonly events: readonly RequestEvent[];
}

/** What a caller gives to open a request; the rest comes from the record. */
export type NewRequest = Omit<Request, "code" | "forwarded" | "note" | "doneWhen" | "eta" | "state" | "events"> & { readonly doneWhen?: string };

/** A request file that can't be read: reported and skipped. */
export interface RecordProblem {
  readonly file: string;
  readonly message: string;
}

/** What `gh pr view --json state,headRefOid` says of a PR; `headRefOid` is the full commit sha, as stored in a review request's `head`. null: GitHub couldn't be read. */
export type PrNow = { readonly state: string; readonly headRefOid: string } | null;

/** The JSON on the branch: the fields fixed at opening, then the events. */
interface RecordFile {
  readonly code: string;
  readonly item: string;
  readonly kind: Kind;
  readonly text: string;
  readonly key?: string;
  readonly by: Asker;
  readonly thread: string | null;
  readonly to: string;
  readonly pm?: string;
  readonly doneWhen: string;
  readonly pr?: number;
  readonly head?: string;
  readonly eta: string | null;
  readonly events: readonly RequestEvent[];
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const FINAL: Readonly<Partial<Record<EventKind, State>>> = { answered: "answered", withdrawn: "withdrawn", met: "met" };

function toFile(r: Request): RecordFile {
  return {
    code: r.code,
    item: r.id,
    kind: r.kind,
    text: r.text,
    ...(r.key === undefined ? {} : { key: r.key }),
    by: askerOf(r),
    thread: r.thread,
    to: r.events.some((e) => e.event === "forwarded") ? "pm" : (r.to ?? "user"),
    ...(r.pm === undefined ? {} : { pm: r.pm }),
    doneWhen: r.doneWhen,
    ...(r.pr === undefined ? {} : { pr: r.pr }),
    ...(r.head === undefined ? {} : { head: r.head }),
    eta: r.eta,
    events: r.events,
  };
}

const serialise = (r: Request): string => `${JSON.stringify(toFile(r), null, 2)}\n`;

/** The request a file holds, its state and the fields its events set; a problem when it doesn't parse. */
export function parseRecord(file: string, text: string): Request | RecordProblem {
  const bad = (message: string): RecordProblem => ({ file, message });
  let v: unknown;
  try {
    v = JSON.parse(text);
  } catch (error) {
    return bad(`not JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (!isObj(v)) {
    return bad("not a JSON object");
  }
  const code = v["code"];
  if (typeof code !== "string" || !CODE.test(code) || file !== `${FOLDER}/${code}.json`) {
    return bad(`code ${JSON.stringify(code)} doesn't match the file name`);
  }
  if (typeof v["item"] !== "string" || typeof v["text"] !== "string" || !KINDS.includes(v["kind"] as Kind)) {
    return bad("needs item, kind and text");
  }
  const events = Array.isArray(v["events"]) ? v["events"] : [];
  if (!events.every((e) => isObj(e) && EVENTS.includes(e["event"] as EventKind) && typeof e["at"] === "string" && typeof e["by"] === "string")) {
    return bad("an event needs event, at and by");
  }
  const list = events as RequestEvent[];
  const opened = list.find((e) => e.event === "opened");
  if (opened === undefined) {
    return bad("no opened event");
  }
  const forward = list.findLast((e) => e.event === "forwarded");
  const final = list.findLast((e) => FINAL[e.event] !== undefined);
  const by = v["by"] === "pm" ? "pm" : "coordinator";
  // Without `to`, the request is the user's, as before the record.
  const to = forward !== undefined ? "user" : v["to"] === "pm" || v["to"] === SELF || (typeof v["to"] === "string" && BRAID_TO.test(v["to"])) ? (v["to"] as string) : undefined;
  return {
    code,
    id: v["item"],
    ...(by === "pm" ? { by } : {}),
    kind: v["kind"] as Kind,
    text: v["text"],
    ...(typeof v["key"] === "string" ? { key: v["key"] } : {}),
    at: opened.at,
    thread: typeof v["thread"] === "string" ? v["thread"] : null,
    ...(typeof v["pr"] === "number" ? { pr: v["pr"] } : {}),
    ...(typeof v["head"] === "string" ? { head: v["head"] } : {}),
    ...(to === undefined ? {} : { to }),
    ...(typeof v["pm"] === "string" ? { pm: v["pm"] } : {}),
    ...(forward === undefined ? {} : { forwarded: forward.at, ...(forward.text === undefined ? {} : { note: forward.text }) }),
    doneWhen: typeof v["doneWhen"] === "string" ? v["doneWhen"] : "answered",
    eta: list.findLast((e) => e.event === "eta")?.text ?? (typeof v["eta"] === "string" ? v["eta"] : null),
    state: final === undefined ? "open" : (FINAL[final.event] ?? "open"),
    events: list,
  };
}

export const isRecordProblem = (r: Request | RecordProblem): r is RecordProblem => "message" in r;

/**
 * Two versions of one request file, when an offline commit is replayed over a remote change: the remote's
 * fields with both event lists, each event once, in time order. No event is lost.
 */
export function mergeRecord(path: string, ours: string, theirs: string): string {
  const a = parseRecord(path, ours);
  const b = parseRecord(path, theirs);
  if (isRecordProblem(b)) {
    return ours;
  }
  if (isRecordProblem(a)) {
    return theirs;
  }
  const seen = new Set<string>();
  const events = [...b.events, ...a.events].filter((e) => {
    const k = JSON.stringify([e.event, e.at, e.by, e.text ?? "", e.reason ?? ""]);
    return seen.has(k) ? false : (seen.add(k), true);
  });
  events.sort((x, y) => x.at.localeCompare(y.at));
  return serialise({ ...b, events });
}

/** The record branch: requests and, beside them, the items' lifecycle (src/braids/lifecycle.ts), with one lock, fetch and replay. */
export const REQUESTS: BranchSpec = {
  branch: REQUESTS_BRANCH,
  folders: [FOLDER, LIFECYCLE_FOLDER],
  lock: "requests",
  what: "the requests record",
  noun: "request",
  merge: (path, ours, theirs) => (path.startsWith(`${LIFECYCLE_FOLDER}/`) ? mergeLifecycle(path, ours, theirs) : mergeRecord(path, ours, theirs)),
};

/** A request's file on the record branch (the branch also holds `lifecycle/`). */
const isRequestPath = (path: string): boolean => path.startsWith(`${FOLDER}/`);

/** Who asked; an old record without `by` is the coordinator's. */
export const askerOf = (r: Pick<Request, "by">): Asker => r.by ?? "coordinator";

/** `pm/<slug>`: the id of a programme request; the slug, or null for any other id. */
export const programmeOf = (id: string): string | null => /^pm\/(.+)$/.exec(id)?.[1] ?? null;

const same = (r: Request, id: string, by: Asker | undefined): boolean => r.id === id && (by === undefined || askerOf(r) === by);

/** A wait: a request to another braid's coordinator (`to` a braid number), or a timed wait (`to: self`). Neither asks the user. */
export const isWait = (r: Pick<Request, "to">): boolean => r.to !== undefined && (BRAID_TO.test(r.to) || r.to === SELF);

/** A timed wait (`braid ask <id> "<why>" --to self --done-when time:<iso>`): the asker waits on purpose until a time. */
export const isTimedWait = (r: Pick<Request, "to">): boolean => r.to === SELF;

/** Whether a new request replaces an open one of its asker on its item: a question (to the user or the PM) replaces a question, a wait a wait to the same braid, a timed wait a timed wait. */
const replaces = (r: Request, next: Pick<Request, "to">): boolean => (isWait(next) ? r.to === next.to : !isWait(r));

/** Every request and the files that can't be read, from texts by path. */
function parseAll(texts: ReadonlyMap<string, string>): { requests: Request[]; problems: RecordProblem[] } {
  const requests: Request[] = [];
  const problems: RecordProblem[] = [];
  for (const [path, text] of texts) {
    const r = parseRecord(path, text);
    if (isRecordProblem(r)) {
      problems.push(r);
    } else {
      requests.push(r);
    }
  }
  requests.sort((a, b) => a.at.localeCompare(b.at) || a.code.localeCompare(b.code));
  return { requests, problems };
}

/** Every file in a write's view of the branch, read with one `git cat-file --batch`. */
function viewAll(view: BranchView): { requests: Request[]; problems: RecordProblem[] } {
  const paths = view.paths().filter(isRequestPath);
  const texts = view.readMany(paths);
  return parseAll(new Map(paths.flatMap((p, i) => (texts[i] === null || texts[i] === undefined ? [] : [[p, texts[i]] as const]))));
}

/** The old local store, carried over once. */
export function legacyFile(root: string): string {
  let main = mains.get(root);
  if (main === undefined) {
    main = mainCheckout(root);
    mains.set(root, main);
  }
  return join(main, ".braid", "requests.json");
}

/** The main checkout of each root asked for: it doesn't change, and the board asks on every read. */
const mains = new Map<string, string>();

/** The name the old store keeps after it was carried over. */
export const MIGRATED = "requests.migrated.json";

function readLegacy(file: string): Record<string, unknown>[] {
  try {
    const parsed: unknown = JSON.parse(readFileSync(file, "utf8"));
    return Array.isArray(parsed) ? parsed.filter(isObj) : [];
  } catch {
    return [];
  }
}

/** A new code, unused on the branch. */
function newCode(taken: (code: string) => boolean): string {
  for (let size = 4; ; size++) {
    for (let tries = 0; tries < 20; tries++) {
      const code = `q-${[...randomBytes(size)].map((b) => "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36]).join("")}`;
      if (!taken(code)) {
        return code;
      }
    }
  }
}

const pathOf = (code: string): string => `${FOLDER}/${code}.json`;

/**
 * Carries the open requests of an old `.braid/requests.json` onto the branch, once: each one opened with a
 * code and its original times, in one commit; then the file is renamed `requests.migrated.json`. A record
 * already on the branch (same item, asker and opening time, as a run that died before the rename left it)
 * isn't added again. With `push: false` (the board's read) the commit stays local until the next write.
 * Returns how many it carried over.
 */
export function migrate(root: string, options: { push?: boolean } = {}): number {
  const file = legacyFile(root);
  if (!existsSync(file)) {
    return 0;
  }
  return lockedBranch(root, REQUESTS, () => {
    if (!existsSync(file)) {
      return 0;
    }
    const old = readLegacy(file);
    let carried = 0;
    if (old.length > 0) {
      writeBranchUnlocked(
        root,
        REQUESTS,
        (view) => {
          const known = new Set(viewAll(view).requests.map((r) => `${r.id} ${askerOf(r)} ${r.at}`));
          const files = new Map<string, string>();
          for (const o of old) {
            const id = o["id"];
            const at = o["at"];
            const by: Asker = o["by"] === "pm" ? "pm" : "coordinator";
            if (typeof id !== "string" || typeof at !== "string" || known.has(`${id} ${by} ${at}`)) {
              continue;
            }
            known.add(`${id} ${by} ${at}`);
            const code = newCode((c) => view.has(pathOf(c)) || files.has(pathOf(c)));
            const forwarded = typeof o["forwarded"] === "string" ? o["forwarded"] : undefined;
            const note = typeof o["note"] === "string" ? o["note"] : undefined;
            const kind = KINDS.includes(o["kind"] as Kind) ? (o["kind"] as Kind) : "question";
            const pr = typeof o["pr"] === "number" ? o["pr"] : undefined;
            const r: Request = {
              code,
              id,
              ...(by === "pm" ? { by } : {}),
              kind,
              text: typeof o["text"] === "string" ? o["text"] : "",
              ...(typeof o["key"] === "string" ? { key: o["key"] } : {}),
              at,
              thread: typeof o["thread"] === "string" ? o["thread"] : null,
              ...(pr === undefined ? {} : { pr }),
              ...(typeof o["head"] === "string" ? { head: o["head"] } : {}),
              ...(o["to"] === "pm" ? { to: "pm" as const } : {}),
              ...(typeof o["pm"] === "string" ? { pm: o["pm"] } : {}),
              doneWhen: pr === undefined ? "answered" : `pr:${pr}`,
              eta: null,
              state: "open",
              events: [
                { event: "opened", at, by },
                ...(forwarded === undefined ? [] : [{ event: "forwarded" as const, at: forwarded, by: "pm" as const, ...(note === undefined ? {} : { text: note }) }]),
              ],
            };
            files.set(pathOf(code), serialise(r));
          }
          carried = files.size;
          return { files, message: `docs(requests): carry over ${files.size} from .braid/requests.json` };
        },
        options,
      );
    }
    renameSync(file, join(dirname(file), MIGRATED));
    return carried;
  });
}

/** The whole record from the local refs (no fetch): every request, open or closed, and the files that can't be read. */
export function loadRecord(root: string, options: { push?: boolean } = {}): { requests: Request[]; problems: RecordProblem[] } {
  migrate(root, { push: options.push ?? false });
  // The refs are one process; the files are read again only when a tip moved.
  const at = tips(root, REQUESTS);
  const key = `${at.local ?? "-"} ${at.remote ?? "-"}`;
  const cached = records.get(root);
  if (cached !== undefined && cached.key === key) {
    return cached.record;
  }
  const files = [...currentFiles(root, REQUESTS, at)].filter(([path]) => isRequestPath(path));
  const texts = catBatchSync(root, files.map(([, blob]) => blob));
  const record = parseAll(new Map(files.flatMap(([path], i) => (texts[i] === null || texts[i] === undefined ? [] : [[path, texts[i]] as const]))));
  records.set(root, { key, record });
  return record;
}

/** `loadRecord` for the board: the same record, read without blocking the process. */
export async function loadRecordAsync(root: string, options: { push?: boolean } = {}): Promise<{ requests: Request[]; problems: RecordProblem[] }> {
  migrate(root, { push: options.push ?? false }); // a no-op unless an old local store is still there, once
  const at = await tipsAsync(root, REQUESTS);
  const key = `${at.local ?? "-"} ${at.remote ?? "-"}`;
  const cached = records.get(root);
  if (cached !== undefined && cached.key === key) {
    return cached.record;
  }
  const files = [...(await currentFilesAsync(root, REQUESTS, at))].filter(([path]) => isRequestPath(path));
  const texts = await catBatch(root, files.map(([, blob]) => blob));
  const record = parseAll(new Map(files.flatMap(([path], i) => (texts[i] === null || texts[i] === undefined ? [] : [[path, texts[i]] as const]))));
  records.set(root, { key, record });
  return record;
}

/** The last record read per root, with the tips it was read at. */
const records = new Map<string, { key: string; record: { requests: Request[]; problems: RecordProblem[] } }>();

/** The open requests, from the local refs. */
export function loadRequests(root: string): Request[] {
  return loadRecord(root).requests.filter((r) => r.state === "open");
}

/** One write to the record, holding its lock; an old local store is carried over first. */
function writeRecord(root: string, change: (view: BranchView) => { files: Map<string, string>; message: string }): WriteResult {
  migrate(root);
  return lockedBranch(root, REQUESTS, () => writeBranchUnlocked(root, REQUESTS, change));
}

/** `writeRecord` for the board: waits for the lock and runs every `git` call without blocking the process. */
function writeRecordAsync(root: string, change: (view: BranchView) => { files: Map<string, string>; message: string }): Promise<WriteResult> {
  migrate(root);
  return lockedBranchAsync(root, REQUESTS, () => writeBranchUnlockedAsync(root, REQUESTS, change));
}

/** An open request with its `opened` event, as `openRequest` writes it; `code` given or empty. Also for demos and tests. */
export function newRecord(request: NewRequest & { readonly code?: string }): Request {
  const { doneWhen, code, ...fields } = request;
  return { ...fields, code: code ?? "", doneWhen: doneWhen ?? (request.pr === undefined ? "answered" : `pr:${request.pr}`), eta: null, state: "open", events: [{ event: "opened", at: request.at, by: askerOf(request) }] };
}

const withEvent = (r: Request, e: RequestEvent): Request => ({ ...r, events: [...r.events, e] });

/**
 * Opens a request and returns its code. The open one on the same item from the same asker is withdrawn,
 * "replaced by q-…", when it is of the same sort: a question (to the user or the PM) replaces a question,
 * a wait (to a braid) replaces the wait to that braid. The other asker's stays.
 */
export function openRequest(root: string, request: NewRequest): { readonly code: string; readonly warning: string | null } {
  let code = "";
  const result = writeRecord(root, (view) => {
    const all = viewAll(view).requests;
    code = newCode((c) => view.has(pathOf(c)));
    const by = askerOf(request);
    const files = new Map<string, string>();
    for (const old of all.filter((r) => r.state === "open" && same(r, request.id, by) && replaces(r, request))) {
      files.set(pathOf(old.code), serialise(withEvent(old, { event: "withdrawn", at: request.at, by, text: `replaced by ${code}` })));
    }
    files.set(pathOf(code), serialise(newRecord({ ...request, code })));
    return { files, message: `docs(requests): ${request.id} ${request.kind} ${code}` };
  });
  return { code, warning: result.warning };
}

/** How a request ends: its final state, who ended it, and why or the answer. */
export interface Ending {
  readonly state: "answered" | "withdrawn" | "met";
  readonly who: Who;
  readonly text?: string;
  /** The PM's reason, when the PM answered for the user. */
  readonly reason?: string;
  readonly at?: string;
}

/** The event an ending appends. */
const endEvent = (e: Ending, at: string): RequestEvent => ({ event: e.state, at: e.at ?? at, by: e.who, ...(e.text === undefined ? {} : { text: e.text }), ...(e.reason === undefined ? {} : { reason: e.reason }) });

/**
 * Closes the item's open request of this asker (without `by`: of both) with an event, never a delete; true
 * when there was one. `end` may depend on the request (a review is met, a question withdrawn).
 */
export function closeRequest(root: string, id: string, by: Asker | undefined, end: Ending | ((r: Request) => Ending)): { readonly found: boolean; readonly warning: string | null } {
  // Nothing to close: no lock, no write (start and accept call this on every item).
  if (!loadRequests(root).some((r) => same(r, id, by))) {
    return { found: false, warning: null };
  }
  const at = new Date().toISOString();
  const result = writeRecord(root, (view) => {
    const files = new Map<string, string>();
    for (const r of viewAll(view).requests.filter((x) => x.state === "open" && same(x, id, by))) {
      files.set(pathOf(r.code), serialise(withEvent(r, endEvent(typeof end === "function" ? end(r) : end, at))));
    }
    return { files, message: `docs(requests): ${id} closed` };
  });
  return { found: result.commit !== null, warning: result.warning };
}

/**
 * Ends one request by its code. Inside the write it is checked again: a request already closed (by
 * someone else meanwhile, too) is left as it is and returned with `ended: false`. Null: no such code.
 */
export function endRequest(root: string, code: string, end: Ending | ((r: Request) => Ending)): { readonly request: Request; readonly ended: boolean; readonly warning: string | null } | null {
  const job = endJob(code, end);
  return job.outcome(writeRecord(root, job.change));
}

/** `endRequest` for the board: the same write, without blocking the process. */
export async function endRequestAsync(root: string, code: string, end: Ending | ((r: Request) => Ending)): Promise<{ readonly request: Request; readonly ended: boolean; readonly warning: string | null } | null> {
  const job = endJob(code, end);
  return job.outcome(await writeRecordAsync(root, job.change));
}

type Change = (view: BranchView) => { files: Map<string, string>; message: string };

function endJob(code: string, end: Ending | ((r: Request) => Ending)): { change: Change; outcome: (r: WriteResult) => { readonly request: Request; readonly ended: boolean; readonly warning: string | null } | null } {
  let found: Request | null = null;
  let ended = false;
  return {
    change: (view) => {
      const text = view.read(pathOf(code));
      const r = text === null ? null : parseRecord(pathOf(code), text);
      found = r === null || isRecordProblem(r) ? null : r;
      ended = found !== null && found.state === "open";
      if (found === null || !ended) {
        return { files: new Map(), message: "" };
      }
      const e = typeof end === "function" ? end(found) : end;
      const next = serialise(withEvent(found, endEvent(e, new Date().toISOString())));
      found = parseRecord(pathOf(code), next) as Request;
      return { files: new Map([[pathOf(code), next]]), message: `docs(requests): ${found.id} ${code} ${e.state}` };
    },
    outcome: (result) => {
      const request: Request | null = found;
      return request === null ? null : { request, ended, warning: result.warning };
    },
  };
}

/** The event that closed a request, or null while it is open. */
export const closing = (r: Pick<Request, "events">): RequestEvent | null => r.events.findLast((e) => FINAL[e.event] !== undefined) ?? null;

/**
 * Appends an event to one open request by its code (`braid eta`, the board's reminders), the `eta` field following
 * an `eta` event. Checked again inside the write: a closed request is left and returned with `added: false`. Null: no such code.
 */
export function addEvent(root: string, code: string, event: RequestEvent): { readonly request: Request; readonly added: boolean; readonly warning: string | null } | null {
  const job = addJob(code, event);
  return job.outcome(writeRecord(root, job.change));
}

/** `addEvent` for the board: the same write, without blocking the process. */
export async function addEventAsync(root: string, code: string, event: RequestEvent): Promise<{ readonly request: Request; readonly added: boolean; readonly warning: string | null } | null> {
  const job = addJob(code, event);
  return job.outcome(await writeRecordAsync(root, job.change));
}

function addJob(code: string, event: RequestEvent): { change: Change; outcome: (r: WriteResult) => { readonly request: Request; readonly added: boolean; readonly warning: string | null } | null } {
  let found: Request | null = null;
  let added = false;
  return {
    change: (view) => {
      const text = view.read(pathOf(code));
      const r = text === null ? null : parseRecord(pathOf(code), text);
      found = r === null || isRecordProblem(r) ? null : r;
      added = found !== null && found.state === "open";
      if (found === null || !added) {
        return { files: new Map(), message: "" };
      }
      const next = withEvent(event.event === "eta" && event.text !== undefined ? { ...found, eta: event.text } : found, event);
      found = next;
      return { files: new Map([[pathOf(code), serialise(next)]]), message: `docs(requests): ${next.id} ${code} ${event.event}` };
    },
    outcome: (result) => {
      const request: Request | null = found;
      return request === null ? null : { request, added, warning: result.warning };
    },
  };
}

/** Hands the item's request to the user (`braid forward`): a `forwarded` event with the note. Null when there is no open request. */
export function forwardRequest(root: string, id: string, at: string, note: string | undefined): { readonly request: Request | null; readonly warning: string | null } {
  let out: Request | null = null;
  const result = writeRecord(root, (view) => {
    const old = viewAll(view).requests.find((r) => r.state === "open" && same(r, id, "coordinator") && !isWait(r));
    if (old === undefined) {
      out = null;
      return { files: new Map(), message: "" };
    }
    const next = withEvent(old, { event: "forwarded", at, by: "pm", ...(note === undefined ? {} : { text: note }) });
    out = { ...next, to: "user", forwarded: at, ...(note === undefined ? {} : { note }) };
    return { files: new Map([[pathOf(old.code), serialise(next)]]), message: `docs(requests): ${id} ${old.code} forwarded` };
  });
  return { request: out, warning: result.warning };
}

/** The fields the PR checks read. */
type PrFields = Pick<Request, "kind" | "head" | "pr"> & { readonly doneWhen?: string };

/** The PR a request waits on: a `pr:<n>` "done when", else a review's PR. */
export function conditionPr(request: PrFields): number | undefined {
  const m = /^pr:(\d+)$/.exec(request.doneWhen ?? "");
  return m === null ? request.pr : Number(m[1]);
}

/**
 * A request waiting on a PR is void when the PR is no longer open (in any letter case); a review request
 * also when the PR is at another head (the full sha). A PR that can't be read (null) leaves it.
 */
export function voided(request: PrFields, pr: PrNow): boolean {
  if (pr === null || (request.kind !== "review" && !/^pr:/.test(request.doneWhen ?? ""))) {
    return false;
  }
  return pr.state.toUpperCase() !== "OPEN" || (request.kind === "review" && request.head !== undefined && pr.headRefOid !== request.head);
}

/** How a void request ends: met when its PR merged, withdrawn when it closed or (a review's) its head moved. */
export function voidEnding(request: PrFields, pr: NonNullable<PrNow>): Ending {
  const state = pr.state.toUpperCase();
  const n = conditionPr(request) ?? "";
  if (state === "MERGED") {
    return { state: "met", who: "board", text: `PR #${n} merged` };
  }
  if (state !== "OPEN") {
    return { state: "withdrawn", who: "board", text: `PR #${n} ${state.toLowerCase()}` };
  }
  return { state: "withdrawn", who: "board", text: `PR #${n} head moved to ${pr.headRefOid.slice(0, 7)}` };
}

/** What a "done when" is checked against now. */
export interface Conditions {
  /** What GitHub says of a PR; null when it can't be read. */
  readonly pr: (number: number) => PrNow;
  /** Whether braid `number` is Done on the main branch on origin; null or absent when it can't be told. */
  readonly braidDone?: (number: string) => boolean | null;
  /** The time a `time:` condition is compared with; the clock when absent. */
  readonly now?: Date;
}

/** The conditions, or only what the PRs are (the rest from the clock). */
export type Check = Conditions | ((number: number) => PrNow);

const conditionsOf = (check: Check): Conditions => (typeof check === "function" ? { pr: check } : check);

/**
 * How an open request ends now, by its "done when": `pr:<n>` (and a review's PR) as `voidEnding` says when
 * the PR is void; `braid:<number>` met when that braid is Done on main; `time:<iso>` met once now is at or
 * after it. Null while it doesn't hold, can't be told, or the request waits for an answer.
 */
export function conditionEnding(request: PrFields, check: Check): Ending | null {
  const c = conditionsOf(check);
  const n = conditionPr(request);
  if (n !== undefined) {
    const pr = c.pr(n);
    return pr !== null && voided(request, pr) ? voidEnding(request, pr) : null;
  }
  const braid = /^braid:(\d{4})$/.exec(request.doneWhen ?? "")?.[1];
  if (braid !== undefined) {
    return c.braidDone?.(braid) === true ? { state: "met", who: "board", text: `braid ${braid} merged into main` } : null;
  }
  const time = /^time:(.+)$/.exec(request.doneWhen ?? "")?.[1];
  const due = time === undefined ? Number.NaN : Date.parse(time);
  if (!Number.isNaN(due) && (c.now ?? new Date()).getTime() >= due) {
    return { state: "met", who: "board", text: `time ${time ?? ""} reached` };
  }
  return null;
}

/** The requests still open, given what each one's "done when" is now (`conditionEnding`). Pure: it writes nothing, so a board can derive lanes from it. */
export function filterLive<T extends PrFields>(requests: readonly T[], check: Check): T[] {
  return requests.filter((r) => conditionEnding(r, check) === null);
}

/**
 * The open requests whose "done when" holds now, with how each one will end (`conditionEnding`). A read: it writes
 * nothing. Only the running board's tick records the ending, with its wake; `braid requests` shows these as still open.
 */
export function holding(requests: readonly Request[], check: Check): Map<string, Ending> {
  const ends = new Map<string, Ending>();
  for (const r of requests) {
    const e = conditionEnding(r, check);
    if (e !== null) {
      ends.set(r.code, e);
    }
  }
  return ends;
}

/**
 * The requests of the items `match` keeps that the user or the PM answered, as decision rows: the answer's
 * time (`YYYY-MM-DD HH:MM`, as log entries have it), the item, and the request with its answer and the PM's
 * reason. Read for `braid decisions` and the recap draft, next to the `Decided:` log entries.
 */
export function answeredRows(requests: readonly Request[], match: (id: string) => boolean): { at: string; id: string; text: string }[] {
  return requests.flatMap((r) => {
    const e = r.state === "answered" ? closing(r) : null;
    if (e === null || (e.by !== "user" && e.by !== "pm") || !match(r.id)) {
      return [];
    }
    const said = e.text === undefined ? "" : ` -> ${e.text.replace(/\s+/g, " ").trim()}`;
    const reason = e.reason === undefined ? "" : ` (reason: ${e.reason})`;
    return [{ at: e.at.slice(0, 16).replace("T", " "), id: r.id, text: `${r.code} answered by ${e.by === "pm" ? "the PM" : "the user"}: ${r.text}${said}${reason}` }];
  });
}

/** `5m`, `2h`, `3d`: the age of a request. */
export function age(at: string, now: Date): string {
  const min = Math.max(0, Math.floor((now.getTime() - new Date(at).getTime()) / 60_000));
  return min < 60 ? `${min}m` : min < 2880 ? `${Math.floor(min / 60)}h` : `${Math.floor(min / 1440)}d`;
}
