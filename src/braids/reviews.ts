// Review threads: the T3 threads that review an item's PR (a coordinator's subagents), kept in one
// local file under `.braid/` of the main checkout, as the requests are. Only braid commands write it
// (`braid review` adds, `braid clean` drops); it is never committed.
import { readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { locked, mainCheckout } from "./requests.js";

export interface ReviewRecord {
  /** The item: `0015` or `0015/C`. */
  readonly id: string;
  /** The T3 thread id, as T3 gave it (a child's holds `:` and `%`). */
  readonly thread: string;
  /** When it was recorded, ISO. */
  readonly at: string;
  /** The reviewer's checkout, as T3 gave it (`worktreePath`) when the thread was recorded; missing when T3 gave none, and in older records. */
  readonly folder?: string;
  /** That checkout's branch as T3 gave it (a child's `t3/<hex>`); null when T3 gave none. */
  readonly branch?: string | null;
}

export function reviewsFile(root: string): string {
  return join(mainCheckout(root), ".braid", "reviews.json");
}

function readFile(file: string): ReviewRecord[] {
  try {
    const parsed: unknown = JSON.parse(readFileSync(file, "utf8"));
    return Array.isArray(parsed)
      ? (parsed as unknown[]).filter((r): r is ReviewRecord => typeof r === "object" && r !== null && typeof (r as ReviewRecord).id === "string" && typeof (r as ReviewRecord).thread === "string")
      : [];
  } catch {
    return [];
  }
}

function update(file: string, change: (list: ReviewRecord[]) => ReviewRecord[] | null): void {
  locked(
    file,
    () => {
      const next = change(readFile(file));
      if (next !== null) {
        const tmp = `${file}.${process.pid}.tmp`;
        writeFileSync(tmp, `${JSON.stringify(next, null, 2)}\n`);
        renameSync(tmp, file);
      }
    },
    "the review record",
  );
}

/** The recorded review threads; none when the record or the repository can't be read. */
export function loadReviews(root: string): ReviewRecord[] {
  try {
    return readFile(reviewsFile(root));
  } catch {
    return [];
  }
}

/** Records a thread that reviews the item; the same thread twice is kept once (its first time stays). A PM's checker (`pm/<slug>`) replaces the item's older record: the PM has one checker at a time (0071/E, ozjp). */
export function recordReview(root: string, id: string, thread: string, at: string = new Date().toISOString(), where: { folder: string; branch: string | null } | null = null): boolean {
  let added = false;
  update(reviewsFile(root), (list) => {
    added = !list.some((r) => r.thread === thread && r.id === id);
    const kept = id.startsWith("pm/") ? list.filter((r) => r.id !== id) : list;
    return added ? [...kept, { id, thread, at, ...(where === null ? {} : { folder: where.folder, branch: where.branch }) }] : null;
  });
  return added;
}

/** Drops the record of these threads of the item. */
export function dropReviews(root: string, id: string, threads: readonly string[]): void {
  if (threads.length === 0) {
    return;
  }
  update(reviewsFile(root), (list) => {
    const next = list.filter((r) => !(r.id === id && threads.includes(r.thread)));
    return next.length === list.length ? null : next;
  });
}

/** Drops the records of these threads of every `pm/<slug>` item (the board, once a PM's checker no longer runs). */
export function dropEndedChecks(root: string, threads: readonly string[]): void {
  update(reviewsFile(root), (list) => {
    const next = list.filter((r) => !(r.id.startsWith("pm/") && threads.includes(r.thread)));
    return next.length === list.length ? null : next;
  });
}
