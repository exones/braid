// Is a folder a working braid project? One function says what is wrong and what to do, so the board and
// `braid status` can tell an empty board from a project that isn't set up. Nothing is stored: it is computed at each read.
import type { Github } from "../board/github.js";
import { checkBraids } from "./check.js";
import { fsTree, type WorkingFiles } from "./store.js";
import { readWorkingTree } from "./worktree.js";

/** What to do about unreadable GitHub, and what it hides (the one message for it, on the board and in `braid status`). */
export const GITHUB_TODO = "install gh, run gh auth login, and make sure this repository is on GitHub; until then PRs and checks are missing and lanes come from stored statuses";

export type ProblemKey = "no-braids" | "braid-md" | "check" | "github";

export interface Problem {
  readonly key: ProblemKey;
  /** What is wrong, in a short sentence. */
  readonly reason: string;
  /** What to do about it. */
  readonly todo: string;
}

/** The front matter keys a project's BRAID.md must have. */
export const REQUIRED_KEYS = ["gate", "main", "ci", "models"] as const;

/** The top-level keys of BRAID.md's front matter, or why it can't be read. Nested keys (under `models:`) are not looked at. */
function braidMdKeys(source: string): Set<string> | string {
  const text = source.replace(/^\uFEFF/, "");
  const front = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text)?.[1];
  if (front === undefined) {
    return "its front matter (the --- block at the top) is missing or not closed";
  }
  return new Set([...front.matchAll(/^([a-z][a-z_]*):/gm)].map((m) => m[1] ?? ""));
}

/**
 * What stops `folder` from working as a braid project. A project with problems is still served; the list only says what to fix.
 * It never throws: a file it can't read is a problem too, so one broken project can't fail a caller that reads several.
 * `github` is the caller's read of GitHub; pass `null` to leave GitHub unchecked. T3 not running is not a problem here (the board has its own note).
 */
export function readiness(folder: string, github: Github | null, files: WorkingFiles = fsTree(folder), check: () => readonly string[] = () => checkBraids(folder, { tree: files, related: false }).errors): Problem[] {
  const problems: Problem[] = [];
  const attempt = (key: ProblemKey, what: string, work: () => void): void => {
    try {
      work();
    } catch (error) {
      problems.push({ key, reason: `${what} can't be read (${error instanceof Error ? error.message : String(error)})`, todo: `fix the permissions or the file, then run braid check` });
    }
  };
  attempt("no-braids", "braids/", () => {
    if (!files.exists("braids")) {
      problems.push(
        files.exists("backlog")
          ? { key: "no-braids", reason: "it has backlog/ but no braids/", todo: "run braid import-backlog" }
          : { key: "no-braids", reason: "it has no braids/ folder", todo: "plan a first braid with the braid skill (braid new)" },
      );
    }
  });
  attempt("braid-md", "BRAID.md", () => {
    const md = files.exists("BRAID.md") ? files.read("BRAID.md") : null;
    if (md === null) {
      problems.push({ key: "braid-md", reason: "BRAID.md is missing", todo: `add BRAID.md with front matter ${REQUIRED_KEYS.join(", ")}` });
      return;
    }
    const keys = braidMdKeys(md);
    if (typeof keys === "string") {
      problems.push({ key: "braid-md", reason: `BRAID.md is unreadable: ${keys}`, todo: "fix the front matter of BRAID.md" });
      return;
    }
    const missing = REQUIRED_KEYS.filter((k) => !keys.has(k));
    if (missing.length > 0) {
      problems.push({ key: "braid-md", reason: `BRAID.md has no ${missing.join(", ")} in its front matter`, todo: `add ${missing.join(", ")} to BRAID.md` });
    }
  });
  if (files.exists("braids")) {
    attempt("check", "braids/", () => {
      const errors = check();
      if (errors.length > 0) {
        problems.push({ key: "check", reason: `braid check reports ${errors.length} error${errors.length === 1 ? "" : "s"} (first: ${errors[0] ?? ""})`, todo: "run braid check and fix them" });
      }
    });
  }
  if (github !== null && github.status.state !== "ok") {
    problems.push({ key: "github", reason: `GitHub can't be read (${github.status.reason})`, todo: GITHUB_TODO });
  }
  return problems;
}

/** What `braid check` said about a read of the working tree: the same read (nothing changed) isn't checked again. */
const checked = new WeakMap<WorkingFiles, readonly string[]>();

/** `readiness` for the board: the files are read without blocking the process (`tree`: a read already made), and checked again only when they changed. */
export async function readinessAsync(folder: string, github: Github | null, tree?: Promise<WorkingFiles>): Promise<Problem[]> {
  try {
    const files = await (tree ?? readWorkingTree(folder));
    return readiness(folder, github, files, () => {
      let errors = checked.get(files);
      if (errors === undefined) {
        errors = checkBraids(folder, { tree: files, related: false }).errors;
        checked.set(files, errors);
      }
      return errors;
    });
  } catch (error) {
    return [{ key: "check", reason: `braids/ can't be read (${error instanceof Error ? error.message : String(error)})`, todo: "run braid check and fix them" }];
  }
}

/** One line per problem, for the board's startup and `braid status`. */
export function problemLine(p: Problem): string {
  return `not ready: ${p.reason}; ${p.todo}`;
}
