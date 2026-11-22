// A programme's plan file (`pm/<slug>.md` on the branch `pm/<slug>`): front matter in the brief's YAML subset,
// which the programme manager writes and the board reads (docs/braids-format.md, "Plan files"). The body is for
// people and is never read. Every error names its line, so `braid check --plan` and the board's "plan unreadable"
// point at what to fix.
import { FormatError, parseFrontMatter, type FrontValue } from "./frontmatter.js";

export const PLAN_STATES = ["running", "held", "done", "stopped"] as const;
export type PlanState = (typeof PLAN_STATES)[number];

/** A plan row's state, as the braid-pm template lists them. */
export const ROW_STATES = ["planned", "running", "waiting on user", "ready to merge", "done", "stopped", "dropped"] as const;
export type RowState = (typeof ROW_STATES)[number];

export interface PlanRow {
  /** `P2`: the row's own name, which never changes. */
  readonly row: string;
  /** The braid number (`0006`); null before the braid exists (`-`). */
  readonly braid: string | null;
  readonly title: string;
  readonly state: RowState;
}

export interface Hold {
  /** When the hold began (ISO). */
  readonly since: string;
  /** The user's words. */
  readonly words: string;
}

export interface Plan {
  /** The slug: the branch is `pm/<slug>`. */
  readonly programme: string;
  readonly title: string;
  /** One line. */
  readonly goal: string;
  /** The PM's T3 thread id; null when not recorded. */
  readonly thread: string | null;
  /** How many braids run at once; null when not recorded. */
  readonly limit: number | null;
  readonly state: PlanState;
  readonly hold: Hold | null;
  readonly next: string | null;
  /** The latest digest, one line. */
  readonly digest: string | null;
  readonly rows: readonly PlanRow[];
}

const KEYS = new Set(["programme", "title", "goal", "thread", "limit", "state", "hold", "next", "digest", "rows"]);
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Parses a plan file's text; throws FormatError naming the line of the first problem. */
export function parsePlan(text: string, file: string): Plan {
  const fm = parseFrontMatter(text, file);
  const at = (key: string): string => `line ${fm.lines.get(key) ?? 1}`;
  for (const key of fm.fields.keys()) {
    if (!KEYS.has(key)) {
      throw new FormatError(file, `${at(key)}: unknown key: ${key} (a plan has ${[...KEYS].join(", ")})`);
    }
  }
  // `key:` with nothing after it reads as an empty list; for a one-line field it means empty.
  const scalar = (key: string): string | null => {
    const v: FrontValue | undefined = fm.fields.get(key);
    if (v === undefined || (Array.isArray(v) && v.length === 0)) {
      return null;
    }
    if (typeof v !== "string") {
      throw new FormatError(file, `${at(key)}: ${key} is one line, not a list`);
    }
    const t = v.trim();
    return t === "" || t === "-" ? null : t;
  };
  const required = (key: string): string => {
    const v = scalar(key);
    if (v === null) {
      throw new FormatError(file, fm.lines.has(key) ? `${at(key)}: ${key} must not be empty` : `missing key: ${key}`);
    }
    return v;
  };
  const programme = required("programme");
  if (!SLUG.test(programme)) {
    throw new FormatError(file, `${at("programme")}: programme is the slug of pm/<slug> (lower-case words joined by -); got: ${programme}`);
  }
  const state = required("state");
  if (!(PLAN_STATES as readonly string[]).includes(state)) {
    throw new FormatError(file, `${at("state")}: state is ${PLAN_STATES.join(", ")}; got: ${state}`);
  }
  const limitText = scalar("limit");
  if (limitText !== null && !/^[1-9]\d*$/.test(limitText)) {
    throw new FormatError(file, `${at("limit")}: limit is a whole number of braids; got: ${limitText}`);
  }
  const holdText = scalar("hold");
  let hold: Hold | null = null;
  if (holdText !== null) {
    const m = /^(\S+)\s+(.+)$/.exec(holdText);
    if (m === null || Number.isNaN(Date.parse(m[1] ?? ""))) {
      throw new FormatError(file, `${at("hold")}: hold is "<ISO time> <the user's words>", or empty; got: ${holdText}`);
    }
    hold = { since: new Date(m[1] ?? "").toISOString(), words: (m[2] ?? "").trim() };
  }
  const raw = fm.fields.get("rows") ?? [];
  if (typeof raw === "string") {
    throw new FormatError(file, `${at("rows")}: rows is a list of "P<n> | <braid number or -> | <title> | <state>"`);
  }
  const rowsLine = fm.lines.get("rows") ?? 1;
  // A block list's items follow the key's line; an inline list stays on it.
  const itemLines = rowLines(text, rowsLine);
  const rows = raw.map((r, i) => {
    const where = `line ${itemLines[i] ?? rowsLine}`;
    const parts = r.split("|").map((p) => p.trim());
    if (parts.length !== 4) {
      throw new FormatError(file, `${where}: a row is "P<n> | <braid number or -> | <title> | <state>"; got: ${r}`);
    }
    const [row = "", braid = "", title = "", st = ""] = parts;
    if (!/^P\d+$/.test(row)) {
      throw new FormatError(file, `${where}: a row's name is P<n>; got: ${row}`);
    }
    if (braid !== "-" && !/^\d{4}$/.test(braid)) {
      throw new FormatError(file, `${where}: a row's braid is a four-digit number or -; got: ${braid}`);
    }
    if (title === "") {
      throw new FormatError(file, `${where}: a row's title must not be empty`);
    }
    if (!(ROW_STATES as readonly string[]).includes(st)) {
      throw new FormatError(file, `${where}: a row's state is ${ROW_STATES.join(", ")}; got: ${st}`);
    }
    return { row, braid: braid === "-" ? null : braid, title, state: st as RowState };
  });
  const seen = new Set<string>();
  for (const r of rows) {
    if (r.braid !== null && seen.has(r.braid)) {
      throw new FormatError(file, `line ${rowsLine}: braid ${r.braid} is in two rows`);
    }
    if (r.braid !== null) {
      seen.add(r.braid);
    }
  }
  return { programme, title: required("title"), goal: required("goal"), thread: scalar("thread"), limit: limitText === null ? null : Number(limitText), state: state as PlanState, hold, next: scalar("next"), digest: scalar("digest"), rows };
}

/** The 1-based lines of a block list's items after the key on `keyLine`. */
function rowLines(text: string, keyLine: number): number[] {
  const all = text.replace(/^﻿/, "").split(/\r?\n/);
  const out: number[] = [];
  for (let i = keyLine; i < all.length; i++) {
    const line = all[i] ?? "";
    if (line === "---" || /^[a-z]/.test(line)) {
      break;
    }
    if (/^\s+-\s/.test(line)) {
      out.push(i + 1);
    }
  }
  return out;
}

/** The plan file's path on its branch. */
export const planPath = (slug: string): string => `pm/${slug}.md`;
