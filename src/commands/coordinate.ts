// `braid status <number>` and `braid next <number>`: what a coordinator needs to run a braid,
// read from the same sources as the board (branch copies, GitHub, T3). They change nothing.
import { gitSync } from "../braids/gitio.js";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join, isAbsolute } from "node:path";
import { braidBranches, loadLiveBraids, type BranchRef } from "../braids/branches.js";
import type { Braid } from "../braids/store.js";
import { readGithub, runGh, type GhRunner, type Github } from "../board/github.js";
import { LANE_LABEL, needLine } from "../board/marks.js";
import { readInputs, readStartContext } from "../board/inputs.js";
import { readPlans } from "../board/plans.js";
import { age, askerOf, handleOf, isTimedWait, isWait, loadRequests, type Request } from "../braids/requests.js";
import { askWords, toCard, type Alarm, type BraidCard, type Lane, type StrandCard } from "../board/model.js";
import { problemLine, readiness } from "../braids/readiness.js";
import { readSignals } from "../board/signals.js";
import { clock, laneNote, statusLine } from "../board/pause.js";
import { readT3, runT3, type T3, type T3Runner } from "../board/t3.js";
import { FormatError } from "../braids/frontmatter.js";
import { UsageError } from "./braids.js";

export interface Sources {
  readonly gh?: GhRunner;
  readonly t3?: T3Runner;
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

/** Whether `ci: all` is set in BRAID.md: every check reported on the commit must finish green (`ciChecks` is empty then). */
export function ciAll(root: string): boolean {
  const file = join(root, "BRAID.md");
  if (!existsSync(file)) {
    return false;
  }
  const front = /^---\r?\n([\s\S]*?)\r?\n---/.exec(readFileSync(file, "utf8"))?.[1] ?? "";
  return /^ci:\s*["']?all["']?\s*$/m.test(front);
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
  /** Every open request on the record that the board doesn't read as closed (`braid status` lists them). */
  readonly requests: readonly Request[];
  /** Why `.braid/pauses.json` was read as no pauses; null when it read cleanly or is missing. */
  readonly pausesNote: string | null;
  readonly now: Date;
}

export async function read(root: string, number: string, command: string, src: Sources, reuse?: World): Promise<World> {
  // The same inputs as the board reads (src/board/inputs.ts). A command over several braids (`braid clean`) reads GitHub and T3 once and passes that read on.
  const { braids, github, t3, sig, start } = await readInputs(
    {
      braids: () => loadLiveBraids(root),
      github: () => reuse?.github ?? readGithub(root, src.gh ?? runGh, 0),
      t3: () => (reuse === undefined ? readT3(root, { run: src.t3 ?? runT3 }) : Promise.resolve(reuse.t3)),
      signals: (g) => readSignals(root, g),
      plans: () => readPlans(root),
      start: () => readStartContext(root),
    },
  );
  const braid = braids.find((b) => b.number === number);
  if (braid === undefined) {
    throw new UsageError(`no braid ${number} (braid ${command} takes a braid number)`);
  }
  const cards = new Map<string, { lane: Lane; strand: StrandCard | null }>();
  let card: BraidCard | undefined;
  const alarms: Alarm[] = [];
  for (const b of braids) {
    const c = toCard(b, github, t3, sig, start);
    alarms.push(...c.alarms);
    cards.set(c.id, { lane: c.lane, strand: null });
    for (const s of c.strands) {
      cards.set(s.id, { lane: s.lane, strand: s });
    }
    if (b === braid) {
      card = c;
    }
  }
  sig.commit(alarms);
  return { braid, card: card as BraidCard, cards, refs: braidBranches(root), github, t3, requests: openRequests(root, sig.closed ?? []), pausesNote: sig.pausesNote ?? null, now: sig.now };
}

export function branchState(refs: readonly BranchRef[], number: string, letter: string | null): { local: boolean; pushed: boolean } {
  const own = refs.filter((r) => r.number === number && r.letter === letter);
  return { local: own.some((r) => r.local), pushed: own.some((r) => !r.local) };
}

/** When the remote-tracking branches were last updated by a fetch, as Git recorded it. */
export function freshness(root: string): string {
  const r = gitSync(root, ["rev-parse", "--git-path", "FETCH_HEAD"]);
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

function line(names: readonly string[], w: World, card: StrandCard | BraidCard, letter: string | null): string[] {
  const b = branchState(w.refs, w.braid.number, letter);
  const key = letter === null ? w.braid.number : `${w.braid.number}/${letter}`;
  const threads = w.t3.threads.get(key) ?? [];
  const thread = w.t3.status.state !== "ok" ? "?" : threads.some((t) => t.role === "worker") ? "running" : threads.some((t) => t.role === "reviewer") ? "review running" : threads.length > 0 ? "research running" : "-";
  const where = b.local ? (b.pushed ? "local+pushed" : "local") : b.pushed ? "+pushed" : "-";
  const pr = card.pr === null ? "-" : `#${card.pr.number} ${card.pr.state}`;
  const lane = card.reason !== null ? `${LANE_LABEL[card.lane]} (${card.reason})` : card.pause !== null ? `${LANE_LABEL[card.lane]} (${laneNote(card.pause)})` : LANE_LABEL[card.lane];
  const ask = card.ask === null ? "" : `  ask:${card.ask}`;
  const head = `${card.id}  ${card.status}  ${lane}${ask}  branch ${where}  PR ${pr}  ci ${checksText(names, card)}  thread ${thread}  ${card.title}`;
  const pause = letter === null && card.pause !== null && card.reason !== "stalled" ? [`    ${statusLine(card.pause, w.now)}`] : [];
  return [head, ...pause, ...requestLines(w, card)];
}

/**
 * The lines under an item: the card's (the request the PM handles, the need, the PM's own request), each with its request's
 * name, then one line for every other open request of the item. The card shows one per asker; the record may hold more.
 */
function requestLines(w: World, card: StrandCard | BraidCard): string[] {
  const own = w.requests.filter((r) => r.id === card.id);
  const shown = new Set<string>();
  const named = (handle: string | undefined): string => {
    if (handle === undefined) {
      return "";
    }
    shown.add(handle);
    return `${handle}  `;
  };
  // The card's quiet PM line names the request it is about: the one sent (or forwarded) at its time.
  const line = card.pm;
  const handled = line === null ? undefined : own.findLast((r) => askerOf(r) === "coordinator" && !isWait(r) && (line.forwarded === true ? (r.forwarded ?? r.at) : r.at) === line.since);
  const pm = card.pm === null ? [] : [`    🧭 ${named(handled === undefined ? undefined : handleOf(handled))}${card.pm.text} (to the PM ${card.pm.age} ago)`];
  const need = card.need === null ? [] : [`    ${named(card.need.handle)}${needLine(card.need)}`];
  // The PM's own request, when the need line is another one (the coordinator's).
  const pmAsk = card.pmAsk === null || card.need === card.pmAsk || card.need?.by === "pm" ? [] : [`    🧭 ${named(card.pmAsk.handle)}${needLine(card.pmAsk)}`];
  const rest = own.filter((r) => !shown.has(handleOf(r))).map((r) => `    ${handleOf(r)}  ${openLine(r, w.now)}`);
  return [...pm, ...need, ...pmAsk, ...rest];
}

/** An open request the card doesn't show, in words: whom or what it waits for, its text and age. */
function openLine(r: Request, now: Date): string {
  const whom = askerOf(r) === "pm" ? `${askWords(r.kind)} ` : r.forwarded !== undefined ? "forwarded by the PM: " : r.to === "pm" ? "to the PM: " : r.kind === "action" ? "The coordinator asks you to: " : "";
  const wait = isTimedWait(r) ? `waiting until ${clock(r.doneWhen.slice(5), now)}: ` : isWait(r) ? `waiting on braid ${r.to ?? ""}: ` : "";
  const text = r.kind === "review" && r.pr !== undefined ? `Merge PR #${r.pr}` : r.text;
  return needLine({ kind: "question", text: `${whom}${wait}${text}`, verb: "asked", age: age(r.at, now), since: r.at, key: null, pr: null, who: null, more: 0 });
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

/**
 * The world of `braid status`, or, when it can't be read (no braid, briefs the loader refuses) in a project with problems, the problem lines
 * and why the status can't be shown, so a folder that isn't a braid project still hears what to do.
 */
async function readOrProblems(root: string, number: string, src: Sources): Promise<World | string> {
  try {
    return await read(root, number, "status", src);
  } catch (error) {
    const problems = readiness(root, null);
    if (problems.length === 0 || !(error instanceof UsageError || error instanceof FormatError)) {
      throw error;
    }
    return [...problems.map(problemLine), `braid status: ${error.message}`].map((l) => `${l}\n`).join("");
  }
}

/** The open requests, without those the board already reads as closed; none outside a repository, as the board reads it. */
function openRequests(root: string, closed: readonly Request[]): Request[] {
  const done = new Set(closed.map((r) => r.code));
  try {
    return loadRequests(root).filter((r) => !done.has(r.code));
  } catch {
    return [];
  }
}

export async function statusCommand(root: string, args: readonly string[], src: Sources = {}): Promise<string> {
  const number = braidNumber(args, "status");
  const w = await readOrProblems(root, number, src);
  if (typeof w === "string") {
    return w;
  }
  const names = ciChecks(root);
  const pauses = w.pausesNote === null ? [] : [`note: ${w.pausesNote}; read as no pauses`];
  const out = [...readiness(root, w.github).map(problemLine), ...pauses, ...line(names, w, w.card, null), ...w.card.strands.flatMap((s) => line(names, w, s, s.id.slice(5)).map((l) => `  ${l}`))];
  // Unreadable GitHub is already the `not ready:` line above (readiness), so no second note.
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
    return `PR #${s.pr.number} is open (${LANE_LABEL[s.lane]})`;
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
