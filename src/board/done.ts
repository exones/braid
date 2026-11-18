// The day an item became Done: the date of the commit that set `status: Done` in its brief, read from Git.
// It needs no GitHub, and covers items Done without a PR. A Done date never changes, so a found one is kept
// for the life of the process, and a miss is kept per commit searched, so an item with no date doesn't run
// `git log` on every refresh.
import { spawnSync } from "node:child_process";
import type { Source } from "../braids/store.js";

/** Runs `git` in `root`; replaced in tests. */
export type DoneGit = (root: string, args: readonly string[]) => { readonly status: number | null; readonly stdout: string };

const runGit: DoneGit = (root, args) => {
  const r = spawnSync("git", ["-c", "core.quotePath=false", ...args], { cwd: root, encoding: "utf8", timeout: 15_000 });
  return { status: r.status, stdout: r.stdout };
};

// The date found, or null for no date, by root, commit searched and folder.
const found = new Map<string, string | null>();

/** The commit HEAD is at in `root`; null when Git doesn't say. */
export function headOf(root: string, run: DoneGit = runGit): string | null {
  const r = run(root, ["rev-parse", "--verify", "-q", "HEAD"]);
  return r.status === 0 && /^[0-9a-f]{7,64}$/.test(r.stdout.trim()) ? r.stdout.trim() : null;
}

const DONE_LINE = /^status: Done\s*$/m;
const ENTRY = "\x01";
const FIELD = "\x1f";

/**
 * When the item whose brief is `<folder>/brief.md` became Done (ISO), or null when Git doesn't say (not a
 * repository, never Done at the commit searched). The history searched is the commit the brief was read from,
 * else `head` (HEAD's commit, when the caller knows it; it keys the cached result). The date is the committer
 * date of the oldest commit in the brief's unbroken run of versions that say `status: Done`, newest back: the
 * commit that set it. The brief's history follows renames of its folder (`git log --follow`, which doesn't
 * combine with `-S`), and a commit's version is read under the name it had there.
 */
export function doneDate(root: string, folder: string, source: Source | null, run: DoneGit = runGit, head: string | null = null): string | null {
  const at = source?.commit ?? head;
  const key = [root, at ?? "", folder].join("|");
  if (at !== null && found.has(key)) {
    return found.get(key) ?? null;
  }
  const iso = search(root, `${folder}/brief.md`, at ?? "HEAD", run);
  if (at !== null) {
    found.set(key, iso);
  }
  return iso;
}

function search(root: string, path: string, ref: string, run: DoneGit): string | null {
  const log = run(root, ["log", "--follow", "--name-status", "--format=%x01%H%x1f%cI", ref, "--", path]);
  if (log.status !== 0) {
    return null;
  }
  let date: string | null = null;
  for (const entry of log.stdout.split(ENTRY).slice(1)) {
    const [first = "", ...files] = entry.split("\n");
    const [sha = "", when = ""] = first.split(FIELD);
    const change = files.find((l) => l.trim() !== "")?.split("\t") ?? [];
    const name = change[change.length - 1];
    const shown = name === undefined ? null : run(root, ["show", `${sha}:${name}`]);
    if (shown === null || shown.status !== 0 || !DONE_LINE.test(shown.stdout)) {
      break;
    }
    date = when;
    // `--follow` also follows copies (the briefs of different items are near copies of each other): only edits and renames continue the history.
    if (!/^[MR]/.test(change[0] ?? "")) {
      break;
    }
  }
  const parsed = date === null ? null : new Date(date);
  return parsed === null || Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

/** Forgets what was read, for tests. */
export function resetDoneDates(): void {
  found.clear();
}
