// A request as the board shows it: one row per request on an item's Requests tab and on the asking braid's card.
// Pure: it reads the signals (the open requests and the closed ones) and T3's thread links, and writes nothing.
import { actOf, age, askerOf, closing, handleOf, isTimedWait, isWait, programmeOf, type Asker, type Request, type State, type Who } from "../braids/requests.js";
import type { Signals } from "./model.js";
import { linkOfThread } from "./model.js";
import { clock } from "./pause.js";
import { routeOf, viaNote } from "./pm.js";
import type { T3 } from "./t3.js";

/** How many closed requests the tab keeps in its data; the page shows the first 10 and "Show more". */
export const CLOSED_KEPT = 200;
/** How many closed requests the tab shows at first, and how many more each press of Show more adds. */
export const CLOSED_PAGE = 10;

export interface RequestRow {
  readonly code: string;
  /** The one handle it is shown and copied as (`yellow-bear-5asx`, or `q-7f3k` for a record without words). */
  readonly handle: string;
  /** The items answering it unblocks while it is open (empty once closed), and what happens about it (`actWord`): `decide`, `do`, `merge`, or for a wait `waits for 0077`, `until 21:00`. */
  readonly blocks: readonly string[];
  readonly act: string;
  /** An open request that reached the user from the PM, marked as its card's need line is: `words` leads the text ("Escalated to you:"), `why` ends it; null otherwise. */
  readonly mark: { readonly words: string; readonly why: string } | null;
  /** The item that asked: `0004/B`. */
  readonly item: string;
  readonly kind: Request["kind"];
  readonly text: string;
  readonly state: State;
  readonly by: Asker;
  /** `user`, `pm`, another braid's number, or `self` (a timed wait). */
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
  /** The addressee's estimate (ISO), from `braid eta`; null when none. */
  readonly eta: string | null;
  /** Its opening, estimates and reminders, oldest first, while it is open: the details panel lists them under a wait. */
  readonly history: readonly { readonly event: string; readonly at: string; readonly by: Who; readonly text: string | null; readonly reason: string | null }[];
  /** How it ended; null while open. */
  readonly closed: { readonly at: string; readonly by: Who; /** The answer, or the reason it was withdrawn or met. */ readonly text: string | null; /** The PM's reason, when the PM answered. */ readonly reason: string | null } | null;
}

export interface RequestsView {
  /** Open and asking the user (or the PM first). */
  readonly open: readonly RequestRow[];
  /** Open, addressed to another braid's coordinator, or a timed wait. */
  readonly waiting: readonly RequestRow[];
  /** Answered (waits left out), newest first: the question, the answer, who answered (the PM with its reason) and when. */
  readonly decided: readonly RequestRow[];
  /** Withdrawn or met, and answered waits, newest first. */
  readonly closed: readonly RequestRow[];
}

/** What happens about a request, in a few words: a wait says what it waits for, from its own meaning; anything else `actOf` its kind. */
export const actWord = (r: Pick<Request, "kind" | "to" | "doneWhen">, now: Date): string =>
  isTimedWait(r) ? `until ${clock(r.doneWhen.slice("time:".length), now)}` : isWait(r) ? `waits for ${r.to ?? ""}` : actOf(r.kind);

/** The mark of an open request that reached the user from the PM (`routeOf`); a forward's note has its own line, so `why` is an escalation's only. */
function markOf(r: Request, now: Date, t3: T3, paused: boolean): RequestRow["mark"] {
  if (r.state !== "open" || isWait(r)) {
    return null;
  }
  const routed = routeOf(r, now, t3, paused);
  return "via" in routed ? { words: routed.words, why: routed.via === "forwarded" ? "" : viaNote(routed.via, r, now) } : null;
}

export function rowOf(r: Request, now: Date, t3: T3, blocks: readonly string[] = [], paused = false): RequestRow {
  const end = closing(r);
  return {
    code: r.code,
    handle: handleOf(r),
    blocks: r.state === "open" ? blocks : [],
    act: actWord(r, now),
    mark: markOf(r, now, t3, paused),
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
    eta: r.eta,
    history: r.state !== "open" ? [] : r.events.filter((e) => e.event === "opened" || e.event === "eta" || e.event === "reminded").map((e) => ({ event: e.event, at: e.at, by: e.by, text: e.text ?? null, reason: e.reason ?? null })),
    closed: end === null ? null : { at: end.at, by: end.by, text: end.text ?? null, reason: end.reason ?? null },
  };
}

/** The number on the Requests tab: all of the item's requests, the decided ones too. */
export const requestCount = (view: RequestsView): number => view.open.length + view.waiting.length + view.decided.length + view.closed.length;

/** The requests of the items `match` keeps: its open ones, the ones waiting on another braid, and the closed ones, newest first. */
export function requestsOf(match: (id: string) => boolean, sig: Signals, t3: T3): RequestsView {
  const rows = (rs: readonly Request[]): RequestRow[] => rs.filter((r) => match(r.id) && programmeOf(r.id) === null).map((r) => rowOf(r, sig.now, t3, sig.unblocks?.(r) ?? [], sig.pauses?.has(r.id.slice(0, 4)) === true));
  const ended = rows(sig.closed ?? []).sort((a, b) => (a.closed?.at ?? "") < (b.closed?.at ?? "") ? 1 : -1);
  // A wait is nobody's decision, however it ended (an old record may read "answered by the user").
  const decided = (r: RequestRow): boolean => r.state === "answered" && !isWait(r);
  return {
    open: rows([...sig.requests.values(), ...(sig.asks?.values() ?? [])]).sort((a, b) => (a.at < b.at ? 1 : -1)),
    waiting: rows(sig.waits ?? []).sort((a, b) => (a.at < b.at ? 1 : -1)),
    decided: ended.filter(decided).slice(0, CLOSED_KEPT),
    closed: ended.filter((r) => !decided(r)).slice(0, CLOSED_KEPT),
  };
}

/** Whether a request is a wait, not asking the user: addressed to another braid's coordinator, or a timed wait (`to: self`). */
export const toBraid = (r: Pick<Request, "to">): boolean => isWait(r);
