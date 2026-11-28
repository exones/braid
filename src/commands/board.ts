import { spawn } from "node:child_process";
import { gitAsync } from "../braids/gitio.js";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { existsSync, readFileSync, statSync, watch, type FSWatcher } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { loadLiveBraidsAsync, treeOf } from "../braids/branches.js";
import { FormatError } from "../braids/frontmatter.js";
import type { Braid, Item, Tree, WorkingFiles } from "../braids/store.js";
import { loadTree } from "../braids/store.js";
import { readWorkingTree } from "../braids/worktree.js";
import { apiBraids, apiGithub, apiPanelSignals, apiPanelTree, apiPlans, apiSignals, apiT3, apiTree, DEMO_START, demoBraids, demoGithub, demoInbox, demoLimits, demoPlans, demoProblems, demoSignals, demoT3, demoTree, EMPTY_INBOX, notesProblems } from "../board/demo.js";
import { combine, projectInfo, projectsParam, tagProgrammes, type Held } from "../board/combined.js";
import { feed, READ_TIMEOUT_MS, type Feed, type Good } from "../board/feed.js";
import { steerer, type Steerer } from "../board/steerer.js";
import { ACTING_STALE_MS, actingBoard, providerKey, repoLease, type ActingBoard } from "../board/acting.js";
import { steps, wakePageAnswer, waker } from "../board/wake.js";
import { nudger } from "../board/nudge.js";
import { reminder } from "../board/remind.js";
import { limitPusher } from "../notify/notifier.js";
import { inboxOfAsync, type InboxData } from "../board/inbox.js";
import { readGithubAsync, runGhAsync, type Github, type GhRunnerAsync } from "../board/github.js";
import { coordinatorWarning, mergeOf, toCard, toDetail, withUnblocks, type BoardData, type StartContext } from "../board/model.js";
import { failureReader, type Failure } from "../board/failure.js";
import { readInputs, readStartContext } from "../board/inputs.js";

export { readStartContext };
import { t3codeUrl } from "../board/marks.js";
import { problemLine, readinessAsync, type Problem } from "../braids/readiness.js";
import { ROLES, threadTitle, titleRepoName } from "../braids/title.js";
import { readSignalsAsync, type ReadSignals } from "../board/signals.js";
import { fetchBranchAsync } from "../braids/gitbranch.js";
import { closing, handleOf, REQUESTS } from "../braids/requests.js";
import { boardAnswer } from "./requests.js";
import { readLimitsView, type LimitsView } from "../board/limits.js";
import { loadPauses, markResumed, patchPause, reasonOf, type Pause } from "../braids/pauses.js";
import { resumeMode } from "../board/pause.js";
import { readPlans, type PlanRead } from "../board/plans.js";
import { IDEA_BRANCH, ideaPlanning, mainCheckout, readT3, runT3, showThread, type T3, type T3Runner } from "../board/t3.js";
import { readTailnet, runTailscale, tailnetAddress, tailnetHosts, whoisGate, type Gate, type TailscaleRunner } from "../board/tailnet.js";
import { normaliseId, UsageError } from "./braids.js";
import { notifyLine } from "./notify.js";
import { readConfig, tokenOf } from "../notify/config.js";
import { ntfySender } from "../notify/sender.js";
import { callbackPage, SignInError } from "../t3/oauth.js";
import { keyringStore, NoSecretStore } from "../t3/secret.js";
import { readSettings } from "../t3/settings.js";
import { boardSignIn, demoSignIn, type BoardSignIn } from "../t3/signin.js";
import { statusLine, type T3Push } from "../t3/words.js";
import { readProjects, type Project } from "../projects/list.js";
import { notifier } from "../notify/notifier.js";
import { liveAddresses, PROBE_MS, removeAddress, SESSION_PATH, VERSION_HEADER, writeAddress, type Probe } from "../board/address.js";
import { readVersion } from "../version.js";
import { serviceLog, stopWithConsole } from "./service.js";

const TYPES: Readonly<Record<string, string>> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
};

/** `dist/web`, next to the compiled `dist/commands/board.js`. */
export function defaultWebDir(): string {
  return fileURLToPath(new URL("../web", import.meta.url));
}

interface Reply {
  readonly status: number;
  readonly body: string;
}

function json(status: number, body: unknown): Reply {
  return { status, body: JSON.stringify(body) };
}

/** Where the board gets its data: the repository, `gh` and `t3`, or the built-in samples. */
export interface Sources {
  readonly repo: string;
  /** A stored last-good read the feed starts from (the demo's failing `mail` project); the first real read runs after it. */
  readonly seed?: Sources;
  braids(): Braid[] | Promise<Braid[]>;
  github(): Github | Promise<Github>;
  t3(): Promise<T3>;
  signals(github: Github): ReadSignals | Promise<ReadSignals>;
  /** Why idle threads of open items failed, by thread id; absent: none. A failed read gives none. */
  failures?(t3: T3, braids: readonly Braid[]): Promise<ReadonlyMap<string, Failure>>;
  /** Fetches `braid-requests` from origin; the board calls it only on a fresh read (the Refresh button), alongside GitHub and T3, and reads the local refs otherwise. Absent: never fetched. */
  fetchRequests?(): Promise<unknown>;
  /** The plans of the project's programmes (`pm/*` branches); absent: none. A failed read gives none. */
  plans?(): Promise<PlanRead[]>;
  tree(item: Item): Tree;
  /** A folder whose changes refresh the page; null for none. */
  readonly watch: string | null;
  /** What BRAID.md says about the main branch and the coordinator's model. */
  start(): StartContext;
  /** The providers' usage against their thresholds, from T3's caches (no `t3` call); absent: not shown. */
  limits?(t3: T3, pauses: ReadonlyMap<string, Pause>): LimitsView | null;
  /** The open inbox entries; `fetch` (the Refresh button) fetches `braid-inbox` from origin first. */
  inbox(fetch: boolean): InboxData | Promise<InboxData>;
  /** The T3 project folder (the main checkout). */
  project(): string;
  /** What stops the folder from working as a braid project, given the GitHub read (null: GitHub unchecked); absent: nothing does (the demo shows its own). */
  readiness?(github: Github | null): Problem[] | Promise<Problem[]>;
  /** The action registered under `name`, or undefined. `POST /api/action/<name>` runs it. */
  action(name: string): Action | undefined;
  /** Hands each complete snapshot to the notifier (docs/board.md, "Notifications"); returns at once. Absent: no pushes (the demo). */
  readonly notify?: (board: BoardData) => void;
  /** Hands each complete snapshot to the board's limits pause (docs/board.md, "Provider limits"); returns at once. Absent: the board pauses nothing (`--no-pause`, the demo, tests). */
  readonly act?: (good: Good) => void;
}

/** What an action does with the JSON body of its request; its result is the JSON reply. */
export type Action = (body: unknown, board?: () => Promise<BoardData | null>) => unknown;

/** The request header that carries the session token. */
export const TOKEN_HEADER = "x-braid-token";

const MERGE_BODY = /^[0-9a-f]{7,40}$/;

/**
 * Merge on request: asks the coordinator that handed the PR over to merge it. Nothing is merged here.
 * The body is `{ id, head }`, the item and the head commit the confirmation showed; the server reads
 * GitHub and the requests again and refuses (400, with the reason) unless the item still has an open
 * review request with a coordinator thread, its PR still has that head, and its checks are green. Then it
 * sends that thread `Merge #<n> at <head>, from the board.` with `t3 thread send`.
 */
export function mergeAction(src: Sources, root: string, t3: T3Runner): Action {
  return async (body) => {
    const b = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
    if (typeof b["id"] !== "string" || typeof b["head"] !== "string" || !MERGE_BODY.test(b["head"])) {
      throw new UsageError("merge needs { id, head }: the item and the head commit the confirmation showed");
    }
    const id = normaliseId(b["id"]);
    const shown = b["head"];
    const { github, t3: read, sig } = await readInputs(src);
    const merge = mergeOf(id, github, sig, read);
    if (merge === null) {
      throw new UsageError(`Merge: ${id} has no open review request`);
    }
    if (merge.reason !== null) {
      throw new UsageError(`Merge: ${merge.reason}`);
    }
    const current = [...github.prs.values()].find((p) => p.number === merge.pr)?.head ?? merge.head;
    if (current === undefined || current === null || !current.startsWith(shown)) {
      throw new UsageError(`Not merged: the PR head moved. You confirmed ${shown.slice(0, 7)}, the PR is now ${(current ?? "unknown").slice(0, 7)}. Check the new commit, then ask again.`);
    }
    const thread = sig.requests.get(id)?.thread ?? null;
    if (thread === null) {
      throw new UsageError("Merge: no coordinator thread on the review request");
    }
    const message = `Merge #${merge.pr} at ${current}, from the board.`;
    const sent = await t3(root, ["thread", "send", thread, message]);
    if (sent.error !== undefined || sent.status !== 0) {
      const first = (sent.stderr.trim().split("\n")[0] ?? "") || sent.error?.message || "t3 failed";
      throw new UsageError(`Not asked: ${first}`);
    }
    return { ok: true, id, pr: merge.pr, head: current, message };
  };
}

const jsonOf = (text: string): Record<string, unknown> | null => {
  try {
    const v: unknown = JSON.parse(text);
    return typeof v === "object" && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
};
const strOf = (v: unknown): string | null => (typeof v === "string" && v !== "" ? v : null);
const asObj = (v: unknown): Record<string, unknown> | null => (typeof v === "object" && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null);

/** The first message of a new coordinator: the brief's own words, then where its worktree stands. */
export function coordinatorMessage(id: string, start: { base: string; branch: string; planned: boolean }): string {
  const where = `This worktree is on \`${start.branch}\`, started from \`${start.base}\`: `;
  return `Use the braid skill and run ${id}.

${
    start.planned
      ? `${where}you are resuming a braid you didn't plan: read the braid skill's "Resuming" first. Switch to the braid branch (\`git switch ${start.base.replace(/^origin\//, "")}\`). If that fails because it is checked out elsewhere, keep working on \`${start.branch}\`, merged up to the braid branch, or \`braid ask\`.`
      : `${where}the item already exists in braids/ on the main branch and has no braid branch yet. Detail it or run it as its state says; don't plan it again.`
  }`;
}

export interface GitResult {
  readonly status: number | null;
  readonly stdout: string;
  readonly stderr: string;
}
/** Runs `git` in a folder; Start's fetch and branch checks go through it. It may answer later: the board keeps serving while `git` runs. */
export type GitRunner = (root: string, args: readonly string[]) => GitResult | Promise<GitResult>;
export const runGit: GitRunner = async (root, args) => {
  const r = await gitAsync(root, args);
  return { status: r.status, stdout: r.stdout, stderr: r.stderr };
};

const firstLine = (r: GitResult): string => r.stderr.trim().split("\n")[0] || "git failed";

/** Every branch name, local and on origin. A listing that fails is a `Start: <reason>` refusal: a name is never guessed free. */
async function takenBranches(git: GitRunner, root: string, who = "Start"): Promise<Set<string>> {
  const local = await git(root, ["branch", "--list", "--format=%(refname:short)"]);
  const remote = await git(root, ["ls-remote", "--heads", "origin"]);
  if (local.status !== 0 || remote.status !== 0) {
    throw new UsageError(`${who}: branches can't be listed (${firstLine(local.status !== 0 ? local : remote)})`);
  }
  const names = new Set(local.stdout.split(/\r?\n/).map((l) => l.trim()).filter((l) => l !== ""));
  for (const m of remote.stdout.matchAll(/\srefs\/heads\/(\S+)/g)) {
    names.add(m[1] ?? "");
  }
  return names;
}

/**
 * Start: launches a new coordinator thread for a To Do braid with `t3 thread start`, with no model flags
 * (T3 uses the project's default), the first message on standard input and a worktree from the braid branch
 * or main branch after a fetch (the name gets -2, -3 when taken). The body is `{ id }`. The server
 * recomputes the card from fresh reads and refuses (400, `Start: <reason>`) when Start is off. After the launch
 * it reads the thread and warns when its provider or model differ from BRAID.md's coordinator.
 */
export function startAction(src: Sources, root: string, t3: T3Runner, git: GitRunner = runGit): Action {
  return async (body) => {
    const raw = typeof body === "object" && body !== null ? (body as Record<string, unknown>)["id"] : undefined;
    if (typeof raw !== "string") {
      throw new UsageError("start needs { id }: the braid to start");
    }
    const id = normaliseId(raw);
    const { braids, github, t3: read, sig, start: ctx } = await readInputs(src);
    const braid = braids.find((b) => b.number === id);
    if (braid === undefined) {
      throw new UsageError(`Start: no braid ${id}`);
    }
    const card = toCard(braid, github, read, sig, ctx);
    if (card.start.reason !== null) {
      throw new UsageError(`Start: ${card.start.reason}`);
    }
    const fetched = await git(root, ["fetch", "origin"]);
    if (fetched.status !== 0) {
      throw new UsageError(`Start: git fetch failed (${firstLine(fetched)})`);
    }
    // A braid branch only this checkout has can't come from origin; the main branch must.
    let base = card.start.base;
    if ((await git(root, ["rev-parse", "--verify", "--quiet", base])).status !== 0) {
      const local = base.replace(/^origin\//, "");
      if (!card.start.planned || (await git(root, ["rev-parse", "--verify", "--quiet", local])).status !== 0) {
        throw new UsageError(`Start: ${base} not found after the fetch`);
      }
      base = local;
    }
    const taken = await takenBranches(git, root);
    let branch = card.start.branch;
    for (let n = 2; taken.has(branch); n++) {
      branch = `${card.start.branch}-${n}`;
    }
    if (!/^[\w./-]+$/.test(base) || !/^[\w./-]+$/.test(branch)) {
      throw new UsageError(`Start: the branch names ${base} and ${branch} are not plain`);
    }
    // The title goes through cmd.exe on Windows: no quote or shell character may reach it.
    const title = threadTitle(src.repo, id, "coordinator", card.title).replace(/["%^&|<>!\s]+/g, " ").trim();
    const args = ["thread", "start", src.project(), "-", "--title", title, "--worktree", base, "--branch", branch, "--json"];
    const started = await t3(root, args, coordinatorMessage(id, { ...card.start, base, branch }));
    if (started.error !== undefined || started.status !== 0) {
      const first = (started.stderr.trim().split("\n")[0] ?? "") || started.error?.message || "t3 failed";
      throw new UsageError(`Not started: ${first}`);
    }
    const out = jsonOf(started.stdout);
    const thread = strOf(out?.["threadId"]) ?? strOf(out?.["id"]) ?? strOf(asObj(out?.["thread"])?.["threadId"]);
    let warning: string | null = null;
    let link: string | null = strOf(out?.["link"]);
    if (thread !== null) {
      const shown = jsonOf((await t3(root, ["thread", "show", thread, "--json"])).stdout);
      const t = asObj(shown?.["thread"]) ?? shown;
      if (t !== null) {
        link = strOf(t["link"]) ?? link;
        warning = coordinatorWarning({ provider: strOf(t["providerInstanceId"]), model: strOf(t["model"]) }, ctx);
      }
    }
    return { ok: true, id, thread, link, base, branch, planned: card.start.planned, warning };
  };
}

/** The first message of a coordinator launched by Promote to Braid: plan a braid from this idea, nothing more. */
export function promoteMessage(idea: { id: string; title: string; text: string }): string {
  const full = [idea.title, idea.text].filter((t) => t !== "").join("\n\n");
  const quoted = full.split("\n").map((l) => (l === "" ? ">" : `> ${l}`)).join("\n");
  return `Use the braid skill and plan a braid from the idea ${idea.id}: ${idea.title}.

The idea, in full:

${quoted}

This came from the board's Promote to Braid, which is the user's request to plan this idea (not to start it). Plan as usual: ask for the plan's approval; once it is approved, take the idea out of the inbox with \`braid inbox take ${idea.id} --into <braid ids>\`.
`;
}

/**
 * Promote to Braid: launches a coordinator thread that plans a braid from an open idea. The body is `{ id }`, an idea id.
 * The server reads the inbox again (with a fetch of `braid-inbox`) and refuses (400, `Promote: <reason>`) when the
 * entry isn't an open idea, T3 isn't reachable or a coordinator for the idea runs. Then, like Start: fetch, a free
 * branch `coordinator/idea-<id>` from `origin/<main>`, `t3 thread start` with no model flags, the model warning.
 * Nothing is written to `braid-inbox`: the coordinator takes the idea after the plan is approved.
 */
export function promoteAction(src: Sources, root: string, t3: T3Runner, git: GitRunner = runGit): Action {
  return async (body) => {
    const raw = typeof body === "object" && body !== null ? (body as Record<string, unknown>)["id"] : undefined;
    if (typeof raw !== "string" || raw === "") {
      throw new UsageError("promote needs { id }: the idea to promote");
    }
    const inbox = await src.inbox(true);
    const idea = inbox.ideas.find((i) => i.id === raw);
    if (idea === undefined) {
      throw new UsageError(`Promote: no open idea ${raw}${inbox.leftovers.some((l) => l.id === raw) ? " (it is a leftover; leftovers go through sweeps)" : ""}`);
    }
    const state = await src.t3();
    if (state.status.state !== "ok") {
      throw new UsageError(`Promote: T3 isn't reachable (${state.status.reason})`);
    }
    if (ideaPlanning(state, idea.id) !== null) {
      throw new UsageError(`Promote: a coordinator is already planning idea ${idea.id}`);
    }
    const ctx = src.start();
    const base = `origin/${ctx.main}`;
    const fetched = await git(root, ["fetch", "origin"]);
    if (fetched.status !== 0) {
      throw new UsageError(`Promote: git fetch failed (${firstLine(fetched)})`);
    }
    if ((await git(root, ["rev-parse", "--verify", "--quiet", base])).status !== 0) {
      throw new UsageError(`Promote: ${base} not found after the fetch`);
    }
    const taken = await takenBranches(git, root, "Promote");
    const wanted = `${IDEA_BRANCH}${idea.id}`;
    let branch = wanted;
    for (let n = 2; taken.has(branch); n++) {
      branch = `${wanted}-${n}`;
    }
    if (!/^[\w./-]+$/.test(base) || !/^[\w./-]+$/.test(branch)) {
      throw new UsageError(`Promote: the branch names ${base} and ${branch} are not plain`);
    }
    // The title goes through cmd.exe on Windows: no quote or shell character may reach it.
    const title = `${ROLES.coordinator} ${src.repo} idea coordinator: ${idea.title}`.replace(/["%^&|<>!\s]+/g, " ").trim();
    const args = ["thread", "start", src.project(), "-", "--title", title, "--worktree", base, "--branch", branch, "--json"];
    const started = await t3(root, args, promoteMessage(idea));
    if (started.error !== undefined || started.status !== 0) {
      const first = (started.stderr.trim().split("\n")[0] ?? "") || started.error?.message || "t3 failed";
      throw new UsageError(`Not started: ${first}`);
    }
    const out = jsonOf(started.stdout);
    const thread = strOf(out?.["threadId"]) ?? strOf(out?.["id"]) ?? strOf(asObj(out?.["thread"])?.["threadId"]);
    let warning: string | null = null;
    let link: string | null = strOf(out?.["link"]);
    if (thread !== null) {
      const shown = jsonOf((await t3(root, ["thread", "show", thread, "--json"])).stdout);
      const t = asObj(shown?.["thread"]) ?? shown;
      if (t !== null) {
        link = strOf(t["link"]) ?? link;
        warning = coordinatorWarning({ provider: strOf(t["providerInstanceId"]), model: strOf(t["model"]) }, ctx);
      }
    }
    return { ok: true, id: idea.id, thread, link, base, branch, warning };
  };
}

export type Opener = (url: string) => Promise<void>;

/** Opens a URL with the OS (the T3 desktop app registers `t3code:`): no shell string is built, the URL is one argument. */
export const openWithOs: Opener = (url) =>
  new Promise((done, fail) => {
    const [cmd, args] = process.platform === "win32" ? (["cmd", ["/c", "start", "", url]] as const) : process.platform === "darwin" ? (["open", [url]] as const) : (["xdg-open", [url]] as const);
    const child = spawn(cmd, args, { stdio: "ignore", detached: true, windowsHide: true });
    child.once("error", fail);
    child.once("spawn", () => {
      child.unref();
      done();
    });
  });

export { t3codeUrl };

/**
 * Open thread: opens the item's thread in the T3 desktop app. The body is `{ id }`, a braid or strand, or
 * `{ id, thread: "coordinator" }`, a braid whose coordinator thread to open (running, else the newest idle one).
 * Without `thread` the server picks by the same rule as the board's button (a strand's thread; a braid's agent
 * thread, else its coordinator). The link comes from the snapshot (T3 is read fresh only when the snapshot has
 * none), so a client can't pass a URL (any `url` or `link` in the body is ignored). Refuses (400) when there is
 * no such thread, for a strand with `thread`, or for another `thread` value.
 */
async function openIdea(src: Sources, idea: unknown, snapshot: Parameters<Action>[1], open: Opener): Promise<unknown> {
  if (typeof idea !== "string" || idea === "") {
    throw new UsageError("open needs { idea }: the idea whose planning thread to open");
  }
  // The link comes from the snapshot, else from T3 read again; a client never passes one.
  let link = (await snapshot?.())?.inbox.ideas.find((i) => i.id === idea)?.planning?.link ?? null;
  if (link === null) {
    link = ideaPlanning(await src.t3(), idea)?.link ?? null;
  }
  if (link === null) {
    throw new UsageError(`Open thread: no coordinator is planning idea ${idea}`);
  }
  const url = t3codeUrl(link);
  if (url === null) {
    throw new UsageError(`Open thread: T3's link isn't one the app can open (${link})`);
  }
  try {
    await open(url);
  } catch (e) {
    throw new UsageError(`Open thread: the OS couldn't open ${url} (${e instanceof Error ? e.message : "failed"})`);
  }
  return { ok: true, idea, url };
}

/** Opens a programme's PM thread; the link comes from the snapshot's programmes only. */
async function openProgramme(slug: unknown, snapshot: Parameters<Action>[1], open: Opener): Promise<unknown> {
  if (typeof slug !== "string" || slug === "") {
    throw new UsageError("open needs { programme }: the slug of the programme whose PM thread to open");
  }
  const link = (await snapshot?.())?.programmes.find((p) => p.slug === slug)?.link ?? null;
  if (link === null) {
    throw new UsageError(`Open thread: programme ${slug} has no PM thread T3 knows`);
  }
  const url = t3codeUrl(link);
  if (url === null) {
    throw new UsageError(`Open thread: T3's link isn't one the app can open (${link})`);
  }
  try {
    await open(url);
  } catch (e) {
    throw new UsageError(`Open thread: the OS couldn't open ${url} (${e instanceof Error ? e.message : "failed"})`);
  }
  return { ok: true, programme: slug, url };
}

export function openAction(src: Sources, open: Opener = openWithOs): Action {
  return async (body, snapshot) => {
    const fields = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
    const idea = fields["idea"];
    if (idea !== undefined) {
      return openIdea(src, idea, snapshot, open);
    }
    if (fields["programme"] !== undefined) {
      return openProgramme(fields["programme"], snapshot, open);
    }
    const raw = fields["id"];
    if (typeof raw !== "string") {
      throw new UsageError("open needs { id }: the braid or strand whose thread to open");
    }
    // `thread: "coordinator"` asks for the braid's coordinator thread instead of its agent's; the link is still the server's pick.
    const want = fields["thread"];
    if (want !== undefined && want !== "coordinator") {
      throw new UsageError('open: thread can only be "coordinator"');
    }
    const id = normaliseId(raw);
    const [number, letter] = id.split("/");
    // The snapshot has the card (and so the braid) already: the braids are loaded again only when it doesn't.
    const known = (await snapshot?.())?.braids.find((c) => c.id === number);
    const loaded = known === undefined ? (await src.braids()).find((b) => b.number === number) : undefined;
    if (known === undefined && loaded === undefined) {
      throw new UsageError(`Open thread: no braid ${number}`);
    }
    if (want === "coordinator" && letter !== undefined) {
      throw new UsageError(`Open thread: ${id} is a strand; only a braid has a coordinator thread`);
    }
    type OpenCard = { thread: string | null; coordinator: { link: string | null } | null; strands: readonly { id: string; thread: string | null }[] };
    const linkOf = (card: OpenCard): string | null =>
      want === "coordinator" ? (card.coordinator?.link ?? null) : letter === undefined ? (card.thread ?? card.coordinator?.link ?? null) : (card.strands.find((s) => s.id === id)?.thread ?? null);
    // A thread's link doesn't change: the snapshot has it. Only when it has none is T3 read again.
    let link = known === undefined ? null : linkOf(known);
    if (link === null) {
      const read = await readInputs(src);
      const braid = read.braids.find((b) => b.number === number);
      if (braid === undefined) {
        throw new UsageError(`Open thread: no braid ${number}`);
      }
      link = linkOf(toCard(braid, read.github, read.t3, read.sig, read.start));
    }
    if (link === null) {
      throw new UsageError(`Open thread: ${id} has no ${want === "coordinator" ? "coordinator " : ""}thread`);
    }
    const url = t3codeUrl(link);
    if (url === null) {
      throw new UsageError(`Open thread: T3's link isn't one the app can open (${link})`);
    }
    try {
      await open(url);
    } catch (e) {
      throw new UsageError(`Open thread: the OS couldn't open ${url} (${e instanceof Error ? e.message : "failed"})`);
    }
    return { ok: true, id, url };
  };
}

/**
 * Resume now (0074/D): the button on a paused braid's card (`{ braid }`) or a paused programme's card (`{ programme }`). It marks each
 * limit record of it with a resume asked for (`resuming`, not yet tried); the acting board sends it through the one resume path at
 * once (this board is poked) or at its next refresh: a braid without a PM resumes directly, a PM-run braid or a programme asks the
 * PM. A hold is never touched: the action refuses a braid that is held. A later Go (P5's holds) reuses this action with its reason.
 */
export function resumeAction(root: string, now: () => Date = () => new Date()): Action {
  return async (body, board) => {
    const b = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
    const why = typeof b["reason"] === "string" && b["reason"] !== "" ? b["reason"] : "now";
    let braids: string[];
    if (typeof b["braid"] === "string" && /^\d{4}$/.test(b["braid"])) {
      braids = [b["braid"]];
    } else if (typeof b["programme"] === "string" && b["programme"] !== "") {
      const data = board === undefined ? null : await board();
      const p = data?.programmes.find((x) => x.slug === b["programme"]);
      if (p === undefined) {
        throw new UsageError(`Resume now: no programme ${String(b["programme"])}`);
      }
      braids = [...p.braids];
    } else {
      throw new UsageError("resume needs { braid } (a braid number) or { programme } (a programme's slug)");
    }
    const records = loadPauses(root).pauses.filter((p) => braids.includes(p.braid));
    if (records.some((p) => reasonOf(p) === "hold") && braids.length === 1) {
      throw new UsageError(`Resume now: ${braids[0] ?? ""} is held, not paused for a limit; a hold is lifted by its own Go`);
    }
    const at = now().toISOString();
    const marked = records
      .filter((p) => reasonOf(p) === "limit")
      .flatMap((p) => {
        const direct = typeof b["programme"] === "string" ? false : resumeMode(p) === "direct";
        const r = patchPause(root, p.braid, (q) => ({ ...q, resuming: { why, at, direct, askedAt: null, failedSince: q.resuming?.failedSince ?? null, lastTry: null, error: q.resuming?.error ?? null } }));
        return r === null ? [] : [r];
      });
    if (marked.length === 0) {
      throw new UsageError(`Resume now: ${braids.join(", ")} ${braids.length === 1 ? "is" : "are"} not paused for a limit`);
    }
    // The board pauses these providers again only on a reading checked after this click: a cache from before a reset can't undo it.
    markResumed(root, [...new Set(marked.flatMap((p) => (p.provider === null ? [] : [p.provider])))], new Date(at));
    return { ok: true, braids: marked.map((p) => p.braid), mode: marked.every((p) => p.resuming?.direct === true) ? "direct" : "pm" };
  };
}

/**
 * Answer (0082/D): the user answers an open request from the board's page, `{ handle, text }` (a request of the project the
 * body names; `text` an option letter or one line). Recorded as `braid answer <handle> <text>` records it, as the user's
 * answer (`boardAnswer`), then the asking thread is woken at once, whoever the request was for (`wakePageAnswer`). A request
 * no longer open, a wait, or a handle this project's record doesn't have is refused with the reason. Both listeners, no
 * confirmation (the user, 2026-11-27).
 *
 * Whether the asking thread is archived comes from the states of the board's last T3 read (`states`), else, for a thread
 * that read doesn't name, from one `thread show` of it: a whole read on the request path can take a minute (0077/J).
 */
export function answerAction(states: () => ReadonlyMap<string, string> | undefined, root: string, t3: T3Runner, now: () => Date = () => new Date()): Action {
  return async (body) => {
    const b = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
    if (typeof b["handle"] !== "string" || b["handle"].trim() === "" || typeof b["text"] !== "string") {
      throw new UsageError("answer needs { handle, text }: the request's name or code and an option letter or one line of text");
    }
    const done = await boardAnswer(root, b["handle"], b["text"]);
    const r = done.request;
    const state = r.thread === null ? null : (states()?.get(r.thread) ?? (await showThread(t3, root, r.thread).catch(() => null))?.status);
    const wake = await wakePageAnswer(t3, root, r, now(), state === "archived");
    return { ok: true, handle: handleOf(r), id: r.id, answer: closing(r)?.text ?? "", woken: wake.woken, wake: wake.why, warning: done.warning };
  };
}

export function repoSources(root: string, gh: GhRunnerAsync = runGhAsync, t3: T3Runner = runT3): Sources {
  // The main checkout is found with git once per root and cached: asked here, when the project is set up, so no read, wake or action runs that git.
  mainCheckout(root);
  // The working tree as the last read saw it: one read serves the braids, the readiness check and the item pages.
  let working: Promise<WorkingFiles> | undefined;
  let seen: WorkingFiles | undefined;
  const readTree = (): Promise<WorkingFiles> => (working = readWorkingTree(root).then((tree) => (seen = tree)));
  // The last good T3 read, for the answer action.
  let lastT3: T3 | undefined;
  const src: Sources = {
    repo: titleRepoName(root),
    braids: () => loadLiveBraidsAsync(root, undefined, readTree()),
    github: () => readGithubAsync(root, gh),
    t3: () => readT3(root, { run: t3 }).then((read) => (read.status.state === "ok" ? (lastT3 = read) : read)),
    signals: (github) => readSignalsAsync(root, github),
    fetchRequests: () => fetchBranchAsync(root, REQUESTS),
    plans: () => readPlans(root),
    failures: failureReader(t3, root),
    limits: (threads, pauses) => readLimitsView(root, threads, pauses),
    // An item page is asked for only after a good read, so the working tree's files are there already.
    tree: (item) => (item.source === null && seen !== undefined ? seen : treeOf(root, item)),
    watch: join(root, "braids"),
    start: () => readStartContext(root),
    inbox: (fetch) => inboxOfAsync(root, fetch),
    project: () => mainCheckout(root),
    readiness: (github) => readinessAsync(root, github, working ?? readTree()),
    action: (name) => (Object.hasOwn(actions, name) ? actions[name] : undefined),
  };
  const actions: Readonly<Record<string, Action>> = { merge: mergeAction(src, root, t3), start: startAction(src, root, t3), promote: promoteAction(src, root, t3), open: openAction(src), resume: resumeAction(root), answer: answerAction(() => lastT3?.states, root, t3) };
  return src;
}

/** The notifier of a repository's board, with the per-user settings; a no-op when the main checkout can't be found. Only `runBoard` adds it, so tests of the board never read `~/.braid`. */
/** The board's limits pause of one project: its snapshots go to the board-wide steerer, and its limits say which board acts (0074/B). */
function acting(name: string, root: string, own: Sources, steer: Steerer, leases: ActingBoard | null): Sources {
  const inner = own.limits;
  const limits =
    inner === undefined || leases === null
      ? inner
      : (threads: T3, pauses: ReadonlyMap<string, Pause>): LimitsView | null => {
          const view = inner(threads, pauses);
          if (view === null) {
            return null;
          }
          const repo = repoLease(root);
          return { ...view, acting: leases.lines([{ key: repo.key, label: own.repo }, ...view.providers.map((p) => ({ key: providerKey(p.instanceId), label: p.instanceId }))]) };
        };
  // Resume now goes out at once: the steerer is poked after the action marks the records (it acts only for the providers it holds).
  const action = (name: string): Action | undefined => {
    const a = own.action(name);
    return a === undefined || name !== "resume"
      ? a
      : async (body, board) => {
          const out = await a(body, board);
          steer.poke();
          return out;
        };
  };
  return { ...own, ...(limits === undefined ? {} : { limits }), action, act: (good) => steer.observe({ name, root, repo: own.repo, folder: () => own.project() }, good) };
}

/** The start line of the limits pause: which mode is on. */
export function limitsLine(mode: "demo" | "off" | "on"): string {
  if (mode === "demo") {
    return "Limits: shown only (demo: nothing is paused)";
  }
  if (mode === "off") {
    return "Limits: shown only (--no-pause: the board pauses and resumes nothing, and sends no wake, reminder or nudge)";
  }
  return "Limits: pauses the working agents over a threshold by sending each its pause text, counts their replies and resumes them after the reset (--no-pause turns this off, and the wakes, reminders and nudges)";
}

export function boardNotifier(root: string): (board: BoardData) => void {
  try {
    return notifier({ file: join(mainCheckout(root), ".braid", "notified.json") });
  } catch {
    return () => {};
  }
}

/** The samples of `braid board --demo`: no repository, `gh` or `t3` is touched. */
export function demoSources(t3Down = false, notReady = false): Sources {
  return {
    ...(notReady ? { readiness: () => demoProblems() } : {}),
    repo: "demo",
    braids: demoBraids,
    github: () => demoGithub(),
    t3: () => Promise.resolve(demoT3(t3Down)),
    limits: (threads, pauses) => demoLimits(threads, pauses),
    signals: () => demoSignals(),
    plans: () => Promise.resolve(demoPlans()),
    tree: () => demoTree(),
    watch: null,
    start: () => DEMO_START,
    inbox: () => demoInbox(),
    project: () => ".",
    // A demo board accepts every action and fakes the result; nothing is written.
    action: () => () => ({ ok: true, demo: true }),
  };
}

function tokenMatches(given: string | string[] | undefined, token: string): boolean {
  if (typeof given !== "string") {
    return false;
  }
  const a = Buffer.from(given);
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}

const MAX_BODY = 64 * 1024;

function readBody(req: IncomingMessage): Promise<string | null> {
  return new Promise((resolveBody, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        resolveBody(null);
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolveBody(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

/** The request header every board page sends with an action; a cross-site page can't send it without a CORS preflight, which the board never grants. */
export const REQUEST_HEADER = "x-braid-request";

/** Where a request came in: the local listener (Host, Origin and the run's token, D50) or the Tailscale one (whois, Host, Origin and the request header, D60). */
type Listener = { readonly kind: "local"; readonly origin: () => string; readonly token: string } | { readonly kind: "tailnet"; readonly hosts: () => readonly string[]; readonly gate: Gate };

const TAILNET_REFUSED = "The board couldn't confirm through Tailscale who is asking (or this isn't the Host the board listens on), so it refused this request. Refresh the page; the board asks again.";
const HOST_REFUSED = "This request didn't come from this board's own page (its Host or Origin doesn't match), so the board refused it. Use the page that `braid board` opened.";

/**
 * Whether any request on the local listener may be served: its Host must be `127.0.0.1:<port>` or `localhost:<port>`
 * with the board's own port, so a page on another name that resolves to 127.0.0.1 (DNS rebinding) reads nothing.
 * Actions are stricter still (`hostOk`: only the address the page was opened on).
 */
export const localHostOk = (origin: string, host: string | undefined): boolean => {
  const port = origin.slice(origin.lastIndexOf(":") + 1);
  const given = (host ?? "").toLowerCase();
  return port !== "" && (given === `127.0.0.1:${port}` || given === `localhost:${port}`);
};

const hostOk = (listener: Listener, host: string | undefined): boolean =>
  host !== undefined && (listener.kind === "local" ? host === listener.origin().slice("http://".length) : listener.hosts().includes(host.toLowerCase()));

/** The project an action names: its `Sources` and its snapshot; a string is the refusal. */
type Pick = (body: unknown) => { readonly src: Sources; readonly board: () => Promise<BoardData | null> } | string;

/**
 * Runs `POST /api/action/<name>`: on the local listener only the page this run opened may call it; on the Tailscale listener,
 * a board page on it. The body's `project` names the project the action is for (`pick` resolves it among the served ones).
 */
async function postAction(req: IncomingMessage, url: URL, listener: Listener, pick: Pick): Promise<Reply> {
  const refusal = actionRefused(req, listener);
  if (refusal !== null) {
    return refusal;
  }
  const name = decodeURIComponent(url.pathname.slice("/api/action/".length));
  if (listener.kind === "tailnet" && name === "open") {
    return json(403, { error: "Open thread opens T3 on the machine running the board; on the phone the thread's app link opens your own T3 app" });
  }
  const text = await readBody(req);
  if (text === null) {
    return json(413, { error: "body too large" });
  }
  let body: unknown;
  try {
    body = text === "" ? {} : JSON.parse(text);
  } catch {
    return json(400, { error: "body is not JSON" });
  }
  const target = pick(body);
  if (typeof target === "string") {
    return json(400, { error: target });
  }
  const action = target.src.action(name);
  if (action === undefined) {
    return json(404, { error: `no action ${name}` });
  }
  try {
    return json(200, await action(body, target.board));
  } catch (error) {
    if (error instanceof UsageError) {
      return json(400, { error: error.message });
    }
    throw error;
  }
}

/** Why an action request may not run (the board's own page only: Host, Origin, and the run's token or the Tailscale request header); null when it may. */
function actionRefused(req: IncomingMessage, listener: Listener): Reply | null {
  const host = req.headers.host;
  const origin = req.headers.origin;
  if (!hostOk(listener, host) || (origin !== undefined && origin.toLowerCase() !== `http://${(host ?? "").toLowerCase()}`)) {
    return json(403, { error: HOST_REFUSED });
  }
  if (listener.kind === "tailnet") {
    if (req.headers[REQUEST_HEADER] !== "1") {
      return json(403, { error: `The request is missing the ${REQUEST_HEADER} header that this board's page sends, so the board refused it. Reload the board page.` });
    }
  } else {
    const given = req.headers[TOKEN_HEADER];
    if (typeof given !== "string" || given === "") {
      return json(403, { error: "This page has no token for this board run. Open the URL that `braid board` printed (it ends in #token=...), or the one `braid board --url` prints." });
    }
    if (!tokenMatches(given, listener.token)) {
      return json(403, { error: "This page's token is from another `braid board` run (a second tab, or a tab kept across a board restart). Open the URL that `braid board` printed now, or the one `braid board --url` prints." });
    }
  }
  return null;
}

/** The board's T3 sign-in routes. */
export const T3_CALLBACK_PATH = "/t3/callback";

/**
 * `POST /api/t3/<login|cancel|logout>` (docs/board.md, "T3 sign-in"): gated like every action. `login` starts a sign-in
 * from the host only (the approval page must open where T3 runs); from the Tailscale listener it starts nothing. `logout`
 * works from both: it only takes access away. The reply never holds the token.
 */
async function t3Action(req: IncomingMessage, url: URL, listener: Listener, signin: BoardSignIn, origin: string): Promise<Reply> {
  const refusal = actionRefused(req, listener);
  if (refusal !== null) {
    return refusal;
  }
  const verb = url.pathname.slice("/api/t3/".length);
  try {
    switch (verb) {
      case "login":
        if (listener.kind === "tailnet") {
          return json(403, { error: "Sign in from the board on the PC, or run braid t3 login: T3's approval page has to open where T3 runs." });
        }
        return json(200, { ...(await signin.start(`${origin}${T3_CALLBACK_PATH}`)), view: signin.view() });
      case "cancel":
        signin.cancel();
        return json(200, { view: signin.view() });
      case "logout": {
        const out = await signin.signOut();
        return json(200, { ...out, view: signin.view() });
      }
      default:
        return json(404, { error: `no T3 action ${verb}` });
    }
  } catch (error) {
    if (error instanceof SignInError || error instanceof NoSecretStore) {
      return json(400, { error: error.message, view: signin.view() });
    }
    throw error;
  }
}

/** How often open pages are told to refresh. */
export const REFRESH_MS = 30_000;
/** How long `Started.close()` waits for the server's close event. */
const CLOSE_TIMEOUT_MS = 10_000;

/** The second listener of `braid board --host`: a Tailscale address, the names it answers to and the identity check. */
export interface TailnetListen {
  /** The address to bind: one of this machine's Tailscale IPs (tests bind 127.0.0.1). */
  readonly address: string;
  /** The MagicDNS name, or null. */
  readonly name: string | null;
  readonly gate: Gate;
}

export interface Started {
  readonly server: Server;
  readonly url: string;
  readonly token: string;
  /** The Tailscale listener's server and URL (`http://<MagicDNS name>:<port>/`); closing `server` closes it too. */
  readonly tailnet?: { readonly server: Server; readonly url: string };
  /** Closes the server (and the Tailscale listener) and resolves once the HTTP server's `close` event has fired (interval and watchers torn down; a stuck close rejects after 10 s) and the read in flight has ended, so no `git`, `gh` or `t3` it started still runs. */
  close(): Promise<void>;
}

/** Listens on `address`, on `port` when it is free there, else on a free port; `strict` (an explicit `--port`) refuses a port in use instead. */
function listen(server: Server, address: string, port: number, strict = false): Promise<number> {
  const at = (p: number) =>
    new Promise<number>((done, fail) => {
      const failed = (e: Error) => fail(e);
      server.once("error", failed);
      server.listen(p, address, () => {
        server.off("error", failed);
        done((server.address() as AddressInfo).port);
      });
    });
  return port === 0 ? at(0) : at(port).catch((e: NodeJS.ErrnoException) => (e.code === "EADDRINUSE" && !strict ? at(0) : Promise.reject(e)));
}

const inUse = (port: number, address: string, e: unknown): Error =>
  (e as NodeJS.ErrnoException).code === "EADDRINUSE" ? new UsageError(`--port ${port} is already in use on ${address}; pick another port`) : e instanceof Error ? e : new Error(String(e));

/** One project the board serves: its name (from the project list, else the repository's) and where its data comes from. */
export interface Member {
  readonly name: string;
  readonly src: Sources;
}

/** The projects to serve, asked again at each refresh: a project gone from it is dropped and sends nothing more. */
export type Roster = () => readonly Member[];

/** What `pick` says when an action names no project, or one that isn't served. */
export function unknownProject(asked: unknown, names: readonly string[]): string {
  const served = names.length === 0 ? "none" : names.join(", ");
  if (asked === undefined) {
    return `Name the project this action is for: { project: <name> } (served: ${served})`;
  }
  return typeof asked === "string" && /[\\/:]/.test(asked)
    ? `An action names a listed project, never a folder path (served: ${served})`
    : `No project ${typeof asked === "string" ? asked : JSON.stringify(asked)} on this board (served: ${served})`;
}

/**
 * Starts the board server on 127.0.0.1 with a free port. Resolves once it is listening. `served` is one project's
 * `Sources` (served under its repository name) or a roster of projects, each with its own snapshot cycle
 * (src/board/feed.ts), watcher and notifier. Pages listen to `/api/events` and refetch on each message: every
 * `refreshMs` while the server runs, at once when a file under a project's `braids/` changes, and when a project's
 * read stored something. Actions are `POST /api/action/<name>` with `{ project, ... }` and need the run's session
 * `token` (a random one unless given) in the `x-braid-token` header. With `tailnet`, a second listener serves the
 * same board on a Tailscale address (D60): every request passes the whois gate and a Host check first, actions need
 * the `x-braid-request` header instead of the token, and `open` is refused. `fixedPort` (`--port`) is the port of
 * both listeners; one that is in use is refused (UsageError) and nothing stays listening.
 */
export function startBoardWith(
  served: Sources | Roster,
  webDir: string = defaultWebDir(),
  refreshMs: number = REFRESH_MS,
  token: string = randomBytes(24).toString("hex"),
  tailnet?: TailnetListen,
  fixedPort = 0,
  timeoutMs: number = READ_TIMEOUT_MS,
  signin?: BoardSignIn,
): Promise<Started> {
  const base = resolve(webDir);
  const single: readonly Member[] = typeof served === "function" ? [] : [{ name: served.repo, src: served }];
  const roster: Roster = typeof served === "function" ? served : () => single;
  const clients = new Set<ServerResponse>();
  let closed = false;
  const push = () => {
    if (closed) {
      return;
    }
    for (const c of clients) {
      c.write("data: refresh\n\n");
    }
  };
  type Entry = { readonly feed: Feed; watcher?: FSWatcher; debounce?: NodeJS.Timeout };
  let feeds = new Map<string, Entry>();
  const watchFolder = (entry: Entry): void => {
    const folder = entry.feed.src.watch;
    if (folder === null || !existsSync(folder)) {
      return;
    }
    try {
      const changed = (): void => {
        clearTimeout(entry.debounce);
        entry.debounce = setTimeout(() => void entry.feed.refresh(), 200);
        entry.debounce.unref();
      };
      const watcher = watch(folder, { recursive: true }, (event, name) => {
        // Reading the braids can report a change of a folder itself (Windows); that is no edit: an edit also reports its file.
        if (event === "change" && name !== null) {
          void stat(join(folder, name)).then((s) => (s.isDirectory() ? undefined : changed()), changed);
          return;
        }
        changed();
      });
      watcher.on("error", () => {});
      watcher.unref();
      entry.watcher = watcher;
    } catch {
      // The timed refresh still runs.
    }
  };
  /** Projects dropped from the roster: close() still waits for a read of theirs that runs. */
  const dropped: Entry[] = [];
  const drop = (entry: Entry): void => {
    dropped.push(entry);
    entry.feed.close();
    clearTimeout(entry.debounce);
    entry.watcher?.close();
  };
  /** Takes the roster as it is now: new projects start reading, removed ones stop (a read still running stores and sends nothing). */
  const sync = (): void => {
    if (closed) {
      return;
    }
    let members: readonly Member[];
    try {
      members = roster();
    } catch {
      return; // the roster can't be read now: keep serving the projects as they were
    }
    const next = new Map<string, Entry>();
    for (const m of members) {
      const had = feeds.get(m.name);
      if (had !== undefined && had.feed.src === m.src) {
        next.set(m.name, had);
        continue;
      }
      if (had !== undefined) {
        drop(had);
      }
      const entry: Entry = { feed: feed(m.src, { timeoutMs, changed: push }) };
      watchFolder(entry);
      next.set(m.name, entry);
    }
    for (const [name, entry] of feeds) {
      if (next.get(name) !== entry) {
        drop(entry);
      }
    }
    feeds = next;
  };
  const refreshAll = (): void => {
    sync();
    for (const entry of feeds.values()) {
      void entry.feed.refresh();
    }
  };
  sync();
  const held = async (name: string, f: Feed): Promise<Held> => ({ name, repo: f.src.repo, board: f.good()?.board, readAt: f.readAt(), failure: f.failure(), problems: f.good() === undefined ? ((await f.src.readiness?.(null)) ?? []) : [] });
  /** Answers `/api/board`, `/api/item`, `/api/all` and `/api/projects` from the snapshots: nothing is read from GitHub or T3 here. */
  const answer = async (url: URL, remote: boolean): Promise<Reply> => {
    const fresh = url.searchParams.get("fresh") === "1";
    if (fresh) {
      sync();
    }
    if (url.pathname === "/api/all" || url.pathname === "/api/projects") {
      const asked = url.pathname === "/api/all" ? projectsParam(url.searchParams.get("projects")) : null;
      const chosen = (asked ?? [...feeds.keys()]).flatMap((n) => {
        const entry = feeds.get(n);
        return entry === undefined ? [] : [[n, entry.feed] as const];
      });
      await Promise.all(chosen.map(([, f]) => f.ready(fresh)));
      const now = Date.now();
      const all = await Promise.all(chosen.map(([n, f]) => held(n, f)));
      return url.pathname === "/api/all"
        ? json(200, { ...combine(all, remote, (asked ?? []).filter((n) => !feeds.has(n)), now), t3SignIn: signin?.view() ?? null })
        : json(200, { remote, projects: all.map((h) => projectInfo(h, now)) });
    }
    if (url.pathname !== "/api/board" && url.pathname !== "/api/item") {
      return json(404, { error: "no such endpoint" });
    }
    // No project: the first one (the page itself always names the project).
    const asked = url.searchParams.get("project");
    const name = asked ?? feeds.keys().next().value;
    const entry = name === undefined ? undefined : feeds.get(name);
    if (name === undefined || entry === undefined) {
      return json(404, { error: asked === null ? "no project is served" : unknownProject(asked, [...feeds.keys()]) });
    }
    await entry.feed.ready(fresh);
    const good = entry.feed.good();
    try {
      if (good === undefined) {
        throw entry.feed.error();
      }
      if (url.pathname === "/api/board") {
        const readAt = entry.feed.readAt();
        return json(200, { ...good.board, programmes: tagProgrammes(name, good.board.programmes), remote, project: name, readAt: readAt === null ? null : new Date(readAt).toISOString(), failure: entry.feed.failure() });
      }
      const raw = url.searchParams.get("id");
      if (raw === null) {
        return json(400, { error: "id is required" });
      }
      const id = normaliseId(raw);
      const [number, letter] = id.split("/");
      const braid = good.braids.find((b) => b.number === number);
      const item = letter === undefined ? braid : braid?.strands.find((s) => s.letter === letter);
      if (braid === undefined || item === undefined) {
        return json(404, { error: `no item ${id}` });
      }
      return json(200, toDetail(entry.feed.src.tree(item), braid, item, good.github, good.t3, withUnblocks(good.braids, good.github, good.sig), good.start));
    } catch (error) {
      if (error instanceof UsageError) {
        return json(400, { error: error.message });
      }
      if (error instanceof FormatError) {
        return json(500, { error: `${error.file}: ${error.message}. Run braid check.` });
      }
      throw error;
    }
  };
  /** The project an action is for: the body's `project`, a served name; with one project served it may be left out. Never a folder. */
  const pick: Pick = (body) => {
    const asked = typeof body === "object" && body !== null ? (body as Record<string, unknown>)["project"] : undefined;
    const names = [...feeds.keys()];
    const name = asked === undefined && names.length === 1 ? names[0] : asked;
    const entry = typeof name === "string" ? feeds.get(name) : undefined;
    if (entry === undefined) {
      return unknownProject(asked, names);
    }
    return {
      src: entry.feed.src,
      board: async () => {
        await entry.feed.ready(false);
        return entry.feed.good()?.board ?? null;
      },
    };
  };
  let timer: NodeJS.Timeout | undefined;
  let origin = "";
  let hosts: string[] = [];
  const handle = async (req: IncomingMessage, res: ServerResponse, listener: Listener): Promise<void> => {
    try {
      if (listener.kind === "tailnet") {
        // Fail closed: who the peer is comes first, then whether it asked for this listener by name.
        const allowed = await listener.gate(req.socket.remoteAddress ?? "", req.socket.remotePort ?? 0);
        if (!allowed || !hostOk(listener, req.headers.host)) {
          const api = (req.url ?? "").startsWith("/api/");
          res.writeHead(403, { "content-type": api ? (TYPES[".json"] ?? "") : "text/plain", "cache-control": "no-store" }).end(api ? JSON.stringify({ error: TAILNET_REFUSED }) : "forbidden");
          return;
        }
      } else if (!localHostOk(listener.origin(), req.headers.host)) {
        // The page, the board data, the events and the actions alike: only this board's own address (DNS rebinding).
        const api = (req.url ?? "").startsWith("/api/");
        res.writeHead(403, { "content-type": api ? (TYPES[".json"] ?? "") : "text/plain" }).end(api ? JSON.stringify({ error: HOST_REFUSED }) : "forbidden");
        return;
      }
      const url = new URL(req.url ?? "/", "http://127.0.0.1");
      if (req.method === "POST" && url.pathname.startsWith("/api/t3/")) {
        const out = signin === undefined ? json(404, { error: "this board has no T3 sign-in" }) : await t3Action(req, url, listener, signin, origin);
        res.writeHead(out.status, { "content-type": TYPES[".json"] ?? "", "cache-control": "no-store" }).end(out.body);
        push();
        return;
      }
      if (url.pathname === T3_CALLBACK_PATH) {
        // T3's answer to a sign-in from the button: loopback only and no board token (T3 redirects the browser here); the
        // pending click's own state is the check, once, within 5 minutes. Anything else is 404. Nothing of it is logged.
        const answer = listener.kind === "local" && signin !== undefined && req.method === "GET" ? await signin.callback(url.searchParams) : ({ status: 404 } as const);
        if (answer.status === 404) {
          res.writeHead(404, { "content-type": "text/plain", "cache-control": "no-store" }).end("not found");
          return;
        }
        res.writeHead(answer.status, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "referrer-policy": "no-referrer" }).end(callbackPage(answer.ok, answer.words));
        push();
        return;
      }
      if (req.method === "POST" && url.pathname.startsWith("/api/action/")) {
        const out = await postAction(req, url, listener, pick);
        res.writeHead(out.status, { "content-type": TYPES[".json"] ?? "", "cache-control": "no-store" }).end(out.body);
        return;
      }
      if (req.method !== "GET" && req.method !== "HEAD") {
        res.writeHead(405).end();
        return;
      }
      if (url.pathname === SESSION_PATH && listener.kind === "local") {
        // Whether this run is the one an address file names (`braid board --url`): 204 for this run's token, else 403. It reads nothing.
        const given = req.headers[TOKEN_HEADER];
        const ok = typeof given === "string" && tokenMatches(given, listener.token);
        // The 204 also names the version this board started from (`braid board service status`).
        res.writeHead(ok ? 204 : 403, ok ? { "cache-control": "no-store", [VERSION_HEADER]: boardVersion() } : { "cache-control": "no-store" }).end();
        return;
      }
      if (url.pathname === "/api/events") {
        res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-store" });
        res.write(": open\n\n");
        clients.add(res);
        req.on("close", () => clients.delete(res));
        return;
      }
      if (url.pathname.startsWith("/api/")) {
        const out = await answer(url, listener.kind === "tailnet");
        res.writeHead(out.status, { "content-type": TYPES[".json"] ?? "", "cache-control": "no-store" }).end(out.body);
        return;
      }
      const file = resolve(base, `.${decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname)}`);
      if (!file.startsWith(base + sep) || !existsSync(file) || !statSync(file).isFile()) {
        res.writeHead(404, { "content-type": "text/plain" }).end("not found");
        return;
      }
      res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" }).end(readFileSync(file));
    } catch {
      if (!res.headersSent) {
        res.writeHead(500, { "content-type": "text/plain" });
      }
      res.end("error");
    }
  };
  const local: Listener = { kind: "local", origin: () => origin, token };
  const server = createServer((req, res) => void handle(req, res, local));
  const remote = tailnet === undefined ? undefined : createServer((req, res) => void handle(req, res, { kind: "tailnet", hosts: () => hosts, gate: tailnet.gate }));
  const stop = (): void => {
    closed = true;
    clearInterval(timer);
    signin?.close();
    for (const entry of feeds.values()) {
      drop(entry);
    }
  };
  server.on("close", () => {
    stop();
    if (remote?.listening === true) {
      remote.close();
      remote.closeAllConnections();
    }
  });
  return (async () => {
    const port = await listen(server, "127.0.0.1", fixedPort, fixedPort !== 0).catch((e: unknown) => {
      stop();
      throw fixedPort !== 0 ? inUse(fixedPort, "127.0.0.1", e) : e;
    });
    origin = `http://127.0.0.1:${port}`;
    let shared: Started["tailnet"];
    if (remote !== undefined && tailnet !== undefined) {
      try {
        const remotePort = await listen(remote, tailnet.address, port, fixedPort !== 0);
        hosts = tailnetHosts(tailnet.address, tailnet.name, remotePort).map((h) => h.toLowerCase());
        shared = { server: remote, url: `http://${hosts[hosts.length - 1] ?? ""}/` };
      } catch (e) {
        server.close();
        if (fixedPort !== 0) {
          throw inUse(fixedPort, tailnet.address, e);
        }
        throw new UsageError(`--host: can't listen on ${tailnet.address} (${e instanceof Error ? e.message : "failed"})`);
      }
    }
    timer = setInterval(refreshAll, refreshMs);
    timer.unref();
    const close = async (): Promise<void> => {
      if (server.listening) {
        // The server's close event runs stop(): the interval and the watchers are gone once it has fired.
        const closedEvent = new Promise<void>((done, fail) => {
          const timeout = setTimeout(() => fail(new Error(`the board did not close within ${CLOSE_TIMEOUT_MS / 1000} s`)), CLOSE_TIMEOUT_MS);
          timeout.unref();
          server.once("close", () => {
            clearTimeout(timeout);
            done();
          });
        });
        server.close();
        server.closeAllConnections();
        await closedEvent;
      }
      // A read that runs (and the one queued after it) still has children in its repository; wait for every project's, dropped ones included.
      await Promise.all([...feeds.values(), ...dropped].map((entry) => entry.feed.idle()));
    };
    return { server, url: `${origin}/`, token, close, ...(shared === undefined ? {} : { tailnet: shared }) };
  })();
}

/** Starts the board for the repository at `root` alone. */
export function startBoard(root: string, webDir: string = defaultWebDir(), gh: GhRunnerAsync = runGhAsync, t3: T3Runner = runT3, refreshMs: number = REFRESH_MS, tailnet?: TailnetListen, fixedPort = 0): Promise<Started> {
  return startBoardWith(repoSources(root, gh, t3), webDir, refreshMs, undefined, tailnet, fixedPort);
}

/**
 * Opens `url` in the default browser; a failure only means the user opens it by hand.
 * Windows goes through `start` (openWithOs): explorer.exe given an http URL with a `#token=` fragment opens a folder window instead.
 */
export function openBrowser(url: string): void {
  openWithOs(url).catch(() => {});
}

/** `--host <address>`'s Tailscale listener: the address checked against `tailscale status`, refused (UsageError) before anything listens. */
export async function tailnetListen(host: string, tailscale: TailscaleRunner = runTailscale): Promise<TailnetListen & { readonly owner: string }> {
  const tailnet = await readTailnet(tailscale);
  const address = tailnetAddress(host, tailnet);
  return { address, name: tailnet.name, owner: tailnet.owner, gate: whoisGate(tailnet.owner, tailscale) };
}

/** `gh`, `t3`, the project list and the notifiers as `braid board` runs them; tests pass stubs. */
export interface Runners {
  readonly gh?: GhRunnerAsync;
  readonly t3?: T3Runner;
  /** The project list, read at the start and again at each refresh; `readProjects()` unless given. */
  readonly projects?: () => readonly Project[];
  /** A project's notifier, given its main checkout; `boardNotifier` unless given. */
  readonly notifier?: (root: string) => (board: BoardData) => void;
  /** This board's acting leases (0074/B); `actingBoard` in `~/.braid/acting` unless given. */
  readonly acting?: ActingBoard;
  /** The board's T3 sign-in; null for none. Unless given, a real run reads the OS secret store, and a run with an injected `t3` (tests) has none. */
  readonly signin?: BoardSignIn | null;
}

/** Sends a T3 sign-in push through `braid notify`'s settings; with notifications off or not set up there is nothing to send. */
export function t3Pusher(): (push: T3Push) => Promise<void> {
  const send = ntfySender();
  return async (push) => {
    const config = readConfig();
    if (config === null || !config.enabled) {
      return;
    }
    await send(config, { title: push.title, body: push.body, tags: ["key"], priority: "high", click: null, sequence: "braid-t3-signin" }, tokenOf());
  };
}

/** The four sample projects of `braid board --demo`: the full sample (`demo`), a small one (`api`), one whose reads fail after the first (`mail`) and one that isn't ready (`notes`). */
export function demoMembers(t3Down = false, notReady = false): Member[] {
  const accept: Sources["action"] = () => () => ({ ok: true, demo: true });
  const small = (repo: string, braids: () => Braid[], github: () => Github, signals: () => ReadSignals, tree: () => Tree, problems: () => Problem[] | null, plans: () => PlanRead[] = () => []): Sources => {
    const listed = problems();
    return {
      ...(listed === null ? {} : { readiness: () => listed }),
      repo,
      braids,
      github,
      t3: () => Promise.resolve(apiT3()),
      signals,
      plans: () => Promise.resolve(plans()),
      tree,
      watch: null,
      start: () => DEMO_START,
      inbox: () => EMPTY_INBOX,
      project: () => ".",
      action: accept,
    };
  };
  // `mail`: every read fails, behind a stored last-good snapshot (`seed`), so even the first page shows the board with the failed-read marks.
  const working = small("mail", apiBraids, apiGithub, () => apiSignals(), apiTree, () => null);
  const mail: Sources = {
    ...working,
    seed: working,
    braids: () => {
      throw new Error("the mail repository can't be read (demo: a read that failed)");
    },
  };
  return [
    { name: "demo", src: demoSources(t3Down, notReady) },
    { name: "api", src: small("api", () => loadTree(apiPanelTree()), apiGithub, () => apiPanelSignals(), apiPanelTree, () => null, apiPlans) },
    { name: "mail", src: mail },
    { name: "notes", src: small("notes", () => [], () => ({ status: { state: "ok" }, prs: new Map() }), () => ({ ...apiSignals(), requests: new Map() }), apiTree, notesProblems) },
  ];
}

/** Takes `--flag <value>` out of `args`: the value (undefined when the flag is absent) and the rest. */
function valueFlag(args: readonly string[], flag: string, need: string): { value: string | undefined; rest: readonly string[] } {
  const at = args.indexOf(flag);
  if (at === -1) {
    return { value: undefined, rest: args };
  }
  const value = args[at + 1];
  if (value === undefined || value.startsWith("--")) {
    throw new UsageError(`${flag} needs ${need}`);
  }
  return { value, rest: [...args.slice(0, at), ...args.slice(at + 2)] };
}

export async function runBoard(root: string, args: readonly string[], tailscale: TailscaleRunner = runTailscale, run: Runners = {}): Promise<Started> {
  const flags = ["--no-open", "--no-pause", "--service", "--demo", "--demo-t3-down", "--demo-not-ready"];
  const { value: host, rest: afterHost } = valueFlag(args, "--host", "an address: tailscale, this machine's Tailscale IP or its MagicDNS name");
  const pat = afterHost.indexOf("--port");
  const portArg = pat === -1 ? undefined : afterHost[pat + 1];
  if (pat !== -1 && (portArg === undefined || !/^\d+$/.test(portArg) || Number(portArg) < 1 || Number(portArg) > 65535)) {
    throw new UsageError("--port needs a port number from 1 to 65535");
  }
  const fixedPort = portArg === undefined ? 0 : Number(portArg);
  const afterPort = pat === -1 ? afterHost : [...afterHost.slice(0, pat), ...afterHost.slice(pat + 2)];
  const { value: only, rest } = valueFlag(afterPort, "--project", "a project name from the project list (braid projects list)");
  const unknown = rest.filter((a) => !flags.includes(a));
  if (unknown.length > 0) {
    throw new UsageError(`braid board takes only ${flags.join(", ")}, --host <address>, --port <n>, --project <name>; got: ${unknown.join(" ")}`);
  }
  // `--service`: the run of `braid board service`'s task (0067/B). Its output also goes to ~/.braid/board-<port>.log,
  // opened first so even a refused start says why, and it stops when its headless console closes (the task stopped).
  const service = args.includes("--service");
  if (service && fixedPort === 0) {
    throw new UsageError("--service needs --port <n>: its log and its address file are per port");
  }
  if (service) {
    serviceLog(fixedPort, boardVersion());
  }
  const t3Down = args.includes("--demo-t3-down");
  const notReady = args.includes("--demo-not-ready");
  const demo = args.includes("--demo") || t3Down || notReady;
  // The list is read before anything listens: one braid can't read stops the start (ProjectsFileError, exit 2).
  const listed = run.projects ?? (() => readProjects());
  const list = demo ? [] : listed();
  const several = demo || list.length > 0;
  if (only !== undefined && !several) {
    throw new UsageError("--project picks a project from the project list, and the list is empty; add projects with braid projects add");
  }
  const names = demo ? demoMembers().map((m) => m.name) : list.map((p) => p.name);
  if (only !== undefined && !names.includes(only)) {
    throw new UsageError(`--project: no project ${only} in the list (${names.join(", ")})`);
  }
  // Checked before anything listens: a wrong address starts nothing.
  const tailnet = host === undefined ? undefined : await tailnetListen(host, tailscale);
  const webDir = defaultWebDir();
  if (!existsSync(join(webDir, "index.html"))) {
    throw new UsageError("the board page is not built; run npm run build");
  }
  const gh = run.gh ?? runGhAsync;
  const t3 = run.t3 ?? runT3;
  const notifierOf = run.notifier ?? boardNotifier;
  // The limits pause and the wake (the click-only rule's exceptions): never in the demo, off with --no-pause. The pause's pushes go through each project's notified.json.
  const pausing = !demo && !args.includes("--no-pause");
  const pushers = new Map<string, ReturnType<typeof limitPusher>>();
  const pusherOf = (root: string): ReturnType<typeof limitPusher> => {
    const file = join(mainCheckout(root), ".braid", "notified.json");
    const pusher = pushers.get(file) ?? limitPusher({ file });
    pushers.set(file, pusher);
    return pusher;
  };
  // One acting board per provider account and per repository on this machine (0074/B): the leases in ~/.braid/acting.
  let port: number | null = null;
  const leases = pausing ? (run.acting ?? actingBoard({ staleMs: ACTING_STALE_MS, port: () => port })) : null;
  const steer = pausing
    ? steerer({
        t3,
        wake: steps(waker(t3), reminder(t3), nudger(t3)),
        ...(leases === null ? {} : { acting: leases }),
        ...(run.notifier === undefined
          ? {
              push: (root: string, p: Parameters<ReturnType<typeof limitPusher>>[0]) => pusherOf(root)(p),
              // The failed pushes wait in each project's notified.json; the repository's acting board sends them (also after a restart).
              retry: (root: string) => pusherOf(root).retry(),
            }
          : {}),
      })
    : null;
  const act = (name: string, root: string, own: Sources): Sources => (steer === null ? own : acting(name, root, own, steer, leases));
  // The problems printed at startup are each first snapshot's own: no second read of GitHub.
  const firsts: { name: string; problems: Promise<Problem[]> }[] = [];
  const printing = (name: string, own: Sources): Sources => {
    const inner = own.readiness;
    if (inner === undefined) {
      return own;
    }
    let found: (problems: Problem[]) => void = () => {};
    firsts.push({ name, problems: new Promise<Problem[]>((done) => (found = done)) });
    return { ...own, readiness: async (github) => { const problems = await inner(github); found(problems); return problems; } };
  };
  let served: Sources | Roster;
  if (!several) {
    served = printing("", act(titleRepoName(root), root, { ...repoSources(root, gh, t3), notify: notifierOf(root) }));
  } else if (demo) {
    const members = demoMembers(t3Down, notReady).filter((m) => only === undefined || m.name === only).map((m) => ({ ...m, src: printing(m.name, m.src) }));
    served = () => members;
  } else {
    // One Sources and one notifier per listed project, kept while its name and path stay; the list is read again at each refresh.
    let cache = new Map<string, Member>();
    let listedNow: readonly Project[] = list;
    const repoNames = new Map<string, string>();
    const repoOf = (p: Project): string => {
      const known = repoNames.get(p.path);
      if (known !== undefined) {
        return known;
      }
      const name = titleRepoName(p.path);
      repoNames.set(p.path, name);
      return name;
    };
    // Two listed projects with the same repository name would send pushes that read the same: those name their project instead.
    const withNotify = (p: Project, own: Sources): Sources => {
      const inner = notifierOf(p.path);
      return { ...own, notify: (board) => inner(listedNow.filter((q) => repoOf(q) === board.repo).length > 1 ? { ...board, repo: p.name } : board) };
    };
    const membersOf = (projects: readonly Project[], first = false): Member[] => {
      const next = new Map<string, Member>();
      listedNow = projects;
      const members = projects
        .filter((p) => only === undefined || p.name === only)
        .map((p) => {
          const key = `${p.name}\0${p.path}`;
          const member = cache.get(key) ?? { name: p.name, src: ((s: Sources) => (first ? printing(p.name, s) : s))(act(p.name, p.path, withNotify(p, repoSources(p.path, gh, t3)))) };
          next.set(key, member);
          return member;
        });
      cache = next;
      return members;
    };
    let current = membersOf(list, true);
    let warned = false;
    served = () => {
      try {
        current = membersOf(listed());
        warned = false;
      } catch (error) {
        if (!warned) {
          process.stderr.write(`braid board: the project list can't be read (${error instanceof Error ? error.message : String(error)}); serving the projects as they were\n`);
          warned = true;
        }
      }
      return current;
    };
  }
  // The T3 sign-in (docs/board.md, "T3 sign-in"): the OS store read at the start and at most once a minute; no T3 call on a timer.
  const signin = demo ? demoSignIn() : run.signin !== undefined ? (run.signin ?? undefined) : run.t3 === undefined ? boardSignIn({ store: keyringStore(), settings: () => readSettings(), send: t3Pusher() }) : undefined;
  const listening = await startBoardWith(served, webDir, REFRESH_MS, undefined, tailnet, fixedPort, READ_TIMEOUT_MS, signin).catch((e: unknown) => {
    signin?.close();
    throw e;
  });
  port = Number(new URL(listening.url).port);
  // A board that stops gives its leases up at once, so another board acts from its next refresh.
  const started: Started =
    leases === null
      ? listening
      : (() => {
          const release = (): void => leases.release();
          // On a stop signal the leases go too; the signal is raised again only when no other handler (keepAddress's) does it.
          const onSignal = (signal: NodeJS.Signals): void => {
            detach();
            release();
            if (process.listenerCount(signal) === 0) {
              process.kill(process.pid, signal);
            }
          };
          const detach = (): void => {
            process.off("exit", release);
            for (const s of STOP_SIGNALS) {
              process.off(s, onSignal);
            }
          };
          process.once("exit", release);
          for (const s of STOP_SIGNALS) {
            process.once(s, onSignal);
          }
          return {
            ...listening,
            close: async () => {
              detach();
              release();
              await listening.close();
            },
          };
        })();
  // The token rides in the fragment, which the browser sends neither to a server nor in a Referer.
  const url = `${started.url}#token=${started.token}`;
  // A real run also leaves its address in ~/.braid for a board with no console (D94); the demo writes nothing.
  const stopped = demo ? started : keepAddress(started, url);
  if (service) {
    // The exit handler keepAddress set removes the address file.
    stopWithConsole(() => process.exit(0));
  }
  process.stdout.write(`braid board${demo ? " (demo: sample data; nothing is read or written)" : ""}: ${url}\n`);
  if (several) {
    process.stdout.write(`Projects: ${only ?? names.join(", ")}\n`);
  }
  if (started.tailnet !== undefined && tailnet !== undefined) {
    process.stdout.write(`On Tailscale: ${started.tailnet.url}\nOnly ${tailnet.owner}'s own devices (no tagged nodes) may open it; Open thread there uses the T3 app on the phone.\n`);
  }
  process.stdout.write(demo ? "Notifications: none in the demo\n" : `${notifyLine(readConfig())}\n`);
  process.stdout.write(`${limitsLine(demo ? "demo" : pausing ? "on" : "off")}\n`);
  if (signin !== undefined) {
    await signin.read(true).catch(() => {});
    process.stdout.write(`${statusLine(signin.view(), new Date())}${demo ? " (demo)" : ""}\n`);
  }
  process.stdout.write("Press Ctrl+C to stop.\n");
  if (!args.includes("--no-open")) {
    openBrowser(url);
  }
  // One line per problem, once each project's first snapshot has read them (a project whose read hangs is skipped at the timeout).
  const late = new Promise<null>((done) => setTimeout(() => done(null), READ_TIMEOUT_MS).unref());
  const found = await Promise.all(firsts.map(async (f) => ({ name: f.name, problems: (await Promise.race([f.problems, late])) ?? [] })));
  for (const f of found) {
    for (const p of f.problems) {
      process.stdout.write(`${several ? `${f.name}: ` : ""}${problemLine(p)}\n`);
    }
  }
  return stopped;
}

let version: string | undefined;
/** This braid's version, read once. */
function boardVersion(): string {
  version ??= readVersion();
  return version;
}

/** The signals that stop a board from its console or its service manager; the address file goes before the process does. */
const STOP_SIGNALS: readonly NodeJS.Signals[] = process.platform === "win32" ? ["SIGINT", "SIGTERM", "SIGHUP", "SIGBREAK"] : ["SIGINT", "SIGTERM", "SIGHUP"];

/**
 * Writes the run's address file (D94) and removes it when the board stops: `close()`, a normal exit, or a stop signal,
 * which is raised again once the file is gone so the process ends as it did before. A process killed outright
 * (TerminateProcess, SIGKILL) leaves the file; `braid board --url` then finds no board answering with its token.
 * A file that can't be written is reported on standard error, and the board runs on without it.
 */
export function keepAddress(started: Started, url: string, home?: string, raise: (signal: NodeJS.Signals) => void = (s) => process.kill(process.pid, s)): Started {
  const port = Number(new URL(started.url).port);
  try {
    writeAddress(port, url, home);
  } catch (error) {
    process.stderr.write(`braid board: the address file can't be written (${error instanceof Error ? error.message : String(error)}); braid board --url won't find this board\n`);
    return started;
  }
  const remove = (): void => removeAddress(port, url, home);
  const detach = (): void => {
    process.off("exit", remove);
    for (const s of STOP_SIGNALS) {
      process.off(s, onSignal);
    }
  };
  function onSignal(signal: NodeJS.Signals): void {
    remove();
    detach();
    raise(signal);
  }
  process.once("exit", remove);
  for (const s of STOP_SIGNALS) {
    process.once(s, onSignal);
  }
  return {
    ...started,
    close: async () => {
      detach();
      remove();
      await started.close();
    },
  };
}

/** `braid board --url [--port <n>]`: the address of each board running for this user, from its address file (D94). */
export async function boardUrl(args: readonly string[], home?: string, probe?: Probe): Promise<{ code: number; stdout: string; stderr: string }> {
  const rest = args.filter((a) => a !== "--url");
  let port: number | undefined;
  if (rest.length > 0) {
    const value = rest[1] ?? "";
    if (rest.length !== 2 || rest[0] !== "--port" || !/^\d+$/.test(value) || Number(value) < 1 || Number(value) > 65535) {
      throw new UsageError(`braid board --url takes only --port <n> (a port number from 1 to 65535); got: ${rest.join(" ")}`);
    }
    port = Number(value);
  }
  const live = (await liveAddresses(home, probe)).filter((a) => port === undefined || a.port === port);
  if (live.length === 0) {
    return { code: 1, stdout: "", stderr: `no braid board is running${port === undefined ? "" : ` on port ${port}`} for this user; start one with braid board\n` };
  }
  const slow = live.filter((a) => a.state === "busy").map((a) => `the board on port ${a.port} answers slowly (no answer within ${PROBE_MS / 1000} s)\n`);
  return { code: 0, stdout: live.map((a) => `${a.url}\n`).join(""), stderr: slow.join("") };
}
