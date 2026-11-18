import { spawn, spawnSync } from "node:child_process";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { existsSync, readFileSync, statSync, watch, type FSWatcher } from "node:fs";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { basename, extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { loadLiveBraids, treeOf } from "../braids/branches.js";
import { FormatError } from "../braids/frontmatter.js";
import type { Braid, Item, Tree } from "../braids/store.js";
import { DEMO_START, demoBraids, demoGithub, demoSignals, demoT3, demoTree } from "../board/demo.js";
import { readGithub, runGh, type Github, type GhRunner } from "../board/github.js";
import { coordinatorWarning, mergeOf, toBoard, toCard, toDetail, type StartContext } from "../board/model.js";
import { readSignals, type ReadSignals } from "../board/signals.js";
import { mainCheckout, readT3, runT3, type T3, type T3Runner } from "../board/t3.js";
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
  braids(): Braid[];
  github(fresh: boolean): Github;
  t3(fresh: boolean): Promise<T3>;
  signals(github: Github): ReadSignals;
  tree(item: Item): Tree;
  /** A folder whose changes refresh the page; null for none. */
  readonly watch: string | null;
  /** What BRAID.md says about the main branch and the coordinator's model. */
  start(): StartContext;
  /** The T3 project folder (the main checkout). */
  project(): string;
  /** The action registered under `name`, or undefined. `POST /api/action/<name>` runs it. */
  action(name: string): Action | undefined;
}

/** What an action does with the JSON body of its request; its result is the JSON reply. */
export type Action = (body: unknown) => unknown;

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
    const github = src.github(true);
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
    const braid = src.braids().find((b) => b.number === id);
    if (braid === undefined) {
      throw new UsageError(`Start: no braid ${id}`);
    }
    const github = src.github(true);
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
    const title = `${src.repo} ${id} coordinator: ${card.title}`.replace(/["%^&|<>!\s]+/g, " ").trim();
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

const T3_SEGMENT = /^[\w.%~-]+$/;

/** `t3code://threads/<env>/<thread>` from T3's thread link (`http://127.0.0.1:3773/<env>/<thread>`); null when the link isn't that shape. */
export function t3codeUrl(link: string): string | null {
  let path: string;
  try {
    path = new URL(link).pathname;
  } catch {
    return null;
  }
  const m = /^\/([^/]+)\/([^/]+)\/?$/.exec(path);
  return m !== null && T3_SEGMENT.test(m[1] ?? "") && T3_SEGMENT.test(m[2] ?? "") ? `t3code://threads/${m[1]}/${m[2]}` : null;
}

/**
 * Open thread: opens the item's thread in the T3 desktop app. The body is `{ id }`, a braid or strand; the server
 * picks the thread by the same rule as the board's button (a strand's thread; a braid's agent thread, else its
 * coordinator) from fresh reads, so a client can't pass a URL. Refuses (400) when there is no thread.
 */
export function openAction(src: Sources, open: Opener = openWithOs): Action {
  return async (body) => {
    const raw = typeof body === "object" && body !== null ? (body as Record<string, unknown>)["id"] : undefined;
    if (typeof raw !== "string") {
      throw new UsageError("open needs { id }: the braid or strand whose thread to open");
    }
    const id = normaliseId(raw);
    const [number, letter] = id.split("/");
    const braid = src.braids().find((b) => b.number === number);
    if (braid === undefined) {
      throw new UsageError(`Open thread: no braid ${number}`);
    }
    const github = src.github(true);
    const card = toCard(braid, github, await src.t3(true), src.signals(github), src.start());
    const link = letter === undefined ? (card.thread ?? card.coordinator?.link ?? null) : (card.strands.find((s) => s.id === id)?.thread ?? null);
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

export function repoSources(root: string, gh: GhRunner = runGh, t3: T3Runner = runT3): Sources {
  const src: Sources = {
    repo: basename(root),
    braids: () => loadLiveBraids(root),
    github: (fresh) => readGithub(root, gh, fresh ? 0 : undefined),
    t3: (fresh) => readT3(root, { run: t3, ...(fresh ? { ttlMs: 0 } : {}) }),
    signals: (github) => readSignals(root, github),
    tree: (item) => treeOf(root, item),
    watch: join(root, "braids"),
    start: () => readStartContext(root),
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
    project: () => ".",
    // A demo board accepts every action and fakes the result; nothing is written.
    action: () => () => ({ ok: true, demo: true }),
  };
}

async function api(src: Sources, url: URL): Promise<Reply> {
  try {
    const braids = src.braids();
    const fresh = url.searchParams.get("fresh") === "1";
    const github = src.github(fresh);
    const t3 = await src.t3(fresh);
    const sig = src.signals(github);
    if (url.pathname === "/api/board") {
      const board = toBoard(src.repo, braids, github, t3, sig, src.start());
      sig.commit();
      return json(200, board);
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
    const braid = braids.find((b) => b.number === number);
    const item = letter === undefined ? braid : braid?.strands.find((s) => s.letter === letter);
    if (braid === undefined || item === undefined) {
      return json(404, { error: `no item ${id}` });
    }
    const detail = toDetail(src.tree(item), braid, item, github, t3, sig, src.start());
    sig.commit();
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

/** Runs `POST /api/action/<name>`: only the page this run opened may call it. */
async function postAction(src: Sources, req: IncomingMessage, url: URL, origin: string, token: string): Promise<Reply> {
  if (req.headers.host !== origin.slice("http://".length) || (req.headers.origin !== undefined && req.headers.origin !== origin)) {
    return json(403, { error: "forbidden" });
  }
  if (!tokenMatches(req.headers[TOKEN_HEADER], token)) {
    return json(403, { error: "forbidden" });
  }
  const name = decodeURIComponent(url.pathname.slice("/api/action/".length));
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
    return json(200, await action(body));
  } catch (error) {
    if (error instanceof UsageError) {
      return json(400, { error: error.message });
    }
    throw error;
  }
}

/** How often open pages are told to refresh. */
export const REFRESH_MS = 30_000;

/**
 * Starts the board server on 127.0.0.1 with a free port. Resolves once it is listening. Pages
 * listen to `/api/events` and refetch on each message: every `refreshMs` while the server runs,
 * and at once when a file under `braids/` changes. Actions are `POST /api/action/<name>` and need
 * the run's session `token` (a random one unless given) in the `x-braid-token` header.
 */
export function startBoardWith(
  src: Sources,
  webDir: string = defaultWebDir(),
  refreshMs: number = REFRESH_MS,
  token: string = randomBytes(24).toString("hex"),
): Promise<{ server: Server; url: string; token: string }> {
  const base = resolve(webDir);
  const clients = new Set<ServerResponse>();
  const push = () => {
    for (const c of clients) {
      c.write("data: refresh\n\n");
    }
  };
  let timer: NodeJS.Timeout | undefined;
  let watcher: FSWatcher | undefined;
  let debounce: NodeJS.Timeout | undefined;
  let origin = "";
  const server = createServer((req, res) => {
    void (async () => {
      try {
        const url = new URL(req.url ?? "/", "http://127.0.0.1");
        if (req.method === "POST" && url.pathname.startsWith("/api/action/")) {
          const out = await postAction(src, req, url, origin, token);
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
          const out = await api(src, url);
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
    })();
  });
  server.on("close", () => {
    clearInterval(timer);
    clearTimeout(debounce);
    watcher?.close();
  });
  return new Promise((resolvePromise, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address() as AddressInfo;
      origin = `http://127.0.0.1:${port}`;
      timer = setInterval(push, refreshMs);
      timer.unref();
      if (src.watch !== null && existsSync(src.watch)) {
        try {
          watcher = watch(src.watch, { recursive: true }, () => {
            clearTimeout(debounce);
            debounce = setTimeout(push, 200);
            debounce.unref();
          });
          watcher.on("error", () => {});
          watcher.unref();
        } catch {
          // The timed refresh still runs.
        }
      }
      resolvePromise({ server, url: `${origin}/`, token });
    });
  });
}

/** Starts the board for the repository at `root`. */
export function startBoard(root: string, webDir: string = defaultWebDir(), gh: GhRunner = runGh, t3: T3Runner = runT3, refreshMs: number = REFRESH_MS): Promise<{ server: Server; url: string; token: string }> {
  return startBoardWith(repoSources(root, gh, t3), webDir, refreshMs);
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

export async function runBoard(root: string, args: readonly string[]): Promise<void> {
  const flags = ["--no-open", "--demo", "--demo-t3-down"];
  const unknown = args.filter((a) => !flags.includes(a));
  if (unknown.length > 0) {
    throw new UsageError(`braid board takes only ${flags.join(", ")}; got: ${unknown.join(" ")}`);
  }
  const t3Down = args.includes("--demo-t3-down");
  const demo = args.includes("--demo") || t3Down;
  const webDir = defaultWebDir();
  if (!existsSync(join(webDir, "index.html"))) {
    throw new UsageError("the board page is not built; run npm run build");
  }
  const started = demo ? await startBoardWith(demoSources(t3Down), webDir) : await startBoard(root, webDir);
  // The token rides in the fragment, which the browser sends neither to a server nor in a Referer.
  const url = `${started.url}#token=${started.token}`;
  process.stdout.write(`braid board${demo ? " (demo: sample data; nothing is read or written)" : ""}: ${url}\nPress Ctrl+C to stop.\n`);
  if (!args.includes("--no-open")) {
    openBrowser(url);
  }
}
