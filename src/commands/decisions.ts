// `braid decisions <id> [--since <date, time or sha>]`: the `Decided:` log entries of a braid and its
// strands (of one strand for a strand id), and the requests the user or the PM answered (from the record), oldest first, so the user reads
// the decisions made under a preset in one place.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { decidedEntries } from "../braids/decided.js";
import { answeredRows, loadRecord } from "../braids/requests.js";
import { loadBraids } from "../braids/store.js";
import { git } from "./done.js";
import { normaliseId, UsageError } from "./braids.js";
import { parse, str } from "./edit.js";

const USAGE = "usage: braid decisions <id> [--since <YYYY-MM-DD, ISO time or commit sha>]";
const TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;
/** A moment as log entries write theirs: `YYYY-MM-DD HH:MM`, UTC. */
const minute = (at: Date) => at.toISOString().slice(0, 16).replace("T", " ");

/** The cut-off for `--since`: a date keeps its whole day and later; a time or a commit keeps entries after that minute. */
function since(root: string, value: string): (at: string) => boolean {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return (at) => at.slice(0, 10) >= value;
  }
  if (TIME.test(value) && !Number.isNaN(Date.parse(value))) {
    const cut = minute(new Date(value));
    return (at) => at > cut;
  }
  if (!/^[0-9a-fA-F]{7,40}$/.test(value)) {
    throw new UsageError(`--since needs a date (YYYY-MM-DD), a time with its zone (2026-11-20T14:00Z or +02:00) or a commit sha; got: ${value}`);
  }
  const r = git(root, ["show", "-s", "--format=%cI", `${value}^{commit}`]);
  if (r.status !== 0) {
    throw new UsageError(`--since: no commit ${value} here`);
  }
  const cut = minute(new Date(r.stdout.trim()));
  return (at) => at > cut;
}

export function decisionsCommand(root: string, args: readonly string[]): string {
  const { positionals, values } = parse("braid decisions", args, { since: { type: "string" } });
  if (positionals.length !== 1) {
    throw new UsageError(USAGE);
  }
  const id = normaliseId(positionals[0] ?? "");
  const number = id.slice(0, 4);
  const braid = loadBraids(root).find((b) => b.number === number);
  if (braid === undefined) {
    throw new UsageError(`no braid ${number} in this checkout`);
  }
  const items = id === number ? [braid, ...braid.strands] : braid.strands.filter((s) => s.brief.id === id);
  if (items.length === 0) {
    throw new UsageError(`no strand ${id} in this checkout`);
  }
  const from = str(values, "since");
  const keep = from === undefined ? () => true : since(root, from);
  const rows: { at: string; id: string; text: string }[] = [];
  for (const item of items) {
    for (const name of item.logs) {
      for (const d of decidedEntries(readFileSync(join(root, item.folder, name), "utf8"))) {
        if (keep(d.at)) {
          rows.push({ at: d.at, id: item.brief.id, text: d.text });
        }
      }
    }
  }
  // The answers the user or the PM gave the braid's requests, from the record (no fetch).
  rows.push(...answeredRows(loadRecord(root).requests, (of) => (id === number ? of.slice(0, 4) === number : of === id)).filter((r) => keep(r.at)));
  if (rows.length === 0) {
    return `no Decided: entries or answered requests for ${id}${from === undefined ? "" : ` since ${from}`}\n`;
  }
  // Stable: entries of the same minute keep braid-then-strand order.
  rows.sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0));
  return `${rows.map((r) => `${r.at.slice(0, 10)}  ${r.id}  ${r.text}`).join("\n")}\n`;
}
