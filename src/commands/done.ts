// `braid accept <id> [--head <sha>] [--merge]`: the coordinator marks an item Done, where it holds the
// base (decision D43). A strand is stamped after its merge, on the braid branch; a story or a braid's
// final PR in a status-only commit on its own branch, after review and green CI, before the handover.
// Every refusal names the condition that failed, and nothing is written before all checks pass.
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parsePreset, resolvePreset } from "../braids/autonomy.js";
import { appendLog, now, threadShort } from "../braids/logs.js";
import { closeRequest } from "../braids/requests.js";
import { loadBraids } from "../braids/store.js";
import { runGh, runsOf, type GhRunner } from "../board/github.js";
import { UsageError } from "./braids.js";
import { ciChecks, read, type Sources, type World } from "./coordinate.js";
import { editItem, parse, readText, str } from "./edit.js";
import { runMergeGate } from "./mergegate.js";
import { mainBranch } from "./start.js";

const REMOTE = "origin";

export interface DoneOptions extends Sources {
  /** Waits between polls of a PR's checks (`--merge` on a story); replaced in tests. */
  readonly sleep?: (ms: number) => Promise<void>;
  /** How long `--merge` waits for the checks on the new head, in ms. */
  readonly waitMs?: number;
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

/** The stored status in a brief's text. */
function statusOf(brief: string): string {
  return /^status:\s*["']?([^"'\r\n]+?)["']?\s*$/m.exec(brief)?.[1] ?? "";
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

const LOOKBACK = 30;

/** The `ci` checks of one commit as a rollup, or null when GitHub can't say. */
export function commitChecks(h: CheckHistory, sha: string): PrView["statusCheckRollup"] | null {
  const r = h.run(h.root, ["api", `repos/{owner}/{repo}/commits/${sha}/check-runs`]);
  if (r.error !== undefined || r.status !== 0) {
    return null;
  }
  try {
    const runs = (JSON.parse(r.stdout) as { check_runs?: { name: string; status?: string; conclusion?: string | null }[] }).check_runs ?? [];
    return runs.map((c) => ({ name: c.name, status: (c.status ?? "completed").toUpperCase(), conclusion: (c.conclusion ?? "").toUpperCase() }));
  } catch {
    return null;
  }
}

/** The newest commit below the head whose `ci` checks are all green, when every commit after it changes only `braids/` (the CI workflow's paths-ignore); else null. */
function greenBelow(names: readonly string[], pr: PrView, h: CheckHistory): string | null {
  const shas = git(h.root, ["rev-list", `--max-count=${LOOKBACK}`, "--parents", pr.headRefOid]).stdout.split(/\r?\n/).filter((l) => l !== "");
  for (const [i, line] of shas.entries()) {
    const [sha = "", ...parents] = line.split(" ");
    if (i > 0) {
      const rollup = commitChecks(h, sha);
      const runs = runsOf(rollup ?? undefined);
      if (rollup !== null && names.every((n) => runs.find((r) => r.name === n)?.result === "passing")) {
        return sha;
      }
    }
    const files = git(h.root, ["diff-tree", "--no-commit-id", "--name-only", "-r", "--root", sha]);
    if (parents.length !== 1 || files.status !== 0 || files.stdout.split(/\r?\n/).some((f) => f !== "" && !f.startsWith("braids/"))) {
      return null;
    }
  }
  return null;
}

/** Why the `ci` checks of BRAID.md aren't green on this PR's head, or null; `pending` tells waiting from failing. With `history`, a head with missing or pending checks that only adds `braids/` changes on top of a green commit passes, and a line naming that commit goes to `history.notes`. */
export function checksProblem(names: readonly string[], pr: PrView, history?: CheckHistory): { why: string; pending: boolean } | null {
  const runs = runsOf(pr.statusCheckRollup);
  if (names.length === 0) {
    const bad = runs.filter((r) => r.result !== "passing");
    return bad.length === 0 ? null : { why: `checks not green: ${bad.map((r) => `${r.name} ${r.result}`).join(", ")}`, pending: bad.every((r) => r.result === "pending") };
  }
  const bad = names.map((n) => ({ name: n, result: runs.find((r) => r.name === n)?.result ?? "pending" })).filter((r) => r.result !== "passing");
  if (bad.length === 0) {
    return null;
  }
  const problem = { why: `ci checks not green on ${pr.headRefOid.slice(0, 7)}: ${bad.map((r) => `${r.name} ${r.result}`).join(", ")}`, pending: bad.every((r) => r.result === "pending") };
  if (history !== undefined && problem.pending) {
    const green = greenBelow(names, pr, history);
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
  const notes: string[] = [];
  const checks = checksProblem(ciChecks(root), pr, { root, run, notes });
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
  must(root, ["fetch", "-q", REMOTE, `+refs/heads/${pr.headRefName}:refs/remotes/${REMOTE}/${pr.headRefName}`], `can't fetch ${pr.headRefName}`);
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
    const notDone = w.braid.strands.filter((s) => statusOf(at(`${s.folder}/brief.md`).stdout) !== "Done").map((s) => s.brief.id);
    if (notDone.length > 0) {
      fail(`strands not Done at ${pr.headRefOid.slice(0, 7)}: ${notDone.join(", ")}`);
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

/** The braid log entry with its "Accepted" line, or null when no entry was asked for. */
function withAccepted(log: { text: string; thread: string } | null, a: Acceptance): { text: string; thread: string } | null {
  return log === null ? null : { text: `${log.text}\n\n${acceptedLine(a)}`, thread: log.thread };
}

/** Posts the acceptance on the PR; a failure is a warning line, since the item is already stamped. */
function comment(run: GhRunner, root: string, pr: number, a: Acceptance): string {
  const r = run(root, ["pr", "comment", String(pr), "--body", acceptedLine(a)]);
  return r.error !== undefined || r.status !== 0 ? `warning: the PR comment was not posted (${(r.stderr || r.error?.message || "gh failed").trim().split("\n")[0] ?? ""})\n` : "";
}

/** Sets the item Done in `cwd` (with the optional braid log entry), commits and pushes to `branch`; returns the new commit. */
function stamp(cwd: string, t: Target, number: string, log: { text: string; thread: string } | null, branch: string): string {
  editItem(cwd, [t.id, "--status", "Done"]);
  const paths = [`${t.folder}/brief.md`];
  if (log !== null) {
    const braid = loadBraids(cwd).find((b) => b.number === number);
    if (braid === undefined) {
      throw new UsageError(`no braid ${number} in ${cwd}`);
    }
    paths.push(`${braid.folder}/${appendLog(join(cwd, braid.folder), log.thread, log.text, false, now())}`);
  }
  must(cwd, ["add", "--", ...paths], "git add failed");
  must(cwd, ["commit", "-q", "-m", `docs(braids): ${t.id} done`], "git commit failed");
  const commit = must(cwd, ["rev-parse", "HEAD"], "can't read the new commit");
  must(cwd, ["push", "-q", REMOTE, `HEAD:refs/heads/${branch}`], `committed ${commit.slice(0, 7)} but the push to ${branch} failed; push it by hand`);
  return commit;
}

/** The strand stamp is made in this checkout: it must be on the braid branch with no tracked changes. Checked before any merge. */
function onBraidBranch(root: string, t: Target): void {
  const branch = git(root, ["symbolic-ref", "--quiet", "--short", "HEAD"]).stdout.trim();
  if (branch !== t.braidBranch) {
    throw new UsageError(`${t.id} not accepted: this checkout is on ${branch === "" ? "a detached HEAD" : branch}, not the braid branch ${t.braidBranch}; run braid accept in your worktree on it`);
  }
  if (must(root, ["status", "--porcelain", "--untracked-files=no"], "can't read the working tree") !== "") {
    throw new UsageError(`${t.id} not accepted: this checkout has uncommitted changes; commit or set them aside first`);
  }
}

/** A strand merged on GitHub: stamp it on the braid branch checked out here. */
function stampStrand(root: string, t: Target, number: string, log: { text: string; thread: string } | null, prNumber: number): string {
  onBraidBranch(root, t);
  must(root, ["pull", "-q", "--ff-only", REMOTE, t.braidBranch], `can't pull ${t.braidBranch}`);
  const strand = loadBraids(root).find((b) => b.number === number)?.strands.find((s) => s.brief.id === t.id);
  if (strand === undefined) {
    throw new UsageError(`${t.id} not accepted: its folder is not on ${t.braidBranch} after the pull`);
  }
  if (strand.brief.status === "Done") {
    return `${t.id} is already Done on ${t.braidBranch}; nothing changed${log === null ? "" : " (the log entry was not written: use braid log)"}\n`;
  }
  const commit = stamp(root, t, number, log, t.braidBranch);
  return `${t.id} done: PR #${prNumber} merged; Done on ${t.braidBranch} in ${commit}\n`;
}

/** A story or a braid's final PR: a status-only commit on its own branch, made in a temporary worktree. */
function stampBranch(root: string, t: Target, number: string, log: { text: string; thread: string } | null, pr: PrView): string {
  const dir = mkdtempSync(join(tmpdir(), "braid-done-"));
  must(root, ["worktree", "add", "-q", "--detach", dir, pr.headRefOid], `can't add a worktree at ${pr.headRefOid.slice(0, 7)}`);
  try {
    return stamp(dir, t, number, log, pr.headRefName);
  } finally {
    git(root, ["worktree", "remove", "--force", dir]);
    rmSync(dir, { recursive: true, force: true });
  }
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
  if (ciChecks(root).length === 0) {
    throw new UsageError(`${t.id} not merged: preset ${preset.name} allows this merge only with CI to wait for, and ci in BRAID.md is none; nothing changed`);
  }
}

const realSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Polls the PR until the `ci` checks pass on `head`; refuses when one fails, the head moves or time runs out. */
async function waitGreen(root: string, run: GhRunner, t: Target, pr: number, head: string, opts: DoneOptions): Promise<string> {
  const sleep = opts.sleep ?? realSleep;
  const until = Date.now() + (opts.waitMs ?? 30 * 60_000);
  for (;;) {
    const v = view(run, root, pr);
    if (v.headRefOid !== head) {
      throw new UsageError(`${t.id} is Done in ${head.slice(0, 7)}, but PR #${pr}'s head moved to ${v.headRefOid.slice(0, 7)}; not merged`);
    }
    const notes: string[] = [];
    const problem = checksProblem(ciChecks(root), v, { root, run, notes });
    if (problem === null) {
      return notes.map((n) => `${n}
`).join("");
    }
    if (!problem.pending) {
      throw new UsageError(`${t.id} is Done in ${head.slice(0, 7)}, but ${problem.why}; not merged`);
    }
    if (Date.now() >= until) {
      throw new UsageError(`${t.id} is Done in ${head.slice(0, 7)}, but the checks are still pending; not merged (run braid accept ${t.id} --head ${head.slice(0, 7)} --merge again later)`);
    }
    await sleep(15_000);
  }
}

/** Marks an item Done; whatever the outcome, an item that is Done has no open request left. */
export async function acceptCommand(root: string, args: readonly string[], opts: DoneOptions = {}): Promise<string> {
  const out = await acceptItem(root, args, opts);
  const id = /^(\d{1,4})(?:\/([A-Z]))?$/;
  const m = id.exec(args.find((a) => id.test(a)) ?? "");
  if (m !== null) {
    // A review request is met by the accept; anything else still open is withdrawn.
    const closed = closeRequest(root, `${(m[1] ?? "").padStart(4, "0")}${m[2] === undefined ? "" : `/${m[2]}`}`, undefined, (r) =>
      r.kind === "review" ? { state: "met", who: "coordinator", text: "accepted" } : { state: "withdrawn", who: "coordinator", text: "the item is Done" },
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
        throw new UsageError(`${t.id} not accepted: PR #${found.number} is open, and a strand is marked Done after its merge; run braid accept ${t.id} --head <reviewed sha> --merge, or merge it first; nothing changed`);
      }
      const pr = view(run, root, found.number);
      if (pr.state !== "OPEN") {
        throw new UsageError(`${t.id} not accepted: PR #${found.number} is ${pr.state.toLowerCase()} now; run braid accept again; nothing changed`);
      }
      onBraidBranch(root, t);
      const skipped = ready(root, run, w, t, pr, head);
      runMergeGate(root, "strand", pr.number, pr.headRefOid, opts.gateMs);
      gh(run, root, ["pr", "merge", String(pr.number), "--merge", "--match-head-commit", pr.headRefOid], `PR #${pr.number} not merged`);
      const a = accepted(pr.headRefOid);
      return `${skipped}merged PR #${pr.number} at ${pr.headRefOid}\n${stampStrand(root, t, number, withAccepted(log, a), pr.number)}${comment(run, root, pr.number, a)}`;
    }
    if (merge || head !== undefined) {
      throw new UsageError(`${t.id} not accepted: PR #${found.number} is already merged; run braid accept ${t.id} without --head and --merge; nothing changed`);
    }
    const a = accepted(view(run, root, found.number).headRefOid);
    const done = stampStrand(root, t, number, withAccepted(log, a), found.number);
    return done.includes("already Done") ? done : `${done}${comment(run, root, found.number, a)}`;
  }

  // A story or a braid's final PR into main.
  if (found.state === "merged") {
    if (w.braid.brief.status === "Done") {
      return `${t.id} is already Done; nothing changed\n`;
    }
    throw new UsageError(`${t.id} not accepted: PR #${found.number} is merged into ${mainBranch(root)} without Done, and braid never commits to ${mainBranch(root)}; set it Done in the next PR into ${mainBranch(root)}`);
  }
  if (head === undefined) {
    throw new UsageError(`${t.id} not accepted: PR #${found.number} is open; give the reviewed head with --head <sha>; nothing changed`);
  }
  const pr = view(run, root, found.number);
  if (pr.state !== "OPEN") {
    throw new UsageError(`${t.id} not accepted: PR #${found.number} is ${pr.state.toLowerCase()} now; run braid accept again; nothing changed`);
  }
  must(root, ["fetch", "-q", REMOTE, `+refs/heads/${pr.headRefName}:refs/remotes/${REMOTE}/${pr.headRefName}`], `can't fetch ${pr.headRefName}`);
  const stored = git(root, ["show", `${pr.headRefOid}:${t.folder}/brief.md`]);
  if (stored.status === 0 && statusOf(stored.stdout) === "Done" && pr.headRefOid.startsWith(head.toLowerCase())) {
    // Stamped before (a resumed run): only the merge may be left.
    if (!merge) {
      return `${t.id} is already Done at ${pr.headRefOid}; nothing changed\n`;
    }
    const waited = await waitGreen(root, run, t, pr.number, pr.headRefOid, opts);
    const skipped = ready(root, run, w, t, view(run, root, pr.number), head);
    runMergeGate(root, "main", pr.number, pr.headRefOid, opts.gateMs);
    gh(run, root, ["pr", "merge", String(pr.number), "--merge", "--match-head-commit", pr.headRefOid], `PR #${pr.number} not merged`);
    return `${waited}${skipped}${t.id} is already Done at ${pr.headRefOid}\nmerged PR #${pr.number} at ${pr.headRefOid}\n`;
  }
  const skipped = ready(root, run, w, t, pr, head);
  const a = accepted(pr.headRefOid);
  const commit = stampBranch(root, t, number, withAccepted(log, a), pr);
  let out = `${skipped}${t.id} done: Done on ${pr.headRefName} in ${commit}\nhead ${commit}\n${comment(run, root, pr.number, a)}`;
  if (merge) {
    out += await waitGreen(root, run, t, pr.number, commit, opts);
    runMergeGate(root, "main", pr.number, commit, opts.gateMs);
    gh(run, root, ["pr", "merge", String(pr.number), "--merge", "--match-head-commit", commit], `${t.id} is Done in ${commit.slice(0, 7)}, but PR #${pr.number} not merged`);
    out += `merged PR #${pr.number} at ${commit}\n`;
  }
  return out;
}
