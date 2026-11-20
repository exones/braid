import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { loadKnownBraids } from "./branches.js";
import { parseBrief } from "./brief.js";
import { FormatError } from "./frontmatter.js";
import { BRAID_FOLDER, STRAND_FOLDER } from "./store.js";

export interface CheckResult {
  /** One line per problem: `<file>: <message>`. */
  readonly errors: readonly string[];
  /** One line per warning: `<file>: <message>`. Warnings don't fail the check. */
  readonly warnings: readonly string[];
  readonly braids: number;
  readonly strands: number;
}

function display(root: string, path: string): string {
  return relative(root, path).split(sep).join("/");
}

/** Validates one brief; returns its `related` ids with its file name, or null when it has none or fails. */
function checkBrief(root: string, dir: string, id: string, errors: string[]): { name: string; related: readonly string[] } | null {
  const path = join(dir, "brief.md");
  const name = display(root, path);
  if (!existsSync(path)) {
    errors.push(`${name}: file is missing`);
    return null;
  }
  try {
    const brief = parseBrief(readFileSync(path, "utf8"), name, id);
    return brief.related.length === 0 ? null : { name, related: brief.related };
  } catch (error) {
    if (error instanceof FormatError) {
      errors.push(`${error.file}: ${error.message}`);
      return null;
    }
    throw error;
  }
}

/**
 * A `related` id found in no source (working tree, braid and strand branches, `plan/` branches) is a
 * warning, not an error: the braid it names may live on a branch this checkout hasn't fetched.
 */
function relatedWarnings(root: string, links: readonly { name: string; related: readonly string[] }[]): string[] {
  if (links.length === 0) {
    return [];
  }
  let known: Set<string>;
  try {
    known = new Set(loadKnownBraids(root).map((b) => b.number));
  } catch (error) {
    // A malformed brief in the working tree is already an error of its own.
    if (error instanceof FormatError) {
      return [];
    }
    throw error;
  }
  return links.flatMap(({ name, related }) =>
    related
      .filter((id) => !known.has(id))
      .map((id) => `${name}: related braid ${id} is not in the working tree or on any braid or plan/ branch here (fetch, or check the id)`),
  );
}

/**
 * Validates every brief under `<root>/braids`, like `loadBraids` but without stopping
 * at the first problem. A missing `braids/` folder is a clean result.
 */
export function checkBraids(root: string): CheckResult {
  const base = join(root, "braids");
  const errors: string[] = [];
  const links: { name: string; related: readonly string[] }[] = [];
  let braids = 0;
  let strands = 0;
  if (!existsSync(base)) {
    return { errors, warnings: [], braids, strands };
  }
  const numbers = new Map<string, string>();
  for (const entry of readdirSync(base).sort()) {
    const dir = join(base, entry);
    if (!statSync(dir).isDirectory()) {
      continue;
    }
    const match = BRAID_FOLDER.exec(entry);
    if (!match) {
      errors.push(`${display(root, dir)}: folder name must be <4 digits>-<slug>, like 0002-braids-folder`);
      continue;
    }
    const number = match[1] ?? "";
    const other = numbers.get(number);
    if (other !== undefined) {
      errors.push(`${display(root, dir)}: braid number ${number} is also used by ${other}`);
      continue;
    }
    numbers.set(number, entry);
    braids += 1;
    const link = checkBrief(root, dir, number, errors);
    if (link !== null) {
      links.push(link);
    }
    const letters = new Map<string, string>();
    for (const sub of readdirSync(dir).sort()) {
      const strandDir = join(dir, sub);
      const found = STRAND_FOLDER.exec(sub);
      if (!found || !statSync(strandDir).isDirectory()) {
        continue;
      }
      const letter = found[1] ?? "";
      const used = letters.get(letter);
      if (used !== undefined) {
        errors.push(`${display(root, strandDir)}: strand letter ${letter} is also used by ${used}`);
        continue;
      }
      letters.set(letter, sub);
      strands += 1;
      checkBrief(root, strandDir, `${number}/${letter}`, errors);
    }
  }
  return { errors, warnings: relatedWarnings(root, links), braids, strands };
}
