// The board's T3 sign-in (0080/D): `braid t3 login|logout|status|set` and the board's button, callback, state and pushes,
// against a fake T3 on 127.0.0.1 and an in-memory secret store. Settings go to a temporary folder; the real HOME, APPDATA
// and OS store are never read or written, and no test reaches a real T3.
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { request, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, afterEach, beforeEach, test } from "node:test";
import { inspect } from "node:util";
import { fileURLToPath, pathToFileURL } from "node:url";
import { approveIn, startFakeT3, type FakeT3 } from "./fixtures/t3-oauth-fake.ts";

interface Entry {
  token: string;
  expiresAt: string;
  issuer: string;
  mcpUrl: string;
  clientId: string;
}
type Stored = Entry | null | "none" | "locked";
interface Store {
  read(): Promise<Entry | null>;
  write(e: Entry): Promise<void>;
  remove(): Promise<boolean>;
  value(): Stored;
}
interface View {
  state: string;
  reason: string | null;
  origin: string | null;
  expiresAt: string | null;
  access: string;
  waitingUntil: string | null;
}
interface Push {
  key: string;
  title: string;
  body: string;
}
interface McpClient {
  callTool(name: string, args?: object): Promise<unknown>;
}
interface SignIn {
  view(): View;
  read(force?: boolean): Promise<void>;
  client(): McpClient | null;
  start(redirectUri: string): Promise<{ authorizeUrl: string; until: string }>;
  callback(q: URLSearchParams): Promise<{ status: number }>;
  close(): void;
}
interface Started {
  server: Server;
  url: string;
  token: string;
  close(): Promise<void>;
  tailnet?: { server: Server; url: string };
}

// Computed specifiers keep the compiled modules out of the typecheck, which runs before the build.
const load = async <T>(rel: string): Promise<T> => (await import(pathToFileURL(fileURLToPath(new URL(rel, import.meta.url))).href)) as T;
const { t3Command } = await load<{ t3Command(args: string[], deps: object): Promise<string> }>("../dist/commands/t3.js");
const { memoryStore, keyringStore } = await load<{ memoryStore(start?: Stored): Store; keyringStore(load: () => Promise<unknown>): { read(): Promise<unknown> } }>("../dist/t3/secret.js");
const { boardSignIn } = await load<{ boardSignIn(o: object): SignIn }>("../dist/t3/signin.js");
const { checkOrigin } = await load<{ checkOrigin(raw: string, localOnly: boolean): string }>("../dist/t3/oauth.js");
const board = await load<{
  startBoardWith(src: object, web: string, refreshMs?: number, token?: string, tailnet?: object, port?: number, timeoutMs?: number, signin?: SignIn): Promise<Started>;
  demoSources(): object;
}>("../dist/commands/board.js");

const scratch = mkdtempSync(join(tmpdir(), "braid-t3-signin-"));
after(() => rmSync(scratch, { recursive: true, force: true, maxRetries: 20, retryDelay: 250 }));
const web = join(scratch, "web");
mkdirSync(web);
writeFileSync(join(web, "index.html"), "<!doctype html><title>board</title>");

let t3: FakeT3;
let home: string;
let n = 0;
beforeEach(async () => {
  t3 = await startFakeT3();
  home = join(scratch, `home-${(n += 1)}`);
  mkdirSync(home);
});
afterEach(() => t3.close());

const day = 86_400_000;
const entryFor = (token: string, endsInMs = 30 * day): Entry => ({ token, expiresAt: new Date(Date.now() + endsInMs).toISOString(), issuer: t3.origin, mcpUrl: `${t3.origin}/mcp`, clientId: "client-1" });
const noToken = (text: string, ...tokens: string[]) => {
  for (const t of [...tokens, ...t3.issued]) {
    assert.ok(!text.includes(t), `a token is in: ${text.slice(0, 300)}`);
  }
};

/** `braid t3 login --url <fake>` with a browser that approves at once; `edit` tampers with the callback first. */
async function login(store: Store, edit?: (u: URL) => void, extra: object = {}) {
  const landed: { status: number; text: string }[] = [];
  const opened: string[] = [];
  const browsing: Promise<unknown>[] = [];
  const out = await t3Command(["login", "--url", t3.origin], {
    store,
    home,
    write: () => {},
    waitMs: 3_000,
    open: (url: string) => {
      opened.push(url);
      browsing.push(approveIn(url, edit).then((r) => landed.push(r)));
    },
    ...extra,
  }).then(
    (text) => ({ ok: true as const, text }),
    (e: unknown) => ({ ok: false as const, text: String((e as Error).message), error: e }),
  );
  await Promise.allSettled(browsing);
  return { out, landed, opened };
}

// --- braid t3 login

test("login signs in at Full access and keeps the token only in the store", async () => {
  const store = memoryStore();
  const { out, landed, opened } = await login(store);
  assert.ok(out.ok, out.text);
  assert.match(out.text, new RegExp(`Signed in to T3 at ${t3.origin.replace(/[.]/g, "\\.")} until`));
  const kept = store.value() as Entry;
  assert.equal(kept.token, t3.issued[0]);
  assert.equal(kept.issuer, t3.origin);
  assert.equal(kept.mcpUrl, `${t3.origin}/mcp`);
  assert.ok(Math.abs(Date.parse(kept.expiresAt) - (Date.now() + 30 * day)) < 60_000);
  assert.equal(landed[0]?.status, 200);
  assert.match(landed[0]?.text ?? "", /Signed in to T3/);
  noToken(out.text + landed[0]?.text + opened.join(" "));
  assert.ok(!(landed[0]?.text ?? "").includes("code="), "the page names the code");
  // the settings file holds no secret: login wrote none
  assert.throws(() => readFileSync(join(home, "t3.json"), "utf8"));
});

test("login: a callback with a wrong state gets 404 and the sign-in goes on only with the right one", async () => {
  const store = memoryStore();
  let wrong = 0;
  const { out } = await login(store, undefined, {
    open: (url: string) =>
      void (async () => {
        const answer = await fetch(url, { redirect: "manual" });
        const callback = new URL(answer.headers.get("location") ?? "");
        const forged = new URL(callback);
        forged.searchParams.set("state", "forged");
        wrong = (await fetch(forged)).status;
        const other = new URL(callback);
        other.pathname = "/elsewhere";
        assert.equal((await fetch(other)).status, 404);
        await fetch(callback);
      })(),
  });
  assert.ok(out.ok, out.text);
  assert.equal(wrong, 404);
  assert.equal((store.value() as Entry).token, t3.issued[0]);
});

test("login: a reused callback gets 404", async () => {
  const store = memoryStore();
  let callback: URL | undefined;
  const { out } = await login(store, (u) => void (callback = new URL(u)));
  assert.ok(out.ok, out.text);
  // the one-off listener is gone; nothing answers the same answer twice
  await assert.rejects(fetch(callback ?? ""));
});

for (const [iss, words] of [["wrong", /another issuer/], ["missing", /no iss/]] as const) {
  test(`login refuses an answer with a ${iss} iss and keeps nothing`, async () => {
    t3.switches.iss = iss;
    const store = memoryStore();
    const { out } = await login(store);
    assert.equal(out.ok, false);
    assert.match(out.text, words);
    assert.equal(store.value(), null);
  });
}

test("login refuses an expired code and keeps nothing", async () => {
  t3.switches.codeTtlMs = 0;
  const store = memoryStore();
  const { out } = await login(store);
  assert.equal(out.ok, false);
  assert.match(out.text, /invalid_grant/);
  assert.equal(store.value(), null);
});

for (const level of ["approval-required", "read-only"] as const) {
  test(`login refuses a sign-in at ${level}, revokes it in T3 and keeps nothing`, async () => {
    t3.switches.level = level;
    const store = memoryStore();
    const { out } = await login(store);
    assert.equal(out.ok, false);
    assert.match(out.text, level === "read-only" ? /T3 approved Read only/ : /below Full access/);
    assert.equal(store.value(), null);
    assert.deepEqual(t3.revoked, t3.issued);
    noToken(out.text);
  });
}

test("login says so when the user denies it in T3", async () => {
  t3.switches.deny = true;
  const { out } = await login(memoryStore());
  assert.equal(out.ok, false);
  assert.match(out.text, /denied in T3/);
});

test("login refuses with no secret store and calls T3 for nothing", async () => {
  for (const kind of ["none", "locked"] as const) {
    const { out } = await login(memoryStore(kind));
    assert.equal(out.ok, false);
    assert.match(out.text, /secret store/);
  }
  assert.deepEqual(t3.requests, []);
});

test("a missing keyring library reads as no secret store, not a crash", async () => {
  const store = keyringStore(async () => {
    throw new Error("Cannot find module '@napi-rs/keyring-linux-x64-gnu'");
  });
  await assert.rejects(store.read(), (e: Error) => e.name === "NoSecretStore" && /no secret store/.test(e.message) && !e.message.includes("Cannot find"));
});

test("a non-local address is refused while local only is on, and over plain http when it is off", async () => {
  assert.throws(() => checkOrigin("https://t3.example.ts.net", true), /isn't a local T3 address and local only is on/);
  assert.throws(() => checkOrigin("http://t3.example.ts.net", false), /only over https/);
  assert.equal(checkOrigin("https://t3.example.ts.net", false), "https://t3.example.ts.net");
  assert.equal(checkOrigin("http://localhost:3773", true), "http://localhost:3773");
  assert.equal(checkOrigin("http://127.0.0.1:3773/", true), "http://127.0.0.1:3773");
  assert.throws(() => checkOrigin("http://127.0.0.1:3773/mcp", true), /address alone/);
  await assert.rejects(t3Command(["login", "--url", "https://t3.example.ts.net"], { store: memoryStore(), home }), /local only is on/);
  await t3Command(["set", "--local-only", "off"], { home });
  await assert.rejects(t3Command(["login", "--url", "http://t3.example.ts.net"], { store: memoryStore(), home }), /only over https/);
});

// --- logout, status, set

test("logout revokes the token in T3 and deletes the entry", async () => {
  const store = memoryStore(entryFor("tok-logout"));
  const out = await t3Command(["logout"], { store, home });
  assert.match(out, /revoked "braid board"/);
  assert.deepEqual(t3.revoked, ["tok-logout"]);
  assert.equal(store.value(), null);
  noToken(out, "tok-logout");
  assert.match(await t3Command(["logout"], { store, home }), /Not signed in/);
});

test("logout with T3 down deletes the entry and says to revoke it in T3's Settings", async () => {
  const store = memoryStore(entryFor("tok-down"));
  await t3.close();
  const out = await t3Command(["logout"], { store, home });
  assert.match(out, /Settings → Sharing & access/);
  assert.equal(store.value(), null);
  noToken(out, "tok-down");
});

test("status shows the sign-in and the two settings, never the token; set changes them", async () => {
  const store = memoryStore(entryFor("tok-status"));
  const out = await t3Command(["status"], { store, home });
  assert.match(out, /T3 sign-in: signed in at http:\/\/127\.0\.0\.1:\d+ · Full access · until \w{3} \w{3} \d+ \d\d:\d\d \(in 30 d\)/);
  assert.match(out, /access auto .*local only on/);
  noToken(out, "tok-status");
  assert.match(await t3Command(["set", "--access", "cli"], { home }), /access cli/);
  assert.deepEqual(JSON.parse(readFileSync(join(home, "t3.json"), "utf8")), { access: "cli", localOnly: true });
  assert.match(await t3Command(["status"], { store, home }), /access cli .*local only on/);
  assert.match(await t3Command(["status"], { store: memoryStore(), home }), /signed out \(not signed in\); run braid t3 login/);
  assert.match(await t3Command(["status"], { store: memoryStore("none"), home }), /signed out \(no secret store\)/);
  assert.match(await t3Command(["status"], { store: memoryStore(entryFor("t", -day)), home }), /signed out \(ended on/);
  await assert.rejects(t3Command(["set"], { home }), /needs --access/);
  await assert.rejects(t3Command(["set", "--access", "sometimes"], { home }), /auto or cli/);
  writeFileSync(join(home, "t3.json"), "{not json");
  assert.match(await t3Command(["status"], { store, home }), /access auto .*local only on/);
});

// --- the board's state, pushes and 401

function signIn(store: Store, extra: object = {}) {
  const pushes: Push[] = [];
  const s = boardSignIn({ store, origin: () => t3.origin, sentFile: join(home, "t3-notified.json"), send: async (p: Push) => void pushes.push(p), ...extra });
  return { s, pushes };
}

test("the board reads the store: in, soon (one push, once), ended, none", async () => {
  const ending = entryFor("tok-soon", 3 * day);
  const soon = signIn(memoryStore(ending));
  await soon.s.read(true);
  assert.equal(soon.s.view().state, "soon");
  await soon.s.read(true);
  assert.equal(soon.pushes.length, 1);
  assert.match(soon.pushes[0]?.title ?? "", /T3 sign-in ends on/);
  soon.s.close();
  // A board restart reads the sent key from the file: no second push for the same sign-in.
  const again = signIn(memoryStore(ending));
  await again.s.read(true);
  assert.equal(again.pushes.length, 0);
  again.s.close();
  for (const [stored, state, reason] of [[entryFor("tok-in"), "in", null], [entryFor("tok-old", -1000), "out", "ended"], [null, "out", "not signed in"], ["none", "out", "no secret store"], ["locked", "out", "no secret store"]] as const) {
    const b = signIn(memoryStore(stored));
    await b.s.read(true);
    assert.equal(b.s.view().state, state);
    assert.equal(b.s.view().reason, reason);
    assert.equal(b.pushes.length, 0);
    noToken(JSON.stringify(b.s.view()), "tok-in", "tok-old");
    b.s.close();
  }
});

test("a 401 signs the board out with no retry and one push; a new sign-in signs it in again", async () => {
  t3.switches.refuseAll = true;
  const store = memoryStore(entryFor("tok-refused"));
  const b = signIn(store);
  await b.s.read(true);
  const client = b.s.client();
  assert.ok(client !== null);
  await assert.rejects(client.callTool("t3_thread_list"), (e: Error) => e.name === "McpError" && !inspect(e, { depth: 5 }).includes("tok-refused"));
  assert.equal(t3.mcpCalls.length, 1, "the refused call was retried");
  await b.s.read(true);
  assert.equal(b.s.view().state, "out");
  assert.equal(b.s.view().reason, "refused");
  assert.equal(b.s.client(), null);
  assert.equal(b.pushes.length, 1);
  assert.match(b.pushes[0]?.title ?? "", /refused/);
  // Read again: still the refused token, so still out and no second push; nothing calls T3.
  await b.s.read(true);
  assert.equal(b.s.view().reason, "refused");
  assert.equal(b.pushes.length, 1);
  assert.equal(t3.mcpCalls.length, 1);
  noToken(JSON.stringify(b.pushes) + JSON.stringify(b.s.view()), "tok-refused");
  await store.write(entryFor("tok-new"));
  await b.s.read(true);
  assert.equal(b.s.view().state, "in");
  b.s.close();
});

test("a connection error is T3 down, not signed out", async () => {
  const b = signIn(memoryStore(entryFor("tok-down")));
  await b.s.read(true);
  await t3.close();
  await assert.rejects(b.s.client()?.callTool("t3_thread_list") ?? Promise.reject(new Error("no client")), (e: Error & { kind?: string }) => e.kind === "unreachable");
  assert.equal(b.s.view().state, "in");
  assert.equal(b.pushes.length, 0);
  b.s.close();
});

test("access cli keeps the board on the command line while signed in", async () => {
  const b = signIn(memoryStore(entryFor("tok-cli")), { settings: () => ({ access: "cli", localOnly: true }) });
  await b.s.read(true);
  assert.equal(b.s.view().state, "in");
  assert.equal(b.s.view().access, "cli");
  assert.equal(b.s.client(), null);
  b.s.close();
});

// --- the board's button and callback

function call(port: number, method: string, path: string, headers: Record<string, string> = {}, body?: string): Promise<{ status: number; text: string }> {
  return new Promise((resolve, reject) => {
    const req = request({ host: "127.0.0.1", port, path, method, headers: { host: `127.0.0.1:${port}`, ...headers } }, (res) => {
      let text = "";
      res.on("data", (c: Buffer) => (text += c.toString()));
      res.on("end", () => resolve({ status: res.statusCode ?? 0, text }));
    });
    req.on("error", reject);
    req.end(body);
  });
}

async function withBoard(store: Store, run: (b: { port: number; token: string; s: SignIn; pushes: Push[]; tailnet: number; now: { ms: number } }) => Promise<void>) {
  const now = { ms: Date.now() };
  const { s, pushes } = signIn(store, { now: () => now.ms });
  const started = await board.startBoardWith(board.demoSources(), web, 60_000, undefined, { address: "127.0.0.1", name: null, gate: async () => true }, 0, undefined, s);
  try {
    await s.read(true);
    await run({ port: (started.server.address() as AddressInfo).port, token: started.token, s, pushes, tailnet: (started.tailnet?.server.address() as AddressInfo).port, now });
  } finally {
    await started.close();
  }
}
const act = (port: number, token: string) => ({ "content-type": "application/json", "x-braid-token": token, origin: `http://127.0.0.1:${port}` });

test("the button signs in from the host through the board's own callback", async () => {
  const store = memoryStore();
  await withBoard(store, async ({ port, token }) => {
    assert.equal((await call(port, "POST", "/api/t3/login", { "content-type": "application/json" }, "{}")).status, 403, "no board token");
    const started = await call(port, "POST", "/api/t3/login", act(port, token), "{}");
    assert.equal(started.status, 200, started.text);
    const { authorizeUrl, view } = JSON.parse(started.text) as { authorizeUrl: string; view: View };
    assert.ok(view.waitingUntil !== null);
    assert.equal(new URL(new URL(authorizeUrl).searchParams.get("redirect_uri") ?? "").href, `http://127.0.0.1:${port}/t3/callback`);
    const landed = await approveIn(authorizeUrl);
    assert.equal(landed.status, 200);
    assert.match(landed.text, /Signed in to T3/);
    assert.equal((store.value() as Entry).token, t3.issued[0]);
    const all = await call(port, "GET", "/api/all");
    const seen = (JSON.parse(all.text) as { t3SignIn: View }).t3SignIn;
    assert.equal(seen.state, "in");
    assert.equal(seen.waitingUntil, null);
    noToken(all.text + started.text + landed.text);
    // the same answer again: the sign-in is spent
    assert.equal((await call(port, "GET", `${landed.callback.pathname}${landed.callback.search}`)).status, 404);
    // and the board's sign-out revokes it
    const out = await call(port, "POST", "/api/t3/logout", act(port, token), "{}");
    assert.equal(out.status, 200);
    assert.deepEqual(JSON.parse(out.text).revoked, true);
    assert.deepEqual(t3.revoked, t3.issued);
    assert.equal(store.value(), null);
    noToken(out.text);
  });
});

test("the callback answers 404 to anything but the pending click's own state: wrong, none, expired, cancelled, over Tailscale", async () => {
  await withBoard(memoryStore(), async ({ port, token, tailnet, now }) => {
    assert.equal((await call(port, "GET", "/t3/callback?code=x&state=y")).status, 404, "no sign-in pending");
    const { authorizeUrl } = JSON.parse((await call(port, "POST", "/api/t3/login", act(port, token), "{}")).text) as { authorizeUrl: string };
    const wrong = await approveIn(authorizeUrl, (u) => u.searchParams.set("state", "forged"));
    assert.equal(wrong.status, 404);
    const callback = (await approveIn(authorizeUrl, (u) => u.searchParams.set("state", "forged"))).callback;
    callback.searchParams.set("state", new URL(authorizeUrl).searchParams.get("state") ?? "");
    const path = `${callback.pathname}${callback.search}`;
    assert.equal((await call(tailnet, "GET", path, { host: `127.0.0.1:${tailnet}` })).status, 404, "over Tailscale");
    assert.equal((await call(port, "POST", path)).status, 404, "a POST");
    now.ms += 5 * 60_000 + 1;
    assert.equal((await call(port, "GET", path)).status, 404, "expired");
    now.ms -= 5 * 60_000 + 1;
    await call(port, "POST", "/api/t3/cancel", act(port, token), "{}");
    assert.equal((await call(port, "GET", path)).status, 404, "cancelled");
    assert.deepEqual(t3.issued, [], "a code was exchanged");
  });
});

test("from the phone the button starts nothing, and sign-out works", async () => {
  const store = memoryStore(entryFor("tok-phone"));
  await withBoard(store, async ({ tailnet }) => {
    const host = `127.0.0.1:${tailnet}`;
    const phone = { "content-type": "application/json", "x-braid-request": "1", host, origin: `http://${host}` };
    const refused = await call(tailnet, "POST", "/api/t3/login", phone, "{}");
    assert.equal(refused.status, 403);
    assert.match(refused.text, /Sign in from the board on the PC, or run braid t3 login/);
    assert.deepEqual(t3.requests, []);
    const all = JSON.parse((await call(tailnet, "GET", "/api/all", { host })).text) as { remote: boolean; t3SignIn: View };
    assert.equal(all.remote, true);
    assert.equal(all.t3SignIn.state, "in");
    const out = await call(tailnet, "POST", "/api/t3/logout", phone, "{}");
    assert.equal(out.status, 200);
    assert.deepEqual(t3.revoked, ["tok-phone"]);
    assert.equal(store.value(), null);
  });
});

test("with no secret store the button refuses to start and the board shows it", async () => {
  await withBoard(memoryStore("none"), async ({ port, token }) => {
    const refused = await call(port, "POST", "/api/t3/login", act(port, token), "{}");
    assert.equal(refused.status, 400);
    assert.match(refused.text, /no secret store/);
    assert.equal((JSON.parse((await call(port, "GET", "/api/all")).text) as { t3SignIn: View }).t3SignIn.reason, "no secret store");
    assert.deepEqual(t3.requests, []);
  });
});
