// Removing one worktree of this repository without losing work, also when it has checked-out submodules
// (`git worktree remove` refuses those without `--force`). The checks come first; `--force` only after they passed.
import { existsSync } from "node:fs";
import { join } from "node:path";
import { gitSync } from "./gitio.js";
import { normPath as norm } from "./worktrees.js";

interface Out {
  readonly status: number | null;
  readonly stdout: string;
  readonly stderr: string;
}

function git(cwd: string, args: readonly string[]): Out {
  const r = gitSync(cwd, args);
  return { status: r.error === undefined ? r.status : null, stdout: r.stdout ?? "", stderr: r.stderr ?? (r.error?.message ?? "") };
}

/** Makes `git worktree remove` fail for a path, for tests. */
let fault: ((path: string) => boolean) | undefined;

/** Sets or clears the test hook that makes the removal fail. */
export function failRemovalForTest(hook: ((path: string) => boolean) | undefined): void {
  fault = hook;
}

const first = (r: Out) => (r.stderr || r.stdout).trim().split(/\r?\n/)[0] ?? "";

/** The gitlinks of the checkout at `dir` whose folder holds a `.git` (initialised submodules), as paths relative to `dir`. */
function submodules(dir: string): string[] | string {
  const r = git(dir, ["ls-files", "-z", "--stage"]);
  if (r.status !== 0) {
    return first(r);
  }
  return r.stdout
    .split("\0")
    .filter((e) => e.startsWith("160000 "))
    .map((e) => e.slice(e.indexOf("\t") + 1))
    .filter((p) => existsSync(join(dir, p, ".git")));
}

/** The reason to keep the submodule at `dir` (shown as `name`) and those inside it, or null when nothing in them would be lost. */
function submoduleUnsafe(dir: string, name: string): string | null {
  const nested = submodules(dir);
  if (typeof nested === "string") {
    return `submodule ${name} can't be read (${nested})`;
  }
  // Inner submodules first, so the line names the innermost one with the work.
  for (const p of nested) {
    const why = submoduleUnsafe(join(dir, p), `${name}/${p}`);
    if (why !== null) {
      return why;
    }
  }
  const status = git(dir, ["status", "--porcelain", "--ignore-submodules=none"]);
  if (status.status !== 0) {
    return `submodule ${name} can't be read (${first(status)})`;
  }
  if (status.stdout.trim() !== "") {
    return `submodule ${name} has uncommitted changes or untracked files`;
  }
  const ahead = git(dir, ["rev-list", "HEAD", "--not", "--remotes"]);
  if (ahead.status !== 0) {
    return `submodule ${name} can't be read (${first(ahead)})`;
  }
  if (ahead.stdout.trim() !== "") {
    return `submodule ${name} has commits that are on no remote`;
  }
  return null;
}

/**
 * Why the worktree at `path` of the repository at `root` must stay, or null when removing it loses nothing: no uncommitted change or
 * untracked file in it or in any initialised submodule (nested ones too), its HEAD in this checkout's HEAD, on a remote-tracking ref or
 * one of `safe` (such as a merged PR's head), and every submodule's HEAD on one of its remote-tracking refs. Ignored files are not work.
 * A submodule that can't be read counts as unsafe.
 */
export function worktreeUnsafe(root: string, path: string, safe: readonly string[] = []): string | null {
  // Submodules first: the worktree's own status fails on a broken one, and the line should name it.
  const subs = submodules(path);
  if (typeof subs === "string") {
    return `its worktree can't be read (${subs})`;
  }
  for (const p of subs) {
    const why = submoduleUnsafe(join(path, p), p);
    if (why !== null) {
      return why;
    }
  }
  const status = git(path, ["status", "--porcelain", "--ignore-submodules=none"]);
  if (status.status !== 0) {
    return `its worktree can't be read (${first(status)})`;
  }
  if (status.stdout.trim() !== "") {
    return "its worktree has uncommitted changes or untracked files";
  }
  const head = git(path, ["rev-parse", "--verify", "--quiet", "HEAD"]).stdout.trim();
  if (head !== "" && !safe.includes(head) && git(root, ["merge-base", "--is-ancestor", head, "HEAD"]).status !== 0) {
    const ahead = git(root, ["rev-list", head, "--not", "--remotes"]);
    if (ahead.status !== 0 || ahead.stdout.trim() !== "") {
      return "its worktree has commits that are neither in this checkout's HEAD nor on a remote";
    }
  }
  return null;
}

/**
 * Why `path` is not a linked worktree of the repository at `root` that may be removed, or null when it is one: listed by
 * `git worktree list` but not first (the main checkout), not `root` itself (the caller's checkout), its own top level (so git run there
 * can't walk up into another checkout), with its own git dir under the same common dir as `root`. The forced removal runs only after this.
 */
export function notLinkedWorktree(root: string, path: string): string | null {
  const p = norm(path);
  if (p === norm(root)) {
    return "it is this checkout";
  }
  const listed = [...git(root, ["worktree", "list", "--porcelain"]).stdout.matchAll(/^worktree (.+)$/gm)].map((m) => norm(m[1] ?? ""));
  if (listed[0] === p) {
    return "it is the main checkout";
  }
  if (!listed.includes(p)) {
    return "it is not a worktree of this repository";
  }
  const here = git(path, ["rev-parse", "--path-format=absolute", "--show-toplevel", "--git-dir", "--git-common-dir"]);
  const own = git(root, ["rev-parse", "--path-format=absolute", "--git-common-dir"]);
  const [top, dir, common] = here.stdout.trim().split(/\r?\n/).map(norm);
  if (here.status !== 0 || own.status !== 0 || top !== p || dir === undefined || common === undefined || dir === common || common !== norm(own.stdout.trim())) {
    return "its folder is not a linked worktree of this repository (git there answers for another checkout)";
  }
  return null;
}

/** Why `removeWorktree` would keep the worktree at `path`, or null when it would remove it; read-only, for a dry run. */
export function worktreeKept(root: string, path: string, safe: readonly string[] = []): string | null {
  return notLinkedWorktree(root, path) ?? worktreeUnsafe(root, path, safe);
}

export type Removal = { readonly removed: true } | { readonly removed: false; readonly why: string };

/**
 * Removes the linked worktree at `path` once `notLinkedWorktree` and `worktreeUnsafe` find nothing against it: `git worktree remove --force`
 * (which takes the worktree's submodules and their git dirs under `.git/worktrees/<name>/modules` with it), then `git worktree prune`.
 * No `git submodule deinit`: it edits `submodule.<name>.*` in the repository's shared config, which de-registers the submodule in the main
 * checkout and every other worktree too. "removed" only when the folder is gone; a failure keeps it with the reason, and a later run checks
 * again and finishes.
 */
export function removeWorktree(root: string, path: string, safe: readonly string[] = []): Removal {
  const why = worktreeKept(root, path, safe);
  if (why !== null) {
    return { removed: false, why };
  }
  // Run from `root` on the one worktree verified above; nothing runs inside another checkout.
  const r = fault?.(path) === true ? { status: 1, stdout: "", stderr: "remove failed (test)" } : git(root, ["worktree", "remove", "--force", path]);
  git(root, ["worktree", "prune"]);
  if (r.status !== 0) {
    return { removed: false, why: `worktree not removed (${first(r)})` };
  }
  if (existsSync(path)) {
    return { removed: false, why: "worktree not removed (its folder is still there)" };
  }
  return { removed: true };
}
