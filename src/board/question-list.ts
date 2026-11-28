// The order of the Questions panel (docs/board.md, "The Questions panel"): the ranks, the order inside them and which
// question opens next. Pure and free of Node imports, so the server and the page share it.

/**
 * What a question blocks, in the panel's order: escalated to the user; stops a braid or programme entirely; blocks several
 * items; blocks one; blocks nothing (an open question on a Done item); a look request or an FYI (the folded group).
 */
export const RANKS = ["escalated", "stops", "several", "one", "none", "look"] as const;
export type Rank = (typeof RANKS)[number];

export const RANK_LABEL: Readonly<Record<Rank, string>> = {
  escalated: "Escalated to you",
  stops: "Stops a braid or programme",
  several: "Blocks several items",
  one: "Blocks one item",
  none: "Blocks nothing",
  look: "Look and FYI",
};

export interface Rankable {
  readonly rank: Rank;
  readonly blocks: readonly string[];
  /** When it reached the user (ISO). */
  readonly since: string;
  readonly handle: string;
}

/** By rank; inside "several" the one that blocks more comes first; then the oldest first. */
export function rankQuestions<T extends Rankable>(questions: readonly T[]): T[] {
  return [...questions].sort(
    (a, b) =>
      RANKS.indexOf(a.rank) - RANKS.indexOf(b.rank) ||
      (a.rank === "several" ? b.blocks.length - a.blocks.length : 0) ||
      Date.parse(a.since) - Date.parse(b.since) ||
      String(a.handle).localeCompare(String(b.handle)),
  );
}

/** The ranked list (what the rail counts) and the folded looks and FYIs, both in order. */
export function splitQuestions<T extends Rankable>(questions: readonly T[]): { readonly ranked: T[]; readonly looks: T[] } {
  const all = rankQuestions(questions);
  return { ranked: all.filter((q) => q.rank !== "look"), looks: all.filter((q) => q.rank === "look") };
}

/**
 * The question to open after `answered` was answered: the next one in `order` (the keys as they were shown), else the first
 * one still there; null when none is left.
 */
export function nextAfter(order: readonly string[], answered: string): string | null {
  const at = order.indexOf(answered);
  return order[at + 1] ?? order.find((k) => k !== answered) ?? null;
}
