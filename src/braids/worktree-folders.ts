// Which folder under the worktrees root holds a repository's braid worktrees.
import { basename, join } from "node:path";
import { braidHome } from "../notify/config.js";
import { readProjects, samePath } from "../projects/list.js";
import { mainCheckoutOf, repoNameOf, worktreesDir } from "./worktrees.js";

/**
 * The folder of this repository's braid worktrees: `<worktrees>/<project name>` for a repository listed in
 * `~/.braid/projects.json` (names are unique, so two projects whose checkouts have the same folder name stay
 * apart), else, or when the list can't be read, `<worktrees>/<repo>`, the folder named for the checkout.
 */
export function agentsDir(root: string, env: NodeJS.ProcessEnv = process.env, home: string = braidHome()): string {
  const main = mainCheckoutOf(root);
  let name: string | undefined;
  try {
    name = main === null ? undefined : readProjects(home).find((p) => samePath(p.path, main))?.name;
  } catch {
    // an unreadable list is `braid projects`' to report; worktrees keep the folder name
  }
  return join(worktreesDir(env), name ?? repoNameOf(root) ?? basename(root));
}
