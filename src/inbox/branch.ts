// The `braid-inbox` branch: its entries read from the refs, and its writes, through the shared data
// branch code (src/braids/gitbranch.ts): no checkout, pushed at once, a refused push fetched and redone,
// offline kept local until the next write.
import { GitError } from "../braids/numbers.js";
import { catBatch, gitAsync } from "../braids/gitio.js";
import { fetchBranch, fetchBranchAsync, filesAt, must, parseTree, reading, readingAsync, tips, tipsAsync, writeBranch, type BranchChange, type BranchSpec, type BranchView, type FetchResult, type WriteResult as BranchWrite } from "../braids/gitbranch.js";
import { isProblem, parseEntry, type Entry, type Problem } from "./entries.js";

export { REMOTE, type FetchResult } from "../braids/gitbranch.js";
export const INBOX_BRANCH = "braid-inbox";
const FOLDERS = ["leftovers", "ideas"];
const SPEC: BranchSpec = { branch: INBOX_BRANCH, folders: FOLDERS, lock: "inbox", what: "the inbox", noun: "entry" };

/** Fetches `braid-inbox` from origin into its remote-tracking ref. */
export function fetchInbox(root: string): FetchResult {
  return fetchBranch(root, SPEC);
}

/** When each file was first added (author time), from one `git log`. */
function created(root: string, commit: string): Map<string, number> {
  return parseCreated(must(root, ["log", "--diff-filter=A", "--name-only", "--format=%x01%at", commit, "--", ...FOLDERS]));
}

function parseCreated(out: string): Map<string, number> {
  const map = new Map<string, number>();
  // Newest first: the last commit that adds a file is the one that created it.
  for (const block of out.split("\x01")) {
    const [head = "", ...paths] = block.split(/\r?\n/);
    const time = Number(head.trim());
    for (const path of paths.map((p) => p.trim()).filter((p) => p !== "")) {
      if (Number.isFinite(time)) {
        map.set(path, time);
      }
    }
  }
  return map;
}

export interface Inbox {
  /** The commit read (the remote one when the local branch has diverged from it); null when the branch exists nowhere yet. */
  readonly commit: string | null;
  readonly entries: readonly Entry[];
  readonly problems: readonly Problem[];
}

/** The entries at a commit, read with `git ls-tree` and `git cat-file`; malformed ones become problems. */
export function readInboxAt(root: string, commit: string | null): Inbox {
  if (commit === null) {
    return { commit, entries: [], problems: [] };
  }
  const times = created(root, commit);
  const entries: Entry[] = [];
  const problems: Problem[] = [];
  for (const [path, blob] of filesAt(root, SPEC, commit)) {
    const parsed = parseEntry(path, must(root, ["cat-file", "blob", blob]), times.get(path) ?? null);
    if (isProblem(parsed)) {
      problems.push(parsed);
    } else {
      entries.push(parsed);
    }
  }
  entries.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return { commit, entries, problems };
}

/**
 * The inbox from the refs, local `braid-inbox` and `origin/braid-inbox`: the descendant when one
 * contains the other. When they have diverged (a local commit not pushed yet, and newer remote
 * commits), the remote's entries with the files the local-only commits add or change on top, as the
 * next write replays them, so a listing never hides an entry. With `fetch`, origin is fetched
 * first; `fetched` says what that found.
 */
export function readInbox(root: string, options: { fetch?: boolean } = {}): Inbox & { readonly fetched: FetchResult | null } {
  const fetched = options.fetch === true ? fetchInbox(root) : null;
  const r = reading(root, SPEC, tips(root, SPEC));
  if (!("ours" in r)) {
    return { ...readInboxAt(root, r.commit), fetched };
  }
  const { pending } = r;
  const ours = readInboxAt(root, r.ours);
  const theirs = readInboxAt(root, r.commit);
  const entries = [...theirs.entries.filter((e) => !pending.has(e.file)), ...ours.entries.filter((e) => pending.has(e.file))];
  entries.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const problems = [...theirs.problems.filter((p) => !pending.has(p.file)), ...ours.problems.filter((p) => pending.has(p.file))];
  return { commit: r.commit, entries, problems, fetched };
}

async function readInboxAtAsync(root: string, commit: string | null): Promise<Inbox> {
  if (commit === null) {
    return { commit, entries: [], problems: [] };
  }
  const [listing, log] = await Promise.all([gitAsync(root, ["ls-tree", "-r", "-z", commit, "--", ...FOLDERS]), gitAsync(root, ["log", "--diff-filter=A", "--name-only", "--format=%x01%at", commit, "--", ...FOLDERS])]);
  if (listing.status !== 0 || log.status !== 0) {
    throw new GitError(`git ${listing.status !== 0 ? "ls-tree" : "log"} failed: ${(listing.status !== 0 ? listing : log).stderr.trim()}`);
  }
  const times = parseCreated(log.stdout);
  const found = [...parseTree(listing.stdout)].map(([path, blob]) => ({ path, blob }));
  // One `git cat-file --batch` for all entries, not a process each.
  const texts = await catBatch(root, found.map((f) => f.blob));
  const entries: Entry[] = [];
  const problems: Problem[] = [];
  for (const [i, { path }] of found.entries()) {
    const text = texts[i];
    if (text === null || text === undefined) {
      throw new GitError(`git cat-file failed for ${path}`);
    }
    const parsed = parseEntry(path, text, times.get(path) ?? null);
    if (isProblem(parsed)) {
      problems.push(parsed);
    } else {
      entries.push(parsed);
    }
  }
  entries.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return { commit, entries, problems };
}

/**
 * `readInbox` without blocking the process, for the board: the same entries, read with one `git cat-file --batch`
 * instead of a process per entry. Branches that have diverged are merged the same way.
 */
export async function readInboxAsync(root: string, options: { fetch?: boolean } = {}): Promise<Inbox & { readonly fetched: FetchResult | null }> {
  const fetched = options.fetch === true ? await fetchBranchAsync(root, SPEC) : null;
  const r = await readingAsync(root, SPEC, await tipsAsync(root, SPEC));
  if (!("ours" in r)) {
    return { ...(await readInboxAtAsync(root, r.commit)), fetched };
  }
  // Diverged: as `readInbox` merges the two sides, with every process awaited.
  const { pending } = r;
  const [ours, theirs] = [await readInboxAtAsync(root, r.ours), await readInboxAtAsync(root, r.commit)];
  const entries = [...theirs.entries.filter((e) => !pending.has(e.file)), ...ours.entries.filter((e) => pending.has(e.file))];
  entries.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const problems = [...theirs.problems.filter((p) => !pending.has(p.file)), ...ours.problems.filter((p) => pending.has(p.file))];
  return { commit: r.commit, entries, problems, fetched };
}

/** What a write sees of the branch before it changes it. */
export type InboxView = BranchView;

/** A write: files to add or replace (path on the branch to text), and the commit message. */
export type InboxChange = BranchChange;

export interface WriteResult extends BranchWrite {
  readonly commit: string;
}

/**
 * Commits one change to `braid-inbox` and pushes it. `change` sees the branch as it is and returns
 * the files to write; after a refused push it runs again on the fetched tip. Holds a lock in the main
 * checkout's `.braid/`, so writers on one machine take turns.
 */
export function writeInbox(root: string, change: (current: InboxView) => InboxChange): WriteResult {
  const result = writeBranch(root, SPEC, change);
  // Every inbox change writes at least one entry, so there is always a commit.
  return { ...result, commit: result.commit ?? "" };
}

/** Open entries per kind, from the local refs without fetching; zeros when there is no inbox or it cannot be read. */
export function openCounts(root: string): { readonly leftovers: number; readonly ideas: number } {
  try {
    const { entries } = readInbox(root);
    const open = entries.filter((e) => e.status === "open");
    return { leftovers: open.filter((e) => e.kind === "leftover").length, ideas: open.filter((e) => e.kind === "idea").length };
  } catch {
    return { leftovers: 0, ideas: 0 };
  }
}

/** Open leftovers at which a recap says a sweep is due. */
export const SWEEP_DUE = 3;
