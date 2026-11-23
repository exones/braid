// Requests: what a coordinator or the PM needs from someone, on the record. Each request is one JSON file,
// `requests/<code>.json`, on the branch `braid-requests`, written only by braid commands through the shared
// data branch code (src/braids/gitbranch.ts). Its fields are fixed when it opens; every later change is an
// event appended to `events`, and its state is read from them. Nothing is ever deleted.
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, renameSync } from "node:fs";
import { dirname, join } from "node:path";
import { catBatchSync } from "./gitio.js";
import { currentFiles, lockedBranch, tips, writeBranchUnlocked, type BranchSpec, type BranchView, type WriteResult } from "./gitbranch.js";
import { mainCheckout } from "./state.js";

export { ensureStateDir, LockError, locked, mainCheckout, takeOverStale } from "./state.js";

/** `action` is something only the user can do (an install, a login); only the PM opens one. */
export const KINDS = ["review", "question", "decision", "plan", "action"] as const;
export type Kind = (typeof KINDS)[number];

/** Who opened a request: the braid's coordinator, or the programme manager asking the user itself. */
export type Asker = "coordinator" | "pm";

/** Who did something to a request. */
export type Who = "user" | "pm" | "coordinator" | "board";

export const STATES = ["open", "answered", "withdrawn", "met"] as const;
/** `answered`, `withdrawn` (with a reason) and `met` (its "done when" held) are final. */
export type State = (typeof STATES)[number];

export const EVENTS = ["opened", "forwarded", "answered", "withdrawn", "met", "eta"] as const;
export type EventKind = (typeof EVENTS)[number];

export interface RequestEvent {
  readonly event: EventKind;
  /** ISO time. */
  readonly at: string;
  readonly by: Who;
  /** The answer, the forward's note, the reason it was withdrawn or met, the estimate. */
  readonly text?: string;
  /** The PM's reason, when the PM answered for the user (filled by 0070/B). */
  readonly reason?: string;
}

/** The record's branch. */
export const REQUESTS_BRANCH = "braid-requests";
const FOLDER = "requests";
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
  /** Whom it is for: `pm` (the programme manager answers first) or `user`; `user` once forwarded. Without it, the user's. */
  readonly to?: "user" | "pm";
  /** The PM's thread (id) of a request to the PM, from the brief's `PM-run (thread <id>)` line. */
  readonly pm?: string;
  /** When the PM forwarded it to the user (`braid forward`), ISO: the `forwarded` event. */
  readonly forwarded?: string;
  /** The PM's note with the forward. */
  readonly note?: string;
  /** When it is done: `answered` (the default), `pr:<n>` merged, `braid:<number>` merged into main, `time:<iso>`. */
  readonly doneWhen: string;
  /** The estimate (P6); null until set. */
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
  const to = forward !== undefined ? "user" : v["to"] === "pm" ? "pm" : undefined;
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
    eta: typeof v["eta"] === "string" ? v["eta"] : null,
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

export const REQUESTS: BranchSpec = { branch: REQUESTS_BRANCH, folders: [FOLDER], lock: "requests", what: "the requests record", noun: "request", merge: mergeRecord };

/** Who asked; an old record without `by` is the coordinator's. */
export const askerOf = (r: Pick<Request, "by">): Asker => r.by ?? "coordinator";

/** `pm/<slug>`: the id of a programme request; the slug, or null for any other id. */
export const programmeOf = (id: string): string | null => /^pm\/(.+)$/.exec(id)?.[1] ?? null;

const same = (r: Request, id: string, by: Asker | undefined): boolean => r.id === id && (by === undefined || askerOf(r) === by);

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
  const paths = view.paths();
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
  const files = [...currentFiles(root, REQUESTS, at)];
  const texts = catBatchSync(root, files.map(([, blob]) => blob));
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

/** An open request with its `opened` event, as `openRequest` writes it; `code` given or empty. Also for demos and tests. */
export function newRecord(request: NewRequest & { readonly code?: string }): Request {
  const { doneWhen, code, ...fields } = request;
  return { ...fields, code: code ?? "", doneWhen: doneWhen ?? (request.pr === undefined ? "answered" : `pr:${request.pr}`), eta: null, state: "open", events: [{ event: "opened", at: request.at, by: askerOf(request) }] };
}

const withEvent = (r: Request, e: RequestEvent): Request => ({ ...r, events: [...r.events, e] });

/**
 * Opens a request and returns its code. The open one on the same item from the same asker is withdrawn,
 * "replaced by q-…"; the other asker's stays.
 */
export function openRequest(root: string, request: NewRequest): { readonly code: string; readonly warning: string | null } {
  let code = "";
  const result = writeRecord(root, (view) => {
    const all = viewAll(view).requests;
    code = newCode((c) => view.has(pathOf(c)));
    const by = askerOf(request);
    const files = new Map<string, string>();
    for (const old of all.filter((r) => r.state === "open" && same(r, request.id, by))) {
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
  readonly at?: string;
}

/**
 * Closes the item's open request of this asker (without `by`: of both) with an event, never a delete; true
 * when there was one. `end` may depend on the request (a review is met, a question withdrawn).
 */
export function closeRequest(root: string, id: string, by: Asker | undefined, end: Ending | ((r: Request) => Ending)): boolean {
  // Nothing to close: no lock, no write (start and accept call this on every item).
  if (!loadRequests(root).some((r) => same(r, id, by))) {
    return false;
  }
  let found = false;
  writeRecord(root, (view) => {
    const files = new Map<string, string>();
    for (const r of viewAll(view).requests.filter((x) => x.state === "open" && same(x, id, by))) {
      const e = typeof end === "function" ? end(r) : end;
      files.set(pathOf(r.code), serialise(withEvent(r, { event: e.state, at: e.at ?? new Date().toISOString(), by: e.who, ...(e.text === undefined ? {} : { text: e.text }) })));
    }
    found = files.size > 0;
    return { files, message: `docs(requests): ${id} closed` };
  });
  return found;
}

/** Hands the item's request to the user (`braid forward`): a `forwarded` event with the note. Null when there is no open request. */
export function forwardRequest(root: string, id: string, at: string, note: string | undefined): Request | null {
  let out: Request | null = null;
  writeRecord(root, (view) => {
    const old = viewAll(view).requests.find((r) => r.state === "open" && same(r, id, "coordinator"));
    if (old === undefined) {
      out = null;
      return { files: new Map(), message: "" };
    }
    const next = withEvent(old, { event: "forwarded", at, by: "pm", ...(note === undefined ? {} : { text: note }) });
    out = { ...next, to: "user", forwarded: at, ...(note === undefined ? {} : { note }) };
    return { files: new Map([[pathOf(old.code), serialise(next)]]), message: `docs(requests): ${id} ${old.code} forwarded` };
  });
  return out;
}

/** A review request is void when its PR is no longer open (in any letter case) or is at another head (the full sha). A PR that can't be read (null) leaves it. */
export function voided(request: Pick<Request, "kind" | "head">, pr: PrNow): boolean {
  return request.kind === "review" && pr !== null && (pr.state.toUpperCase() !== "OPEN" || (request.head !== undefined && pr.headRefOid !== request.head));
}

/** How a void review request ends: met when its PR merged, withdrawn when it closed or its head moved. */
export function voidEnding(request: Pick<Request, "pr" | "head">, pr: NonNullable<PrNow>): Ending {
  const state = pr.state.toUpperCase();
  if (state === "MERGED") {
    return { state: "met", who: "board", text: `PR #${request.pr ?? ""} merged` };
  }
  if (state !== "OPEN") {
    return { state: "withdrawn", who: "board", text: `PR #${request.pr ?? ""} ${state.toLowerCase()}` };
  }
  return { state: "withdrawn", who: "board", text: `PR #${request.pr ?? ""} head moved to ${pr.headRefOid.slice(0, 7)}` };
}

/** The requests still open, given what each review request's PR is now. Pure: it writes nothing, so a board can derive lanes from it. */
export function filterLive<T extends Pick<Request, "kind" | "head" | "pr">>(requests: readonly T[], prOf: (number: number) => PrNow): T[] {
  return requests.filter((r) => !(r.pr !== undefined && voided(r, prOf(r.pr))));
}

/**
 * The open requests, with each void review request recorded as met (its PR merged) or withdrawn (closed, or
 * its head moved). GitHub is asked without the lock; the write then ends only the requests still open.
 */
export function liveRequests(root: string, prOf: (number: number) => PrNow): Request[] {
  const seen = loadRequests(root);
  const ends = new Map<string, Ending>();
  for (const r of seen) {
    const pr = r.pr === undefined ? null : prOf(r.pr);
    if (pr !== null && voided(r, pr)) {
      ends.set(r.code, voidEnding(r, pr));
    }
  }
  if (ends.size === 0) {
    return seen;
  }
  const at = new Date().toISOString();
  writeRecord(root, (view) => {
    const files = new Map<string, string>();
    for (const r of viewAll(view).requests.filter((x) => x.state === "open")) {
      const e = ends.get(r.code);
      if (e !== undefined) {
        files.set(pathOf(r.code), serialise(withEvent(r, { event: e.state, at, by: e.who, ...(e.text === undefined ? {} : { text: e.text }) })));
      }
    }
    return { files, message: `docs(requests): ${files.size} review ${files.size === 1 ? "request" : "requests"} ended by their PR` };
  });
  // Read again: another writer may have opened or closed one meanwhile.
  return loadRequests(root);
}

/** `5m`, `2h`, `3d`: the age of a request. */
export function age(at: string, now: Date): string {
  const min = Math.max(0, Math.floor((now.getTime() - new Date(at).getTime()) / 60_000));
  return min < 60 ? `${min}m` : min < 2880 ? `${Math.floor(min / 60)}h` : `${Math.floor(min / 1440)}d`;
}
