// Inbox entries: one Markdown file per entry on the `braid-inbox` branch, `leftovers/<id>.md` or
// `ideas/<id>.md` (docs/braids-format.md, "The inbox"). The folder is the kind; the status lives in the
// front matter, so an entry never moves. The text after the front matter starts with its title line.
import { randomBytes } from "node:crypto";
import { FormatError, parseFrontMatter, type FrontValue } from "../braids/frontmatter.js";

export const KINDS = ["leftover", "idea"] as const;
export type EntryKind = (typeof KINDS)[number];
export const STATUSES = ["open", "taken", "dropped"] as const;
export type EntryStatus = (typeof STATUSES)[number];

/** The folder of each kind on the branch. */
export const FOLDER: Readonly<Record<EntryKind, string>> = { leftover: "leftovers", idea: "ideas" };

/** `<YYYY-MM-DD>-<short random>`: the file name without `.md`, and the entry id. */
export const ENTRY_ID = /^\d{4}-\d{2}-\d{2}-[a-z0-9]{4,}$/;

export interface EntryFields {
  /** `0012/A`, `review 0012/A`, `PR #12` or `user`; required for a leftover. */
  readonly from: string | null;
  /** Links to the context: a review comment, the PR, a commit. */
  readonly ref: readonly string[];
  readonly status: EntryStatus;
  /** Leftovers: how many sweeps passed it over. null for an idea. */
  readonly passed: number | null;
  /** The braid ids it went to, when taken. */
  readonly into: readonly string[];
  /** The reason, when dropped. */
  readonly why: string | null;
}

export interface Entry extends EntryFields {
  readonly kind: EntryKind;
  readonly id: string;
  /** The path on the branch: `leftovers/<id>.md`. */
  readonly file: string;
  /** The Markdown text after the front matter, trimmed. */
  readonly text: string;
  /** The first line of the text, without a leading `#`. */
  readonly title: string;
  /** When the file was added (author time, seconds); null when unknown. */
  readonly created: number | null;
}

/** A malformed entry: its file and the field (or `file` or `text`) that is wrong. */
export interface Problem {
  readonly file: string;
  readonly field: string;
  readonly message: string;
}

/** A new entry id for today (UTC), avoiding the ids in `taken`. */
export function newEntryId(at: Date, taken: (id: string) => boolean): string {
  const day = at.toISOString().slice(0, 10);
  for (let size = 4; ; size++) {
    for (let tries = 0; tries < 20; tries++) {
      const id = `${day}-${[...randomBytes(size)].map((b) => "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36]).join("")}`;
      if (!taken(id)) {
        return id;
      }
    }
  }
}

export function entryPath(kind: EntryKind, id: string): string {
  return `${FOLDER[kind]}/${id}.md`;
}

export function titleOf(text: string): string {
  const line = text.split("\n").find((l) => l.trim() !== "") ?? "";
  return line.replace(/^#+\s*/, "").trim();
}

class FieldError extends Error {
  constructor(
    readonly field: string,
    message: string,
  ) {
    super(message);
  }
}

function one(fields: ReadonlyMap<string, FrontValue>, key: string): string | null {
  const value = fields.get(key);
  if (value === undefined) {
    return null;
  }
  if (typeof value !== "string") {
    throw new FieldError(key, "expected one value, got a list");
  }
  return value;
}

function many(fields: ReadonlyMap<string, FrontValue>, key: string): string[] {
  const value = fields.get(key);
  return value === undefined ? [] : typeof value === "string" ? [value] : [...value];
}

/** Reads one entry file; a malformed one gives a Problem naming the file and field. */
export function parseEntry(file: string, content: string, created: number | null): Entry | Problem {
  const m = /^(leftovers|ideas)\/([^/]+)\.md$/.exec(file);
  const id = m?.[2] ?? "";
  if (m === null || !ENTRY_ID.test(id)) {
    return { file, field: "file", message: "expected leftovers/<YYYY-MM-DD>-<random>.md or ideas/<YYYY-MM-DD>-<random>.md" };
  }
  const kind: EntryKind = m[1] === "leftovers" ? "leftover" : "idea";
  try {
    let front;
    try {
      front = parseFrontMatter(content, file);
    } catch (error) {
      if (error instanceof FormatError) {
        throw new FieldError("front matter", error.message);
      }
      throw error;
    }
    const { fields } = front;
    const status = one(fields, "status");
    if (status === null || !(STATUSES as readonly string[]).includes(status)) {
      throw new FieldError("status", `expected one of ${STATUSES.join(", ")}; got: ${status ?? "nothing"}`);
    }
    const from = one(fields, "from");
    if (kind === "leftover" && (from === null || from.trim() === "")) {
      throw new FieldError("from", "a leftover needs its source");
    }
    let passed: number | null = null;
    if (kind === "leftover") {
      const raw = one(fields, "passed") ?? "0";
      if (!/^\d+$/.test(raw)) {
        throw new FieldError("passed", `expected a whole number; got: ${raw}`);
      }
      passed = Number(raw);
    }
    const text = front.body.replace(/\r\n?/g, "\n").trim();
    if (text === "") {
      throw new FieldError("text", "the entry has no text");
    }
    return {
      kind,
      id,
      file,
      from,
      ref: many(fields, "ref"),
      status: status as EntryStatus,
      passed,
      into: many(fields, "into"),
      why: one(fields, "why"),
      text,
      title: titleOf(text),
      created,
    };
  } catch (error) {
    if (error instanceof FieldError) {
      return { file, field: error.field, message: error.message };
    }
    throw error;
  }
}

export function isProblem(value: Entry | Problem): value is Problem {
  return "field" in value && "message" in value;
}

const quote = (value: string) => JSON.stringify(value);

/** The file text of an entry: front matter (from, ref, status, passed, into, why), then the text. */
export function formatEntry(kind: EntryKind, fields: EntryFields, text: string): string {
  const lines = ["---"];
  if (fields.from !== null) {
    lines.push(`from: ${quote(fields.from)}`);
  }
  if (fields.ref.length > 0) {
    lines.push(`ref: [${fields.ref.map(quote).join(", ")}]`);
  }
  lines.push(`status: ${fields.status}`);
  if (kind === "leftover") {
    lines.push(`passed: ${String(fields.passed ?? 0)}`);
  }
  if (fields.into.length > 0) {
    lines.push(`into: [${fields.into.map(quote).join(", ")}]`);
  }
  if (fields.why !== null) {
    lines.push(`why: ${quote(fields.why)}`);
  }
  lines.push("---", "", text.replace(/\r\n?/g, "\n").trim(), "");
  return lines.join("\n");
}
