// `braid wait <number> [--timeout <minutes>]`: waits for the braid branch's CI after a merge the coordinator
// made itself, where no PR is left to watch (decision D71). It reads only: one fetch of the braid branch, then
// GitHub's check runs from the branch tip down to the newest commit that changes anything outside `braids/` and
// `epics/` (the CI commit). A project's CI may skip `braids/`-only pushes or not; every commit above the CI commit
// tests the same code, so a check is answered by the newest commit in that range that has a run for it; braid
// branches get no push CI, so when none has and the CI commit is a merge, its second parent answers. A run
// CANCELLED on a commit that has a newer commit above it (a newer push cancels older runs) stays pending, not failing,
// for the 5-minute start limit, since the newer commit may still start its run; after that, or when nothing is newer,
// it fails. The exit code is the answer:
// 0 green, 1 a `ci` check failed, 2 no answer (no run within 5 minutes, or an error), 3 still running when the
// time is up (call again). The coordinator calls it in one short read (--timeout 0.25) before the next strand's
// review or merge and before the final PR, and never waits on it in the foreground (decision D91).
import { braidBranches } from "../braids/branches.js";
import { loadBraids } from "../braids/store.js";
import { runGh, type GhRunner } from "../board/github.js";
import { UsageError } from "./braids.js";
import { ciChecks } from "./coordinate.js";
import { commitChecks, git } from "./done.js";
import { parse, str } from "./edit.js";

const REMOTE = "origin";
/** How far back the walk looks for a commit CI runs on. */
const LOOKBACK = 50;
const POLL_MS = 15_000;
/** How long a commit may show no run at all before the wait gives up on it. */
const START_MS = 5 * 60_000;

export interface WaitOptions {
  readonly gh?: GhRunner;
  readonly sleep?: (ms: number) => Promise<void>;
  readonly now?: () => number;
}

export interface WaitResult {
  /** 0 green, 1 failed, 2 no answer, 3 still running at the limit. */
  readonly code: 0 | 1 | 2 | 3;
  readonly stdout: string;
}

const usage = "usage: braid wait <number> [--timeout <minutes>]  (a braid number like 0008; minutes may be a fraction, e.g. 9)";

/** The newest commit on the first-parent line of `ref` whose diff against its first parent touches a file outside `braids/` and `epics/`, with the braids-only commits skipped on the way. */
function ciCommit(root: string, ref: string): { sha: string; skipped: string[] } | null {
  const list = git(root, ["rev-list", "--first-parent", `--max-count=${LOOKBACK}`, "--parents", ref]);
  if (list.status !== 0) {
    throw new UsageError(`can't read ${ref}: ${list.stderr.trim()}`);
  }
  const skipped: string[] = [];
  for (const line of list.stdout.split(/\r?\n/).filter((l) => l !== "")) {
    const [sha = "", parent] = line.split(" ");
    if (parent === undefined) {
      return { sha, skipped };
    }
    const files = git(root, ["diff", "--name-only", parent, sha]);
    if (files.status !== 0) {
      throw new UsageError(`can't read the changes of ${sha.slice(0, 7)}: ${files.stderr.trim()}`);
    }
    if (files.stdout.split(/\r?\n/).some((f) => f !== "" && !f.startsWith("braids/") && !f.startsWith("epics/"))) {
      return { sha, skipped };
    }
    skipped.push(sha);
  }
  return null;
}

/** Passing only on success, neutral or skipped; any other finished run (cancelled, timed out, action required, stale) fails. */
const PASSED = new Set(["SUCCESS", "NEUTRAL", "SKIPPED"]);

type Result = "passing" | "failing" | "pending" | "missing";

/** "cancelled" is a finished run that a newer commit's run may supersede; the caller turns it into pending or failing. */
function resultOf(rollup: ReturnType<typeof commitChecks>, name: string): Result | "cancelled" {
  const c = (rollup ?? []).find((r) => r.name === name);
  if (c === undefined) {
    return "missing";
  }
  if ((c.status ?? "COMPLETED") !== "COMPLETED") {
    return "pending";
  }
  if (c.conclusion === "CANCELLED") {
    return "cancelled";
  }
  return PASSED.has(c.conclusion ?? "") ? "passing" : "failing";
}

/** The braid's branch: the one of the braid in this checkout, else the only braid branch with that number. */
function braidBranch(root: string, number: string): string {
  const here = loadBraids(root).find((b) => b.number === number);
  if (here !== undefined) {
    return `braid/${number}-${/^braids\/\d{4}-(.+)$/.exec(here.folder)?.[1] ?? ""}`;
  }
  const names = [...new Set(braidBranches(root, number).filter((r) => r.letter === null).map((r) => (r.local ? r.branch : r.branch.slice(r.branch.indexOf("/") + 1))))].sort();
  if (names.length > 1) {
    throw new UsageError(`braid ${number} has several branches (${names.join(", ")}); run braid wait in a checkout of the one you mean`);
  }
  if (names[0] === undefined) {
    throw new UsageError(`no braid ${number}`);
  }
  return names[0];
}

const realSleep =(ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export async function waitCommand(root: string, args: readonly string[], opts: WaitOptions = {}): Promise<WaitResult> {
  const { positionals, values } = parse("braid wait", args, { timeout: { type: "string" } });
  const m = positionals.length === 1 ? /^(\d{1,4})$/.exec(positionals[0] ?? "") : null;
  if (m === null) {
    throw new UsageError(usage);
  }
  const number = (m[1] ?? "").padStart(4, "0");
  const rawTimeout = str(values, "timeout") ?? "30";
  const minutes = Number(rawTimeout);
  if (!/^\d+(\.\d+)?$/.test(rawTimeout) || !(minutes > 0)) {
    throw new UsageError(`--timeout needs a number of minutes above 0; got: ${rawTimeout}`);
  }
  const branch = braidBranch(root, number);
  const names = ciChecks(root);
  if (names.length === 0) {
    return { code: 0, stdout: `BRAID.md names no ci checks; nothing to wait for on ${branch}\n` };
  }
  const fetched = git(root, ["fetch", "-q", REMOTE, `+refs/heads/${branch}:refs/remotes/${REMOTE}/${branch}`]);
  if (fetched.status !== 0) {
    throw new UsageError(`can't fetch ${branch} from ${REMOTE}: ${fetched.stderr.trim().split("\n")[0] ?? ""}`);
  }
  const found = ciCommit(root, `${REMOTE}/${branch}`);
  if (found === null) {
    throw new UsageError(`no commit with changes outside braids/ and epics/ in the last ${LOOKBACK} commits of ${branch}`);
  }
  const sha = found.sha;
  const short = sha.slice(0, 7);
  const head = found.skipped.length === 0 ? "" : `tip ${found.skipped[0]?.slice(0, 7) ?? ""} of ${branch} only changes braids/ or epics/; CI runs on ${short}\n`;

  const run = opts.gh ?? runGh;
  const sleep = opts.sleep ?? realSleep;
  const now = opts.now ?? Date.now;
  const start = now();
  const until = start + minutes * 60_000;
  const noRunUntil = start + START_MS;
  /** The last state GitHub gave; a failed or empty read never replaces a seen run. */
  let last: { name: string; result: Result; sha: string }[] | null = null;
  let unread = false;
  // The tip first, the CI commit next: the newest commit with a run for a check answers it. Braid branches get no
  // push CI, so a merge CI commit has no run of its own: its second parent answers (the merged strand's head, whose
  // PR run tested it merged onto the braid branch; or main's tip, which has its push run).
  const second = git(root, ["rev-parse", "--verify", "-q", `${sha}^2`]);
  const range = [...found.skipped, sha, ...(second.status === 0 && second.stdout.trim() !== "" ? [second.stdout.trim()] : [])];
  /** The commits that answered, as short shas; the CI commit when nothing has a run yet. */
  const at = (state: readonly { sha: string }[]) => [...new Set(state.map((s) => s.sha.slice(0, 7)))].join(", ") || short;
  for (;;) {
    const rollups = new Map<string, ReturnType<typeof commitChecks>>();
    unread = false;
    const read = names.map((n) => {
      // A commit above that could not be read may hold the real answer: what is found below it is not final.
      let blind = false;
      for (const [i, c] of range.entries()) {
        if (!rollups.has(c)) {
          rollups.set(c, commitChecks({ root, run }, c));
        }
        const rollup = rollups.get(c) ?? null;
        unread ||= rollup === null;
        if (rollup === null) {
          blind = true;
          continue;
        }
        const r = resultOf(rollup, n);
        if (r === "missing") {
          continue;
        }
        // Cancelled with a newer commit above it: that commit may still start its run, within the start limit.
        const result: Result = blind ? "pending" : r === "cancelled" ? (i > 0 && now() < noRunUntil ? "pending" : "failing") : r;
        return { name: n, result, sha: c };
      }
      return { name: n, result: "missing" as Result, sha };
    });
    if (read.some((s) => s.result !== "missing")) {
      last = read;
    }
    const state = last ?? read;
    if (state.every((s) => s.result === "passing")) {
      return { code: 0, stdout: `${head}green at ${at(state)} on ${branch}: ${names.join(", ")}\n` };
    }
    if (state.every((s) => s.result === "passing" || s.result === "failing")) {
      const failed = state.filter((s) => s.result === "failing").map((s) => s.name);
      return { code: 1, stdout: `${head}failed at ${at(state.filter((s) => s.result === "failing"))} on ${branch}: ${failed.join(", ")}\n` };
    }
    const t = now();
    // Only a commit that never showed a run gives up early; once one was seen, only the timeout ends the wait.
    // A shorter call than the start limit ends as 3 below: the run may still appear, so a later call continues.
    if (last === null && t >= noRunUntil) {
      const why = unread ? "GitHub could not be read" : "no run appeared";
      return { code: 2, stdout: `${head}${why} for ${names.join(", ")} at ${short} on ${branch} after ${Math.round((t - start) / 60_000)} minutes\n` };
    }
    if (t >= until) {
      const of = (r: Result) => state.filter((s) => s.result === r).map((s) => s.name);
      const parts = [
        of("failing").length > 0 ? `failed: ${of("failing").join(", ")}` : "",
        of("pending").length > 0 ? `still running: ${of("pending").join(", ")}` : "",
        of("missing").length > 0 ? `not started: ${of("missing").join(", ")}` : "",
        unread ? "GitHub could not be read at the last poll" : "",
      ].filter((p) => p !== "");
      return { code: 3, stdout: `${head}still running after ${minutes} minutes at ${short} on ${branch}; ${parts.join("; ")}\n` };
    }
    await sleep(POLL_MS);
  }
}
