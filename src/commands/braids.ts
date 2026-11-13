import type { Brief } from "../braids/brief.js";
import { loadBraids, type Braid, type Item, type Strand } from "../braids/store.js";

export class UsageError extends Error {
  override name = "UsageError";
}

const STATUS_WIDTH = "In Progress".length;

function strandLine(strand: Strand): string {
  const order = strand.brief.order === null ? "-" : String(strand.brief.order);
  return `  ${strand.brief.id.padEnd(6)}  ${strand.brief.status.padEnd(STATUS_WIDTH)}  ${order.padStart(2)}  ${strand.brief.title}`;
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
  return `${lines.join("\n")}\n`;
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

export function viewItem(root: string, raw: string | undefined): string {
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
      braid.strands.length === 0 ? ["Strands: none"] : ["Strands:", ...braid.strands.map(strandLine)];
    return render(braid, strands);
  }
  const strand = braid.strands.find((s) => s.letter === letter);
  if (strand === undefined) {
    throw new UsageError(`no strand ${id}`);
  }
  return render(strand, [`Braid: ${braid.brief.id}  ${braid.brief.title}`]);
}
