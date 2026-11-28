// What the page knows of an answer, acknowledgement or dismissal it sent (docs/board.md, "While it sends"): the record
// write takes seconds on a loaded machine, and a reload in the middle must not offer the buttons again. Pure, so tests
// can check it; web/src/sends.ts keeps the list in the browser's local storage and sends.

/** After this long still sending, the page says the record is being written. */
export const STILL_AFTER_MS = 5_000;
/** A send whose page was reloaded, and that the record still doesn't show after this long, may be pressed again. */
export const UNCONFIRMED_AFTER_MS = 90_000;
/** How long the line of a request that has left the open list stays. */
export const KEPT_MS = 30_000;

export interface Send {
  readonly project: string;
  readonly handle: string;
  /** Which button: an option letter, `text` (the field), `ack` or `dismiss`. */
  readonly press: string;
  /** What it says: `A · Half-up`, the typed line, `Acknowledge`, `Dismiss`. */
  readonly label: string;
  readonly started: number;
  /** `sent`: recorded; `failed`: not recorded, may be pressed again; `closed`: refused because the request is already closed. */
  readonly phase: "sending" | "sent" | "failed" | "closed";
  /** The refusal or the error in words, or what a sent one still has to say (the asker not woken yet). */
  readonly note: string | null;
  /** When the request was first seen gone from the open list; null while it is still listed. */
  readonly gone: number | null;
}

export const sendKey = (project: string, handle: string): string => `${project}/${handle}`;

/** What a send shows now. `alive`: this page still waits for the reply (false after a reload). */
export function stageOf(s: Send, now: number, alive: boolean): "sending" | "still" | "sent" | "failed" | "closed" | "unconfirmed" {
  if (s.phase !== "sending") {
    return s.phase;
  }
  if (!alive && now - s.started >= UNCONFIRMED_AFTER_MS) {
    return "unconfirmed";
  }
  return now - s.started >= STILL_AFTER_MS ? "still" : "sending";
}

/** Whether the request's buttons may be pressed: no send of it, or one that failed or was never confirmed. */
export const mayPress = (stage: ReturnType<typeof stageOf> | null): boolean => stage === null || stage === "failed" || stage === "unconfirmed";

/** A refusal's words without the action's lead; `closed` when the request is already answered, withdrawn or met. */
export function refusal(message: string): { readonly phase: "failed" | "closed"; readonly note: string } {
  const note = message.replace(/^Answer: /, "").replace(/; nothing changed$/, "");
  return { phase: / is already (answered|withdrawn|met)\b/.test(message) ? "closed" : "failed", note };
}

/** The list as the record shows it now (`open`: the keys of the open requests): a send whose request left is marked, and dropped `KEPT_MS` later. */
export function settle(sends: readonly Send[], open: ReadonlySet<string>, now: number): Send[] {
  return sends.flatMap((s) => {
    if (open.has(sendKey(s.project, s.handle))) {
      return [s.gone === null ? s : { ...s, gone: null }];
    }
    const gone = s.gone ?? now;
    return now - gone >= KEPT_MS ? [] : [{ ...s, gone }];
  });
}

/** A recorded send of the opened card: the card that keeps its line, and the one to open once a read drops it. */
export interface After {
  readonly key: string;
  readonly next: string | null;
}

/**
 * Which card is open after a read (`listed`: the open requests' keys). A sent request keeps its card, with its "sent"
 * line, while it is listed; once it is gone the one under it opens. A card the user opened meanwhile stays.
 */
export const openedAfter = (opened: string | null, after: After, listed: ReadonlySet<string>): string | null => (!listed.has(after.key) && opened === after.key ? after.next : opened);

/** A request the record shows closed: who and what, for the line of a send that left the open list. */
export interface Closed {
  readonly by: "user" | "pm";
  readonly answer: string;
  readonly outcome: "acknowledged" | "dismissed" | null;
}

/** The line of a send whose request left the open list: who closed it and with what, as the record has it. */
export function goneLine(s: Send, closed: Closed | undefined): string {
  if (closed !== undefined) {
    return closed.outcome !== null ? `${closed.outcome} by you` : `answered by ${closed.by === "pm" ? "the PM" : "you"}: ${closed.answer}`;
  }
  return s.phase === "sent" ? `${s.label} — sent` : (s.note ?? "no longer open");
}

/** The list kept on the device, read leniently: anything that isn't one is empty. */
export function parseSends(text: string | null): Send[] {
  try {
    const list: unknown = JSON.parse(text ?? "[]");
    return Array.isArray(list)
      ? list.filter((s): s is Send => typeof s === "object" && s !== null && ["project", "handle", "press", "label", "phase"].every((k) => typeof (s as Record<string, unknown>)[k] === "string") && typeof (s as Send).started === "number")
      : [];
  } catch {
    return [];
  }
}
