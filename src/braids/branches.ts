// Live copies: a braid or strand being worked on lives on its own branch, so its brief there
// is newer than the copy in the working tree. Branch names (docs/braids-format.md):
// `braid/0006-<slug>` for a braid and `braid/0006/A-<slug>` for a strand, local or on a remote.
import { spawnSync } from "node:child_process";
import { FormatError } from "./frontmatter.js";
import { catBatch, gitAsync, noteSyncGit } from "./gitio.js";
import {
  BRAID_FOLDER,
  byRunOrder,
  fsTree,
  loadBraid,
  loadItem,
  loadTree,
  LOG_FILE,
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
  noteSyncGit(args);
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

/** Every local and remote-tracking branch whose name is a braid or strand branch; with `only`, that braid number's. */
export function braidBranches(root: string, only?: string): BranchRef[] {
  const r = git(root, refArgs(only));
  return r.status !== 0 ? [] : parseBranchRefs(r.stdout, only);
}

function refArgs(only?: string): string[] {
  const patterns =
    only === undefined
      ? // `*` doesn't match `/`: these are exactly the braid and strand branch shapes on any remote.
        ["refs/heads/braid/", "refs/remotes/*/braid/*", "refs/remotes/*/braid/*/*"]
      : [`refs/heads/braid/${only}-*`, `refs/heads/braid/${only}/*`, `refs/remotes/*/braid/${only}-*`, `refs/remotes/*/braid/${only}/*`];
  return ["for-each-ref", "--format=%(refname)%00%(objectname)%00%(committerdate:unix)", ...patterns];
}

function parseBranchRefs(stdout: string, only?: string): BranchRef[] {
  const refs: BranchRef[] = [];
  for (const line of stdout.split("\n")) {
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
    if (number === undefined || (only !== undefined && number !== only)) {
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
  /** The object's id: a file's text is cached by it, so the same text in many commits is read once. */
  readonly oid: string;
}

// Trees and file texts per commit. Commits never change, so these live as long as the process.
const trees = new Map<string, Map<string, Entry[]>>();
const blobs = new Map<string, string | null>();
const merged = new Map<string, boolean>();

function parseTree(stdout: string): Map<string, Entry[]> {
  const map = new Map<string, Entry[]>();
  for (const record of stdout.split("\0")) {
    const m = /^\d+ (\w+) (\w+)	(.+)$/s.exec(record);
    if (!m) {
      continue;
    }
    const path = m[3] ?? "";
    const cut = path.lastIndexOf("/");
    const dir = cut < 0 ? "" : path.slice(0, cut);
    const list = map.get(dir) ?? [];
    list.push({ name: path.slice(cut + 1), isDir: m[1] === "tree", oid: m[2] ?? "" });
    map.set(dir, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  }
  return map;
}

const treeArgs = (commit: string) => ["ls-tree", "-r", "-t", "-z", commit, "--", "braids"];

function folders(root: string, commit: string): Map<string, Entry[]> {
  const cached = trees.get(commit);
  if (cached !== undefined) {
    return cached;
  }
  const r = git(root, treeArgs(commit));
  const map = r.status === 0 ? parseTree(r.stdout) : new Map<string, Entry[]>();
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
      const entry = (folders(root, source.commit).get(dir) ?? []).find((e) => e.name === name && !e.isDir);
      if (entry === undefined) {
        return null;
      }
      if (!blobs.has(entry.oid)) {
        const r = git(root, ["cat-file", "blob", entry.oid]);
        blobs.set(entry.oid, r.status === 0 ? r.stdout : null);
      }
      return blobs.get(entry.oid) ?? null;
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

/** Whether a strand's commit is already in its braid branch's tip, so the braid branch has its copy or a newer one. */
function inBraid(root: string, tip: string | undefined, commit: string): boolean {
  return tip !== undefined && inHead(root, tip, commit);
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
 * exist only on a branch are added. With `only`, just that braid number's branches are read.
 */
export function loadLiveBraids(root: string, only?: string): Braid[] {
  const slots = new Map<string, Slot>();
  for (const braid of loadTree(fsTree(root))) {
    slots.set(braid.number, { item: braid, strands: new Map(braid.strands.map((s) => [s.letter, s])) });
  }
  const headResult = git(root, ["rev-parse", "--verify", "--quiet", "HEAD"]);
  const head = headResult.status === 0 ? headResult.stdout.trim() : null;
  // Only each item's newest copy is checked against HEAD: if it is merged, the older ones are too old.
  const newest = winners(braidBranches(root, only));
  const braidTips = new Map(newest.filter((r) => r.letter === null).map((r) => [r.number, r.commit]));
  const refs = newest
    .filter((ref) => head === null || !inHead(root, head, ref.commit))
    // A merged strand branch stays on the remote and can be older than its braid branch's copy: that copy wins.
    .filter((ref) => ref.letter === null || !inBraid(root, braidTips.get(ref.number), ref.commit));
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

/** Runs `work` over `items`, a few at a time. */
async function limited<T>(items: readonly T[], work: (item: T) => Promise<void>, size = 8): Promise<void> {
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (next < items.length) {
        await work(items[next++] as T);
      }
    }),
  );
}

async function inHeadAsync(root: string, head: string, commit: string): Promise<boolean> {
  const key = `${commit}:${head}`;
  let value = merged.get(key);
  if (value === undefined) {
    value = (await gitAsync(root, ["merge-base", "--is-ancestor", commit, head])).status === 0;
    merged.set(key, value);
  }
  return value;
}

/**
 * Reads, without blocking and with one `git cat-file --batch` process, what `loadLiveBraids` will need: the
 * merge checks, the trees of the branches it reads and the briefs, reports and logs in them. It fills the caches the
 * synchronous loader reads, so that one then runs no `git` process per file.
 */
async function prefetchLive(root: string, only?: string): Promise<void> {
  const listed = await gitAsync(root, refArgs(only));
  if (listed.status !== 0) {
    return;
  }
  const headResult = await gitAsync(root, ["rev-parse", "--verify", "--quiet", "HEAD"]);
  const head = headResult.status === 0 ? headResult.stdout.trim() : null;
  const newest = winners(parseBranchRefs(listed.stdout, only));
  if (head !== null) {
    await limited(newest, (ref) => inHeadAsync(root, head, ref.commit).then(() => undefined));
  }
  const braidTips = new Map(newest.filter((r) => r.letter === null).map((r) => [r.number, r.commit]));
  const open = newest.filter((ref) => head === null || !merged.get(`${ref.commit}:${head}`));
  await limited(
    open.filter((ref) => ref.letter !== null && braidTips.has(ref.number)),
    (ref) => inHeadAsync(root, braidTips.get(ref.number) ?? "", ref.commit).then(() => undefined),
  );
  const commits = [...new Set(open.map((r) => r.commit))].filter((c) => !trees.has(c));
  await limited(commits, async (commit) => {
    const r = await gitAsync(root, treeArgs(commit));
    trees.set(commit, r.status === 0 ? parseTree(r.stdout) : new Map());
  });
  // The briefs, reports and logs are what the board reads; the same text in many commits has one id.
  const wanted = new Set<string>();
  for (const commit of new Set(open.map((r) => r.commit))) {
    for (const list of trees.get(commit)?.values() ?? []) {
      for (const e of list) {
        if (!e.isDir && (e.name === "brief.md" || e.name === "report.md" || LOG_FILE.test(e.name)) && !blobs.has(e.oid)) {
          wanted.add(e.oid);
        }
      }
    }
  }
  const ids = [...wanted];
  const texts = await catBatch(root, ids);
  ids.forEach((id, i) => {
    const text = texts[i];
    if (text !== null && text !== undefined) {
      blobs.set(id, text);
    }
  });
}

/** `loadLiveBraids` without blocking the process while Git runs: the same braids, read through one `git cat-file --batch`. */
export async function loadLiveBraidsAsync(root: string, only?: string): Promise<Braid[]> {
  await prefetchLive(root, only);
  return loadLiveBraids(root, only);
}

/** Local and remote-tracking `plan/<slug>` branches (a planning branch's name holds no braid number). */
function planBranches(root: string): { branch: string; commit: string; time: number; local: boolean }[] {
  const r = git(root, [
    "for-each-ref",
    "--format=%(refname)%00%(objectname)%00%(committerdate:unix)",
    "refs/heads/plan/",
    "refs/remotes/*/plan/*",
  ]);
  if (r.status !== 0) {
    return [];
  }
  const refs: { branch: string; commit: string; time: number; local: boolean }[] = [];
  for (const line of r.stdout.split("\n")) {
    const [ref = "", commit = "", time = "0"] = line.split("\0");
    const local = ref.startsWith("refs/heads/");
    const remote = /^refs\/remotes\/([^/]+)\/(plan\/.+)$/.exec(ref);
    const name = local ? ref.slice("refs/heads/".length) : remote === null ? undefined : `${remote[1] ?? ""}/${remote[2] ?? ""}`;
    if (name !== undefined) {
      refs.push({ branch: name, commit, time: Number(time), local });
    }
  }
  // Newest first, a local branch on a tie: the first copy of a braid wins.
  return refs.sort((a, b) => b.time - a.time || Number(b.local) - Number(a.local));
}

/**
 * Every braid braid can see, in number order, Done ones too: what `loadLiveBraids` reads, plus
 * braids found only on a `plan/` branch not merged into HEAD. A `plan/` copy never overrides a
 * copy from the working tree or a braid branch. With `only`, just that braid number's branches
 * are read, and the `plan/` branches only when no other source has it.
 */
export function loadKnownBraids(root: string, only?: string): Braid[] {
  const braids = loadLiveBraids(root, only);
  const known = new Set(braids.map((b) => b.number));
  if (only !== undefined && known.has(only)) {
    return braids;
  }
  const headResult = git(root, ["rev-parse", "--verify", "--quiet", "HEAD"]);
  const head = headResult.status === 0 ? headResult.stdout.trim() : null;
  for (const ref of planBranches(root)) {
    if (head !== null && inHead(root, head, ref.commit)) {
      continue;
    }
    const t = gitTree(root, { branch: ref.branch, commit: ref.commit });
    for (const entry of t.list("braids")) {
      const number = entry.isDir ? BRAID_FOLDER.exec(entry.name)?.[1] : undefined;
      if (number === undefined || known.has(number) || (only !== undefined && number !== only)) {
        continue;
      }
      const braid = attempt(() => loadBraid(t, `braids/${entry.name}`, number));
      if (braid !== null) {
        known.add(number);
        braids.push(braid);
      }
    }
  }
  return braids.sort((a, b) => (a.number < b.number ? -1 : a.number > b.number ? 1 : 0));
}

/** Every braid whose status is not Done, wherever it lives (`loadKnownBraids`). */
export function loadOpenBraids(root: string): Braid[] {
  return loadKnownBraids(root).filter((b) => b.brief.status !== "Done");
}
