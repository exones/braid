import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { loadKnownBraids } from "./branches.js";
import { availablePresets, delegatedGuarded, parsePreset, projectDefault, projectPresetFiles, PRESET_NAME, type Preset } from "./autonomy.js";
import { SHIPPED_PRESETS } from "./presets.js";
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

interface Checked {
  readonly name: string;
  readonly related: readonly string[];
  readonly autonomy: string | null;
}

/** Validates one brief; returns its file name, `related` ids and preset, or null when it fails. */
function checkBrief(root: string, dir: string, id: string, errors: string[]): Checked | null {
  const path = join(dir, "brief.md");
  const name = display(root, path);
  if (!existsSync(path)) {
    errors.push(`${name}: file is missing`);
    return null;
  }
  try {
    const brief = parseBrief(readFileSync(path, "utf8"), name, id);
    return { name, related: brief.related, autonomy: brief.autonomy };
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
function relatedWarnings(root: string, all: readonly Checked[]): string[] {
  const links = all.filter((link) => link.related.length > 0);
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
  const links: Checked[] = [];
  let braids = 0;
  let strands = 0;
  if (!existsSync(base)) {
    const presets = presetProblems(root, links);
    return { errors: presets.errors, warnings: presets.warnings, braids, strands };
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
  const presets = presetProblems(root, links);
  return { errors: [...errors, ...presets.errors], warnings: [...relatedWarnings(root, links), ...presets.warnings], braids, strands };
}

/**
 * The preset rules: each project file under autonomy/ parses; BRAID.md and every brief name a
 * preset that exists. A preset that lets the agents decide security, data or outward is a warning:
 * every project file, and a shipped preset only when something here names it.
 */
function presetProblems(root: string, briefs: readonly Checked[]): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const warn = (where: string, preset: Preset) => {
    const cases = delegatedGuarded(preset);
    if (cases.length > 0) {
      warnings.push(`${where}: preset ${preset.name} lets the agents decide ${cases.join(", ")} (allowed; make sure it is meant)`);
    }
  };
  for (const [name, source] of projectPresetFiles(root)) {
    if (!PRESET_NAME.test(name)) {
      errors.push(`${source.from}: a preset file name must be lowercase letters and digits joined by single hyphens, like steady.md`);
      continue;
    }
    try {
      warn(source.from, parsePreset(source.text, source.from, name));
    } catch (error) {
      if (error instanceof FormatError) {
        errors.push(`${error.file}: ${error.message}`);
        continue;
      }
      throw error;
    }
  }
  const available = availablePresets(root);
  const named = new Set<string>();
  const known = (where: string, name: string) => {
    if (available.has(name)) {
      named.add(name);
    } else {
      errors.push(`${where}: autonomy preset ${name} does not exist (no autonomy/${name}.md and no shipped preset ${name}; shipped: ${[...SHIPPED_PRESETS.keys()].join(", ")})`);
    }
  };
  const fallback = projectDefault(root);
  if (fallback !== null) {
    if (PRESET_NAME.test(fallback)) {
      known("BRAID.md", fallback);
    } else {
      errors.push(`BRAID.md: autonomy must be a preset name like steady; got: ${fallback}`);
    }
  }
  for (const brief of briefs) {
    if (brief.autonomy !== null) {
      known(brief.name, brief.autonomy);
    }
  }
  for (const name of named) {
    const source = available.get(name);
    if (source?.from === "shipped") {
      warn(`shipped preset ${name}`, parsePreset(source.text, `shipped preset ${name}`, name));
    }
  }
  return { errors, warnings };
}
