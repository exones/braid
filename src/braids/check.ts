import { loadKnownBraids } from "./branches.js";
import { availablePresets, delegatedGuarded, parsePreset, projectDefault, projectPresetFiles, PRESET_NAME, type Preset } from "./autonomy.js";
import { SHIPPED_PRESETS } from "./presets.js";
import { parseBrief } from "./brief.js";
import { FormatError } from "./frontmatter.js";
import { BRAID_FOLDER, fsTree, STRAND_FOLDER, type WorkingFiles } from "./store.js";

export interface CheckResult {
  /** One line per problem: `<file>: <message>`. */
  readonly errors: readonly string[];
  /** One line per warning: `<file>: <message>`. Warnings don't fail the check. */
  readonly warnings: readonly string[];
  readonly braids: number;
  readonly strands: number;
}

interface Checked {
  readonly name: string;
  readonly related: readonly string[];
  readonly autonomy: string | null;
}

/** Validates one brief; returns its file name, `related` ids and preset, or null when it fails. */
function checkBrief(tree: WorkingFiles, dir: string, id: string, errors: string[]): Checked | null {
  const name = `${dir}/brief.md`;
  const text = tree.read(name);
  if (text === null) {
    errors.push(`${name}: file is missing`);
    return null;
  }
  try {
    const brief = parseBrief(text, name, id);
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
 * at the first problem. A missing `braids/` folder is a clean result. `tree` is where the
 * files are read from; `related: false` leaves out the `related` warnings, which read every branch.
 */
export function checkBraids(root: string, { tree = fsTree(root), related = true }: { readonly tree?: WorkingFiles; readonly related?: boolean } = {}): CheckResult {
  const errors: string[] = [];
  const links: Checked[] = [];
  let braids = 0;
  let strands = 0;
  if (!tree.exists("braids")) {
    const presets = presetProblems(root, tree, links);
    return { errors: presets.errors, warnings: presets.warnings, braids, strands };
  }
  const numbers = new Map<string, string>();
  for (const { name: entry, isDir } of tree.list("braids")) {
    const dir = `braids/${entry}`;
    if (!isDir) {
      continue;
    }
    const match = BRAID_FOLDER.exec(entry);
    if (!match) {
      errors.push(`${dir}: folder name must be <4 digits>-<slug>, like 0002-braids-folder`);
      continue;
    }
    const number = match[1] ?? "";
    const other = numbers.get(number);
    if (other !== undefined) {
      errors.push(`${dir}: braid number ${number} is also used by ${other}`);
      continue;
    }
    numbers.set(number, entry);
    braids += 1;
    const link = checkBrief(tree, dir, number, errors);
    if (link !== null) {
      links.push(link);
    }
    const letters = new Map<string, string>();
    for (const sub of tree.list(dir)) {
      const strandDir = `${dir}/${sub.name}`;
      const found = STRAND_FOLDER.exec(sub.name);
      if (!found || !sub.isDir) {
        continue;
      }
      const letter = found[1] ?? "";
      const used = letters.get(letter);
      if (used !== undefined) {
        errors.push(`${strandDir}: strand letter ${letter} is also used by ${used}`);
        continue;
      }
      letters.set(letter, sub.name);
      strands += 1;
      checkBrief(tree, strandDir, `${number}/${letter}`, errors);
    }
  }
  const presets = presetProblems(root, tree, links);
  const warnings = related ? relatedWarnings(root, links) : [];
  return { errors: [...errors, ...presets.errors, ...docsProblems(tree)], warnings: [...warnings, ...presets.warnings], braids, strands };
}

/**
 * The preset rules: each project file under autonomy/ parses; BRAID.md and every brief name a
 * preset that exists. A preset that lets the agents decide security, data or outward is a warning:
 * every project file, and a shipped preset only when something here names it.
 */
function presetProblems(root: string, tree: WorkingFiles, briefs: readonly Checked[]): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const warn = (where: string, preset: Preset) => {
    const cases = delegatedGuarded(preset);
    if (cases.length > 0) {
      warnings.push(`${where}: preset ${preset.name} lets the agents decide ${cases.join(", ")} (allowed; make sure it is meant)`);
    }
  };
  for (const [name, source] of projectPresetFiles(root, tree)) {
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
  const available = availablePresets(root, tree);
  const named = new Set<string>();
  const known = (where: string, name: string) => {
    if (available.has(name)) {
      named.add(name);
    } else {
      errors.push(`${where}: autonomy preset ${name} does not exist (no autonomy/${name}.md and no shipped preset ${name}; shipped: ${[...SHIPPED_PRESETS.keys()].join(", ")})`);
    }
  };
  const fallback = projectDefault(root, tree);
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

const DOCS_UPDATE = ["strand", "braid", "both", "on-demand"];

/** The `docs` key of BRAID.md's front matter: `update` must be one of DOCS_UPDATE, `public` and `internal` lists. A BRAID.md without `docs` is valid. */
function docsProblems(tree: WorkingFiles): string[] {
  const text = tree.read("BRAID.md");
  if (text === null) {
    return [];
  }
  const front = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)?.[1] ?? "";
  const lines = front.split(/\r?\n/);
  const start = lines.findIndex((l) => /^docs:/.test(l));
  if (start === -1) {
    return [];
  }
  const inline = /^docs:[ \t]*(.*?)[ \t]*$/.exec(lines[start] ?? "")?.[1] ?? "";
  if (inline !== "") {
    return [`BRAID.md: docs must be a nested key with update, public and internal; got: ${inline}`];
  }
  const block: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (/^\S/.test(line)) {
      break;
    }
    block.push(line);
  }
  const problems: string[] = [];
  const unquote = (v: string) => v.replace(/^(["'])(.*)\1$/, "$2");
  const update = /^[ \t]+update:[ \t]*(.*?)[ \t]*$/m.exec(block.join("\n"))?.[1];
  if (update !== undefined && !DOCS_UPDATE.includes(unquote(update))) {
    problems.push(`BRAID.md: docs.update must be one of ${DOCS_UPDATE.join(", ")}; got: ${unquote(update)}`);
  }
  for (const key of ["public", "internal"]) {
    const at = block.findIndex((l) => new RegExp(`^[ \t]+${key}:`).test(l));
    if (at === -1) {
      continue;
    }
    const rest = /:[ \t]*(.*?)[ \t]*$/.exec(block[at] ?? "")?.[1] ?? "";
    const next = block.slice(at + 1).find((l) => l.trim() !== "");
    const isList = rest !== "" ? /^\[.*\]$/.test(rest) : next !== undefined && /^[ \t]+-/.test(next);
    if (!isList) {
      problems.push(`BRAID.md: docs.${key} must be a list of files or folders${rest === "" ? "" : `; got: ${rest}`}`);
    }
  }
  return problems;
}
