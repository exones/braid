// What GitHub knows about braid and strand branches: one `gh pr list` call per refresh.
// A PR belongs to a braid or strand by its head branch (`braid/0006-<slug>`, `braid/0006/A-<slug>`).
import { execFile, spawnSync } from "node:child_process";
import { BRAID_BRANCH, STRAND_BRANCH } from "../braids/branches.js";

export type Checks = "passing" | "failing" | "pending" | "none";

export interface PullRequest {
  readonly number: number;
  readonly url: string;
  readonly state: "open" | "merged" | "closed";
  readonly checks: Checks;
  /** The head commit (full sha), when GitHub gave it; a review request is void when it moves. */
  readonly head?: string;
  /** The branch it merges into, when GitHub gave it. */
  readonly base?: string;
  /** The branch it comes from. */
  readonly branch?: string;
  /** Names of the failing checks, when GitHub gave them. */
  readonly failed?: readonly string[];
  /** Each check by name with its own result, for an open PR. */
  readonly runs?: readonly { readonly name: string; readonly result: "passing" | "failing" | "pending" }[];
}

export type GithubState =
  | { readonly state: "ok" }
  | { readonly state: "unavailable"; readonly reason: string };

export interface Github {
  readonly status: GithubState;
  /** The PR to show per item key (`0006` or `0006/A`): the open one, else the newest merged one, else the newest closed (unmerged) one. */
  readonly prs: ReadonlyMap<string, PullRequest>;
  /** Merged PRs of planning branches (`plan/<slug>`), by head branch: the PR number. `braid clean` removes those branches. */
  readonly plans?: ReadonlyMap<string, number>;
  /** Open planning PRs (head `plan/<slug>`, base `braid/<number>-<slug>`) by the braid number of the base. Never the braid's own PR, so they are not in `prs`. */
  readonly planning?: ReadonlyMap<string, PullRequest>;
}

export interface GhResult {
  readonly status: number | null;
  readonly stdout: string;
  readonly stderr: string;
  readonly error?: Error | undefined;
}

/** Runs `gh` with these arguments in `root`; replaced in tests. */
export type GhRunner = (root: string, args: readonly string[]) => GhResult;

export const runGh: GhRunner = (root, args) => {
  const r = spawnSync("gh", args, { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, timeout: 30_000 });
  return { status: r.status, stdout: r.stdout, stderr: r.stderr, error: r.error };
};

/** Like `GhRunner`, and the board's runner may answer later: the server keeps serving while `gh` runs. */
export type GhRunnerAsync = (root: string, args: readonly string[]) => GhResult | Promise<GhResult>;

export const runGhAsync: GhRunnerAsync = (root, args) =>
  new Promise((done) => {
    execFile("gh", [...args], { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, timeout: 30_000, windowsHide: true }, (error, stdout, stderr) => {
      const code = error !== null && typeof (error as { code?: unknown }).code === "number" ? (error as { code: number }).code : error === null ? 0 : null;
      done({ status: code, stdout, stderr, error: error !== null && code === null ? error : undefined });
    });
  });

interface RawPr {
  readonly number: number;
  readonly url: string;
  readonly state: string;
  readonly headRefName: string;
  readonly headRefOid?: string;
  readonly baseRefName?: string;
  readonly mergedAt?: string | null;
  readonly statusCheckRollup?: readonly { readonly name?: string | null; readonly context?: string | null; readonly conclusion?: string | null; readonly state?: string | null; readonly status?: string | null }[] | null;
}

const PENDING = new Set(["", "PENDING", "EXPECTED"]);
/** The only finished results that count as green, as `braid wait` reads them; CANCELLED, ACTION_REQUIRED, STALE and the rest do not. */
const PASSED = new Set(["SUCCESS", "NEUTRAL", "SKIPPED"]);
const FAILED = { has: (result: string) => !PENDING.has(result) && !PASSED.has(result) };

/** Names of the failing checks in a rollup. */
export function failedChecks(rollup: RawPr["statusCheckRollup"]): string[] {
  return (rollup ?? [])
    .filter((c) => FAILED.has((c.conclusion ?? c.state ?? "").toUpperCase()))
    .map((c) => c.name ?? c.context ?? "")
    .filter((n) => n !== "");
}

/** Each named check of a rollup with its own result. */
export function runsOf(rollup: RawPr["statusCheckRollup"]): NonNullable<PullRequest["runs"]> {
  return (rollup ?? [])
    .map((c) => {
      const result = (c.conclusion ?? c.state ?? "").toUpperCase();
      const own = FAILED.has(result)
        ? ("failing" as const)
        : result === "" || result === "PENDING" || result === "EXPECTED" || (c.status ?? "COMPLETED").toUpperCase() !== "COMPLETED"
          ? ("pending" as const)
          : ("passing" as const);
      return { name: c.name ?? c.context ?? "", result: own };
    })
    .filter((c) => c.name !== "");
}

export function checksOf(rollup: RawPr["statusCheckRollup"]): Checks {
  if (rollup === null || rollup === undefined || rollup.length === 0) {
    return "none";
  }
  let pending = false;
  for (const c of rollup) {
    const result = (c.conclusion ?? c.state ?? "").toUpperCase();
    if (FAILED.has(result)) {
      return "failing";
    }
    if (result === "" || result === "PENDING" || result === "EXPECTED" || (c.status ?? "COMPLETED").toUpperCase() !== "COMPLETED") {
      pending = true;
    }
  }
  return pending ? "pending" : "passing";
}

/** `0006` for a braid branch, `0006/A` for a strand branch, null for any other branch. */
export function keyOfBranch(branch: string): string | null {
  const strand = STRAND_BRANCH.exec(branch);
  if (strand) {
    return `${strand[1] ?? ""}/${strand[2] ?? ""}`;
  }
  return BRAID_BRANCH.exec(branch)?.[1] ?? null;
}

const FIELDS = "number,url,state,headRefName,headRefOid,baseRefName,mergedAt,statusCheckRollup";

// Merged PRs never change (closed ones rarely do), so they are kept for the life of the process, per repository folder.
interface Memory {
  readonly merged: Map<number, RawPr>;
  /** Closed without merging; a PR can reopen, so one that shows up open is dropped from here. */
  readonly closed: Map<number, RawPr>;
  open: Set<number>;
}
// One page view asks for the board and an item; they share one read made within this many ms.
const SHARE_MS = 3000;
let clock: () => number = Date.now;
/** Tests pass a fixed clock so the sharing window doesn't depend on how long a test takes; no argument restores the real one. */
export function setGithubClock(now: () => number = Date.now): void {
  clock = now;
}
const recent = new Map<string, { at: number; github: Github }>();
const memory = new Map<string, Memory>();

const listArgs = (state: "open" | "all"): string[] => ["pr", "list", "--state", state, "--limit", "500", "--json", FIELDS];

function list(run: GhRunner, root: string, state: "open" | "all"): RawPr[] | string {
  return parsed(run(root, listArgs(state)));
}

function parsed(r: GhResult): RawPr[] | string {
  if (r.error !== undefined) {
    return "gh is not installed or not on PATH";
  }
  if (r.status !== 0) {
    if (/gh auth login|not logged in/i.test(r.stderr)) {
      return "gh is not logged in; run gh auth login";
    }
    const first = r.stderr.trim().split("\n")[0] ?? "";
    return `gh failed${first === "" ? "" : `: ${first}`}`;
  }
  try {
    return JSON.parse(r.stdout) as RawPr[];
  } catch {
    return "gh gave unreadable output";
  }
}

/**
 * Reads the PRs of braid and strand branches. The first call lists every PR; later calls list only
 * the open ones, unless one that was open has gone (it merged or closed), then every PR again.
 * Any failure gives `unavailable` with the reason, never an error.
 */
export function readGithub(root: string, run: GhRunner = runGh, ttlMs: number = SHARE_MS): Github {
  const shared = recent.get(root);
  if (shared !== undefined && clock() - shared.at < ttlMs) {
    return shared.github;
  }
  const github = readFresh(root, run);
  recent.set(root, { at: clock(), github });
  return github;
}

/** Same as `readGithub`, with `gh` run without blocking the process. */
export async function readGithubAsync(root: string, run: GhRunnerAsync = runGhAsync, ttlMs: number = SHARE_MS): Promise<Github> {
  const shared = recent.get(root);
  if (shared !== undefined && clock() - shared.at < ttlMs) {
    return shared.github;
  }
  const mem = memoryOf(root);
  let fetched = parsed(await run(root, listArgs(firstRead(mem) ? "all" : "open")));
  if (typeof fetched !== "string" && vanished(mem, fetched)) {
    fetched = parsed(await run(root, listArgs("all")));
  }
  const github = assemble(root, mem, fetched);
  recent.set(root, { at: clock(), github });
  return github;
}

const memoryOf = (root: string): Memory => memory.get(root) ?? { merged: new Map<number, RawPr>(), closed: new Map<number, RawPr>(), open: new Set<number>() };
const firstRead = (mem: Memory): boolean => mem.merged.size === 0 && mem.closed.size === 0 && mem.open.size === 0;
/** An open PR seen before is gone from the open list: it merged or closed, so every PR is listed again. */
const vanished = (mem: Memory, fetched: readonly RawPr[]): boolean => {
  const still = new Set(fetched.filter((p) => p.state === "OPEN").map((p) => p.number));
  return [...mem.open].some((n) => !still.has(n));
};

function readFresh(root: string, run: GhRunner): Github {
  const mem = memoryOf(root);
  let fetched = list(run, root, firstRead(mem) ? "all" : "open");
  if (typeof fetched !== "string" && vanished(mem, fetched)) {
    fetched = list(run, root, "all");
  }
  return assemble(root, mem, fetched);
}

function assemble(root: string, mem: Memory, fetched: RawPr[] | string): Github {
  if (typeof fetched === "string") {
    return { status: { state: "unavailable", reason: fetched }, prs: new Map() };
  }
  mem.open = new Set(fetched.filter((p) => p.state === "OPEN").map((p) => p.number));
  for (const p of fetched) {
    if (p.state === "MERGED") {
      mem.merged.set(p.number, p);
      mem.closed.delete(p.number);
    } else if (p.state === "CLOSED") {
      mem.closed.set(p.number, p);
    } else {
      mem.closed.delete(p.number);
    }
  }
  memory.set(root, mem);

  const prs = new Map<string, PullRequest>();
  const merged = [...mem.merged.values()].sort((a, b) => a.number - b.number);
  const closed = [...mem.closed.values()].sort((a, b) => a.number - b.number);
  const open = fetched.filter((p) => p.state === "OPEN");
  // Closed ones first, then merged, so a later (higher-numbered) one wins within a kind; an open PR wins over all of them.
  for (const [raw, state] of [...closed.map((p) => [p, "closed"] as const), ...merged.map((p) => [p, "merged"] as const), ...open.map((p) => [p, "open"] as const)]) {
    const key = keyOfBranch(raw.headRefName);
    if (key !== null) {
      prs.set(key, { number: raw.number, url: raw.url, state, ...(raw.headRefOid === undefined ? {} : { head: raw.headRefOid }), ...(raw.baseRefName === undefined ? {} : { base: raw.baseRefName }), branch: raw.headRefName, checks: state === "open" ? checksOf(raw.statusCheckRollup) : state === "merged" ? "passing" : "none", ...(state === "open" ? { failed: failedChecks(raw.statusCheckRollup), runs: runsOf(raw.statusCheckRollup) } : {}) });
    }
  }
  const plans = new Map<string, number>();
  for (const p of merged) {
    if (p.headRefName.startsWith("plan/") && !open.some((o) => o.headRefName === p.headRefName)) {
      plans.set(p.headRefName, p.number);
    }
  }
  const planning = new Map<string, PullRequest>();
  for (const raw of open) {
    const number = raw.headRefName.startsWith("plan/") && raw.baseRefName !== undefined ? BRAID_BRANCH.exec(raw.baseRefName)?.[1] : undefined;
    if (number !== undefined && !planning.has(number)) {
      planning.set(number, { number: raw.number, url: raw.url, state: "open", ...(raw.headRefOid === undefined ? {} : { head: raw.headRefOid }), base: raw.baseRefName ?? "", branch: raw.headRefName, checks: checksOf(raw.statusCheckRollup), failed: failedChecks(raw.statusCheckRollup), runs: runsOf(raw.statusCheckRollup) });
    }
  }
  return { status: { state: "ok" }, prs, plans, planning };
}

/** Forgets what was read, for tests. */
export function resetGithubMemory(): void {
  memory.clear();
  recent.clear();
}
