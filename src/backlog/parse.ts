// A small reader for Backlog.md task and doc files: a YAML front matter subset
// (scalars, inline and block lists, folded scalars) and the marked sections of a task.
import { FormatError } from "../braids/frontmatter.js";

export type Value = string | readonly string[];

export interface Split {
  readonly fields: ReadonlyMap<string, Value>;
  readonly body: string;
}

function unquote(raw: string, file: string, line: number): string {
  const text = raw.trim();
  if (text.startsWith("'")) {
    if (!text.endsWith("'") || text.length < 2) {
      throw new FormatError(file, `line ${line}: unclosed quote`);
    }
    return text.slice(1, -1).replaceAll("''", "'");
  }
  if (text.startsWith('"')) {
    try {
      const value: unknown = JSON.parse(text);
      if (typeof value === "string") {
        return value;
      }
    } catch {
      // falls through to the error below
    }
    throw new FormatError(file, `line ${line}: bad double-quoted text`);
  }
  return text;
}

/** An inline list; items may not hold commas. */
function inlineList(raw: string, file: string, line: number): string[] {
  const inner = raw.trim().slice(1, -1).trim();
  if (!raw.trim().endsWith("]")) {
    throw new FormatError(file, `line ${line}: bad list`);
  }
  return inner === "" ? [] : inner.split(",").map((item) => unquote(item, file, line));
}

/** Splits `---` front matter from the body and reads its keys. */
export function splitFile(text: string, file: string): Split {
  const lines = text.replaceAll("\r\n", "\n").split("\n");
  if (lines[0]?.trim() !== "---") {
    throw new FormatError(file, "line 1: file must start with --- front matter");
  }
  const end = lines.indexOf("---", 1);
  if (end === -1) {
    throw new FormatError(file, "front matter is not closed with ---");
  }
  const fields = new Map<string, Value>();
  let i = 1;
  while (i < end) {
    const line = lines[i] ?? "";
    const no = i + 1;
    if (line.trim() === "" || line.trim().startsWith("#")) {
      i += 1;
      continue;
    }
    const match = /^([A-Za-z_][A-Za-z0-9_]*):(?:\s+(.*))?$/.exec(line);
    if (!match) {
      throw new FormatError(file, `line ${no}: expected "key: value"`);
    }
    const key = match[1] ?? "";
    const rest = (match[2] ?? "").trim();
    i += 1;
    if (rest === "" || /^[>|][+-]?$/.test(rest)) {
      const block: string[] = [];
      while (i < end && (/^\s/.test(lines[i] ?? "") || (lines[i] ?? "") === "")) {
        block.push(lines[i] ?? "");
        i += 1;
      }
      if (rest !== "") {
        fields.set(key, block.map((l) => l.trim()).filter((l) => l !== "").join(" "));
      } else if (block.some((l) => l.trim().startsWith("- "))) {
        const items: string[] = [];
        let current: string[] | null = null;
        let folded = false;
        const flush = () => {
          if (current !== null) {
            items.push(folded ? current.join(" ") : unquote(current.join(" "), file, no));
          }
        };
        for (const raw of block) {
          const l = raw.trim();
          if (l === "") {
            continue;
          }
          if (l.startsWith("- ")) {
            flush();
            const item = l.slice(2).trim();
            folded = /^[>|][+-]?$/.test(item);
            current = folded ? [] : [item];
          } else if (current === null) {
            throw new FormatError(file, `line ${no}: bad list under ${key}`);
          } else {
            current.push(l);
          }
        }
        flush();
        fields.set(key, items);
      } else {
        fields.set(key, block.length === 0 ? "" : block.map((l) => l.trim()).join(" ").trim());
      }
    } else if (rest.startsWith("[")) {
      fields.set(key, inlineList(rest, file, no));
    } else {
      fields.set(key, unquote(rest, file, no));
    }
  }
  return { fields, body: lines.slice(end + 1).join("\n") };
}

export function text(fields: ReadonlyMap<string, Value>, key: string): string | null {
  const v = fields.get(key);
  return typeof v === "string" ? v : null;
}

export function list(fields: ReadonlyMap<string, Value>, key: string, file: string): readonly string[] {
  const v = fields.get(key);
  if (v === undefined || v === "") {
    return [];
  }
  if (typeof v === "string") {
    throw new FormatError(file, `${key} must be a list`);
  }
  return v;
}

/** The text between `<!-- <name>:BEGIN -->` and `<!-- <name>:END -->`; null when absent. */
export function marked(body: string, name: string, file: string): string | null {
  const begin = `<!-- ${name}:BEGIN -->`;
  const end = `<!-- ${name}:END -->`;
  const from = body.indexOf(begin);
  if (from === -1) {
    return null;
  }
  const to = body.indexOf(end, from);
  if (to === -1) {
    throw new FormatError(file, `${begin} has no matching ${end}`);
  }
  return body.slice(from + begin.length, to).trim();
}

export interface Check {
  readonly done: boolean;
  readonly text: string;
}

/** Checkbox lines like `- [x] #1 text`; the `#n` number is dropped. */
export function checks(section: string | null, file: string, what: string): Check[] {
  const result: Check[] = [];
  for (const line of (section ?? "").split("\n")) {
    if (line.trim() === "") {
      continue;
    }
    const match = /^- \[( |x|X)\] (?:#\d+ )?(.*)$/.exec(line.trimEnd());
    if (!match) {
      throw new FormatError(file, `${what} line is not a checkbox: ${line}`);
    }
    result.push({ done: match[1] !== " ", text: match[2] ?? "" });
  }
  return result;
}
