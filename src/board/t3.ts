// What T3 knows about the agents: one `t3 thread list --json` per refresh, plus `show --json` for
// threads that need it. A thread belongs to a braid or strand by its linked PR, else by its worktree.
import { execFile, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { keyOfBranch, type Github } from "./github.js";

export interface T3Thread {
  readonly id: string;
  /** `running`, or `stopped` for an interrupted or cancelled thread. */
  readonly state: "running" | "stopped";
  /** Questions and approvals the agent waits on. */
  readonly pending: number;
  readonly link: string | null;
}

export type T3State =
  | { readonly state: "ok" }
  | { readonly state: "unavailable"; readonly reason: string };

export interface T3 {
  readonly status: T3State;
  /** Threads per item key (`0006` or `0006/A`). */
  readonly threads: ReadonlyMap<string, readonly T3Thread[]>;
}

export const NO_T3: T3 = { status: { state: "unavailable", reason: "T3 was not read" }, threads: new Map() };

export interface T3Result {
  readonly status: number | null;
  readonly stdout: string;
  readonly stderr: string;
  readonly error?: Error | undefined;
}

/** Runs `t3` with these arguments in `root`; replaced in tests. */
export type T3Runner = (root: string, args: readonly string[]) => Promise<T3Result>;

function t3Command(): string {
  const home = join(homedir(), ".t3", "bin", process.platform === "win32" ? "t3.cmd" : "t3");
  return existsSync(home) ? home : "t3";
}

export const runT3: T3Runner = (root, args) =>
  new Promise((done) => {
    const command = t3Command();
    // A .cmd file can only run through cmd.exe on Windows; the arguments are fixed words and ids.
    const win = process.platform === "win32";
    const quote = (s: string) => (/[^\w./:=@\\-]/.test(s) ? `"${s}"` : s);
    execFile(
      win ? "cmd.exe" : command,
      win ? ["/d", "/s", "/c", `"${[command, ...args].map(quote).join(" ")}"`] : [...args],
      { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, timeout: 30_000, windowsHide: true, windowsVerbatimArguments: win },
      (error, stdout, stderr) => {
        const code = error !== null && typeof (error as { code?: unknown }).code === "number" ? (error as { code: number }).code : error === null ? 0 : null;
        done({ status: code, stdout, stderr, error: error !== null && code === null ? error : undefined });
      },
    );
  });

type Json = Record<string, unknown>;
const obj = (v: unknown): Json | null => (typeof v === "object" && v !== null && !Array.isArray(v) ? (v as Json) : null);
const str = (v: unknown): string | null => (typeof v === "string" && v !== "" ? v : null);

interface PrRef {
  readonly number: number | null;
  readonly url: string | null;
  readonly branch: string | null;
}

function prRefs(thread: Json): PrRef[] {
  // A thread's own PR: the linked one, else the only one it lists. A coordinator lists many PRs
  // that are not its own, so a longer list says nothing about which strand the thread works on.
  const linked = thread["linkedPullRequest"];
  const listed = Array.isArray(thread["pullRequests"]) ? thread["pullRequests"] : [];
  const raw: unknown[] = linked !== null && linked !== undefined ? [linked] : listed.length === 1 ? listed : [];
  const refs: PrRef[] = [];
  for (const r of raw) {
    if (typeof r === "number") {
      refs.push({ number: r, url: null, branch: null });
    }
    const o = obj(r);
    if (o !== null) {
      const n = o["number"];
      refs.push({
        number: typeof n === "number" ? n : null,
        url: str(o["url"]),
        branch: str(o["headRefName"]) ?? str(o["headBranch"]) ?? str(o["branch"]),
      });
    }
  }
  return refs;
}

/** The key of the item a linked PR belongs to: by its head branch, else by GitHub's PR numbers. */
function joinByPr(thread: Json, github: Github): string | null {
  for (const ref of prRefs(thread)) {
    const byBranch = ref.branch === null ? null : keyOfBranch(ref.branch);
    if (byBranch !== null) {
      return byBranch;
    }
    for (const [key, pr] of github.prs) {
      if ((ref.number !== null && pr.number === ref.number) || (ref.url !== null && pr.url === ref.url)) {
        return key;
      }
    }
  }
  return null;
}

const norm = (p: string): string => resolve(p).replaceAll("\\", "/").toLowerCase();

/** Worktree path to its checked-out branch, from `git worktree list --porcelain`. */
export type Worktrees = (root: string) => Map<string, string>;

/** The main checkout: the first entry of `git worktree list`, which T3 knows as the project. */
export function mainCheckout(root: string): string {
  const r = spawnSync("git", ["worktree", "list", "--porcelain"], { cwd: root, encoding: "utf8" });
  const first = r.status === 0 ? r.stdout.split("\n").find((l) => l.startsWith("worktree ")) : undefined;
  return first === undefined ? root : first.slice(9).trim();
}

export const gitWorktrees: Worktrees = (root) => {
  const r = spawnSync("git", ["worktree", "list", "--porcelain"], { cwd: root, encoding: "utf8" });
  const out = new Map<string, string>();
  if (r.status !== 0) {
    return out;
  }
  let path: string | null = null;
  for (const line of r.stdout.split("\n").map((l) => l.trim())) {
    if (line.startsWith("worktree ")) {
      path = norm(line.slice(9));
    } else if (line.startsWith("branch ") && path !== null) {
      out.set(path, line.slice(7).replace(/^refs\/heads\//, ""));
    }
  }
  return out;
};

interface Where {
  readonly worktreePath: string | null;
  readonly branch: string | null;
  readonly pending: number;
}

// A worktree path never changes, so where a thread lives is read once per thread id.
const placed = new Map<string, Where>();
const recent = new Map<string, { at: number; t3: Promise<T3> }>();
const SHARE_MS = 3000;

async function show(run: T3Runner, root: string, id: string): Promise<Where | null> {
  const r = await run(root, ["thread", "show", id, "--json"]);
  if (r.error !== undefined || r.status !== 0) {
    return null;
  }
  try {
    const top = obj(JSON.parse(r.stdout));
    const t = obj(top?.["thread"]) ?? top ?? {};
    const pending = t["pendingRequestCount"];
    return { worktreePath: str(t["worktreePath"]), branch: str(t["branch"]), pending: typeof pending === "number" ? pending : 0 };
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
  readonly worktrees?: Worktrees;
  /** The T3 project folder; the main checkout when not given. */
  readonly project?: string;
  readonly ttlMs?: number;
}

/**
 * Reads the threads of running and stopped agents. Any failure, including T3 not running, gives
 * `unavailable` with the reason, never an error.
 */
export function readT3(root: string, github: Github, options: T3Options = {}): Promise<T3> {
  const ttl = options.ttlMs ?? SHARE_MS;
  const shared = recent.get(root);
  if (shared !== undefined && Date.now() - shared.at < ttl) {
    return shared.t3;
  }
  const t3 = readFresh(root, github, options.run ?? runT3, options.worktrees ?? gitWorktrees, options.project ?? mainCheckout(root));
  recent.set(root, { at: Date.now(), t3 });
  return t3;
}

async function readFresh(root: string, github: Github, run: T3Runner, worktrees: Worktrees, project: string): Promise<T3> {
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
    .map((t) => ({ t, id: str(t["threadId"]) ?? str(t["id"]), status: str(t["status"]) }))
    .filter((x): x is { t: Json; id: string; status: string } => x.id !== null && ["running", "interrupted", "cancelled"].includes(x.status ?? ""));

  const trees = worktrees(root);
  const found = await pool(wanted, async ({ t, id, status }) => {
    const running = status === "running";
    let key = joinByPr(t, github);
    // Show costs about a second: only for a running thread's pending questions, or an unjoined thread.
    let where: Where | null = placed.get(id) ?? null;
    if (running || (key === null && where === null)) {
      const fresh = await show(run, root, id);
      if (fresh !== null) {
        placed.set(id, fresh);
        where = fresh;
      }
    }
    if (key === null && where !== null) {
      const branch = where.worktreePath === null ? undefined : trees.get(norm(where.worktreePath));
      key = keyOfBranch(branch ?? where.branch ?? "");
    }
    // Stopped threads that have a PR are the PR's business; only an agent that left no PR waits.
    return key === null ? null : { key, thread: { id, state: running ? "running" : "stopped", pending: running ? (where?.pending ?? 0) : 0, link: str(t["link"]) } satisfies T3Thread };
  });
  const threads = new Map<string, T3Thread[]>();
  for (const f of found) {
    if (f !== null) {
      threads.set(f.key, [...(threads.get(f.key) ?? []), f.thread]);
    }
  }
  return { status: { state: "ok" }, threads };
}

/** Forgets what was read, for tests. */
export function resetT3Memory(): void {
  placed.clear();
  recent.clear();
}
