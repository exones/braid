// Requests: what the coordinator needs from the user, kept in one local file under `.braid/` of the
// main checkout (found from any worktree). Only braid commands write it; it is never committed.
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";

export const KINDS = ["review", "question", "decision", "plan"] as const;
export type Kind = (typeof KINDS)[number];

export interface Request {
  /** The item: `0015` or `0015/C`. */
  readonly id: string;
  readonly kind: Kind;
  /** One line: what is needed from the user. */
  readonly text: string;
  /** The stop case the request comes from (`ask --key`), when given. */
  readonly key?: string;
  /** When it was opened, ISO. */
  readonly at: string;
  /** The asking thread (its id), when given. */
  readonly thread: string | null;
  /** A review request: the PR and the head commit handed over. */
  readonly pr?: number;
  readonly head?: string;
}

/** What a PR is now, for the self-closing rule. */
export type PrNow = { readonly state: string; readonly head: string } | null;

/** The main checkout's folder, also from inside a worktree. */
export function mainCheckout(root: string): string {
  const r = spawnSync("git", ["rev-parse", "--git-common-dir"], { cwd: root, encoding: "utf8" });
  if (r.status !== 0) {
    throw new Error(`can't read the repository: ${(r.stderr || "").trim()}`);
  }
  const dir = resolve(root, r.stdout.trim());
  return basename(dir) === ".git" ? dirname(dir) : dir;
}

export function requestsFile(root: string): string {
  return join(mainCheckout(root), ".braid", "requests.json");
}

export function loadRequests(root: string): Request[] {
  let raw: string;
  try {
    raw = readFileSync(requestsFile(root), "utf8");
  } catch {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Request[]) : [];
  } catch {
    return [];
  }
}

/** Writes the whole list to a temporary file next to the store, then renames it over the store. */
export function saveRequests(root: string, list: readonly Request[]): void {
  const file = requestsFile(root);
  mkdirSync(dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(list, null, 2)}\n`);
  renameSync(tmp, file);
}

/** Opens a request; an earlier one on the same item is replaced. */
export function openRequest(root: string, request: Request): void {
  saveRequests(root, [...loadRequests(root).filter((r) => r.id !== request.id), request]);
}

/** Closes the item's request; true when there was one. */
export function closeRequest(root: string, id: string): boolean {
  const list = loadRequests(root);
  const rest = list.filter((r) => r.id !== id);
  if (rest.length === list.length) {
    return false;
  }
  saveRequests(root, rest);
  return true;
}

/** A review request is void when its PR is no longer open or is at another head; a PR that can't be read (null) leaves it. */
export function voided(request: Request, pr: PrNow): boolean {
  return request.kind === "review" && pr !== null && (pr.state !== "OPEN" || (request.head !== undefined && pr.head !== request.head));
}

/** The open requests, with the void review requests dropped from the store. */
export function liveRequests(root: string, prOf: (number: number) => PrNow): Request[] {
  const list = loadRequests(root);
  const live = list.filter((r) => !(r.pr !== undefined && voided(r, prOf(r.pr))));
  if (live.length !== list.length) {
    saveRequests(root, live);
  }
  return live;
}
