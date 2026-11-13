import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { parseBrief } from "./brief.js";
import { FormatError } from "./frontmatter.js";
import { BRAID_FOLDER, STRAND_FOLDER } from "./store.js";

export interface CheckResult {
  /** One line per problem: `<file>: <message>`. */
  readonly errors: readonly string[];
  readonly braids: number;
  readonly strands: number;
}

function display(root: string, path: string): string {
  return relative(root, path).split(sep).join("/");
}

function checkBrief(root: string, dir: string, id: string, errors: string[]): void {
  const path = join(dir, "brief.md");
  const name = display(root, path);
  if (!existsSync(path)) {
    errors.push(`${name}: file is missing`);
    return;
  }
  try {
    parseBrief(readFileSync(path, "utf8"), name, id);
  } catch (error) {
    if (error instanceof FormatError) {
      errors.push(`${error.file}: ${error.message}`);
      return;
    }
    throw error;
  }
}

/**
 * Validates every brief under `<root>/braids`, like `loadBraids` but without stopping
 * at the first problem. A missing `braids/` folder is a clean result.
 */
export function checkBraids(root: string): CheckResult {
  const base = join(root, "braids");
  const errors: string[] = [];
  let braids = 0;
  let strands = 0;
  if (!existsSync(base)) {
    return { errors, braids, strands };
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
    checkBrief(root, dir, number, errors);
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
  return { errors, braids, strands };
}
