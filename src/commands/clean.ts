// `braid clean [<number>|<id>] [--yes]`: removes the worktrees and local branches of items whose
// PR is merged, and of merged planning branches (`plan/<slug>`). A dry run unless `--yes`. It never forces and keeps anything whose commits aren't in this checkout's HEAD: a worktree that is in use or has
// changes is kept, a branch is deleted with `git branch -d` only, and remote branches stay.
import { spawnSync } from "node:child_process";
import { existsSync, realpathSync, renameSync } from "node:fs";
import { join, resolve } from "node:path";
import { loadLiveBraids } from "../braids/branches.js";
import { UsageError } from "./braids.js";
import { readGithub, runGh, type Github } from "../board/github.js";
import { read, type Sources } from "./coordinate.js";
import { reviewFolder } from "../braids/worktrees.js";
import { dropReviews, loadReviews } from "../braids/reviews.js";
import { runT3, showThread, type T3Runner } from "../board/t3.js";
import { repoName, worktreesDir } from "./start.js";

interface Worktree {
  readonly path: string;
  readonly branch: string | null;
}

function git(root: string, args: readonly string[]) {
  return spawnSync("git", ["-c", "core.quotePath=false", ...args], { cwd: root, encoding: "utf8" });
}

function worktrees(root: string): Worktree[] {
  const r = git(root, ["worktree", "list", "--porcelain"]);
  const out: Worktree[] = [];
  for (const block of r.stdout.split(/\r?\n\r?\n/)) {
    const path = /^worktree (.+)$/m.exec(block)?.[1];
    if (path !== undefined) {
      out.push({ path, branch: /^branch refs\/heads\/(.+)$/m.exec(block)?.[1] ?? null });
    }
  }
  return out;
}

const norm = (p: string): string => {
  let real = resolve(p);
  try {
    real = realpathSync.native(real);
  } catch {
    // a folder that is gone keeps its plain path
  }
  const slashed = real.replace(/\\/g, "/").replace(/\/$/, "");
  return process.platform === "win32" ? slashed.toLowerCase() : slashed;
};

/** Whether the folder can be renamed and back: on Windows a process using it as working directory prevents that. */
function free(folder: string): boolean {
  const probe = `${folder}.braid-probe`;
  try {
    renameSync(folder, probe);
  } catch {
    return false;
  }
  try {
    renameSync(probe, folder);
  } catch {
    return false;
  }
  return true;
}

/** Merged `plan/<slug>` branches (the PR that planned a goal) and their worktrees, kept when the worktree is dirty or in use. */
function plans(root: string, yes: boolean, src: Sources, github: Github | undefined, listed: readonly Worktree[], here: string, lines: string[]): void {
  const merged = (github ?? readGithub(root, src.gh ?? runGh, 0)).plans ?? new Map<string, number>();
  for (const branch of git(root, ["branch", "--list", "--format=%(refname:short)", "plan/*"]).stdout.split("\n").map((l) => l.trim()).filter((l) => l !== "")) {
    const pr = merged.get(branch);
    if (pr === undefined) {
      continue;
    }
    const tree = listed.find((t) => t.branch === branch);
    const what = `planning branch ${branch}${tree === undefined ? "" : ` and worktree ${tree.path}`} (PR #${pr} merged)`;
    let skip: string | null = null;
    if (tree !== undefined && norm(tree.path) === here) {
      skip = "checked out in this checkout";
    } else if (git(root, ["merge-base", "--is-ancestor", branch, "HEAD"]).status !== 0) {
      skip = "merged on GitHub, but its commits are not in this checkout's HEAD: pull first, or delete it by hand";
    } else if (tree !== undefined && existsSync(tree.path) && git(tree.path, ["status", "--porcelain"]).stdout.trim() !== "") {
      skip = "its worktree has changes";
    } else if (tree !== undefined && existsSync(tree.path) && yes && !free(tree.path)) {
      skip = "still in use, retry later";
    }
    if (skip !== null) {
      lines.push(`skip ${what}: ${skip}`);
    } else if (!yes) {
      lines.push(`would remove ${what}`);
    } else {
      if (tree !== undefined && existsSync(tree.path)) {
        const r = git(root, ["worktree", "remove", tree.path]);
        if (r.status !== 0) {
          lines.push(`skip ${what}: worktree not removed (${(r.stderr || r.stdout).trim().split("\n")[0] ?? ""})`);
          continue;
        }
      } else if (tree !== undefined) {
        git(root, ["worktree", "prune"]);
      }
      const b = git(root, ["branch", "-d", branch]);
      lines.push(b.status === 0 ? `removed ${what}` : `kept ${branch}: not fully merged here (${(b.stderr || b.stdout).trim().split("\n")[0] ?? ""})`);
    }
  }
}

/**
 * The recorded review threads of a merged item (`braid review`). A record holds the folder and branch T3 gave for the reviewer's checkout
 * when it was recorded; they are removed when the folder is a registered worktree of this repository (not the main checkout, not this one)
 * and T3 doesn't say the thread runs (a thread T3 doesn't know counts as not running); then the record goes. A branch is deleted
 * only when it is a `t3/…` branch, with `git branch -d`. A record without a folder (T3 gave none when it was recorded, or an older record) falls
 * back to T3: its `worktreePath` and `branch`, only for a subagent's thread; one T3 doesn't know loses its record. When T3 can't be
 * read, everything is kept.
 */
async function reviewThreads(root: string, yes: boolean, id: string, pr: number, t3Ok: boolean, run: T3Runner, listed: readonly Worktree[], here: string, lines: string[]): Promise<void> {
  const records = loadReviews(root).filter((r) => r.id === id);
  const main = listed[0] === undefined ? null : norm(listed[0].path);
  const drop: string[] = [];
  for (const r of records) {
    const label = `${id}: review thread ${r.thread}`;
    if (!t3Ok) {
      lines.push(`skip ${label}: T3 could not be read, so its checkout is kept`);
      continue;
    }
    const where = await showThread(run, root, r.thread);
    let folder: string | null;
    let rawBranch: string | null;
    let skip: string | null = null;
    if (r.folder !== undefined) {
      folder = r.folder;
      rawBranch = r.branch ?? null;
    } else {
      if (where === null) {
        lines.push(`${yes ? "dropped" : "would drop"} the record of ${label}: T3 doesn't know the thread`);
        drop.push(r.thread);
        continue;
      }
      folder = where.worktreePath;
      rawBranch = where.branch;
      if (where.relationshipToParent === null) {
        skip = "T3 says it is not a subagent's thread";
      }
    }
    const tree = folder === null ? undefined : listed.find((t) => norm(t.path) === norm(folder as string));
    const branch = rawBranch !== null && rawBranch.startsWith("t3/") ? rawBranch : null;
    const what = `${label}: ${folder === null ? "no checkout" : `checkout ${folder}`}${branch === null ? "" : ` and branch ${branch}`} (PR #${pr} merged)`;
    if (skip !== null) {
      // set above
    } else if (where?.status === "running") {
      skip = "still running";
    } else if (folder !== null && tree === undefined && existsSync(folder)) {
      skip = "the folder is not a worktree of this repository";
    } else if (tree !== undefined && norm(tree.path) === main) {
      skip = "it is the main checkout";
    } else if (tree !== undefined && norm(tree.path) === here) {
      skip = "checked out in this checkout";
    } else if (tree !== undefined && yes && existsSync(tree.path) && !free(tree.path)) {
      skip = "still in use, retry later";
    }
    if (skip !== null) {
      lines.push(`skip ${what}: ${skip}`);
      continue;
    }
    if (!yes) {
      lines.push(`would remove ${what}`);
      continue;
    }
    if (tree !== undefined && existsSync(tree.path)) {
      const rm = git(root, ["worktree", "remove", tree.path]);
      if (rm.status !== 0) {
        lines.push(`skip ${what}: not removed (${(rm.stderr || rm.stdout).trim().split("\n")[0] ?? ""})`);
        continue;
      }
    } else if (tree !== undefined) {
      git(root, ["worktree", "prune"]);
    }
    let note = "";
    if (branch !== null && git(root, ["rev-parse", "--verify", "--quiet", `refs/heads/${branch}`]).status === 0) {
      const b = git(root, ["branch", "-d", branch]);
      note = b.status === 0 ? "" : `; kept branch ${branch}: not fully merged here (${(b.stderr || b.stdout).trim().split("\n")[0] ?? ""})`;
    }
    lines.push(`removed ${what}${note}`);
    drop.push(r.thread);
  }
  if (yes) {
    dropReviews(root, id, drop);
  }
}

export async function cleanCommand(root: string, args: readonly string[], src: Sources = {}, env: NodeJS.ProcessEnv = process.env): Promise<string> {
  const yes = args.includes("--yes");
  const ids = args.filter((a) => a !== "--yes");
  const m = ids.length <= 1 ? /^(\d{1,4})(?:\/([A-Z]))?$/.exec(ids[0] ?? "0") : null;
  if (m === null || ids.some((a) => a.startsWith("--"))) {
    throw new UsageError("usage: braid clean [<number>|<id>] [--yes]  (a dry run unless --yes)");
  }
  const only = ids.length === 0 ? null : { number: (m[1] ?? "").padStart(4, "0"), letter: m[2] ?? null };
  const numbers = only === null ? loadLiveBraids(root).map((b) => b.number) : [only.number];

  const mine = norm(join(worktreesDir(env), repoName(root)));
  const listed = worktrees(root);
  const here = norm(root);
  const lines: string[] = [];
  let notes = "";
  let first: Awaited<ReturnType<typeof read>> | undefined;
  for (const number of numbers) {
    const w = await read(root, number, "clean", src, first);
    first ??= w;
    if (w.github.status.state !== "ok") {
      throw new UsageError(`GitHub could not be read (${w.github.status.reason}); merged PRs can't be told, nothing was cleaned`);
    }
    const items = [
      { id: number, letter: null as string | null, card: w.card },
      ...w.card.strands.map((s) => ({ id: s.id, letter: s.id.slice(5), card: s })),
    ].filter((i) => only === null || only.letter === null || i.letter === only.letter);
    for (const item of items) {
      if (item.card.pr?.state !== "merged") {
        continue;
      }
      await reviewThreads(root, yes, item.id, item.card.pr.number, w.t3.status.state === "ok", src.t3 ?? runT3, listed, here, lines);
      // A leftover reviewer checkout from before 0039 (`braid start <id> --review`, detached at the PR head) goes with the merged item.
      const revPath = norm(join(mine, reviewFolder(number, item.letter)));
      const rev = listed.find((t) => norm(t.path) === revPath);
      if (rev !== undefined) {
        const what = `${item.id}: review checkout ${rev.path} (PR #${item.card.pr.number} merged)`;
        if (norm(rev.path) === here) {
          lines.push(`skip ${what}: checked out in this checkout`);
        } else if (!yes) {
          lines.push(`would remove ${what}`);
        } else if (existsSync(rev.path) && !free(rev.path)) {
          lines.push(`skip ${what}: still in use, retry later`);
        } else if (!existsSync(rev.path)) {
          git(root, ["worktree", "prune"]);
          lines.push(`removed ${what}`);
        } else {
          const r = git(root, ["worktree", "remove", rev.path]);
          lines.push(r.status === 0 ? `removed ${what}` : `skip ${what}: not removed (${(r.stderr || r.stdout).trim().split("\n")[0] ?? ""})`);
        }
      }
      for (const ref of w.refs.filter((r) => r.local && r.number === number && r.letter === item.letter)) {
        const tree = listed.find((t) => t.branch === ref.branch);
        const named = only?.letter !== null && only?.letter !== undefined;
        let skip: string | null = null;
        if (tree !== undefined && norm(tree.path) === here) {
          skip = "checked out in this checkout";
        } else if (git(root, ["merge-base", "--is-ancestor", ref.branch, "HEAD"]).status !== 0) {
          // `git branch -d` also accepts a branch merged into its upstream; that is not enough here.
          skip = "merged on GitHub, but its commits are not in this checkout's HEAD: pull first, or if it was squash-merged, delete it by hand";
        } else if (tree !== undefined && !named && !norm(tree.path).startsWith(`${mine}/`)) {
          skip = `its worktree ${tree.path} is not in the braid worktree folder (name the strand to clean it)`;
        } else if (tree !== undefined && yes && !free(tree.path)) {
          skip = "still in use, retry later";
        }
        const what = `${item.id}: ${tree === undefined ? "" : `worktree ${tree.path} and `}branch ${ref.branch} (PR #${item.card.pr.number} merged)`;
        if (skip !== null) {
          lines.push(`skip ${what}: ${skip}`);
          continue;
        }
        if (!yes) {
          lines.push(`would remove ${what}`);
          continue;
        }
        if (tree !== undefined && existsSync(tree.path)) {
          const r = git(root, ["worktree", "remove", tree.path]);
          if (r.status !== 0) {
            lines.push(`skip ${what}: worktree not removed (${(r.stderr || r.stdout).trim().split("\n")[0] ?? ""})`);
            continue;
          }
        } else if (tree !== undefined) {
          git(root, ["worktree", "prune"]);
        }
        const b = git(root, ["branch", "-d", ref.branch]);
        lines.push(b.status === 0 ? `removed ${what}` : `kept branch ${ref.branch} of ${item.id}: not fully merged here (${(b.stderr || b.stdout).trim().split("\n")[0] ?? ""})`);
      }
    }
    if (w.t3.status.state !== "ok") {
      notes = `note: T3 could not be read (${w.t3.status.reason}); a running agent in a merged item's worktree can't be ruled out\n`;
    }
  }
  if (only === null) {
    plans(root, yes, src, first?.github, listed, here, lines);
  }
  const head = lines.length === 0 ? "nothing to clean\n" : `${lines.join("\n")}\n`;
  return `${head}${yes || lines.length === 0 ? "" : "dry run: run again with --yes to do it\n"}${notes}`;
}
