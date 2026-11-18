// `braid note` captures a leftover or an idea on the `braid-inbox` branch; `braid inbox` lists the
// entries and `braid inbox show <id>` prints one. See docs/braids-format.md, "The inbox".
import { loadLiveBraids } from "../braids/branches.js";
import { now } from "../braids/logs.js";
import { age } from "../braids/requests.js";
import { readInbox, writeInbox, INBOX_BRANCH, REMOTE, type FetchResult } from "../inbox/branch.js";
import { entryPath, ENTRY_ID, formatEntry, KINDS, newEntryId, type Entry, type EntryKind } from "../inbox/entries.js";
import { UsageError } from "./braids.js";
import { find, parse } from "./edit.js";
import { input } from "./logs.js";
import { SWEEP_VERBS, sweepCommand } from "./sweep.js";

/** A command's output with warnings for standard error. */
export interface Said {
  readonly stdout: string;
  readonly stderr: string;
}

/** `0012/A`, `review 0012/A`, `PR #12` or `user`. */
const SOURCE = /^(?:(?:review )?\d{4}(?:\/[A-Z])?|PR #\d+|user)$/;

export function noteCommand(root: string, cwd: string, args: readonly string[]): Said {
  const { positionals, values } = parse("braid note", args, {
    idea: { type: "boolean" },
    from: { type: "string" },
    ref: { type: "string", multiple: true },
    file: { type: "string" },
  });
  if (positionals.length > 1) {
    throw new UsageError("braid note takes one text (quote it), or --file <path> (--file - for standard input)");
  }
  const kind: EntryKind = values["idea"] === true ? "idea" : "leftover";
  const given = typeof values["from"] === "string" ? values["from"].trim() : undefined;
  if (kind === "leftover" && given === undefined) {
    throw new UsageError("braid note needs --from <source> for a leftover: an item id (0012/A), review <item id>, PR #<n> or user; --idea notes an idea");
  }
  const from = given ?? "user";
  if (!SOURCE.test(from)) {
    throw new UsageError(`--from must be an item id (0012/A), review <item id>, PR #<n> or user; got: ${from}`);
  }
  const ref = (Array.isArray(values["ref"]) ? values["ref"] : []).map((r) => String(r).trim()).filter((r) => r !== "");
  if (ref.some((r) => /[\r\n]/.test(r))) {
    throw new UsageError("--ref must be one line");
  }
  const text = input("braid note", values, cwd, positionals[0]);
  const at = now();
  let id = "";
  const result = writeInbox(root, (current) => {
    id = newEntryId(at, (candidate) => KINDS.some((k) => current.has(entryPath(k, candidate))));
    const content = formatEntry(kind, { from, ref, status: "open", passed: kind === "leftover" ? 0 : null, into: [], why: null }, text);
    return { files: new Map([[entryPath(kind, id), content]]), message: `docs(inbox): ${id} note` };
  });
  const where = result.pushed ? `pushed to ${REMOTE}/${INBOX_BRANCH}` : `kept on the local ${INBOX_BRANCH}`;
  return {
    stdout: `Noted ${kind} ${id} (${where}, ${result.commit.slice(0, 7)})\n`,
    stderr: result.warning === null ? "" : `warning: ${result.warning}\n`,
  };
}

function fetchWarning(fetched: FetchResult | null): string {
  return fetched?.state === "offline" ? `warning: can't fetch ${INBOX_BRANCH} from ${REMOTE} (${fetched.why}); listing the local copy\n` : "";
}

function ageOf(entry: Entry, at: Date): string {
  return entry.created === null ? "?" : age(new Date(entry.created * 1000).toISOString(), at);
}

function table(rows: readonly (readonly string[])[]): string {
  const widths = rows.reduce<number[]>((w, row) => row.map((cell, i) => Math.max(w[i] ?? 0, cell.length)), []);
  return rows.map((row) => row.map((cell, i) => (i === row.length - 1 ? cell : cell.padEnd(widths[i] ?? 0))).join("  ").trimEnd()).join("\n");
}

export function inboxCommand(root: string, args: readonly string[]): Said {
  const verb = SWEEP_VERBS.find((v) => v === args[0]);
  if (verb !== undefined) {
    return sweepCommand(root, verb, args.slice(1));
  }
  const { positionals, values } = parse("braid inbox", args, {
    leftovers: { type: "boolean" },
    ideas: { type: "boolean" },
    all: { type: "boolean" },
    "no-fetch": { type: "boolean" },
  });
  const fetch = values["no-fetch"] !== true;
  if (positionals[0] === "show") {
    if (positionals.length !== 2) {
      throw new UsageError("usage: braid inbox show <id>");
    }
    return showEntry(root, positionals[1] ?? "", fetch);
  }
  if (positionals.length > 0) {
    throw new UsageError(`braid inbox takes --leftovers, --ideas, --all, --no-fetch, or show <id>; got: ${positionals.join(" ")}`);
  }
  if (values["leftovers"] === true && values["ideas"] === true) {
    throw new UsageError("braid inbox takes --leftovers or --ideas, not both");
  }
  const inbox = readInbox(root, { fetch });
  const kinds: readonly EntryKind[] = values["leftovers"] === true ? ["leftover"] : values["ideas"] === true ? ["idea"] : KINDS;
  const all = values["all"] === true;
  const at = now();
  const shown = inbox.entries
    .filter((e) => kinds.includes(e.kind) && (all || e.status === "open"))
    .sort((a, b) => KINDS.indexOf(a.kind) - KINDS.indexOf(b.kind) || (a.id < b.id ? -1 : 1));
  const rows = shown.map((e) => [
    e.kind,
    e.id,
    ageOf(e, at),
    ...(all ? [e.status] : []),
    e.from ?? "",
    e.passed === null ? "" : `passed ${e.passed}`,
    e.title,
  ]);
  const lines = [rows.length === 0 ? `No ${all ? "" : "open "}entries in ${INBOX_BRANCH}.` : table(rows)];
  const problems = inbox.problems.filter((p) => kinds.some((k) => p.file.startsWith(`${k}s/`)) || !/^(leftovers|ideas)\//.test(p.file));
  for (const p of problems) {
    lines.push(`malformed: ${p.file}: ${p.field}: ${p.message}`);
  }
  return { stdout: `${lines.join("\n")}\n`, stderr: fetchWarning(inbox.fetched) };
}

/** The item folder an entry's `from` names, when it exists in the working tree or on a braid branch. */
function itemFolder(root: string, from: string | null): string | null {
  const id = /^(?:review )?(\d{4}(?:\/[A-Z])?)$/.exec(from ?? "")?.[1];
  if (id === undefined) {
    return null;
  }
  try {
    return find(loadLiveBraids(root), id, "braid inbox show").item.folder;
  } catch {
    return null;
  }
}

function showEntry(root: string, id: string, fetch: boolean): Said {
  if (!ENTRY_ID.test(id)) {
    throw new UsageError(`an inbox entry id looks like 2026-11-18-k3f9; got: ${id}`);
  }
  const inbox = readInbox(root, { fetch });
  const stderr = fetchWarning(inbox.fetched);
  const entry = inbox.entries.find((e) => e.id === id);
  if (entry === undefined) {
    const problem = inbox.problems.find((p) => p.file.endsWith(`/${id}.md`));
    if (problem !== undefined) {
      throw new UsageError(`${problem.file} is malformed: ${problem.field}: ${problem.message}`);
    }
    throw new UsageError(`no inbox entry ${id} in ${INBOX_BRANCH}`);
  }
  const lines = [`${entry.kind} ${entry.id}  (${entry.file} on ${INBOX_BRANCH})`];
  if (entry.from !== null) {
    lines.push(`from: ${entry.from}`);
  }
  for (const ref of entry.ref) {
    lines.push(`ref: ${ref}`);
  }
  lines.push(`status: ${entry.status}`);
  if (entry.passed !== null) {
    lines.push(`passed: ${entry.passed}`);
  }
  if (entry.into.length > 0) {
    lines.push(`into: ${entry.into.join(", ")}`);
  }
  if (entry.why !== null) {
    lines.push(`why: ${entry.why}`);
  }
  if (entry.created !== null) {
    lines.push(`created: ${new Date(entry.created * 1000).toISOString().slice(0, 16).replace("T", " ")}Z (${ageOf(entry, now())} ago)`);
  }
  const folder = itemFolder(root, entry.from);
  if (folder !== null) {
    lines.push(`item: ${folder}`);
  }
  lines.push("", entry.text);
  return { stdout: `${lines.join("\n")}\n`, stderr };
}
