// Live copies: a braid or strand being worked on lives on its own branch, so its brief there
// is newer than the copy in the working tree. Branch names (docs/braids-format.md):
// `braid/0006-<slug>` for a braid and `braid/0006/A-<slug>` for a strand, local or on a remote.
import { spawnSync } from "node:child_process";
import { FormatError } from "./frontmatter.js";
import {
  BRAID_FOLDER,
  byRunOrder,
  fsTree,
  loadBraid,
  loadItem,
  loadTree,
  STRAND_FOLDER,
  type Braid,
  type Item,
  type Source,
  type Strand,
  type Tree,
} from "./store.js";

export const BRAID_BRANCH = /^braid\/(\d{4})-[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const STRAND_BRANCH = /^braid\/(\d{4})\/([A-Z])-[a-z0-9]+(?:-[a-z0-9]+)*$/;

function git(root: string, args: readonly string[]) {
  return spawnSync("git", ["-c", "core.quotePath=false", ...args], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024,
  });
}

/** A braid or strand branch, local or remote-tracking. */
export interface BranchRef {
  /** As Git shows it: `braid/0006/A-x` or `origin/braid/0006/A-x`. */
  readonly branch: string;
  readonly commit: string;
  /** Committer time in seconds. */
  readonly time: number;
  readonly local: boolean;
  readonly number: string;
  /** The strand letter; null for a braid branch. */
  readonly letter: string | null;
}

/** Every local and remote-tracking branch whose name is a braid or strand branch. */
export function braidBranches(root: string): BranchRef[] {
  const r = git(root, [
    "for-each-ref",
    "--format=%(refname)%00%(objectname)%00%(committerdate:unix)",
    "refs/heads/braid/",
    "refs/remotes/",
  ]);
  if (r.status !== 0) {
    return [];
  }
  const refs: BranchRef[] = [];
  for (const line of r.stdout.split("\n")) {
    const [ref = "", commit = "", time = "0"] = line.split("\0");
    const local = ref.startsWith("refs/heads/");
    const remote = /^refs\/remotes\/([^/]+)\/(braid\/.+)$/.exec(ref);
    const name = local ? ref.slice("refs/heads/".length) : remote?.[2];
    if (name === undefined) {
      continue;
    }
    const strand = STRAND_BRANCH.exec(name);
    const braid = BRAID_BRANCH.exec(name);
    const number = strand?.[1] ?? braid?.[1];
    if (number === undefined) {
      continue;
    }
    refs.push({
      branch: local ? name : `${remote?.[1] ?? ""}/${name}`,
      commit,
      time: Number(time),
      local,
      number,
      letter: strand?.[2] ?? null,
    });
  }
  return refs;
}

interface Entry {
  readonly name: string;
  readonly isDir: boolean;
}

// Trees and file texts per commit. Commits never change, so these live as long as the process.
const trees = new Map<string, Map<string, Entry[]>>();
const blobs = new Map<string, string | null>();
const merged = new Map<string, boolean>();

function folders(root: string, commit: string): Map<string, Entry[]> {
  const cached = trees.get(commit);
  if (cached !== undefined) {
    return cached;
  }
  const map = new Map<string, Entry[]>();
  const r = git(root, ["ls-tree", "-r", "-t", "-z", commit, "--", "braids"]);
  if (r.status === 0) {
    for (const record of r.stdout.split("\0")) {
      const m = /^\d+ (\w+) \w+\t(.+)$/s.exec(record);
      if (!m) {
        continue;
      }
      const path = m[2] ?? "";
      const cut = path.lastIndexOf("/");
      const dir = cut < 0 ? "" : path.slice(0, cut);
      const list = map.get(dir) ?? [];
      list.push({ name: path.slice(cut + 1), isDir: m[1] === "tree" });
      map.set(dir, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    }
  }
  trees.set(commit, map);
  return map;
}

/** The files under `braids/` at `source.commit`, read with `git ls-tree` and `git cat-file`. */
export function gitTree(root: string, source: Source): Tree {
  return {
    source,
    list: (dir) => folders(root, source.commit).get(dir) ?? [],
    read(file) {
      const cut = file.lastIndexOf("/");
      const dir = cut < 0 ? "" : file.slice(0, cut);
      const name = file.slice(cut + 1);
      if (!(folders(root, source.commit).get(dir) ?? []).some((e) => e.name === name && !e.isDir)) {
        return null;
      }
      const key = `${source.commit}:${file}`;
      if (!blobs.has(key)) {
        const r = git(root, ["cat-file", "blob", key]);
        blobs.set(key, r.status === 0 ? r.stdout : null);
      }
      return blobs.get(key) ?? null;
    },
  };
}

/** The tree an item was read from. */
export function treeOf(root: string, item: Item): Tree {
  return item.source === null ? fsTree(root) : gitTree(root, item.source);
}

/** Whether `commit` is already in HEAD; then the working tree has its copy, or a newer one. */
function inHead(root: string, head: string, commit: string): boolean {
  const key = `${commit}:${head}`;
  let value = merged.get(key);
  if (value === undefined) {
    value = git(root, ["merge-base", "--is-ancestor", commit, head]).status === 0;
    merged.set(key, value);
  }
  return value;
}

/** Per braid number or strand id, the branch to read: the newest commit, a local branch on a tie. */
function winners(refs: readonly BranchRef[]): BranchRef[] {
  const best = new Map<string, BranchRef>();
  for (const ref of refs) {
    const key = ref.letter === null ? ref.number : `${ref.number}/${ref.letter}`;
    const other = best.get(key);
    if (other === undefined || ref.time > other.time || (ref.time === other.time && ref.local && !other.local)) {
      best.set(key, ref);
    }
  }
  return [...best.values()];
}

function braidFolder(tree: Tree, number: string): string | null {
  const entry = tree.list("braids").find((e) => e.isDir && BRAID_FOLDER.exec(e.name)?.[1] === number);
  return entry === undefined ? null : `braids/${entry.name}`;
}

function strandFolder(tree: Tree, dir: string, letter: string): string | null {
  const entry = tree.list(dir).find((e) => e.isDir && STRAND_FOLDER.exec(e.name)?.[1] === letter);
  return entry === undefined ? null : `${dir}/${entry.name}`;
}

/** A failed load on a branch only means that branch's copy is not used. */
function attempt<T>(load: () => T): T | null {
  try {
    return load();
  } catch (error) {
    if (error instanceof FormatError) {
      return null;
    }
    throw error;
  }
}

interface Slot {
  item: Item;
  strands: Map<string, Strand>;
}

/**
 * The braids of the working tree with live copies from braid and strand branches: a strand's
 * brief comes from its strand branch, else from its braid's branch, else from the working tree;
 * a braid's own brief from its braid branch, else the working tree. Branches already in HEAD
 * are skipped, and so is a branch whose copy is missing or malformed. Braids and strands that
 * exist only on a branch are added.
 */
export function loadLiveBraids(root: string): Braid[] {
  const slots = new Map<string, Slot>();
  for (const braid of loadTree(fsTree(root))) {
    slots.set(braid.number, { item: braid, strands: new Map(braid.strands.map((s) => [s.letter, s])) });
  }
  const headResult = git(root, ["rev-parse", "--verify", "--quiet", "HEAD"]);
  const head = headResult.status === 0 ? headResult.stdout.trim() : null;
  const refs = winners(braidBranches(root).filter((ref) => head === null || !inHead(root, head, ref.commit)));
  const tree = (ref: BranchRef) => gitTree(root, { branch: ref.branch, commit: ref.commit });

  for (const ref of refs.filter((r) => r.letter === null)) {
    const t = tree(ref);
    const dir = braidFolder(t, ref.number);
    const braid = dir === null ? null : attempt(() => loadBraid(t, dir, ref.number));
    if (braid === null) {
      continue;
    }
    const slot = slots.get(ref.number) ?? { item: braid, strands: new Map<string, Strand>() };
    slot.item = braid;
    for (const strand of braid.strands) {
      slot.strands.set(strand.letter, strand);
    }
    slots.set(ref.number, slot);
  }

  for (const ref of refs) {
    const letter = ref.letter;
    if (letter === null) {
      continue;
    }
    const t = tree(ref);
    const dir = braidFolder(t, ref.number);
    const sdir = dir === null ? null : strandFolder(t, dir, letter);
    const strand = sdir === null ? null : attempt(() => loadItem(t, sdir, `${ref.number}/${letter}`));
    if (dir === null || strand === null) {
      continue;
    }
    let slot = slots.get(ref.number);
    if (slot === undefined) {
      const item = attempt(() => loadItem(t, dir, ref.number));
      if (item === null) {
        continue;
      }
      slot = { item, strands: new Map() };
      slots.set(ref.number, slot);
    }
    slot.strands.set(letter, { ...strand, letter });
  }

  return [...slots.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([number, slot]) => ({ ...slot.item, number, strands: [...slot.strands.values()].sort(byRunOrder) }));
}
