// Autonomy presets: one Markdown file each, with front matter for what the CLI can enforce and a
// table of the stop cases for the agents. The CLI checks the table's shape, never its meaning.
import { PRESET_NAME } from "./brief.js";
import { FormatError, parseFrontMatter } from "./frontmatter.js";
import { DEFAULT_PRESET, SHIPPED_PRESETS } from "./presets.js";
import { fsTree, type Tree } from "./store.js";

/** The stop-case keys of the braid skill's stop-cases.md, in its order. */
export const STOP_CASES = ["security", "dependency", "architecture", "data", "process", "outward", "scope", "quality"] as const;
export const MERGE_MODES = ["none", "strands", "all"] as const;
export const CONTINUE_MODES = ["yes", "no"] as const;
const COLUMNS = ["Case", "Decide yourself when", "Ask me when"];
const KEYS = new Set(["name", "merge", "continue"]);
/** Cases a preset is warned about when it lets the agents decide them. */
const GUARDED = ["security", "data", "outward"];

export interface PresetRow {
  readonly cases: readonly string[];
  readonly decide: string;
  readonly ask: string;
}

export interface Preset {
  readonly name: string;
  readonly merge: (typeof MERGE_MODES)[number];
  readonly continue: (typeof CONTINUE_MODES)[number];
  readonly rows: readonly PresetRow[];
}

const cells = (line: string): string[] =>
  line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());

/**
 * Parses a preset file. `expectedName` is the name its file or the shipped list gives it; the
 * front matter must match it. Every error names `file`.
 */
export function parsePreset(text: string, file: string, expectedName: string): Preset {
  const front = parseFrontMatter(text, file);
  const where = (key: string) => {
    const line = front.lines.get(key);
    return line === undefined ? "" : `line ${line}: `;
  };
  for (const key of front.fields.keys()) {
    if (!KEYS.has(key)) {
      throw new FormatError(file, `${where(key)}unknown key: ${key}`);
    }
  }
  const value = (key: string, allowed: readonly string[] | null): string => {
    const found = front.fields.get(key);
    if (found === undefined) {
      throw new FormatError(file, `missing key: ${key}`);
    }
    if (typeof found !== "string" || found === "") {
      throw new FormatError(file, `${where(key)}${key} must be a non-empty value`);
    }
    if (allowed !== null && !allowed.includes(found)) {
      throw new FormatError(file, `${where(key)}${key} must be one of ${allowed.join(", ")}; got: ${found}`);
    }
    return found;
  };
  const name = value("name", null);
  if (name !== expectedName) {
    throw new FormatError(file, `${where("name")}name ${name} does not match its file (expected ${expectedName})`);
  }
  const merge = value("merge", MERGE_MODES) as Preset["merge"];
  const go = value("continue", CONTINUE_MODES) as Preset["continue"];

  // Line numbers of the body: the front matter ends at the second `---` line.
  const all = text.replace(/^﻿/, "").split(/\r?\n/);
  const offset = all.indexOf("---", 1) + 2;
  const body = front.body.split(/\r?\n/);
  let heading = false;
  let fence = false;
  const tables: { start: number; lines: string[] }[] = [];
  let open: { start: number; lines: string[] } | null = null;
  body.forEach((line, i) => {
    if (/^(```|~~~)/.test(line)) {
      fence = !fence;
    }
    if (!fence && line.trimStart().startsWith("|")) {
      if (open === null) {
        open = { start: offset + i, lines: [] };
        tables.push(open);
      }
      open.lines.push(line);
      return;
    }
    open = null;
    if (!fence && tables.length === 0 && /^# +\S/.test(line)) {
      heading = true;
    }
  });
  if (!heading) {
    throw new FormatError(file, "the body must start with a # heading before the table");
  }
  const table = tables[0];
  if (table === undefined) {
    throw new FormatError(file, `missing the table: | ${COLUMNS.join(" | ")} |`);
  }
  if (tables.length > 1) {
    throw new FormatError(file, `line ${tables[1]?.start ?? 0}: a preset has one table; found another`);
  }
  const [header = "", separator = "", ...rest] = table.lines;
  if (cells(header).join("|") !== COLUMNS.join("|")) {
    throw new FormatError(file, `line ${table.start}: the table's columns must be ${COLUMNS.join(", ")}`);
  }
  if (!cells(separator).every((cell) => /^:?-+:?$/.test(cell)) || cells(separator).length !== COLUMNS.length) {
    throw new FormatError(file, `line ${table.start + 1}: expected the table's separator row, like | --- | --- | --- |`);
  }
  const rows: PresetRow[] = [];
  const seen = new Map<string, number>();
  rest.forEach((line, i) => {
    const lineNo = table.start + 2 + i;
    const row = cells(line);
    if (row.length !== COLUMNS.length || row.some((cell) => cell === "")) {
      throw new FormatError(file, `line ${lineNo}: a row needs a case and both columns filled`);
    }
    const cases = (row[0] ?? "").split(",").map((c) => c.trim().replace(/^`(.*)`$/, "$1"));
    for (const key of cases) {
      if (!(STOP_CASES as readonly string[]).includes(key)) {
        throw new FormatError(file, `line ${lineNo}: unknown case: ${key} (the cases are ${STOP_CASES.join(", ")})`);
      }
      const before = seen.get(key);
      if (before !== undefined) {
        throw new FormatError(file, `line ${lineNo}: case ${key} is repeated (also on line ${before})`);
      }
      seen.set(key, lineNo);
    }
    rows.push({ cases, decide: row[1] ?? "", ask: row[2] ?? "" });
  });
  const missing = STOP_CASES.filter((key) => !seen.has(key));
  if (missing.length > 0) {
    throw new FormatError(file, `missing case${missing.length === 1 ? "" : "s"}: ${missing.join(", ")}`);
  }
  return { name, merge, continue: go, rows };
}

/** The `security`, `data` and `outward` cases the preset lets the agents decide: anything but "never" under "Decide yourself when". */
export function delegatedGuarded(preset: Preset): string[] {
  return preset.rows
    .filter((row) => row.decide.trim().toLowerCase().replace(/[.`]/g, "") !== "never")
    .flatMap((row) => row.cases.filter((key) => GUARDED.includes(key)));
}

export interface PresetSource {
  readonly name: string;
  /** `autonomy/<name>.md` for a project file, `shipped` for one of braid's own. */
  readonly from: string;
  readonly text: string;
}

/** The project's preset files, `autonomy/*.md` at the root, by name. Other files are ignored. */
export function projectPresetFiles(root: string, tree: Tree = fsTree(root)): Map<string, PresetSource> {
  const found = new Map<string, PresetSource>();
  for (const { name: entry, isDir } of tree.list("autonomy")) {
    const text = entry.endsWith(".md") && !isDir ? tree.read(`autonomy/${entry}`) : null;
    if (text !== null) {
      const name = entry.slice(0, -3);
      found.set(name, { name, from: `autonomy/${entry}`, text });
    }
  }
  return found;
}

/** Every preset available here: the shipped ones, each replaced by a project file of the same name, then the project's own. */
export function availablePresets(root: string, tree: Tree = fsTree(root)): Map<string, PresetSource> {
  const project = projectPresetFiles(root, tree);
  const all = new Map<string, PresetSource>();
  for (const [name, text] of SHIPPED_PRESETS) {
    all.set(name, project.get(name) ?? { name, from: "shipped", text });
  }
  for (const [name, source] of project) {
    all.set(name, source);
  }
  return all;
}

/** The `autonomy` key of BRAID.md's front matter, or null when it has none. */
export function projectDefault(root: string, tree: Tree = fsTree(root)): string | null {
  const text = tree.read("BRAID.md");
  if (text === null) {
    return null;
  }
  const front = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)?.[1] ?? "";
  const raw = /^autonomy:[ \t]*(.*?)[ \t]*$/m.exec(front)?.[1];
  return raw === undefined ? null : raw.replace(/^(["'])(.*)\1$/, "$2");
}

export { DEFAULT_PRESET, PRESET_NAME };

export interface ResolvedPreset {
  readonly name: string;
  /** Where the name comes from: `brief`, `BRAID.md` or `default`. */
  readonly nameFrom: "brief" | "BRAID.md" | "default";
  readonly source: PresetSource | null;
}

/** The preset a braid runs on: its brief's `autonomy`, else BRAID.md's, else the built-in default. `source` is null when no such preset exists. */
export function resolvePreset(root: string, briefAutonomy: string | null): ResolvedPreset {
  const fromProject = briefAutonomy === null ? projectDefault(root) : null;
  const name = briefAutonomy ?? fromProject ?? DEFAULT_PRESET;
  const nameFrom = briefAutonomy !== null ? "brief" : fromProject !== null ? "BRAID.md" : "default";
  return { name, nameFrom, source: availablePresets(root).get(name) ?? null };
}
