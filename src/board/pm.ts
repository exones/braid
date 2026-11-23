// Requests addressed to the programme manager (PM): whom a request is for right now, derived at each read
// from the request, the clock, the PM's thread in T3 and the braid's pause. Pure; the board writes nothing.
import { age, type Request } from "../braids/requests.js";
import type { PlanRead } from "./plans.js";
import type { T3 } from "./t3.js";

/** A question, decision or plan escalates when the PM hasn't answered for this long. */
export const PM_QUESTION_MS = 20 * 60_000;
/** A handover (a review) escalates after this long: the PM's live check can take most of an hour. */
export const PM_REVIEW_MS = 60 * 60_000;

/** The PM's thread states that mean no one is there to answer. */
const GONE = new Set(["archived", "failed", "error", "errored"]);

export type Via = "timeout" | "gone" | "forwarded";

export type Routed =
  /** The user's, as before. */
  | { readonly to: "user" }
  /** The PM answers first: no lane change, no push. */
  | { readonly to: "pm" }
  /** It reached the user's side: `since` (ISO) keys the one push, `words` leads the need line. */
  | { readonly to: "user"; readonly via: Via; readonly since: string; readonly words: string };

/** What a forwarded request's line starts with on the braid's own card. */
export const FORWARDED_WORDS = "Forwarded by the PM:";

/** Whether a programme that runs now (a plan neither done nor stopped) lists the braid of this item. */
export function runByProgramme(plans: readonly PlanRead[] | undefined, id: string): boolean {
  const number = id.slice(0, 4);
  return (plans ?? []).some((p) => p.plan !== null && p.plan.state !== "done" && p.plan.state !== "stopped" && p.plan.rows.some((r) => r.braid === number));
}

/**
 * A forwarded request that is the PM asking the user, not the braid: it came from a PM-run braid and is no handover
 * (a forwarded merge joins the merge push, 0069/C). The programme's panel shows it; the braid's card keeps its lane.
 */
export const throughPm = (req: Request, routed: Routed, plans: readonly PlanRead[] | undefined): boolean =>
  "via" in routed && routed.via === "forwarded" && req.kind !== "review" && runByProgramme(plans, req.id);

/** Whether the PM's thread can't answer: archived, failed, or unknown to T3. null when T3 wasn't read (nothing can be told). */
export function pmGone(t3: T3, thread: string | undefined): boolean | null {
  if (t3.status.state !== "ok" || t3.states === undefined) {
    return null;
  }
  const state = thread === undefined ? undefined : t3.states.get(thread);
  return state === undefined || GONE.has(state);
}

/**
 * Whom a request is for now. A request with no `to` is the user's. A forwarded request reads as the user's with
 * "Forwarded by the PM:". A request to the PM escalates after 20 min (a handover: 60), when its PM thread is
 * gone, and never while the braid is paused or held: a pause keeps it, a forwarded one too, with the PM until `braid resume`.
 */
export function routeOf(req: Request, now: Date, t3: T3, paused: boolean): Routed {
  // A pause or hold keeps every request to the PM with the PM, a forwarded one too, until `braid resume`.
  if (paused && (req.to === "pm" || req.forwarded !== undefined)) {
    return { to: "pm" };
  }
  if (req.forwarded !== undefined) {
    return { to: "user", via: "forwarded", since: req.forwarded, words: FORWARDED_WORDS };
  }
  if (req.to !== "pm") {
    return { to: "user" };
  }
  const limit = req.kind === "review" ? PM_REVIEW_MS : PM_QUESTION_MS;
  if (now.getTime() - Date.parse(req.at) >= limit) {
    return { to: "user", via: "timeout", since: req.at, words: "Escalated:" };
  }
  return pmGone(t3, req.pm) === true ? { to: "user", via: "gone", since: req.at, words: "Escalated:" } : { to: "pm" };
}

/** Why an escalated request reached the user, for the end of its line. */
export function viaNote(via: Via, req: Request, now: Date): string {
  if (via === "forwarded") {
    return req.note === undefined ? "" : ` — ${req.note}`;
  }
  return via === "timeout" ? ` (the PM hasn't answered for ${age(req.at, now).replace(/m$/, " min").replace(/h$/, " h").replace(/d$/, " d")})` : " (the PM thread is gone)";
}

/** What a card says of a request the PM is handling. */
export interface PmLine {
  /** `The PM is handling: <text>` (a handover: `The PM is checking: <text>`). */
  readonly text: string;
  /** `40 s ago`-style age: `3m`. */
  readonly age: string;
  /** When it was sent to the PM (ISO). */
  readonly since: string;
  readonly kind: Request["kind"];
  /** True for a forwarded request the user is asked, through the PM: the PM isn't handling it. */
  readonly forwarded?: boolean;
}

export function pmLine(req: Request, now: Date): PmLine {
  const checking = req.kind === "review";
  const text = checking && req.pr !== undefined ? `PR #${req.pr}, its live check runs` : req.text;
  return { text: `The PM is ${checking ? "checking" : "handling"}: ${text}`, age: age(req.at, now), since: req.at, kind: req.kind };
}

/** The card's quiet line for a request forwarded to the user, through the PM. */
export function forwardedLine(req: Request, now: Date): PmLine {
  return { text: `Waiting on the user, through the PM: ${req.text}`, age: age(req.forwarded ?? req.at, now), since: req.forwarded ?? req.at, kind: req.kind, forwarded: true };
}
