import { spawn } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { basename, extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { loadLiveBraids } from "../braids/branches.js";
import { FormatError } from "../braids/frontmatter.js";
import { readGithub, runGh, type GhRunner } from "../board/github.js";
import { toBoard, toDetail } from "../board/model.js";
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

function api(root: string, url: URL, gh: GhRunner): Reply {
  try {
    const braids = loadLiveBraids(root);
    if (url.pathname === "/api/board") {
      return json(200, toBoard(basename(root), braids, readGithub(root, gh)));
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
    return json(200, toDetail(root, braid, item, readGithub(root, gh)));
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

/** Starts the board server on 127.0.0.1 with a free port. Resolves once it is listening. */
export function startBoard(root: string, webDir: string = defaultWebDir(), gh: GhRunner = runGh): Promise<{ server: Server; url: string }> {
  const base = resolve(webDir);
  const server = createServer((req, res) => {
    try {
      if (req.method !== "GET" && req.method !== "HEAD") {
        res.writeHead(405).end();
        return;
      }
      const url = new URL(req.url ?? "/", "http://127.0.0.1");
      if (url.pathname.startsWith("/api/")) {
        const out = api(root, url, gh);
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
      res.writeHead(500, { "content-type": "text/plain" }).end("error");
    }
  });
  return new Promise((resolvePromise, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address() as AddressInfo;
      resolvePromise({ server, url: `http://127.0.0.1:${port}/` });
    });
  });
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
  const unknown = args.filter((a) => a !== "--no-open");
  if (unknown.length > 0) {
    throw new UsageError(`braid board takes only --no-open; got: ${unknown.join(" ")}`);
  }
  const webDir = defaultWebDir();
  if (!existsSync(join(webDir, "index.html"))) {
    throw new UsageError("the board page is not built; run npm run build");
  }
  const { url } = await startBoard(root, webDir);
  process.stdout.write(`braid board: ${url}\nPress Ctrl+C to stop.\n`);
  if (!args.includes("--no-open")) {
    openBrowser(url);
  }
}
