import assert from "node:assert/strict";
import { createServer, request, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const scratch = mkdtempSync(join(tmpdir(), "braid-tailnet-"));
after(() => rmSync(scratch, { recursive: true, force: true, maxRetries: 20, retryDelay: 250 }));
const web = join(scratch, "web");
mkdirSync(web);
writeFileSync(join(web, "index.html"), "<!doctype html><title>board</title>");

interface Result {
  status: number | null;
  stdout: string;
  stderr: string;
}
type Runner = (args: readonly string[]) => Promise<Result>;
type Gate = (address: string, port: number) => Promise<boolean>;
interface Tailnet {
  ips: readonly string[];
  name: string | null;
  owner: string;
}
interface Sources {
  action(name: string): ((body: unknown) => unknown) | undefined;
  [key: string]: unknown;
}
interface TailnetListen {
  address: string;
  name: string | null;
  gate: Gate;
}
interface Started {
  server: Server;
  url: string;
  token: string;
  close(): Promise<void>;
  tailnet?: { server: Server; url: string };
}
interface TailnetModule {
  readTailnet(run: Runner): Promise<Tailnet>;
  tailnetAddress(host: string, tailnet: Tailnet): string;
  tailnetHosts(address: string, name: string | null, port: number): string[];
  whoisGate(owner: string, run: Runner, options?: { ttlMs?: number; timeoutMs?: number; now?: () => number }): Gate;
}
interface BoardModule {
  startBoardWith(src: Sources, web: string, refreshMs?: number, token?: string, tailnet?: TailnetListen, port?: number): Promise<Started>;
  demoSources(): Sources;
  runBoard(root: string, args: readonly string[], tailscale?: Runner): Promise<void>;
}
// A computed specifier keeps the compiled modules out of the typecheck, which runs before the build.
const load = async <T>(rel: string): Promise<T> => (await import(pathToFileURL(fileURLToPath(new URL(rel, import.meta.url))).href)) as T;
const tn = await load<TailnetModule>("../dist/board/tailnet.js");
const board = await load<BoardModule>("../dist/commands/board.js");

const OWNER = "owner@example.com";
const NAME = "pc.tail1234.ts.net";
const STATUS = {
  BackendState: "Running",
  Self: { DNSName: `${NAME}.`, TailscaleIPs: ["100.64.0.7", "fd7a:115c:a1e0::7"], UserID: 42 },
  User: { "42": { LoginName: OWNER }, "43": { LoginName: "other@example.com" } },
  CurrentTailnet: { MagicDNSSuffix: "tail1234.ts.net" },
};
const ok = (body: unknown): Result => ({ status: 0, stdout: JSON.stringify(body), stderr: "" });
const statusRunner = (status: unknown = STATUS): Runner => async (args) => (args[0] === "status" ? ok(status) : { status: 1, stdout: "", stderr: "no" });

const whois = (login: string, tags?: string[]) => ok({ Node: { ID: 1, Name: "phone", ...(tags === undefined ? {} : { Tags: tags }) }, UserProfile: { LoginName: login } });
const WHOIS: Record<string, () => Promise<Result>> = {
  owner: async () => whois(OWNER),
  other: async () => whois("other@example.com"),
  tagged: async () => whois(OWNER, ["tag:server"]),
  error: async () => ({ status: 1, stdout: "", stderr: "no match for IP:port" }),
  garbage: async () => ({ status: 0, stdout: "not json", stderr: "" }),
  hang: () => new Promise<Result>(() => {}),
};

// --- --host: which addresses are accepted

test("--host accepts tailscale, this machine's Tailscale IPs and its MagicDNS name", async () => {
  const t = await tn.readTailnet(statusRunner());
  assert.deepEqual(t, { ips: ["100.64.0.7", "fd7a:115c:a1e0::7"], name: NAME, owner: OWNER });
  assert.equal(tn.tailnetAddress("tailscale", t), "100.64.0.7");
  assert.equal(tn.tailnetAddress(NAME, t), "100.64.0.7");
  assert.equal(tn.tailnetAddress(`${NAME.toUpperCase()}.`, t), "100.64.0.7");
  assert.equal(tn.tailnetAddress("100.64.0.7", t), "100.64.0.7");
  assert.equal(tn.tailnetAddress("[fd7a:115c:a1e0::7]", t), "fd7a:115c:a1e0::7");
});

test("--host refuses 0.0.0.0, ::, a LAN address, a public one and another name, saying why", async () => {
  const t = await tn.readTailnet(statusRunner());
  assert.throws(() => tn.tailnetAddress("0.0.0.0", t), /every network/);
  assert.throws(() => tn.tailnetAddress("::", t), /every network/);
  assert.throws(() => tn.tailnetAddress("192.168.1.20", t), /not this machine's Tailscale address/);
  assert.throws(() => tn.tailnetAddress("8.8.8.8", t), /not this machine's Tailscale address/);
  assert.throws(() => tn.tailnetAddress("100.64.0.8", t), /not this machine's Tailscale address/);
  assert.throws(() => tn.tailnetAddress("evil.example", t), /not this machine's Tailscale address/);
  assert.throws(() => tn.tailnetAddress("pc", t), /not this machine's Tailscale address/);
  assert.throws(() => tn.tailnetAddress("127.0.0.1", t), /not this machine's Tailscale address/);
});

test("--host refuses when Tailscale is down, logged out, has no address, or this machine is tagged", async () => {
  await assert.rejects(tn.readTailnet(async () => ({ status: null, stdout: "", stderr: "spawn tailscale ENOENT" })), /Tailscale isn't available \(spawn tailscale ENOENT\)/);
  await assert.rejects(tn.readTailnet(async () => ({ status: 0, stdout: "{oops", stderr: "" })), /no readable answer/);
  await assert.rejects(tn.readTailnet(statusRunner({ ...STATUS, BackendState: "NeedsLogin" })), /NeedsLogin, not Running/);
  await assert.rejects(tn.readTailnet(statusRunner({ ...STATUS, Self: { ...STATUS.Self, TailscaleIPs: [] } })), /no Tailscale address/);
  await assert.rejects(tn.readTailnet(statusRunner({ ...STATUS, Self: { ...STATUS.Self, Tags: ["tag:server"] } })), /tagged node/);
  await assert.rejects(tn.readTailnet(statusRunner({ ...STATUS, User: {} })), /which user owns/);
});

test("braid board --host with a wrong address starts nothing", async () => {
  for (const host of ["0.0.0.0", "::", "192.168.1.20", "evil.example"]) {
    await assert.rejects(board.runBoard(scratch, ["--demo", "--no-open", "--host", host], statusRunner()), /--host: /);
  }
  await assert.rejects(board.runBoard(scratch, ["--demo", "--no-open", "--host"], statusRunner()), /--host needs an address/);
  await assert.rejects(board.runBoard(scratch, ["--demo", "--no-open", "--host", "tailscale"], async () => ({ status: 1, stdout: "", stderr: "failed to connect to local tailscaled" })), /Tailscale isn't available/);
});

// --- the whois gate

test("the whois gate allows only the owner's untagged node and fails closed", async () => {
  for (const [kind, want] of [["owner", true], ["other", false], ["tagged", false], ["error", false], ["garbage", false], ["hang", false]] as const) {
    const seen: string[][] = [];
    const gate = tn.whoisGate(OWNER, (args) => (seen.push([...args]), WHOIS[kind]!()), { timeoutMs: 50 });
    assert.equal(await gate("100.64.0.9", 5555), want, kind);
    assert.deepEqual(seen, [["whois", "--json", "100.64.0.9:5555"]]);
  }
  assert.equal(await tn.whoisGate(OWNER, async () => {
    throw new Error("boom");
  })("100.64.0.9", 1), false);
  assert.equal(await tn.whoisGate(OWNER, WHOIS["owner"]!)("not an ip", 1), false);
});

test("the whois gate keeps an answer per remote address for a few seconds", async () => {
  let calls = 0;
  let clock = 0;
  const gate = tn.whoisGate(OWNER, (args) => (calls++, args[2]?.startsWith("[") === true ? WHOIS["other"]!() : WHOIS["owner"]!()), { ttlMs: 5000, now: () => clock });
  assert.equal(await gate("::ffff:100.64.0.9", 1), true);
  assert.equal(await gate("100.64.0.9", 2), true);
  assert.equal(calls, 1);
  assert.equal(await gate("fd7a::9", 3), false);
  assert.equal(calls, 2);
  clock = 6000;
  assert.equal(await gate("100.64.0.9", 4), true);
  assert.equal(calls, 3);
});

// --- the Tailscale listener (bound to 127.0.0.1 here: CI has no tailscaled)

const actions: string[] = [];
const sources = (): Sources => ({
  ...board.demoSources(),
  action: (name) => (["start", "merge", "open"].includes(name) ? () => (actions.push(name), { ok: true }) : undefined),
});

async function withTailnet<T>(kind: keyof typeof WHOIS, run: (port: number, host: string, local: number, token: string) => Promise<T>): Promise<T> {
  const gate = tn.whoisGate(OWNER, WHOIS[kind]!, { timeoutMs: 50 });
  const started = await board.startBoardWith(sources(), web, undefined, undefined, { address: "127.0.0.1", name: NAME, gate });
  assert.ok(started.tailnet !== undefined);
  const port = (started.tailnet.server.address() as AddressInfo).port;
  assert.equal(started.tailnet.url, `http://${NAME}:${port}/`);
  try {
    return await run(port, `${NAME}:${port}`, (started.server.address() as AddressInfo).port, started.token);
  } finally {
    await started.close();
  }
}

function call(port: number, method: string, path: string, headers: Record<string, string>, body?: string): Promise<{ status: number; text: string }> {
  return new Promise((resolve, reject) => {
    const req = request({ host: "127.0.0.1", port, path, method, headers }, (res) => {
      let text = "";
      res.on("data", (c: Buffer) => (text += c.toString()));
      res.on("end", () => resolve({ status: res.statusCode ?? 0, text }));
    });
    req.on("error", reject);
    req.end(body);
  });
}
const ACT = { "content-type": "application/json", "x-braid-request": "1" };

for (const kind of ["other", "tagged", "error", "garbage", "hang"] as const) {
  test(`over Tailscale, a whois answer "${kind}" gets 403 for the page, the board data and an action`, async () => {
    actions.length = 0;
    await withTailnet(kind, async (port, host) => {
      assert.equal((await call(port, "GET", "/", { host })).status, 403);
      assert.equal((await call(port, "GET", "/api/board", { host })).status, 403);
      assert.equal((await call(port, "GET", "/api/events", { host })).status, 403);
      assert.equal((await call(port, "GET", "/api/all", { host })).status, 403);
      assert.equal((await call(port, "GET", "/api/projects", { host })).status, 403);
      assert.equal((await call(port, "POST", "/api/action/start", { ...ACT, host, origin: `http://${host}` }, '{"id":"0001"}')).status, 403);
    });
    assert.deepEqual(actions, []);
  });
}

test("over Tailscale, the owner gets the page, the data, Start and Merge; open is refused", async () => {
  actions.length = 0;
  await withTailnet("owner", async (port, host) => {
    const page = await call(port, "GET", "/", { host });
    assert.equal(page.status, 200);
    assert.match(page.text, /<title>board<\/title>/);
    assert.equal((await call(port, "GET", "/api/board", { host })).status, 200);
    assert.equal((await call(port, "GET", "/api/all", { host })).status, 200);
    assert.equal((await call(port, "GET", "/api/projects", { host })).status, 200);
    assert.equal((await call(port, "GET", `/api/board`, { host: `127.0.0.1:${port}` })).status, 200);
    const start = await call(port, "POST", "/api/action/start", { ...ACT, host, origin: `http://${host}` }, '{"id":"0001"}');
    assert.equal(start.status, 200);
    assert.equal((await call(port, "POST", "/api/action/merge", { ...ACT, host }, "{}")).status, 200);
    const open = await call(port, "POST", "/api/action/open", { ...ACT, host, origin: `http://${host}` }, '{"id":"0001"}');
    assert.equal(open.status, 403);
    assert.match(open.text, /app link/);
  });
  assert.deepEqual(actions, ["start", "merge"]);
});

test("over Tailscale, a wrong Host, a wrong Origin or an action without x-braid-request is refused", async () => {
  actions.length = 0;
  await withTailnet("owner", async (port, host, local, token) => {
    assert.notEqual(port, local);
    assert.equal((await call(port, "GET", "/", { host: `evil.example:${port}` })).status, 403);
    assert.equal((await call(port, "GET", "/api/board", { host: NAME })).status, 403);
    assert.equal((await call(port, "GET", "/api/board", { host: `localhost:${port}` })).status, 403);
    const path = "/api/action/start";
    assert.equal((await call(port, "POST", path, { ...ACT, host: `evil.example:${port}` }, "{}")).status, 403);
    assert.equal((await call(port, "POST", path, { ...ACT, host, origin: "http://evil.example" }, "{}")).status, 403);
    assert.equal((await call(port, "POST", path, { ...ACT, host, origin: `http://127.0.0.1:${local}` }, "{}")).status, 403);
    assert.equal((await call(port, "POST", path, { "content-type": "text/plain", host, origin: `http://${host}` }, "{}")).status, 403);
    assert.equal((await call(port, "POST", path, { "content-type": "application/json", host, "x-braid-token": token }, "{}")).status, 403);
    assert.equal((await call(port, "POST", path, { ...ACT, "x-braid-request": "0", host }, "{}")).status, 403);
    const missing = await call(port, "POST", path, { "content-type": "application/json", host }, "{}");
    assert.match(missing.text, /missing the x-braid-request header/);
    assert.match((await call(port, "POST", path, { ...ACT, host, origin: "http://evil.example" }, "{}")).text, /Host or Origin/);
    assert.equal((await call(port, "OPTIONS", path, { host, origin: "http://evil.example", "access-control-request-headers": "x-braid-request" })).status, 405);
  });
  assert.deepEqual(actions, []);
});

test("with --host the local board keeps its token, Host and Origin checks, and open", async () => {
  actions.length = 0;
  await withTailnet("other", async (_port, _host, local, token) => {
    const lhost = `127.0.0.1:${local}`;
    assert.equal((await call(local, "GET", "/api/board", { host: lhost })).status, 200);
    assert.equal((await call(local, "POST", "/api/action/open", { ...ACT, host: lhost }, "{}")).status, 403);
    assert.equal((await call(local, "POST", "/api/action/open", { ...ACT, host: lhost, "x-braid-token": token, origin: `http://${lhost}` }, "{}")).status, 200);
  });
  assert.deepEqual(actions, ["open"]);
});

// --- the Host allowlist, the remote field, --port

test("tailnetHosts allows the Tailscale address and the MagicDNS name with the port, and nothing else", () => {
  assert.deepEqual(tn.tailnetHosts("100.64.0.7", NAME, 8123), ["100.64.0.7:8123", `${NAME}:8123`]);
  assert.deepEqual(tn.tailnetHosts("100.64.0.7", null, 8123), ["100.64.0.7:8123"]);
  assert.deepEqual(tn.tailnetHosts("fd7a:115c:a1e0::7", NAME, 80), ["[fd7a:115c:a1e0::7]:80", `${NAME}:80`]);
  const hosts = tn.tailnetHosts("100.64.0.7", NAME, 8123);
  for (const bad of ["127.0.0.1:8123", "localhost:8123", "0.0.0.0:8123", "100.64.0.7", NAME, "100.64.0.7:8124", `${NAME}:8124`, "evil.example:8123"]) {
    assert.ok(!hosts.includes(bad), bad);
  }
});

test("the board data says remote: true on the Tailscale listener, false on the local one whatever Host it was opened by", async () => {
  await withTailnet("owner", async (port, host, local) => {
    const remote = JSON.parse((await call(port, "GET", "/api/board", { host })).text) as { remote: boolean };
    assert.equal(remote.remote, true);
    const mine = JSON.parse((await call(local, "GET", "/api/board", { host: `127.0.0.1:${local}` })).text) as { remote: boolean };
    assert.equal(mine.remote, false);
    const named = JSON.parse((await call(local, "GET", "/api/board", { host: `localhost:${local}` })).text) as { remote: boolean };
    assert.equal(named.remote, false);
  });
});

async function freePort(): Promise<number> {
  const probe = createServer();
  await new Promise<void>((done) => probe.listen(0, "127.0.0.1", done));
  const { port } = probe.address() as AddressInfo;
  await new Promise((done) => probe.close(done));
  return port;
}

test("--port serves the local listener on that port; one in use is refused and nothing stays listening", async () => {
  const port = await freePort();
  const started = await board.startBoardWith(sources(), web, undefined, undefined, undefined, port);
  try {
    assert.equal((started.server.address() as AddressInfo).port, port);
    assert.equal(started.url, `http://127.0.0.1:${port}/`);
    await assert.rejects(board.startBoardWith(sources(), web, undefined, undefined, undefined, port), /--port \d+ is already in use on 127\.0\.0\.1/);
    assert.equal((await call(port, "GET", "/api/board", { host: `127.0.0.1:${port}` })).status, 200);
  } finally {
    await started.close();
  }
});

test("--port with --host serves both listeners on that port; a port in use on the Tailscale address is refused", async () => {
  const port = await freePort();
  const gate = tn.whoisGate(OWNER, WHOIS["owner"]!, { timeoutMs: 50 });
  // Distinct loopback addresses stand in for 127.0.0.1 and the Tailscale IP.
  const started = await board.startBoardWith(sources(), web, undefined, undefined, { address: "127.0.0.2", name: NAME, gate }, port);
  try {
    assert.equal((started.server.address() as AddressInfo).port, port);
    assert.equal((started.tailnet?.server.address() as AddressInfo).port, port);
    assert.equal(started.tailnet?.url, `http://${NAME}:${port}/`);
  } finally {
    await started.close();
  }
  const blocker = createServer();
  await new Promise<void>((done) => blocker.listen(port, "127.0.0.2", done));
  try {
    await assert.rejects(board.startBoardWith(sources(), web, undefined, undefined, { address: "127.0.0.2", name: NAME, gate }, port), /--port \d+ is already in use on 127\.0\.0\.2/);
    // Nothing stays on the local address.
    await assert.rejects(call(port, "GET", "/", { host: `127.0.0.1:${port}` }), /ECONNREFUSED/);
  } finally {
    await new Promise((done) => blocker.close(done));
  }
});

test("braid board --port refuses a bad number or one in use before anything starts", async () => {
  for (const bad of ["0", "70000", "abc", "-1"]) {
    await assert.rejects(board.runBoard(scratch, ["--demo", "--no-open", "--port", bad]), /--port needs a port number/);
  }
  await assert.rejects(board.runBoard(scratch, ["--demo", "--no-open", "--port"]), /--port needs a port number/);
  const blocker = createServer();
  await new Promise<void>((done) => blocker.listen(0, "127.0.0.1", done));
  const { port } = blocker.address() as AddressInfo;
  try {
    await assert.rejects(board.runBoard(scratch, ["--demo", "--no-open", "--port", String(port)]), /already in use/);
  } finally {
    await new Promise((done) => blocker.close(done));
  }
});

test("the whois gate drops a timeout or failure at once but keeps a definite answer", async () => {
  for (const [first, firstWant] of [["hang", false], ["error", false]] as const) {
    let calls = 0;
    const gate = tn.whoisGate(OWNER, () => (calls++ === 0 ? WHOIS[first]!() : WHOIS["owner"]!()), { timeoutMs: 50, ttlMs: 5000, now: () => 0 });
    assert.equal(await gate("100.64.0.9", 1), firstWant, first);
    assert.equal(await gate("100.64.0.9", 2), true, `${first}: the next request asks again`);
    assert.equal(await gate("100.64.0.9", 3), true);
    assert.equal(calls, 2, `${first}: the owner's answer is then kept`);
  }
  let spawnFails = 0;
  const gate = tn.whoisGate(OWNER, async () => (spawnFails++ === 0 ? { status: null, stdout: "", stderr: "spawn tailscale ENOENT" } : WHOIS["owner"]!()), { ttlMs: 5000, now: () => 0 });
  assert.equal(await gate("100.64.0.9", 1), false);
  assert.equal(await gate("100.64.0.9", 2), true);
  // "Not the owner" is a definite answer: kept.
  let asked = 0;
  const other = tn.whoisGate(OWNER, () => (asked++, WHOIS["other"]!()), { ttlMs: 5000, now: () => 0 });
  assert.equal(await other("100.64.0.9", 1), false);
  assert.equal(await other("100.64.0.9", 2), false);
  assert.equal(asked, 1);
});

test("over Tailscale, a refused /api/ request is JSON that says to refresh; other paths stay plain forbidden", async () => {
  await withTailnet("hang", async (port, host) => {
    const api = await call(port, "GET", "/api/all", { host });
    assert.equal(api.status, 403);
    const body = JSON.parse(api.text) as { error: string };
    assert.match(body.error, /couldn't confirm through Tailscale who is asking/);
    assert.match(body.error, /Refresh the page; the board asks again/);
    assert.deepEqual(await call(port, "GET", "/", { host }), { status: 403, text: "forbidden" });
  });
  await withTailnet("owner", async (port) => {
    const api = await call(port, "GET", "/api/all", { host: "evil.example" });
    assert.equal(api.status, 403);
    assert.match((JSON.parse(api.text) as { error: string }).error, /Host/);
  });
});
