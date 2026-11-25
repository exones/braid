// `braid accept <id> [--head <sha>] [--merge]`: the coordinator accepts an item at its reviewed head (decision D43).
// The acceptance is an `accepted` event on the record branch (src/braids/lifecycle.ts); Done itself is read from the
// merged PR, so nothing is committed on a PR's branch and its head never moves (0075/B). A strand's braid log entry
// (`--log`) is still committed on the braid branch after its merge. Every refusal names the condition that failed,
// and nothing is written before all checks pass.
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { parsePreset, resolvePreset } from "../braids/autonomy.js";
import { loadLifecycle, recordEvent } from "../braids/lifecycle.js";
import { appendLog, now, threadShort } from "../braids/logs.js";
import { closeRequest } from "../braids/requests.js";
import { loadBraids } from "../braids/store.js";
import { runGh, runsOf, type GhRunner } from "../board/github.js";
import { UsageError } from "./braids.js";
import { ciAll, ciChecks, read, type Sources, type World } from "./coordinate.js";
import { parse, readText, str } from "./edit.js";
import { runMergeGate } from "./mergegate.js";
import { mainBranch } from "./start.js";

const REMOTE = "origin";

export interface DoneOptions extends Sources {
  /** The merge gate's time limit in ms; replaced in tests. */
  readonly gateMs?: number;
}

export interface PrView {
  readonly number: number;
  readonly url: string;
  readonly state: string;
  readonly baseRefName: string;
  readonly headRefName: string;
  readonly headRefOid: string;
  readonly mergeable: string;
  readonly statusCheckRollup?: Parameters<typeof runsOf>[0];
}

export function git(cwd: string, args: readonly string[]) {
  return spawnSync("git", ["-c", "core.quotePath=false", ...args], { cwd, encoding: "utf8" });
}

export function must(cwd: string, args: readonly string[], what: string): string {
  const r = git(cwd, args);
  if (r.status !== 0) {
    throw new UsageError(`${what}: ${(r.stderr || r.stdout).trim()}`);
  }
  return r.stdout.trim();
}

export function gh(run: GhRunner, root: string, args: readonly string[], what: string): string {
  const r = run(root, args);
  if (r.error !== undefined || r.status !== 0) {
    throw new UsageError(`${what}: ${(r.stderr || r.error?.message || "gh failed").trim().split("\n")[0] ?? ""}`);
  }
  return r.stdout;
}

export function view(run: GhRunner, root: string, pr: number): PrView {
  const out = gh(run, root, ["pr", "view", String(pr), "--json", "number,url,state,baseRefName,headRefName,headRefOid,mergeable,statusCheckRollup"], `can't read PR #${pr}`);
  try {
    return JSON.parse(out) as PrView;
  } catch {
    throw new UsageError(`can't read PR #${pr}: gh gave unreadable output`);
  }
}

/** Whether the brief has a box section at all: a brief without one is refused, not passed. */
export function hasBoxSection(brief: string): boolean {
  return /^##\s+(completion|acceptance|definition of done)\s*$/im.test(brief);
}

/** Unticked boxes under Completion (or the older Acceptance and Definition of done); a box naming CI is left out, since braid accept checks CI itself. */
export function openBoxes(brief: string): string[] {
  const open: string[] = [];
  let inside = false;
  for (const line of brief.split(/\r?\n/)) {
    const heading = /^##\s+(.+?)\s*$/.exec(line);
    if (heading !== null) {
      inside = /^(completion|acceptance|definition of done)$/i.test(heading[1] ?? "");
      continue;
    }
    const box = /^\s*[-*]\s+\[ \]\s+(.*)$/.exec(line);
    if (inside && box !== null && !/\bCI\b/.test(box[1] ?? "")) {
      open.push((box[1] ?? "").trim());
    }
  }
  return open;
}

/** Where braid looks past a head without checks: the commits since the newest all-green one. */
export interface CheckHistory {
  readonly root: string;
  readonly run: GhRunner;
  /** Receives a line naming the green commit when a head passes on it. */
  readonly notes?: string[];
}

/** The `ci` checks of one commit as a rollup, or null when GitHub can't say. */
export function commitChecks(h: CheckHistory, sha: string): { name: string; status: string; conclusion: string; startedAt?: string }[] | null {
  const r = h.run(h.root, ["api", `repos/{owner}/{repo}/commits/${sha}/check-runs`]);
  if (r.error !== undefined || r.status !== 0) {
    return null;
  }
  try {
    const runs = (JSON.parse(r.stdout) as { check_runs?: { name: string; status?: string; conclusion?: string | null; started_at?: string | null }[] }).check_runs ?? [];
    // Newest run first, so a name's first entry is its newest run (a re-run replaces the older one).
    return runs
      .map((c) => ({ name: c.name, status: (c.status ?? "completed").toUpperCase(), conclusion: (c.conclusion ?? "").toUpperCase(), ...(c.started_at ? { startedAt: c.started_at } : {}) }))
      .sort((a, b) => Date.parse(b.startedAt ?? "") - Date.parse(a.startedAt ?? "") || 0);
  } catch {
    return null;
  }
}

export const LOOKBACK = 50;

/**
 * The one definition of "braids-only commits inherit green": the newest commit on the first-parent line of `ref`
 * whose diff against its first parent touches a file outside `braids/` and `epics/` (the CI commit), and the
 * braids-only commits above it, newest first. Null when there is none within the look-back. `braid accept` and
 * `braid wait` both use it; CI's fast path (.github/workflows/ci.yml) is its own copy for the runner.
 */
export function ciCommit(root: string, ref: string): { sha: string; skipped: string[] } | null {
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

/** The newest commit below the head, down to its CI commit (`ciCommit`), whose `ci` checks are all green; else null. */
function greenBelow(names: readonly string[], pr: PrView, h: CheckHistory, all: boolean): string | null {
  let found: { sha: string; skipped: string[] } | null;
  try {
    found = ciCommit(h.root, pr.headRefOid);
  } catch {
    return null;
  }
  if (found === null) {
    return null;
  }
  for (const sha of [...found.skipped.slice(1), ...(found.skipped.length > 0 ? [found.sha] : [])]) {
    const rollup = commitChecks(h, sha);
    const runs = runsOf(rollup ?? undefined);
    if (rollup !== null && (all ? runs.length > 0 && runs.every((r) => r.result === "passing") : names.every((n) => runs.find((r) => r.name === n)?.result === "passing"))) {
      return sha;
    }
  }
  return null;
}

/** Why the `ci` checks of BRAID.md aren't green on this PR's head, or null; `pending` tells waiting from failing. With `history`, a head with missing or pending checks that only adds `braids/` changes on top of a green commit passes, and a line naming that commit goes to `history.notes`. */
export function checksProblem(names: readonly string[], pr: PrView, history?: CheckHistory, all = false): { why: string; pending: boolean } | null {
  const runs = runsOf(pr.statusCheckRollup);
  if (all || names.length === 0) {
    const bad = runs.filter((r) => r.result !== "passing");
    // `ci: all` needs at least one reported check; one that hasn't appeared yet is pending, as a pending run is.
    const problem = all && runs.length === 0
      ? { why: `ci: all, but no check is reported on ${pr.headRefOid.slice(0, 7)}`, pending: true }
      : bad.length === 0 ? null : { why: `checks not green: ${bad.map((r) => `${r.name} ${r.result}`).join(", ")}`, pending: bad.every((r) => r.result === "pending") };
    if (all && problem?.pending === true && history !== undefined) {
      const green = greenBelow(names, pr, history, true);
      if (green !== null) {
        history.notes?.push(`checks skipped on ${pr.headRefOid.slice(0, 7)}: only braids/ changed since ${green.slice(0, 7)}, which is green`);
        return null;
      }
    }
    return problem;
  }
  const bad = names.map((n) => ({ name: n, result: runs.find((r) => r.name === n)?.result ?? "pending" })).filter((r) => r.result !== "passing");
  if (bad.length === 0) {
    return null;
  }
  const problem = { why: `ci checks not green on ${pr.headRefOid.slice(0, 7)}: ${bad.map((r) => `${r.name} ${r.result}`).join(", ")}`, pending: bad.every((r) => r.result === "pending") };
  if (history !== undefined && problem.pending) {
    const green = greenBelow(names, pr, history, false);
    if (green !== null) {
      history.notes?.push(`checks skipped on ${pr.headRefOid.slice(0, 7)}: only braids/ changed since ${green.slice(0, 7)}, which is green`);
      return null;
    }
  }
  return problem;
}

interface Target {
  readonly id: string;
  readonly key: string;
  readonly letter: string | null;
  /** Folder of the item, relative to the root. */
  readonly folder: string;
  /** The braid branch (`braid/<number>-<slug>`). */
  readonly braidBranch: string;
}

function target(w: World, letter: string | null): Target {
  const slug = /^braids\/\d{4}-(.+)$/.exec(w.braid.folder)?.[1] ?? "";
  const braidBranch = `braid/${w.braid.number}-${slug}`;
  if (letter === null) {
    return { id: w.braid.number, key: w.braid.number, letter, folder: w.braid.folder, braidBranch };
  }
  const strand = w.braid.strands.find((s) => s.letter === letter);
  if (strand === undefined) {
    throw new UsageError(`no strand ${w.braid.number}/${letter}`);
  }
  const id = `${w.braid.number}/${letter}`;
  return { id, key: id, letter, folder: strand.folder, braidBranch };
}

/** The checks every open PR must pass before braid accept merges it or stamps it. */
function ready(root: string, run: GhRunner, w: World, t: Target, pr: PrView, head: string): string {
  const base = t.letter === null ? mainBranch(root) : t.braidBranch;
  const fail = (why: string) => {
    throw new UsageError(`${t.id} not accepted: ${why}; nothing changed`);
  };
  if (pr.baseRefName !== base) {
    fail(`PR #${pr.number} goes into ${pr.baseRefName}, not ${base}`);
  }
  if (!pr.headRefOid.startsWith(head.toLowerCase())) {
    fail(`PR #${pr.number}'s head is ${pr.headRefOid.slice(0, 7)}, not the reviewed ${head} (show the user what changed)`);
  }
  // The head's commits are needed below (the braids-only walk, the brief and report at the head).
  must(root, ["fetch", "-q", REMOTE, `+refs/heads/${pr.headRefName}:refs/remotes/${REMOTE}/${pr.headRefName}`], `can't fetch ${pr.headRefName}`);
  const notes: string[] = [];
  const checks = checksProblem(ciChecks(root), pr, { root, run, notes }, ciAll(root));
  if (checks !== null) {
    fail(checks.why);
  }
  if (pr.mergeable !== "MERGEABLE") {
    fail(pr.mergeable === "CONFLICTING" ? `PR #${pr.number} has conflicts` : `GitHub has not worked out whether PR #${pr.number} is mergeable (${pr.mergeable}); retry shortly`);
  }
  if (w.t3.status.state !== "ok") {
    fail(`T3 could not be read (${w.t3.status.reason}), so a running worker can't be ruled out`);
  }
  // Only agents braid started count; the coordinator's own thread is no agent of any item.
  const running = (w.t3.threads.get(t.key) ?? [])[0];
  if (running !== undefined) {
    fail(`a ${running.role === "reviewer" ? "review" : "worker"} thread for ${t.key} is still running (${running.id}${running.title === undefined ? "" : `, "${running.title}"`})`);
  }
  const at = (path: string) => git(root, ["show", `${pr.headRefOid}:${path}`]);
  const brief = at(`${t.folder}/brief.md`);
  if (brief.status !== 0) {
    fail(`${t.folder}/brief.md is missing at ${pr.headRefOid.slice(0, 7)}`);
  }
  if (!hasBoxSection(brief.stdout)) {
    fail(`${t.folder}/brief.md has no Completion section (nor Acceptance or Definition of done) at ${pr.headRefOid.slice(0, 7)}`);
  }
  const open = openBoxes(brief.stdout);
  if (open.length > 0) {
    fail(`unticked boxes at ${pr.headRefOid.slice(0, 7)}: ${open.join("; ")}`);
  }
  if (at(`${t.folder}/report.md`).status !== 0) {
    fail(`no report.md at ${pr.headRefOid.slice(0, 7)}`);
  }
  if (t.letter === null) {
    // A strand is Done once its PR merged (or by an older stored Done), as every reader sees it.
    const notDone = w.card.strands.filter((s) => s.status !== "Done").map((s) => s.id);
    if (notDone.length > 0) {
      fail(`strands not Done: ${notDone.join(", ")}`);
    }
  }
  return notes.map((n) => `${n}
`).join("");
}


/** What an acceptance records: the reviewed head, the review comment's link, the coordinator's thread. */
interface Acceptance {
  readonly id: string;
  readonly head: string;
  readonly review: string;
  readonly thread: string;
}

function acceptedLine(a: Acceptance): string {
  return `Accepted: ${a.id} at ${a.head.slice(0, 7)}; review: ${a.review}; coordinator thread ${a.thread}.`;
}

/** Posts the acceptance on the PR; a failure is a warning line, since the acceptance is already recorded. */
function comment(run: GhRunner, root: string, pr: number, a: Acceptance): string {
  const r = run(root, ["pr", "comment", String(pr), "--body", acceptedLine(a)]);
  return r.error !== undefined || r.status !== 0 ? `warning: the PR comment was not posted (${(r.stderr || r.error?.message || "gh failed").trim().split("\n")[0] ?? ""})\n` : "";
}

/** Records the `accepted` event on the record branch; a push that failed is a warning line (the next write pushes it). */
function recordAccepted(root: string, t: Target, a: Acceptance): string {
  const r = recordEvent(root, t.id, { kind: "accepted", at: new Date().toISOString(), head: a.head, review: a.review, thread: a.thread });
  return r.warning === null ? "" : `warning: ${r.warning}\n`;
}

/** Whether the item was accepted at this head already (a resumed run). */
function acceptedAt(root: string, t: Target, head: string): boolean {
  return (loadLifecycle(root).get(t.id)?.events ?? []).some((e) => e.kind === "accepted" && e.head === head);
}

/** The braid log entry is committed in this checkout: it must be on the braid branch with no tracked changes. Checked before any merge. */
function onBraidBranch(root: string, t: Target): void {
  const branch = git(root, ["symbolic-ref", "--quiet", "--short", "HEAD"]).stdout.trim();
  if (branch !== t.braidBranch) {
    throw new UsageError(`${t.id} not accepted: this checkout is on ${branch === "" ? "a detached HEAD" : branch}, not the braid branch ${t.braidBranch}; run braid accept in your worktree on it`);
  }
  if (must(root, ["status", "--porcelain", "--untracked-files=no"], "can't read the working tree") !== "") {
    throw new UsageError(`${t.id} not accepted: this checkout has uncommitted changes; commit or set them aside first`);
  }
}

/** A strand merged: its braid log entry, with the "Accepted" line, committed and pushed on the braid branch checked out here. */
function strandLog(root: string, t: Target, number: string, log: { text: string; thread: string }, a: Acceptance): string {
  must(root, ["pull", "-q", "--ff-only", REMOTE, t.braidBranch], `can't pull ${t.braidBranch}`);
  const braid = loadBraids(root).find((b) => b.number === number);
  if (braid === undefined) {
    throw new UsageError(`no braid ${number} on ${t.braidBranch}`);
  }
  const file = `${braid.folder}/${appendLog(join(root, braid.folder), log.thread, `${log.text}\n\n${acceptedLine(a)}`, false, now())}`;
  must(root, ["add", "--", file], "git add failed");
  must(root, ["commit", "-q", "-m", `docs(braids): ${t.id} accepted`], "git commit failed");
  const commit = must(root, ["rev-parse", "HEAD"], "can't read the new commit");
  must(root, ["push", "-q", REMOTE, `HEAD:refs/heads/${t.braidBranch}`], `committed ${commit.slice(0, 7)} but the push to ${t.braidBranch} failed; push it by hand`);
  return `log entry on ${t.braidBranch} in ${commit}\n`;
}

/** `--merge --preset`: a merge the coordinator makes under the braid's preset; refuses unless that preset allows this PR. */
function presetAllows(root: string, w: World, t: Target): void {
  const resolved = resolvePreset(root, w.braid.brief.autonomy);
  if (resolved.source === null) {
    throw new UsageError(`${t.id} not merged: autonomy preset ${resolved.name} does not exist; nothing changed`);
  }
  const preset = parsePreset(resolved.source.text, resolved.source.from === "shipped" ? `shipped preset ${resolved.source.name}` : resolved.source.from, resolved.source.name);
  const kind = t.letter !== null ? "strand" : w.braid.strands.length > 0 ? "final" : "story";
  const allowed = preset.merge === "all" || (preset.merge === "strands" && kind === "strand");
  if (!allowed) {
    throw new UsageError(`${t.id} not merged: preset ${preset.name} has merge: ${preset.merge}, which does not let the coordinator merge ${kind === "final" ? "a braid's final PR" : `a ${kind}'s PR`}; the user merges it (or run without --preset on their word); nothing changed`);
  }
  if (ciChecks(root).length === 0 && !ciAll(root)) {
    throw new UsageError(`${t.id} not merged: preset ${preset.name} allows this merge only with CI to wait for, and ci in BRAID.md is none; nothing changed`);
  }
}


/** Accepts an item; whatever the outcome, an accepted item has no open request left. */
export async function acceptCommand(root: string, args: readonly string[], opts: DoneOptions = {}): Promise<string> {
  const out = await acceptItem(root, args, opts);
  const id = /^(\d{1,4})(?:\/([A-Z]))?$/;
  const m = id.exec(args.find((a) => id.test(a)) ?? "");
  if (m !== null) {
    // A review request is met by the accept; anything else still open is withdrawn.
    const closed = closeRequest(root, `${(m[1] ?? "").padStart(4, "0")}${m[2] === undefined ? "" : `/${m[2]}`}`, undefined, (r) =>
      r.kind === "review" ? { state: "met", who: "coordinator", text: "accepted" } : { state: "withdrawn", who: "coordinator", text: "the item is accepted" },
    );
    if (closed.warning !== null) {
      return `${out}warning: ${closed.warning}\n`;
    }
  }
  return out;
}

async function acceptItem(root: string, args: readonly string[], opts: DoneOptions): Promise<string> {
  const { positionals, values } = parse("braid accept", args, { head: { type: "string" }, review: { type: "string" }, merge: { type: "boolean" }, preset: { type: "boolean" }, log: { type: "string" }, thread: { type: "string" } });
  const m = positionals.length === 1 ? /^(\d{1,4})(?:\/([A-Z]))?$/.exec(positionals[0] ?? "") : null;
  if (m === null) {
    throw new UsageError("usage: braid accept <id> [--head <sha>] [--merge [--preset]] [--review <url>] [--log <file>|-] [--thread <id>]");
  }
  const number = (m[1] ?? "").padStart(4, "0");
  const head = str(values, "head");
  if (head !== undefined && !/^[0-9a-fA-F]{7,40}$/.test(head)) {
    throw new UsageError(`--head needs a commit sha (7 to 40 hex digits); got: ${head}`);
  }
  const merge = values["merge"] === true;
  if (values["preset"] === true && !merge) {
    throw new UsageError("--preset goes with --merge: braid accept <id> --head <sha> --merge --preset");
  }
  const logFile = str(values, "log");
  const thread = threadShort(str(values, "thread"));
  if (thread === null) {
    throw new UsageError(`--thread needs an id with at least 8 letters or digits; got: ${str(values, "thread") ?? ""}`);
  }
  if (logFile !== undefined && m[2] === undefined) {
    // Nothing is committed on a story's or final PR's branch: its log entry goes into the PR before the review.
    throw new UsageError(`braid accept --log is for a strand (its entry goes on the braid branch after the merge); for ${number}, write the entry with braid log in the PR before the review; nothing changed`);
  }
  const log = logFile === undefined ? null : { text: readText({ file: logFile }), thread };
  const review = str(values, "review") ?? "reviewed by the coordinator";
  const who = str(values, "thread") ?? thread;
  const accepted = (head: string): Acceptance => ({ id: positionals[0] ?? "", head, review, thread: who });
  if (log !== null && log.text === "") {
    throw new UsageError("braid accept --log: the log text must not be empty");
  }

  const run = opts.gh ?? runGh;
  const w = await read(root, number, "accept", opts);
  const t = target(w, m[2] ?? null);
  if (values["preset"] === true) {
    presetAllows(root, w, t);
  }
  if (w.github.status.state !== "ok") {
    throw new UsageError(`${t.id} not accepted: GitHub could not be read (${w.github.status.reason}); nothing changed`);
  }
  const found = w.github.prs.get(t.key);
  if (found === undefined) {
    throw new UsageError(`${t.id} not accepted: it has no PR; nothing changed`);
  }
  if (found.state === "closed") {
    throw new UsageError(`${t.id} not accepted: PR #${found.number} was closed without merging; nothing changed`);
  }

  if (t.letter !== null) {
    if (found.state === "open") {
      if (!merge || head === undefined) {
        throw new UsageError(`${t.id} not accepted: PR #${found.number} is open, and a strand is accepted with its merge; run braid accept ${t.id} --head <reviewed sha> --merge, or merge it first; nothing changed`);
      }
      const pr = view(run, root, found.number);
      if (pr.state !== "OPEN") {
        throw new UsageError(`${t.id} not accepted: PR #${found.number} is ${pr.state.toLowerCase()} now; run braid accept again; nothing changed`);
      }
      if (log !== null) {
        onBraidBranch(root, t);
      }
      const skipped = ready(root, run, w, t, pr, head);
      await runMergeGate(root, "strand", pr.number, pr.headRefOid, opts.gateMs);
      gh(run, root, ["pr", "merge", String(pr.number), "--merge", "--match-head-commit", pr.headRefOid], `PR #${pr.number} not merged`);
      const a = accepted(pr.headRefOid);
      const warn = recordAccepted(root, t, a);
      return `${skipped}merged PR #${pr.number} at ${pr.headRefOid}\n${t.id} accepted at ${pr.headRefOid}; Done from the merge\n${warn}${log === null ? "" : strandLog(root, t, number, log, a)}${comment(run, root, pr.number, a)}`;
    }
    if (merge || head !== undefined) {
      throw new UsageError(`${t.id} not accepted: PR #${found.number} is already merged; run braid accept ${t.id} without --head and --merge; nothing changed`);
    }
    // Merged already (on GitHub, or by a run that stopped after the merge): it is Done; record the acceptance and the log entry.
    const at = view(run, root, found.number).headRefOid;
    if (acceptedAt(root, t, at)) {
      return `${t.id} is already accepted at ${at}; nothing changed${log === null ? "" : " (the log entry was not written: use braid log)"}\n`;
    }
    if (log !== null) {
      onBraidBranch(root, t);
    }
    const a = accepted(at);
    const warn = recordAccepted(root, t, a);
    return `${t.id} accepted at ${at}; Done from the merge of PR #${found.number}\n${warn}${log === null ? "" : strandLog(root, t, number, log, a)}${comment(run, root, found.number, a)}`;
  }

  // A story or a braid's final PR into main: nothing is committed on its branch, so the reviewed head is the one merged.
  if (found.state === "merged") {
    if (w.card.status === "Done") {
      return `${t.id} is Done: PR #${found.number} is merged; nothing changed\n`;
    }
    throw new UsageError(`${t.id} not accepted: PR #${found.number} merged into ${mainBranch(root)} while strands were open (${w.card.strands.filter((s) => s.status !== "Done").map((s) => s.id).join(", ")}), so it doesn't make ${t.id} Done; its final PR does; nothing changed`);
  }
  if (head === undefined) {
    throw new UsageError(`${t.id} not accepted: PR #${found.number} is open; give the reviewed head with --head <sha>; nothing changed`);
  }
  const pr = view(run, root, found.number);
  if (pr.state !== "OPEN") {
    throw new UsageError(`${t.id} not accepted: PR #${found.number} is ${pr.state.toLowerCase()} now; run braid accept again; nothing changed`);
  }
  const skipped = ready(root, run, w, t, pr, head);
  // Before the record: a refused gate changes nothing.
  if (merge) {
    await runMergeGate(root, "main", pr.number, pr.headRefOid, opts.gateMs);
  }
  const a = accepted(pr.headRefOid);
  let out = skipped;
  if (acceptedAt(root, t, pr.headRefOid)) {
    out += `${t.id} is already accepted at ${pr.headRefOid}\n`;
  } else {
    out += `${t.id} accepted at ${pr.headRefOid}; the head is unchanged\n${recordAccepted(root, t, a)}${comment(run, root, pr.number, a)}`;
  }
  if (merge) {
    gh(run, root, ["pr", "merge", String(pr.number), "--merge", "--match-head-commit", pr.headRefOid], `${t.id} is accepted at ${pr.headRefOid.slice(0, 7)}, but PR #${pr.number} not merged`);
    out += `merged PR #${pr.number} at ${pr.headRefOid}\n`;
  }
  return out;
}
