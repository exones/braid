// Signing braid's board in to T3's MCP with T3's own OAuth for outside agents (0080/A's report): discovery, a stateless
// registration as "braid board", PKCE S256, `state` and `iss` checks on the loopback callback, the code exchange, the
// Full access check, and revoke. Both `braid t3 login` (its own one-off 127.0.0.1 listener) and the board's T3 button
// (the board's `/t3/callback`) run the same steps. Nothing here logs: errors carry words braid chose and T3's own error
// descriptions, never a token, a code or a verifier.
import { spawn } from "node:child_process";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { t3Home } from "../braids/limits.js";
import type { SignInEntry } from "./secret.js";

export const CLIENT_NAME = "braid board";
/** How long a sign-in waits for T3's answer. */
export const PENDING_MS = 5 * 60_000;
const FETCH_TIMEOUT_MS = 10_000;
/** T3's port when its runtime file doesn't say (0080/A, S7). */
export const DEFAULT_ORIGIN = "http://127.0.0.1:3773";
/** The scopes T3 gives a Full access sign-in beyond Supervised's `orchestration:read operate` (T3 0.1.13, `mcpClientScopes`). */
const FULL_ACCESS_SCOPE = "settings:write";
const OPERATE_SCOPE = "orchestration:operate";

/** A sign-in step failed; the message is for the user and names no secret. */
export class SignInError extends Error {
  override readonly name = "SignInError";
}

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

/** T3's origin from `--url`, checked against `localOnly`: a local address over http or https; else https only, and only with local only off. */
export function checkOrigin(raw: string, localOnly: boolean): string {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new SignInError(`--url needs T3's address, such as ${DEFAULT_ORIGIN}; got: ${raw}`);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new SignInError(`--url must be an http or https address; got: ${raw}`);
  }
  if (url.username !== "" || url.password !== "" || url.search !== "" || url.hash !== "" || (url.pathname !== "/" && url.pathname !== "")) {
    throw new SignInError(`--url takes T3's address alone (no path, user, query or fragment); got: ${raw}`);
  }
  if (!LOCAL_HOSTS.has(url.hostname)) {
    if (localOnly) {
      throw new SignInError(`${url.origin} isn't a local T3 address and local only is on; run braid t3 set --local-only off first (https only)`);
    }
    if (url.protocol !== "https:") {
      throw new SignInError(`${url.origin} isn't a local T3 address, so braid signs in to it only over https`);
    }
  }
  return url.origin;
}

/** T3's local address: the origin its running server wrote to `<T3 home>/userdata/server-runtime.json`, else 127.0.0.1:3773. */
export function defaultOrigin(env: NodeJS.ProcessEnv = process.env): string {
  try {
    const parsed: unknown = JSON.parse(readFileSync(join(t3Home(env), "userdata", "server-runtime.json"), "utf8"));
    const origin = typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>)["origin"] : undefined;
    if (typeof origin === "string" && origin !== "") {
      return new URL(origin).origin;
    }
  } catch {
    // T3 isn't running, or wrote something else: the default port.
  }
  return DEFAULT_ORIGIN;
}

export interface Discovered {
  readonly issuer: string;
  readonly mcpUrl: string;
  readonly authorize: string;
  readonly token: string;
  readonly register: string;
  readonly revoke: string;
}

const obj = (v: unknown): Record<string, unknown> | undefined => (typeof v === "object" && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : undefined);
const str = (o: Record<string, unknown> | undefined, k: string): string | undefined => (typeof o?.[k] === "string" ? o[k] : undefined);

/** One request to T3: no redirects (a redirect could carry a code or token elsewhere), a timeout, and the body as JSON. */
async function ask(fetcher: typeof fetch, url: string, init: RequestInit, what: string): Promise<{ status: number; body: Record<string, unknown> | undefined }> {
  let res: Response;
  try {
    res = await fetcher(url, { ...init, redirect: "error", signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  } catch (e) {
    throw new SignInError(`${what}: T3 is unreachable at ${new URL(url).origin}${e instanceof Error && e.name === "TimeoutError" ? " (no answer in 10 s)" : ""}`);
  }
  const text = await res.text().catch(() => "");
  let body: Record<string, unknown> | undefined;
  try {
    body = obj(JSON.parse(text));
  } catch {
    body = undefined;
  }
  return { status: res.status, body };
}

const oauthError = (what: string, r: { status: number; body: Record<string, unknown> | undefined }): SignInError => {
  const code = str(r.body, "error");
  const description = str(r.body, "error_description");
  return new SignInError(`${what}: T3 answered ${code === undefined ? `HTTP ${r.status}` : `${code}${description === undefined ? "" : ` (${description})`}`}`);
};

/** T3's endpoints from its metadata; refuses an issuer other than `origin`, no S256 or no `iss` in the answer (RFC 9207). */
export async function discover(origin: string, fetcher: typeof fetch = fetch): Promise<Discovered> {
  const resource = await ask(fetcher, `${origin}/.well-known/oauth-protected-resource/mcp`, { method: "GET", headers: { accept: "application/json" } }, "T3 sign-in discovery");
  if (resource.status !== 200) {
    throw oauthError("T3 sign-in discovery", resource);
  }
  const servers = resource.body?.["authorization_servers"];
  const mcpUrl = str(resource.body, "resource");
  if (!Array.isArray(servers) || servers[0] !== origin || mcpUrl !== `${origin}/mcp`) {
    throw new SignInError(`T3 sign-in discovery: ${origin} names another authorization server or resource; refusing`);
  }
  const meta = await ask(fetcher, `${origin}/.well-known/oauth-authorization-server`, { method: "GET", headers: { accept: "application/json" } }, "T3 sign-in discovery");
  if (meta.status !== 200) {
    throw oauthError("T3 sign-in discovery", meta);
  }
  const m = meta.body;
  const methods = m?.["code_challenge_methods_supported"];
  if (str(m, "issuer") !== origin) {
    throw new SignInError(`T3 sign-in discovery: the metadata's issuer isn't ${origin}; refusing`);
  }
  if (!Array.isArray(methods) || !methods.includes("S256") || m?.["authorization_response_iss_parameter_supported"] !== true) {
    throw new SignInError("T3 sign-in discovery: T3 doesn't offer PKCE S256 and iss in its answers; refusing");
  }
  const endpoint = (k: string): string => {
    const v = str(m, k);
    if (v === undefined || new URL(v).origin !== origin) {
      throw new SignInError(`T3 sign-in discovery: ${k} is missing or on another address; refusing`);
    }
    return v;
  };
  return { issuer: origin, mcpUrl, authorize: endpoint("authorization_endpoint"), token: endpoint("token_endpoint"), register: endpoint("registration_endpoint"), revoke: endpoint("revocation_endpoint") };
}

/** Registers "braid board" for this redirect; T3 keeps nothing (the client id is its signed metadata), so each sign-in registers again. */
export async function register(d: Discovered, redirectUri: string, fetcher: typeof fetch = fetch): Promise<string> {
  const r = await ask(
    fetcher,
    d.register,
    {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ client_name: CLIENT_NAME, redirect_uris: [redirectUri], token_endpoint_auth_method: "none", application_type: "native", grant_types: ["authorization_code"], response_types: ["code"] }),
    },
    "T3 sign-in registration",
  );
  const id = str(r.body, "client_id");
  if (r.status !== 201 && r.status !== 200) {
    throw oauthError("T3 sign-in registration", r);
  }
  if (id === undefined) {
    throw new SignInError("T3 sign-in registration: no client id in T3's answer");
  }
  return id;
}

/** One sign-in waiting for T3's answer: what the callback must match and the exchange needs. */
export interface Pending {
  readonly discovered: Discovered;
  readonly clientId: string;
  readonly redirectUri: string;
  readonly state: string;
  readonly verifier: string;
  /** The approval page's address; it holds no secret (the challenge is a hash), so braid prints it. */
  readonly authorizeUrl: string;
  /** Epoch ms after which the callback answers nothing. */
  readonly expiresAt: number;
}

const b64url = (b: Buffer): string => b.toString("base64url");

/** A fresh `state` and PKCE verifier (32 random bytes each, RFC 7636) and the authorize URL for them. */
export function newPending(d: Discovered, clientId: string, redirectUri: string, now: number = Date.now()): Pending {
  const state = b64url(randomBytes(32));
  const verifier = b64url(randomBytes(32));
  const challenge = b64url(createHash("sha256").update(verifier).digest());
  const url = new URL(d.authorize);
  url.search = new URLSearchParams({ response_type: "code", client_id: clientId, redirect_uri: redirectUri, code_challenge: challenge, code_challenge_method: "S256", state, resource: d.mcpUrl }).toString();
  return { discovered: d, clientId, redirectUri, state, verifier, authorizeUrl: url.href, expiresAt: now + PENDING_MS };
}

/** Whether a callback belongs to this pending sign-in: its `state`, compared in constant time, before it expired. */
export function matches(p: Pending, given: string | null, now: number = Date.now()): boolean {
  if (given === null || now >= p.expiresAt) {
    return false;
  }
  const a = Buffer.from(given);
  const b = Buffer.from(p.state);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Opens a URL in the default browser without a shell (the URL is full of `&`; 0080/A, S51). Failures are ignored: braid also prints it. */
export function openUrl(url: string): void {
  const [cmd, args] = process.platform === "win32" ? ["rundll32", ["url.dll,FileProtocolHandler", url]] : process.platform === "darwin" ? ["open", [url]] : ["xdg-open", [url]];
  try {
    const child = spawn(cmd, args, { stdio: "ignore", detached: true, windowsHide: true, shell: false });
    child.on("error", () => {});
    child.unref();
  } catch {
    // printed anyway
  }
}

/**
 * Finishes a sign-in from the callback's query, whose `state` already matched: checks `iss` and the error, exchanges the
 * code with the verifier, and refuses (revoking it) a sign-in below Full access. Returns the entry to store.
 */
export async function finish(p: Pending, query: URLSearchParams, fetcher: typeof fetch = fetch, now: () => number = Date.now): Promise<SignInEntry> {
  const iss = query.get("iss");
  if (iss !== p.discovered.issuer) {
    throw new SignInError(iss === null ? "T3's answer has no iss; refusing" : "T3's answer names another issuer; refusing");
  }
  const error = query.get("error");
  if (error !== null) {
    throw new SignInError(error === "access_denied" ? "T3 sign-in denied in T3" : `T3 sign-in failed in T3: ${error}`);
  }
  const code = query.get("code");
  if (code === null || code === "") {
    throw new SignInError("T3's answer has no code; refusing");
  }
  const r = await ask(
    fetcher,
    p.discovered.token,
    {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
      body: new URLSearchParams({ grant_type: "authorization_code", code, code_verifier: p.verifier, redirect_uri: p.redirectUri, client_id: p.clientId, resource: p.discovered.mcpUrl }).toString(),
    },
    "T3 sign-in",
  );
  const token = str(r.body, "access_token");
  const expiresIn = r.body?.["expires_in"];
  if (r.status !== 200 || token === undefined || token === "") {
    throw oauthError("T3 sign-in", r);
  }
  if (str(r.body, "token_type")?.toLowerCase() !== "bearer" || typeof expiresIn !== "number" || expiresIn <= 0) {
    await revokeToken(p.discovered, p.clientId, token, fetcher).catch(() => false);
    throw new SignInError("T3 sign-in: T3's token answer isn't a Bearer token with an end date; refusing");
  }
  const scopes = (str(r.body, "scope") ?? "").split(/\s+/);
  if (!scopes.includes(OPERATE_SCOPE) || !scopes.includes(FULL_ACCESS_SCOPE)) {
    await revokeToken(p.discovered, p.clientId, token, fetcher).catch(() => false);
    throw new SignInError(`T3 approved ${scopes.includes(OPERATE_SCOPE) ? "a level below Full access" : "Read only"}; the board needs Full access to stop braid's threads. Nothing was kept; sign in again and pick Full access`);
  }
  return { token, expiresAt: new Date(now() + expiresIn * 1000).toISOString(), issuer: p.discovered.issuer, mcpUrl: p.discovered.mcpUrl, clientId: p.clientId };
}

/** Revokes a token in T3 (RFC 7009); true when T3 took it. */
export async function revokeToken(d: Discovered, clientId: string, token: string, fetcher: typeof fetch = fetch): Promise<boolean> {
  const r = await ask(
    fetcher,
    d.revoke,
    { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ token, token_type_hint: "access_token", client_id: clientId }).toString() },
    "T3 sign-out",
  );
  return r.status === 200;
}

/** Revokes a stored sign-in: discovery at its issuer, then revoke. False when T3 can't be reached or refused it. */
export async function revokeEntry(entry: SignInEntry, fetcher: typeof fetch = fetch): Promise<boolean> {
  try {
    return await revokeToken(await discover(entry.issuer, fetcher), entry.clientId, entry.token, fetcher);
  } catch {
    return false;
  }
}

/** The page the browser tab shows after the callback; it names no code and no token. */
export function callbackPage(ok: boolean, words: string): string {
  const safe = words.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c);
  return `<!doctype html><meta charset="utf-8"><title>braid: T3 sign-in</title><body style="font-family:system-ui,sans-serif;max-width:40em;margin:3em auto;padding:0 1em"><h1 style="font-size:1.3em">${ok ? "Signed in to T3" : "T3 sign-in failed"}</h1><p>${safe}</p></body>`;
}
