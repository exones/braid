// A data branch (`braid-inbox`, `braid-requests`): read without a checkout, and written with Git's
// low-level commands (hash-object, a temporary index, commit-tree, update-ref), so no checkout, index or
// current branch ever changes. Writes push at once as a fast-forward and never force; a refused push is
// fetched and redone on top. Offline, the commit stays on the local branch and the next write pushes it.
import { catBatch, catBatchSync, gitAsync, gitSync } from "./gitio.js";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { GitError } from "./numbers.js";
import { locked, lockedAsync, mainCheckout } from "./state.js";

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

// The algorithms below are written once, as generators that yield each `git` call they need, and run by one of two
// drivers: `drive` (the CLI commands: each call blocks) or `driveAsync` (the board: each call is awaited, so the
// server keeps answering). The commits, pushes and their order are the same either way.
interface GitStepOut {
  readonly status: number | null;
  readonly stdout: string;
  readonly stderr: string;
  readonly error?: Error | undefined;
}
type Step = { readonly kind: "git"; readonly args: readonly string[]; readonly options: Options } | { readonly kind: "load"; readonly blobs: readonly string[] };
type Gen<T> = Generator<Step, T, GitStepOut | Map<string, string> | undefined>;

function* gitG(args: readonly string[], options: Options = {}): Gen<GitStepOut> {
  return (yield { kind: "git", args, options }) as GitStepOut;
}

function* mustG(args: readonly string[], options: Options = {}): Gen<string> {
  const r = yield* gitG(args, options);
  if (r.status !== 0) {
    throw new GitError(`git ${args[0] ?? ""} failed: ${(r.stderr || r.stdout || String(r.error ?? "")).trim()}`);
  }
  return r.stdout.trim();
}

/** Runs the algorithm with blocking `git` calls. */
function drive<T>(root: string, gen: Gen<T>): T {
  let step = gen.next();
  while (step.done !== true) {
    const s = step.value;
    // `load` is a prefetch only the asynchronous driver does; the blocking view reads on demand.
    step = gen.next(s.kind === "git" ? gitSync(root, s.args, { maxBuffer: 64 * 1024 * 1024, ...s.options }) : undefined);
  }
  return step.value;
}

/** Runs the algorithm with `git` calls that don't block the process. */
async function driveAsync<T>(root: string, gen: Gen<T>): Promise<T> {
  let step = gen.next();
  while (step.done !== true) {
    const s = step.value;
    if (s.kind === "git") {
      step = gen.next(await gitAsync(root, s.args, s.options.env, s.options.input));
    } else {
      const texts = await catBatch(root, s.blobs);
      step = gen.next(new Map(s.blobs.flatMap((blob, i) => (texts[i] === null || texts[i] === undefined ? [] : [[blob, texts[i] as string] as const]))));
    }
  }
  return step.value;
}

export function git(root: string, args: readonly string[], options: Options = {}) {
  return gitSync(root, args, { maxBuffer: 64 * 1024 * 1024, ...options });
}

export function must(root: string, args: readonly string[], options: Options = {}): string {
  return drive(root, mustG(args, options));
}

function* refCommitG(ref: string): Gen<string | null> {
  const r = yield* gitG(["rev-parse", "--verify", "--quiet", `${ref}^{commit}`]);
  return r.status === 0 ? r.stdout.trim() : null;
}

export function refCommit(root: string, ref: string): string | null {
  return drive(root, refCommitG(ref));
}

function* isAncestorG(a: string, b: string): Gen<boolean> {
  return (yield* gitG(["merge-base", "--is-ancestor", a, b])).status === 0;
}

export function isAncestor(root: string, a: string, b: string): boolean {
  return drive(root, isAncestorG(a, b));
}

export function firstLine(text: string): string {
  return text.split(/\r?\n/).find((line) => line.trim() !== "")?.trim() ?? "";
}

/** What a fetch found: the remote has the branch (`present`), has none (`absent`), or couldn't be reached. */
export type FetchResult = { readonly state: "present" | "absent" } | { readonly state: "offline"; readonly why: string };

function* fetchBranchG(b: BranchSpec): Gen<FetchResult> {
  if ((yield* gitG(["remote", "get-url", REMOTE])).status !== 0) {
    return { state: "offline", why: `no remote ${REMOTE}` };
  }
  const ls = yield* gitG(["ls-remote", "--exit-code", REMOTE, local(b)]);
  if (ls.status === 2) {
    return { state: "absent" };
  }
  if (ls.status !== 0) {
    return { state: "offline", why: firstLine(ls.stderr || String(ls.error ?? "") || ls.stdout) };
  }
  const f = yield* gitG(["fetch", "--quiet", "--no-tags", REMOTE, `+${local(b)}:${tracking(b)}`]);
  return f.status === 0 ? { state: "present" } : { state: "offline", why: firstLine(f.stderr) };
}

/** Fetches the branch from origin into its remote-tracking ref. */
export function fetchBranch(root: string, b: BranchSpec): FetchResult {
  return drive(root, fetchBranchG(b));
}

/** `fetchBranch` without blocking the process. */
export function fetchBranchAsync(root: string, b: BranchSpec): Promise<FetchResult> {
  return driveAsync(root, fetchBranchG(b));
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

function* filesAtG(b: BranchSpec, commit: string): Gen<Map<string, string>> {
  return parseTree(yield* mustG(["ls-tree", "-r", "-z", commit, "--", ...b.folders]));
}

/** The branch's files at a commit: path to blob. */
export function filesAt(root: string, b: BranchSpec, commit: string): Map<string, string> {
  return drive(root, filesAtG(b, commit));
}

function* pendingCommitsG(localCommit: string, remote: string): Gen<string[]> {
  return (yield* mustG(["rev-list", "--reverse", localCommit, `^${remote}`])).split(/\s+/).filter((c) => c !== "");
}

/** The commits on `local` that `remote` lacks, oldest first. */
export function pendingCommits(root: string, localCommit: string, remote: string): string[] {
  return drive(root, pendingCommitsG(localCommit, remote));
}

function* changesOfG(b: BranchSpec, commit: string): Gen<Map<string, string>> {
  const out = yield* mustG(["diff-tree", "-r", "-z", "--no-commit-id", "--root", commit, "--", ...b.folders]);
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

/** The branch's files a commit adds or changes: path to blob. */
export function changesOf(root: string, b: BranchSpec, commit: string): Map<string, string> {
  return drive(root, changesOfG(b, commit));
}

function* tipsG(b: BranchSpec): Gen<Tips> {
  // One process for both: the board reads this on every page load.
  const out = yield* mustG(["for-each-ref", "--format=%(refname) %(objectname)", local(b), tracking(b)]);
  const sha = (ref: string): string | null => out.split("\n").map((l) => l.trim()).find((l) => l.startsWith(`${ref} `))?.slice(ref.length + 1) ?? null;
  return { local: sha(local(b)), remote: sha(tracking(b)) };
}

type Tips = { readonly local: string | null; readonly remote: string | null };

/** The local branch and its remote-tracking ref, as they are now. */
export function tips(root: string, b: BranchSpec): Tips {
  return drive(root, tipsG(b));
}

/** `tips` without blocking the process. */
export function tipsAsync(root: string, b: BranchSpec): Promise<Tips> {
  return driveAsync(root, tipsG(b));
}

/**
 * How the two refs relate: one commit to read when one contains the other (or only one exists), or both
 * with the files the local-only commits add or change, when they have diverged.
 */
export type Reading = { readonly commit: string | null } | { readonly commit: string; readonly ours: string; readonly pending: ReadonlySet<string> };

function* readingG(b: BranchSpec, t: Tips): Gen<Reading> {
  const { local: l, remote: r } = t;
  if (l === null || r === null || l === r || (yield* isAncestorG(l, r))) {
    return { commit: r ?? l };
  }
  if (yield* isAncestorG(r, l)) {
    return { commit: l };
  }
  const pending = new Set<string>();
  for (const c of yield* pendingCommitsG(l, r)) {
    for (const path of (yield* changesOfG(b, c)).keys()) {
      pending.add(path);
    }
  }
  return { commit: r, ours: l, pending };
}

export function reading(root: string, b: BranchSpec, t: Tips): Reading {
  return drive(root, readingG(b, t));
}

/** `reading` without blocking the process. */
export function readingAsync(root: string, b: BranchSpec, t: Tips): Promise<Reading> {
  return driveAsync(root, readingG(b, t));
}

function* currentFilesG(b: BranchSpec, at: Tips): Gen<Map<string, string>> {
  const r = yield* readingG(b, at);
  if (r.commit === null) {
    return new Map();
  }
  const files = yield* filesAtG(b, r.commit);
  if ("ours" in r) {
    const mine = yield* filesAtG(b, r.ours);
    // A file the remote changed too is merged as the next write's replay merges it, so a read shows both sides.
    const mb = b.merge === undefined ? null : yield* gitG(["merge-base", r.ours, r.commit]);
    const old = mb !== null && mb.status === 0 ? yield* filesAtG(b, mb.stdout.trim()) : new Map<string, string>();
    for (const path of r.pending) {
      const blob = mine.get(path);
      if (blob === undefined) {
        continue;
      }
      const other = files.get(path);
      if (b.merge !== undefined && other !== undefined && other !== blob && other !== old.get(path)) {
        files.set(path, yield* hashG(b.merge(path, yield* mustG(["cat-file", "blob", blob]), yield* mustG(["cat-file", "blob", other]))));
      } else {
        files.set(path, blob);
      }
    }
  }
  return files;
}

/**
 * The branch's files from the refs, path to blob: the descendant's, or when they have diverged the
 * remote's with the files the local-only commits add or change on top, as the next write replays them.
 */
export function currentFiles(root: string, b: BranchSpec, at: Tips = tips(root, b)): Map<string, string> {
  return drive(root, currentFilesG(b, at));
}

/** `currentFiles` without blocking the process. */
export function currentFilesAsync(root: string, b: BranchSpec, at: Tips): Promise<Map<string, string>> {
  return driveAsync(root, currentFilesG(b, at));
}

/** What a write sees of the branch before it changes it. */
export interface BranchView {
  has(path: string): boolean;
  read(path: string): string | null;
  /** The paths on the branch. */
  paths(): readonly string[];
  /** The texts of these paths, with one `git cat-file --batch`; null for a path that isn't there. */
  readMany(paths: readonly string[]): (string | null)[];
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

/** The view of the branch at a commit. Under the blocking driver a view reads on demand; under the async one every file is read first (one process), so `change` never runs `git`. */
function* viewAtG(root: string, b: BranchSpec, commit: string | null): Gen<BranchView> {
  const map = commit === null ? new Map<string, string>() : yield* filesAtG(b, commit);
  const loaded = (yield { kind: "load", blobs: [...new Set(map.values())] }) as Map<string, string> | undefined;
  const text = (blob: string): string | null => (loaded === undefined ? must(root, ["cat-file", "blob", blob]) : (loaded.get(blob) ?? null));
  return {
    has: (path) => map.has(path),
    read: (path) => {
      const blob = map.get(path);
      return blob === undefined ? null : text(blob);
    },
    paths: () => [...map.keys()],
    readMany: (paths) => {
      const blobs = paths.map((p) => map.get(p));
      if (loaded !== undefined) {
        return blobs.map((blob) => (blob === undefined ? null : text(blob)));
      }
      const known = blobs.filter((blob): blob is string => blob !== undefined);
      const texts = catBatchSync(root, known);
      let i = 0;
      return blobs.map((blob) => (blob === undefined ? null : (texts[i++] ?? null)));
    },
  };
}

/** A new commit on `parent` with `changes` (path to blob) applied, built in a temporary index. */
function* commitOnG(parent: string | null, changes: ReadonlyMap<string, string>, message: string, env: NodeJS.ProcessEnv = {}): Gen<string> {
  const dir = mkdtempSync(join(tmpdir(), "braid-branch-"));
  try {
    const index = { ...env, GIT_INDEX_FILE: join(dir, "index") };
    yield* mustG(parent === null ? ["read-tree", "--empty"] : ["read-tree", parent], { env: index });
    if (changes.size > 0) {
      yield* mustG(["update-index", "--index-info"], { env: index, input: [...changes].map(([path, blob]) => `100644 blob ${blob}\t${path}\n`).join("") });
    }
    const tree = yield* mustG(["write-tree"], { env: index });
    const args = ["commit-tree", tree, ...(parent === null ? [] : ["-p", parent]), "-m", message];
    const r = yield* gitG(args, { env: index });
    if (r.status === 0) {
      return r.stdout.trim();
    }
    // No Git identity on this machine (a fresh CI runner): the record is still written, as braid.
    if (!/identity unknown|tell me who you are/i.test(r.stderr)) {
      throw new GitError(`git commit-tree failed: ${r.stderr.trim()}`);
    }
    const braid = { GIT_AUTHOR_NAME: "braid", GIT_AUTHOR_EMAIL: "braid@localhost", GIT_COMMITTER_NAME: "braid", GIT_COMMITTER_EMAIL: "braid@localhost" };
    return yield* mustG(args, { env: { ...braid, ...index } });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function* hashG(text: string): Gen<string> {
  return yield* mustG(["hash-object", "-w", "--stdin"], { input: text });
}

/**
 * The base for a new commit: the remote tip with the local commits it lacks replayed on top (their files
 * and messages, author kept). A file the remote changed too is merged with `b.merge` when given.
 */
function* rebaseG(b: BranchSpec, l: string | null, r: string | null): Gen<string | null> {
  if (l === null || r === null || l === r) {
    return r ?? l;
  }
  if (yield* isAncestorG(r, l)) {
    return l;
  }
  // Unrelated histories (two branches started apart, one offline) have no common commit.
  const mb = b.merge === undefined ? null : yield* gitG(["merge-base", l, r]);
  const since = mb !== null && mb.status === 0 ? mb.stdout.trim() : null;
  let base = r;
  for (const commit of yield* pendingCommitsG(l, r)) {
    const [name = "", email = "", date = "", ...message] = (yield* mustG(["log", "-1", "--format=%an%x00%ae%x00%aI%x00%B", commit])).split("\0");
    const changes = yield* changesOfG(b, commit);
    if (b.merge !== undefined) {
      const theirs = yield* filesAtG(b, base);
      const old = since === null ? new Map<string, string>() : yield* filesAtG(b, since);
      for (const [path, blob] of changes) {
        const other = theirs.get(path);
        if (other !== undefined && other !== blob && other !== old.get(path)) {
          changes.set(path, yield* hashG(b.merge(path, yield* mustG(["cat-file", "blob", blob]), yield* mustG(["cat-file", "blob", other]))));
        }
      }
    }
    base = yield* commitOnG(base, changes, message.join("\0").trim(), { GIT_AUTHOR_NAME: name, GIT_AUTHOR_EMAIL: email, GIT_AUTHOR_DATE: date });
  }
  return base;
}

function* moveLocalG(b: BranchSpec, commit: string, old: string | null): Gen<void> {
  yield* mustG(["update-ref", "-m", `braid ${b.branch}`, local(b), commit, old ?? "0".repeat(40)]);
}

/** Refuses a write while a worktree has the branch checked out: moving it would leave that worktree showing newer files as staged deletions. */
function* refuseCheckedOutG(b: BranchSpec): Gen<void> {
  const r = yield* gitG(["worktree", "list", "--porcelain"]);
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

/** How long a writer waits for the branch's lock: a write fetches and pushes, so a queue of them takes longer than a local file's. */
const BRANCH_LOCK_WAIT_MS = 60_000;

/** Runs `fn` holding the branch's lock in the main checkout's `.braid/`, so writers on one machine take turns. */
export function lockedBranch<T>(root: string, b: BranchSpec, fn: () => T): T {
  return locked(join(mainCheckout(root), ".braid", b.lock), fn, b.what, undefined, BRANCH_LOCK_WAIT_MS);
}

/** `lockedBranch` that waits for the lock without blocking the process. */
export function lockedBranchAsync<T>(root: string, b: BranchSpec, fn: () => Promise<T>): Promise<T> {
  return lockedAsync(join(mainCheckout(root), ".braid", b.lock), fn, b.what, undefined, BRANCH_LOCK_WAIT_MS);
}

function* writeBranchG(root: string, b: BranchSpec, change: (current: BranchView) => BranchChange, options: { push?: boolean }): Gen<WriteResult> {
  yield* refuseCheckedOutG(b);
  const push = options.push !== false;
  for (let attempt = 1; ; attempt++) {
    const fetched: FetchResult = push ? yield* fetchBranchG(b) : { state: "offline", why: "not pushed" };
    const l = yield* refCommitG(local(b));
    // A branch deleted on the remote is pushed again from the local copy, or the last fetched one.
    const r = fetched.state === "absent" ? null : yield* refCommitG(tracking(b));
    const base = yield* rebaseG(b, l ?? (fetched.state === "absent" ? yield* refCommitG(tracking(b)) : null), r);
    const next = change(yield* viewAtG(root, b, base));
    if (next.files.size === 0) {
      return { commit: null, pushed: false, warning: null };
    }
    const blobs = new Map<string, string>();
    for (const [path, text] of next.files) {
      blobs.set(path, yield* hashG(text));
    }
    const commit = yield* commitOnG(base, blobs, next.message);
    if (fetched.state === "offline") {
      yield* moveLocalG(b, commit, l);
      return { commit, pushed: false, warning: push ? `can't reach ${REMOTE} (${fetched.why}); the ${b.noun} is on the local ${b.branch} branch and the next write pushes it` : null };
    }
    const pushed = yield* gitG(["push", "--porcelain", REMOTE, `${commit}:${local(b)}`]);
    if (pushed.status === 0) {
      yield* moveLocalG(b, commit, l);
      yield* gitG(["update-ref", tracking(b), commit]);
      return { commit, pushed: true, warning: null };
    }
    const rejected = pushed.stdout.split(/\r?\n/).some((line) => line.startsWith("!") && line.includes(local(b)));
    if (!rejected || attempt >= TRIES) {
      yield* moveLocalG(b, commit, l);
      const why = rejected ? `the push was refused ${TRIES} times` : `the push failed: ${firstLine(pushed.stderr || pushed.stdout)}`;
      return { commit, pushed: false, warning: `${why}; the ${b.noun} is on the local ${b.branch} branch and the next write pushes it` };
    }
  }
}

/**
 * Commits one change to the branch and pushes it. `change` sees the branch as it is and returns the files
 * to write; after a refused push it runs again on the fetched tip. With `push: false` nothing is fetched or
 * pushed: the commit goes on the local branch, and the next write pushes it. Call it holding `lockedBranch`.
 */
export function writeBranchUnlocked(root: string, b: BranchSpec, change: (current: BranchView) => BranchChange, options: { push?: boolean } = {}): WriteResult {
  return drive(root, writeBranchG(root, b, change, options));
}

/** `writeBranchUnlocked` without blocking the process. Call it holding `lockedBranchAsync`. */
export function writeBranchUnlockedAsync(root: string, b: BranchSpec, change: (current: BranchView) => BranchChange, options: { push?: boolean } = {}): Promise<WriteResult> {
  return driveAsync(root, writeBranchG(root, b, change, options));
}

/** `writeBranchUnlocked` holding the branch's lock. */
export function writeBranch(root: string, b: BranchSpec, change: (current: BranchView) => BranchChange, options: { push?: boolean } = {}): WriteResult {
  return lockedBranch(root, b, () => writeBranchUnlocked(root, b, change, options));
}
