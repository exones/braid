import type { Brief } from "../braids/brief.js";
import type { Said } from "./inbox.js";
import { openCounts } from "../inbox/branch.js";
import { ROLES, threadTitle, titleRepoName, type TitleRole } from "../braids/title.js";
import { loadKnownBraids, loadOpenBraids } from "../braids/branches.js";
import { fetchRemotes } from "../braids/numbers.js";
import { loadBraids, type Braid, type Item, type Strand } from "../braids/store.js";

export class UsageError extends Error {
  override name = "UsageError";
}

const STATUS_WIDTH = "In Progress".length;

function strandLine(strand: Strand, withDeps = false): string {
  const order = strand.brief.order === null ? "-" : String(strand.brief.order);
  const deps = withDeps && strand.brief.dependencies.length > 0 ? `  (needs ${strand.brief.dependencies.join(", ")})` : "";
  return `  ${strand.brief.id.padEnd(6)}  ${strand.brief.status.padEnd(STATUS_WIDTH)}  ${order.padStart(2)}  ${strand.brief.title}${deps}`;
}

export function listBraids(root: string): string {
  const braids = loadBraids(root);
  if (braids.length === 0) {
    return "No braids.\n";
  }
  const lines: string[] = [];
  for (const braid of braids) {
    lines.push(`${braid.brief.id}  ${braid.brief.status.padEnd(STATUS_WIDTH)}  ${braid.brief.title}`);
    for (const strand of braid.strands) {
      lines.push(strandLine(strand));
    }
  }
  const inbox = openCounts(root);
  lines.push("", `Inbox: ${inbox.leftovers} leftovers, ${inbox.ideas} ideas`);
  return `${lines.join("\n")}\n`;
}

const GOAL_LIMIT = 300;

/** The first paragraph of the `## Goal` section, cut at about `GOAL_LIMIT` characters at a word. */
function goalParagraph(braid: Braid): string {
  const goal = braid.brief.sections.find((s) => s.title === "Goal")?.text ?? "";
  const text = (goal.split(/\n\s*\n/)[0] ?? "").replace(/\s+/g, " ").trim();
  if (text.length <= GOAL_LIMIT) {
    return text;
  }
  const cut = text.slice(0, GOAL_LIMIT);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), GOAL_LIMIT / 2))}...`;
}

/** `braid list --open`: every braid that is not Done, wherever it lives, with the start of its goal. */
export function listOpen(root: string, fetch: boolean): Said {
  let stderr = "";
  if (fetch) {
    try {
      fetchRemotes(root);
    } catch (error) {
      stderr = `warning: ${error instanceof Error ? error.message : String(error)}; going on with what is local\n`;
    }
  }
  const braids = loadOpenBraids(root);
  if (braids.length === 0) {
    return { stdout: "No open braids.\n", stderr };
  }
  const blocks = braids.map((braid) => {
    const lines = [`${braid.brief.id}  ${braid.brief.status}  ${braid.brief.title}`, `  read from: ${braid.source?.branch ?? "main"}`];
    if (braid.brief.related.length > 0) {
      lines.push(`  related: ${braid.brief.related.join(", ")}`);
    }
    const goal = goalParagraph(braid);
    if (goal !== "") {
      lines.push("", `  ${goal}`);
    }
    if (braid.strands.length > 0) {
      lines.push("", ...braid.strands.map((s) => strandLine(s)));
    }
    return lines.join("\n");
  });
  return { stdout: `${blocks.join("\n\n")}\n`, stderr };
}

/** `Open braids: <n> (braid list --open)`, the last line of `braid new`. */
export function openBraidsLine(root: string): string {
  return `Open braids: ${loadOpenBraids(root).length} (braid list --open)\n`;
}

/** Accepts `2`, `0002`, `0002/A` and `2/a`; returns `0002` or `0002/A`. */
export function normaliseId(raw: string): string {
  const match = /^(\d{1,4})(?:\/([A-Za-z]))?$/.exec(raw);
  if (!match) {
    throw new UsageError(`not a braid or strand id: ${raw} (expected like 0002 or 0002/A)`);
  }
  const number = (match[1] ?? "").padStart(4, "0");
  return match[2] === undefined ? number : `${number}/${match[2].toUpperCase()}`;
}

function fields(brief: Brief): string[] {
  const none = (values: readonly string[]) => (values.length === 0 ? "none" : values.join(", "));
  const lines = [
    `Status: ${brief.status}`,
    `Labels: ${none(brief.labels)}`,
    `Dependencies: ${none(brief.dependencies)}`,
    `Order: ${brief.order === null ? "none" : String(brief.order)}`,
  ];
  if (brief.delivery !== null) {
    lines.push(`Delivery: ${brief.delivery}`);
  }
  return lines;
}

function files(item: Item): string[] {
  return [
    `Folder: ${item.folder}`,
    `Report: ${item.hasReport ? "report.md" : "none"}`,
    `Logs: ${item.logs.length === 0 ? "none" : ""}`,
    ...item.logs.map((log) => `  ${log}`),
  ].map((line) => line.trimEnd());
}

function render(item: Item, extra: string[]): string {
  const brief = item.brief;
  const body = brief.body.trim();
  const lines = [`${brief.id}  ${brief.title}`, "", ...fields(brief), ...files(item), ...extra];
  if (body !== "") {
    lines.push("", body);
  }
  return `${lines.join("\n")}\n`;
}

/** `braid title <id> --role <role>`: the full thread title of an item; its name is the brief's title, exactly. */
export function titleCommand(root: string, args: readonly string[]): string {
  const at = args.indexOf("--role");
  const role = at === -1 ? undefined : args[at + 1];
  const rest = args.filter((_, i) => i !== at && i !== at + 1);
  if (rest.length !== 1 || role === undefined || !Object.hasOwn(ROLES, role)) {
    throw new UsageError(`usage: braid title <id> --role ${Object.keys(ROLES).join("|")}`);
  }
  const id = normaliseId(rest[0] ?? "");
  const [number, letter] = id.split("/");
  const braid = loadBraids(root).find((b) => b.number === number);
  const item = letter === undefined ? braid : braid?.strands.find((s) => s.letter === letter);
  if (item === undefined) {
    throw new UsageError(`no item ${id}`);
  }
  return `${threadTitle(titleRepoName(root), id, role as TitleRole, item.brief.title)}
`;
}

/**
 * `Linked from:` for `braid view --links`: the open braids whose `related` names this braid, with
 * titles, read from every source `braid list --open` reads, since a link is stored one way only.
 */
function linkedFrom(root: string, braid: Braid): string[] {
  const from = loadKnownBraids(root).filter(
    (b) => b.brief.status !== "Done" && b.number !== braid.number && b.brief.related.includes(braid.number),
  );
  return from.length === 0 ? ["Linked from: none"] : ["Linked from:", ...from.map((b) => `  ${b.number}  ${b.brief.title}`)];
}

export function viewItem(root: string, raw: string | undefined, links = false): string {
  if (raw === undefined) {
    throw new UsageError("braid view needs an id, like 0002 or 0002/A");
  }
  const id = normaliseId(raw);
  const [number, letter] = id.split("/");
  const braid: Braid | undefined = loadBraids(root).find((b) => b.number === number);
  if (braid === undefined) {
    throw new UsageError(`no braid ${number}`);
  }
  if (letter === undefined) {
    const strands =
      braid.strands.length === 0 ? ["Strands: none"] : ["Strands:", ...braid.strands.map((s) => strandLine(s, true))];
    const related = `Related: ${braid.brief.related.length === 0 ? "none" : braid.brief.related.join(", ")}`;
    return render(braid, [related, ...(links ? linkedFrom(root, braid) : []), ...strands]);
  }
  if (links) {
    throw new UsageError("--links shows the braids that link to a braid; give a braid id like 0002, not a strand");
  }
  const strand = braid.strands.find((s) => s.letter === letter);
  if (strand === undefined) {
    throw new UsageError(`no strand ${id}`);
  }
  return render(strand, [`Braid: ${braid.brief.id}  ${braid.brief.title}`]);
}
