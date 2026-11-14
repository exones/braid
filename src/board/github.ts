// What GitHub knows about braid and strand branches: one `gh pr list` call per refresh.
// A PR belongs to a braid or strand by its head branch (`braid/0006-<slug>`, `braid/0006/A-<slug>`).
import { spawnSync } from "node:child_process";
import { BRAID_BRANCH, STRAND_BRANCH } from "../braids/branches.js";

export type Checks = "passing" | "failing" | "pending" | "none";

export interface PullRequest {
  readonly number: number;
  readonly url: string;
  readonly state: "open" | "merged";
  readonly checks: Checks;
  /** Names of the failing checks, when GitHub gave them. */
  readonly failed?: readonly string[];
}

export type GithubState =
  | { readonly state: "ok" }
  | { readonly state: "unavailable"; readonly reason: string };

export interface Github {
  readonly status: GithubState;
  /** The PR to show per item key (`0006` or `0006/A`): the open one, else the newest merged one. */
  readonly prs: ReadonlyMap<string, PullRequest>;
}

export const NO_GITHUB: Github = { status: { state: "unavailable", reason: "GitHub was not read" }, prs: new Map() };

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

interface RawPr {
  readonly number: number;
  readonly url: string;
  readonly state: string;
  readonly headRefName: string;
  readonly mergedAt?: string | null;
  readonly statusCheckRollup?: readonly { readonly name?: string | null; readonly context?: string | null; readonly conclusion?: string | null; readonly state?: string | null; readonly status?: string | null }[] | null;
}

const FAILED = new Set(["FAILURE", "TIMED_OUT", "STARTUP_FAILURE", "ERROR"]);

/** Names of the failing checks in a rollup. */
export function failedChecks(rollup: RawPr["statusCheckRollup"]): string[] {
  return (rollup ?? [])
    .filter((c) => FAILED.has((c.conclusion ?? c.state ?? "").toUpperCase()))
    .map((c) => c.name ?? c.context ?? "")
    .filter((n) => n !== "");
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

const FIELDS = "number,url,state,headRefName,mergedAt,statusCheckRollup";

// Merged PRs never change, so they are kept for the life of the process, per repository folder.
interface Memory {
  readonly merged: Map<number, RawPr>;
  open: Set<number>;
}
// One page view asks for the board and an item; they share one read made within this many ms.
const SHARE_MS = 3000;
const recent = new Map<string, { at: number; github: Github }>();
const memory = new Map<string, Memory>();

function list(run: GhRunner, root: string, state: "open" | "all"): RawPr[] | string {
  const r = run(root, ["pr", "list", "--state", state, "--limit", "500", "--json", FIELDS]);
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
  if (shared !== undefined && Date.now() - shared.at < ttlMs) {
    return shared.github;
  }
  const github = readFresh(root, run);
  recent.set(root, { at: Date.now(), github });
  return github;
}

function readFresh(root: string, run: GhRunner): Github {
  const mem = memory.get(root) ?? { merged: new Map<number, RawPr>(), open: new Set<number>() };
  let fetched = list(run, root, mem.merged.size === 0 && mem.open.size === 0 ? "all" : "open");
  if (typeof fetched !== "string") {
    const still = new Set(fetched.filter((p) => p.state === "OPEN").map((p) => p.number));
    if ([...mem.open].some((n) => !still.has(n))) {
      fetched = list(run, root, "all");
    }
  }
  if (typeof fetched === "string") {
    return { status: { state: "unavailable", reason: fetched }, prs: new Map() };
  }
  mem.open = new Set(fetched.filter((p) => p.state === "OPEN").map((p) => p.number));
  for (const p of fetched) {
    if (p.state === "MERGED") {
      mem.merged.set(p.number, p);
    }
  }
  memory.set(root, mem);

  const prs = new Map<string, PullRequest>();
  const merged = [...mem.merged.values()].sort((a, b) => a.number - b.number);
  const open = fetched.filter((p) => p.state === "OPEN");
  // Merged ones first, so a later (higher-numbered) one wins; an open PR wins over all of them.
  for (const [raw, state] of [...merged.map((p) => [p, "merged"] as const), ...open.map((p) => [p, "open"] as const)]) {
    const key = keyOfBranch(raw.headRefName);
    if (key !== null) {
      prs.set(key, { number: raw.number, url: raw.url, state, checks: state === "open" ? checksOf(raw.statusCheckRollup) : "passing", ...(state === "open" ? { failed: failedChecks(raw.statusCheckRollup) } : {}) });
    }
  }
  return { status: { state: "ok" }, prs };
}

/** Forgets what was read, for tests. */
export function resetGithubMemory(): void {
  memory.clear();
  recent.clear();
}
