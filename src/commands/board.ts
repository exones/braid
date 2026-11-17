import { spawn } from "node:child_process";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { existsSync, readFileSync, statSync, watch, type FSWatcher } from "node:fs";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { basename, extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { loadLiveBraids, treeOf } from "../braids/branches.js";
import { FormatError } from "../braids/frontmatter.js";
import type { Braid, Item, Tree } from "../braids/store.js";
import { demoBraids, demoGithub, demoSignals, demoT3, demoTree } from "../board/demo.js";
import { readGithub, runGh, type Github, type GhRunner } from "../board/github.js";
import { toBoard, toDetail } from "../board/model.js";
import { readSignals, type ReadSignals } from "../board/signals.js";
import { readT3, runT3, type T3, type T3Runner } from "../board/t3.js";
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
  /** The action registered under `name`, or undefined. `POST /api/action/<name>` runs it. */
  action(name: string): Action | undefined;
}

/** What an action does with the JSON body of its request; its result is the JSON reply. */
export type Action = (body: unknown) => unknown;

/** The request header that carries the session token. */
export const TOKEN_HEADER = "x-braid-token";

/** Actions that change something are registered here by the strands that add them; none yet. */
const ACTIONS: Readonly<Record<string, Action>> = {};

export function repoSources(root: string, gh: GhRunner = runGh, t3: T3Runner = runT3): Sources {
  return {
    repo: basename(root),
    braids: () => loadLiveBraids(root),
    github: (fresh) => readGithub(root, gh, fresh ? 0 : undefined),
    t3: (fresh) => readT3(root, { run: t3, ...(fresh ? { ttlMs: 0 } : {}) }),
    signals: (github) => readSignals(root, github),
    tree: (item) => treeOf(root, item),
    watch: join(root, "braids"),
    action: (name) => (Object.hasOwn(ACTIONS, name) ? ACTIONS[name] : undefined),
  };
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
      const board = toBoard(src.repo, braids, github, t3, sig);
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
    const detail = toDetail(src.tree(item), braid, item, github, t3, sig);
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
