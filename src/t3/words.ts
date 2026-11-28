// The words of the board's T3 sign-in: the button's tooltip and panel lines and the two pushes (docs/board.md,
// "T3 sign-in"). Pure (no Node.js), so the page uses it too. "T3 sign-in" is this; "board address" is the board's own.
import { clock } from "../board/pause.js";

/** How long before the end the button turns amber and the one warning push goes. */
export const SOON_MS = 5 * 86_400_000;

/** Why the board is signed out. */
export type OutReason = "not signed in" | "refused" | "ended" | "no secret store";

/** The sign-in as the board's page and API see it: never the token. */
export interface SignInView {
  /** `in`, `soon` (in, ending within 5 days), `out` (with `reason`). */
  readonly state: "in" | "soon" | "out";
  readonly reason: OutReason | null;
  /** T3's address; null when not signed in. */
  readonly origin: string | null;
  readonly expiresAt: string | null;
  /** When T3 refused the sign-in (a 401), for `reason: refused`. */
  readonly refusedAt: string | null;
  /** `~/.braid/t3.json`'s access: `cli` keeps the board on the command line even when signed in. */
  readonly access: "auto" | "cli";
  /** A sign-in from the button waiting for T3's answer: until when; null for none. */
  readonly waitingUntil: string | null;
}

const LEVEL = "Full access";

/** `Dec 26` or `Dec 26 14:20`: the day, with the time when `time`. */
function day(iso: string, time = false): string {
  const c = clock(iso, new Date(0));
  return time ? c : c.replace(/ \d\d:\d\d$/, "");
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
/** `Sat Dec 26 14:20`. */
export function fullDate(iso: string): string {
  return `${DAYS[new Date(iso).getDay()] ?? ""} ${clock(iso, new Date(0))}`;
}

/** The look the button takes: one of the four states, `none` (no secret store: faint, not clickable) or `wait`. */
export function buttonTone(v: SignInView): "in" | "soon" | "out" | "bad" | "none" | "wait" {
  if (v.waitingUntil !== null) {
    return "wait";
  }
  if (v.state !== "out") {
    return v.state;
  }
  return v.reason === "no secret store" ? "none" : v.reason === "not signed in" ? "out" : "bad";
}

/** The tooltip: the state on the first line, what to do on the second (the mockups, 0080/D). */
export function tooltip(v: SignInView, now: Date, remote: boolean): { readonly head: string; readonly hint: string } {
  const signIn = remote ? "Sign in from the board on the PC, or run braid t3 login." : "Click to sign in again, or run braid t3 login.";
  if (v.waitingUntil !== null) {
    return { head: "T3 sign-in: waiting for T3's approval", hint: `Approve "braid board" at ${LEVEL} in the tab that opened, until ${clock(v.waitingUntil, now)}.` };
  }
  switch (v.state) {
    case "in":
      return { head: `T3 sign-in: signed in · ${LEVEL} · until ${day(v.expiresAt ?? "")}`, hint: "Click for the details or to sign out." };
    case "soon":
      return { head: `T3 sign-in ends on ${day(v.expiresAt ?? "")}; run braid t3 login`, hint: `Signed in · ${LEVEL} · until ${day(v.expiresAt ?? "", true)}. ${remote ? "Sign in again from the board on the PC." : "Click to sign in again."}` };
    default:
      break;
  }
  switch (v.reason) {
    case "refused":
      return { head: "Signed out: T3 refused the sign-in (revoked in T3)", hint: `The board uses the t3 command line. ${signIn}` };
    case "ended":
      return { head: `Signed out: the T3 sign-in ended on ${day(v.expiresAt ?? "")}`, hint: `The board uses the t3 command line. ${signIn}` };
    case "no secret store":
      return { head: "Signed out: no secret store on this host", hint: "The board uses the t3 command line. A T3 sign-in needs the OS secret store." };
    default:
      return { head: "Sign in to T3", hint: remote ? "Not signed in: sign in from the board on the PC, or run braid t3 login." : `Not signed in: the board uses the t3 command line. Click to sign in at ${LEVEL}, or run braid t3 login.` };
  }
}

/** `T3 sign-in: signed in at <origin> · Full access · until <date> (in 30 d)`: the line of `braid t3 status`. */
export function statusLine(v: SignInView, now: Date): string {
  if (v.state === "out") {
    const why = v.reason === "ended" ? `ended on ${fullDate(v.expiresAt ?? "")}` : v.reason === "refused" ? "T3 refused it" : (v.reason ?? "not signed in");
    return `T3 sign-in: signed out (${why})${v.reason === "no secret store" ? "" : "; run braid t3 login"}`;
  }
  const days = Math.max(0, Math.round((Date.parse(v.expiresAt ?? "") - now.getTime()) / 86_400_000));
  return `T3 sign-in: signed in at ${v.origin ?? "?"} · ${LEVEL} · until ${fullDate(v.expiresAt ?? "")} (in ${days} d)${v.state === "soon" ? "; it ends soon: run braid t3 login" : ""}`;
}

/** A push's words. */
export interface T3Push {
  readonly key: string;
  readonly title: string;
  readonly body: string;
}

/** The one push 5 days before the end, keyed by the sign-in's end so it goes once per sign-in. */
export function soonPush(expiresAt: string): T3Push {
  return {
    key: `t3-soon|${expiresAt}`,
    title: `braid: T3 sign-in ends on ${day(expiresAt)}`,
    body: `The board's sign-in to T3 ends ${fullDate(expiresAt)}. Run braid t3 login on the PC, or use the T3 button on the board there.`,
  };
}

/** The one push when T3 refuses the sign-in (a 401), once per sign-in. */
export function refusedPush(expiresAt: string): T3Push {
  return {
    key: `t3-refused|${expiresAt}`,
    title: "braid: T3 refused the board's sign-in",
    body: "The board is signed out of T3 and uses the t3 command line again. Run braid t3 login on the PC to sign in again.",
  };
}
