// Where braid puts the worktrees it creates, and which item a worktree folder belongs to.
import { realpathSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { mainCheckoutOf, repoNameOf } from "./repo.js";

export { mainCheckoutOf, repoNameOf };

/** `$BRAID_WORKTREES_DIR`, else `~/braid-worktrees`. */
export function worktreesDir(env: NodeJS.ProcessEnv = process.env): string {
  const set = env.BRAID_WORKTREES_DIR;
  return set !== undefined && set !== "" ? resolve(set) : join(homedir(), "braid-worktrees");
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
