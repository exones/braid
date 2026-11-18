// The `braid-inbox` branch: read without a checkout, and written with Git's low-level commands
// (hash-object, a temporary index, commit-tree, update-ref), so no checkout, index or current branch
// ever changes. Writes push at once as a fast-forward and never force; a refused push is fetched and
// redone on top. Offline, the commit stays on the local branch and the next write pushes it.
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { GitError } from "../braids/numbers.js";
import { locked, mainCheckout } from "../braids/requests.js";
import { isProblem, parseEntry, type Entry, type Problem } from "./entries.js";

export const INBOX_BRANCH = "braid-inbox";
export const REMOTE = "origin";
const LOCAL = `refs/heads/${INBOX_BRANCH}`;
const TRACKING = `refs/remotes/${REMOTE}/${INBOX_BRANCH}`;
const FOLDERS = ["leftovers", "ideas"];
/** How many times a refused push is fetched and redone. */
const TRIES = 5;

function git(root: string, args: readonly string[], options: { input?: string; env?: NodeJS.ProcessEnv } = {}) {
  return spawnSync("git", ["-c", "core.quotePath=false", ...args], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    ...(options.input === undefined ? {} : { input: options.input }),
    ...(options.env === undefined ? {} : { env: { ...process.env, ...options.env } }),
  });
}

function must(root: string, args: readonly string[], options: { input?: string; env?: NodeJS.ProcessEnv } = {}): string {
  const r = git(root, args, options);
  if (r.status !== 0) {
    throw new GitError(`git ${args[0] ?? ""} failed: ${(r.stderr || r.stdout || String(r.error ?? "")).trim()}`);
  }
  return r.stdout.trim();
}

function refCommit(root: string, ref: string): string | null {
  const r = git(root, ["rev-parse", "--verify", "--quiet", `${ref}^{commit}`]);
  return r.status === 0 ? r.stdout.trim() : null;
}

function isAncestor(root: string, a: string, b: string): boolean {
  return git(root, ["merge-base", "--is-ancestor", a, b]).status === 0;
}

function firstLine(text: string): string {
  return text.trim().split(/\r?\n/).pop() ?? "";
}

/** What a fetch found: the remote has the branch (`present`), has none (`absent`), or couldn't be reached. */
export type FetchResult = { readonly state: "present" | "absent" } | { readonly state: "offline"; readonly why: string };

/** Fetches `braid-inbox` from origin into its remote-tracking ref. */
export function fetchInbox(root: string): FetchResult {
  if (git(root, ["remote", "get-url", REMOTE]).status !== 0) {
    return { state: "offline", why: `no remote ${REMOTE}` };
  }
  const ls = git(root, ["ls-remote", "--exit-code", REMOTE, LOCAL]);
  if (ls.status === 2) {
    return { state: "absent" };
  }
  if (ls.status !== 0) {
    return { state: "offline", why: firstLine(ls.stderr || String(ls.error ?? "")) };
  }
  const f = git(root, ["fetch", "--quiet", "--no-tags", REMOTE, `+${LOCAL}:${TRACKING}`]);
  return f.status === 0 ? { state: "present" } : { state: "offline", why: firstLine(f.stderr) };
}

/** The entry files at a commit: path to blob. */
function files(root: string, commit: string): Map<string, string> {
  const out = must(root, ["ls-tree", "-r", "-z", commit, "--", ...FOLDERS]);
  const map = new Map<string, string>();
  for (const record of out.split("\0")) {
    const m = /^\d+ blob (\w+)\t(.+)$/s.exec(record);
    if (m !== null) {
      map.set(m[2] ?? "", m[1] ?? "");
    }
  }
  return map;
}

/** When each file was first added (author time), from one `git log`. */
function created(root: string, commit: string): Map<string, number> {
  const out = must(root, ["log", "--diff-filter=A", "--name-only", "--format=%x01%at", commit, "--", ...FOLDERS]);
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
  for (const [path, blob] of files(root, commit)) {
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

/** The commits on `local` that `remote` lacks, oldest first. */
function pendingCommits(root: string, local: string, remote: string): string[] {
  return must(root, ["rev-list", "--reverse", local, `^${remote}`]).split(/s+/).filter((c) => c !== "");
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
  const local = refCommit(root, LOCAL);
  const remote = refCommit(root, TRACKING);
  if (local === null || remote === null || local === remote || isAncestor(root, local, remote)) {
    return { ...readInboxAt(root, remote ?? local), fetched };
  }
  if (isAncestor(root, remote, local)) {
    return { ...readInboxAt(root, local), fetched };
  }
  const pending = new Set(pendingCommits(root, local, remote).flatMap((c) => [...changesOf(root, c).keys()]));
  const ours = readInboxAt(root, local);
  const theirs = readInboxAt(root, remote);
  const entries = [...theirs.entries.filter((e) => !pending.has(e.file)), ...ours.entries.filter((e) => pending.has(e.file))];
  entries.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const problems = [...theirs.problems.filter((p) => !pending.has(p.file)), ...ours.problems.filter((p) => pending.has(p.file))];
  return { commit: remote, entries, problems, fetched };
}

/** What a write sees of the branch before it changes it. */
export interface InboxView {
  has(path: string): boolean;
  read(path: string): string | null;
}

/** A write: files to add or replace (path on the branch to text), and the commit message. */
export interface InboxChange {
  readonly files: ReadonlyMap<string, string>;
  readonly message: string;
}

export interface WriteResult {
  readonly commit: string;
  readonly pushed: boolean;
  /** Why the commit stays local, when it does. */
  readonly warning: string | null;
}

function view(root: string, commit: string | null): InboxView {
  const map = commit === null ? new Map<string, string>() : files(root, commit);
  return {
    has: (path) => map.has(path),
    read: (path) => {
      const blob = map.get(path);
      return blob === undefined ? null : must(root, ["cat-file", "blob", blob]);
    },
  };
}

/** A new commit on `parent` with `changes` (path to blob) applied, built in a temporary index. */
function commitOn(root: string, parent: string | null, changes: ReadonlyMap<string, string>, message: string, env: NodeJS.ProcessEnv = {}): string {
  const dir = mkdtempSync(join(tmpdir(), "braid-inbox-"));
  try {
    const index = { ...env, GIT_INDEX_FILE: join(dir, "index") };
    must(root, parent === null ? ["read-tree", "--empty"] : ["read-tree", parent], { env: index });
    for (const [path, blob] of changes) {
      must(root, ["update-index", "--add", "--cacheinfo", `100644,${blob},${path}`], { env: index });
    }
    const tree = must(root, ["write-tree"], { env: index });
    return must(root, ["commit-tree", tree, ...(parent === null ? [] : ["-p", parent]), "-m", message], { env: index });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** The entry files a commit adds or changes: path to blob. */
function changesOf(root: string, commit: string): Map<string, string> {
  const out = must(root, ["diff-tree", "-r", "-z", "--no-commit-id", "--root", commit, "--", ...FOLDERS]);
  const parts = out.split("\0");
  const map = new Map<string, string>();
  for (let i = 0; i + 1 < parts.length; i += 2) {
    const m = /^:\d+ (\d+) \w+ (\w+) [AMT]/.exec(parts[i] ?? "");
    if (m !== null && m[1] !== "000000") {
      map.set(parts[i + 1] ?? "", m[2] ?? "");
    }
  }
  return map;
}

/**
 * The base for a new commit: the remote tip with the local commits it lacks replayed on top (their
 * entry files and messages, author kept). Distinct file names mean replays never conflict.
 */
function rebase(root: string, local: string | null, remote: string | null): string | null {
  if (local === null || remote === null || local === remote) {
    return remote ?? local;
  }
  if (isAncestor(root, remote, local)) {
    return local;
  }
  let base = remote;
  for (const commit of pendingCommits(root, local, remote)) {
    const [name = "", email = "", date = "", ...message] = must(root, ["log", "-1", "--format=%an%x00%ae%x00%aI%x00%B", commit]).split("\0");
    base = commitOn(root, base, changesOf(root, commit), message.join("\0").trim(), {
      GIT_AUTHOR_NAME: name,
      GIT_AUTHOR_EMAIL: email,
      GIT_AUTHOR_DATE: date,
    });
  }
  return base;
}

function moveLocal(root: string, commit: string, old: string | null): void {
  must(root, ["update-ref", "-m", "braid inbox", LOCAL, commit, old ?? "0".repeat(40)]);
}

/**
 * Commits one change to `braid-inbox` and pushes it. `change` sees the branch as it is and returns
 * the files to write; after a refused push it runs again on the fetched tip. Holds a lock in the main
 * checkout's `.braid/`, so writers on one machine take turns.
 */
export function writeInbox(root: string, change: (current: InboxView) => InboxChange): WriteResult {
  const lock = join(mainCheckout(root), ".braid", "inbox");
  return locked(lock, () => write(root, change), "the inbox");
}

function write(root: string, change: (current: InboxView) => InboxChange): WriteResult {
  for (let attempt = 1; ; attempt++) {
    const fetched = fetchInbox(root);
    const local = refCommit(root, LOCAL);
    // A branch deleted on the remote is pushed again from the local copy, or the last fetched one.
    const remote = fetched.state === "absent" ? null : refCommit(root, TRACKING);
    const base = rebase(root, local ?? (fetched.state === "absent" ? refCommit(root, TRACKING) : null), remote);
    const next = change(view(root, base));
    const blobs = new Map([...next.files].map(([path, text]) => [path, must(root, ["hash-object", "-w", "--stdin"], { input: text })]));
    const commit = commitOn(root, base, blobs, next.message);
    if (fetched.state === "offline") {
      moveLocal(root, commit, local);
      return { commit, pushed: false, warning: `can't reach ${REMOTE} (${fetched.why}); the entry is on the local ${INBOX_BRANCH} branch and the next write pushes it` };
    }
    const push = git(root, ["push", "--porcelain", REMOTE, `${commit}:${LOCAL}`]);
    if (push.status === 0) {
      moveLocal(root, commit, local);
      git(root, ["update-ref", TRACKING, commit]);
      return { commit, pushed: true, warning: null };
    }
    const rejected = push.stdout.split(/\r?\n/).some((line) => line.startsWith("!") && line.includes(LOCAL));
    if (!rejected || attempt >= TRIES) {
      moveLocal(root, commit, local);
      const why = rejected ? `the push was refused ${TRIES} times` : `the push failed: ${firstLine(push.stderr || push.stdout)}`;
      return { commit, pushed: false, warning: `${why}; the entry is on the local ${INBOX_BRANCH} branch and the next write pushes it` };
    }
  }
}
