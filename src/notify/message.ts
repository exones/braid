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
  readonly priority: "high" | "default" | "low";
  /** The thread's T3 app link (`t3code://threads/<env>/<thread>`); null for none. */
  readonly click: string | null;
  /** ntfy's sequence ID: a later push or a clear with the same ID replaces or removes this one. Set on each need's push; null for a Done push. */
  readonly sequence: string | null;
}

/** The ntfy tag (an emoji short code) per reason. */
export const TAGS: Readonly<Record<Need["kind"] | "done", string>> = {
  question: "question",
  decision: "scales",
  plan: "clipboard",
  action: "compass",
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

/** The sequence ID of an item's need push: the repository and the item, in the characters a URL path holds. */
export const sequenceOf = (repo: string, id: string): string => `braid-${repo}-${id}`.replace(/[^A-Za-z0-9_-]/g, "-");

/** The push of the PM's own request (`braid ask … --by pm`, or a programme request `pm/<slug>`): high priority, tagged 🧭, the PM thread as click. Its own sequence ID, so it never replaces the coordinator's push for the same item. */
function pmAskPush(repo: string, id: string, title: string, need: Need): Push {
  const slug = /^pm\/(.+)$/.exec(id)?.[1];
  return {
    key: needKey(`${id}#pm`, "Waiting", need),
    item: `${id}#pm`,
    kind: "need",
    title: `${repo} ${slug ?? id}: the PM asks`,
    body: slug === undefined ? `${title}
${need.text}` : need.text,
    tags: ["compass"],
    priority: "high",
    click: need.link == null ? null : t3codeUrl(need.link),
    sequence: sequenceOf(repo, `${id}#pm`),
  };
}

export const doneKey = (id: string): string => `${id}|done`;

function needPush(repo: string, id: string, title: string, lane: Lane, need: Need, thread: string | null): Push {
  return {
    key: needKey(id, lane, need),
    item: id,
    kind: "need",
    title: `${repo} ${id}: ${LANE_LABEL[lane]}${need.via === undefined ? "" : need.via === "forwarded" ? " (forwarded by the PM)" : " (escalated)"}`,
    body: `${title}\n${need.text}`,
    tags: [TAGS[need.kind]],
    // An escalation or a forward is high even for a review: the PM was meant to deal with it, and didn't or couldn't.
    priority: lane === "Waiting" || need.via !== undefined ? "high" : "default",
    click: thread === null ? null : t3codeUrl(thread),
    sequence: sequenceOf(repo, id),
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
        sequence: null,
      });
      continue;
    }
    if (card.pmAsk?.who === null) {
      out.push(pmAskPush(board.repo, card.id, card.title, card.pmAsk));
    }
    if (card.need !== null && card.need.who === null && card.need.by === undefined && ON_SIDE.includes(card.lane)) {
      out.push(needPush(board.repo, card.id, card.title, card.lane, card.need, card.thread ?? card.coordinator?.link ?? null));
    }
    for (const s of card.strands) {
      if (s.pmAsk != null) {
        out.push(pmAskPush(board.repo, s.id, s.title, s.pmAsk));
      }
      if (s.need !== null && s.need.by === undefined && ON_SIDE.includes(s.lane)) {
        out.push(needPush(board.repo, s.id, s.title, s.lane, s.need, s.thread));
      }
    }
  }
  return out;
}
