// A small YAML subset for brief.md front matter: `key: value` lines, quoted or plain
// strings, inline lists (`[a, b]`) and block lists (`- a`). Nothing else is accepted,
// so a malformed file fails with a line number instead of being read wrongly.

export type FrontValue = string | readonly string[];

export interface FrontMatter {
  /** Keys in file order with their raw values. */
  readonly fields: ReadonlyMap<string, FrontValue>;
  /** The text after the closing `---` line. */
  readonly body: string;
  /** The 1-based line number of each key, for error messages. */
  readonly lines: ReadonlyMap<string, number>;
}

export class FormatError extends Error {
  constructor(
    readonly file: string,
    message: string,
  ) {
    super(message);
    this.name = "FormatError";
  }
}

const KEY = /^([a-z][a-z_]*):(?:\s+(.*))?$/;
const ITEM = /^\s+-\s+(.*)$/;

function unquote(raw: string, line: number, file: string): string {
  const text = raw.trim();
  if (text.startsWith("'")) {
    if (text.length < 2 || !text.endsWith("'")) {
      throw new FormatError(file, `line ${line}: unterminated single-quoted string`);
    }
    return text.slice(1, -1).replaceAll("''", "'");
  }
  if (text.startsWith('"')) {
    if (text.length < 2 || !text.endsWith('"')) {
      throw new FormatError(file, `line ${line}: unterminated double-quoted string`);
    }
    try {
      const parsed: unknown = JSON.parse(text);
      if (typeof parsed === "string") {
        return parsed;
      }
    } catch {
      // Reported below.
    }
    throw new FormatError(file, `line ${line}: invalid double-quoted string`);
  }
  if (/^[[\]{}&*!|>%@`#]/.test(text)) {
    throw new FormatError(file, `line ${line}: unsupported value: ${text}`);
  }
  return text;
}

function splitInline(inner: string, line: number, file: string): string[] {
  const items: string[] = [];
  let current = "";
  let quote: string | null = null;
  let escaped = false;
  for (const ch of inner) {
    if (quote !== null) {
      current += ch;
      if (escaped) {
        escaped = false;
      } else if (quote === '"' && ch === "\\") {
        // JSON escape: the next character, even a quote, stays inside the string.
        escaped = true;
      } else if (ch === quote) {
        quote = null;
      }
    } else if (ch === "'" || ch === '"') {
      quote = ch;
      current += ch;
    } else if (ch === ",") {
      items.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (quote !== null) {
    throw new FormatError(file, `line ${line}: unterminated string in list`);
  }
  items.push(current);
  if (items.length === 1 && items[0]?.trim() === "") {
    return [];
  }
  return items.map((item) => {
    const value = unquote(item, line, file);
    if (value === "") {
      throw new FormatError(file, `line ${line}: empty list item`);
    }
    return value;
  });
}

export function parseFrontMatter(text: string, file: string): FrontMatter {
  const all = text.replace(/^﻿/, "").split(/\r?\n/);
  if (all[0] !== "---") {
    throw new FormatError(file, "line 1: expected front matter starting with ---");
  }
  const end = all.indexOf("---", 1);
  if (end === -1) {
    throw new FormatError(file, "front matter is not closed with ---");
  }
  const fields = new Map<string, FrontValue>();
  const lines = new Map<string, number>();
  let listKey: string | null = null;
  for (let i = 1; i < end; i++) {
    const raw = all[i] ?? "";
    const lineNo = i + 1;
    if (raw.trim() === "" || raw.trimStart().startsWith("#")) {
      continue;
    }
    const item = ITEM.exec(raw);
    if (item) {
      const current = listKey === null ? undefined : fields.get(listKey);
      if (listKey === null || !Array.isArray(current)) {
        throw new FormatError(file, `line ${lineNo}: list item without a list key`);
      }
      const value = unquote(item[1] ?? "", lineNo, file);
      if (value === "") {
        throw new FormatError(file, `line ${lineNo}: empty list item`);
      }
      fields.set(listKey, [...(current as readonly string[]), value]);
      continue;
    }
    const match = KEY.exec(raw);
    if (!match) {
      throw new FormatError(file, `line ${lineNo}: expected "key: value", got: ${raw.trim()}`);
    }
    const key = match[1] ?? "";
    if (fields.has(key)) {
      throw new FormatError(file, `line ${lineNo}: duplicate key: ${key}`);
    }
    lines.set(key, lineNo);
    const value = (match[2] ?? "").trim();
    if (value === "") {
      fields.set(key, []);
      listKey = key;
    } else if (value.startsWith("[")) {
      if (!value.endsWith("]")) {
        throw new FormatError(file, `line ${lineNo}: inline list is not closed with ]`);
      }
      fields.set(key, splitInline(value.slice(1, -1), lineNo, file));
      listKey = null;
    } else {
      fields.set(key, unquote(value, lineNo, file));
      listKey = null;
    }
  }
  return { fields, lines, body: all.slice(end + 1).join("\n") };
}
