import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { parseBrief, type Brief } from "./brief.js";
import { FormatError } from "./frontmatter.js";

export const BRAID_FOLDER = /^(\d{4})-[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const STRAND_FOLDER = /^([A-Z])-[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const LOG_FILE = /^log-(\d{4}-\d{2}-\d{2})-([A-Za-z0-9]{8}|user|import)\.md$/;

/** Where an item was read from: a branch at a commit. Null means the working tree. */
export interface Source {
  /** The branch name as Git shows it: `braid/0006/A-x` or `origin/braid/0006/A-x`. */
  readonly branch: string;
  readonly commit: string;
}

/**
 * A read-only view of a repository's files: the working tree or one Git commit. Paths are
 * relative to the repository root, with forward slashes.
 */
export interface Tree {
  readonly source: Source | null;
  /** The entries of a folder, sorted; an empty list when it doesn't exist. */
  list(dir: string): readonly { readonly name: string; readonly isDir: boolean }[];
  /** A file's text; null when it doesn't exist. */
  read(file: string): string | null;
}

/** The working tree under `root`. */
export function fsTree(root: string): Tree {
  return {
    source: null,
    list(dir) {
      const path = join(root, dir);
      if (!existsSync(path) || !statSync(path).isDirectory()) {
        return [];
      }
      return readdirSync(path)
        .sort()
        .map((name) => ({ name, isDir: statSync(join(path, name)).isDirectory() }));
    },
    read(file) {
      const path = join(root, file);
      return existsSync(path) && statSync(path).isFile() ? readFileSync(path, "utf8") : null;
    },
  };
}

export interface Item {
  readonly brief: Brief;
  /** Where the brief, report and logs were read from; null for the working tree. */
  readonly source: Source | null;
  /** The folder, relative to the repository root, with forward slashes. */
  readonly folder: string;
  readonly hasReport: boolean;
  /** Log file names, sorted. */
  readonly logs: readonly string[];
}

export interface Strand extends Item {
  readonly letter: string;
}

export interface Braid extends Item {
  readonly number: string;
  /** In run order: `order` first (missing last), then letter. */
  readonly strands: readonly Strand[];
}

/** The nearest ancestor of `start` holding `braids/` or `.git`; `start` itself if none does. */
export function findRoot(start: string): string {
  let dir = resolve(start);
  for (;;) {
    if (existsSync(join(dir, "braids")) || existsSync(join(dir, ".git"))) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) {
      return resolve(start);
    }
    dir = parent;
  }
}

export function loadItem(tree: Tree, dir: string, id: string): Item {
  const name = `${dir}/brief.md`;
  const text = tree.read(name);
  if (text === null) {
    throw new FormatError(name, "file is missing");
  }
  const brief = parseBrief(text, name, id);
  const files = tree.list(dir).filter((e) => !e.isDir).map((e) => e.name);
  return {
    brief,
    source: tree.source,
    folder: dir,
    hasReport: files.includes("report.md"),
    logs: files.filter((entry) => LOG_FILE.test(entry)).sort(),
  };
}

export function byRunOrder(a: Strand, b: Strand): number {
  const oa = a.brief.order ?? Number.POSITIVE_INFINITY;
  const ob = b.brief.order ?? Number.POSITIVE_INFINITY;
  if (oa !== ob) {
    return oa < ob ? -1 : 1;
  }
  return a.letter < b.letter ? -1 : a.letter > b.letter ? 1 : 0;
}

/** Loads the braid in folder `dir` (like `braids/0002-x`) with its strands. */
export function loadBraid(tree: Tree, dir: string, number: string): Braid {
  const item = loadItem(tree, dir, number);
  const strands: Strand[] = [];
  const seen = new Map<string, string>();
  for (const entry of tree.list(dir)) {
    const match = STRAND_FOLDER.exec(entry.name);
    const path = `${dir}/${entry.name}`;
    if (!match || !entry.isDir) {
      continue;
    }
    const letter = match[1] ?? "";
    const other = seen.get(letter);
    if (other !== undefined) {
      throw new FormatError(path, `strand letter ${letter} is also used by ${other}`);
    }
    seen.set(letter, entry.name);
    strands.push({ ...loadItem(tree, path, `${number}/${letter}`), letter });
  }
  strands.sort(byRunOrder);
  return { ...item, number, strands };
}

/** Loads every braid under `braids/` of `tree`, sorted by number. No folder means no braids. */
export function loadTree(tree: Tree): Braid[] {
  const braids: Braid[] = [];
  const seen = new Map<string, string>();
  for (const entry of tree.list("braids")) {
    const path = `braids/${entry.name}`;
    if (!entry.isDir) {
      continue;
    }
    const match = BRAID_FOLDER.exec(entry.name);
    if (!match) {
      throw new FormatError(path, "folder name must be <4 digits>-<slug>, like 0002-braids-folder");
    }
    const number = match[1] ?? "";
    const other = seen.get(number);
    if (other !== undefined) {
      throw new FormatError(path, `braid number ${number} is also used by ${other}`);
    }
    seen.set(number, entry.name);
    braids.push(loadBraid(tree, path, number));
  }
  return braids;
}

/** Loads every braid under `<root>/braids` in the working tree, sorted by number. */
export function loadBraids(root: string): Braid[] {
  return loadTree(fsTree(root));
}
