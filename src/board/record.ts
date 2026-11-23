// A request as the board shows it: one row per request on an item's Requests tab and on the asking braid's card.
// Pure: it reads the signals (the open requests and the closed ones) and T3's thread links, and writes nothing.
import { age, askerOf, BRAID_TO, closing, programmeOf, type Asker, type Request, type State, type Who } from "../braids/requests.js";
import type { Signals } from "./model.js";
import { linkOfThread } from "./model.js";
import type { T3 } from "./t3.js";

/** How many closed requests the tab keeps in its data; the page shows the first 10 and "Show more". */
export const CLOSED_KEPT = 200;
/** How many closed requests the tab shows at first, and how many more each press of Show more adds. */
export const CLOSED_PAGE = 10;

export interface RequestRow {
  readonly code: string;
  /** The item that asked: `0004/B`. */
  readonly item: string;
  readonly kind: Request["kind"];
  readonly text: string;
  readonly state: State;
  readonly by: Asker;
  /** `user`, `pm`, or another braid's number. */
  readonly to: string;
  /** `answered`, `pr:5`, `braid:0002` or `time:<iso>`. */
  readonly doneWhen: string;
  /** When it was opened (ISO) and its age at this read (`35m`). */
  readonly at: string;
  readonly age: string;
  /** The T3 link of the asking thread; null when T3 doesn't list it. */
  readonly link: string | null;
  /** The PM's forward note, when the PM handed it to the user. */
  readonly note: string | null;
  /** How it ended; null while open. */
  readonly closed: { readonly at: string; readonly by: Who; /** The answer, or the reason it was withdrawn or met. */ readonly text: string | null; /** The PM's reason, when the PM answered. */ readonly reason: string | null } | null;
}

export interface RequestsView {
  /** Open and asking the user (or the PM first). */
  readonly open: readonly RequestRow[];
  /** Open, addressed to another braid's coordinator. */
  readonly waiting: readonly RequestRow[];
  /** Answered, withdrawn or met, newest first. */
  readonly closed: readonly RequestRow[];
}

export function rowOf(r: Request, now: Date, t3: T3): RequestRow {
  const end = closing(r);
  return {
    code: r.code,
    item: r.id,
    kind: r.kind,
    text: r.kind === "review" && r.pr !== undefined ? `Merge PR #${r.pr}` : r.text,
    state: r.state,
    by: askerOf(r),
    to: r.to ?? "user",
    doneWhen: r.doneWhen,
    at: r.at,
    age: age(r.at, now),
    link: linkOfThread(t3, r.thread),
    note: r.note ?? null,
    closed: end === null ? null : { at: end.at, by: end.by, text: end.text ?? null, reason: end.reason ?? null },
  };
}

/** The requests of the items `match` keeps: its open ones, the ones waiting on another braid, and the closed ones, newest first. */
export function requestsOf(match: (id: string) => boolean, sig: Signals, t3: T3): RequestsView {
  const rows = (rs: readonly Request[]): RequestRow[] => rs.filter((r) => match(r.id) && programmeOf(r.id) === null).map((r) => rowOf(r, sig.now, t3));
  const closed = rows(sig.closed ?? []).sort((a, b) => (a.closed?.at ?? "") < (b.closed?.at ?? "") ? 1 : -1);
  return {
    open: rows([...sig.requests.values(), ...(sig.asks?.values() ?? [])]).sort((a, b) => (a.at < b.at ? 1 : -1)),
    waiting: rows(sig.waits ?? []).sort((a, b) => (a.at < b.at ? 1 : -1)),
    closed: closed.slice(0, CLOSED_KEPT),
  };
}

/** Whether a request is addressed to another braid's coordinator. */
export const toBraid = (r: Pick<Request, "to">): boolean => r.to !== undefined && BRAID_TO.test(r.to);
