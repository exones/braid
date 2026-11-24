// What a running board knows of an open wait (a request to another braid's coordinator) or an open request to the PM, beyond
// the record: who gets its reminders, whether its estimate has passed, and when it was last reminded or escalated
// (docs/board.md "Reminders"). Pure: the reminder step (src/board/remind.ts) and the cards (src/board/model.ts) both read it.
import { BRAID_TO, isTimedWait, isWait, type Request } from "../braids/requests.js";
import type { PlanRead } from "./plans.js";
import type { T3 } from "./t3.js";

/** How often an addressee is reminded at most. */
export const REMIND_MS = 60 * 60_000;

/** Who a reminder goes to: the waited-on braid's coordinator, or the PM (a request to the PM, or a wait on a braid with no coordinator in a PM-run braid). */
export type Addressee =
  | { readonly to: "coordinator"; readonly braid: string; readonly thread: string }
  | { readonly to: "pm"; readonly thread: string; /** The waited-on braid that has no coordinator thread; absent for a request to the PM. */ readonly braid?: string }
  | { readonly to: "gone" };

/** The braid an item id belongs to (`0042` of `0042/B`); null for a programme's request. */
export const braidOfId = (id: string): string | null => /^(\d{4})(?:\/|$)/.exec(id)?.[1] ?? null;

/** Whether the board reminds this request: an open wait on a braid, or an open request to the PM it hasn't forwarded. Never one to the user, nor a timed wait (no one to remind). */
export const remindable = (r: Request): boolean => r.state === "open" && braidOfId(r.id) !== null && ((isWait(r) && !isTimedWait(r)) || (r.to === "pm" && r.forwarded === undefined));

/** The PM thread of a PM-run braid: the thread of the plan that has it as a row; null when no plan does. */
export function pmThreadOf(braid: string, plans: readonly PlanRead[] | undefined): string | null {
  for (const p of plans ?? []) {
    if (p.plan !== null && p.plan.thread !== null && p.plan.rows.some((row) => row.braid === braid)) {
      return p.plan.thread;
    }
  }
  return null;
}

/** Whether T3 lists the thread and it isn't archived. */
const alive = (t3: T3, thread: string | null | undefined): thread is string => thread != null && thread !== "" && t3.states?.has(thread) === true && t3.states.get(thread) !== "archived";

/** Who gets this request's reminders now; null when T3 can't be read, so it can't be told. */
export function addresseeOf(r: Request, t3: T3, plans: readonly PlanRead[] | undefined): Addressee | null {
  if (t3.status.state !== "ok") {
    return null;
  }
  if (r.to === "pm") {
    return alive(t3, r.pm) ? { to: "pm", thread: r.pm } : { to: "gone" };
  }
  const braid = r.to !== undefined && BRAID_TO.test(r.to) ? r.to : null;
  if (braid === null) {
    return null;
  }
  const coordinator = t3.coordinators?.get(braid) ?? t3.idleCoordinators?.get(braid);
  if (coordinator !== undefined) {
    return { to: "coordinator", braid, thread: coordinator.id };
  }
  const pm = pmThreadOf(braidOfId(r.id) ?? "", plans);
  return alive(t3, pm) ? { to: "pm", thread: pm, braid } : { to: "gone" };
}

/** The estimate, when it has passed (ISO); null when none is set or it is still to come. */
export function missedEta(r: Pick<Request, "eta">, now: Date): string | null {
  const due = r.eta === null ? Number.NaN : Date.parse(r.eta);
  return !Number.isNaN(due) && now.getTime() >= due ? r.eta : null;
}

/** When the addressee was last sent this request (its opening, or the newest plain reminder), ms. */
export function lastReminded(r: Request): number {
  const sent = r.events.filter((e) => e.event === "reminded" && e.reason === undefined).map((e) => Date.parse(e.at));
  return Math.max(Date.parse(r.at), ...sent.filter((t) => !Number.isNaN(t)));
}

/** Whether a reminder is due: an hour since the last one, and its estimate, if set, has come. */
export function reminderDue(r: Request, now: Date): boolean {
  const due = r.eta === null ? Number.NaN : Date.parse(r.eta);
  return (Number.isNaN(due) || now.getTime() >= due) && now.getTime() - lastReminded(r) >= REMIND_MS;
}

/** Whether the board already escalated this request since its last estimate (a `reminded` event with a reason after the newest `eta`). */
export function escalated(r: Request): boolean {
  const eta = r.events.findLast((e) => e.event === "eta")?.at ?? "";
  return r.events.some((e) => e.event === "reminded" && e.reason !== undefined && e.at >= eta);
}
