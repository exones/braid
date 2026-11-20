// Where braid puts the worktrees it creates, and which item a worktree folder belongs to.
import { spawnSync } from "node:child_process";
import { realpathSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";

/** `$BRAID_WORKTREES_DIR`, else `~/braid-worktrees`. */
export function worktreesDir(env: NodeJS.ProcessEnv = process.env): string {
  const set = env.BRAID_WORKTREES_DIR;
  return set !== undefined && set !== "" ? resolve(set) : join(homedir(), "braid-worktrees");
}

/** The repository's name for the worktree folder: the main checkout's folder, also from inside a worktree; null when `root` is not a repository. */
export function repoNameOf(root: string): string | null {
  const r = spawnSync("git", ["rev-parse", "--git-common-dir"], { cwd: root, encoding: "utf8" });
  if (r.status !== 0) {
    return null;
  }
  const dir = resolve(root, r.stdout.trim());
  return basename(basename(dir) === ".git" ? dirname(dir) : dir).replace(/\.git$/, "");
}

/** The folder holding this repository's braid worktrees (`<worktrees>/<repo>`). */
export function agentsDir(root: string, env: NodeJS.ProcessEnv = process.env): string {
  return join(worktreesDir(env), repoNameOf(root) ?? basename(root));
}

/** The folder of a worker's worktree: `0015` for a story, `0015-D` for a strand. */
export const workFolder = (number: string, letter: string | null): string => (letter === null ? number : `${number}-${letter}`);

/** The folder of a reviewer's checkout made by `braid start <id> --review` before 0039; only `braid clean` still looks for it, to remove a leftover. */
export const reviewFolder = (number: string, letter: string | null): string => `${workFolder(number, letter)}-review`;

/** The item whose worker's worktree a folder name is: `0015-D` is the worker's of `0015/D`. Null for any other name, a leftover `-review` checkout included. */
export function itemOfFolder(name: string): { key: string } | null {
  const m = /^(\d{4})(?:-([A-Z]))?$/.exec(name);
  return m === null ? null : { key: m[2] === undefined ? (m[1] ?? "") : `${m[1] ?? ""}/${m[2]}` };
}

/** A path in one comparable form: absolute, real (long names on Windows), forward slashes, lower case on Windows. */
export const normPath = (p: string): string => {
  let real = resolve(p);
  try {
    real = realpathSync.native(real);
  } catch {
    // a folder that is gone keeps its plain path
  }
  const slashed = real.replace(/\\/g, "/").replace(/\/$/, "");
  return process.platform === "win32" ? slashed.toLowerCase() : slashed;
};
