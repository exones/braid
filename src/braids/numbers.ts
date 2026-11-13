// Which braid numbers and strand letters are taken. A number or letter counts as taken
// when it is in the working tree, or anywhere under braids/ in the history of any ref
// (local and remote-tracking branches, tags), including folders deleted since. So a
// number used on another branch, or given once and removed, is never handed out again.
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { BRAID_FOLDER, STRAND_FOLDER } from "./store.js";

export class GitError extends Error {
  override name = "GitError";
}

export interface Taken {
  readonly numbers: ReadonlySet<number>;
  /** Letters per braid number (`0002`). */
  readonly letters: ReadonlyMap<string, ReadonlySet<string>>;
}

function git(root: string, args: readonly string[]) {
  return spawnSync("git", ["-c", "core.quotePath=false", ...args], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024,
  });
}

function isRepository(root: string): boolean {
  const r = git(root, ["rev-parse", "--is-inside-work-tree"]);
  return r.status === 0 && r.stdout.trim() === "true";
}

/** Brings remote-tracking branches up to date when the repository has a remote. */
export function fetchRemotes(root: string): void {
  if (!isRepository(root)) {
    return;
  }
  const remotes = git(root, ["remote"]);
  if (remotes.status !== 0 || remotes.stdout.trim() === "") {
    return;
  }
  const r = git(root, ["fetch", "--all", "--quiet"]);
  if (r.status !== 0) {
    const reason = (r.stderr || r.error?.message || "").trim().split("\n")[0] ?? "";
    throw new GitError(
      `git fetch failed${reason === "" ? "" : `: ${reason}`}; run with --no-fetch to check only the branches this clone knows`,
    );
  }
}

function add(map: Map<string, Set<string>>, number: string, letter: string): void {
  const set = map.get(number) ?? new Set<string>();
  set.add(letter);
  map.set(number, set);
}

const PATH = /(?:^|\/)braids\/(\d{4})-[a-z0-9]+(?:-[a-z0-9]+)*(?:\/([A-Z])-[a-z0-9]+(?:-[a-z0-9]+)*(?:\/|$))?/;

export function takenIds(root: string): Taken {
  const numbers = new Set<number>();
  const letters = new Map<string, Set<string>>();
  const base = join(root, "braids");
  if (existsSync(base)) {
    for (const entry of readdirSync(base)) {
      const match = BRAID_FOLDER.exec(entry);
      const dir = join(base, entry);
      if (!match || !statSync(dir).isDirectory()) {
        continue;
      }
      const number = match[1] ?? "";
      numbers.add(Number(number));
      for (const inner of readdirSync(dir)) {
        const strand = STRAND_FOLDER.exec(inner);
        if (strand && statSync(join(dir, inner)).isDirectory()) {
          add(letters, number, strand[1] ?? "");
        }
      }
    }
  }
  if (isRepository(root)) {
    const r = git(root, ["log", "--all", "--format=", "--name-only", "--", "braids"]);
    if (r.status !== 0) {
      throw new GitError(`git log failed: ${(r.stderr || r.error?.message || "").trim()}`);
    }
    for (const line of r.stdout.split("\n")) {
      const match = PATH.exec(line.trim());
      if (!match) {
        continue;
      }
      const number = match[1] ?? "";
      numbers.add(Number(number));
      if (match[2] !== undefined) {
        add(letters, number, match[2]);
      }
    }
  }
  return { numbers, letters };
}

/** The next braid number: one above the highest taken (gaps are not filled). */
export function nextNumber(taken: Taken): string | null {
  const next = Math.max(0, ...taken.numbers) + 1;
  return next > 9999 ? null : String(next).padStart(4, "0");
}

/** The next strand letter for braid `number`: one after the highest taken. */
export function nextLetter(taken: Taken, number: string): string | null {
  const used = [...(taken.letters.get(number) ?? [])].sort();
  const last = used.at(-1);
  const next = last === undefined ? "A" : String.fromCharCode(last.charCodeAt(0) + 1);
  return next > "Z" ? null : next;
}
