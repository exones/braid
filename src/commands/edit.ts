// braid new, braid strand new, braid edit and braid brief: the only way braids and
// strands are made and changed, so nobody edits brief.md front matter by hand.
import { mkdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseArgs, type ParseArgsConfig } from "node:util";
import { BRAID_ID, DELIVERY_MODES, STATUSES, type Delivery, type Status } from "../braids/brief.js";
import { fetchRemotes, nextLetter, nextNumber, takenIds } from "../braids/numbers.js";
import { loadBraids, type Braid, type Item } from "../braids/store.js";
import { checkSectionText, setSection, slugify, writeBrief, type BriefFields } from "../braids/write.js";
import { normaliseId, UsageError } from "./braids.js";

type Options = NonNullable<ParseArgsConfig["options"]>;

const FIELD_OPTIONS: Options = {
  status: { type: "string" },
  labels: { type: "string", multiple: true },
  dep: { type: "string", multiple: true },
  order: { type: "string" },
  delivery: { type: "string" },
};

const CREATE_OPTIONS: Options = {
  ...FIELD_OPTIONS,
  slug: { type: "string" },
  "no-fetch": { type: "boolean" },
};

interface Parsed {
  readonly positionals: string[];
  readonly values: Record<string, string | boolean | (string | boolean)[] | undefined>;
}

function parse(command: string, args: readonly string[], options: Options): Parsed {
  try {
    const { positionals, values } = parseArgs({ args: [...args], options, allowPositionals: true, strict: true });
    return { positionals, values };
  } catch (error) {
    const message = error instanceof Error ? error.message.split("\n")[0] : String(error);
    throw new UsageError(`${command}: ${message}`);
  }
}

function str(values: Parsed["values"], key: string): string | undefined {
  const value = values[key];
  return typeof value === "string" ? value : undefined;
}

function list(values: Parsed["values"], key: string): string[] | undefined {
  const value = values[key];
  if (!Array.isArray(value)) {
    return undefined;
  }
  return value
    .flatMap((item) => String(item).split(","))
    .map((item) => item.trim())
    .filter((item) => item !== "");
}

function oneLine(what: string, text: string): string {
  const trimmed = text.trim();
  if (trimmed === "") {
    throw new UsageError(`${what} must not be empty`);
  }
  if (/[\r\n]/.test(trimmed)) {
    throw new UsageError(`${what} must be one line`);
  }
  return trimmed;
}

function status(text: string): Status {
  const found = STATUSES.find((s) => s.toLowerCase() === text.trim().toLowerCase());
  if (found === undefined) {
    throw new UsageError(`status must be one of ${STATUSES.join(", ")}; got: ${text}`);
  }
  return found;
}

function delivery(text: string): Delivery {
  const found = DELIVERY_MODES.find((d) => d === text.trim());
  if (found === undefined) {
    throw new UsageError(`delivery must be epic or main; got: ${text}`);
  }
  return found;
}

function order(text: string): number | null {
  if (text.trim() === "none") {
    return null;
  }
  if (!/^\d+$/.test(text.trim())) {
    throw new UsageError(`order must be a whole number or none; got: ${text}`);
  }
  return Number(text.trim());
}

function exists(braids: readonly Braid[], id: string): boolean {
  const [number, letter] = id.split("/");
  const braid = braids.find((b) => b.number === number);
  return braid !== undefined && (letter === undefined || braid.strands.some((s) => s.letter === letter));
}

function dependencies(braids: readonly Braid[], raw: readonly string[], self: string): string[] {
  const ids: string[] = [];
  for (const item of raw) {
    const id = normaliseId(item);
    if (id === self) {
      throw new UsageError(`${self} can't depend on itself`);
    }
    if (!exists(braids, id)) {
      throw new UsageError(`dependency ${id} does not exist`);
    }
    if (!ids.includes(id)) {
      ids.push(id);
    }
  }
  return ids;
}

function labels(raw: readonly string[]): string[] {
  return [...new Set(raw.map((label) => oneLine("a label", label)))];
}

/** Applies the field options to `fields`; `strand` rejects --delivery. */
function applyFields(fields: BriefFields, values: Parsed["values"], braids: readonly Braid[], strand: boolean): BriefFields {
  let next = { ...fields };
  const s = str(values, "status");
  if (s !== undefined) {
    next = { ...next, status: status(s) };
  }
  const title = str(values, "title");
  if (title !== undefined) {
    next = { ...next, title: oneLine("title", title) };
  }
  const l = list(values, "labels");
  if (l !== undefined) {
    next = { ...next, labels: labels(l) };
  }
  const d = list(values, "dep");
  if (d !== undefined) {
    next = { ...next, dependencies: dependencies(braids, d, fields.id) };
  }
  const o = str(values, "order");
  if (o !== undefined) {
    next = { ...next, order: order(o) };
  }
  const del = str(values, "delivery");
  if (del !== undefined) {
    if (strand) {
      throw new UsageError("delivery is set per braid, not per strand");
    }
    next = { ...next, delivery: delivery(del) };
  }
  return next;
}

function slug(values: Parsed["values"], title: string, fallback: string): string {
  const given = str(values, "slug");
  if (given === undefined) {
    return slugify(title, fallback);
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(given)) {
    throw new UsageError(`slug must be lowercase letters and digits joined by single hyphens; got: ${given}`);
  }
  return given;
}

function prepareCreate(root: string, values: Parsed["values"]) {
  const braids = loadBraids(root);
  if (values["no-fetch"] !== true) {
    fetchRemotes(root);
  }
  return { braids, taken: takenIds(root) };
}

/** `braid new <title>`: the next free number, a folder and its brief.md. */
export function newBraid(root: string, args: readonly string[]): string {
  const { positionals, values } = parse("braid new", args, CREATE_OPTIONS);
  if (positionals.length !== 1) {
    throw new UsageError("braid new takes one title (quote it); got: " + (positionals.join(" ") || "none"));
  }
  const title = oneLine("title", positionals[0] ?? "");
  const { braids, taken } = prepareCreate(root, values);
  const number = nextNumber(taken);
  if (number === null) {
    throw new UsageError("no braid numbers left (9999 used)");
  }
  const base: BriefFields = { id: number, title, status: "To Do", labels: [], dependencies: [], order: null, delivery: "epic" };
  const fields = applyFields(base, values, braids, false);
  const folder = `braids/${number}-${slug(values, title, "braid")}`;
  const dir = join(root, folder);
  mkdirSync(dir, { recursive: true });
  writeBrief(join(dir, "brief.md"), `${folder}/brief.md`, fields, "");
  return `Created ${number} ${folder}\n`;
}

/** `braid strand new <braid> <title>`: the next free letter inside the braid. */
export function newStrand(root: string, args: readonly string[]): string {
  const { positionals, values } = parse("braid strand new", args, CREATE_OPTIONS);
  if (positionals.length !== 2) {
    throw new UsageError("braid strand new takes a braid id and one title (quote it), like: braid strand new 0002 'Read braids'");
  }
  const number = normaliseId(positionals[0] ?? "");
  if (!BRAID_ID.test(number)) {
    throw new UsageError(`strands belong to a braid; give a braid id like 0002, not ${number}`);
  }
  const title = oneLine("title", positionals[1] ?? "");
  const { braids, taken } = prepareCreate(root, values);
  const braid = braids.find((b) => b.number === number);
  if (braid === undefined) {
    throw new UsageError(`no braid ${number}`);
  }
  const letter = nextLetter(taken, number);
  if (letter === null) {
    throw new UsageError(`no strand letters left in ${number} (Z used)`);
  }
  const id = `${number}/${letter}`;
  const base: BriefFields = { id, title, status: "To Do", labels: [], dependencies: [], order: null, delivery: null };
  const fields = applyFields(base, values, braids, true);
  const folder = `${braid.folder}/${letter}-${slug(values, title, "strand")}`;
  const dir = join(root, folder);
  mkdirSync(dir, { recursive: true });
  writeBrief(join(dir, "brief.md"), `${folder}/brief.md`, fields, "");
  return `Created ${id} ${folder}\n`;
}

function find(braids: readonly Braid[], raw: string | undefined, command: string): { item: Item; strand: boolean } {
  if (raw === undefined) {
    throw new UsageError(`${command} needs an id, like 0002 or 0002/A`);
  }
  const id = normaliseId(raw);
  const [number, letter] = id.split("/");
  const braid = braids.find((b) => b.number === number);
  if (braid === undefined) {
    throw new UsageError(`no braid ${number}`);
  }
  if (letter === undefined) {
    return { item: braid, strand: false };
  }
  const strand = braid.strands.find((s) => s.letter === letter);
  if (strand === undefined) {
    throw new UsageError(`no strand ${id}`);
  }
  return { item: strand, strand: true };
}

function fieldsOf(item: Item): BriefFields {
  const b = item.brief;
  return {
    id: b.id,
    title: b.title,
    status: b.status,
    labels: b.labels,
    dependencies: b.dependencies,
    order: b.order,
    delivery: b.delivery,
  };
}

/** `braid edit <id>`: status, title, labels, dependencies, order and delivery mode. */
export function editItem(root: string, args: readonly string[]): string {
  const { positionals, values } = parse("braid edit", args, { ...FIELD_OPTIONS, title: { type: "string" } });
  if (positionals.length > 1) {
    throw new UsageError(`braid edit takes one id; got: ${positionals.join(" ")}`);
  }
  if (Object.keys(values).length === 0) {
    throw new UsageError("braid edit needs at least one of --status, --title, --labels, --dep, --order, --delivery");
  }
  const braids = loadBraids(root);
  const { item, strand } = find(braids, positionals[0], "braid edit");
  const fields = applyFields(fieldsOf(item), values, braids, strand);
  writeBrief(join(root, item.folder, "brief.md"), `${item.folder}/brief.md`, fields, item.brief.body);
  return `Updated ${item.brief.id}\n`;
}

function readText(values: Parsed["values"]): string {
  const file = str(values, "file");
  const text = str(values, "text");
  if ((file === undefined) === (text === undefined)) {
    throw new UsageError("braid brief needs either --file <path> (--file - for standard input) or --text <text>");
  }
  let raw = text ?? "";
  if (file === "-") {
    if (process.stdin.isTTY) {
      throw new UsageError("--file - reads standard input; pipe the text in");
    }
    raw = readFileSync(0, "utf8");
  } else if (file !== undefined) {
    try {
      raw = readFileSync(file, "utf8");
    } catch {
      throw new UsageError(`can't read ${file}`);
    }
  }
  return raw
    .replace(/^﻿/, "")
    .replace(/\r\n?/g, "\n")
    .replace(/^(?:[ \t]*\n)+/, "")
    .trimEnd();
}

/** `braid brief <id> <section>`: sets one `## ` section of the brief. */
export function setBriefSection(root: string, cwd: string, args: readonly string[]): string {
  const { positionals, values } = parse("braid brief", args, { file: { type: "string" }, text: { type: "string" } });
  if (positionals.length !== 2) {
    throw new UsageError("braid brief takes an id and a section name, like: braid brief 0002 Goal --file goal.md");
  }
  const section = oneLine("section name", positionals[1] ?? "").replace(/^#+\s*/, "");
  if (section === "") {
    throw new UsageError("section name must not be empty");
  }
  const file = str(values, "file");
  const text = readText(file === undefined || file === "-" ? values : { ...values, file: resolve(cwd, file) });
  const problem = checkSectionText(text);
  if (problem !== null) {
    throw new UsageError(problem);
  }
  const braids = loadBraids(root);
  const { item } = find(braids, positionals[0], "braid brief");
  const body = setSection(item.brief.body, section, text);
  writeBrief(join(root, item.folder, "brief.md"), `${item.folder}/brief.md`, fieldsOf(item), body);
  return `Updated ${item.brief.id}: section ${section}\n`;
}
