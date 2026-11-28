// What T3 knows about the agents: one `t3 thread list --json` per refresh, plus `show --json` for
// each running thread and each recorded review thread not seen finished lately; an idle thread is placed by its worker title. An agent of an item is a
// running thread whose worktree braid created for it (`braid start`, the worker), or a running thread recorded with `braid review`
// (the reviewer, a coordinator's subagent, which `thread list` doesn't show); any other thread, a coordinator's included, is not an
// agent of any item.
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { basename, join, resolve } from "node:path";
import { childRole, dropEndedChecks, loadReviews, type ReviewRecord } from "../braids/reviews.js";
import { callFailure, CALL_TIMEOUT_MS } from "./timeout.js";
import { mainCheckout as baseMainCheckout } from "../braids/repo.js";
import { parseSteeringTitle, parseThreadTitle, titleRepoName } from "../braids/title.js";
import { itemOfFolder, normPath, repoNameOf } from "../braids/worktrees.js";
import { agentsDirs } from "../braids/worktree-folders.js";

export interface T3Thread {
  readonly id: string;
  /** `worker` in the item's own worktree or a running worker child recorded by `braid launch`, `researcher` for a recorded research child, `reviewer` for any other running thread recorded with `braid review`. */
  readonly role: "worker" | "reviewer" | "researcher";
  /** Questions and approvals the agent waits on. */
  readonly pending: number;
  /** The T3 link to open (T3's own `link`, also for a recorded subagent); null when T3 gave none. */
  readonly link: string | null;
  /** The thread's title, when T3 lists one. */
  readonly title?: string | undefined;
  /** The provider instance it runs on (`Claude_Everix`), as T3 lists it; null or absent when T3 doesn't say. The limits view and the steering targets read it. */
  readonly provider?: string | null | undefined;
}

export type T3State =
  | { readonly state: "ok" }
  | { readonly state: "unavailable"; readonly reason: string };

/** A coordinator thread of a braid: its title reads `<emoji> <repo> <number> coordinator: <title>`. */
export interface T3Coordinator {
  readonly id: string;
  readonly link: string | null;
  /** The provider instance and model the thread runs on, as T3 lists them. */
  readonly provider: string | null;
  readonly model: string | null;
}

export interface T3 {
  readonly status: T3State;
  /** Running coordinator threads per braid number (`0006`). */
  readonly coordinators?: ReadonlyMap<string, T3Coordinator>;
  /** Running agents per item key (`0006` or `0006/A`). */
  readonly threads: ReadonlyMap<string, readonly T3Thread[]>;
  /**
   * Worker threads of an item that are not running and not archived (a worker waiting for CI), newest
   * first, per item key. They are no agents (no lane reads them); the board only opens them.
   */
  readonly idle?: ReadonlyMap<string, readonly T3Thread[]>;
  /** The newest coordinator thread per braid number that is not running and not archived. */
  readonly idleCoordinators?: ReadonlyMap<string, T3Coordinator>;
  /** Running threads on a branch `coordinator/idea-<idea id>` (or its `-2`, `-3`), by branch: coordinators planning an idea. */
  readonly ideaThreads?: ReadonlyMap<string, T3Coordinator>;
  /** The status of every thread `thread list` named, by id exactly as T3 gives it (ids are case-sensitive; `archived` for an archived one, `running` for one that works in the background: `working`). A thread absent from it is unknown to T3. */
  readonly states?: ReadonlyMap<string, string>;
  /** The T3 link of every thread `thread list` named, by id: where a request addressed by a thread id (the PM's) opens. */
  readonly links?: ReadonlyMap<string, string>;
  /** The provider instance of every thread `thread list` named that says one, by id: the steering targets read a PM thread's here (0064). */
  readonly providers?: ReadonlyMap<string, string>;
  /** What each running PM checker thread of this repository checks: the text after `🧭 <repo> pm check: `. A programme whose checker runs is running. */
  readonly pmChecks?: readonly string[];
  /** The checkout and branch of every running thread read, braid's or not: `braid clean` leaves them alone. */
  readonly occupied?: readonly { readonly id: string; readonly folder: string | null; readonly branch: string | null }[];
}

export const IDEA_BRANCH = "coordinator/idea-";

/** The running coordinator planning this idea (a thread on `coordinator/idea-<id>` or its `-2`, `-3`), or null. */
export function ideaPlanning(t3: T3, ideaId: string): T3Coordinator | null {
  const base = `${IDEA_BRANCH}${ideaId}`;
  for (const [branch, c] of t3.ideaThreads ?? []) {
    if (branch === base || (branch.startsWith(`${base}-`) && /^\d+$/.test(branch.slice(base.length + 1)))) {
      return c;
    }
  }
  return null;
}

export const NO_T3: T3 = { status: { state: "unavailable", reason: "T3 was not read" }, threads: new Map() };

export interface T3Result {
  readonly status: number | null;
  readonly stdout: string;
  readonly stderr: string;
  readonly error?: Error | undefined;
}

/** Runs `t3` with these arguments in `root`, with `input` on its standard input when given; replaced in tests. */
export type T3Runner = (root: string, args: readonly string[], input?: string) => Promise<T3Result>;

function t3Command(): string {
  const home = join(homedir(), ".t3", "bin", process.platform === "win32" ? "t3.cmd" : "t3");
  return existsSync(home) ? home : "t3";
}

export const runT3: T3Runner = (root, args, input) =>
  new Promise((done) => {
    const command = t3Command();
    // A .cmd file can only run through cmd.exe on Windows; the arguments are fixed words and ids.
    const win = process.platform === "win32";
    const quote = (s: string) => (/[^\w./:=@\\-]/.test(s) ? `"${s}"` : s);
    const child = execFile(
      win ? "cmd.exe" : command,
      win ? ["/d", "/s", "/c", `"${[command, ...args].map(quote).join(" ")}"`] : [...args],
      { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, timeout: CALL_TIMEOUT_MS, windowsHide: true, windowsVerbatimArguments: win },
      (error, stdout, stderr) => {
        const code = error !== null && typeof (error as { code?: unknown }).code === "number" ? (error as { code: number }).code : error === null ? 0 : null;
        done({ status: code, stdout, stderr, error: error !== null && code === null ? error : undefined });
      },
    );
    child.stdin?.on("error", () => {});
    child.stdin?.end(input ?? "");
  });

type Json = Record<string, unknown>;
const obj = (v: unknown): Json | null => (typeof v === "object" && v !== null && !Array.isArray(v) ? (v as Json) : null);
const str = (v: unknown): string | null => (typeof v === "string" && v !== "" ? v : null);

const norm = (p: string): string => resolve(p).replaceAll("\\", "/").toLowerCase();

/** The main checkout, which T3 knows as the project; `root` itself when it is not in a repository. Cached per root. */
export function mainCheckout(root: string): string {
  try {
    return baseMainCheckout(root);
  } catch {
    return root;
  }
}

/** What `t3 thread show <id> --json` says of a thread. */
export interface Where {
  readonly status: string | null;
  readonly worktreePath: string | null;
  readonly branch: string | null;
  readonly pending: number;
  /** `subagent` for a delegated task's child thread; null for a top-level thread. */
  readonly relationshipToParent: string | null;
  /** The thread that delegated a child; null when T3 gives none. */
  readonly parent: string | null;
  /** The provider instance the thread runs on. */
  readonly provider: string | null;
  /** T3's link to the thread (`<base>/<env>/<thread>`). */
  readonly link: string | null;
}

/** How long after its record a recorded PM checker is read for: each run of it is a separate task the PM starts, and between runs T3 shows it `completed`, so the record stays until the thread is archived or this passes (bounds the `thread show` reads). Docs: board.md. */
export const CHECKER_CAP_MS = 24 * 60 * 60_000;

/** What a recorded PM checker's record becomes: it counts while T3 says it runs; it is dropped once T3 shows it archived or the cap since its record passed; otherwise (idle, completed between runs) it is kept, uncounted. */
export function checkerRecord(where: Where, recordedAt: string, now: Date): "counts" | "kept" | "drop" {
  if (where.status === "running") {
    return "counts";
  }
  const at = Date.parse(recordedAt);
  return where.status === "archived" || (!Number.isNaN(at) && now.getTime() - at >= CHECKER_CAP_MS) ? "drop" : "kept";
}

/** One thread as T3 shows it; null when T3 doesn't know it or can't be asked. The id reaches the runner as given. */
export async function showThread(run: T3Runner, root: string, id: string): Promise<Where | null> {
  const r = await run(root, ["thread", "show", id, "--json"]);
  if (r.error !== undefined || r.status !== 0) {
    return null;
  }
  try {
    const top = obj(JSON.parse(r.stdout));
    const t = obj(top?.["thread"]) ?? top ?? {};
    const pending = t["pendingRequestCount"];
    return {
      status: statusOf(t),
      worktreePath: str(t["worktreePath"]),
      branch: str(t["branch"]),
      pending: typeof pending === "number" ? pending : 0,
      relationshipToParent: str(t["relationshipToParent"]),
      parent: str(t["parentThreadId"]),
      provider: str(t["providerInstanceId"]),
      link: str(t["link"]),
    };
  } catch {
    return null;
  }
}

/** How often a recorded subagent seen finished is asked again. Under the board's ten-minute stall clock: a child messaged without a new record shows running before its item reads stalled. Docs: board.md. */
export const FINISHED_RECHECK_MS = 5 * 60_000;
/** The most finished records one read asks again for age alone, the longest unasked first: those seen finished together don't all come due in one read. */
export const FINISHED_RECHECKS = 6;
const FINISHED = new Set(["done", "completed", "failed", "archived"]);
/** The recorded threads seen finished, by thread id: the record's time then and when T3 was last asked. Kept by the process only. */
const finished = new Map<string, { readonly at: string; readonly asked: number }>();

/**
 * The records to ask T3 about now: all but those seen finished, unless the record's time moved, `thread list` shows the thread running
 * again, or the re-check is due.
 */
function toShow(records: readonly ReviewRecord[], states: ReadonlyMap<string, string>, now: number): ReviewRecord[] {
  const changed: ReviewRecord[] = [];
  const due: { readonly r: ReviewRecord; readonly asked: number }[] = [];
  for (const r of records) {
    const seen = finished.get(r.thread);
    if (seen === undefined || seen.at !== r.at || states.get(r.thread) === "running") {
      changed.push(r);
    } else if (now - seen.asked >= FINISHED_RECHECK_MS) {
      due.push({ r, asked: seen.asked });
    }
  }
  return [...changed, ...due.sort((a, b) => a.asked - b.asked).slice(0, FINISHED_RECHECKS).map((d) => d.r)];
}

/** Keeps or forgets what T3 said of a record. No answer says nothing new: a remembered one waits for its next re-check. */
function remember(r: ReviewRecord, where: Where | null, now: number): void {
  const seen = finished.get(r.thread);
  if (where === null) {
    if (seen !== undefined) {
      finished.set(r.thread, { at: seen.at, asked: now });
    }
  } else if (FINISHED.has(where.status?.toLowerCase() ?? "")) {
    finished.set(r.thread, { at: r.at, asked: now });
  } else {
    finished.delete(r.thread);
  }
}

/**
 * Why a checkout isn't a child's own: T3 gives its folder or branch to the thread that delegated the child too (a `shared` child).
 * Null when it doesn't, when the child has no parent, or when T3 can't show the parent.
 */
export async function parentsCheckout(run: T3Runner, root: string, parent: string | null, folder: string, branch: string | null): Promise<string | null> {
  const p = parent === null ? null : await showThread(run, root, parent);
  const same = (p?.worktreePath != null && normPath(p.worktreePath) === normPath(folder)) || (branch !== null && p?.branch === branch);
  return same ? `its parent thread ${parent} has the same checkout or branch` : null;
}

/** Runs `work` over `items`, a few at a time. */
async function pool<T, R>(items: readonly T[], work: (item: T) => Promise<R>, size = 6): Promise<R[]> {
  const out: R[] = new Array<R>(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await work(items[i] as T);
      }
    }),
  );
  return out;
}

export interface T3Options {
  readonly run?: T3Runner;
  /** The folder holding the worktrees braid created (`<worktrees>/<repo>`); derived from the repository when not given. */
  readonly agents?: string | readonly string[];
  /** The T3 project folder; the main checkout when not given. */
  readonly project?: string;
  /** The recorded review threads; read from `.braid/reviews.json` of the main checkout when not given. */
  readonly reviews?: readonly ReviewRecord[];
  /** The clock for the checker cap; now when not given. */
  readonly now?: Date;
}

/**
 * Reads the threads of running agents, and the idle (not running, not archived) ones the board only opens. Any failure, including T3 not running, gives
 * `unavailable` with the reason, never an error.
 */
export function readT3(root: string, options: T3Options = {}): Promise<T3> {
  return readFresh(root, options.run ?? runT3, options.agents ?? agentsDirs(root), options.project ?? mainCheckout(root), options.reviews ?? loadReviews(root), options.now ?? new Date());
}

/** T3's statuses of a thread whose turn is under way: `running`, or `waiting` (its turn waits on a background task it awaits). */
const BUSY = new Set(["running", "waiting"]);

/**
 * Whether a thread works: T3 says `running` or `waiting`, or it has background work pending (a background command or a subagent:
 * `pendingBackgroundTasks`), or it is blocked on a thread wait (`blockedOnThreadWait`). T3 shows such a thread `completed` or
 * `waiting` between turns, yet it is working (0075/G). The one rule for "running" wherever the board decides it.
 */
export function working(t: Json): boolean {
  const tasks = t["pendingBackgroundTasks"];
  return BUSY.has(str(t["status"])?.toLowerCase() ?? "") || (Array.isArray(tasks) && tasks.length > 0) || t["blockedOnThreadWait"] === true;
}

/** A thread's status as the board reads it: `archived` for an archived one, `running` for one that works (`working`), else T3's status. */
function statusOf(t: Json): string | null {
  return archived(t) ? "archived" : working(t) ? "running" : str(t["status"]);
}

/** A thread T3 marks archived (`archived: true`, an `archivedAt` time, or the status `archived`): it gets no button. */
function archived(t: Json): boolean {
  return t["archived"] === true || (t["archivedAt"] !== undefined && t["archivedAt"] !== null) || t["status"] === "archived";
}

async function readFresh(root: string, run: T3Runner, agents: string | readonly string[], project: string, reviews: readonly ReviewRecord[], now: Date): Promise<T3> {
  const down = (reason: string): T3 => ({ status: { state: "unavailable", reason }, threads: new Map() });
  const listed = await run(root, ["thread", "list", "--project", project, "--json"]);
  if (listed.error !== undefined) {
    return down(callFailure("T3", "t3", listed.error));
  }
  if (listed.status !== 0) {
    const first = listed.stderr.trim().split("\n")[0] ?? "";
    return down(first === "" ? "T3 is not running" : `T3 is not running (${first})`);
  }
  let raw: unknown;
  try {
    raw = JSON.parse(listed.stdout);
  } catch {
    return down("t3 gave unreadable output");
  }
  const all = Array.isArray(raw) ? raw : (obj(raw)?.["threads"] ?? []);
  const named = (Array.isArray(all) ? all : []).map(obj).filter((t): t is Json => t !== null);
  const states = new Map<string, string>();
  const links = new Map<string, string>();
  const providers = new Map<string, string>();
  for (const t of named) {
    const id = str(t["threadId"]) ?? str(t["id"]);
    if (id !== null) {
      const link = str(t["link"]);
      if (link !== null) {
        links.set(id, link);
      }
      states.set(id, (statusOf(t) ?? "unknown").toLowerCase());
      const provider = str(t["providerInstanceId"]);
      if (provider !== null) {
        providers.set(id, provider);
      }
    }
  }
  const wanted = named
    .filter((t) => !archived(t))
    .map((t) => ({ t, id: str(t["threadId"]) ?? str(t["id"]) }))
    .filter((x): x is { t: Json; id: string } => x.id !== null)
    .map((x) => ({ ...x, running: working(x.t) }));

  const mine = (typeof agents === "string" ? [agents] : agents).map(norm);
  // Only a worker's worktree directly inside the braid worktree folder, named for an item, is an agent's; a leftover `-review` checkout is no one's.
  const ownerOf = (path: string | null) => {
    const folder = path === null ? null : norm(path);
    const dir = folder === null ? undefined : mine.find((m) => folder.startsWith(`${m}/`));
    return path !== null && folder !== null && dir !== undefined && !folder.slice(dir.length + 1).includes("/") ? itemOfFolder(basename(resolve(path))) : null;
  };
  const repos = new Set([titleRepoName(root), repoNameOf(root) ?? basename(root)]);
  // The title of a braid thread of this repository (`<emoji> <repo> <id> <role>: <title>`); other titles are no braid thread's.
  const titled = (t: Json) => {
    const p = parseThreadTitle(str(t["title"]) ?? "");
    return p !== null && repos.has(p.repo) ? p : null;
  };
  const ideaThreads = new Map<string, T3Coordinator>();
  const occupied: { id: string; folder: string | null; branch: string | null }[] = [];
  // Running threads are shown (`t3 thread show`: worktree and pending questions). An idle thread is placed by its worker title alone.
  const found = await pool(wanted, async ({ t, id, running }) => {
    let where: Where | null = null;
    let key: string | null = null;
    if (running) {
      where = await showThread(run, root, id);
      // A steering thread (0064) belongs to no item, wherever it runs.
      key = parseSteeringTitle(str(t["title"]) ?? "") !== null ? null : (ownerOf(where?.worktreePath ?? null)?.key ?? null);
    } else {
      const p = titled(t);
      key = p !== null && p.role === "worker" ? p.id : null;
    }
    if (running) {
      const branch = where?.branch ?? null;
      occupied.push({ id, folder: where?.worktreePath ?? str(t["worktreePath"]), branch: branch ?? str(t["branch"]) });
      if (branch !== null && branch.startsWith(IDEA_BRANCH) && !ideaThreads.has(branch)) {
        ideaThreads.set(branch, { id, link: str(t["link"]), provider: str(t["providerInstanceId"]), model: str(t["model"]) });
      }
    }
    return key === null ? null : { key, running, thread: { id, role: "worker", pending: where?.pending ?? 0, link: str(t["link"]), title: str(t["title"]) ?? undefined, provider: str(t["providerInstanceId"]) ?? where?.provider ?? null } satisfies T3Thread };
  });
  // A recorded child thread is its item's reviewer (or its worker or researcher, by the record's role) while T3 says it runs; one that has ended, or that T3 doesn't know, counts for nothing.
  // One seen finished is skipped (`toShow`): a read's calls don't grow with the records a project has gathered.
  const reviewing = await pool(toShow(reviews.filter((r) => !r.id.startsWith("pm/")), states, now.getTime()), async (r) => {
    const where = await showThread(run, root, r.thread);
    remember(r, where, now.getTime());
    if (where?.status !== "running") {
      return null;
    }
    occupied.push({ id: r.thread, folder: where.worktreePath, branch: where.branch });
    const role = ({ worker: "worker", review: "reviewer", research: "researcher" } as const)[childRole(r)];
    return { key: r.id, running: true, thread: { id: r.thread, role, pending: where.pending, link: where.link, provider: where.provider } satisfies T3Thread };
  });
  const coordinators = new Map<string, T3Coordinator>();
  const idleCoordinators = new Map<string, T3Coordinator>();
  for (const { t, id, running } of wanted) {
    const p = titled(t);
    const number = p?.role === "coordinator" && !p.id.includes("/") ? p.id : undefined;
    const into = running ? coordinators : idleCoordinators;
    if (number !== undefined && !into.has(number)) {
      into.set(number, { id, link: str(t["link"]), provider: str(t["providerInstanceId"]), model: str(t["model"]) });
    }
  }
  const threads = new Map<string, T3Thread[]>();
  const idle = new Map<string, T3Thread[]>();
  for (const f of [...found, ...reviewing]) {
    if (f !== null) {
      const into = f.running ? threads : idle;
      into.set(f.key, [...(into.get(f.key) ?? []), f.thread]);
    }
  }
  const listedChecks = wanted.flatMap(({ t, running }) => {
    const m = /^(?:[^\x00-\x7F]+\s+)?(\S+) pm check: (.*)$/.exec(str(t["title"]) ?? "");
    return running && m !== null && repos.has(m[1] ?? "") ? [m[2] ?? ""] : [];
  });
  // A PM's checker is a subagent, which `thread list` leaves out: the PM records it (`braid review pm/<slug> --thread <id>`), and it checks while T3 says it runs (0071/C, 2h98).
  // Each run of it is a task the PM starts and T3 shows it `completed` between runs, so the record is kept (uncounted) until the thread is archived or 24 h pass since the record (0075/A, fwoa).
  const ended: string[] = [];
  const recordedChecks = await pool(reviews.filter((r) => r.id.startsWith("pm/")), async (r) => {
    const where = await showThread(run, root, r.thread);
    const what = where === null ? "kept" : checkerRecord(where, r.at, now);
    if (what === "counts") {
      return [r.id];
    }
    if (what === "drop" && where !== null) {
      ended.push(r.thread);
    }
    return [];
  });
  if (ended.length > 0) {
    try {
      dropEndedChecks(root, ended);
    } catch {
      // A record that can't be rewritten now is dropped at a later refresh.
    }
  }
  const pmChecks = [...listedChecks, ...recordedChecks.flat()];
  return { status: { state: "ok" }, threads, coordinators, idle, idleCoordinators, ideaThreads, states, links, providers, pmChecks, occupied };
}
