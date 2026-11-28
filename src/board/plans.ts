// The programmes of a project: each `pm/<slug>` branch's plan file, read the way the braid branches are (one
// `git for-each-ref`, then one `git cat-file --batch`). A local branch wins over `origin/pm/<slug>`: the PM works in
// a worktree of this repository, so the local ref is the newest. Nothing here fails the board: a plan that can't be
// read or parsed comes back with its reason, and a project with no Git gives no programmes.
import { catBatch, gitAsync } from "../braids/gitio.js";
import { FormatError } from "../braids/frontmatter.js";
import { parsePlan, planPath, type Plan } from "../braids/plan.js";

export interface PlanRead {
  readonly slug: string;
  /** The ref it was read from: `pm/<slug>` or `origin/pm/<slug>`. */
  readonly branch: string;
  readonly plan: Plan | null;
  /** Why the plan can't be shown: `line 4: state is …`; null when it parsed. */
  readonly error: string | null;
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** The last plans read per root, with the refs and their commits they were read at. */
const last = new Map<string, { readonly key: string; readonly plans: readonly PlanRead[] }>();

/** The newest plans of every `pm/*` branch of the repository at `root`, slug order; read again only when a tip moved. */
export async function readPlans(root: string): Promise<PlanRead[]> {
  const refs = await gitAsync(root, ["for-each-ref", "--format=%(refname) %(objectname)", "refs/heads/pm/", "refs/remotes/origin/pm/"]);
  if (refs.status !== 0) {
    return [];
  }
  const had = last.get(root);
  if (had?.key === refs.stdout) {
    return [...had.plans];
  }
  const chosen = new Map<string, string>();
  for (const ref of refs.stdout.split("\n").map((l) => l.split(" ")[0] ?? "").filter((l) => l !== "")) {
    const local = /^refs\/heads\/pm\/(.+)$/.exec(ref)?.[1];
    const remote = /^refs\/remotes\/origin\/pm\/(.+)$/.exec(ref)?.[1];
    const slug = local ?? remote;
    if (slug === undefined || !SLUG.test(slug) || (remote !== undefined && chosen.has(slug))) {
      continue;
    }
    chosen.set(slug, local !== undefined ? `pm/${slug}` : `origin/pm/${slug}`);
  }
  const slugs = [...chosen.keys()].sort();
  if (slugs.length === 0) {
    return [];
  }
  let texts: (string | null)[];
  try {
    texts = await catBatch(root, slugs.map((s) => `${chosen.get(s) ?? ""}:${planPath(s)}`));
  } catch {
    texts = slugs.map(() => null);
  }
  const plans = slugs.map((slug, i) => planOf(slug, chosen.get(slug) ?? `pm/${slug}`, texts[i] ?? null));
  if (texts.every((t) => t !== null)) {
    last.set(root, { key: refs.stdout, plans });
  }
  return [...plans];
}

/** One plan as the board shows it. */
export function planOf(slug: string, branch: string, text: string | null): PlanRead {
  if (text === null) {
    return { slug, branch, plan: null, error: `no ${planPath(slug)} on ${branch}` };
  }
  try {
    const plan = parsePlan(text, planPath(slug));
    if (plan.programme !== slug) {
      return { slug, branch, plan: null, error: `programme is ${plan.programme}, but the branch is pm/${slug}` };
    }
    return { slug, branch, plan, error: null };
  } catch (error) {
    if (error instanceof FormatError) {
      return { slug, branch, plan: null, error: error.message };
    }
    throw error;
  }
}
