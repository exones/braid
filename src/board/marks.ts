// What a card or strand row shows besides its title: the lane label, the reason icon, the eye for
// a PR to review, the wrench for a running agent and the tick for Done. Pure, so tests can check
// them on the demo data; the page only draws them.
import type { BraidCard, Lane, StrandCard } from "./model.js";

/** The words the board shows for each lane; the stored statuses and internal lanes keep their names. */
export const LANE_LABEL: Readonly<Record<Lane, string>> = {
  "To Do": "To Do",
  "In Progress": "Working",
  "In Review": "To Review",
  Waiting: "Needs You",
  Done: "Done",
};

export type ReasonKind = "question" | "checks" | "stopped" | "ask";

export interface ReasonIcon {
  readonly kind: ReasonKind;
  /** The hover text and the aria-label. */
  readonly tooltip: string;
}

export interface Marks {
  readonly reasons: readonly ReasonIcon[];
  /** The hover text of the review eye, or null. */
  readonly review: string | null;
  readonly running: boolean;
  readonly done: boolean;
}

export function reasonIcon(reason: string, failed: readonly string[] = []): ReasonIcon {
  if (reason === "question") {
    return { kind: "question", tooltip: "Agent asked a question: waiting for your answer" };
  }
  if (reason === "checks failed") {
    return { kind: "checks", tooltip: failed.length > 0 ? `Checks failed: ${failed.join(", ")}` : "Checks failed" };
  }
  if (reason === "agent stopped") {
    return { kind: "stopped", tooltip: "Agent stopped: no running thread and no PR" };
  }
  return { kind: "ask", tooltip: `Needs your decision: ${reason}` };
}

export type Row = Pick<StrandCard, "lane" | "reason" | "pr" | "running">;

function ofRow(row: Row): { reason: ReasonIcon | null; review: string | null } {
  return {
    reason: row.reason === null ? null : reasonIcon(row.reason, row.pr?.failed),
    review: row.lane === "In Review" && row.pr !== null ? `PR #${row.pr.number} to review` : null,
  };
}

export function strandMarks(strand: Row): Marks {
  const { reason, review } = ofRow(strand);
  return { reasons: reason === null ? [] : [reason], review, running: strand.running, done: strand.lane === "Done" };
}

/** A card shows each distinct reason once, the first review and the wrench if any strand runs. */
export function cardMarks(card: BraidCard): Marks {
  const rows: Row[] = card.strands.length === 0 ? [card] : [...card.strands];
  const reasons = new Map<ReasonKind, ReasonIcon>();
  let review: string | null = null;
  for (const row of rows) {
    const m = ofRow(row);
    if (m.reason !== null && !reasons.has(m.reason.kind)) {
      reasons.set(m.reason.kind, m.reason);
    }
    review ??= m.review;
  }
  return { reasons: [...reasons.values()], review, running: card.running, done: false };
}
