// `braid start <id>`: what a coordinator does before launching a worker, in one command: the
// item's branch from its base, pushed, and a worktree for the worker. The first step that fails
// stops it; nothing is rolled back beyond what was never created.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, isAbsolute, join, resolve } from "node:path";
import type { BranchRef } from "../braids/branches.js";
import { UsageError } from "./braids.js";
import { notReady, read, type Sources, type World } from "./coordinate.js";

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
function repoName(root: string): string {
  const common = must(root, ["rev-parse", "--git-common-dir"], "can't read the repository");
  const dir = resolve(root, common);
  return basename(basename(dir) === ".git" ? dirname(dir) : dir).replace(/\.git$/, "");
}

/** `$BRAID_WORKTREES_DIR`, else `~/braid-worktrees`. */
export function worktreesDir(env: NodeJS.ProcessEnv = process.env): string {
  const set = env.BRAID_WORKTREES_DIR;
  return set !== undefined && set !== "" ? resolve(set) : join(homedir(), "braid-worktrees");
}

function mainBranch(root: string): string {
  const file = join(root, "BRAID.md");
  const front = existsSync(file) ? (/^---\r?\n([\s\S]*?)\r?\n---/.exec(readFileSync(file, "utf8"))?.[1] ?? "") : "";
  return /^main:\s*["']?([^\s"']+)["']?\s*$/m.exec(front)?.[1] ?? "main";
}

/** The newest copy of a branch, a local one on a tie. */
function tip(refs: readonly BranchRef[]): BranchRef | undefined {
  return [...refs].sort((a, b) => b.time - a.time || Number(b.local) - Number(a.local))[0];
}

function parse(args: readonly string[]): { number: string; letter: string | null; force: boolean } {
  const ids = args.filter((a) => a !== "--force");
  const m = ids.length === 1 ? /^(\d{1,4})(?:\/([A-Z]))?$/.exec(ids[0] ?? "") : null;
  if (m === null) {
    throw new UsageError("usage: braid start <id> [--force]  (a strand like 0008/B, or a braid without strands like 0008)");
  }
  return { number: (m[1] ?? "").padStart(4, "0"), letter: m[2] ?? null, force: args.includes("--force") };
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
    return { branch: `braid/${w.braid.number}-${braidSlug}`, slug: w.braid.number, folder: w.braid.number, why };
  }
  const strand = w.braid.strands.find((s) => s.letter === letter);
  const card = w.card.strands.find((s) => s.id === `${w.braid.number}/${letter}`);
  if (strand === undefined || card === undefined) {
    throw new UsageError(`no strand ${w.braid.number}/${letter}`);
  }
  const slug = /\/[A-Z]-(.+)$/.exec(strand.folder)?.[1] ?? "";
  return { branch: `braid/${w.braid.number}/${letter}-${slug}`, slug, folder: `${w.braid.number}-${letter}`, why: notReady(w, card) };
}

export async function startCommand(root: string, args: readonly string[], src: Sources = {}, env: NodeJS.ProcessEnv = process.env): Promise<string> {
  const { number, letter, force } = parse(args);
  const w = await read(root, number, "start", src);
  const t = target(w, letter);
  const id = letter === null ? number : `${number}/${letter}`;
  if (t.why !== null && !force) {
    throw new UsageError(`${id} is not ready: ${t.why} (--force starts it anyway)`);
  }
  const own = w.refs.filter((r) => r.number === number && r.letter === letter);
  if (own.length > 0) {
    throw new UsageError(`${id} already has the branch ${own[0]?.branch ?? ""}; nothing was created`);
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

  const folder = join(worktreesDir(env), repoName(root), t.folder);
  if (existsSync(folder)) {
    throw new UsageError(`${folder} already exists; nothing was created`);
  }

  must(root, ["push", REMOTE, `${commit}:refs/heads/${t.branch}`], `can't push ${t.branch} to ${REMOTE}; nothing was created`);
  must(root, ["worktree", "add", "--track", "-b", t.branch, folder, `${REMOTE}/${t.branch}`], `${t.branch} is pushed but the worktree failed`);
  return `branch ${t.branch}\ncommit ${commit}\nfolder ${isAbsolute(folder) ? folder : resolve(folder)}\n`;
}
