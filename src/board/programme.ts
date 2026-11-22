// Programmes on the board (docs/board.md, "Programmes"): one per `pm/<slug>` plan, derived at each read from the
// plan's front matter, the braid cards, the programme's open request, T3 and the broke clock. Pure apart from the
// clock, which `sig.alarm` keeps. A programme isn't a braid: it never sits in a lane, it sits in the panel.
import { age, type Request } from "../braids/requests.js";
import type { Pause } from "../braids/pauses.js";
import type { Hold, PlanRow, PlanState } from "../braids/plan.js";
import { needOfAsk, type BraidCard, type Lane, type Need, type Signals } from "./model.js";
import type { PlanRead } from "./plans.js";
import type { T3 } from "./t3.js";

/** Where a programme shows: `needs` (it asks you, or it stalled), `working` (the rest that runs or is held), null (done or stopped: off the panel). */
export type Section = "needs" | "working";

export interface ProgrammeRow extends PlanRow {
  /** The braid's lane on the board; null when the row has no braid or the braid isn't on the board. */
  readonly lane: Lane | null;
}

export interface Programme {
  readonly slug: string;
  /** The ref the plan was read from. */
  readonly branch: string;
  /** The plan's title; the slug when the plan can't be read. */
  readonly title: string;
  readonly goal: string | null;
  readonly state: PlanState | null;
  readonly section: Section | null;
  /** The PM thread's id, its T3 link and its state (`running`, `idle`, `failed`, `archived`, `unknown`); null when not recorded or T3 wasn't read. */
  readonly thread: string | null;
  readonly link: string | null;
  readonly pmState: string | null;
  /** The plan's hold, or the pause of every braid not Done; null when it isn't held. */
  readonly hold: Hold | null;
  /** True when every braid of it that isn't Done is paused (a limit or a hold). */
  readonly paused: boolean;
  readonly next: string | null;
  readonly digest: string | null;
  readonly limit: number | null;
  readonly rows: readonly ProgrammeRow[];
  /** Its braid numbers, in row order. */
  readonly braids: readonly string[];
  readonly done: number;
  readonly total: number;
  /** Its braids that run now (an agent, a coordinator, checks). */
  readonly running: number;
  /** The open programme request, or the stall; null otherwise. */
  readonly need: Need | null;
  /** The card's one status line: the hold, what the PM is doing, or next. */
  readonly status: string;
  /** What the PM is handling now, one entry per braid: `0007 plan approval (40 s)`. */
  readonly handling: readonly string[];
  /** For a stall: what the board saw (`PM thread idle · no braid running`). */
  readonly seen: string | null;
  /** `plan unreadable: line 4: …`; null when the plan parsed. */
  readonly error: string | null;
}

export const STALLED_TEXT = "Stalled: the PM stopped and none of its braids is running";

/** The braids a held plan (`hold`, or `state: held`) holds that have no pause record of their own: they read as held, by the PM. */
export function heldPauses(plans: readonly PlanRead[], pauses: ReadonlyMap<string, Pause>, now: Date = new Date()): Map<string, Pause> {
  const out = new Map(pauses);
  for (const p of plans) {
    const plan = p.plan;
    if (plan === null || (plan.hold === null && plan.state !== "held") || plan.state === "done" || plan.state === "stopped") {
      continue;
    }
    for (const row of plan.rows) {
      if (row.braid !== null && row.state !== "done" && row.state !== "dropped" && !out.has(row.braid)) {
        out.set(row.braid, { braid: row.braid, reason: "hold", words: plan.hold?.words ?? null, provider: null, window: null, label: null, usedPercent: null, resetsAt: null, resumeAt: null, task: null, thread: plan.thread ?? "", by: "pm", at: plan.hold?.since ?? now.toISOString() });
      }
    }
  }
  return out;
}

/** Whether a braid card counts as running for its programme: an agent, its coordinator, or checks pending. */
const runs = (card: BraidCard, t3: T3): boolean => card.lane !== "Done" && (card.running || card.activity !== null || t3.coordinators?.has(card.id) === true);

const hhmm = (iso: string): string => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

/**
 * The programmes of one project. `repo` names the stall clock (`<repo>/<slug> pm`, in the project's own
 * `.braid/broke.json`). The clock is asked for every programme at every read, so one that stops holding starts again from zero.
 */
export function toProgrammes(repo: string, plans: readonly PlanRead[], cards: readonly BraidCard[], t3: T3, sig: Signals, gh: { readonly status: { readonly state: string } }): Programme[] {
  const byId = new Map(cards.map((c) => [c.id, c]));
  const requests = new Map((sig.programmes ?? []).map((r) => [r.id, r] as const));
  const live = plans.filter((p) => p.plan === null || p.plan.state === "running" || p.plan.state === "held").length;
  return plans.map((read) => programmeOf(repo, read, byId, requests.get(`pm/${read.slug}`), t3, sig, gh.status.state === "ok", live === 1));
}

/**
 * Whether a running PM checker belongs to this programme. Its title (`🧭 <repo> pm check: …`) has no slug, so it counts
 * when it names the programme's slug or one of its braid numbers, or when this is the project's only live programme (D82: one PM per project).
 */
export function checkerOf(checks: readonly string[], slug: string, braids: readonly string[], only: boolean): boolean {
  return checks.some((text) => only || text.includes(slug) || braids.some((n) => new RegExp(`(^|\\D)${n}(\\D|$)`).test(text)));
}

function programmeOf(repo: string, read: PlanRead, cards: ReadonlyMap<string, BraidCard>, request: Request | undefined, t3: T3, sig: Signals, ghOk: boolean, only: boolean): Programme {
  const clock = `${repo}/${read.slug} pm`;
  const plan = read.plan;
  const asked = request === undefined ? null : needOfAsk(request, sig.now, t3);
  if (plan === null) {
    sig.alarm(clock, "stalled", false);
    return {
      slug: read.slug, branch: read.branch, title: read.slug, goal: null, state: null, section: asked === null ? "working" : "needs", thread: request?.thread ?? null, link: asked?.link ?? null, pmState: null,
      hold: null, paused: false, next: null, digest: null, limit: null, rows: [], braids: [], done: 0, total: 0, running: 0, need: asked,
      status: `plan unreadable: ${read.error ?? "unknown"}`, handling: [], seen: null, error: `plan unreadable: ${read.error ?? "unknown"}`,
    };
  }
  const rows = plan.rows.map((r) => ({ ...r, lane: r.braid === null ? null : (cards.get(r.braid)?.lane ?? null) }));
  const braids = rows.flatMap((r) => (r.braid === null ? [] : [r.braid]));
  const mine = braids.flatMap((n) => {
    const c = cards.get(n);
    return c === undefined ? [] : [c];
  });
  const counted = rows.filter((r) => r.state !== "dropped");
  const done = counted.filter((r) => r.state === "done" || r.lane === "Done").length;
  const running = mine.filter((c) => runs(c, t3)).length;
  const t3ok = t3.status.state === "ok";
  const thread = plan.thread ?? request?.thread ?? null;
  const pmState = !t3ok || thread === null ? null : (t3.states?.get(thread) ?? "unknown");
  const link = thread === null ? null : (t3.links?.get(thread) ?? null);
  const pmRunning = pmState === "running";
  const open = mine.filter((c) => c.lane !== "Done");
  const paused = open.length > 0 && open.every((c) => c.pause !== null);
  const hold = plan.hold ?? (paused ? holdOfPauses(open, sig) : null);
  const held = plan.state === "held" || plan.hold !== null || paused;
  const over = plan.state === "done" || plan.state === "stopped";
  const checking = checkerOf(t3.pmChecks ?? [], read.slug, braids, only);
  // The stall: neither the PM nor any braid of it runs. Unknown (T3 or GitHub unread) neither starts nor stops the clock.
  const holds = over || held || asked !== null ? false : t3ok && ghOk ? !(pmRunning || running > 0 || checking) : null;
  const since = sig.alarm(clock, "stalled", holds);
  const handling = mine.filter((c) => c.pm !== null).map((c) => `${c.id} ${c.pm?.kind === "review" ? "live check" : (c.pm?.kind ?? "request")} (${c.pm?.age ?? ""})`);
  const stall: Need | null =
    since === null ? null : { kind: "stalled", text: STALLED_TEXT, verb: "for", age: age(since, sig.now), since, key: null, pr: null, who: null, more: 0, by: "pm", link };
  const need = over ? null : (asked ?? stall);
  const pmWords = pmState === null ? "PM thread not known" : pmState === "unknown" ? "the PM thread is gone" : `PM thread ${pmState}`;
  const status = held
    ? plan.hold !== null
      ? `On hold since ${hhmm(plan.hold.since)}: “${plan.hold.words}”`
      : (hold?.words ?? "") !== ""
        ? `On hold: “${hold?.words ?? ""}”`
        : paused && plan.state !== "held"
          ? "Paused: every braid of it is paused"
          : "On hold: the plan says held"
    : running === 0
      ? `No braid running${pmRunning ? " · the PM is working" : ""}${handling.length > 0 ? ` · the PM is handling ${handling.join(", ")}` : ""}`
      : plan.next === null
        ? `${running} braid${running === 1 ? "" : "s"} running`
        : `Next: ${plan.next}`;
  return {
    slug: read.slug,
    branch: read.branch,
    title: plan.title,
    goal: plan.goal,
    state: plan.state,
    section: over ? null : need !== null ? "needs" : "working",
    thread,
    link,
    pmState,
    hold,
    paused,
    next: plan.next,
    digest: plan.digest,
    limit: plan.limit,
    rows,
    braids,
    done,
    total: counted.length,
    running,
    need,
    status,
    handling,
    seen: stall === null ? null : `${pmWords} · no braid running: no agent thread, no check, no PR checks pending`,
    error: null,
  };
}

/** A hold from the pause records of a programme whose every open braid is paused: the oldest pause, with a hold's words when there are some. */
function holdOfPauses(open: readonly BraidCard[], sig: Signals): Hold | null {
  const records = open.flatMap((c) => {
    const p = sig.pauses?.get(c.id);
    return p === undefined ? [] : [p];
  });
  const first = [...records].sort((a, b) => (a.at < b.at ? -1 : 1))[0];
  if (first === undefined) {
    return null;
  }
  const words = records.find((p) => (p.words ?? "") !== "")?.words ?? "";
  return { since: first.at, words };
}

/** The programme slug of each braid number: the first programme that isn't done or stopped and lists it, else any that lists it. */
export function programmeOfBraid(programmes: readonly Programme[]): Map<string, string> {
  const out = new Map<string, string>();
  for (const live of [true, false]) {
    for (const p of programmes) {
      if ((p.section !== null) !== live) {
        continue;
      }
      for (const n of p.braids) {
        if (!out.has(n)) {
          out.set(n, p.slug);
        }
      }
    }
  }
  return out;
}
