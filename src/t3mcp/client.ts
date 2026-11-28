// A client for T3 Code's MCP endpoint over HTTP: one stateless JSON-RPC POST per call (MCP 2026-07-28), for
// `tools/call` and `events/*`. It retries nothing and stores nothing: the caller passes a function that returns the
// token and decides what each failure means. No `Origin` header (T3 answers 403) and no `T3-Mode-Limit`.

const PROTOCOL = "2026-07-28";
const DEFAULT_TIMEOUT_MS = 15_000;

/**
 * `unauthorized`: T3 refused the token (401), so the caller is signed out.
 * `unreachable`: no usable answer (refused, reset, timeout, a bare 5xx), so the caller retries later.
 * `error`: T3 answered with a failure (a JSON-RPC error or a failed tool).
 */
export type McpErrorKind = "unauthorized" | "unreachable" | "error";

export class McpError extends Error {
  override readonly name = "McpError";
  readonly kind: McpErrorKind;
  /** The JSON-RPC code, a tool's failure code (`runtime_mode_escalation_denied`) or an HTTP status. */
  readonly code: number | string | undefined;

  constructor(kind: McpErrorKind, message: string, code?: number | string) {
    super(message);
    this.kind = kind;
    this.code = code;
  }
}

export type TokenSource = () => string | Promise<string>;

export interface McpOptions {
  readonly timeoutMs?: number;
  /** The HTTP transport; `fetch` when not given. */
  readonly fetch?: typeof fetch;
}

export interface McpClient {
  call(method: string, params?: Readonly<Record<string, unknown>>): Promise<unknown>;
  /** `tools/call`, returning the tool's structured result. */
  callTool(name: string, args?: Readonly<Record<string, unknown>>): Promise<unknown>;
}

export function mcpClient(endpoint: string, token: TokenSource, options: McpOptions = {}): McpClient {
  const call = (method: string, params: Readonly<Record<string, unknown>> = {}) => callMcp(endpoint, method, params, token, options);
  return {
    call,
    async callTool(name, args = {}) {
      // The token is read once per call: the same value signs the request and is scrubbed from a failure's text.
      const secret = await token();
      const result = obj(await callMcp(endpoint, "tools/call", { name, arguments: args }, () => secret, options));
      if (result?.["isError"] === true) {
        throw toolFailure(name, result, secret);
      }
      const structured = result?.["structuredContent"];
      if (structured === undefined) {
        throw new McpError("error", `T3 MCP tool ${name}: no structured result`);
      }
      return structured;
    },
  };
}

/** One JSON-RPC call; returns its `result` or throws an `McpError`. */
export async function callMcp(
  endpoint: string,
  method: string,
  params: Readonly<Record<string, unknown>>,
  token: TokenSource,
  options: McpOptions = {},
): Promise<unknown> {
  const what = `T3 MCP ${method}`;
  const secret = await token();
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  let status: number;
  let type: string;
  let text: string;
  try {
    const response = await (options.fetch ?? fetch)(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        authorization: `Bearer ${secret}`,
        "mcp-method": method,
        "mcp-protocol-version": PROTOCOL,
        ...(typeof params["name"] === "string" ? { "mcp-name": params["name"] } : {}),
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method,
        params: {
          ...params,
          _meta: {
            "io.modelcontextprotocol/protocolVersion": PROTOCOL,
            "io.modelcontextprotocol/clientCapabilities": { extensions: { "io.modelcontextprotocol/events": {} } },
            "io.modelcontextprotocol/clientInfo": { name: "braid-board", version: "0.0.0" },
          },
        },
      }),
      // A redirect would send the call, and maybe the token, somewhere the caller didn't name.
      redirect: "error",
      signal: AbortSignal.timeout(timeoutMs),
    });
    status = response.status;
    type = response.headers.get("content-type") ?? "";
    text = await response.text();
  } catch (error) {
    // Never the cause's message or the cause itself: fetch quotes a header value it rejects, token included.
    throw new McpError("unreachable", `${what}: ${reason(error, timeoutMs)}`);
  }
  if (status === 401) {
    throw new McpError("unauthorized", `${what}: T3 refused the sign-in (401)`, 401);
  }
  const reply = parseReply(type, text);
  const failure = obj(reply?.["error"]);
  if (reply?.["jsonrpc"] === "2.0" && failure !== undefined) {
    const code = failure["code"];
    const message = typeof failure["message"] === "string" ? failure["message"] : "failed";
    throw new McpError("error", clean(`${what}: ${message}`, secret), typeof code === "number" ? code : undefined);
  }
  if (reply?.["jsonrpc"] === "2.0" && status < 300 && reply["result"] !== undefined) {
    return reply["result"];
  }
  throw new McpError(status >= 500 ? "unreachable" : "error", `${what}: unexpected answer (HTTP ${status})`, status);
}

/** The JSON-RPC response: the body, or the matching message of a response sent as server-sent events. */
function parseReply(type: string, text: string): Record<string, unknown> | undefined {
  if (!type.startsWith("text/event-stream")) {
    return obj(parse(text));
  }
  for (const event of text.split(/\r?\n\r?\n/)) {
    const data = event.split(/\r?\n/).filter((l) => l.startsWith("data:")).map((l) => l.slice(5)).join("\n");
    const message = obj(parse(data));
    if (message?.["id"] === 1) {
      return message;
    }
  }
  return undefined;
}

/** T3 returns a failed tool as `isError` with `{ _tag, code, message }`, as structured content and as JSON text. */
function toolFailure(name: string, result: Record<string, unknown>, secret: string): McpError {
  const content = result["content"];
  const first = Array.isArray(content) ? obj(content[0])?.["text"] : undefined;
  const text = typeof first === "string" ? first : undefined;
  const structured = obj(result["structuredContent"]);
  const failure = structured ?? obj(text === undefined ? undefined : parse(text));
  const detail = obj(failure?.["error"]) ?? failure;
  const message = typeof detail?.["message"] === "string" ? detail["message"] : (text ?? "failed");
  const code = detail?.["code"];
  return new McpError("error", clean(`T3 MCP tool ${name}: ${message}`, secret), typeof code === "string" ? code : undefined);
}

function reason(error: unknown, timeoutMs: number): string {
  if (error instanceof Error && error.name === "TimeoutError") {
    return `no answer within ${timeoutMs} ms`;
  }
  const code = obj(obj(error)?.["cause"])?.["code"];
  return typeof code === "string" && /^[A-Z0-9_]+$/.test(code) ? `T3 is unreachable (${code})` : "T3 is unreachable";
}

/** Server text can echo what it was sent. */
const clean = (message: string, secret: string): string => (secret === "" ? message : message.replaceAll(secret, "[token]"));

function parse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

const obj = (value: unknown): Record<string, unknown> | undefined =>
  typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
