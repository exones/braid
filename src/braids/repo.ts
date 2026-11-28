// The two values every refresh asks Git for: a root's main checkout and its repository name. Each is read once per
// root and kept for the process's life; neither changes under a running board.
import { basename, dirname, resolve } from "node:path";
import { gitAsync, gitSync } from "./gitio.js";

const mains = new Map<string, string>();
const titles = new Map<string, string>();

/** Forgets the cached values, for tests that change a repository under a running process. */
export function resetRepoCache(): void {
  mains.clear();
  titles.clear();
}

const key = (root: string): string => resolve(root);

function fromCommonDir(root: string, out: string): string {
  const dir = resolve(root, out.trim());
  return basename(dir) === ".git" ? dirname(dir) : dir;
}

/** The main checkout's folder, also from inside a worktree; null when `root` is not a repository (not cached). */
export function mainCheckoutOf(root: string): string | null {
  const k = key(root);
  const known = mains.get(k);
  if (known !== undefined) {
    return known;
  }
  const r = gitSync(root, ["rev-parse", "--git-common-dir"]);
  if (r.status !== 0) {
    return null;
  }
  const main = fromCommonDir(root, r.stdout);
  mains.set(k, main);
  return main;
}

/** `mainCheckoutOf` without blocking. */
export async function mainCheckoutOfAsync(root: string): Promise<string | null> {
  const k = key(root);
  const known = mains.get(k);
  if (known !== undefined) {
    return known;
  }
  const r = await gitAsync(root, ["rev-parse", "--git-common-dir"]);
  if (r.status !== 0) {
    return null;
  }
  const main = fromCommonDir(root, r.stdout);
  mains.set(k, main);
  return main;
}

/** The main checkout's folder, also from inside a worktree; throws when `root` is not a repository. */
export function mainCheckout(root: string): string {
  const main = mainCheckoutOf(root);
  if (main === null) {
    const r = gitSync(root, ["rev-parse", "--git-common-dir"]);
    throw new Error(`can't read the repository: ${(r.stderr || "").trim()}`);
  }
  return main;
}

/** `mainCheckout` without blocking. */
export async function mainCheckoutAsync(root: string): Promise<string> {
  const main = await mainCheckoutOfAsync(root);
  if (main === null) {
    const r = await gitAsync(root, ["rev-parse", "--git-common-dir"]);
    throw new Error(`can't read the repository: ${r.stderr.trim()}`);
  }
  return main;
}

/** The repository's folder name: the main checkout's folder; null when `root` is not a repository. */
export function repoNameOf(root: string): string | null {
  const main = mainCheckoutOf(root);
  return main === null ? null : basename(main).replace(/\.git$/, "");
}

const nameOfUrl = (url: string): string | undefined => /[/:]([^/:]+?)(?:\.git)?\/?$/.exec(url)?.[1];

/** The GitHub repository's name from `origin`'s URL; the checkout's folder name when there is no `origin`. */
export function originRepoName(root: string): string {
  const k = key(root);
  const known = titles.get(k);
  if (known !== undefined) {
    return known;
  }
  const r = gitSync(root, ["remote", "get-url", "origin"]);
  const name = nameOfUrl(r.status === 0 ? r.stdout.trim() : "") ?? repoNameOf(root) ?? basename(root);
  titles.set(k, name);
  return name;
}

/** `originRepoName` without blocking. */
export async function originRepoNameAsync(root: string): Promise<string> {
  const k = key(root);
  const known = titles.get(k);
  if (known !== undefined) {
    return known;
  }
  const r = await gitAsync(root, ["remote", "get-url", "origin"]);
  const main = await mainCheckoutOfAsync(root);
  const name = nameOfUrl(r.status === 0 ? r.stdout.trim() : "") ?? (main === null ? null : basename(main).replace(/\.git$/, "")) ?? basename(root);
  titles.set(k, name);
  return name;
}
