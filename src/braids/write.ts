// Writes brief.md files in exactly the front matter subset the reader accepts:
// ids in single quotes, other text JSON-escaped in double quotes.
import { writeFileSync } from "node:fs";
import { parseBrief, type Delivery, type Status } from "./brief.js";

export interface BriefFields {
  readonly id: string;
  readonly title: string;
  readonly status: Status;
  readonly labels: readonly string[];
  readonly dependencies: readonly string[];
  readonly order: number | null;
  /** Braids only; null for a strand. */
  readonly delivery: Delivery | null;
}

const quoteId = (id: string) => `'${id}'`;
const quoteText = (text: string) => JSON.stringify(text);

export function formatBrief(fields: BriefFields, body: string): string {
  const lines = [
    "---",
    `id: ${quoteId(fields.id)}`,
    `title: ${quoteText(fields.title)}`,
    `status: ${fields.status}`,
    `labels: [${fields.labels.map(quoteText).join(", ")}]`,
    `dependencies: [${fields.dependencies.map(quoteId).join(", ")}]`,
  ];
  if (fields.order !== null) {
    lines.push(`order: ${fields.order}`);
  }
  if (fields.delivery !== null) {
    lines.push(`delivery: ${fields.delivery}`);
  }
  lines.push("---");
  return `${lines.join("\n")}\n${body}`;
}

/**
 * Writes `brief.md` after parsing the new text back, so braid never leaves a brief
 * it can't read. `name` is the file as shown in errors.
 */
export function writeBrief(path: string, name: string, fields: BriefFields, body: string): void {
  const text = formatBrief(fields, body);
  parseBrief(text, name, fields.id);
  writeFileSync(path, text);
}

/** A folder slug from a title: lowercase ASCII letters and digits joined by single hyphens. */
export function slugify(title: string, fallback: string): string {
  const words = title
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word !== "");
  let slug = "";
  for (const word of words) {
    const next = slug === "" ? word : `${slug}-${word}`;
    if (next.length > 40 && slug !== "") {
      break;
    }
    slug = next.slice(0, 40);
  }
  return slug === "" ? fallback : slug;
}

const FENCE = /^(```|~~~)/;
const HEADING = /^## +(.+?)\s*$/;

/** A problem message when `text` would change the sections around it; null when it fits. */
export function checkSectionText(text: string): string | null {
  let fence = false;
  for (const line of text.split("\n")) {
    if (FENCE.test(line)) {
      fence = !fence;
    } else if (!fence && HEADING.test(line)) {
      return `section text must not contain "## " headings (use ### for subheadings); got: ${line}`;
    }
  }
  return fence ? "section text has a code fence that is not closed" : null;
}

/**
 * Sets section `title` of a brief body to `text`: replaces the first `## title`
 * section (headings inside code fences don't count), or appends it at the end.
 */
export function setSection(body: string, title: string, text: string): string {
  const lines = body.split("\n");
  let fence = false;
  let start = -1;
  let end = lines.length;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    if (FENCE.test(line)) {
      fence = !fence;
      continue;
    }
    const heading = fence ? null : HEADING.exec(line);
    if (heading === null) {
      continue;
    }
    if (start === -1 && heading[1] === title) {
      start = i;
    } else if (start !== -1) {
      end = i;
      break;
    }
  }
  const content = text === "" ? [] : ["", ...text.split("\n")];
  if (start === -1) {
    const before = body.replace(/\s+$/, "");
    const section = [`## ${title}`, ...content].join("\n");
    return before === "" ? `\n${section}\n` : `${before}\n\n${section}\n`;
  }
  const head = lines.slice(0, start + 1);
  const tail = lines.slice(end);
  const middle = tail.length === 0 ? content : [...content, ""];
  const result = [...head, ...middle, ...tail].join("\n");
  return result.endsWith("\n") ? result : `${result}\n`;
}
