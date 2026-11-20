// What a board snapshot calls for: one push per need on the user's side (Needs You, To Review) and one per
// Done braid. A push carries only the repo, item id, lane, title, need line, tag, priority and thread link:
// a topic on ntfy.sh is readable by anyone who knows its name, so nothing else from the repository goes out.
import type { BoardData, Lane, Need } from "../board/model.js";
import { LANE_LABEL, t3codeUrl } from "../board/marks.js";

export interface Push {
  /** What makes this need distinct: a need whose key was sent is not sent again. */
  readonly key: string;
  /** The item it is about (`0044` or `0044/A`); a key whose item is no longer current is dropped. */
  readonly item: string;
  /** `need` for Needs You and To Review, `done` for a braid becoming Done. */
  readonly kind: "need" | "done";
  readonly title: string;
  readonly body: string;
  readonly tags: readonly string[];
  readonly priority: "high" | "default";
  /** The thread's T3 app link (`t3code://threads/<env>/<thread>`); null for none. */
  readonly click: string | null;
}

/** The ntfy tag (an emoji short code) per reason. */
export const TAGS: Readonly<Record<Need["kind"] | "done", string>> = {
  question: "question",
  decision: "scales",
  plan: "clipboard",
  "checks failed": "x",
  stalled: "hourglass",
  review: "eyes",
  done: "white_check_mark",
};

const ON_SIDE: readonly Lane[] = ["Waiting", "In Review"];

/** The key of a need: item, lane, reason and when it began (else the PR it is about). */
export function needKey(id: string, lane: Lane, need: Need): string {
  return [id, lane, need.kind, need.since ?? (need.pr === null ? "-" : `#${need.pr}`)].join("|");
}

export const doneKey = (id: string): string => `${id}|done`;

function needPush(repo: string, id: string, title: string, lane: Lane, need: Need, thread: string | null): Push {
  return {
    key: needKey(id, lane, need),
    item: id,
    kind: "need",
    title: `${repo} ${id}: ${LANE_LABEL[lane]}`,
    body: `${title}\n${need.text}`,
    tags: [TAGS[need.kind]],
    priority: lane === "Waiting" ? "high" : "default",
    click: thread === null ? null : t3codeUrl(thread),
  };
}

/**
 * The pushes a board calls for. An item without strands: its own need. A braid with strands: one per strand
 * need (its card shows only the most urgent), and the braid's own need (a request of its own, its final PR)
 * when that is the card's top need. Every Done braid card (a story or a goal; strands never): one Done push.
 */
export function pushesOf(board: BoardData): Push[] {
  const out: Push[] = [];
  for (const card of board.braids) {
    if (card.lane === "Done") {
      out.push({
        key: doneKey(card.id),
        item: card.id,
        kind: "done",
        title: `${board.repo} ${card.id}: ${LANE_LABEL.Done}`,
        body: card.pr === null ? card.title : `${card.title}\nPR #${card.pr.number} merged`,
        tags: [TAGS.done],
        priority: "default",
        click: null,
      });
      continue;
    }
    if (card.need !== null && card.need.who === null && ON_SIDE.includes(card.lane)) {
      out.push(needPush(board.repo, card.id, card.title, card.lane, card.need, card.thread ?? card.coordinator?.link ?? null));
    }
    for (const s of card.strands) {
      if (s.need !== null && ON_SIDE.includes(s.lane)) {
        out.push(needPush(board.repo, s.id, s.title, s.lane, s.need, s.thread));
      }
    }
  }
  return out;
}
