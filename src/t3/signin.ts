// The board's T3 sign-in (docs/board.md, "T3 sign-in"): reads the OS store's entry at the start, at most once a minute
// and right after a 401, keeps the token in memory only, and hands an MCP client for it to the board's callers
// (0080/E, 0080/F) while it is good and `access` is `auto`. A 401 means signed out until the store holds a different
// token: no retry of a refused token. Nothing here calls T3 on a timer: T3 is asked only on a click (sign in, sign out).
// The two pushes (5 days before the end, a 401) go once per sign-in, their keys kept in `~/.braid/t3-notified.json`.
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { braidHome } from "../notify/config.js";
import { McpError, mcpClient, type McpClient } from "../t3mcp/client.js";
import { checkOrigin, defaultOrigin, discover, finish, matches, newPending, register, revokeEntry, SignInError, type Pending } from "./oauth.js";
import { NoSecretStore, type SecretStore, type SignInEntry } from "./secret.js";
import { DEFAULT_SETTINGS, type T3Settings } from "./settings.js";
import { fullDate, refusedPush, SOON_MS, soonPush, type SignInView, type T3Push } from "./words.js";

/** How often the board reads the store again. */
export const READ_EVERY_MS = 60_000;

export interface SignInOptions {
  readonly store: SecretStore;
  /** `~/.braid/t3.json`, read each time it matters, so `braid t3 set` takes effect without a restart. */
  readonly settings?: () => T3Settings;
  /** Sends one push; rejects when it couldn't (then it is tried again at the next read). Absent: no pushes. */
  readonly send?: (push: T3Push) => Promise<void>;
  /** Where the sent push keys live; `~/.braid/t3-notified.json` unless given. */
  readonly sentFile?: string;
  readonly fetch?: typeof fetch;
  readonly now?: () => number;
  readonly readEveryMs?: number;
  /** T3's address for a sign-in from the button; `defaultOrigin()` unless given. */
  readonly origin?: () => string;
}

/** What the board's callback answers: 404 for anything but the pending click's own `state`, else a page. */
export type CallbackAnswer = { readonly status: 404 } | { readonly status: 200 | 400; readonly ok: boolean; readonly words: string };

export interface BoardSignIn {
  /** The state for the page and the API, from the last read; never the token. */
  view(): SignInView;
  /** Reads the store now unless it was read within the minute (`force`: now anyway). */
  read(force?: boolean): Promise<void>;
  /** An MCP client for the stored token while signed in and `access` is `auto`; null otherwise. A 401 through it signs the board out. */
  client(): McpClient | null;
  /** Starts a sign-in from the button: discovery and registration at T3, a fresh state and verifier; returns the approval page's address. */
  start(redirectUri: string): Promise<{ readonly authorizeUrl: string; readonly until: string }>;
  /** The board's `/t3/callback`: only the pending click's `state`, once, within 5 minutes. */
  callback(query: URLSearchParams): Promise<CallbackAnswer>;
  /** Drops the pending sign-in (Cancel). */
  cancel(): void;
  /** Revokes the sign-in in T3 and deletes the entry (as `braid t3 logout`); no push. */
  signOut(): Promise<SignOutResult>;
  /** Stops the minute timer. */
  close(): void;
}

export interface SignOutResult {
  /** False: there was no sign-in. */
  readonly had: boolean;
  /** True when T3 took the revoke; false: the entry was deleted but "braid board" must be revoked in T3's Settings. */
  readonly revoked: boolean;
}

const hash = (token: string): string => createHash("sha256").update(token).digest("hex");

function readKeys(file: string): Set<string> {
  try {
    const parsed: unknown = JSON.parse(readFileSync(file, "utf8"));
    const keys = typeof parsed === "object" && parsed !== null ? (parsed as { keys?: unknown }).keys : undefined;
    return new Set(Array.isArray(keys) ? keys.filter((k): k is string => typeof k === "string") : []);
  } catch {
    return new Set();
  }
}

function writeKeys(file: string, keys: ReadonlySet<string>): void {
  mkdirSync(dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  writeFileSync(tmp, `${JSON.stringify({ keys: [...keys].slice(-20) }, null, 2)}\n`);
  renameSync(tmp, file);
}

/** Revokes the stored sign-in in T3 and deletes it; shared by `braid t3 logout` and the board's Sign out. */
export async function signOutOf(store: SecretStore, fetcher: typeof fetch = fetch): Promise<SignOutResult> {
  const entry = await store.read();
  if (entry === null) {
    return { had: false, revoked: false };
  }
  const revoked = await revokeEntry(entry, fetcher);
  await store.remove();
  return { had: true, revoked };
}

/** Keeps a new sign-in: revokes the one it replaces (best effort, so no session lingers in T3), then writes it. */
export async function keep(store: SecretStore, entry: SignInEntry, fetcher: typeof fetch = fetch): Promise<void> {
  const old = await store.read().catch(() => null);
  await store.write(entry);
  if (old !== null && old.token !== entry.token) {
    await revokeEntry(old, fetcher);
  }
}

export function boardSignIn(options: SignInOptions): BoardSignIn {
  const settings = options.settings ?? (() => DEFAULT_SETTINGS);
  const now = options.now ?? Date.now;
  const fetcher = options.fetch ?? fetch;
  const sentFile = options.sentFile ?? join(braidHome(), "t3-notified.json");
  let entry: SignInEntry | null = null;
  let noStore = false;
  let readAt = -Infinity;
  /** The hash of a token T3 refused, and when. */
  let refused: { readonly hash: string; readonly at: string; readonly expiresAt: string } | null = null;
  let pending: Pending | null = null;
  let reading: Promise<void> | null = null;

  const signedIn = (): boolean => entry !== null && (refused === null || refused.hash !== hash(entry.token)) && Date.parse(entry.expiresAt) > now();

  const pushOnce = async (push: T3Push): Promise<void> => {
    if (options.send === undefined) {
      return;
    }
    const keys = readKeys(sentFile);
    if (keys.has(push.key)) {
      return;
    }
    try {
      await options.send(push);
    } catch {
      return; // not recorded: the next read tries again
    }
    keys.add(push.key);
    writeKeys(sentFile, keys);
  };

  const after = async (): Promise<void> => {
    if (entry !== null && signedIn() && Date.parse(entry.expiresAt) - now() <= SOON_MS) {
      await pushOnce(soonPush(entry.expiresAt));
    }
    if (refused !== null && entry !== null && refused.hash === hash(entry.token)) {
      await pushOnce(refusedPush(refused.expiresAt));
    }
  };

  const readNow = async (): Promise<void> => {
    try {
      entry = await options.store.read();
      noStore = false;
    } catch (e) {
      if (!(e instanceof NoSecretStore)) {
        throw e;
      }
      entry = null;
      noStore = true;
    }
    readAt = now();
    if (refused !== null && (entry === null || refused.hash !== hash(entry.token))) {
      refused = null; // a new sign-in (or none): the refusal was about the old token
    }
    await after();
  };

  const read = (force = false): Promise<void> => {
    if (reading !== null) {
      return reading;
    }
    if (!force && now() - readAt < (options.readEveryMs ?? READ_EVERY_MS)) {
      return Promise.resolve();
    }
    reading = readNow().finally(() => {
      reading = null;
    });
    return reading;
  };

  const timer = setInterval(() => void read().catch(() => {}), options.readEveryMs ?? READ_EVERY_MS);
  timer.unref();
  void read(true).catch(() => {});

  const onRefused = (token: string): void => {
    if (entry === null || entry.token !== token || refused?.hash === hash(token)) {
      return;
    }
    refused = { hash: hash(token), at: new Date(now()).toISOString(), expiresAt: entry.expiresAt };
    void read(true).catch(() => {});
  };

  return {
    view(): SignInView {
      const s = settings();
      const waitingUntil = pending !== null && pending.expiresAt > now() ? new Date(pending.expiresAt).toISOString() : null;
      const base = { access: s.access, waitingUntil };
      if (noStore) {
        return { ...base, state: "out", reason: "no secret store", origin: null, expiresAt: null, refusedAt: null };
      }
      if (entry === null) {
        return { ...base, state: "out", reason: "not signed in", origin: null, expiresAt: null, refusedAt: null };
      }
      if (refused !== null && refused.hash === hash(entry.token)) {
        return { ...base, state: "out", reason: "refused", origin: entry.issuer, expiresAt: entry.expiresAt, refusedAt: refused.at };
      }
      const left = Date.parse(entry.expiresAt) - now();
      if (left <= 0) {
        return { ...base, state: "out", reason: "ended", origin: entry.issuer, expiresAt: entry.expiresAt, refusedAt: null };
      }
      return { ...base, state: left <= SOON_MS ? "soon" : "in", reason: null, origin: entry.issuer, expiresAt: entry.expiresAt, refusedAt: null };
    },
    read,
    client() {
      if (!signedIn() || entry === null || settings().access === "cli") {
        return null;
      }
      const { token, mcpUrl } = entry;
      const inner = mcpClient(mcpUrl, () => token, { fetch: fetcher });
      const watch = async <T>(run: () => Promise<T>): Promise<T> => {
        try {
          return await run();
        } catch (e) {
          if (e instanceof McpError && e.kind === "unauthorized") {
            onRefused(token);
          }
          throw e;
        }
      };
      return { call: (m, p) => watch(() => inner.call(m, p)), callTool: (n, a) => watch(() => inner.callTool(n, a)) };
    },
    async start(redirectUri) {
      await read(true);
      if (noStore) {
        throw new SignInError("no secret store on this host, so the board can't keep a T3 sign-in; it keeps using the t3 command line");
      }
      const origin = checkOrigin((options.origin ?? (() => defaultOrigin()))(), settings().localOnly);
      const d = await discover(origin, fetcher);
      const clientId = await register(d, redirectUri, fetcher);
      pending = newPending(d, clientId, redirectUri, now());
      return { authorizeUrl: pending.authorizeUrl, until: new Date(pending.expiresAt).toISOString() };
    },
    async callback(query) {
      const p = pending;
      if (p === null || !matches(p, query.get("state"), now())) {
        return { status: 404 };
      }
      pending = null; // single use, whatever comes of it
      try {
        const got = await finish(p, query, fetcher, now);
        await keep(options.store, got, fetcher);
        await read(true);
        return { status: 200, ok: true, words: `The board is signed in to T3 at ${got.issuer} until ${fullDate(got.expiresAt)}. You can close this tab.` };
      } catch (e) {
        const words = e instanceof SignInError || e instanceof NoSecretStore ? e.message : "the sign-in failed";
        return { status: 400, ok: false, words: `${words}. You can close this tab and try again from the board.` };
      }
    },
    cancel() {
      pending = null;
    },
    async signOut() {
      pending = null;
      const out = await signOutOf(options.store, fetcher);
      await read(true);
      return out;
    },
    close() {
      clearInterval(timer);
    },
  };
}

/** The demo board's sign-in: signed in, nothing stored, nothing called; its actions fake their result. */
export function demoSignIn(now: () => number = Date.now): BoardSignIn {
  const expiresAt = new Date(now() + 30 * 86_400_000).toISOString();
  return {
    view: () => ({ state: "in", reason: null, origin: "http://127.0.0.1:3773", expiresAt, refusedAt: null, access: "auto", waitingUntil: null }),
    read: async () => {},
    client: () => null,
    start: async () => {
      throw new SignInError("the demo board signs in to nothing");
    },
    callback: async () => ({ status: 404 }),
    cancel: () => {},
    signOut: async () => ({ had: true, revoked: true }),
    close: () => {},
  };
}
