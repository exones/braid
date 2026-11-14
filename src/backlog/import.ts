// `braid import-backlog`: turns a Backlog.md folder into braids/. The plan is made in full
// (and every brief re-parsed) before anything is written, so a refusal changes nothing.
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { parseBrief, STATUSES, type Status } from "../braids/brief.js";
import { checkBraids } from "../braids/check.js";
import { FormatError } from "../braids/frontmatter.js";
import { BRAID_FOLDER } from "../braids/store.js";
import { formatBrief, slugify, type BriefFields } from "../braids/write.js";
import { checks, list, marked, splitFile, text, type Check } from "./parse.js";

export class ImportRefusal extends Error {
  override name = "ImportRefusal";
  constructor(
    readonly problems: readonly string[],
    /** 2 when an input file doesn't parse, 1 when a target already exists. */
    readonly code: 1 | 2,
  ) {
    super(problems.join("\n"));
  }
}

interface Task {
  readonly file: string;
  readonly key: string;
  readonly number: number;
  readonly sub: number | null;
  readonly title: string;
  readonly status: Status;
  readonly labels: readonly string[];
  readonly dependencies: readonly string[];
  readonly docs: readonly string[];
  readonly order: number | null;
  readonly created: string;
  readonly description: string;
  readonly acceptance: readonly Check[];
  readonly dod: readonly Check[];
  readonly plan: string;
  readonly notes: string;
  readonly summary: string;
}

const ID = /^[A-Za-z]+-(\d+)(?:\.(\d+))?$/;
const lf = (s: string) => s.replaceAll("\r\n", "\n");

function parseTask(root: string, file: string): Task {
  const split = splitFile(readFileSync(join(root, file), "utf8"), file);
  const f = split.fields;
  const key = text(f, "id") ?? "";
  const id = ID.exec(key);
  if (!id) {
    throw new FormatError(file, `id must look like TASK-12 or TASK-12.1; got: ${key}`);
  }
  const status = text(f, "status") ?? "";
  if (!(STATUSES as readonly string[]).includes(status) || status === "Outline") {
    throw new FormatError(file, `status must be To Do, In Progress or Done; got: ${status}`);
  }
  const created = /^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2}))?/.exec(text(f, "created_date") ?? "");
  if (!created) {
    throw new FormatError(file, "created_date is missing or not a date");
  }
  const ordinal = text(f, "ordinal");
  if (ordinal !== null && !/^\d+$/.test(ordinal)) {
    throw new FormatError(file, `ordinal must be a whole number; got: ${ordinal}`);
  }
  const body = split.body;
  return {
    file,
    key: key.toUpperCase(),
    number: Number(id[1]),
    sub: id[2] === undefined ? null : Number(id[2]),
    title: text(f, "title") ?? "",
    status: status as Status,
    labels: list(f, "labels", file),
    dependencies: list(f, "dependencies", file),
    docs: list(f, "documentation", file),
    order: ordinal === null ? null : Number(ordinal),
    created: `${created[1]}T${created[2] ?? "00:00"}`,
    description: lf(marked(body, "SECTION:DESCRIPTION", file) ?? ""),
    acceptance: checks(marked(body, "AC", file), file, "acceptance criteria"),
    dod: checks(marked(body, "DOD", file), file, "definition of done"),
    plan: lf(marked(body, "SECTION:PLAN", file) ?? ""),
    notes: lf(marked(body, "SECTION:NOTES", file) ?? ""),
    summary: lf(marked(body, "SECTION:FINAL_SUMMARY", file) ?? ""),
  };
}

interface Doc {
  readonly title: string;
  readonly body: string;
}

function readDoc(root: string, ref: string, owner: Task): { path: string; doc: Doc } | null {
  if (/^[a-z]+:\/\//i.test(ref)) {
    return null;
  }
  const clean = ref.replaceAll("\\", "/");
  const path = [clean, `backlog/docs/${clean}`].find((p) => existsSync(join(root, p)) && statSync(join(root, p)).isFile());
  if (path === undefined) {
    throw new FormatError(owner.file, `documentation file not found: ${ref}`);
  }
  const split = splitFile(readFileSync(join(root, path), "utf8"), path);
  return { path, doc: { title: text(split.fields, "title") ?? path, body: lf(split.body).trim() } };
}

function checkboxes(items: readonly Check[]): string {
  return items.map((c) => `- [${c.done ? "x" : " "}] ${c.text}`).join("\n");
}

function body(task: Task): string {
  const parts: string[] = [];
  if (task.description !== "") {
    parts.push(task.description);
  }
  if (task.acceptance.length > 0) {
    parts.push(`## Acceptance\n\n${checkboxes(task.acceptance)}`);
  }
  if (task.dod.length > 0) {
    parts.push(`## Definition of done\n\n${checkboxes(task.dod)}`);
  }
  if (task.plan !== "") {
    parts.push(`## Plan\n\n${task.plan}`);
  }
  return `\n${parts.join("\n\n")}\n`;
}

export interface PlannedFile {
  /** Relative to the repository root, forward slashes. */
  readonly path: string;
  readonly content: string;
}

export interface Plan {
  readonly files: readonly PlannedFile[];
  readonly braids: number;
  readonly strands: number;
  /** What was left out, one line each. */
  readonly skipped: readonly string[];
}

function filesIn(root: string, dir: string): string[] {
  const path = join(root, dir);
  return existsSync(path) ? readdirSync(path).filter((n) => n.endsWith(".md")).sort() : [];
}

export function planImport(root: string): Plan {
  const problems: string[] = [];
  const tasks: Task[] = [];
  for (const name of filesIn(root, "backlog/tasks")) {
    try {
      tasks.push(parseTask(root, `backlog/tasks/${name}`));
    } catch (error) {
      if (!(error instanceof FormatError)) {
        throw error;
      }
      problems.push(`${error.file}: ${error.message}`);
    }
  }
  if (problems.length > 0) {
    throw new ImportRefusal(problems, 2);
  }

  const byKey = new Map<string, Task>();
  for (const t of tasks) {
    const other = byKey.get(t.key);
    if (other !== undefined) {
      problems.push(`${t.file}: ${t.key} is also used by ${other.file}`);
    }
    byKey.set(t.key, t);
  }
  const tops = tasks.filter((t) => t.sub === null).sort((a, b) => a.number - b.number);
  const children = new Map<number, Task[]>();
  for (const t of tasks.filter((x) => x.sub !== null)) {
    if (!tops.some((p) => p.number === t.number)) {
      problems.push(`${t.file}: ${t.key} has no parent task`);
    }
    children.set(t.number, [...(children.get(t.number) ?? []), t]);
  }
  for (const subs of children.values()) {
    subs.sort((a, b) => (a.sub ?? 0) - (b.sub ?? 0));
    if (subs.length > 26) {
      problems.push(`${subs[0]?.file ?? ""}: more than 26 subtasks`);
    }
  }
  for (const t of tops) {
    if (t.number > 9999) {
      problems.push(`${t.file}: task number ${t.number} does not fit four digits`);
    }
  }

  // Ids: TASK-7 -> 0007, TASK-7.1 -> 0007/A.
  const pad = (n: number) => String(n).padStart(4, "0");
  const idOf = new Map<string, string>();
  for (const t of tops) {
    idOf.set(t.key, pad(t.number));
    (children.get(t.number) ?? []).forEach((s, i) => idOf.set(s.key, `${pad(t.number)}/${String.fromCharCode(65 + i)}`));
  }
  const mapDeps = (t: Task) =>
    t.dependencies.flatMap((d) => {
      const id = idOf.get(d.toUpperCase());
      if (id === undefined) {
        problems.push(`${t.file}: depends on ${d}, which is not an imported task`);
        return [];
      }
      return [id];
    });

  // Docs go to the task that links them; one linked from a braid and its strand goes to the strand.
  const linked = new Map<string, { doc: Doc; owners: Task[] }>();
  for (const t of tasks) {
    for (const ref of t.docs) {
      try {
        const found = readDoc(root, ref, t);
        if (found !== null) {
          const entry = linked.get(found.path) ?? { doc: found.doc, owners: [] };
          entry.owners.push(t);
          linked.set(found.path, entry);
        }
      } catch (error) {
        if (!(error instanceof FormatError)) {
          throw error;
        }
        problems.push(`${error.file}: ${error.message}`);
      }
    }
  }
  const docsOf = new Map<string, Doc[]>();
  for (const { doc, owners } of linked.values()) {
    const strands = owners.filter((o) => o.sub !== null);
    for (const o of owners) {
      if (o.sub === null && strands.some((s) => s.number === o.number)) {
        continue;
      }
      docsOf.set(o.key, [...(docsOf.get(o.key) ?? []), doc]);
    }
  }

  const base = join(root, "braids");
  const taken = existsSync(base)
    ? readdirSync(base).filter((n) => BRAID_FOLDER.test(n) && statSync(join(base, n)).isDirectory())
    : [];
  const files: PlannedFile[] = [];
  const exists: string[] = [];
  let strandCount = 0;

  const item = (t: Task, dir: string, id: string, delivery: BriefFields["delivery"]) => {
    const fields: BriefFields = {
      id,
      title: t.title,
      status: t.status,
      labels: t.labels,
      dependencies: mapDeps(t),
      order: t.order,
      delivery,
    };
    const content = formatBrief(fields, body(t));
    try {
      parseBrief(content, `${dir}/brief.md`, id);
    } catch (error) {
      if (!(error instanceof FormatError)) {
        throw error;
      }
      problems.push(`${t.file}: ${error.message}`);
    }
    files.push({ path: `${dir}/brief.md`, content });
    if (t.notes !== "") {
      const [date, time] = t.created.split("T");
      files.push({ path: `${dir}/log-${date}-import.md`, content: `## ${date} ${time}Z\n\n${t.notes}\n` });
    }
    const parts = [t.summary, ...(docsOf.get(t.key) ?? []).map((d) => `## ${d.title}\n\n${d.body}`)].filter((p) => p !== "");
    if (parts.length > 0) {
      files.push({ path: `${dir}/report.md`, content: `${parts.join("\n\n")}\n` });
    }
  };

  for (const t of tops) {
    const number = pad(t.number);
    const clash = taken.find((n) => n.startsWith(`${number}-`));
    if (clash !== undefined) {
      exists.push(`braids/${clash}: braid ${number} already exists (${t.key})`);
    }
    const dir = `braids/${number}-${slugify(t.title, "braid")}`;
    const subs = children.get(t.number) ?? [];
    item(t, dir, number, subs.length > 0 ? "epic" : "main");
    subs.forEach((s, i) => {
      const letter = String.fromCharCode(65 + i);
      item(s, `${dir}/${letter}-${slugify(s.title, "strand")}`, `${number}/${letter}`, null);
      strandCount += 1;
    });
  }
  if (problems.length > 0) {
    throw new ImportRefusal(problems, 2);
  }
  if (exists.length > 0) {
    throw new ImportRefusal(exists, 1);
  }

  const skipped: string[] = [];
  for (const [dir, what] of [
    ["backlog/archive/tasks", "archived task"],
    ["backlog/drafts", "draft"],
  ] as const) {
    const n = filesIn(root, dir).length;
    if (n > 0) {
      skipped.push(`${n} ${what}${n === 1 ? "" : "s"} in ${dir}/`);
    }
  }
  const unlinked = filesIn(root, "backlog/docs").filter((n) => ![...linked.keys()].some((p) => p.endsWith(`/${n}`)));
  if (unlinked.length > 0) {
    skipped.push(`${unlinked.length} doc${unlinked.length === 1 ? "" : "s"} no task links: ${unlinked.join(", ")}`);
  }
  return { files, braids: tops.length, strands: strandCount, skipped };
}

export function writePlan(root: string, plan: Plan): void {
  for (const f of plan.files) {
    const path = join(root, f.path);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, f.content);
  }
}

export function importBacklog(root: string, dryRun: boolean): string {
  const plan = planImport(root);
  const lines = plan.files.map((f) => `${dryRun ? "would write" : "wrote"} ${f.path}`);
  lines.push(`${dryRun ? "Would import" : "Imported"} ${plan.braids} braids, ${plan.strands} strands`);
  if (plan.skipped.length > 0) {
    lines.push(`Not imported: ${plan.skipped.join("; ")}`);
  }
  if (!dryRun) {
    writePlan(root, plan);
    const result = checkBraids(root);
    if (result.errors.length > 0) {
      throw new ImportRefusal(result.errors, 2);
    }
    lines.push(`braids OK: ${result.braids} braids, ${result.strands} strands`);
  }
  return `${lines.join("\n")}\n`;
}
