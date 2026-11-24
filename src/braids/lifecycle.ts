// Lifecycle: when an item was started and accepted, on the record branch `braid-requests` beside the requests
// (decided in 0075, q-5asx). One JSON file per item, `lifecycle/<item>.json` (`0075-A.json` for `0075/A`), whose
// `events` list only grows; it is written through the record's one writer, lock and fetch (src/braids/gitbranch.ts),
// so a code branch's head never moves for bookkeeping. Done is no event: it is read from the merged PR (`statusOf`).
import type { PullRequest } from "../board/github.js";
import type { Status } from "./brief.js";
import { catBatchSync } from "./gitio.js";
import { currentFiles, tips, writeBranch, type WriteResult } from "./gitbranch.js";
import { LIFECYCLE_FOLDER, REQUESTS } from "./requests.js";

export { LIFECYCLE_FOLDER };

/** `started`: `braid start` made the item's branch; `accepted`: `braid accept` accepted it at a reviewed head. */
export type LifeEvent =
  | { readonly kind: "started"; readonly at: string; readonly thread: string | null; readonly branch: string }
  | { readonly kind: "accepted"; readonly at: string; readonly head: string; readonly review: string; readonly thread: string | null };

export interface Lifecycle {
  readonly id: string;
  readonly events: readonly LifeEvent[];
}

/** `lifecycle/0075-A.json` for `0075/A`. */
export const lifecyclePath = (id: string): string => `${LIFECYCLE_FOLDER}/${id.replace("/", "-")}.json`;

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const strOrNull = (v: unknown): string | null => (typeof v === "string" ? v : null);

function eventOf(v: unknown): LifeEvent | null {
  if (!isObj(v) || typeof v["at"] !== "string") {
    return null;
  }
  if (v["kind"] === "started" && typeof v["branch"] === "string") {
    return { kind: "started", at: v["at"], thread: strOrNull(v["thread"]), branch: v["branch"] };
  }
  if (v["kind"] === "accepted" && typeof v["head"] === "string") {
    return { kind: "accepted", at: v["at"], head: v["head"], review: typeof v["review"] === "string" ? v["review"] : "", thread: strOrNull(v["thread"]) };
  }
  // A kind a newer CLI added: skipped, the rest still read.
  return null;
}

/** The lifecycle a file holds; null when it doesn't parse or its id doesn't match its name. */
export function parseLifecycle(path: string, text: string): Lifecycle | null {
  let v: unknown;
  try {
    v = JSON.parse(text);
  } catch {
    return null;
  }
  if (!isObj(v) || typeof v["id"] !== "string" || lifecyclePath(v["id"]) !== path) {
    return null;
  }
  const events = (Array.isArray(v["events"]) ? v["events"] : []).map(eventOf).filter((e): e is LifeEvent => e !== null);
  return { id: v["id"], events };
}

export const serialiseLifecycle = (l: Lifecycle): string => `${JSON.stringify({ id: l.id, events: l.events }, null, 2)}\n`;

/** Two versions of one file (an offline write replayed over a remote one): both event lists, each event once, in time order. */
export function mergeLifecycle(path: string, ours: string, theirs: string): string {
  const a = parseLifecycle(path, ours);
  const b = parseLifecycle(path, theirs);
  if (b === null) {
    return ours;
  }
  if (a === null) {
    return theirs;
  }
  const seen = new Set<string>();
  const events = [...b.events, ...a.events].filter((e) => {
    const k = JSON.stringify(e);
    return seen.has(k) ? false : (seen.add(k), true);
  });
  events.sort((x, y) => x.at.localeCompare(y.at));
  return serialiseLifecycle({ id: b.id, events });
}

/** Every item's lifecycle from the local refs (no fetch), by item id; a record without `lifecycle/` gives none. */
export function loadLifecycle(root: string): ReadonlyMap<string, Lifecycle> {
  let at: ReturnType<typeof tips>;
  try {
    at = tips(root, REQUESTS);
  } catch {
    // Not a repository: no record.
    return new Map();
  }
  const key = `${at.local ?? "-"} ${at.remote ?? "-"}`;
  const cached = cache.get(root);
  if (cached !== undefined && cached.key === key) {
    return cached.map;
  }
  const files = [...currentFiles(root, REQUESTS, at)].filter(([path]) => path.startsWith(`${LIFECYCLE_FOLDER}/`));
  const texts = catBatchSync(root, files.map(([, blob]) => blob));
  const map = new Map<string, Lifecycle>();
  files.forEach(([path], i) => {
    const l = texts[i] == null ? null : parseLifecycle(path, texts[i]);
    if (l !== null) {
      map.set(l.id, l);
    }
  });
  cache.set(root, { key, map });
  return map;
}

const cache = new Map<string, { key: string; map: ReadonlyMap<string, Lifecycle> }>();

/** Appends one event to the item's file on the record branch, pushed at once (offline: kept locally, as requests are). */
export function recordEvent(root: string, id: string, event: LifeEvent): WriteResult {
  const path = lifecyclePath(id);
  return writeBranch(root, REQUESTS, (view) => {
    const text = view.read(path);
    const old = text === null ? null : parseLifecycle(path, text);
    const next: Lifecycle = { id, events: [...(old?.events ?? []), event] };
    return { files: new Map([[path, serialiseLifecycle(next)]]), message: `docs(record): ${id} ${event.kind}` };
  });
}

/** What an item reads as: its status, and the head it was accepted at while its PR waits for the merge (else null). */
export interface ItemStatus {
  readonly status: Status;
  readonly accepted: string | null;
}

/**
 * An item's status, one rule for every reader (0075/B): `Outline` stays; a merged PR is Done; a stored Done is Done,
 * except next to a PR closed without merging (To Do) or an open PR (stamped by an older CLI before the merge: accepted
 * at that head); an `accepted` event at the open PR's head waits for the merge; a `started` event or a stored
 * In Progress is In Progress; else the stored status. `pr` is the item's PR as the board picks it (open, else newest
 * merged, else newest closed); for a braid with strands, pass it only when `goalMerged` says its merge counts.
 * `review`: the item has an open review request; a stored Done whose PR the lookup didn't find then reads To Do, so
 * the request decides the lane and the merge is never dropped (0068, 0069/A, as before 0075).
 */
export function statusOf(stored: Status, life: Lifecycle | undefined, pr: PullRequest | null, review = false): ItemStatus {
  if (stored === "Outline") {
    return { status: stored, accepted: null };
  }
  if (pr?.state === "merged") {
    return { status: "Done", accepted: null };
  }
  const events = life?.events ?? [];
  const accepted = pr?.state === "open" ? events.findLast((e) => e.kind === "accepted" && pr.head !== undefined && pr.head.startsWith(e.head.toLowerCase())) : undefined;
  if (stored === "Done") {
    if (pr?.state === "open") {
      return { status: "In Progress", accepted: pr.head ?? "" };
    }
    return pr?.state === "closed" || (pr === null && review) ? { status: "To Do", accepted: null } : { status: "Done", accepted: null };
  }
  if (accepted !== undefined && accepted.kind === "accepted") {
    return { status: "In Progress", accepted: accepted.head };
  }
  return { status: stored === "In Progress" || events.some((e) => e.kind === "started") ? "In Progress" : stored, accepted: null };
}

/**
 * Whether a braid's merged PR into main makes it Done: every strand was Done by then, its PR merged no later than
 * the braid's (a strand stored Done without a merged PR counts as Done before it). An early PR from the braid branch,
 * merged while strands are still open or merged later, doesn't (inbox 2026-11-24-dsyv).
 */
export function goalMerged(pr: PullRequest | null, strands: readonly { readonly status: Status; readonly pr: PullRequest | null }[]): boolean {
  if (pr?.state !== "merged") {
    return false;
  }
  // Without its merge time the merge can't be placed after the strands', so it isn't the braid's merge.
  const at = pr.mergedAt ?? "";
  if (at === "") {
    return false;
  }
  return strands.every((s) => {
    if (s.pr?.state === "merged") {
      return (s.pr.mergedAt ?? "") <= at;
    }
    return s.status === "Done";
  });
}

/** The statuses of a braid and its strands, by item id (`0075`, `0075/A`), from the record, the PRs and the stored statuses. */
export function braidStatuses(
  braid: { readonly number: string; readonly brief: { readonly status: Status }; readonly strands: readonly { readonly letter: string; readonly brief: { readonly status: Status } }[] },
  life: ReadonlyMap<string, Lifecycle>,
  prs: ReadonlyMap<string, PullRequest>,
  reviews: ReadonlySet<string> = new Set(),
): Map<string, ItemStatus> {
  const out = new Map<string, ItemStatus>();
  const strands = braid.strands.map((s) => {
    const id = `${braid.number}/${s.letter}`;
    const pr = prs.get(id) ?? null;
    const st = statusOf(s.brief.status, life.get(id), pr, reviews.has(id));
    out.set(id, st);
    return { status: st.status, pr };
  });
  const own = prs.get(braid.number) ?? null;
  // A braid's merge counts only when its strands were Done by then; otherwise it is read without that PR.
  const counted = braid.strands.length === 0 || own?.state !== "merged" || goalMerged(own, strands) ? own : null;
  out.set(braid.number, statusOf(braid.brief.status, life.get(braid.number), counted, reviews.has(braid.number)));
  return out;
}

/** A braid with each item's `brief.status` replaced by what it reads as (`braidStatuses`); the rest unchanged. */
export function withStatuses<B extends { readonly number: string; readonly brief: { readonly status: Status }; readonly strands: readonly { readonly letter: string; readonly brief: { readonly status: Status } }[] }>(
  braid: B,
  life: ReadonlyMap<string, Lifecycle>,
  prs: ReadonlyMap<string, PullRequest>,
): B {
  const st = braidStatuses(braid, life, prs);
  const set = <T extends { readonly brief: { readonly status: Status } }>(item: T, id: string): T => {
    const s = st.get(id)?.status ?? item.brief.status;
    return s === item.brief.status ? item : { ...item, brief: { ...item.brief, status: s } };
  };
  return { ...set(braid, braid.number), strands: braid.strands.map((s) => set(s, `${braid.number}/${s.letter}`)) };
}
