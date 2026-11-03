import type { HelpTopic } from "./help.js";
import {
  isEpicId,
  isItemId,
  isKind,
  LIMITS,
  normalizeText,
  type Kind,
} from "./text.js";

export type { Kind };

export type Command =
  | { readonly type: "init" }
  | { readonly type: "new"; readonly epicId: string; readonly title: string; readonly outcome: string }
  | { readonly type: "status"; readonly epicId: string | null; readonly json: boolean }
  | {
      readonly type: "story-add";
      readonly epicId: string;
      readonly itemId: string;
      readonly title: string;
      readonly kind: Kind;
      readonly note: string | null;
      readonly next: string | null;
    }
  | {
      readonly type: "story-start";
      readonly epicId: string;
      readonly itemId: string;
      readonly note: string | null;
      readonly next: string | null;
    }
  | {
      readonly type: "story-block";
      readonly epicId: string;
      readonly itemId: string;
      readonly reason: string;
      readonly note: string | null;
      readonly next: string | null;
    }
  | {
      readonly type: "story-complete";
      readonly epicId: string;
      readonly itemId: string;
      readonly evidence: string;
      readonly note: string | null;
      readonly next: string | null;
    };

export interface ParsedCommand {
  readonly help: boolean;
  readonly version: boolean;
  readonly root: string | undefined;
  readonly helpTopic: HelpTopic;
  readonly command: Command | null;
}

export type ParseResult =
  | { readonly ok: true; readonly args: ParsedCommand }
  | { readonly ok: false; readonly message: string };

type Fail = { readonly ok: false; readonly message: string };

const BOOLEAN_FLAGS = new Set(["--help", "-h", "--version", "-v", "--json"]);
const VALUED_FLAGS = new Set([
  "--root",
  "--title",
  "--outcome",
  "--kind",
  "--note",
  "--next",
  "--reason",
  "--evidence",
]);

const ALLOWED: Record<HelpTopic, readonly string[]> = {
  general: ["--root", "--help", "--version"],
  init: ["--root", "--help", "--version"],
  new: ["--root", "--help", "--version", "--title", "--outcome"],
  status: ["--root", "--help", "--version", "--json"],
  story: ["--root", "--help", "--version"],
  "story-add": ["--root", "--help", "--version", "--title", "--kind", "--note", "--next"],
  "story-start": ["--root", "--help", "--version", "--note", "--next"],
  "story-block": ["--root", "--help", "--version", "--reason", "--note", "--next"],
  "story-complete": ["--root", "--help", "--version", "--evidence", "--note", "--next"],
};

function fail(message: string): Fail {
  return { ok: false, message };
}

function canonicalFlag(flag: string): string {
  if (flag === "-h" || flag === "--help") {
    return "--help";
  }
  if (flag === "-v" || flag === "--version") {
    return "--version";
  }
  return flag;
}

function isFail(value: unknown): value is Fail {
  return typeof value === "object" && value !== null && "ok" in value && value.ok === false;
}

interface IdentifiedCommand {
  readonly topic: HelpTopic;
  readonly known: boolean;
  readonly words: readonly string[];
  readonly operands: readonly string[];
}

function identify(positionals: readonly string[]): IdentifiedCommand {
  const head = positionals[0];
  if (head === undefined) {
    return { topic: "general", known: true, words: [], operands: [] };
  }
  if (head === "init" || head === "new" || head === "status") {
    return { topic: head, known: true, words: [head], operands: positionals.slice(1) };
  }
  if (head === "story") {
    const sub = positionals[1];
    if (sub === undefined) {
      return { topic: "story", known: true, words: ["story"], operands: [] };
    }
    if (sub === "add" || sub === "start" || sub === "block" || sub === "complete") {
      const topic: HelpTopic = `story-${sub}`;
      return { topic, known: true, words: ["story", sub], operands: positionals.slice(2) };
    }
  }
  return { topic: "general", known: false, words: positionals, operands: [] };
}

function unknownCommand(words: readonly string[]): Fail {
  return fail(`error: unknown command: ${words.join(" ")}\nRun braid --help.`);
}

function requiredText(flag: string, max: number, values: ReadonlyMap<string, string>): string | Fail {
  if (!values.has(flag)) {
    return fail(`error: missing required option: ${flag}`);
  }
  const normalized = normalizeText(values.get(flag) ?? "", max);
  if (normalized === undefined) {
    return fail(`error: invalid option: ${flag}`);
  }
  return normalized;
}

function optionalText(
  flag: string,
  max: number,
  values: ReadonlyMap<string, string>,
): string | null | Fail {
  if (!values.has(flag)) {
    return null;
  }
  const normalized = normalizeText(values.get(flag) ?? "", max);
  if (normalized === undefined) {
    return fail(`error: invalid option: ${flag}`);
  }
  return normalized;
}

function requireEpic(operands: readonly string[]): string | Fail {
  const extra = operands[1];
  if (extra !== undefined) {
    return fail(`error: unexpected argument: ${extra}`);
  }
  const epicId = operands[0];
  if (epicId === undefined) {
    return fail("error: missing required argument: epic-id");
  }
  return epicId;
}

function requireEpicItem(operands: readonly string[]): { readonly epicId: string; readonly itemId: string } | Fail {
  const extra = operands[2];
  if (extra !== undefined) {
    return fail(`error: unexpected argument: ${extra}`);
  }
  const epicId = operands[0];
  if (epicId === undefined) {
    return fail("error: missing required argument: epic-id");
  }
  const itemId = operands[1];
  if (itemId === undefined) {
    return fail("error: missing required argument: item-id");
  }
  return { epicId, itemId };
}

function buildCommand(identified: IdentifiedCommand, values: ReadonlyMap<string, string>): Command | Fail {
  const topic = identified.topic;
  if (topic === "general") {
    return fail("error: missing required argument: command");
  }
  if (topic === "init") {
    const extra = identified.operands[0];
    if (extra !== undefined) {
      return fail(`error: unexpected argument: ${extra}`);
    }
    return { type: "init" };
  }
  if (topic === "new") {
    const epicId = requireEpic(identified.operands);
    if (isFail(epicId)) {
      return epicId;
    }
    const title = requiredText("--title", LIMITS.title, values);
    if (isFail(title)) {
      return title;
    }
    const outcome = requiredText("--outcome", LIMITS.outcome, values);
    if (isFail(outcome)) {
      return outcome;
    }
    if (!isEpicId(epicId)) {
      return fail("error: invalid epic id");
    }
    return { type: "new", epicId, title, outcome };
  }
  if (topic === "status") {
    const extra = identified.operands[1];
    if (extra !== undefined) {
      return fail(`error: unexpected argument: ${extra}`);
    }
    const epicId = identified.operands[0];
    if (epicId === undefined) {
      return { type: "status", epicId: null, json: values.has("--json") };
    }
    if (!isEpicId(epicId)) {
      return fail("error: invalid epic id");
    }
    return { type: "status", epicId, json: values.has("--json") };
  }
  if (topic === "story") {
    return fail("error: missing required argument: subcommand");
  }

  const pair = requireEpicItem(identified.operands);
  if (isFail(pair)) {
    return pair;
  }
  if (topic === "story-add" && !values.has("--title")) {
    return fail("error: missing required option: --title");
  }
  if (topic === "story-block" && !values.has("--reason")) {
    return fail("error: missing required option: --reason");
  }
  if (topic === "story-complete" && !values.has("--evidence")) {
    return fail("error: missing required option: --evidence");
  }
  if (!isEpicId(pair.epicId)) {
    return fail("error: invalid epic id");
  }
  if (!isItemId(pair.itemId)) {
    return fail("error: invalid item id");
  }
  const note = optionalText("--note", LIMITS.note, values);
  if (isFail(note)) {
    return note;
  }
  const next = optionalText("--next", LIMITS.next, values);
  if (isFail(next)) {
    return next;
  }

  if (topic === "story-add") {
    const title = requiredText("--title", LIMITS.title, values);
    if (isFail(title)) {
      return title;
    }
    if (!values.has("--kind")) {
      return { type: "story-add", epicId: pair.epicId, itemId: pair.itemId, title, kind: "story", note, next };
    }
    const kindRaw = values.get("--kind") ?? "";
    if (!isKind(kindRaw)) {
      return fail("error: invalid option: --kind");
    }
    return { type: "story-add", epicId: pair.epicId, itemId: pair.itemId, title, kind: kindRaw, note, next };
  }
  if (topic === "story-start") {
    return { type: "story-start", epicId: pair.epicId, itemId: pair.itemId, note, next };
  }
  if (topic === "story-block") {
    const reason = requiredText("--reason", LIMITS.reason, values);
    if (isFail(reason)) {
      return reason;
    }
    return { type: "story-block", epicId: pair.epicId, itemId: pair.itemId, reason, note, next };
  }
  const evidence = requiredText("--evidence", LIMITS.evidence, values);
  if (isFail(evidence)) {
    return evidence;
  }
  return { type: "story-complete", epicId: pair.epicId, itemId: pair.itemId, evidence, note, next };
}

export function parseArgs(argv: readonly string[]): ParseResult {
  const values = new Map<string, string>();
  const used: string[] = [];
  const positionals: string[] = [];

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === undefined) {
      continue;
    }
    if (token === "-" || !token.startsWith("-")) {
      positionals.push(token);
      continue;
    }

    const equals = token.indexOf("=");
    const flag = equals === -1 ? token : token.slice(0, equals);
    const inline = equals === -1 ? undefined : token.slice(equals + 1);
    const name = canonicalFlag(flag);

    if (BOOLEAN_FLAGS.has(flag)) {
      if (inline !== undefined) {
        return fail(`error: invalid option: ${name}`);
      }
      if (values.has(name)) {
        return fail(`error: duplicate option: ${name}`);
      }
      values.set(name, "true");
      used.push(name);
      continue;
    }

    if (VALUED_FLAGS.has(flag)) {
      if (values.has(flag)) {
        return fail(`error: duplicate option: ${flag}`);
      }
      let value = inline;
      if (value === undefined) {
        const next = argv[index + 1];
        if (next === undefined) {
          return fail(`error: missing required argument: ${flag}`);
        }
        value = next;
        index += 1;
      }
      values.set(flag, value);
      used.push(flag);
      continue;
    }

    return fail(`error: unknown option: ${flag}`);
  }

  const identified = identify(positionals);
  const allowed = new Set(ALLOWED[identified.known ? identified.topic : "general"]);
  for (const name of used) {
    if (!allowed.has(name)) {
      return fail(`error: unknown option: ${name}`);
    }
  }

  const help = values.has("--help");
  const version = values.has("--version");
  const root = values.get("--root");
  const base = {
    help,
    version,
    root,
    helpTopic: identified.known ? identified.topic : "general" as const,
    command: null,
  };

  if (help) {
    if (!identified.known) {
      return unknownCommand(identified.words);
    }
    return { ok: true, args: base };
  }
  if (version) {
    return { ok: true, args: base };
  }
  if (!identified.known) {
    return unknownCommand(identified.words);
  }
  if (identified.topic === "general") {
    return { ok: true, args: base };
  }

  const command = buildCommand(identified, values);
  if (isFail(command)) {
    return command;
  }
  return { ok: true, args: { ...base, command } };
}
