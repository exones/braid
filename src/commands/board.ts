import { spawn, spawnSync } from "node:child_process";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { existsSync, readFileSync, statSync, watch, type FSWatcher } from "node:fs";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { loadLiveBraidsAsync, treeOf } from "../braids/branches.js";
import { FormatError } from "../braids/frontmatter.js";
import type { Braid, Item, Tree } from "../braids/store.js";
import { DEMO_START, demoBraids, demoGithub, demoInbox, demoSignals, demoT3, demoTree } from "../board/demo.js";
import { inboxOfAsync, type InboxData } from "../board/inbox.js";
import { readGithubAsync, runGhAsync, type Github, type GhRunnerAsync } from "../board/github.js";
import { coordinatorWarning, mergeOf, toBoard, toCard, toDetail, type BoardData, type StartContext } from "../board/model.js";
import { t3codeUrl } from "../board/marks.js";
import { threadTitle, titleRepoName } from "../braids/title.js";
import { readSignals, type ReadSignals } from "../board/signals.js";
import { mainCheckout, readT3, runT3, type T3, type T3Runner } from "../board/t3.js";
import { readTailnet, runTailscale, tailnetAddress, tailnetHosts, whoisGate, type Gate, type TailscaleRunner } from "../board/tailnet.js";
import { normaliseId, UsageError } from "./braids.js";

const TYPES: Readonly<Record<string, string>> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
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
  braids(): Braid[] | Promise<Braid[]>;
  github(fresh: boolean): Github | Promise<Github>;
  t3(fresh: boolean): Promise<T3>;
  signals(github: Github): ReadSignals;
  tree(item: Item): Tree;
  /** A folder whose changes refresh the page; null for none. */
  readonly watch: string | null;
  /** What BRAID.md says about the main branch and the coordinator's model. */
  start(): StartContext;
  /** The open inbox entries; `fetch` (the Refresh button) fetches `braid-inbox` from origin first. */
  inbox(fetch: boolean): InboxData | Promise<InboxData>;
  /** The T3 project folder (the main checkout). */
  project(): string;
  /** The action registered under `name`, or undefined. `POST /api/action/<name>` runs it. */
  action(name: string): Action | undefined;
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
    const github = await src.github(true);
    const sig = src.signals(github);
    const merge = mergeOf(id, github, sig);
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

/** What BRAID.md says about the main branch and the coordinator (`models.coordinator: <provider> / <model> / effort=…`). */
export function readStartContext(root: string): StartContext {
  const text = existsSync(join(root, "BRAID.md")) ? readFileSync(join(root, "BRAID.md"), "utf8") : "";
  const model = /^\s+coordinator:\s*([^\s/]+)\s*\/\s*([^\s/]+)\s*\//m.exec(text);
  return { main: /^main:\s*([\w./-]+)\s*$/m.exec(text)?.[1] ?? "main", expected: model === null ? null : { provider: model[1] ?? "", model: model[2] ?? "" } };
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
/** Runs `git` in a folder; Start's fetch and branch checks go through it. */
export type GitRunner = (root: string, args: readonly string[]) => GitResult;
export const runGit: GitRunner = (root, args) => {
  const r = spawnSync("git", args, { cwd: root, encoding: "utf8", timeout: 60_000 });
  return { status: r.status, stdout: r.stdout ?? "", stderr: r.stderr || r.error?.message || "" };
};

const firstLine = (r: GitResult): string => r.stderr.trim().split("\n")[0] || "git failed";

/** Every branch name, local and on origin. A listing that fails is a `Start: <reason>` refusal: a name is never guessed free. */
function takenBranches(git: GitRunner, root: string): Set<string> {
  const local = git(root, ["branch", "--list", "--format=%(refname:short)"]);
  const remote = git(root, ["ls-remote", "--heads", "origin"]);
  if (local.status !== 0 || remote.status !== 0) {
    throw new UsageError(`Start: branches can't be listed (${firstLine(local.status !== 0 ? local : remote)})`);
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
    const braid = (await src.braids()).find((b) => b.number === id);
    if (braid === undefined) {
      throw new UsageError(`Start: no braid ${id}`);
    }
    const github = await src.github(true);
    const ctx = src.start();
    const card = toCard(braid, github, await src.t3(true), src.signals(github), ctx);
    if (card.start.reason !== null) {
      throw new UsageError(`Start: ${card.start.reason}`);
    }
    const fetched = git(root, ["fetch", "origin"]);
    if (fetched.status !== 0) {
      throw new UsageError(`Start: git fetch failed (${firstLine(fetched)})`);
    }
    // A braid branch only this checkout has can't come from origin; the main branch must.
    let base = card.start.base;
    if (git(root, ["rev-parse", "--verify", "--quiet", base]).status !== 0) {
      const local = base.replace(/^origin\//, "");
      if (!card.start.planned || git(root, ["rev-parse", "--verify", "--quiet", local]).status !== 0) {
        throw new UsageError(`Start: ${base} not found after the fetch`);
      }
      base = local;
    }
    const taken = takenBranches(git, root);
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
 * Open thread: opens the item's thread in the T3 desktop app. The body is `{ id }`, a braid or strand; the server
 * picks the thread by the same rule as the board's button (a strand's thread; a braid's agent thread, else its
 * coordinator) from fresh reads, so a client can't pass a URL. Refuses (400) when there is no thread.
 */
export function openAction(src: Sources, open: Opener = openWithOs): Action {
  return async (body, snapshot) => {
    const raw = typeof body === "object" && body !== null ? (body as Record<string, unknown>)["id"] : undefined;
    if (typeof raw !== "string") {
      throw new UsageError("open needs { id }: the braid or strand whose thread to open");
    }
    const id = normaliseId(raw);
    const [number, letter] = id.split("/");
    const braid = (await src.braids()).find((b) => b.number === number);
    if (braid === undefined) {
      throw new UsageError(`Open thread: no braid ${number}`);
    }
    const linkOf = (card: { thread: string | null; coordinator: { link: string | null } | null; strands: readonly { id: string; thread: string | null }[] }): string | null =>
      letter === undefined ? (card.thread ?? card.coordinator?.link ?? null) : (card.strands.find((s) => s.id === id)?.thread ?? null);
    // A thread's link doesn't change: the snapshot has it. Only when it has none is T3 read again.
    const known = (await snapshot?.())?.braids.find((c) => c.id === number);
    let link = known === undefined ? null : linkOf(known);
    if (link === null) {
      const github = await src.github(true);
      link = linkOf(toCard(braid, github, await src.t3(true), src.signals(github), src.start()));
    }
    if (link === null) {
      throw new UsageError(`Open thread: ${id} has no thread`);
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

export function repoSources(root: string, gh: GhRunnerAsync = runGhAsync, t3: T3Runner = runT3): Sources {
  const src: Sources = {
    repo: titleRepoName(root),
    braids: () => loadLiveBraidsAsync(root),
    github: (fresh) => readGithubAsync(root, gh, fresh ? 0 : undefined),
    t3: (fresh) => readT3(root, { run: t3, ...(fresh ? { ttlMs: 0 } : {}) }),
    signals: (github) => readSignals(root, github),
    tree: (item) => treeOf(root, item),
    watch: join(root, "braids"),
    start: () => readStartContext(root),
    inbox: (fetch) => inboxOfAsync(root, fetch),
    project: () => mainCheckout(root),
    action: (name) => (Object.hasOwn(actions, name) ? actions[name] : undefined),
  };
  const actions: Readonly<Record<string, Action>> = { merge: mergeAction(src, root, t3), start: startAction(src, root, t3), open: openAction(src) };
  return src;
}

/** The samples of `braid board --demo`: no repository, `gh` or `t3` is touched. */
export function demoSources(t3Down = false): Sources {
  return {
    repo: "demo",
    braids: demoBraids,
    github: () => demoGithub(),
    t3: () => Promise.resolve(demoT3(t3Down)),
    signals: () => demoSignals(),
    tree: () => demoTree(),
    watch: null,
    start: () => DEMO_START,
    inbox: () => demoInbox(),
    project: () => ".",
    // A demo board accepts every action and fakes the result; nothing is written.
    action: () => () => ({ ok: true, demo: true }),
  };
}

/** Everything one complete read produced; the pages are answered from the latest one. */
type Snapshot =
  | { readonly ok: true; readonly braids: Braid[]; readonly github: Github; readonly t3: T3; readonly sig: ReadSignals; readonly start: StartContext; readonly board: BoardData }
  | { readonly ok: false; readonly error: unknown };

/** Answers `/api/board` and `/api/item` from a snapshot: nothing is read from GitHub or T3 here. */
function api(src: Sources, url: URL, remote: boolean, snap: Snapshot): Reply {
  try {
    if (!snap.ok) {
      throw snap.error;
    }
    if (url.pathname === "/api/board") {
      return json(200, { ...snap.board, remote });
    }
    if (url.pathname !== "/api/item") {
      return json(404, { error: "no such endpoint" });
    }
    const raw = url.searchParams.get("id");
    if (raw === null) {
      return json(400, { error: "id is required" });
    }
    const id = normaliseId(raw);
    const [number, letter] = id.split("/");
    const braid = snap.braids.find((b) => b.number === number);
    const item = letter === undefined ? braid : braid?.strands.find((s) => s.letter === letter);
    if (braid === undefined || item === undefined) {
      return json(404, { error: `no item ${id}` });
    }
    const detail = toDetail(src.tree(item), braid, item, snap.github, snap.t3, snap.sig, snap.start);
    return json(200, detail);
  } catch (error) {
    if (error instanceof UsageError) {
      return json(400, { error: error.message });
    }
    if (error instanceof FormatError) {
      return json(500, { error: `${error.file}: ${error.message}. Run braid check.` });
    }
    throw error;
  }
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

const hostOk = (listener: Listener, host: string | undefined): boolean =>
  host !== undefined && (listener.kind === "local" ? host === listener.origin().slice("http://".length) : listener.hosts().includes(host.toLowerCase()));

/** Runs `POST /api/action/<name>`: on the local listener only the page this run opened may call it; on the Tailscale listener, a board page on it. */
async function postAction(src: Sources, req: IncomingMessage, url: URL, listener: Listener, board: () => Promise<BoardData | null>): Promise<Reply> {
  const host = req.headers.host;
  const origin = req.headers.origin;
  if (!hostOk(listener, host) || (origin !== undefined && origin.toLowerCase() !== `http://${(host ?? "").toLowerCase()}`)) {
    return json(403, { error: "forbidden" });
  }
  if (listener.kind === "local" ? !tokenMatches(req.headers[TOKEN_HEADER], listener.token) : req.headers[REQUEST_HEADER] !== "1") {
    return json(403, { error: "forbidden" });
  }
  const name = decodeURIComponent(url.pathname.slice("/api/action/".length));
  if (listener.kind === "tailnet" && name === "open") {
    return json(403, { error: "Open thread opens T3 on the machine running the board; on the phone the thread's app link opens your own T3 app" });
  }
  const action = src.action(name);
  if (action === undefined) {
    return json(404, { error: `no action ${name}` });
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
  try {
    return json(200, await action(body, board));
  } catch (error) {
    if (error instanceof UsageError) {
      return json(400, { error: error.message });
    }
    throw error;
  }
}

/** How often open pages are told to refresh. */
export const REFRESH_MS = 30_000;

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

const isFolder = (path: string): boolean => {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
};

/**
 * Starts the board server on 127.0.0.1 with a free port. Resolves once it is listening. Pages
 * listen to `/api/events` and refetch on each message: every `refreshMs` while the server runs,
 * and at once when a file under `braids/` changes. Actions are `POST /api/action/<name>` and need
 * the run's session `token` (a random one unless given) in the `x-braid-token` header. With `tailnet`,
 * a second listener serves the same board on a Tailscale address (D60): every request passes the whois
 * gate and a Host check first, actions need the `x-braid-request` header instead of the token, and `open` is refused.
 * `fixedPort` (`--port`) is the port of both listeners; one that is in use is refused (UsageError) and nothing stays listening.
 */
export function startBoardWith(
  src: Sources,
  webDir: string = defaultWebDir(),
  refreshMs: number = REFRESH_MS,
  token: string = randomBytes(24).toString("hex"),
  tailnet?: TailnetListen,
  fixedPort = 0,
): Promise<Started> {
  const base = resolve(webDir);
  const clients = new Set<ServerResponse>();
  const push = () => {
    for (const c of clients) {
      c.write("data: refresh\n\n");
    }
  };
  // The reads happen here, one at a time, off the request path (docs/board.md, "Refresh").
  let current: Snapshot | undefined;
  let running: Promise<void> | undefined;
  let queued: { fetch: boolean; done: Promise<void> } | undefined;
  let closed = false;
  const readAll = async (fetch: boolean): Promise<Snapshot> => {
    const marks: string[] = [];
    const timed = async <T>(name: string, read: () => T | Promise<T>): Promise<T> => {
      const began = performance.now();
      try {
        return await read();
      } finally {
        marks.push(`${name} ${Math.round(performance.now() - began)} ms`);
      }
    };
    // Every source call this read starts settles before it ends, so the next read never overlaps a `gh` or `t3` still running.
    const github = timed("github", () => src.github(true));
    const t3 = timed("t3", () => src.t3(true));
    github.catch(() => {}); // their failure is reported when they are awaited below
    t3.catch(() => {});
    try {
      const braids = await timed("braids", () => src.braids());
      const [gh, threads] = [await github, await t3];
      const sig = await timed("signals", () => src.signals(gh));
      await timed("done dates", () => sig.prepare?.(braids));
      const inbox = await timed("inbox", () => src.inbox(fetch));
      const start = src.start();
      const board = await timed("board", () => {
        const b = toBoard(src.repo, braids, gh, threads, sig, start, inbox);
        sig.commit();
        return b;
      });
      return { ok: true, braids, github: gh, t3: threads, sig, start, board };
    } catch (error) {
      return { ok: false, error };
    } finally {
      await Promise.allSettled([github, t3]);
      if (process.env["BRAID_BOARD_TIMINGS"] === "1") {
        process.stderr.write(`board read: ${marks.join(", ")}\n`);
      }
    }
  };
  const begin = (fetch: boolean): Promise<void> => {
    const read = readAll(fetch).then((snap) => {
      current = snap;
      running = undefined;
      if (!closed) {
        push();
      }
    });
    running = read;
    return read;
  };
  /** Reads everything again: at once when idle, else once after the read that runs (any number of asks while one runs share one more read). */
  const refresh = (fetch = false): Promise<void> => {
    if (running === undefined) {
      return begin(fetch);
    }
    if (queued === undefined) {
      const next = { fetch, done: Promise.resolve() };
      next.done = running.then(() => {
        queued = undefined;
        return begin(next.fetch);
      });
      queued = next;
    } else if (fetch) {
      queued.fetch = true;
    }
    return queued.done;
  };
  const first = refresh();
  const snapshot = async (fresh: boolean): Promise<Snapshot> => {
    if (fresh) {
      await refresh(true);
    } else if (current === undefined) {
      await first;
    }
    return current as Snapshot;
  };
  let timer: NodeJS.Timeout | undefined;
  let watcher: FSWatcher | undefined;
  let debounce: NodeJS.Timeout | undefined;
  let origin = "";
  let hosts: string[] = [];
  const handle = async (req: IncomingMessage, res: ServerResponse, listener: Listener): Promise<void> => {
    try {
      if (listener.kind === "tailnet") {
        // Fail closed: who the peer is comes first, then whether it asked for this listener by name.
        const allowed = await listener.gate(req.socket.remoteAddress ?? "", req.socket.remotePort ?? 0);
        if (!allowed || !hostOk(listener, req.headers.host)) {
          res.writeHead(403, { "content-type": "text/plain" }).end("forbidden");
          return;
        }
      }
      const url = new URL(req.url ?? "/", "http://127.0.0.1");
      if (req.method === "POST" && url.pathname.startsWith("/api/action/")) {
        const out = await postAction(src, req, url, listener, async () => {
          const snap = await snapshot(false);
          return snap.ok ? snap.board : null;
        });
        res.writeHead(out.status, { "content-type": TYPES[".json"] ?? "", "cache-control": "no-store" }).end(out.body);
        return;
      }
      if (req.method !== "GET" && req.method !== "HEAD") {
        res.writeHead(405).end();
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
        const out = api(src, url, listener.kind === "tailnet", await snapshot(url.searchParams.get("fresh") === "1"));
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
  server.on("close", () => {
    closed = true;
    clearInterval(timer);
    clearTimeout(debounce);
    watcher?.close();
    if (remote?.listening === true) {
      remote.close();
      remote.closeAllConnections();
    }
  });
  return (async () => {
    const port = await listen(server, "127.0.0.1", fixedPort, fixedPort !== 0).catch((e: unknown) => {
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
    timer = setInterval(() => void refresh(), refreshMs);
    timer.unref();
    const watched = src.watch ?? "";
    if (src.watch !== null && existsSync(src.watch)) {
      try {
        watcher = watch(src.watch, { recursive: true }, (event, name) => {
          // Reading the braids can report a change of a folder itself (Windows); that is no edit: an edit also reports its file.
          if (event === "change" && name !== null && isFolder(join(watched, name))) {
            return;
          }
          clearTimeout(debounce);
          debounce = setTimeout(() => void refresh(), 200);
          debounce.unref();
        });
        watcher.on("error", () => {});
        watcher.unref();
      } catch {
        // The timed refresh still runs.
      }
    }
    return { server, url: `${origin}/`, token, ...(shared === undefined ? {} : { tailnet: shared }) };
  })();
}

/** Starts the board for the repository at `root`. */
export function startBoard(root: string, webDir: string = defaultWebDir(), gh: GhRunnerAsync = runGhAsync, t3: T3Runner = runT3, refreshMs: number = REFRESH_MS, tailnet?: TailnetListen, fixedPort = 0): Promise<Started> {
  return startBoardWith(repoSources(root, gh, t3), webDir, refreshMs, undefined, tailnet, fixedPort);
}

/** Opens `url` in the default browser; a failure only means the user opens it by hand. */
export function openBrowser(url: string): void {
  const [cmd, args]: [string, string[]] =
    process.platform === "win32"
      ? ["explorer.exe", [url]]
      : process.platform === "darwin"
        ? ["open", [url]]
        : ["xdg-open", [url]];
  const child = spawn(cmd, args, { stdio: "ignore", detached: true });
  child.on("error", () => {});
  child.unref();
}

/** `--host <address>`'s Tailscale listener: the address checked against `tailscale status`, refused (UsageError) before anything listens. */
export async function tailnetListen(host: string, tailscale: TailscaleRunner = runTailscale): Promise<TailnetListen & { readonly owner: string }> {
  const tailnet = await readTailnet(tailscale);
  const address = tailnetAddress(host, tailnet);
  return { address, name: tailnet.name, owner: tailnet.owner, gate: whoisGate(tailnet.owner, tailscale) };
}

export async function runBoard(root: string, args: readonly string[], tailscale: TailscaleRunner = runTailscale): Promise<void> {
  const flags = ["--no-open", "--demo", "--demo-t3-down"];
  const at = args.indexOf("--host");
  const host = at === -1 ? undefined : args[at + 1];
  if (at !== -1 && (host === undefined || host.startsWith("--"))) {
    throw new UsageError("--host needs an address: tailscale, this machine's Tailscale IP or its MagicDNS name");
  }
  let rest = at === -1 ? args : [...args.slice(0, at), ...args.slice(at + 2)];
  const pat = rest.indexOf("--port");
  const portArg = pat === -1 ? undefined : rest[pat + 1];
  if (pat !== -1 && (portArg === undefined || !/^\d+$/.test(portArg) || Number(portArg) < 1 || Number(portArg) > 65535)) {
    throw new UsageError("--port needs a port number from 1 to 65535");
  }
  const fixedPort = portArg === undefined ? 0 : Number(portArg);
  rest = pat === -1 ? rest : [...rest.slice(0, pat), ...rest.slice(pat + 2)];
  const unknown = rest.filter((a) => !flags.includes(a));
  if (unknown.length > 0) {
    throw new UsageError(`braid board takes only ${flags.join(", ")}, --host <address>, --port <n>; got: ${unknown.join(" ")}`);
  }
  const t3Down = args.includes("--demo-t3-down");
  const demo = args.includes("--demo") || t3Down;
  // Checked before anything listens: a wrong address starts nothing.
  const tailnet = host === undefined ? undefined : await tailnetListen(host, tailscale);
  const webDir = defaultWebDir();
  if (!existsSync(join(webDir, "index.html"))) {
    throw new UsageError("the board page is not built; run npm run build");
  }
  const started = demo ? await startBoardWith(demoSources(t3Down), webDir, REFRESH_MS, undefined, tailnet, fixedPort) : await startBoard(root, webDir, runGhAsync, runT3, REFRESH_MS, tailnet, fixedPort);
  // The token rides in the fragment, which the browser sends neither to a server nor in a Referer.
  const url = `${started.url}#token=${started.token}`;
  process.stdout.write(`braid board${demo ? " (demo: sample data; nothing is read or written)" : ""}: ${url}\n`);
  if (started.tailnet !== undefined && tailnet !== undefined) {
    process.stdout.write(`On Tailscale: ${started.tailnet.url}\nOnly ${tailnet.owner}'s own devices (no tagged nodes) may open it; Open thread there uses the T3 app on the phone.\n`);
  }
  process.stdout.write("Press Ctrl+C to stop.\n");
  if (!args.includes("--no-open")) {
    openBrowser(url);
  }
}
