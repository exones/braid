// What a card or strand row shows besides its title: the lane label, the reason icon, the eye for
// a PR to review, the activity icon (an agent, a review or CI running), the tick for Done, and the
// line saying what is needed. Pure, so tests can check them on the demo data; the page only draws them.
import type { Activity, BraidCard, Lane, Need, StrandCard } from "./model.js";

/** The words the board shows for each lane; the stored statuses and internal lanes keep their names. */
export const LANE_LABEL: Readonly<Record<Lane, string>> = {
  "To Do": "To Do",
  "In Progress": "Working",
  "In Review": "To Review",
  Waiting: "Needs You",
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

export interface Marks {
  readonly reasons: readonly ReasonIcon[];
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
  if (reason === "checks failed") {
    return { kind: "checks", tooltip: failed.length > 0 ? `Checks failed: ${failed.join(", ")}` : "Checks failed" };
  }
  return { kind: "stalled", tooltip: "Stalled: nobody is working and nothing was asked" };
}

/** The flag's hover: an `ask:<key>` label marks a decision expected at review. */
export function askTooltip(key: string): string {
  return `Will need your decision: ${key}`;
}

export type Row = Pick<StrandCard, "lane" | "reason" | "need" | "ask" | "pr" | "activity">;

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
  return { reasons, review, activities: iconOf(strand.activity), done: strand.lane === "Done" };
}

/**
 * A card on the user's side (Needs You, To Review) carries only its most urgent icon, the one of the
 * request or alarm it shows. Any other card shows each distinct activity of its strands once.
 */
export function cardMarks(card: BraidCard, details = true): Marks {
  if ((card.lane === "Waiting" || card.lane === "In Review") && card.need !== null) {
    const who = card.need.who;
    const source: Row = who === null ? card : (card.strands.find((s) => s.id === who) ?? card);
    const row: Row = { lane: card.lane, reason: card.reason, need: card.need, ask: null, pr: source.pr, activity: null };
    const { reasons, review } = ofRow(row, details, true);
    return { reasons: reasons.slice(0, 1), review, activities: [], done: false };
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
  return { reasons: [...reasons.values()], review: null, activities: [...activities.values()], done: card.lane === "Done" };
}
