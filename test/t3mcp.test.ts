// The T3 MCP client and events reader against the mock T3; no test reaches a real one.
import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { inspect } from "node:util";
import { fileURLToPath, pathToFileURL } from "node:url";
import { MOCK_TOKEN, startT3Mock, type Milestone } from "./fixtures/t3-mcp-mock.ts";

interface Client {
  call(method: string, params?: object): Promise<unknown>;
  callTool(name: string, args?: object): Promise<unknown>;
}
interface Reader {
  readonly cursor: string | null;
  pollOnce(): Promise<number>;
}

// Computed specifiers keep the compiled modules out of the typecheck, which runs before the build.
const load = (path: string) => import(pathToFileURL(fileURLToPath(new URL(path, import.meta.url))).href);
const { mcpClient } = (await load("../dist/t3mcp/client.js")) as {
  mcpClient: (endpoint: string, token: () => string | Promise<string>, options?: { timeoutMs?: number }) => Client;
};
const { eventsReader } = (await load("../dist/t3mcp/events.js")) as {
  eventsReader: (
    client: Client,
    name: string,
    args: object,
    handlers: { onEvent(event: Milestone): void; onReread(): void | Promise<void> },
    options?: { maxEvents?: number },
  ) => Reader;
};

let mock: Awaited<ReturnType<typeof startT3Mock>>;
beforeEach(async () => {
  mock = await startT3Mock();
});
afterEach(() => mock.close());

const client = (token = MOCK_TOKEN, timeoutMs = 5_000) => mcpClient(mock.url, () => token, { timeoutMs });

const settle = (n: number, extra: Partial<Milestone> = {}) =>
  mock.hub.publish({ id: `run-${n}`, type: "thread.run_settled", projectId: "p1", threadId: `t${n}`, ...extra });

function reading(args: object = {}, maxEvents?: number) {
  const seen: string[] = [];
  const reader = eventsReader(
    client(),
    "thread.run_settled",
    args,
    { onEvent: (e) => void seen.push(e.id), onReread: () => void seen.push("reread") },
    maxEvents === undefined ? {} : { maxEvents },
  );
  return {
    reader,
    /** Polls once and returns what the handlers saw during it, in order. */
    async poll() {
      seen.length = 0;
      await reader.pollOnce();
      return [...seen];
    },
  };
}

/** The error a call fails with, checked to hold the token nowhere. */
async function failure(call: Promise<unknown>, token = MOCK_TOKEN): Promise<{ kind: string; code?: unknown; message: string }> {
  const error = await call.then(
    () => assert.fail("the call succeeded"),
    (e: unknown) => e as Error & { kind: string; code?: unknown },
  );
  assert.equal(error.name, "McpError");
  assert.ok(!inspect(error, { depth: 10, showHidden: true }).includes(token), "the token is in the error");
  return error;
}

test("the first poll starts from now; later ones return only what is new", async () => {
  settle(1);
  const { reader, poll } = reading();
  assert.equal(reader.cursor, null);
  assert.deepEqual(await poll(), []);
  settle(2);
  assert.deepEqual(await poll(), ["run-2"]);
  const cursor = reader.cursor;
  assert.deepEqual(await poll(), [], "nothing new: no events and no re-read");
  assert.equal(reader.cursor, cursor);
  assert.equal(await reader.pollOnce(), 30_000);
});

test("pages while T3 has more", async () => {
  const { poll } = reading({}, 2);
  await poll();
  for (const n of [1, 2, 3, 4, 5]) settle(n);
  const before = mock.requests.length;
  assert.deepEqual(await poll(), ["run-1", "run-2", "run-3", "run-4", "run-5"]);
  assert.equal(mock.requests.length - before, 3);
});

test("falling behind asks for a full re-read before applying what is kept", async () => {
  const { poll } = reading();
  await poll();
  for (let n = 1; n <= 7; n++) settle(n);
  assert.deepEqual(await poll(), ["reread", "run-3", "run-4", "run-5", "run-6", "run-7"]);
  assert.deepEqual(await poll(), []);
});

test("a T3 restart asks for a full re-read and reads on from the new cursor", async () => {
  const { reader, poll } = reading();
  await poll();
  settle(1);
  await poll();
  const before = reader.cursor;
  mock.hub.restart();
  settle(2);
  assert.deepEqual(await poll(), ["reread", "run-2"]);
  assert.notEqual(reader.cursor, before);
  settle(3);
  assert.deepEqual(await poll(), ["run-3"]);
});

test("a failed re-read keeps the cursor, so the next poll asks for it again", async () => {
  let fail = true;
  let rereads = 0;
  const reader = eventsReader(client(), "thread.run_settled", {}, {
    onEvent: () => {},
    onReread: () => {
      rereads++;
      if (fail) throw new Error("read failed");
    },
  });
  await reader.pollOnce();
  const cursor = reader.cursor;
  mock.hub.restart();
  await assert.rejects(reader.pollOnce(), /read failed/);
  assert.equal(reader.cursor, cursor);
  fail = false;
  await reader.pollOnce();
  assert.equal(rereads, 2);
});

test("a filter by project leaves out other projects and subagent children", async () => {
  const { poll } = reading({ projectIds: ["p1"] });
  await poll();
  settle(1);
  settle(2, { projectId: "p2" });
  settle(3, { isSubagentChild: true });
  assert.deepEqual(await poll(), ["run-1"]);
});

test("a tool call returns the structured result, with the headers T3 checks and none it refuses", async () => {
  const listed = (await client().callTool("t3_thread_list", { allProjects: true })) as { threads: { threadId: string }[] };
  assert.equal(listed.threads[0]?.threadId, "t1");
  const sent = mock.requests.at(-1);
  assert.equal(sent?.headers["mcp-method"], "tools/call");
  assert.equal(sent?.headers["mcp-name"], "t3_thread_list");
  assert.equal(sent?.headers["mcp-protocol-version"], "2026-07-28");
  assert.equal(sent?.headers.origin, undefined);
  assert.equal(sent?.headers["t3-mode-limit"], undefined);
  assert.deepEqual(sent?.params["arguments"], { allProjects: true });
  assert.deepEqual(await client().callTool("t3_thread_interrupt", { threadId: "t1", stop: true }), {
    threadId: "t1",
    runId: "run-1",
    status: "interrupt_requested",
  });
});

test("an answer sent as server-sent events is read", async () => {
  mock.switches.sse = true;
  const listed = (await client().callTool("t3_thread_list")) as { projectId: string };
  assert.equal(listed.projectId, "p1");
});

test("a failed tool and a JSON-RPC error are errors with their code", async () => {
  mock.switches.aboveLevel.add("t9");
  const denied = await failure(client().callTool("t3_thread_interrupt", { threadId: "t9", stop: true }));
  assert.equal(denied.kind, "error");
  assert.equal(denied.code, "runtime_mode_escalation_denied");
  assert.match(denied.message, /above this client's/);
  const unknown = await failure(client().callTool("t3_nothing"));
  assert.equal(unknown.kind, "error");
  assert.equal(unknown.code, -32602);
  assert.match(unknown.message, /Tool 't3_nothing' not found/);
  const method = await failure(client().call("nothing/at-all"));
  assert.equal(method.code, -32601);
});

test("a 401 is unauthorized and is not retried", async () => {
  mock.switches.unauthorized = true;
  const refused = await failure(client().callTool("t3_thread_list"));
  assert.equal(refused.kind, "unauthorized");
  assert.equal(mock.requests.length, 1);
  const { reader } = reading();
  assert.equal((await failure(reader.pollOnce())).kind, "unauthorized");
  assert.equal(mock.requests.length, 2);
  assert.equal(reader.cursor, null);
});

test("T3 down or silent is unreachable, and the reader goes on from its cursor", async () => {
  const { reader, poll } = reading();
  await poll();
  const cursor = reader.cursor;
  await mock.down();
  const down = await failure(reader.pollOnce());
  assert.equal(down.kind, "unreachable");
  assert.equal(reader.cursor, cursor);
  await mock.up();
  settle(1);
  assert.deepEqual(await poll(), ["run-1"]);
  mock.switches.hang = true;
  const silent = await failure(client(MOCK_TOKEN, 200).callTool("t3_thread_list"));
  assert.equal(silent.kind, "unreachable");
  assert.match(silent.message, /no answer within 200 ms/);
});

test("the token is in no error, even when fetch or the server would quote it", async () => {
  // fetch quotes a header value it rejects.
  const broken = "secret-part\nsecond-line";
  const rejected = await failure(client(broken).callTool("t3_thread_list"), "secret-part");
  assert.equal(rejected.kind, "unreachable");
  const echoed = await failure(client().callTool(MOCK_TOKEN));
  assert.match(echoed.message, /Tool '\[token\]' not found/);
});

/** A one-off server answering every request with `reply`; returns its URL and the paths it was asked for. */
async function plainServer(reply: (res: import("node:http").ServerResponse) => void) {
  const { createServer } = await import("node:http");
  const paths: string[] = [];
  const server = createServer((req, res) => {
    paths.push(req.url ?? "");
    reply(res);
  });
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  const { port } = server.address() as import("node:net").AddressInfo;
  return { url: `http://127.0.0.1:${port}/mcp`, paths, close: () => new Promise<void>((done) => server.close(() => done())) };
}

test("a redirect is refused: the call goes nowhere else and fails as unreachable", async () => {
  const target = await plainServer((res) => res.writeHead(200, { "content-type": "application/json" }).end("{}"));
  const redirecting = await plainServer((res) => res.writeHead(307, { location: target.url }).end());
  try {
    const refused = await failure(mcpClient(redirecting.url, () => MOCK_TOKEN, { timeoutMs: 5_000 }).callTool("t3_thread_list"));
    assert.equal(refused.kind, "unreachable");
    assert.equal(redirecting.paths.length, 1);
    assert.deepEqual(target.paths, [], "the redirect was followed");
  } finally {
    await redirecting.close();
    await target.close();
  }
});

test("a bare 5xx without a JSON-RPC answer is unreachable with its status", async () => {
  const broken = await plainServer((res) => res.writeHead(503, { "content-type": "text/plain" }).end("Service Unavailable"));
  try {
    const down = await failure(mcpClient(broken.url, () => MOCK_TOKEN, { timeoutMs: 5_000 }).callTool("t3_thread_list"));
    assert.equal(down.kind, "unreachable");
    assert.equal(down.code, 503);
  } finally {
    await broken.close();
  }
});

test("a tool call reads the token once, a failed one too", async () => {
  let reads = 0;
  const counted = mcpClient(mock.url, () => {
    reads += 1;
    return MOCK_TOKEN;
  });
  await counted.callTool("t3_thread_list");
  assert.equal(reads, 1);
  await failure(counted.callTool("no_such_tool"));
  assert.equal(reads, 2);
});
