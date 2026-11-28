// A fake T3 authorization server and MCP endpoint on 127.0.0.1 for the sign-in tests (0080/D): the metadata, a stateless
// registration, an authorize step that answers at once with a redirect (no approval page), the token exchange with PKCE,
// revoke, and a `/mcp` that answers 401 to a revoked or refused token. No test reaches a real T3.
import { createHash, randomBytes } from "node:crypto";
import { createServer, type IncomingMessage, type Server } from "node:http";
import type { AddressInfo } from "node:net";

export type Level = "read-only" | "approval-required" | "full-access";

export interface FakeT3 {
  readonly origin: string;
  /** What the next authorize answers with. */
  readonly switches: {
    level: Level;
    /** `wrong`: another issuer in `iss`; `missing`: none. */
    iss: "right" | "wrong" | "missing";
    /** The code's life; 0 makes it expired at once. */
    codeTtlMs: number;
    /** `/mcp` answers 401 to every token. */
    refuseAll: boolean;
    /** The answer to authorize is an `access_denied` error. */
    deny: boolean;
  };
  /** The tokens issued and revoked. */
  readonly issued: string[];
  readonly revoked: string[];
  /** Every request's method and path (no query: it holds codes). */
  readonly requests: string[];
  /** Calls to `/mcp` with their bearer token. */
  readonly mcpCalls: string[];
  close(): Promise<void>;
}

const SCOPES: Record<Level, string> = {
  "read-only": "orchestration:read",
  "approval-required": "orchestration:read orchestration:operate",
  "full-access": "orchestration:read orchestration:operate settings:write source-control:write",
};

function body(req: IncomingMessage): Promise<string> {
  return new Promise((done) => {
    let text = "";
    req.on("data", (c: Buffer) => (text += c.toString()));
    req.on("end", () => done(text));
  });
}

export async function startFakeT3(): Promise<FakeT3> {
  const codes = new Map<string, { challenge: string; redirectUri: string; clientId: string; level: Level; expires: number }>();
  const live = new Set<string>();
  const state: FakeT3 = {
    origin: "",
    switches: { level: "full-access", iss: "right", codeTtlMs: 60_000, refuseAll: false, deny: false },
    issued: [],
    revoked: [],
    requests: [],
    mcpCalls: [],
    close: async () => {},
  };
  const server: Server = createServer((req, res) => {
    void (async () => {
      const url = new URL(req.url ?? "/", state.origin);
      state.requests.push(`${req.method} ${url.pathname}`);
      const json = (status: number, value: unknown) => res.writeHead(status, { "content-type": "application/json" }).end(JSON.stringify(value));
      const o = state.origin;
      if (url.pathname === "/.well-known/oauth-protected-resource/mcp") {
        return json(200, { resource: `${o}/mcp`, authorization_servers: [o], scopes_supported: ["orchestration:read", "orchestration:operate"], bearer_methods_supported: ["header"] });
      }
      if (url.pathname === "/.well-known/oauth-authorization-server") {
        return json(200, {
          issuer: o,
          authorization_endpoint: `${o}/oauth/mcp/authorize`,
          token_endpoint: `${o}/oauth/mcp/token`,
          registration_endpoint: `${o}/oauth/mcp/register`,
          revocation_endpoint: `${o}/oauth/mcp/revoke`,
          response_types_supported: ["code"],
          grant_types_supported: ["authorization_code"],
          code_challenge_methods_supported: ["S256"],
          token_endpoint_auth_methods_supported: ["none"],
          authorization_response_iss_parameter_supported: true,
        });
      }
      if (url.pathname === "/oauth/mcp/register" && req.method === "POST") {
        const meta = JSON.parse(await body(req)) as { client_name: string; redirect_uris: string[] };
        return json(201, { client_id: Buffer.from(JSON.stringify({ n: meta.client_name, r: meta.redirect_uris })).toString("base64url"), client_name: meta.client_name, redirect_uris: meta.redirect_uris });
      }
      if (url.pathname === "/oauth/mcp/authorize") {
        const p = url.searchParams;
        const redirect = new URL(p.get("redirect_uri") ?? "");
        const client = JSON.parse(Buffer.from(p.get("client_id") ?? "", "base64url").toString()) as { n: string; r: string[] };
        if (!client.r.some((r) => new URL(r).pathname === redirect.pathname) || p.get("code_challenge_method") !== "S256" || p.get("resource") !== `${o}/mcp`) {
          return json(400, { error: "invalid_request" });
        }
        const iss = state.switches.iss === "right" ? o : state.switches.iss === "wrong" ? "http://127.0.0.1:1" : null;
        if (state.switches.deny) {
          redirect.search = new URLSearchParams({ error: "access_denied", state: p.get("state") ?? "", ...(iss === null ? {} : { iss }) }).toString();
        } else {
          const code = randomBytes(16).toString("hex");
          codes.set(code, { challenge: p.get("code_challenge") ?? "", redirectUri: p.get("redirect_uri") ?? "", clientId: p.get("client_id") ?? "", level: state.switches.level, expires: Date.now() + state.switches.codeTtlMs });
          redirect.search = new URLSearchParams({ code, state: p.get("state") ?? "", ...(iss === null ? {} : { iss }) }).toString();
        }
        res.writeHead(302, { location: redirect.href }).end();
        return;
      }
      if (url.pathname === "/oauth/mcp/token" && req.method === "POST") {
        const f = new URLSearchParams(await body(req));
        const c = codes.get(f.get("code") ?? "");
        codes.delete(f.get("code") ?? "");
        const verifier = f.get("code_verifier") ?? "";
        const challenge = createHash("sha256").update(verifier).digest("base64url");
        if (c === undefined || c.expires <= Date.now() || c.challenge !== challenge || c.redirectUri !== f.get("redirect_uri") || c.clientId !== f.get("client_id") || f.get("resource") !== `${o}/mcp`) {
          return json(400, { error: "invalid_grant", error_description: "The authorization code is invalid or expired." });
        }
        const token = `fake-t3-token-${randomBytes(12).toString("hex")}`;
        state.issued.push(token);
        live.add(token);
        return json(200, { access_token: token, token_type: "Bearer", expires_in: 30 * 86_400, scope: SCOPES[c.level] });
      }
      if (url.pathname === "/oauth/mcp/revoke" && req.method === "POST") {
        const token = new URLSearchParams(await body(req)).get("token") ?? "";
        state.revoked.push(token);
        live.delete(token);
        res.writeHead(200).end();
        return;
      }
      if (url.pathname === "/mcp" && req.method === "POST") {
        const token = (req.headers.authorization ?? "").replace(/^Bearer /, "");
        state.mcpCalls.push(token);
        await body(req);
        if (state.switches.refuseAll || !live.has(token)) {
          return json(401, { error: "invalid_mcp_credential" });
        }
        return json(200, { jsonrpc: "2.0", id: 1, result: { isError: false, structuredContent: { threads: [] }, content: [] } });
      }
      return json(404, { error: "not found" });
    })();
  });
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  const { port } = server.address() as AddressInfo;
  (state as { origin: string }).origin = `http://127.0.0.1:${port}`;
  state.close = () =>
    new Promise<void>((done) => {
      server.close(() => done());
      server.closeAllConnections();
    });
  return state;
}

/** Stands for the user's browser: opens the authorize URL and follows T3's one redirect to the callback (with `edit` to tamper with it). */
export async function approveIn(authorizeUrl: string, edit: (callback: URL) => void = () => {}): Promise<{ status: number; text: string; callback: URL }> {
  const answer = await fetch(authorizeUrl, { redirect: "manual" });
  const callback = new URL(answer.headers.get("location") ?? "");
  edit(callback);
  const landed = await fetch(callback, { redirect: "manual" });
  return { status: landed.status, text: await landed.text(), callback };
}
