// What a board snapshot calls for: one push per open request that asks the user, the programme stall, and one per
// Done braid no programme runs. `forUser` is the one place that says whether a need pushes and which thread it opens.
// A push carries only the repo, item id, lane, title, need line, what it blocks, tag, priority and thread link (a forwarded
// merge also its short head and the PM's note):
// a topic on ntfy.sh is readable by anyone who knows its name, so nothing else from the repository goes out.
import type { BoardData, Lane, Need } from "../board/model.js";
import { LANE_LABEL, t3codeUrl } from "../board/marks.js";
import { ESCALATED_WORDS, FORWARDED_WORDS } from "../board/pm.js";
import type { Forward } from "../board/programme.js";

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
  look: "eye",
  "checks failed": "x",
  stalled: "hourglass",
  limit: "scales",
  review: "eyes",
  done: "white_check_mark",
};

/** The key of a need: its push item, lane, reason and when it began (else the PR it is about). */
export function needKey(item: string, lane: Lane, need: Need): string {
  return [item, lane, need.kind, need.since ?? (need.pr === null ? "-" : `#${need.pr}`)].join("|");
}

/** What a need's push is about: the item and the request's code, so each request has a push of its own; the item alone for a stall. */
export const pushItem = (id: string, need: Pick<Need, "code">): string => (need.code === undefined ? id : `${id}#${need.code}`);

/** The sequence ID of an item's need push: the repository and the item, in the characters a URL path holds. */
export const sequenceOf = (repo: string, id: string): string => `braid-${repo}-${id}`.replace(/[^A-Za-z0-9_-]/g, "-");


/** What a push is: a request to the user (or its escalation), the PM asking (its own request, or one it forwarded), or a programme's stall. */
export type PushKind = "request" | "forward" | "pm-ask" | "stall";

/**
 * The one rule: whether a need pushes the user, and which thread it opens. A request addressed to the user (no `to`, or
 * `to: user`, any kind) or escalated opens its asking thread (the braid's coordinator when it names none); a request the PM
 * forwarded opens the PM's thread; the PM's own request and a programme's stall open the PM's thread. Nothing else pushes:
 * a request the PM handles (it is no need), a broke alarm, an agent's pending question, a Done waiting for its merge with no request.
 * `fallback` is the T3 link of the braid's coordinator; the link returned is T3's (null: the push says "Open the board").
 */
export function forUser(need: Need | null | undefined, fallback: string | null): { readonly kind: PushKind; readonly link: string | null } | null {
  if (need == null) {
    return null;
  }
  if (need.by === "pm") {
    return { kind: need.kind === "stalled" ? "stall" : "pm-ask", link: need.link ?? fallback };
  }
  // A request has a time it was asked; an alarm ("for 14 min"), an agent's question and a Done handover without a request have none.
  if (need.verb !== "asked" || need.since === null) {
    return null;
  }
  return { kind: need.via === "forwarded" ? "forward" : "request", link: need.link ?? fallback };
}

/** A line that starts with the request's handle (`yellow-bear-5asx · …`), so it can be named in any thread; unchanged for a need without one. */
const coded = (need: Need, line: string): string => (need.handle === undefined ? line : `${need.handle} · ${line}`);

/** `blocks 0072/B, 0072/C`; null when nothing waits on the request. */
const blocksLine = (need: Need): string | null => (need.blocks === undefined || need.blocks.length === 0 ? null : `blocks ${need.blocks.join(", ")}`);

/** What answering unblocks and what the user does (`blocks 0072/B · decide`, or just `decide`); null for a need that is no request. */
const askLine = (need: Need): string | null => (need.act === undefined ? null : [blocksLine(need), need.act].filter((part) => part !== null).join(" · "));

const lines = (...all: readonly (string | null)[]): string => all.filter((line) => line !== null).join("\n");

/** A body that ends with where to go when no thread can be opened. */
const withBoard = (body: string, click: string | null): string => (click === null ? `${body}\nOpen the board` : body);

const clickOf = (link: string | null): string | null => (link === null ? null : t3codeUrl(link));

/** The push of the PM's own request (`braid ask … --by pm`, or a programme request `pm/<slug>`): high priority, tagged 🧭, the PM thread as click. Each request has its own sequence ID. */
function pmAskPush(repo: string, id: string, title: string, need: Need, link: string | null): Push {
  const slug = /^pm\/(.+)$/.exec(id)?.[1];
  const click = clickOf(link);
  const item = pushItem(id, need);
  return {
    key: needKey(item, "Waiting", need),
    item,
    kind: "need",
    title: `${repo} ${slug ?? id}: the PM asks`,
    // A programme request has no item to name: its handle leads the act line.
    body: withBoard(slug === undefined ? lines(coded(need, title), askLine(need), need.text) : lines(coded(need, askLine(need) ?? ""), need.text), click),
    tags: ["compass"],
    // The PM's look or FYI blocks nothing, as a coordinator's.
    priority: need.kind === "look" ? "default" : "high",
    click,
    sequence: sequenceOf(repo, item),
  };
}

/** A programme's stall: `<repo> <slug>: Needs You`, high, ⏳, opening the PM thread. */
function stallPush(repo: string, id: string, slug: string, need: Need, link: string | null): Push {
  const click = clickOf(link);
  return {
    key: needKey(id, "Waiting", need),
    item: id,
    kind: "need",
    title: `${repo} ${slug}: ${LANE_LABEL.Waiting}`,
    body: withBoard(need.text, click),
    tags: [TAGS.stalled],
    priority: "high",
    click,
    sequence: sequenceOf(repo, id),
  };
}

export const doneKey = (id: string): string => `${id}|done`;

/** A request to the user, or one the PM forwarded (the PM asking: 🧭, high, the PM's thread). Each request has its own key and sequence ID, so clearing one leaves the others'. */
function needPush(repo: string, id: string, title: string, lane: Lane, need: Need, kind: PushKind, link: string | null): Push {
  const click = clickOf(link);
  const forward = kind === "forward";
  const escalated = !forward && need.via !== undefined;
  // An escalation says so in its title, so its line doesn't repeat it.
  const text = forward ? need.text.replace(FORWARDED_WORDS, "The PM asks you:") : escalated ? need.text.replace(`${ESCALATED_WORDS} `, "") : need.text;
  const item = pushItem(id, need);
  return {
    key: needKey(item, lane, need),
    item,
    kind: "need",
    title: forward ? `${repo} ${id}: the PM asks` : `${repo} ${id}: ${escalated ? "Escalated to you" : LANE_LABEL[lane]}`,
    body: withBoard(lines(coded(need, title), askLine(need), text), click),
    tags: [forward ? "compass" : TAGS[need.kind]],
    // An escalation or a forward is high even for a review: the PM was meant to deal with it, and didn't or couldn't.
    // A look blocks nothing: it reaches the user without the alarm of a question.
    priority: (lane === "Waiting" && need.kind !== "look") || need.via !== undefined ? "high" : "default",
    click,
    sequence: sequenceOf(repo, item),
  };
}

/**
 * The merges the PM forwarded to the user, one push per PM thread: `<repo>: <n> merges wait for you` (one: `<repo> <id>: merge PR #<n>`),
 * per PR its handle, braid and title, head and what it blocks, and the PM's note; high, 👀, opening the PM's thread. Its key holds the set of PRs and their heads and its sequence ID is the PM thread's,
 * so a merge joining or leaving (or a moved head) sends it again in place of the old one; when none is left the notifier clears it.
 */
function mergesPush(repo: string, thread: string, items: readonly Forward[], link: string | null): Push {
  const click = clickOf(link);
  const sorted = [...items].sort((a, b) => a.id.localeCompare(b.id));
  const merge = (f: Forward): string =>
    lines(
      coded(f.need, `${f.id} ${f.title}`),
      [`PR #${f.need.pr ?? "?"}${f.head === undefined ? "" : ` at ${f.head.slice(0, 7)}`}`, blocksLine(f.need)].filter((part) => part !== null).join(" · "),
      f.note === undefined ? null : `PM: ${f.note}`,
    );
  const one = sorted.length === 1 ? sorted[0] : undefined;
  const item = `merges#${thread}`;
  return {
    key: `${item}|${sorted.map((f) => `${f.id}#${f.need.pr ?? "-"}@${f.head ?? "-"}`).join(",")}`,
    item,
    kind: "need",
    title: one === undefined ? `${repo}: ${sorted.length} merges wait for you` : `${repo} ${one.id}: merge PR #${one.need.pr ?? "?"}`,
    body: withBoard(sorted.map(merge).join("\n\n"), click),
    tags: [TAGS.review],
    priority: "high",
    click,
    sequence: sequenceOf(repo, item),
  };
}

/** The lane a request puts its item in: a review is To Review, any other request Needs You. */
const laneOf = (need: Need): Lane => (need.kind === "review" ? "In Review" : "Waiting");

/** The push `forUser` calls for, or none. */
function pushOf(repo: string, id: string, title: string, lane: Lane, need: Need | null | undefined, fallback: string | null): Push[] {
  const rule = forUser(need, fallback);
  if (need == null || rule === null) {
    return [];
  }
  if (rule.kind === "pm-ask") {
    return [pmAskPush(repo, id, title, need, rule.link)];
  }
  return [rule.kind === "stall" ? stallPush(repo, id, id.replace(/^pm\//, ""), need, rule.link) : needPush(repo, id, title, lane, need, rule.kind, rule.link)];
}

/**
 * The pushes a board calls for, each from `forUser`: a programme's requests, forwards and stall; one per open request of an item
 * and of each strand. A Done braid card (a story or a goal; strands never) pushes one Done, unless a programme runs it.
 */
export function pushesOf(board: BoardData): Push[] {
  const out: Push[] = [];
  const merges = new Map<string, { link: string | null; items: Forward[] }>();
  const running = new Set((board.programmes ?? []).filter((p) => p.section !== null).map((p) => p.slug));
  // A programme's own pushes: the PM's request on it, else its stall; what the PM forwarded from its braids. Done and stopped ones push nothing.
  for (const p of board.programmes ?? []) {
    if (p.section === null) {
      continue;
    }
    for (const need of [...p.asks, ...(p.need?.kind === "stalled" ? [p.need] : [])]) {
      out.push(...pushOf(board.repo, `pm/${p.slug}`, p.title, "Waiting", need, p.link));
    }
    for (const f of p.forwards) {
      if (f.need.kind === "review") {
        // The PM's merges that wait for the user are one push per PM thread: collected here, sent below.
        const at = p.thread ?? p.slug;
        merges.set(at, { link: p.link, items: [...(merges.get(at)?.items ?? []), f] });
      } else {
        out.push(...pushOf(board.repo, f.id, f.title, laneOf(f.need), f.need, null));
      }
    }
  }
  for (const [thread, group] of merges) {
    out.push(mergesPush(board.repo, thread, group.items, group.link));
  }
  for (const card of board.braids) {
    const coordinator = card.coordinator?.link ?? null;
    if (card.lane === "Done") {
      if (card.programme != null && running.has(card.programme)) {
        continue;
      }
      const click = clickOf(coordinator ?? card.doneLink ?? null);
      out.push({
        key: doneKey(card.id),
        item: card.id,
        kind: "done",
        title: `${board.repo} ${card.id}: ${LANE_LABEL.Done}`,
        body: withBoard(card.pr === null ? card.title : `${card.title}\nPR #${card.pr.number} merged`, click),
        tags: [TAGS.done],
        priority: "default",
        click,
        sequence: null,
      });
      continue;
    }
    // Only requests push: a stall or a limit is no request, and a limit is pushed by the board's limit pushes.
    for (const need of card.asks) {
      out.push(...pushOf(board.repo, card.id, card.title, laneOf(need), need, coordinator));
    }
    for (const s of card.strands) {
      // A Done strand's open request stays on the board only: it pushes no more than it did.
      if (s.lane === "Done") {
        continue;
      }
      for (const need of s.asks) {
        out.push(...pushOf(board.repo, s.id, s.title, laneOf(need), need, coordinator));
      }
    }
  }
  return out;
}
