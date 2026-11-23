// `braid facts <pr>` and `braid recap <id>`: the coordinator's diff facts and a draft recap, from the PR and the item's files at its head.
// They read and print only: the coordinator still judges each fact against the stop cases.
import { keyOfBranch, readGithub, runGh, runsOf, type GhRunner } from "../board/github.js";
import { openCounts, SWEEP_DUE } from "../inbox/branch.js";
import { decidedEntries } from "../braids/decided.js";
import { answeredRows, loadRecord } from "../braids/requests.js";
import { LOG_FILE } from "../braids/store.js";
import { UsageError } from "./braids.js";
import { ciAll, ciChecks } from "./coordinate.js";
import { checksProblem, git, must, view, type PrView } from "./done.js";

const REMOTE = "origin";

const DEPENDENCY = ["*package.json", "*package-lock.json", "*npm-shrinkwrap.json", "*pnpm-lock.yaml", "*yarn.lock", "*bun.lock*", "*requirements*.txt", "*pyproject.toml", "*poetry.lock", "*uv.lock", "*Pipfile*", "*go.mod", "*go.sum", "*Cargo.toml", "*Cargo.lock", "*Gemfile*", "*composer.json", "*composer.lock", "*.csproj", "*packages.lock.json", "*Directory.Packages.props", "*pom.xml", "*build.gradle*"];
const PROCESS = [".github/workflows", "BRAID.md", "AGENTS.md", "CLAUDE.md", ".agents/skills", "autonomy"];
const IS_TEST = /(^|\/)(tests?|__tests__)\/|\.(test|spec)\.[a-z]+$|\.Tests\.ps1$|_test\.go$|(^|\/)test_[^/]*\.py$/i;
const SKIP = String.raw`\.(skip|only)\(|\b[xf]it\(|@pytest\.mark\.skip|@Disabled|@Ignore|t\.Skip\(|-Skip\b`;

export interface Fact {
  readonly key: string;
  readonly text: string;
}

const lines = (s: string): string[] => s.split(/\r?\n/).filter((l) => l !== "");

/** The number of lines on the brief's "Expected size:" line (the upper bound of `N to M` or `N-M`), or null when no number comes directly before "lines". */
export function expectedSize(brief: string): number | null {
  const line = /^Expected size:(.*)$/m.exec(brief)?.[1] ?? "";
  const found = /(\d+)\s*lines?\b/i.exec(line)?.[1];
  return found === undefined ? null : Number(found);
}

/** The stop-case facts of `<base>...<head>`; empty when the diff shows none. */
export function diffFacts(root: string, base: string, head: string, size: number | null): Fact[] {
  const range = `${base}...${head}`;
  const facts: Fact[] = [];
  const add = (key: string, what: string, files: readonly string[]) => {
    if (files.length > 0) {
      facts.push({ key, text: `${what}: ${files.join(", ")}` });
    }
  };
  const paths = (list: readonly string[]) => lines(must(root, ["diff", "--name-only", range, "--", ...list], "git diff failed"));
  add("dependency", "manifest or lockfile changed", paths(DEPENDENCY));
  add("process", "workflow, BRAID.md, AGENTS.md, CLAUDE.md, skill or autonomy preset changed", paths(PROCESS));
  const deleted = lines(must(root, ["diff", "--name-only", "--diff-filter=D", range], "git diff failed"));
  add("process", "deleted test", deleted.filter((f) => IS_TEST.test(f)));
  add("process", "skip or only marker added or removed", lines(must(root, ["diff", "--name-only", `-G${SKIP}`, range], "git diff failed")));
  // braids/** (the item's brief, report and logs) is not the change: it is left out of the size, as PR-size tools leave out generated files.
  const stat = must(root, ["diff", "--numstat", range, "--", ".", ":(exclude)braids"], "git diff failed");
  const changed = lines(stat).reduce((n, l) => n + l.split("\t").slice(0, 2).reduce((a, x) => a + (Number(x) || 0), 0), 0);
  if (size !== null && changed > 2 * size) {
    facts.push({ key: "quality or scope", text: `${changed} lines changed, over twice the brief's expected size of ${size}` });
  }
  return facts;
}

interface Item {
  readonly id: string;
  readonly folder: string;
  readonly brief: string;
}

/** The item `id`, found by its id among the briefs under braids/ at `head`. */
function itemAt(root: string, head: string, id: string): Item | null {
  const files = lines(git(root, ["ls-tree", "-r", "--name-only", head, "--", "braids"]).stdout).filter((f) => f.endsWith("/brief.md"));
  for (const f of files) {
    const text = git(root, ["show", `${head}:${f}`]).stdout;
    if (new RegExp(`^id:\\s*["']?${id}["']?\\s*$`, "m").test(text)) {
      return { id, folder: f.slice(0, -"/brief.md".length), brief: text };
    }
  }
  return null;
}

interface Gathered {
  readonly pr: PrView;
  readonly item: Item | null;
  readonly facts: Fact[];
}

function gather(root: string, run: GhRunner, prNumber: number): Gathered {
  const pr = view(run, root, prNumber);
  must(root, ["fetch", "-q", REMOTE, `+refs/heads/${pr.baseRefName}:refs/remotes/${REMOTE}/${pr.baseRefName}`, `+refs/heads/${pr.headRefName}:refs/remotes/${REMOTE}/${pr.headRefName}`], "can't fetch the PR's branches");
  const id = keyOfBranch(pr.headRefName);
  const item = id === null ? null : itemAt(root, pr.headRefOid, id);
  return { pr, item, facts: diffFacts(root, `${REMOTE}/${pr.baseRefName}`, pr.headRefOid, item === null ? null : expectedSize(item.brief)) };
}

function factLines(facts: readonly Fact[]): string[] {
  return facts.length === 0 ? ["no stop-case facts: no dependency, process or size change"] : facts.map((f) => `${f.key}: ${f.text}`);
}

export async function factsCommand(root: string, args: readonly string[], opts: { gh?: GhRunner } = {}): Promise<string> {
  const m = args.length === 1 ? /^#?(\d+)$/.exec(args[0] ?? "") : null;
  if (m === null) {
    throw new UsageError("usage: braid facts <pr number>");
  }
  const { pr, item, facts } = gather(root, opts.gh ?? runGh, Number(m[1]));
  const head = `PR #${pr.number}: ${pr.baseRefName} <- ${pr.headRefName} at ${pr.headRefOid}${item === null ? " (no braid item found for this branch: no size check)" : ""}`;
  return `${[head, ...factLines(facts)].join("\n")}\n`;
}

/** The `Decided:` entries of the logs at `head` and the requests the user or the PM answered (from the record): the item's own, and for a braid's final PR (`whole`) those of its strands too, oldest first. */
function decidedAt(root: string, head: string, item: Item, whole: boolean): string[] {
  const names = lines(git(root, ["ls-tree", "-r", "--name-only", head, "--", item.folder]).stdout);
  const ids = new Map<string, string>([[item.folder, item.id]]);
  const idOf = (dir: string): string => {
    const known = ids.get(dir);
    if (known !== undefined) {
      return known;
    }
    const id = /^id:\s*["']?([^"'\s]+)/m.exec(git(root, ["show", `${head}:${dir}/brief.md`]).stdout)?.[1] ?? dir;
    ids.set(dir, id);
    return id;
  };
  const rows: { at: string; id: string; text: string }[] = [];
  for (const path of names) {
    const dir = path.slice(0, path.lastIndexOf("/"));
    if (!LOG_FILE.test(path.slice(dir.length + 1)) || (!whole && dir !== item.folder)) {
      continue;
    }
    for (const d of decidedEntries(git(root, ["show", `${head}:${path}`]).stdout)) {
      rows.push({ at: d.at, id: idOf(dir), text: d.text });
    }
  }
  // The answers the user or the PM gave, from the request record; a braid's final PR takes its strands' too.
  rows.push(...answeredRows(loadRecord(root).requests, (id) => id === item.id || (whole && id.startsWith(`${item.id}/`))));
  rows.sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0));
  return rows.map((r) => `- ${r.at.slice(0, 10)} ${r.id}: ${r.text}`);
}

/** The text under the first `## ` heading of a report whose title matches, or null. */
function section(report: string, name: RegExp): string | null {
  const found = report.split(/^## +/m).slice(1).find((p) => name.test(p.split(/\r?\n/, 1)[0] ?? ""));
  return found === undefined ? null : found.split(/\r?\n/).slice(1).join("\n").trim();
}

/** The text after `Label:` on a report line (bold or plain), or null. */
function field(report: string, label: string): string | null {
  return new RegExp(`^\\**${label}:\\**\\s*(.+)$`, "mi").exec(report)?.[1]?.trim() ?? null;
}

export async function recapCommand(root: string, args: readonly string[], opts: { gh?: GhRunner } = {}): Promise<string> {
  const m = args.length === 1 ? /^(\d{1,4})(?:\/([A-Z]))?$/.exec(args[0] ?? "") : null;
  if (m === null) {
    throw new UsageError("usage: braid recap <id>  (a braid or strand id like 0014 or 0014/D)");
  }
  const key = `${(m[1] ?? "").padStart(4, "0")}${m[2] === undefined ? "" : `/${m[2]}`}`;
  const run = opts.gh ?? runGh;
  const github = readGithub(root, run, 0);
  if (github.status.state !== "ok") {
    throw new UsageError(`braid recap: GitHub could not be read (${github.status.reason})`);
  }
  const found = github.prs.get(key);
  if (found === undefined) {
    throw new UsageError(`braid recap: ${key} has no PR`);
  }
  const { pr, item, facts } = gather(root, run, found.number);
  const title = /^title:\s*["']?(.*?)["']?\s*$/m.exec(item?.brief ?? "")?.[1] ?? key;
  const report = item === null ? "" : git(root, ["show", `${pr.headRefOid}:${item.folder}/report.md`]).stdout;
  const names = ciChecks(root);
  const runs = runsOf(pr.statusCheckRollup);
  const checks = (names.length === 0 ? runs.map((r) => r.name) : names).map((n) => `${n} ${runs.find((r) => r.name === n)?.result ?? "pending"}`).join(", ");
  const problem = checksProblem(names, pr, { root, run }, ciAll(root));
  const worker = field(report, "Needs the user");
  const quiet = worker === null || /^`?none`?\.?$/i.test(worker);
  const needs = facts.map((f) => `${f.key} (facts): ${f.text}`);
  const needsLine = [quiet ? null : `worker: ${worker}`, ...needs].filter((x) => x !== null).join("; ");
  const ui = /^labels:.*\bui\b/m.test(item?.brief ?? "");
  const out = [
    `**${key}: ${title}** — ${pr.state === "MERGED" ? "merged" : "ready for your merge"}. PR: ${pr.url} at ${pr.headRefOid}`,
    "",
    `**Done:** ${section(report, /what changed|done/i) ?? "<edit: 1-5 bullets from report.md>"}`,
    `**Decisions:** ${field(report, "Decisions") ?? "<edit: choices the brief didn't settle, or None>"}`,
    ...(item === null ? [] : decidedAt(root, pr.headRefOid, item, m[2] === undefined)),
    "**Deviations:** <edit: only if the work departed from the brief>",
    `**Needs the user:** ${needsLine === "" ? "none" : needsLine}${report === "" ? " (no report.md at the head)" : ""}`,
    `**Screenshots:** ${ui ? "<edit: the final screens, embedded from the artifacts folder>" : "none"}`,
    `**You:** <edit: only if the user must act, e.g. merge PR ${pr.url}>`,
    "**Next:** <edit>",
    "",
    `checks: ${checks}${problem === null ? " (green on this head)" : ` (${problem.why})`}`,
    `For later items (report.md): ${field(report, "For later items") ?? "none"}`,
    "facts:",
    ...factLines(facts).map((l) => `- ${l}`),
    "",
    `braid log line: ${key} merged: PR #${pr.number}, ${pr.headRefOid.slice(0, 7)}. Done: <edit: short report>. For later items: ${field(report, "For later items") ?? "<edit: or none>"}. Plan changes: <edit: or none>. User decided: <edit: or none>. (${title}; checks ${problem === null ? "green" : "not green"}; needs the user: ${needsLine === "" ? "none" : "see recap"})`,
  ];
  const due = openCounts(root).leftovers;
  if (due >= SWEEP_DUE) {
    out.push(`Sweep due: ${due} open leftovers`);
  }
  return `${out.join("\n")}\n`;
}
