// `braid done <id> [--head <sha>] [--merge]`: the coordinator marks an item Done, where it holds the
// base (decision D43). A strand is stamped after its merge, on the braid branch; a story or a braid's
// final PR in a status-only commit on its own branch, after review and green CI, before the handover.
// Every refusal names the condition that failed, and nothing is written before all checks pass.
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { appendLog, now, threadShort } from "../braids/logs.js";
import { closeRequest } from "../braids/requests.js";
import { loadBraids } from "../braids/store.js";
import { runGh, runsOf, type GhRunner } from "../board/github.js";
import { UsageError } from "./braids.js";
import { ciChecks, read, type Sources, type World } from "./coordinate.js";
import { editItem, parse, readText, str } from "./edit.js";
import { mainBranch } from "./start.js";

const REMOTE = "origin";

export interface DoneOptions extends Sources {
  /** Waits between polls of a PR's checks (`--merge` on a story); replaced in tests. */
  readonly sleep?: (ms: number) => Promise<void>;
  /** How long `--merge` waits for the checks on the new head, in ms. */
  readonly waitMs?: number;
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

/** Unticked boxes under Acceptance and Definition of done; a box naming CI is left out, since braid done checks CI itself. */
export function openBoxes(brief: string): string[] {
  const open: string[] = [];
  let inside = false;
  for (const line of brief.split(/\r?\n/)) {
    const heading = /^##\s+(.+?)\s*$/.exec(line);
    if (heading !== null) {
      inside = /^(acceptance|definition of done)$/i.test(heading[1] ?? "");
      continue;
    }
    const box = /^\s*[-*]\s+\[ \]\s+(.*)$/.exec(line);
    if (inside && box !== null && !/\bCI\b/.test(box[1] ?? "")) {
      open.push((box[1] ?? "").trim());
    }
  }
  return open;
}

/** Why the `ci` checks of BRAID.md aren't green on this PR's head, or null; `pending` tells waiting from failing. */
export function checksProblem(names: readonly string[], pr: PrView): { why: string; pending: boolean } | null {
  const runs = runsOf(pr.statusCheckRollup);
  if (names.length === 0) {
    const bad = runs.filter((r) => r.result !== "passing");
    return bad.length === 0 ? null : { why: `checks not green: ${bad.map((r) => `${r.name} ${r.result}`).join(", ")}`, pending: bad.every((r) => r.result === "pending") };
  }
  const bad = names.map((n) => ({ name: n, result: runs.find((r) => r.name === n)?.result ?? "pending" })).filter((r) => r.result !== "passing");
  return bad.length === 0 ? null : { why: `ci checks not green on ${pr.headRefOid.slice(0, 7)}: ${bad.map((r) => `${r.name} ${r.result}`).join(", ")}`, pending: bad.every((r) => r.result === "pending") };
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

/** The checks every open PR must pass before braid done merges it or stamps it. */
function ready(root: string, w: World, t: Target, pr: PrView, head: string): void {
  const base = t.letter === null ? mainBranch(root) : t.braidBranch;
  const fail = (why: string) => {
    throw new UsageError(`${t.id} not done: ${why}; nothing changed`);
  };
  if (pr.baseRefName !== base) {
    fail(`PR #${pr.number} goes into ${pr.baseRefName}, not ${base}`);
  }
  if (!pr.headRefOid.startsWith(head.toLowerCase())) {
    fail(`PR #${pr.number}'s head is ${pr.headRefOid.slice(0, 7)}, not the reviewed ${head} (show the user what changed)`);
  }
  const checks = checksProblem(ciChecks(root), pr);
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
    fail(`a worker thread for ${t.key} is still running (${running.id}${running.title === undefined ? "" : `, "${running.title}"`})`);
  }
  must(root, ["fetch", "-q", REMOTE, `+refs/heads/${pr.headRefName}:refs/remotes/${REMOTE}/${pr.headRefName}`], `can't fetch ${pr.headRefName}`);
  const at = (path: string) => git(root, ["show", `${pr.headRefOid}:${path}`]);
  const brief = at(`${t.folder}/brief.md`);
  if (brief.status !== 0) {
    fail(`${t.folder}/brief.md is missing at ${pr.headRefOid.slice(0, 7)}`);
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
    throw new UsageError(`${t.id} not done: this checkout is on ${branch === "" ? "a detached HEAD" : branch}, not the braid branch ${t.braidBranch}; run braid done in your worktree on it`);
  }
  if (must(root, ["status", "--porcelain", "--untracked-files=no"], "can't read the working tree") !== "") {
    throw new UsageError(`${t.id} not done: this checkout has uncommitted changes; commit or set them aside first`);
  }
}

/** A strand merged on GitHub: stamp it on the braid branch checked out here. */
function stampStrand(root: string, t: Target, number: string, log: { text: string; thread: string } | null, prNumber: number): string {
  onBraidBranch(root, t);
  must(root, ["pull", "-q", "--ff-only", REMOTE, t.braidBranch], `can't pull ${t.braidBranch}`);
  const strand = loadBraids(root).find((b) => b.number === number)?.strands.find((s) => s.brief.id === t.id);
  if (strand === undefined) {
    throw new UsageError(`${t.id} not done: its folder is not on ${t.braidBranch} after the pull`);
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

const realSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Polls the PR until the `ci` checks pass on `head`; refuses when one fails, the head moves or time runs out. */
async function waitGreen(root: string, run: GhRunner, t: Target, pr: number, head: string, opts: DoneOptions): Promise<void> {
  const sleep = opts.sleep ?? realSleep;
  const until = Date.now() + (opts.waitMs ?? 30 * 60_000);
  for (;;) {
    const v = view(run, root, pr);
    if (v.headRefOid !== head) {
      throw new UsageError(`${t.id} is Done in ${head.slice(0, 7)}, but PR #${pr}'s head moved to ${v.headRefOid.slice(0, 7)}; not merged`);
    }
    const problem = checksProblem(ciChecks(root), v);
    if (problem === null) {
      return;
    }
    if (!problem.pending) {
      throw new UsageError(`${t.id} is Done in ${head.slice(0, 7)}, but ${problem.why}; not merged`);
    }
    if (Date.now() >= until) {
      throw new UsageError(`${t.id} is Done in ${head.slice(0, 7)}, but the checks are still pending; not merged (run braid done ${t.id} --head ${head.slice(0, 7)} --merge again later)`);
    }
    await sleep(15_000);
  }
}

/** Marks an item Done; whatever the outcome, an item that is Done has no open request left. */
export async function doneCommand(root: string, args: readonly string[], opts: DoneOptions = {}): Promise<string> {
  const out = await doneItem(root, args, opts);
  const id = /^(\d{1,4})(?:\/([A-Z]))?$/;
  const m = id.exec(args.find((a) => id.test(a)) ?? "");
  if (m !== null) {
    closeRequest(root, `${(m[1] ?? "").padStart(4, "0")}${m[2] === undefined ? "" : `/${m[2]}`}`);
  }
  return out;
}

async function doneItem(root: string, args: readonly string[], opts: DoneOptions): Promise<string> {
  const { positionals, values } = parse("braid done", args, { head: { type: "string" }, merge: { type: "boolean" }, log: { type: "string" }, thread: { type: "string" } });
  const m = positionals.length === 1 ? /^(\d{1,4})(?:\/([A-Z]))?$/.exec(positionals[0] ?? "") : null;
  if (m === null) {
    throw new UsageError("usage: braid done <id> [--head <sha>] [--merge] [--log <file>|-] [--thread <id>]");
  }
  const number = (m[1] ?? "").padStart(4, "0");
  const head = str(values, "head");
  if (head !== undefined && !/^[0-9a-fA-F]{7,40}$/.test(head)) {
    throw new UsageError(`--head needs a commit sha (7 to 40 hex digits); got: ${head}`);
  }
  const merge = values["merge"] === true;
  const logFile = str(values, "log");
  const thread = threadShort(str(values, "thread"));
  if (thread === null) {
    throw new UsageError(`--thread needs an id with at least 8 letters or digits; got: ${str(values, "thread") ?? ""}`);
  }
  const log = logFile === undefined ? null : { text: readText({ file: logFile }), thread };
  if (log !== null && log.text === "") {
    throw new UsageError("braid done --log: the log text must not be empty");
  }

  const run = opts.gh ?? runGh;
  const w = await read(root, number, "done", opts);
  const t = target(w, m[2] ?? null);
  if (w.github.status.state !== "ok") {
    throw new UsageError(`${t.id} not done: GitHub could not be read (${w.github.status.reason}); nothing changed`);
  }
  const found = w.github.prs.get(t.key);
  if (found === undefined) {
    throw new UsageError(`${t.id} not done: it has no PR; nothing changed`);
  }
  if (found.state === "closed") {
    throw new UsageError(`${t.id} not done: PR #${found.number} was closed without merging; nothing changed`);
  }

  if (t.letter !== null) {
    if (found.state === "open") {
      if (!merge || head === undefined) {
        throw new UsageError(`${t.id} not done: PR #${found.number} is open, and a strand is marked Done after its merge; run braid done ${t.id} --head <reviewed sha> --merge, or merge it first; nothing changed`);
      }
      const pr = view(run, root, found.number);
      if (pr.state !== "OPEN") {
        throw new UsageError(`${t.id} not done: PR #${found.number} is ${pr.state.toLowerCase()} now; run braid done again; nothing changed`);
      }
      onBraidBranch(root, t);
      ready(root, w, t, pr, head);
      gh(run, root, ["pr", "merge", String(pr.number), "--merge", "--match-head-commit", pr.headRefOid], `PR #${pr.number} not merged`);
      return `merged PR #${pr.number} at ${pr.headRefOid}\n${stampStrand(root, t, number, log, pr.number)}`;
    }
    if (merge || head !== undefined) {
      throw new UsageError(`${t.id} not done: PR #${found.number} is already merged; run braid done ${t.id} without --head and --merge; nothing changed`);
    }
    return stampStrand(root, t, number, log, found.number);
  }

  // A story or a braid's final PR into main.
  if (found.state === "merged") {
    if (w.braid.brief.status === "Done") {
      return `${t.id} is already Done; nothing changed\n`;
    }
    throw new UsageError(`${t.id} not done: PR #${found.number} is merged into ${mainBranch(root)} without Done, and braid never commits to ${mainBranch(root)}; set it Done in the next PR into ${mainBranch(root)}`);
  }
  if (head === undefined) {
    throw new UsageError(`${t.id} not done: PR #${found.number} is open; give the reviewed head with --head <sha>; nothing changed`);
  }
  const pr = view(run, root, found.number);
  if (pr.state !== "OPEN") {
    throw new UsageError(`${t.id} not done: PR #${found.number} is ${pr.state.toLowerCase()} now; run braid done again; nothing changed`);
  }
  must(root, ["fetch", "-q", REMOTE, `+refs/heads/${pr.headRefName}:refs/remotes/${REMOTE}/${pr.headRefName}`], `can't fetch ${pr.headRefName}`);
  const stored = git(root, ["show", `${pr.headRefOid}:${t.folder}/brief.md`]);
  if (stored.status === 0 && statusOf(stored.stdout) === "Done" && pr.headRefOid.startsWith(head.toLowerCase())) {
    // Stamped before (a resumed run): only the merge may be left.
    if (!merge) {
      return `${t.id} is already Done at ${pr.headRefOid}; nothing changed\n`;
    }
    await waitGreen(root, run, t, pr.number, pr.headRefOid, opts);
    ready(root, w, t, view(run, root, pr.number), head);
    gh(run, root, ["pr", "merge", String(pr.number), "--merge", "--match-head-commit", pr.headRefOid], `PR #${pr.number} not merged`);
    return `${t.id} is already Done at ${pr.headRefOid}\nmerged PR #${pr.number} at ${pr.headRefOid}\n`;
  }
  ready(root, w, t, pr, head);
  const commit = stampBranch(root, t, number, log, pr);
  let out = `${t.id} done: Done on ${pr.headRefName} in ${commit}\nhead ${commit}\n`;
  if (merge) {
    await waitGreen(root, run, t, pr.number, commit, opts);
    gh(run, root, ["pr", "merge", String(pr.number), "--merge", "--match-head-commit", commit], `${t.id} is Done in ${commit.slice(0, 7)}, but PR #${pr.number} not merged`);
    out += `merged PR #${pr.number} at ${commit}\n`;
  }
  return out;
}
