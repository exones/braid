// A data branch (`braid-inbox`, `braid-requests`): read without a checkout, and written with Git's
// low-level commands (hash-object, a temporary index, commit-tree, update-ref), so no checkout, index or
// current branch ever changes. Writes push at once as a fast-forward and never force; a refused push is
// fetched and redone on top. Offline, the commit stays on the local branch and the next write pushes it.
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { GitError } from "./numbers.js";
import { gitAsync } from "./gitio.js";
import { locked, mainCheckout } from "./state.js";

export const REMOTE = "origin";
/** How many times a refused push is fetched and redone. */
const TRIES = 5;

/** A data branch: its name, the folders its files live in, and what it holds (for messages). */
export interface BranchSpec {
  readonly branch: string;
  readonly folders: readonly string[];
  /** The lock file's name in the main checkout's `.braid/`. */
  readonly lock: string;
  /** `the inbox`, `the requests record`. */
  readonly what: string;
  /** What one write adds, for the offline warning: `entry`, `change`. */
  readonly noun: string;
  /**
   * A file both the local commits being replayed and the remote changed: the text to keep. Without it the
   * local file wins.
   */
  readonly merge?: (path: string, ours: string, theirs: string) => string;
}

const local = (b: BranchSpec): string => `refs/heads/${b.branch}`;
const tracking = (b: BranchSpec): string => `refs/remotes/${REMOTE}/${b.branch}`;

type Options = { input?: string; env?: NodeJS.ProcessEnv };

export function git(root: string, args: readonly string[], options: Options = {}) {
  return spawnSync("git", ["-c", "core.quotePath=false", ...args], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    windowsHide: true,
    ...(options.input === undefined ? {} : { input: options.input }),
    ...(options.env === undefined ? {} : { env: { ...process.env, ...options.env } }),
  });
}

export function must(root: string, args: readonly string[], options: Options = {}): string {
  const r = git(root, args, options);
  if (r.status !== 0) {
    throw new GitError(`git ${args[0] ?? ""} failed: ${(r.stderr || r.stdout || String(r.error ?? "")).trim()}`);
  }
  return r.stdout.trim();
}

export function refCommit(root: string, ref: string): string | null {
  const r = git(root, ["rev-parse", "--verify", "--quiet", `${ref}^{commit}`]);
  return r.status === 0 ? r.stdout.trim() : null;
}

export function isAncestor(root: string, a: string, b: string): boolean {
  return git(root, ["merge-base", "--is-ancestor", a, b]).status === 0;
}

export function firstLine(text: string): string {
  return text.split(/\r?\n/).find((line) => line.trim() !== "")?.trim() ?? "";
}

/** What a fetch found: the remote has the branch (`present`), has none (`absent`), or couldn't be reached. */
export type FetchResult = { readonly state: "present" | "absent" } | { readonly state: "offline"; readonly why: string };

/** Fetches the branch from origin into its remote-tracking ref. */
export function fetchBranch(root: string, b: BranchSpec): FetchResult {
  if (git(root, ["remote", "get-url", REMOTE]).status !== 0) {
    return { state: "offline", why: `no remote ${REMOTE}` };
  }
  const ls = git(root, ["ls-remote", "--exit-code", REMOTE, local(b)]);
  if (ls.status === 2) {
    return { state: "absent" };
  }
  if (ls.status !== 0) {
    return { state: "offline", why: firstLine(ls.stderr || String(ls.error ?? "")) };
  }
  const f = git(root, ["fetch", "--quiet", "--no-tags", REMOTE, `+${local(b)}:${tracking(b)}`]);
  return f.status === 0 ? { state: "present" } : { state: "offline", why: firstLine(f.stderr) };
}

/** `fetchBranch` without blocking the process. */
export async function fetchBranchAsync(root: string, b: BranchSpec): Promise<FetchResult> {
  if ((await gitAsync(root, ["remote", "get-url", REMOTE])).status !== 0) {
    return { state: "offline", why: `no remote ${REMOTE}` };
  }
  const ls = await gitAsync(root, ["ls-remote", "--exit-code", REMOTE, local(b)]);
  if (ls.status === 2) {
    return { state: "absent" };
  }
  if (ls.status !== 0) {
    return { state: "offline", why: firstLine(ls.stderr || ls.stdout) };
  }
  const f = await gitAsync(root, ["fetch", "--quiet", "--no-tags", REMOTE, `+${local(b)}:${tracking(b)}`]);
  return f.status === 0 ? { state: "present" } : { state: "offline", why: firstLine(f.stderr) };
}

/** Parses `git ls-tree -r -z` into path to blob. */
export function parseTree(out: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const record of out.split("\0")) {
    const m = /^\d+ blob (\w+)\t(.+)$/s.exec(record);
    if (m !== null) {
      map.set(m[2] ?? "", m[1] ?? "");
    }
  }
  return map;
}

/** The branch's files at a commit: path to blob. */
export function filesAt(root: string, b: BranchSpec, commit: string): Map<string, string> {
  return parseTree(must(root, ["ls-tree", "-r", "-z", commit, "--", ...b.folders]));
}

/** The commits on `local` that `remote` lacks, oldest first. */
export function pendingCommits(root: string, localCommit: string, remote: string): string[] {
  return must(root, ["rev-list", "--reverse", localCommit, `^${remote}`]).split(/\s+/).filter((c) => c !== "");
}

/** The branch's files a commit adds or changes: path to blob. */
export function changesOf(root: string, b: BranchSpec, commit: string): Map<string, string> {
  const out = must(root, ["diff-tree", "-r", "-z", "--no-commit-id", "--root", commit, "--", ...b.folders]);
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

/** The local branch and its remote-tracking ref, as they are now. */
export function tips(root: string, b: BranchSpec): { readonly local: string | null; readonly remote: string | null } {
  return { local: refCommit(root, local(b)), remote: refCommit(root, tracking(b)) };
}

/** `tips` without blocking the process. */
export async function tipsAsync(root: string, b: BranchSpec): Promise<{ readonly local: string | null; readonly remote: string | null }> {
  const ref = async (name: string): Promise<string | null> => {
    const r = await gitAsync(root, ["rev-parse", "--verify", "--quiet", `${name}^{commit}`]);
    return r.status === 0 ? r.stdout.trim() : null;
  };
  const [l, r] = await Promise.all([ref(local(b)), ref(tracking(b))]);
  return { local: l, remote: r };
}

/**
 * How the two refs relate: one commit to read when one contains the other (or only one exists), or both
 * with the files the local-only commits add or change, when they have diverged.
 */
export type Reading = { readonly commit: string | null } | { readonly commit: string; readonly ours: string; readonly pending: ReadonlySet<string> };

export function reading(root: string, b: BranchSpec, t: { readonly local: string | null; readonly remote: string | null }): Reading {
  const { local: l, remote: r } = t;
  if (l === null || r === null || l === r || isAncestor(root, l, r)) {
    return { commit: r ?? l };
  }
  if (isAncestor(root, r, l)) {
    return { commit: l };
  }
  return { commit: r, ours: l, pending: new Set(pendingCommits(root, l, r).flatMap((c) => [...changesOf(root, b, c).keys()])) };
}

/**
 * The branch's files from the refs, path to blob: the descendant's, or when they have diverged the
 * remote's with the files the local-only commits add or change on top, as the next write replays them.
 */
export function currentFiles(root: string, b: BranchSpec): Map<string, string> {
  const r = reading(root, b, tips(root, b));
  if (r.commit === null) {
    return new Map();
  }
  const files = filesAt(root, b, r.commit);
  if ("ours" in r) {
    const mine = filesAt(root, b, r.ours);
    for (const path of r.pending) {
      const blob = mine.get(path);
      if (blob !== undefined) {
        files.set(path, blob);
      }
    }
  }
  return files;
}

/** What a write sees of the branch before it changes it. */
export interface BranchView {
  has(path: string): boolean;
  read(path: string): string | null;
  /** The paths on the branch. */
  paths(): readonly string[];
}

/** A write: files to add or replace (path on the branch to text), and the commit message. No files: nothing is committed. */
export interface BranchChange {
  readonly files: ReadonlyMap<string, string>;
  readonly message: string;
}

export interface WriteResult {
  /** The new commit; null when the change had no files. */
  readonly commit: string | null;
  readonly pushed: boolean;
  /** Why the commit stays local, when it does. */
  readonly warning: string | null;
}

function viewAt(root: string, b: BranchSpec, commit: string | null): BranchView {
  const map = commit === null ? new Map<string, string>() : filesAt(root, b, commit);
  return {
    has: (path) => map.has(path),
    read: (path) => {
      const blob = map.get(path);
      return blob === undefined ? null : must(root, ["cat-file", "blob", blob]);
    },
    paths: () => [...map.keys()],
  };
}

/** A new commit on `parent` with `changes` (path to blob) applied, built in a temporary index. */
function commitOn(root: string, parent: string | null, changes: ReadonlyMap<string, string>, message: string, env: NodeJS.ProcessEnv = {}): string {
  const dir = mkdtempSync(join(tmpdir(), "braid-branch-"));
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

const hash = (root: string, text: string): string => must(root, ["hash-object", "-w", "--stdin"], { input: text });

/**
 * The base for a new commit: the remote tip with the local commits it lacks replayed on top (their files
 * and messages, author kept). A file the remote changed too is merged with `b.merge` when given.
 */
function rebase(root: string, b: BranchSpec, l: string | null, r: string | null): string | null {
  if (l === null || r === null || l === r) {
    return r ?? l;
  }
  if (isAncestor(root, r, l)) {
    return l;
  }
  // Unrelated histories (two branches started apart, one offline) have no common commit.
  const mb = b.merge === undefined ? null : git(root, ["merge-base", l, r]);
  const since = mb !== null && mb.status === 0 ? mb.stdout.trim() : null;
  let base = r;
  for (const commit of pendingCommits(root, l, r)) {
    const [name = "", email = "", date = "", ...message] = must(root, ["log", "-1", "--format=%an%x00%ae%x00%aI%x00%B", commit]).split("\0");
    const changes = changesOf(root, b, commit);
    if (b.merge !== undefined) {
      const theirs = filesAt(root, b, base);
      const old = since === null ? new Map<string, string>() : filesAt(root, b, since);
      for (const [path, blob] of changes) {
        const other = theirs.get(path);
        if (other !== undefined && other !== blob && other !== old.get(path)) {
          changes.set(path, hash(root, b.merge(path, must(root, ["cat-file", "blob", blob]), must(root, ["cat-file", "blob", other]))));
        }
      }
    }
    base = commitOn(root, base, changes, message.join("\0").trim(), { GIT_AUTHOR_NAME: name, GIT_AUTHOR_EMAIL: email, GIT_AUTHOR_DATE: date });
  }
  return base;
}

function moveLocal(root: string, b: BranchSpec, commit: string, old: string | null): void {
  must(root, ["update-ref", "-m", `braid ${b.branch}`, local(b), commit, old ?? "0".repeat(40)]);
}

/** Refuses a write while a worktree has the branch checked out: moving it would leave that worktree showing newer files as staged deletions. */
function refuseCheckedOut(root: string, b: BranchSpec): void {
  const r = git(root, ["worktree", "list", "--porcelain"]);
  if (r.status !== 0) {
    return;
  }
  for (const block of r.stdout.split(/\r?\n\r?\n/)) {
    const lines = block.split(/\r?\n/);
    const path = lines.find((l) => l.startsWith("worktree "))?.slice("worktree ".length);
    if (path !== undefined && lines.includes(`branch ${local(b)}`)) {
      throw new GitError(
        `${b.branch} is checked out in the worktree ${path}; a write would move it under that worktree and leave newer entries staged for deletion. ` +
          `Leave it first (in that worktree: git switch --detach, or remove it with git worktree remove), then run the command again. Nothing was changed.`,
      );
    }
  }
}

/** Runs `fn` holding the branch's lock in the main checkout's `.braid/`, so writers on one machine take turns. */
export function lockedBranch<T>(root: string, b: BranchSpec, fn: () => T): T {
  return locked(join(mainCheckout(root), ".braid", b.lock), fn, b.what);
}

/**
 * Commits one change to the branch and pushes it. `change` sees the branch as it is and returns the files
 * to write; after a refused push it runs again on the fetched tip. With `push: false` nothing is fetched or
 * pushed: the commit goes on the local branch, and the next write pushes it. Call it holding `lockedBranch`.
 */
export function writeBranchUnlocked(root: string, b: BranchSpec, change: (current: BranchView) => BranchChange, options: { push?: boolean } = {}): WriteResult {
  refuseCheckedOut(root, b);
  const push = options.push !== false;
  for (let attempt = 1; ; attempt++) {
    const fetched: FetchResult = push ? fetchBranch(root, b) : { state: "offline", why: "not pushed" };
    const l = refCommit(root, local(b));
    // A branch deleted on the remote is pushed again from the local copy, or the last fetched one.
    const r = fetched.state === "absent" ? null : refCommit(root, tracking(b));
    const base = rebase(root, b, l ?? (fetched.state === "absent" ? refCommit(root, tracking(b)) : null), r);
    const next = change(viewAt(root, b, base));
    if (next.files.size === 0) {
      return { commit: null, pushed: false, warning: null };
    }
    const blobs = new Map([...next.files].map(([path, text]) => [path, hash(root, text)]));
    const commit = commitOn(root, base, blobs, next.message);
    if (fetched.state === "offline") {
      moveLocal(root, b, commit, l);
      return { commit, pushed: false, warning: push ? `can't reach ${REMOTE} (${fetched.why}); the ${b.noun} is on the local ${b.branch} branch and the next write pushes it` : null };
    }
    const pushed = git(root, ["push", "--porcelain", REMOTE, `${commit}:${local(b)}`]);
    if (pushed.status === 0) {
      moveLocal(root, b, commit, l);
      git(root, ["update-ref", tracking(b), commit]);
      return { commit, pushed: true, warning: null };
    }
    const rejected = pushed.stdout.split(/\r?\n/).some((line) => line.startsWith("!") && line.includes(local(b)));
    if (!rejected || attempt >= TRIES) {
      moveLocal(root, b, commit, l);
      const why = rejected ? `the push was refused ${TRIES} times` : `the push failed: ${firstLine(pushed.stderr || pushed.stdout)}`;
      return { commit, pushed: false, warning: `${why}; the ${b.noun} is on the local ${b.branch} branch and the next write pushes it` };
    }
  }
}

/** `writeBranchUnlocked` holding the branch's lock. */
export function writeBranch(root: string, b: BranchSpec, change: (current: BranchView) => BranchChange, options: { push?: boolean } = {}): WriteResult {
  return lockedBranch(root, b, () => writeBranchUnlocked(root, b, change, options));
}
