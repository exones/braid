// `braid launch <id> --role worker|review|research`: what a coordinator does before `delegate_task`, in one call: the limits check
// for the role's model, a worker's branch (no worktree), and the `delegate_task` input printed as JSON. With `--child <thread id>` it
// records the child `delegate_task` returned. It prints; it never calls T3 to launch.
import { loadKnownBraids } from "../braids/branches.js";
import { LimitsError, readModelLines, roleLines, type ModelLine } from "../braids/limits.js";
import type { ChildRole } from "../braids/reviews.js";
import { threadTitle, titleRepoName } from "../braids/title.js";
import { runGh, type GhRunner } from "../board/github.js";
import { normaliseId, UsageError } from "./braids.js";
import { read, type Sources } from "./coordinate.js";
import { view } from "./done.js";
import { find, parse, str } from "./edit.js";
import { limitsCommand, PAUSE_EXIT } from "./limits.js";
import { itemId, recordChild } from "./requests.js";
import type { T3Runner } from "../board/t3.js";
import { startBranch, target } from "./start.js";

const USAGE = "usage: braid launch <id> --role worker|review|research [--thread <coordinator thread id>] [--pr <n>] [--focus <text>] [--question <text>] | braid launch <id> --role <role> --child <thread id>";

/** The role's key in BRAID.md `models`, its `delegate_task` role, isolation, title role and skill. */
const ROLES = {
  worker: { models: "worker", task: "implementation", isolation: "worktree", title: "worker", skill: "braid-worker" },
  review: { models: "reviewer", task: "review", isolation: "worktree", title: "review", skill: "braid-reviewer" },
  research: { models: "researcher", task: "research", isolation: "shared", title: "research", skill: "braid-researcher" },
} as const;

export interface LaunchOptions {
  /** The provider caches folder, as `braid limits` reads it. */
  readonly caches?: string;
  readonly now?: () => Date;
  readonly src?: Sources;
  readonly gh?: GhRunner;
  readonly t3?: T3Runner;
}

export interface LaunchResult {
  readonly stdout: string;
  readonly stderr: string;
  readonly code: number;
}

export async function launchCommand(root: string, args: readonly string[], opts: LaunchOptions = {}): Promise<LaunchResult> {
  const { positionals, values } = parse("braid launch", args, {
    role: { type: "string" },
    thread: { type: "string" },
    pr: { type: "string" },
    focus: { type: "string" },
    question: { type: "string" },
    child: { type: "string" },
  });
  const role = str(values, "role");
  if (positionals.length !== 1 || role === undefined || !Object.hasOwn(ROLES, role)) {
    throw new UsageError(USAGE);
  }
  const r = ROLES[role as ChildRole];
  const child = str(values, "child");
  if (child !== undefined) {
    return { stdout: await recordChild(root, itemId(root, positionals[0], "braid launch"), child, role as ChildRole, false, { ...(opts.now === undefined ? {} : { now: opts.now }), ...(opts.t3 === undefined ? {} : { t3: opts.t3 }) }), stderr: "", code: 0 };
  }

  const id = normaliseId(positionals[0] ?? "");
  const [number = "", letter = null] = id.split("/");
  const item = find(loadKnownBraids(root, number), id, "braid launch").item;
  const label = (key: string) => item.brief.labels.find((l) => l.startsWith(`${key}:`))?.slice(key.length + 1) ?? null;

  // 1. The limits check for the role's model.
  const checked = limitsCommand(root, ["--role", r.models, ...(label("tier") === null ? [] : ["--tier", label("tier") ?? ""]), ...(label("kind") === null ? [] : ["--kind", label("kind") ?? ""])], { ...(opts.caches === undefined ? {} : { caches: opts.caches }), ...(opts.now === undefined ? {} : { now: opts.now() }) });
  if (checked.code === PAUSE_EXIT) {
    return { stdout: "", stderr: `${checked.stdout}nothing was started: the provider is paused\n`, code: PAUSE_EXIT };
  }
  let line: ModelLine[];
  try {
    line = roleLines(readModelLines(root), r.models, label("tier"), label("kind"));
  } catch (error) {
    throw error instanceof LimitsError ? new UsageError(error.message) : error;
  }
  if (line.length !== 1 || line[0]?.model == null) {
    throw new UsageError(`BRAID.md models.${r.models} gives ${line.length} lines for ${id}; give the item a tier:<S|M|L> or kind:<kind> label (or one plain model line)`);
  }
  const model = line[0];
  const thread = str(values, "thread") ?? null;
  const coordinator = thread === null ? "the thread that launched you" : `thread ${thread}`;
  const need = (what: string, v: string | undefined): string => {
    if (v === undefined || v === "") {
      throw new UsageError(`braid launch --role ${role} needs ${what}; nothing was started`);
    }
    return v;
  };

  // 2. The worker's branch; the reviewer's PR; the researcher's question. Anything missing fails before a branch is made.
  let task: string;
  if (role === "worker") {
    const w = await read(root, number, "launch", opts.src ?? {});
    const t = target(w, letter);
    const b = startBranch(root, w, t, id, letter, false, thread);
    const sha = b.commit.slice(0, 8);
    task = [
      `You are the braid worker for ${id}. Use the ${r.skill} skill (sibling folder of the braid skill).`,
      `Brief: \`braid view ${id}\`. Branch: ${b.branch} at ${sha}. Open the PR into ${b.base}.`,
      `Switch T3's checkout to the branch: \`git fetch\`, \`git switch ${b.branch}\`.`,
      `Send your result to ${coordinator}. Your thread id: \`parentThreadId\` from \`orchestrator_capabilities\`.`,
      "End your run with `PR <url>, head <sha>, checks <state>`.",
    ].join("\n");
  } else if (role === "review") {
    const n = Number(/(\d+)\s*$/.exec(need("--pr <n>", str(values, "pr")))?.[1]);
    if (!Number.isInteger(n) || n <= 0) {
      throw new UsageError(`--pr needs a PR number; got: ${str(values, "pr") ?? ""}`);
    }
    const pr = view(opts.gh ?? runGh, root, n);
    task = [
      `You are the braid reviewer for ${id}. Use the ${r.skill} skill (sibling folder of the braid skill).`,
      `PR: ${pr.url}, head ${pr.headRefOid.slice(0, 8)}.${str(values, "focus") === undefined ? "" : ` Focus: ${str(values, "focus")}.`}`,
      `Send your result to ${coordinator}.`,
    ].join("\n");
  } else {
    task = [
      `You are a braid researcher for ${id}. Use the ${r.skill} skill (sibling folder of the braid skill).`,
      `Question: ${need("--question <text>", str(values, "question"))}. Decision it feeds: the plan of ${id}. Time box: 20 minutes. Source ids start at S1.`,
    ].join("\n");
  }

  const input = {
    role: r.task,
    isolation: r.isolation,
    mode: "async",
    title: threadTitle(titleRepoName(root), id, r.title, item.brief.title),
    target: { providerInstanceId: model.instanceId, model: model.model, options: model.options },
    task,
  };
  return { stdout: `${JSON.stringify(input, null, 2)}\n`, stderr: "", code: 0 };
}
