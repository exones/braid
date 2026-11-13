import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { parseBrief, type Brief } from "./brief.js";
import { FormatError } from "./frontmatter.js";

export const BRAID_FOLDER = /^(\d{4})-[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const STRAND_FOLDER = /^([A-Z])-[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const LOG_FILE = /^log-(\d{4}-\d{2}-\d{2})-([A-Za-z0-9]{8}|user)\.md$/;

export interface Item {
  readonly brief: Brief;
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

function display(root: string, path: string): string {
  return relative(root, path).split(sep).join("/");
}

function isDir(path: string): boolean {
  return statSync(path).isDirectory();
}

function loadItem(root: string, dir: string, id: string): Item {
  const briefPath = join(dir, "brief.md");
  const name = display(root, briefPath);
  if (!existsSync(briefPath)) {
    throw new FormatError(name, "file is missing");
  }
  const brief = parseBrief(readFileSync(briefPath, "utf8"), name, id);
  const entries = readdirSync(dir);
  return {
    brief,
    folder: display(root, dir),
    hasReport: entries.includes("report.md"),
    logs: entries.filter((entry) => LOG_FILE.test(entry)).sort(),
  };
}

function byRunOrder(a: Strand, b: Strand): number {
  const oa = a.brief.order ?? Number.POSITIVE_INFINITY;
  const ob = b.brief.order ?? Number.POSITIVE_INFINITY;
  if (oa !== ob) {
    return oa < ob ? -1 : 1;
  }
  return a.letter < b.letter ? -1 : a.letter > b.letter ? 1 : 0;
}

function loadBraid(root: string, dir: string, number: string): Braid {
  const item = loadItem(root, dir, number);
  const strands: Strand[] = [];
  const seen = new Map<string, string>();
  for (const entry of readdirSync(dir).sort()) {
    const match = STRAND_FOLDER.exec(entry);
    const path = join(dir, entry);
    if (!match || !isDir(path)) {
      continue;
    }
    const letter = match[1] ?? "";
    const other = seen.get(letter);
    if (other !== undefined) {
      throw new FormatError(display(root, path), `strand letter ${letter} is also used by ${other}`);
    }
    seen.set(letter, entry);
    strands.push({ ...loadItem(root, path, `${number}/${letter}`), letter });
  }
  strands.sort(byRunOrder);
  return { ...item, number, strands };
}

/** Loads every braid under `<root>/braids`, sorted by number. No folder means no braids. */
export function loadBraids(root: string): Braid[] {
  const base = join(root, "braids");
  if (!existsSync(base)) {
    return [];
  }
  const braids: Braid[] = [];
  const seen = new Map<string, string>();
  for (const entry of readdirSync(base).sort()) {
    const path = join(base, entry);
    if (!isDir(path)) {
      continue;
    }
    const match = BRAID_FOLDER.exec(entry);
    if (!match) {
      throw new FormatError(display(root, path), "folder name must be <4 digits>-<slug>, like 0002-braids-folder");
    }
    const number = match[1] ?? "";
    const other = seen.get(number);
    if (other !== undefined) {
      throw new FormatError(display(root, path), `braid number ${number} is also used by ${other}`);
    }
    seen.set(number, entry);
    braids.push(loadBraid(root, path, number));
  }
  return braids;
}
