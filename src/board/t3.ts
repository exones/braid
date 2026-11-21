// What T3 knows about the agents: one `t3 thread list --json` per refresh, plus `show --json` for
// each running thread and each recorded review thread; an idle thread is placed by its worker title. An agent of an item is a
// running thread whose worktree braid created for it (`braid start`, the worker), or a running thread recorded with `braid review`
// (the reviewer, a coordinator's subagent, which `thread list` doesn't show); any other thread, a coordinator's included, is not an
// agent of any item.
import { execFile, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { basename, join, resolve } from "node:path";
import { loadReviews, type ReviewRecord } from "../braids/reviews.js";
import { parseThreadTitle, titleRepoName } from "../braids/title.js";
import { itemOfFolder, repoNameOf } from "../braids/worktrees.js";
import { agentsDirs } from "../braids/worktree-folders.js";

export interface T3Thread {
  readonly id: string;
  /** `worker` in the item's own worktree, `reviewer` for a running thread recorded with `braid review`. */
  readonly role: "worker" | "reviewer";
  /** Questions and approvals the agent waits on. */
  readonly pending: number;
  /** The T3 link to open; null for a subagent reviewer, which shows inside its coordinator's thread. */
  readonly link: string | null;
  /** The thread's title, when T3 lists one. */
  readonly title?: string | undefined;
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
      { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, timeout: 30_000, windowsHide: true, windowsVerbatimArguments: win },
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

/** The main checkout: the first entry of `git worktree list`, which T3 knows as the project. */
export function mainCheckout(root: string): string {
  const r = spawnSync("git", ["worktree", "list", "--porcelain"], { cwd: root, encoding: "utf8" });
  const first = r.status === 0 ? r.stdout.split("\n").find((l) => l.startsWith("worktree ")) : undefined;
  return first === undefined ? root : first.slice(9).trim();
}

/** What `t3 thread show <id> --json` says of a thread. */
export interface Where {
  readonly status: string | null;
  readonly worktreePath: string | null;
  readonly branch: string | null;
  readonly pending: number;
  /** `subagent` for a delegated task's child thread; null for a top-level thread. */
  readonly relationshipToParent: string | null;
}

const recent = new Map<string, { at: number; t3: Promise<T3> }>();
const SHARE_MS = 3000;

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
      status: str(t["status"]),
      worktreePath: str(t["worktreePath"]),
      branch: str(t["branch"]),
      pending: typeof pending === "number" ? pending : 0,
      relationshipToParent: str(t["relationshipToParent"]),
    };
  } catch {
    return null;
  }
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
  readonly ttlMs?: number;
  /** The recorded review threads; read from `.braid/reviews.json` of the main checkout when not given. */
  readonly reviews?: readonly ReviewRecord[];
}

/**
 * Reads the threads of running agents, and the idle (not running, not archived) ones the board only opens. Any failure, including T3 not running, gives
 * `unavailable` with the reason, never an error.
 */
export function readT3(root: string, options: T3Options = {}): Promise<T3> {
  const ttl = options.ttlMs ?? SHARE_MS;
  const shared = recent.get(root);
  if (shared !== undefined && Date.now() - shared.at < ttl) {
    return shared.t3;
  }
  const t3 = readFresh(root, options.run ?? runT3, options.agents ?? agentsDirs(root), options.project ?? mainCheckout(root), options.reviews ?? loadReviews(root));
  recent.set(root, { at: Date.now(), t3 });
  return t3;
}

/** A thread T3 marks archived (`archived: true`, an `archivedAt` time, or the status `archived`): it gets no button. */
function archived(t: Json): boolean {
  return t["archived"] === true || (t["archivedAt"] !== undefined && t["archivedAt"] !== null) || t["status"] === "archived";
}

async function readFresh(root: string, run: T3Runner, agents: string | readonly string[], project: string, reviews: readonly ReviewRecord[]): Promise<T3> {
  const down = (reason: string): T3 => ({ status: { state: "unavailable", reason }, threads: new Map() });
  const listed = await run(root, ["thread", "list", "--project", project, "--json"]);
  if (listed.error !== undefined) {
    return down("t3 is not installed or not on PATH");
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
  const wanted = (Array.isArray(all) ? all : [])
    .map(obj)
    .filter((t): t is Json => t !== null)
    .filter((t) => !archived(t))
    .map((t) => ({ t, id: str(t["threadId"]) ?? str(t["id"]), status: str(t["status"]) }))
    .filter((x): x is { t: Json; id: string; status: string } => x.id !== null)
    .map((x) => ({ ...x, running: x.status === "running" }));

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
  // Running threads are shown (`t3 thread show`: worktree and pending questions). An idle thread is placed by its worker title alone.
  const found = await pool(wanted, async ({ t, id, running }) => {
    let where: Where | null = null;
    let key: string | null = null;
    if (running) {
      where = await showThread(run, root, id);
      key = ownerOf(where?.worktreePath ?? null)?.key ?? null;
    } else {
      const p = titled(t);
      key = p !== null && p.role === "worker" ? p.id : null;
    }
    if (running) {
      const branch = where?.branch ?? null;
      if (branch !== null && branch.startsWith(IDEA_BRANCH) && !ideaThreads.has(branch)) {
        ideaThreads.set(branch, { id, link: str(t["link"]), provider: str(t["providerInstanceId"]), model: str(t["model"]) });
      }
    }
    return key === null ? null : { key, running, thread: { id, role: "worker", pending: where?.pending ?? 0, link: str(t["link"]), title: str(t["title"]) ?? undefined } satisfies T3Thread };
  });
  // A recorded review thread is its item's reviewer while T3 says it runs; one that has ended, or that T3 doesn't know, counts for nothing.
  const reviewing = await pool(reviews, async (r) => {
    const where = await showThread(run, root, r.thread);
    return where?.status === "running" ? { key: r.id, running: true, thread: { id: r.thread, role: "reviewer", pending: where.pending, link: null } satisfies T3Thread } : null;
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
  return { status: { state: "ok" }, threads, coordinators, idle, idleCoordinators, ideaThreads };
}

/** Forgets what was read, for tests. */
export function resetT3Memory(): void {
  recent.clear();
}
