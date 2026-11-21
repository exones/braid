// Which folders under the worktrees root hold a repository's braid worktrees.
import { basename, join } from "node:path";
import { braidHome } from "../notify/config.js";
import { readProjects, samePath } from "../projects/list.js";
import { mainCheckoutOf, repoNameOf, worktreesDir } from "./worktrees.js";

/** Two folder names are one folder: compared like `folderKey` does, without case on Windows. */
const sameFolder = (a: string, b: string): boolean => (process.platform === "win32" ? a.toLowerCase() === b.toLowerCase() : a === b);

/**
 * The folders holding this repository's braid worktrees, the one new items go to first. A repository listed in
 * `~/.braid/projects.json` gets `<worktrees>/<project name>` (names are unique, so two projects whose checkouts
 * have the same folder name stay apart); the folder named for the checkout (`<worktrees>/<repo>`, where every
 * worktree lived before 0053/B) follows when it differs, because worktrees made there stay where they are and
 * are still found. A repository that is not listed, or a list that can't be read, has just the folder name.
 */
export function agentsDirs(root: string, env: NodeJS.ProcessEnv = process.env, home: string = braidHome()): string[] {
  const legacy = join(worktreesDir(env), repoNameOf(root) ?? basename(root));
  const main = mainCheckoutOf(root);
  let name: string | undefined;
  try {
    name = main === null ? undefined : readProjects(home).find((p) => samePath(p.path, main))?.name;
  } catch {
    // an unreadable list is `braid projects`' to report; worktrees keep the folder name
  }
  return name === undefined || sameFolder(name, basename(legacy)) ? [legacy] : [join(worktreesDir(env), name), legacy];
}

/** The folder new items' worktrees go to (`<worktrees>/<project name>`, or `<worktrees>/<repo>` for an unlisted repository). */
export function agentsDir(root: string, env: NodeJS.ProcessEnv = process.env, home: string = braidHome()): string {
  return agentsDirs(root, env, home)[0] ?? join(worktreesDir(env), basename(root));
}
