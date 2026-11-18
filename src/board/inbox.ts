// The inbox as the board shows it: the open entries of `braid-inbox`, read only (docs/board.md, "The inbox").
import { age } from "../braids/requests.js";
import { readInbox, readInboxAsync, type Inbox, type FetchResult } from "../inbox/branch.js";
import type { Entry } from "../inbox/entries.js";

export interface InboxEntry {
  readonly kind: "leftover" | "idea";
  readonly id: string;
  readonly title: string;
  /** The text after the title line (Markdown); empty when the entry is only its title. */
  readonly text: string;
  /** Where a leftover came from (`0012/A`, `review 0012/A`, `PR #12`, `user`); null for an idea. */
  readonly from: string | null;
  readonly ref: readonly string[];
  /** `5m`, `2h`, `3d` since it was added; null when unknown. */
  readonly age: string | null;
  /** How many sweeps passed a leftover over; 0 for an idea. */
  readonly passed: number;
}

export interface InboxData {
  readonly leftovers: readonly InboxEntry[];
  readonly ideas: readonly InboxEntry[];
  /** Something the page should say: a fetch that failed, malformed entries left out. */
  readonly note: string | null;
}

export const NO_INBOX: InboxData = { leftovers: [], ideas: [], note: null };

/** The entry text without its title line. */
function rest(text: string): string {
  const lines = text.split("\n");
  const i = lines.findIndex((l) => l.trim() !== "");
  return lines.slice(i + 1).join("\n").trim();
}

export function toInboxEntry(e: Entry, now: Date): InboxEntry {
  return {
    kind: e.kind,
    id: e.id,
    title: e.title,
    text: rest(e.text),
    from: e.from,
    ref: e.ref,
    age: e.created === null ? null : age(new Date(e.created * 1000).toISOString(), now),
    passed: e.passed ?? 0,
  };
}

type Read = Inbox & { readonly fetched: FetchResult | null };

function toData(inbox: Read, now: Date): InboxData {
  const open = inbox.entries.filter((e) => e.status === "open").sort((a, b) => (a.id < b.id ? 1 : -1));
  const notes = [
    inbox.fetched?.state === "offline" ? `could not fetch braid-inbox (${inbox.fetched.why}); showing the local copy` : null,
    inbox.problems.length > 0 ? `${inbox.problems.length} malformed ${inbox.problems.length === 1 ? "entry" : "entries"} not shown (${inbox.problems.map((p) => p.file).join(", ")})` : null,
  ].filter((n) => n !== null);
  return {
    leftovers: open.filter((e) => e.kind === "leftover").map((e) => toInboxEntry(e, now)),
    ideas: open.filter((e) => e.kind === "idea").map((e) => toInboxEntry(e, now)),
    note: notes.length === 0 ? null : notes.join("; "),
  };
}

const unreadable = (error: unknown): InboxData => ({ ...NO_INBOX, note: `inbox unreadable: ${error instanceof Error ? error.message.split("\n")[0] : String(error)}` });

/** Open entries, newest first, from the refs of `root`; with `fetch`, origin is fetched first (the Refresh button). */
export function inboxOf(root: string, fetch: boolean, now: Date = new Date()): InboxData {
  try {
    return toData(readInbox(root, { fetch }), now);
  } catch (error) {
    return unreadable(error);
  }
}

/** `inboxOf` without blocking the process while Git runs, and with one `git cat-file --batch` for all entries (the board). */
export async function inboxOfAsync(root: string, fetch: boolean, now: Date = new Date()): Promise<InboxData> {
  try {
    return toData(await readInboxAsync(root, { fetch }), now);
  } catch (error) {
    return unreadable(error);
  }
}
