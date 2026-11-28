// Removing one worktree of this repository without losing work, also when it has checked-out submodules
// (`git worktree remove` refuses those). The checks come first; `--force` only after they passed.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

interface Out {
  readonly status: number | null;
  readonly stdout: string;
  readonly stderr: string;
}

function git(cwd: string, args: readonly string[]): Out {
  const r = spawnSync("git", ["-c", "core.quotePath=false", ...args], { cwd, encoding: "utf8", windowsHide: true });
  return { status: r.error === undefined ? r.status : null, stdout: r.stdout ?? "", stderr: r.stderr ?? (r.error?.message ?? "") };
}

/** Makes a step of the removal fail, for tests: `deinit` or `remove`. */
let fault: ((step: "deinit" | "remove", path: string) => boolean) | undefined;

/** Sets or clears the test hook that makes a removal step fail. */
export function failRemovalForTest(hook: ((step: "deinit" | "remove", path: string) => boolean) | undefined): void {
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
  const status = git(dir, ["status", "--porcelain", "--ignore-submodules=none"]);
  if (status.status !== 0) {
    return `submodule ${name} can't be read (${first(status)})`;
  }
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
  const status = git(path, ["status", "--porcelain", "--ignore-submodules=none"]);
  if (status.status !== 0) {
    return `its worktree can't be read (${first(status)})`;
  }
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

export type Removal = { readonly removed: true } | { readonly removed: false; readonly why: string };

/**
 * Removes the worktree at `path` once `worktreeUnsafe` finds nothing that would be lost: deinits its submodules (when it has initialised
 * ones), then `git worktree remove --force` and `git worktree prune`. "removed" only when the folder is gone; a step that fails keeps it
 * and says which, and a later run checks again and finishes.
 */
export function removeWorktree(root: string, path: string, safe: readonly string[] = []): Removal {
  const why = worktreeUnsafe(root, path, safe);
  if (why !== null) {
    return { removed: false, why };
  }
  const subs = submodules(path);
  if (Array.isArray(subs) && subs.length > 0) {
    const d = fault?.("deinit", path) === true ? { status: 1, stdout: "", stderr: "deinit failed (test)" } : git(path, ["submodule", "deinit", "--all", "--force"]);
    if (d.status !== 0) {
      return { removed: false, why: `its submodules could not be deinitialised (${first(d)})` };
    }
  }
  const r = fault?.("remove", path) === true ? { status: 1, stdout: "", stderr: "remove failed (test)" } : git(root, ["worktree", "remove", "--force", path]);
  git(root, ["worktree", "prune"]);
  if (r.status !== 0) {
    return { removed: false, why: `worktree not removed (${first(r)})` };
  }
  if (existsSync(path)) {
    return { removed: false, why: "worktree not removed (its folder is still there)" };
  }
  return { removed: true };
}
