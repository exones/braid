import assert from "node:assert/strict";
import { request, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const scratch = mkdtempSync(join(tmpdir(), "braid-actions-"));
after(() => rmSync(scratch, { recursive: true, force: true, maxRetries: 20, retryDelay: 250 }));

interface Sources {
  action(name: string): ((body: unknown) => unknown) | undefined;
  [key: string]: unknown;
}
interface BoardModule {
  startBoardWith: (src: Sources, web: string, refreshMs?: number, token?: string) => Promise<{ server: Server; url: string; token: string; close(): Promise<void> }>;
  demoSources: () => Sources;
}
// A computed specifier keeps the compiled module out of the typecheck, which runs before the build.
const compiled = fileURLToPath(new URL("../dist/commands/board.js", import.meta.url));
const board = (await import(pathToFileURL(compiled).href)) as BoardModule;

const calls: unknown[] = [];
const echo = (body: unknown): unknown => {
  calls.push(body);
  return { echoed: body };
};

async function withBoard<T>(src: Sources, run: (port: number, token: string) => Promise<T>): Promise<T> {
  const started = await board.startBoardWith(src, join(scratch, "no-web"));
  const { server, token } = started;
  try {
    return await run((server.address() as AddressInfo).port, token);
  } finally {
    await started.close();
  }
}

/** A raw POST, so the test controls the Host and Origin headers that `fetch` would set itself. */
function post(port: number, path: string, headers: Record<string, string>, body = "{}"): Promise<{ status: number; text: string }> {
  return new Promise((resolve, reject) => {
    const req = request({ host: "127.0.0.1", port, path, method: "POST", headers: { "content-type": "application/json", ...headers } }, (res) => {
      let text = "";
      res.on("data", (c: Buffer) => (text += c.toString()));
      res.on("end", () => resolve({ status: res.statusCode ?? 0, text }));
    });
    req.on("error", reject);
    req.end(body);
  });
}

const sources = (): Sources => ({ ...board.demoSources(), action: (name) => (name === "echo" ? echo : undefined) });

test("an action is refused without the token, with a wrong one, or from a foreign Origin or Host", async () => {
  calls.length = 0;
  await withBoard(sources(), async (port, token) => {
    const path = "/api/action/echo";
    assert.equal((await post(port, path, {})).status, 403);
    assert.equal((await post(port, path, { "x-braid-token": "nope" })).status, 403);
    assert.equal((await post(port, path, { "x-braid-token": `${token}0` })).status, 403);
    assert.equal((await post(port, path, { "x-braid-token": token, origin: "http://evil.example" })).status, 403);
    assert.equal((await post(port, path, { "x-braid-token": token, origin: `http://localhost:${port}` })).status, 403);
    assert.equal((await post(port, path, { "x-braid-token": token, host: "evil.example" })).status, 403);
    assert.equal((await post(port, path, { "x-braid-token": token, host: `localhost:${port}` })).status, 403);
    assert.deepEqual(calls, []);
  });
});

test("an action with the token reaches its handler", async () => {
  calls.length = 0;
  await withBoard(sources(), async (port, token) => {
    const ok = await post(port, "/api/action/echo", { "x-braid-token": token, origin: `http://127.0.0.1:${port}` }, '{"a":1}');
    assert.equal(ok.status, 200);
    assert.deepEqual(JSON.parse(ok.text), { echoed: { a: 1 } });
    assert.deepEqual(calls, [{ a: 1 }]);
    assert.equal((await post(port, "/api/action/missing", { "x-braid-token": token })).status, 404);
    assert.equal((await post(port, "/api/action/echo", { "x-braid-token": token }, "{oops")).status, 400);
    assert.equal((await post(port, "/api/board", { "x-braid-token": token })).status, 405);
  });
});

test("a demo board accepts every action and fakes the result", async () => {
  await withBoard(board.demoSources(), async (port, token) => {
    const r = await post(port, "/api/action/anything", { "x-braid-token": token });
    assert.equal(r.status, 200);
    assert.deepEqual(JSON.parse(r.text), { ok: true, demo: true });
    assert.equal((await post(port, "/api/action/anything", {})).status, 403);
  });
});

test("each run has its own random token, and the opened URL carries it in the fragment", async () => {
  const a = await board.startBoardWith(sources(), join(scratch, "no-web"));
  const b = await board.startBoardWith(sources(), join(scratch, "no-web"));
  try {
    assert.match(a.token, /^[0-9a-f]{48}$/);
    assert.notEqual(a.token, b.token);
    assert.doesNotMatch(a.url, /token/);
  } finally {
    await Promise.all([a.close(), b.close()]);
  }
});

test("braid board prints the URL with the token in its fragment", async () => {
  const { spawn } = await import("node:child_process");
  const cli = fileURLToPath(new URL("../dist/cli.js", import.meta.url));
  const child = spawn(process.execPath, [cli, "board", "--no-open", "--demo"], { cwd: scratch, env: { ...process.env, HOME: scratch, USERPROFILE: scratch } });
  try {
    const out = await new Promise<string>((resolve, reject) => {
      let text = "";
      child.stdout.on("data", (c: Buffer) => {
        text += c.toString();
        if (text.includes("\n")) resolve(text);
      });
      child.on("error", reject);
      child.on("exit", () => reject(new Error(`exited: ${text}`)));
    });
    assert.match(out, /: http:\/\/127\.0\.0\.1:\d+\/#token=[0-9a-f]{48}\n/);
  } finally {
    const exited = new Promise((r) => child.once("exit", r));
    child.kill();
    await exited;
  }
});

test("a body over 64 KB gets 413 and runs no action", async () => {
  calls.length = 0;
  await withBoard(sources(), async (port, token) => {
    const big = JSON.stringify({ pad: "x".repeat(64 * 1024 + 1) });
    // The server may close the connection while the body is still being sent; either way no action ran.
    const r = await post(port, "/api/action/echo", { "x-braid-token": token }, big).catch(() => ({ status: 413, text: "" }));
    assert.equal(r.status, 413);
    assert.deepEqual(calls, []);
    const ok = await post(port, "/api/action/echo", { "x-braid-token": token }, JSON.stringify({ pad: "x".repeat(60 * 1024) }));
    assert.equal(ok.status, 200);
  });
});

test("a request without Origin passes with the token and a matching Host", async () => {
  calls.length = 0;
  await withBoard(sources(), async (port, token) => {
    const r = await post(port, "/api/action/echo", { "x-braid-token": token }, '{"a":2}');
    assert.equal(r.status, 200);
    assert.deepEqual(calls, [{ a: 2 }]);
  });
});

test("each refusal says which check failed and never echoes the token", async () => {
  await withBoard(sources(), async (port, token) => {
    const path = "/api/action/echo";
    const reason = async (headers: Record<string, string>): Promise<string> => {
      const r = await post(port, path, headers);
      assert.equal(r.status, 403);
      assert.ok(!r.text.includes(token));
      return (JSON.parse(r.text) as { error: string }).error;
    };
    assert.match(await reason({}), /no token for this board run/);
    assert.match(await reason({ "x-braid-token": "" }), /no token for this board run/);
    assert.match(await reason({ "x-braid-token": "nope" }), /from another `braid board` run/);
    assert.match(await reason({ "x-braid-token": token, origin: "http://evil.example" }), /Host or Origin/);
    assert.match(await reason({ "x-braid-token": token, host: "evil.example" }), /Host or Origin/);
  });
});
