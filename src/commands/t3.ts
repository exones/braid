// `braid t3 login|logout|status|set`: sign the board in to T3's MCP once, at Full access, with the token only in the OS
// secret store (src/t3/secret.ts); sign out (revoking it in T3); show the state and the two settings; change them.
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { braidHome } from "../notify/config.js";
import { callbackPage, checkOrigin, defaultOrigin, discover, finish, matches, newPending, openUrl, PENDING_MS, register, SignInError, type Pending } from "../t3/oauth.js";
import { keyringStore, NoSecretStore, type SecretStore, type SignInEntry } from "../t3/secret.js";
import { readSettings, settingsFile, settingsLine, writeSettings, type T3Settings } from "../t3/settings.js";
import { keep, signOutOf } from "../t3/signin.js";
import { fullDate, SOON_MS, statusLine, type SignInView } from "../t3/words.js";
import { UsageError } from "./braids.js";

export interface T3Deps {
  readonly store?: SecretStore;
  readonly home?: string;
  readonly env?: NodeJS.ProcessEnv;
  readonly fetch?: typeof fetch;
  /** Opens the approval page; `openUrl` (no shell) unless given. */
  readonly open?: (url: string) => void;
  /** Where lines go while `login` waits; standard output unless given. */
  readonly write?: (text: string) => void;
  readonly now?: () => number;
  /** How long `login` waits for T3's answer; 5 minutes unless given. */
  readonly waitMs?: number;
}

const USAGE = "usage: braid t3 login [--url <origin>] | logout | status | set [--access auto|cli] [--local-only on|off]";

function option(args: readonly string[], flag: string): string | undefined {
  const at = args.indexOf(flag);
  if (at === -1) {
    return undefined;
  }
  const value = args[at + 1];
  if (value === undefined || value.startsWith("--")) {
    throw new UsageError(`${flag} needs a value; ${USAGE}`);
  }
  return value;
}

function only(args: readonly string[], allowed: readonly string[]): void {
  const extra = args.filter((a, i) => !(allowed.includes(a) || (i > 0 && allowed.includes(args[i - 1] ?? ""))));
  if (extra.length > 0) {
    throw new UsageError(`unexpected ${extra.join(" ")}; ${USAGE}`);
  }
}

/** The view of a stored entry as `braid t3 status` shows it (the board adds what a 401 told it). */
export function entryView(entry: SignInEntry | null | "no store", settings: T3Settings, now: number): SignInView {
  const base = { access: settings.access, waitingUntil: null, refusedAt: null };
  if (entry === "no store") {
    return { ...base, state: "out", reason: "no secret store", origin: null, expiresAt: null };
  }
  if (entry === null) {
    return { ...base, state: "out", reason: "not signed in", origin: null, expiresAt: null };
  }
  const left = Date.parse(entry.expiresAt) - now;
  return { ...base, state: left <= 0 ? "out" : left <= SOON_MS ? "soon" : "in", reason: left <= 0 ? "ended" : null, origin: entry.issuer, expiresAt: entry.expiresAt };
}

/** Listens on 127.0.0.1 on a port the OS picks for T3's one answer: only `/callback` with the pending `state`, once; else 404. */
async function waitForAnswer(make: (redirectUri: string) => Promise<Pending>, deps: T3Deps, show: (p: Pending) => void): Promise<SignInEntry> {
  const fetcher = deps.fetch ?? fetch;
  let pending: Pending | null = null;
  let done: (entry: SignInEntry) => void = () => {};
  let failed: (e: Error) => void = () => {};
  const answer = new Promise<SignInEntry>((ok, no) => {
    done = ok;
    failed = no;
  });
  answer.catch(() => {}); // a timeout before anyone waits is still reported by the await below
  const server: Server = createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    const p = pending;
    if (req.method !== "GET" || url.pathname !== "/callback" || p === null || !matches(p, url.searchParams.get("state"))) {
      res.writeHead(404, { "content-type": "text/plain" }).end("not found");
      return;
    }
    pending = null; // single use
    finish(p, url.searchParams, fetcher, deps.now)
      .then((entry) => {
        res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" }).end(callbackPage(true, "braid has the sign-in. You can close this tab."));
        done(entry);
      })
      .catch((e: unknown) => {
        const words = e instanceof SignInError ? e.message : "the sign-in failed";
        res.writeHead(400, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" }).end(callbackPage(false, `${words}.`));
        failed(e instanceof SignInError ? e : new SignInError(words));
      });
  });
  await new Promise<void>((ok, no) => {
    server.once("error", no);
    server.listen(0, "127.0.0.1", () => ok());
  });
  const timer = setTimeout(() => failed(new SignInError(`no answer from T3 within ${Math.round((deps.waitMs ?? PENDING_MS) / 60_000)} minutes; nothing was kept`)), deps.waitMs ?? PENDING_MS);
  try {
    const p = await make(`http://127.0.0.1:${(server.address() as AddressInfo).port}/callback`);
    pending = p;
    show(p);
    return await answer;
  } finally {
    clearTimeout(timer);
    server.close();
    server.closeAllConnections();
  }
}

async function storeOrRefuse(store: SecretStore): Promise<SignInEntry | null> {
  try {
    return await store.read();
  } catch (e) {
    if (e instanceof NoSecretStore) {
      throw new SignInError(`${e.message}; braid keeps no T3 sign-in without one, and the board keeps using the t3 command line`);
    }
    throw e;
  }
}

async function login(args: readonly string[], deps: T3Deps): Promise<string> {
  only(args, ["--url"]);
  const url = option(args, "--url");
  const home = deps.home ?? braidHome();
  const settings = readSettings(home);
  const store = deps.store ?? keyringStore();
  await storeOrRefuse(store);
  const origin = checkOrigin(url ?? defaultOrigin(deps.env), settings.localOnly);
  const write = deps.write ?? ((t: string) => void process.stdout.write(t));
  const fetcher = deps.fetch ?? fetch;
  const entry = await waitForAnswer(
    async (redirectUri) => {
      const d = await discover(origin, fetcher);
      return newPending(d, await register(d, redirectUri, fetcher), redirectUri, (deps.now ?? Date.now)());
    },
    deps,
    (p) => {
      write(`Opening T3's approval page in your browser; approve "braid board" at Full access.\nIf it doesn't open: ${p.authorizeUrl}\nWaiting up to 5 minutes for T3's answer...\n`);
      (deps.open ?? openUrl)(p.authorizeUrl);
    },
  );
  await keep(store, entry, fetcher);
  return `Signed in to T3 at ${entry.issuer} until ${fullDate(entry.expiresAt)}.\n`;
}

async function logout(args: readonly string[], deps: T3Deps): Promise<string> {
  only(args, []);
  const store = deps.store ?? keyringStore();
  const entry = await storeOrRefuse(store);
  const out = await signOutOf(store, deps.fetch ?? fetch);
  if (!out.had || entry === null) {
    return "Not signed in to T3; nothing to sign out.\n";
  }
  return out.revoked
    ? `Signed out of T3: revoked "braid board" at ${entry.issuer} and deleted the sign-in here.\n`
    : `Deleted the T3 sign-in here, but T3 at ${entry.issuer} couldn't revoke it: revoke "braid board" in T3's Settings → Sharing & access.\n`;
}

async function status(args: readonly string[], deps: T3Deps): Promise<string> {
  only(args, []);
  const home = deps.home ?? braidHome();
  const settings = readSettings(home);
  const store = deps.store ?? keyringStore();
  let entry: SignInEntry | null | "no store";
  try {
    entry = await store.read();
  } catch (e) {
    if (!(e instanceof NoSecretStore)) {
      throw e;
    }
    entry = "no store";
  }
  const now = (deps.now ?? Date.now)();
  return `${statusLine(entryView(entry, settings, now), new Date(now))}\nSettings (${settingsFile(home)}): ${settingsLine(settings)}\n`;
}

function set(args: readonly string[], deps: T3Deps): string {
  only(args, ["--access", "--local-only"]);
  const access = option(args, "--access");
  const local = option(args, "--local-only");
  if (access === undefined && local === undefined) {
    throw new UsageError(`braid t3 set needs --access auto|cli or --local-only on|off; ${USAGE}`);
  }
  if (access !== undefined && access !== "auto" && access !== "cli") {
    throw new UsageError(`--access is auto or cli; got: ${access}`);
  }
  if (local !== undefined && local !== "on" && local !== "off") {
    throw new UsageError(`--local-only is on or off; got: ${local}`);
  }
  const home = deps.home ?? braidHome();
  const was = readSettings(home);
  const next: T3Settings = { access: access ?? was.access, localOnly: local === undefined ? was.localOnly : local === "on" };
  writeSettings(next, home);
  return `T3 settings (${settingsFile(home)}): ${settingsLine(next)}\n`;
}

/** Runs `braid t3 <sub>`; a refused step throws `UsageError` with its reason. */
export async function t3Command(args: readonly string[], deps: T3Deps = {}): Promise<string> {
  const [sub, ...rest] = args;
  try {
    switch (sub) {
      case "login":
        return await login(rest, deps);
      case "logout":
        return await logout(rest, deps);
      case "status":
        return await status(rest, deps);
      case "set":
        return set(rest, deps);
      default:
        throw new UsageError(USAGE);
    }
  } catch (e) {
    if (e instanceof SignInError || e instanceof NoSecretStore) {
      throw new UsageError(`braid t3 ${sub ?? ""}: ${e.message}`);
    }
    throw e;
  }
}
