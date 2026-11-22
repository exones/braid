// What a card or strand row shows besides its title: the lane label, the reason icon, the eye for
// a PR to review, the activity icon (an agent, a review or CI running), the tick for Done, and the
// line saying what is needed. Pure, so tests can check them on the demo data; the page only draws them.
import { ROLES } from "../braids/roles.js";
import type { Activity, BraidCard, Lane, Need, StrandCard, ThreadRole } from "./model.js";

/** The words the board shows for each lane; the stored statuses and internal lanes keep their names. */
export const LANE_LABEL: Readonly<Record<Lane, string>> = {
  Waiting: "Needs You",
  "In Review": "To Review",
  "In Progress": "Working",
  "To Do": "To Do",
  Done: "Done",
};

export type ReasonKind = "question" | "checks" | "stalled" | "ask" | "plan";

export interface ReasonIcon {
  readonly kind: ReasonKind;
  /** The hover text and the aria-label. */
  readonly tooltip: string;
}

export interface ActivityIcon {
  readonly kind: Activity;
  readonly tooltip: string;
}

/** The pause mark: sky while paused, amber once the resume is overdue. */
export interface PausedIcon {
  readonly state: "paused" | "due";
  readonly tooltip: string;
}

export interface Marks {
  readonly reasons: readonly ReasonIcon[];
  /** The braid is paused (`braid pause`); null when not, or when a card on the user's side shows its need instead. */
  readonly paused: PausedIcon | null;
  /** The compass: a request the PM is handling (its hover text); null when none. */
  readonly pm: string | null;
  /** The hover text of the review eye, or null. */
  readonly review: string | null;
  /** What runs: an agent, a review, or only CI. */
  readonly activities: readonly ActivityIcon[];
  readonly done: boolean;
}

const ACTIVITY_TIP: Readonly<Record<Activity, string>> = { agent: "agent running", review: "review running", checks: "checks running" };

/** `35m` as "35 min", `2h` as "2 h", `3d` as "3 d". */
function span(age: string): string {
  const unit = age.slice(-1);
  return `${age.slice(0, -1)} ${unit === "m" ? "min" : unit}`;
}

/** "asked 35 min ago" for a request, "for 14 min" for a broke alarm; empty when the time isn't known. */
export function ageText(need: Need): string {
  return need.age === null ? "" : need.verb === "asked" ? `asked ${span(need.age)} ago` : `for ${span(need.age)}`;
}

/** The line `braid status` prints under an item: the text, with the strand and the age when known. */
export function needLine(need: Need): string {
  const parts = [need.who === null ? null : `strand ${need.who}`, ageText(need)].filter((p) => p !== null && p !== "");
  return parts.length === 0 ? need.text : `${need.text} (${parts.join(", ")})`;
}

/** The full text of a need as a tooltip when the lines are hidden: on a braid card it also says which strand, and how many more. */
export function needTip(need: Need, braid: boolean): string {
  const age = ageText(need);
  if (!braid) {
    return age === "" ? need.text : `${need.text} — ${age}`;
  }
  const where = need.who === null ? "braid, no strand involved" : `strand ${need.who}`;
  return `${need.text} — ${where}${age === "" ? "" : ` · ${age}`}${need.more > 0 ? ` (+${need.more} more in strands)` : ""}`;
}

export function reasonIcon(reason: string, failed: readonly string[] = [], key: string | null = null): ReasonIcon {
  if (reason === "question") {
    return { kind: "question", tooltip: "Question: waiting for your answer" };
  }
  if (reason === "plan") {
    return { kind: "plan", tooltip: "Plan approval needed" };
  }
  if (reason === "decision") {
    return { kind: "ask", tooltip: key === null ? "Decision needed" : `Decision needed: ${key}` };
  }
  if (reason === "action") {
    return { kind: "ask", tooltip: "The PM asks you to do something" };
  }
  if (reason === "checks failed") {
    return { kind: "checks", tooltip: failed.length > 0 ? `Checks failed: ${failed.join(", ")}` : "Checks failed" };
  }
  return { kind: "stalled", tooltip: "Stalled: nobody is working and nothing was asked" };
}

/** The flag's hover: an `ask:<key>` label marks a decision expected at review. */
export function askTooltip(key: string): string {
  return `Will need your decision: ${key}`;
}

export type Row = Pick<StrandCard, "lane" | "reason" | "need" | "ask" | "pr" | "activity" | "pause" | "pm">;

const pmTip = (pm: Row["pm"]): string | null => (pm === null ? null : `${pm.text} · to the PM ${pm.age} ago`);

/** A strand row's tooltip is the pause line; a card's, with Details off, also carries the smaller line. */
const pausedOf = (pause: Row["pause"], full: boolean): PausedIcon | null => (pause === null ? null : { state: pause.state, tooltip: full ? `${pause.text} — ${pause.note}` : pause.text });

const reviewTip = (row: Pick<Row, "need" | "pr">): string => {
  const n = row.need?.pr ?? row.pr?.number;
  return n === undefined ? "PR to review" : `PR #${n} to review`;
};

function ofRow(row: Row, details: boolean, braid: boolean): { reasons: ReasonIcon[]; review: string | null } {
  const reasons = row.reason === null ? [] : [reasonIcon(row.reason, row.pr?.failed, row.need?.key)];
  if (row.ask !== null && row.reason !== "decision") {
    reasons.push({ kind: "ask", tooltip: askTooltip(row.ask) });
  }
  let review = row.lane === "In Review" ? reviewTip(row) : null;
  if (!details && row.need !== null) {
    const tip = needTip(row.need, braid);
    if (reasons[0] !== undefined && row.reason !== null) {
      reasons[0] = { ...reasons[0], tooltip: tip };
    } else if (review !== null) {
      review = tip;
    }
  }
  return { reasons, review };
}

const iconOf = (activity: Activity | null): ActivityIcon[] => (activity === null ? [] : [{ kind: activity, tooltip: ACTIVITY_TIP[activity] }]);

/** A strand row: with Details off, the text of what is needed moves into the reason icon's tooltip. */
export function strandMarks(strand: Row, details = true): Marks {
  const { reasons, review } = ofRow(strand, details, false);
  return { reasons, paused: pausedOf(strand.pause, false), pm: pmTip(strand.pm), review, activities: iconOf(strand.activity), done: strand.lane === "Done" };
}

/**
 * A card on the user's side (Needs You, To Review) carries only its most urgent icon, the one of the
 * request or alarm it shows. Any other card shows each distinct activity of its strands once.
 */
export function cardMarks(card: BraidCard, details = true): Marks {
  if ((card.lane === "Waiting" || card.lane === "In Review") && card.need !== null) {
    const who = card.need.who;
    const source: Row = who === null ? card : (card.strands.find((s) => s.id === who) ?? card);
    const row: Row = { lane: card.lane, reason: card.reason, need: card.need, ask: null, pr: source.pr, activity: null, pause: null, pm: null };
    const { reasons, review } = ofRow(row, details, true);
    return { reasons: reasons.slice(0, 1), paused: null, pm: null, review, activities: [], done: false };
  }
  const rows: Row[] = card.strands.length === 0 ? [card] : [...card.strands];
  const reasons = new Map<ReasonKind, ReasonIcon>();
  const activities = new Map<Activity, ActivityIcon>();
  for (const row of rows) {
    for (const r of ofRow(row, details, false).reasons) {
      if (!reasons.has(r.kind)) {
        reasons.set(r.kind, r);
      }
    }
    for (const a of iconOf(row.activity)) {
      activities.set(a.kind, a);
    }
  }
  return { reasons: [...reasons.values()], paused: pausedOf(card.pause, !details), pm: pmTip(card.pm), review: null, activities: [...activities.values()], done: card.lane === "Done" };
}

const T3_SEGMENT = /^[\w.%~-]+$/;

/** `t3code://threads/<env>/<thread>` from T3's thread link (`http://127.0.0.1:3773/<env>/<thread>`); null when the link isn't that shape. */
export function t3codeUrl(link: string): string | null {
  let path: string;
  try {
    path = new URL(link).pathname;
  } catch {
    return null;
  }
  const m = /^\/([^/]+)\/([^/]+)\/?$/.exec(path);
  return m !== null && T3_SEGMENT.test(m[1] ?? "") && T3_SEGMENT.test(m[2] ?? "") ? `t3code://threads/${m[1]}/${m[2]}` : null;
}

/** A braid number or strand id split for display: `0034/A` is `00` + `34` + `/A`; an all-zero number keeps its last zero as the significant digit. */
export function splitId(id: string): { readonly zeros: string; readonly digits: string; readonly rest: string } {
  const [, zeros = "", digits = "", rest = ""] = /^(0*)(\d*)(.*)$/.exec(id) ?? [];
  return digits === "" && zeros !== "" ? { zeros: zeros.slice(0, -1), digits: "0", rest } : { zeros, digits, rest };
}

/** The emoji on the Open thread button: the role of the thread (worker 💻, review 👀), 💻 when the role is not known. */
export function threadEmoji(role: ThreadRole | null): string {
  return role === "reviewer" ? ROLES.review : ROLES.worker;
}
