// `braid status <number>` and `braid next <number>`: what a coordinator needs to run a braid,
// read from the same sources as the board (branch copies, GitHub, T3). They change nothing.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join, isAbsolute } from "node:path";
import { braidBranches, loadLiveBraids, type BranchRef } from "../braids/branches.js";
import type { Braid } from "../braids/store.js";
import { readGithub, runGh, type GhRunner, type Github } from "../board/github.js";
import { toCard, type BraidCard, type Lane, type StrandCard } from "../board/model.js";
import { readT3, runT3, type T3, type T3Runner, type Worktrees } from "../board/t3.js";
import { UsageError } from "./braids.js";

export interface Sources {
  readonly gh?: GhRunner;
  readonly t3?: T3Runner;
  readonly worktrees?: Worktrees;
}

/** The `ci` check names of BRAID.md; empty when it names none. */
export function ciChecks(root: string): string[] {
  const file = join(root, "BRAID.md");
  if (!existsSync(file)) {
    return [];
  }
  const front = /^---\r?\n([\s\S]*?)\r?\n---/.exec(readFileSync(file, "utf8"))?.[1] ?? "";
  const list = /^ci:\s*\[(.*)\]\s*$/m.exec(front)?.[1];
  return list === undefined ? [] : list.split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter((s) => s !== "");
}

function braidNumber(args: readonly string[], command: string): string {
  const [raw, ...extra] = args;
  const match = raw === undefined ? null : /^(\d{1,4})$/.exec(raw);
  if (match === null || extra.length > 0) {
    throw new UsageError(`usage: braid ${command} <number>  (a braid number like 0008, not a strand)`);
  }
  return (match[1] ?? "").padStart(4, "0");
}

export interface World {
  readonly braid: Braid;
  readonly card: BraidCard;
  readonly cards: ReadonlyMap<string, { readonly lane: Lane; readonly strand: StrandCard | null }>;
  readonly refs: readonly BranchRef[];
  readonly github: Github;
  readonly t3: T3;
}

export async function read(root: string, number: string, command: string, src: Sources): Promise<World> {
  const braids = loadLiveBraids(root);
  const braid = braids.find((b) => b.number === number);
  if (braid === undefined) {
    throw new UsageError(`no braid ${number} (braid ${command} takes a braid number)`);
  }
  const github = readGithub(root, src.gh ?? runGh, 0);
  const t3 = await readT3(root, github, { ttlMs: 0, run: src.t3 ?? runT3, ...(src.worktrees === undefined ? {} : { worktrees: src.worktrees }) });
  const cards = new Map<string, { lane: Lane; strand: StrandCard | null }>();
  let card: BraidCard | undefined;
  for (const b of braids) {
    const c = toCard(b, github, t3);
    cards.set(c.id, { lane: c.lane, strand: null });
    for (const s of c.strands) {
      cards.set(s.id, { lane: s.lane, strand: s });
    }
    if (b === braid) {
      card = c;
    }
  }
  return { braid, card: card as BraidCard, cards, refs: braidBranches(root), github, t3 };
}

export function branchState(refs: readonly BranchRef[], number: string, letter: string | null): { local: boolean; pushed: boolean } {
  const own = refs.filter((r) => r.number === number && r.letter === letter);
  return { local: own.some((r) => r.local), pushed: own.some((r) => !r.local) };
}

/** When the remote-tracking branches were last updated by a fetch, as Git recorded it. */
export function freshness(root: string): string {
  const r = spawnSync("git", ["rev-parse", "--git-path", "FETCH_HEAD"], { cwd: root, encoding: "utf8" });
  const raw = r.status === 0 ? r.stdout.trim() : "";
  const path = raw === "" ? "" : isAbsolute(raw) ? raw : join(root, raw);
  if (path === "" || !existsSync(path)) {
    return "remote branches: as of this clone's last fetch (it never fetched; braid does not fetch)";
  }
  return `remote branches: as of the last git fetch, ${statSync(path).mtime.toISOString().slice(0, 16).replace("T", " ")} UTC (braid does not fetch)`;
}

function checksText(names: readonly string[], card: StrandCard | BraidCard): string {
  const pr = card.pr;
  if (pr === null || pr.state !== "open") {
    return pr?.state === "merged" ? "merged" : "-";
  }
  if (names.length === 0) {
    return `checks ${pr.checks}`;
  }
  const runs = pr.runs ?? [];
  return names.map((n) => `${n}: ${runs.find((r) => r.name === n)?.result ?? "pending"}`).join(", ");
}

function line(names: readonly string[], w: World, card: StrandCard | BraidCard, letter: string | null): string {
  const b = branchState(w.refs, w.braid.number, letter);
  const key = letter === null ? w.braid.number : `${w.braid.number}/${letter}`;
  const threads = w.t3.threads.get(key) ?? [];
  const thread = w.t3.status.state !== "ok" ? "?" : threads.some((t) => t.state === "running") ? "running" : threads.length > 0 ? "stopped" : "-";
  const where = b.local ? (b.pushed ? "local+pushed" : "local") : b.pushed ? "+pushed" : "-";
  const pr = card.pr === null ? "-" : `#${card.pr.number} ${card.pr.state}`;
  const lane = card.reason === null ? card.lane : `${card.lane} (${card.reason})`;
  const ask = card.ask === null ? "" : `  ask:${card.ask}`;
  return `${card.id}  ${card.status}  ${lane}${ask}  branch ${where}  PR ${pr}  ci ${checksText(names, card)}  thread ${thread}  ${card.title}`;
}

/** The notes for a source that couldn't be read; `next` also says what that hides. */
export function unreadable(w: World, next: boolean): string {
  let out = "";
  if (w.github.status.state !== "ok") {
    out += `note: GitHub could not be read (${w.github.status.reason}); ${next ? "an open PR would not show" : "PRs and checks are missing and lanes come from stored statuses"}
`;
  }
  if (w.t3.status.state !== "ok") {
    out += `note: T3 could not be read (${w.t3.status.reason}); ${next ? "a running agent can't be ruled out" : "threads show as ?"}
`;
  }
  return out;
}

export async function statusCommand(root: string, args: readonly string[], src: Sources = {}): Promise<string> {
  const number = braidNumber(args, "status");
  const w = await read(root, number, "status", src);
  const names = ciChecks(root);
  const out = [line(names, w, w.card, null), ...w.card.strands.map((s) => `  ${line(names, w, s, s.id.slice(5))}`)];
  if (w.github.status.state !== "ok") {
    out.push(`note: GitHub could not be read (${w.github.status.reason}); PRs and checks are missing and lanes come from stored statuses`);
  }
  if (w.t3.status.state !== "ok") {
    out.push(`note: T3 could not be read (${w.t3.status.reason}); threads show as ?`);
  }
  out.push(freshness(root));
  return `${out.join("\n")}\n`;
}

/** Why a strand can't be started now, or null when it is ready (what `braid next` and `braid start` share). */
export function notReady(w: World, s: StrandCard): string | null {
  const letter = s.id.slice(5);
  const strand = w.braid.strands.find((x) => x.letter === letter);
  const deps = strand?.brief.dependencies ?? [];
  const blocked = deps.filter((d) => w.cards.get(d)?.lane !== "Done");
  const b = branchState(w.refs, w.braid.number, letter);
  if (s.lane === "Done") {
    return "done";
  } else if (s.status === "Outline") {
    return "Outline, not ready to run";
  } else if (s.running) {
    return "running";
  } else if (s.pr?.state === "open") {
    return `PR #${s.pr.number} is open (${s.lane})`;
  } else if (s.lane === "Waiting") {
    return `waiting (${s.reason ?? "?"})`;
  } else if (s.status !== "To Do") {
    return `status ${s.status}, no running agent or PR`;
  } else if (blocked.length > 0) {
    return `blocked by ${blocked.join(", ")}`;
  } else if (b.pushed) {
    return "branch already pushed";
  }
  return null;
}

export async function nextCommand(root: string, args: readonly string[], src: Sources = {}): Promise<string> {
  const number = braidNumber(args, "next");
  const w = await read(root, number, "next", src);
  const notes: string[] = [];
  for (const s of w.card.strands) {
    if (s.lane === "Done") {
      continue;
    }
    const why = notReady(w, s);
    if (why === null) {
      return `${s.id}  ${s.title}\n${unreadable(w, true)}${freshness(root)}\n`;
    }
    notes.push(`${s.id}: ${why}`);
  }
  const head = notes.length === 0 ? `none: all strands of ${number} are done` : `none ready in ${number}:\n${notes.map((n) => `  ${n}`).join("\n")}`;
  return `${head}\n${unreadable(w, true)}${freshness(root)}\n`;
}
