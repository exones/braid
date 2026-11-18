// The day an item became Done: the date of the commit that set `status: Done` in its brief, read from Git.
// It needs no GitHub, and covers items Done without a PR. A Done date never changes, so a found one is kept
// for the life of the process, and a miss is kept per commit searched, so an item with no date doesn't run
// `git log` on every refresh.
import { spawnSync } from "node:child_process";
import { catBatch, gitAsync } from "../braids/gitio.js";
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

/** What one commit changed in one file: `M`, `A`, `R` (with the name it had before), `D`... */
interface Change {
  readonly kind: string;
  readonly from: string | null;
}

/**
 * The Done dates of many items at once, kept in the same cache `doneDate` reads: for each history searched
 * (the commit an item was read from, else `head`), one `git log --name-status` of the whole history gives
 * every commit's changes with renames, and one `git cat-file --batch` reads the versions to check. The rule
 * is `doneDate`'s: the chain of a brief's edits and renames, newest back, while the version says
 * `status: Done`; the oldest commit of that run is the date. Without a history (`head` null and no source
 * commit) nothing is read.
 */
export async function prefetchDoneDates(root: string, items: readonly { readonly folder: string; readonly source: Source | null }[], head: string | null): Promise<void> {
  const groups = new Map<string, Set<string>>();
  for (const { folder, source } of items) {
    const at = source?.commit ?? head;
    if (at === null || found.has([root, at, folder].join("|"))) {
      continue;
    }
    groups.set(at, (groups.get(at) ?? new Set()).add(folder));
  }
  await Promise.all([...groups].map(([at, folders]) => searchMany(root, at, [...folders])));
}

async function searchMany(root: string, at: string, folders: readonly string[]): Promise<void> {
  const log = await gitAsync(root, ["log", "-M", "-l0", "--name-status", "--format=%x01%H%x1f%cI", at]);
  if (log.status !== 0) {
    for (const folder of folders) {
      found.set([root, at, folder].join("|"), null);
    }
    return;
  }
  const commits: { sha: string; when: string; changes: Map<string, Change> }[] = [];
  for (const entry of log.stdout.split(ENTRY).slice(1)) {
    const [first = "", ...lines] = entry.split("\n");
    const [sha = "", when = ""] = first.split(FIELD);
    const changes = new Map<string, Change>();
    for (const line of lines) {
      const parts = line.split("\t");
      const name = parts[parts.length - 1];
      if (parts.length >= 2 && name !== undefined) {
        changes.set(name, { kind: parts[0] ?? "", from: parts.length >= 3 ? (parts[1] ?? null) : null });
      }
    }
    commits.push({ sha, when, changes });
  }
  // Each brief's chain of versions, newest first; it ends at the first commit that isn't an edit or a rename.
  const chains = folders.map((folder) => {
    const chain: { sha: string; when: string; name: string; kind: string }[] = [];
    let name = `${folder}/brief.md`;
    for (const c of commits) {
      const change = c.changes.get(name);
      if (change === undefined) {
        continue;
      }
      chain.push({ sha: c.sha, when: c.when, name, kind: change.kind });
      if (!/^[MR]/.test(change.kind)) {
        break;
      }
      if (change.kind.startsWith("R") && change.from !== null) {
        name = change.from;
      }
    }
    return { folder, chain };
  });
  const texts = await catBatch(root, chains.flatMap((c) => c.chain.map((v) => `${v.sha}:${v.name}`)));
  let i = 0;
  const unsure: string[] = [];
  for (const { folder, chain } of chains) {
    let date: string | null = null;
    let ended = false;
    let last: { kind: string } | null = null;
    for (const v of chain) {
      const text = texts[i++] ?? null;
      if (!ended && text !== null && DONE_LINE.test(text)) {
        date = v.when;
        last = v;
      } else {
        ended = true;
      }
    }
    // The whole-history log pairs renames across all files, so a brief whose first version is Done may have been renamed from a
    // file it didn't pair with; `--follow` of that one file decides (only these few items cost a `git log` of their own).
    if (!ended && last?.kind === "A") {
      unsure.push(folder);
      continue;
    }
    found.set([root, at, folder].join("|"), isoOf(date));
  }
  await Promise.all(unsure.map(async (folder) => void found.set([root, at, folder].join("|"), await searchFollow(root, `${folder}/brief.md`, at))));
}

function isoOf(date: string | null): string | null {
  const parsed = date === null ? null : new Date(date);
  return parsed === null || Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

/** `search` without blocking: the same rule, with the reads through `git` run asynchronously. */
async function searchFollow(root: string, path: string, ref: string): Promise<string | null> {
  const log = await gitAsync(root, ["log", "--follow", "--name-status", "--format=%x01%H%x1f%cI", ref, "--", path]);
  if (log.status !== 0) {
    return null;
  }
  let date: string | null = null;
  for (const entry of log.stdout.split(ENTRY).slice(1)) {
    const [first = "", ...files] = entry.split("\n");
    const [sha = "", when = ""] = first.split(FIELD);
    const change = files.find((l) => l.trim() !== "")?.split("\t") ?? [];
    const name = change[change.length - 1];
    const shown = name === undefined ? null : await gitAsync(root, ["show", `${sha}:${name}`]);
    if (shown === null || shown.status !== 0 || !DONE_LINE.test(shown.stdout)) {
      break;
    }
    date = when;
    if (!/^[MR]/.test(change[0] ?? "")) {
      break;
    }
  }
  return isoOf(date);
}

/** Forgets what was read, for tests. */
export function resetDoneDates(): void {
  found.clear();
}
