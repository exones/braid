// The title of a braid thread: `<emoji> <repo> <id> <role>: <title>`. One builder, one parser.
import { spawnSync } from "node:child_process";
import { basename } from "node:path";
import { repoNameOf } from "./worktrees.js";

export const ROLES = { coordinator: "🧠", worker: "💻", review: "👀", research: "🧪" } as const;
export type TitleRole = keyof typeof ROLES;

export function threadTitle(repo: string, id: string, role: TitleRole, title: string): string {
  return `${ROLES[role]} ${repo} ${id} ${role}: ${title}`;
}

export interface ParsedTitle {
  readonly repo: string;
  /** `0009` or `0009/D`. */
  readonly id: string;
  readonly role: TitleRole;
  readonly title: string;
}

/** Reads a thread title, with or without the leading emoji (older threads have none); null for any other title. */
export function parseThreadTitle(text: string): ParsedTitle | null {
  const m = /^(?:[^\x00-\x7F]+\s+)?(\S+) (\d{4}(?:\/[A-Z])?) (coordinator|worker|review|research): (.*)$/.exec(text);
  return m === null ? null : { repo: m[1] ?? "", id: m[2] ?? "", role: m[3] as TitleRole, title: m[4] ?? "" };
}

/** The GitHub repository's name from `origin`'s URL; the checkout's folder name (`repoNameOf`) when there is no `origin`. */
export function titleRepoName(root: string): string {
  const r = spawnSync("git", ["remote", "get-url", "origin"], { cwd: root, encoding: "utf8" });
  const url = r.status === 0 ? r.stdout.trim() : "";
  const name = /[/:]([^/:]+?)(?:\.git)?\/?$/.exec(url)?.[1];
  return name ?? repoNameOf(root) ?? basename(root);
}
