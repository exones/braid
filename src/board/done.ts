// The day an item became Done: the date of the newest commit that set `status: Done` in its brief, read from Git.
// It needs no GitHub, and covers items Done without a PR. A Done date never changes, so a found one is kept
// for the life of the process.
import { spawnSync } from "node:child_process";
import type { Source } from "../braids/store.js";

/** Runs `git` in `root`; replaced in tests. */
export type DoneGit = (root: string, args: readonly string[]) => { readonly status: number | null; readonly stdout: string };

const runGit: DoneGit = (root, args) => {
  const r = spawnSync("git", ["-c", "core.quotePath=false", ...args], { cwd: root, encoding: "utf8", timeout: 15_000 });
  return { status: r.status, stdout: r.stdout };
};

const found = new Map<string, string>();

/**
 * When the item whose brief is `<folder>/brief.md` became Done (ISO), or null when Git doesn't say (not a
 * repository, no such commit). The history searched is the commit the brief was read from, else HEAD; the
 * commit is the newest one that added the line `status: Done` to the brief.
 */
export function doneDate(root: string, folder: string, source: Source | null, run: DoneGit = runGit): string | null {
  const ref = source?.commit ?? "HEAD";
  const key = `${root}\0${ref}\0${folder}`;
  const known = found.get(key);
  if (known !== undefined) {
    return known;
  }
  const r = run(root, ["log", "-1", "--format=%cI", "-S", "status: Done", ref, "--", `${folder}/brief.md`]);
  const when = r.status === 0 ? new Date(r.stdout.trim()) : null;
  if (when === null || Number.isNaN(when.getTime())) {
    return null;
  }
  const iso = when.toISOString();
  found.set(key, iso);
  return iso;
}

/** Forgets what was read, for tests. */
export function resetDoneDates(): void {
  found.clear();
}
