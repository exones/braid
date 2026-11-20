// Is a folder a working braid project? One function says what is wrong and what to do, so the board and
// `braid status` can tell an empty board from a project that isn't set up. Nothing is stored: it is computed at each read.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Github } from "../board/github.js";
import { checkBraids } from "./check.js";

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
function braidMdKeys(file: string): Set<string> | string {
  const text = readFileSync(file, "utf8").replace(/^﻿/, "");
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
export function readiness(folder: string, github: Github | null): Problem[] {
  const problems: Problem[] = [];
  const attempt = (key: ProblemKey, what: string, work: () => void): void => {
    try {
      work();
    } catch (error) {
      problems.push({ key, reason: `${what} can't be read (${error instanceof Error ? error.message : String(error)})`, todo: `fix the permissions or the file, then run braid check` });
    }
  };
  attempt("no-braids", "braids/", () => {
    if (!existsSync(join(folder, "braids"))) {
      problems.push(
        existsSync(join(folder, "backlog"))
          ? { key: "no-braids", reason: "it has backlog/ but no braids/", todo: "run braid import-backlog" }
          : { key: "no-braids", reason: "it has no braids/ folder", todo: "plan a first braid with the braid skill (braid new)" },
      );
    }
  });
  attempt("braid-md", "BRAID.md", () => {
    const md = join(folder, "BRAID.md");
    if (!existsSync(md)) {
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
  if (existsSync(join(folder, "braids"))) {
    attempt("check", "braids/", () => {
      const errors = checkBraids(folder).errors;
      if (errors.length > 0) {
        problems.push({ key: "check", reason: `braid check reports ${errors.length} error${errors.length === 1 ? "" : "s"} (first: ${errors[0] ?? ""})`, todo: "run braid check and fix them" });
      }
    });
  }
  if (github !== null && github.status.state !== "ok") {
    problems.push({ key: "github", reason: `GitHub can't be read (${github.status.reason})`, todo: "install gh, run gh auth login, and make sure this repository is on GitHub" });
  }
  return problems;
}

/** One line per problem, for the board's startup and `braid status`. */
export function problemLine(p: Problem): string {
  return `not ready: ${p.reason}; ${p.todo}`;
}
