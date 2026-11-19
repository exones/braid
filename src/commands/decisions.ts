// `braid decisions <number> [--since <date or sha>]`: the `Decided:` log entries of a braid and its
// strands, oldest first, so the user reads the decisions made under a preset in one place.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { decidedEntries } from "../braids/decided.js";
import { BRAID_ID } from "../braids/brief.js";
import { loadBraids } from "../braids/store.js";
import { git } from "./done.js";
import { normaliseId, UsageError } from "./braids.js";
import { parse, str } from "./edit.js";

const USAGE = "usage: braid decisions <number> [--since <YYYY-MM-DD or commit sha>]";

/** The cut-off for `--since`: a date keeps its whole day and later, a commit keeps entries after its commit time. */
function since(root: string, value: string): (at: string) => boolean {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return (at) => at.slice(0, 10) >= value;
  }
  if (!/^[0-9a-fA-F]{7,40}$/.test(value)) {
    throw new UsageError(`--since needs a date (YYYY-MM-DD) or a commit sha; got: ${value}`);
  }
  const r = git(root, ["show", "-s", "--format=%cI", `${value}^{commit}`]);
  if (r.status !== 0) {
    throw new UsageError(`--since: no commit ${value} here`);
  }
  const cut = new Date(r.stdout.trim()).toISOString().slice(0, 16).replace("T", " ");
  return (at) => at > cut;
}

export function decisionsCommand(root: string, args: readonly string[]): string {
  const { positionals, values } = parse("braid decisions", args, { since: { type: "string" } });
  if (positionals.length !== 1) {
    throw new UsageError(USAGE);
  }
  const number = normaliseId(positionals[0] ?? "");
  if (!BRAID_ID.test(number)) {
    throw new UsageError(`decisions belong to a braid; give a braid number like 0008, not ${number}`);
  }
  const braid = loadBraids(root).find((b) => b.number === number);
  if (braid === undefined) {
    throw new UsageError(`no braid ${number} in this checkout`);
  }
  const from = str(values, "since");
  const keep = from === undefined ? () => true : since(root, from);
  const rows: { at: string; id: string; text: string }[] = [];
  for (const item of [braid, ...braid.strands]) {
    for (const name of item.logs) {
      for (const d of decidedEntries(readFileSync(join(root, item.folder, name), "utf8"))) {
        if (keep(d.at)) {
          rows.push({ at: d.at, id: item.brief.id, text: d.text });
        }
      }
    }
  }
  if (rows.length === 0) {
    return `no Decided: entries for ${number}${from === undefined ? "" : ` since ${from}`}\n`;
  }
  // Stable: entries of the same minute keep braid-then-strand order.
  rows.sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0));
  return `${rows.map((r) => `${r.at.slice(0, 10)}  ${r.id}  ${r.text}`).join("\n")}\n`;
}
