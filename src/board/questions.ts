// What the Questions panel lists for one project (docs/board.md, "The Questions panel"): every open request that reaches the
// user, routed as the cards route it (one the PM is still handling isn't listed), with its rank and who asks; and Decided, the
// answered requests of braids and programmes. Pure: it reads the signals, the cards, GitHub and T3, and writes nothing.
import { actOf, age, askerOf, closing, handleOf, isWait, programmeOf, type Act, type Kind, type Request } from "../braids/requests.js";
import type { Github } from "./github.js";
import { linkOfThread, mergeOf, type BraidCard, type MergeInfo, type Signals } from "./model.js";
import { routeOf, viaNote } from "./pm.js";
import { programmeOfBraid, type Programme } from "./programme.js";
import { rankQuestions, type Rank } from "./question-list.js";
import { CLOSED_KEPT } from "./record.js";
import type { T3 } from "./t3.js";

export interface Question {
  readonly code: string;
  readonly handle: string;
  /** The item (`0004/B`), or `pm/<slug>` for a programme's own request. */
  readonly id: string;
  /** The programme's slug of a programme's own request; null for a braid's. */
  readonly programme: string | null;
  readonly kind: Kind;
  readonly act: Act;
  /** The question itself, without the lead words a card puts before it; a review reads `Merge PR #43: <title>`. */
  readonly text: string;
  /** `coordinator of 0009 Report totals`, `PM of working-product, for 0004 Billing`, `PM of storefront`. */
  readonly who: string;
  readonly blocks: readonly string[];
  readonly rank: Rank;
  /** Why it reached the user, when it escalated (the PM didn't answer, or is gone); null otherwise. */
  readonly escalated: string | null;
  /** The PM's note with a forward. */
  readonly note: string | null;
  /** When it reached the user (ISO), and how long ago (`35m`). */
  readonly since: string;
  readonly age: string;
  readonly context: string | null;
  readonly options: readonly string[];
  /** The T3 link of the asking thread; null when T3 doesn't list it. */
  readonly link: string | null;
  /** A review request: the PR and, when GitHub was read, its address; null otherwise. */
  readonly pr: { readonly number: number; readonly url: string | null } | null;
  /** What Merge on request needs, for a review request. */
  readonly merge: MergeInfo | null;
}

export interface Decided {
  readonly code: string;
  readonly handle: string;
  readonly id: string;
  readonly programme: string | null;
  readonly text: string;
  readonly who: string;
  readonly answer: string;
  readonly by: "user" | "pm";
  /** The PM's reason, when the PM answered. */
  readonly reason: string | null;
  /** When it was answered (ISO). */
  readonly at: string;
}

/** The braid of an item id (`0004/B` is braid `0004`), among the cards. */
const cardOf = (cards: ReadonlyMap<string, BraidCard>, id: string): BraidCard | undefined => cards.get(id.slice(0, 4));

const questionText = (r: Request, title: string): string => (r.kind === "review" && r.pr !== undefined ? `Merge PR #${r.pr}: ${title}` : r.text);

/** The title of an item (a braid or a strand); the id when the board doesn't hold it. */
function titleOf(cards: ReadonlyMap<string, BraidCard>, id: string): string {
  const card = cardOf(cards, id);
  return (id.includes("/") ? card?.strands.find((s) => s.id === id)?.title : card?.title) ?? id;
}

function whoOf(r: Request, cards: ReadonlyMap<string, BraidCard>, tags: ReadonlyMap<string, string>, forwarded: boolean): string {
  const programme = programmeOf(r.id);
  if (programme !== null) {
    return `PM of ${programme}`;
  }
  const number = r.id.slice(0, 4);
  const braid = `${number} ${cardOf(cards, r.id)?.title ?? ""}`.trim();
  const tag = tags.get(number);
  return askerOf(r) === "pm" || forwarded ? `PM${tag === undefined ? "" : ` of ${tag}`}, for ${braid}` : `coordinator of ${braid}`;
}

/** The items of a braid that aren't Done: its strands, or the braid itself without strands. */
const remaining = (card: BraidCard): string[] => (card.strands.length > 0 ? card.strands.filter((s) => s.lane !== "Done").map((s) => s.id) : card.lane === "Done" ? [] : [card.id]);

/** Whether answering is all that stands between some braid and work: the braid's own request, all its open items, or another braid waiting on it. */
function stopsABraid(id: string, blocks: readonly string[], cards: ReadonlyMap<string, BraidCard>): boolean {
  const own = cards.get(id);
  if (own !== undefined && own.lane !== "Done") {
    return true;
  }
  return blocks.some((b) => {
    const card = cardOf(cards, b);
    if (card === undefined) {
      return false;
    }
    const left = remaining(card);
    return b === card.id || (left.length > 0 && left.every((x) => blocks.includes(x)));
  });
}

function rankOf(r: Request, escalated: boolean, blocks: readonly string[], cards: ReadonlyMap<string, BraidCard>): Rank {
  if (r.kind === "look") {
    return "look";
  }
  if (escalated) {
    return "escalated";
  }
  if (programmeOf(r.id) !== null || r.kind === "plan" || stopsABraid(r.id, blocks, cards)) {
    return "stops";
  }
  return blocks.length > 1 ? "several" : blocks.length === 1 ? "one" : "none";
}

/** The open requests that are the user's now, ranked. `cards` are the board's braid cards, `programmes` its programmes. */
export function questionsOf(cards: readonly BraidCard[], programmes: readonly Programme[], t3: T3, sig: Signals, gh: Github): Question[] {
  const byId = new Map(cards.map((c) => [c.id, c]));
  const tags = programmeOfBraid(programmes);
  const open = [...sig.requests.values(), ...(sig.asks?.values() ?? []), ...(sig.programmes ?? [])].filter((r) => !isWait(r));
  const out = open.flatMap((r): Question[] => {
    const slug = programmeOf(r.id);
    // A programme's request and the PM's own are the user's; a coordinator's goes where the cards send it.
    const routed = slug !== null || askerOf(r) === "pm" ? { to: "user" as const } : routeOf(r, sig.now, t3, sig.pauses?.has(r.id.slice(0, 4)) === true);
    if (routed.to === "pm") {
      return [];
    }
    const via = "via" in routed ? routed.via : null;
    const escalated = via === "timeout" || via === "gone" ? viaNote(via, r, sig.now).trim().replace(/^\(the/, "The").replace(/\)$/, "") : null;
    const since = "via" in routed ? routed.since : r.at;
    const blocks = slug === null ? (sig.unblocks?.(r) ?? []) : [];
    const title = slug === null ? titleOf(byId, r.id) : (programmes.find((p) => p.slug === slug)?.title ?? slug);
    const review = r.kind === "review" && r.pr !== undefined ? r.pr : null;
    return [{
      code: r.code,
      handle: handleOf(r),
      id: r.id,
      programme: slug,
      kind: r.kind,
      act: actOf(r.kind),
      text: questionText(r, title),
      who: whoOf(r, byId, tags, via === "forwarded"),
      blocks,
      rank: rankOf(r, escalated !== null, blocks, byId),
      escalated,
      note: via === "forwarded" ? (r.note ?? null) : null,
      since,
      age: age(since, sig.now),
      context: r.context ?? null,
      options: r.options ?? [],
      link: linkOfThread(t3, r.thread),
      pr: review === null ? null : { number: review, url: [...gh.prs.values()].find((p) => p.number === review)?.url ?? null },
      merge: review === null || askerOf(r) === "pm" ? null : mergeOf(r.id, gh, sig, t3),
    }];
  });
  return rankQuestions(out);
}

/** The requests the user or the PM answered, braids' and programmes', newest answer first; waits ask neither and are left out. */
export function decidedOf(cards: readonly BraidCard[], programmes: readonly Programme[], sig: Signals): Decided[] {
  const byId = new Map(cards.map((c) => [c.id, c]));
  const tags = programmeOfBraid(programmes);
  return (sig.closed ?? [])
    .flatMap((r): Decided[] => {
      const end = r.state === "answered" ? closing(r) : null;
      if (end === null || (end.by !== "user" && end.by !== "pm") || isWait(r)) {
        return [];
      }
      const slug = programmeOf(r.id);
      return [{
        code: r.code,
        handle: handleOf(r),
        id: r.id,
        programme: slug,
        text: questionText(r, slug ?? titleOf(byId, r.id)),
        who: whoOf(r, byId, tags, false),
        answer: end.text ?? "",
        by: end.by,
        reason: end.reason ?? null,
        at: end.at,
      }];
    })
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    .slice(0, CLOSED_KEPT);
}
