// `braid start <id>`: what a coordinator does before launching a worker, in one command: the
// item's branch from its base, pushed, and a worktree for the worker. The first step that fails
// stops it; nothing is rolled back beyond what was never created.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";
import type { BranchRef } from "../braids/branches.js";
import { loadLifecycle, recordEvent } from "../braids/lifecycle.js";
import { closeRequest, type Ending } from "../braids/requests.js";
import { normPath, repoNameOf, workFolder, worktreesDir } from "../braids/worktrees.js";
import { agentsDirs } from "../braids/worktree-folders.js";
import { UsageError } from "./braids.js";
import { notReady, read, type Sources, type World } from "./coordinate.js";

/** Starting an item answers what it waited for. */
const STARTED: Ending = { state: "answered", who: "coordinator", text: "started" };

/** A write to the request record that couldn't push: the line the command adds. */
const warned = (warning: string | null): string => (warning === null ? "" : `warning: ${warning}\n`);

export { worktreesDir };

const REMOTE = "origin";

function git(root: string, args: readonly string[]) {
  return spawnSync("git", ["-c", "core.quotePath=false", ...args], { cwd: root, encoding: "utf8" });
}

function must(root: string, args: readonly string[], what: string): string {
  const r = git(root, args);
  if (r.status !== 0) {
    throw new UsageError(`${what}: ${(r.stderr || r.stdout).trim()}`);
  }
  return r.stdout.trim();
}

/** The repository's name for the worktree folder: the main checkout's folder, also from inside a worktree. */
export function repoName(root: string): string {
  const name = repoNameOf(root);
  if (name === null) {
    throw new UsageError("can't read the repository");
  }
  return name;
}

export function mainBranch(root: string): string {
  const file = join(root, "BRAID.md");
  const front = existsSync(file) ? (/^---\r?\n([\s\S]*?)\r?\n---/.exec(readFileSync(file, "utf8"))?.[1] ?? "") : "";
  return /^main:\s*["']?([^\s"']+)["']?\s*$/m.exec(front)?.[1] ?? "main";
}

/** The newest copy of a branch, a local one on a tie. */
function tip(refs: readonly BranchRef[]): BranchRef | undefined {
  return [...refs].sort((a, b) => b.time - a.time || Number(b.local) - Number(a.local))[0];
}

function parse(args: readonly string[]): { number: string; letter: string | null; force: boolean; thread: string | null } {
  if (args.includes("--review")) {
    // Removed in 0039: a reviewer is a T3 subagent in a checkout T3 makes.
    throw new UsageError("braid start has no --review option: a reviewer runs as a T3 subagent in its own checkout; record its thread with braid review <id> --thread <thread id>. Nothing was created");
  }
  const at = args.indexOf("--thread");
  const thread = at < 0 ? null : (args[at + 1] ?? "");
  const ids = args.filter((a, i) => a !== "--force" && (at < 0 || (i !== at && i !== at + 1)));
  const m = ids.length === 1 ? /^(\d{1,4})(?:\/([A-Z]))?$/.exec(ids[0] ?? "") : null;
  if (m === null || thread === "" || thread?.startsWith("--") === true) {
    throw new UsageError("usage: braid start <id> [--force] [--thread <id>]  (a strand like 0008/B, or a braid without strands like 0008)");
  }
  return { number: (m[1] ?? "").padStart(4, "0"), letter: m[2] ?? null, force: args.includes("--force"), thread };
}

function target(w: World, letter: string | null): { branch: string; slug: string; folder: string; why: string | null } {
  const braidSlug = /^braids\/\d{4}-(.+)$/.exec(w.braid.folder)?.[1] ?? "";
  if (letter === null) {
    if (w.braid.strands.length > 0) {
      throw new UsageError(`${w.braid.number} has strands: start one of them (braid start ${w.braid.number}/<letter>)`);
    }
    const deps = w.braid.brief.dependencies.filter((d) => w.cards.get(d)?.lane !== "Done");
    const c = w.card;
    const why = c.lane === "Done" ? "done" : c.running ? "running" : c.pr?.state === "open" ? `PR #${c.pr.number} is open` : c.status !== "To Do" ? `status ${c.status}` : deps.length > 0 ? `blocked by ${deps.join(", ")}` : null;
    return { branch: `braid/${w.braid.number}-${braidSlug}`, slug: w.braid.number, folder: workFolder(w.braid.number, null), why };
  }
  const strand = w.braid.strands.find((s) => s.letter === letter);
  const card = w.card.strands.find((s) => s.id === `${w.braid.number}/${letter}`);
  if (strand === undefined || card === undefined) {
    throw new UsageError(`no strand ${w.braid.number}/${letter}`);
  }
  const slug = /\/[A-Z]-(.+)$/.exec(strand.folder)?.[1] ?? "";
  return { branch: `braid/${w.braid.number}/${letter}-${slug}`, slug, folder: workFolder(w.braid.number, letter), why: notReady(w, card) };
}

export async function startCommand(root: string, args: readonly string[], src: Sources = {}, env: NodeJS.ProcessEnv = process.env): Promise<string> {
  const { number, letter, force, thread } = parse(args);
  const w = await read(root, number, "start", src);
  const t = target(w, letter);
  const id = letter === null ? number : `${number}/${letter}`;
  repoName(root);
  const [dir = "", ...old] = agentsDirs(root, env);
  const folder = join(dir, t.folder);
  // Worktrees made before 0053/B are under the folder named for the checkout and stay there.
  const earlier = old.map((d) => join(d, t.folder));
  // A retry: the item is already started as asked, so say so before the ready check (its branch is pushed now).
  const again = alreadyStarted(root, id, tip(w.refs.filter((r) => r.number === number && r.letter === letter)), folder, earlier, letter === null ? undefined : tip(w.refs.filter((r) => r.number === number && r.letter === null)));
  if (again !== null) {
    // A first run that made the worktree but couldn't record the start records it now.
    const has = loadLifecycle(root).get(id)?.events.some((e) => e.kind === "started") ?? false;
    return has ? again : `${again}${started(root, id, thread, /^branch (\S+)/.exec(again)?.[1] ?? "")}`;
  }
  if (t.why !== null && !force) {
    throw new UsageError(`${id} is not ready: ${t.why} (--force starts it anyway)`);
  }
  const own = w.refs.filter((r) => r.number === number && r.letter === letter);
  // A story the coordinator planned has its branch already; a strand never does.
  const own1 = tip(own);
  if (own1 !== undefined && letter !== null) {
    throw new UsageError(`${id} already has the branch ${own1.branch}; nothing was created`);
  }
  if (own1 !== undefined) {
    const out = startOnExisting(root, id, own1, folder);
    return `${out}${started(root, id, thread, own1.local ? own1.branch : own1.branch.slice(own1.branch.indexOf("/") + 1))}`;
  }

  // The base: a strand starts from its braid's branch tip, a story from main.
  let base: string;
  if (letter === null) {
    const main = mainBranch(root);
    base = git(root, ["rev-parse", "--verify", "--quiet", `refs/heads/${main}`]).status === 0 ? main : `${REMOTE}/${main}`;
  } else {
    const braidBranch = tip(w.refs.filter((r) => r.number === number && r.letter === null));
    if (braidBranch === undefined) {
      throw new UsageError(`braid ${number} has no branch (braid/${number}-<slug>), local or pushed; create it first`);
    }
    base = braidBranch.branch;
  }
  const commit = must(root, ["rev-parse", "--verify", `${base}^{commit}`], `can't read ${base}`);

  if (existsSync(folder)) {
    throw new UsageError(`${folder} already exists; nothing was created`);
  }

  must(root, ["push", REMOTE, `${commit}:refs/heads/${t.branch}`], `can't push ${t.branch} to ${REMOTE}; nothing was created`);
  must(root, ["worktree", "add", "--track", "-b", t.branch, folder, `${REMOTE}/${t.branch}`], `${t.branch} is pushed but the worktree failed`);
  const closed = closeRequest(root, id, undefined, STARTED);
  return `branch ${t.branch}\ncommit ${commit}\nfolder ${isAbsolute(folder) ? folder : resolve(folder)}\n${warned(closed.warning)}${started(root, id, thread, t.branch)}`;
}

/** The `started` event on the record branch (the item reads In Progress from it); a push that failed is a warning line. */
function started(root: string, id: string, thread: string | null, branch: string): string {
  return warned(recordEvent(root, id, { kind: "started", at: new Date().toISOString(), thread, branch }).warning);
}

/** A planned story: its worktree on the branch that already exists, tracking `origin/` when only the remote has it. */
function startOnExisting(root: string, id: string, ref: BranchRef, folder: string): string {
  const name = ref.local ? ref.branch : ref.branch.slice(ref.branch.indexOf("/") + 1);
  if (existsSync(folder)) {
    throw new UsageError(`${folder} already exists; nothing was created`);
  }
  const checkedOut = git(root, ["worktree", "list", "--porcelain"]).stdout.split(/\r?\n/).includes(`branch refs/heads/${name}`);
  if (checkedOut) {
    throw new UsageError(`${id} already has the branch ${name}, checked out in a worktree; nothing was created`);
  }
  if (ref.local) {
    must(root, ["worktree", "add", folder, name], `can't make the worktree on ${name}`);
  } else {
    must(root, ["worktree", "add", "--track", "-b", name, folder, ref.branch], `can't make the worktree on ${ref.branch}`);
  }
  const closed = closeRequest(root, id, undefined, STARTED);
  const commit = must(folder, ["rev-parse", "HEAD"], "can't read the new worktree");
  return `branch ${name} (existing)\ncommit ${commit}\nfolder ${isAbsolute(folder) ? folder : resolve(folder)}\n${warned(closed.warning)}`;
}

/** The worktrees git knows: folder, checked-out branch (without `refs/heads/`) and HEAD. */
function worktrees(root: string): { path: string; branch: string | null; head: string }[] {
  return git(root, ["worktree", "list", "--porcelain"])
    .stdout.split(/\r?\n\r?\n/)
    .map((block) => {
      const line = (key: string) => new RegExp(`^${key} (.*)$`, "m").exec(block)?.[1]?.trim() ?? null;
      return { path: line("worktree") ?? "", branch: line("branch")?.replace(/^refs\/heads\//, "") ?? null, head: line("HEAD") ?? "" };
    })
    .filter((x) => x.path !== "");
}

/**
 * A second `braid start`: when the item's branch is checked out in the worktree folder `start` would make, and that
 * branch is at or after its base, there is nothing to do and it says so. A branch checked out anywhere else, or on
 * other commits, fails and says what was found. No branch, or a branch without a worktree, is left to the normal start.
 * A strand's branch must contain the braid branch's tip. A story has no base check: `main` moves on while it runs.
 */
function alreadyStarted(root: string, id: string, own: BranchRef | undefined, wanted: string, earlier: readonly string[], braidTip: BranchRef | undefined): string | null {
  if (own === undefined) {
    return null;
  }
  const name = own.local ? own.branch : own.branch.slice(own.branch.indexOf("/") + 1);
  const at = worktrees(root).find((x) => x.branch === name);
  if (at === undefined) {
    return null;
  }
  // The folder a worktree of this item may be in: the new one, or one made before 0053/B.
  const folder = [wanted, ...earlier].find((f) => normPath(f) === normPath(at.path)) ?? wanted;
  if (normPath(at.path) !== normPath(folder)) {
    throw new UsageError(`${id} already has the branch ${name}, checked out in a worktree at ${at.path}, not in ${folder}; nothing was created`);
  }
  if (braidTip !== undefined) {
    const base = git(root, ["rev-parse", "--verify", "--quiet", `${braidTip.branch}^{commit}`]).stdout.trim();
    if (base !== "" && git(root, ["merge-base", "--is-ancestor", base, at.head]).status !== 0) {
      throw new UsageError(`${id} already has the branch ${name} in ${folder}, at ${at.head}, which does not contain its base ${braidTip.branch} (${base}); nothing was created`);
    }
  }
  return `branch ${name} (already started)
commit ${at.head}
folder ${isAbsolute(folder) ? folder : resolve(folder)}
`;
}
