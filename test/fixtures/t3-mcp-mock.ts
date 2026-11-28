// A mock of T3 Code's MCP endpoint (v0.1.12) on 127.0.0.1, so no test reaches a real T3.
// What it copies from T3: one stateless JSON-RPC POST to /mcp per call; 403 for a request with an Origin; 401 for a
// wrong token; the `mcp-method`, `mcp-name` and `mcp-protocol-version` checks; `events/poll` as MilestoneHub reads
// (cursor "<epoch>.<seq>", null starts from now, `truncated` after eviction or a restart); and for `tools/call` a
// failed tool as `isError` with `{ _tag, code, message }`. The two tools are stubs (the list's threads settable).
// Not copied: events/list, events/stream, events/subscribe, maxAgeMs, OAuth.
import { createServer, type IncomingHttpHeaders, type IncomingMessage, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";

export const MOCK_TOKEN = "mock-secret-token-7f3a";

export interface Milestone {
  readonly id: string;
  readonly type: string;
  readonly projectId: string | null;
  readonly threadId: string | null;
  readonly isSubagentChild?: boolean;
  readonly [field: string]: unknown;
}

interface Filter {
  readonly projectIds?: readonly string[];
  readonly threadIds?: readonly string[];
  readonly includeSubagentChildren?: boolean;
}

/** T3 keeps the newest 1,000 milestones; fewer here, so falling behind is easy to show. */
function makeHub(keptMax: number) {
  let epoch = Date.now().toString(36);
  let seq = 0;
  let kept: { event: Milestone; seq: number }[] = [];
  const cursorAt = (at: number) => `${epoch}.${at}`;
  return {
    publish(event: Milestone) {
      kept.push({ event, seq: ++seq });
      if (kept.length > keptMax) kept.shift();
    },
    /** A T3 restart: memory is gone and cursors from before read as unknown. */
    restart() {
      epoch = `${epoch}r`;
      seq = 0;
      kept = [];
    },
    read(cursor: string | null, type: string, filter: Filter, limit: number) {
      if (cursor === null) return { events: [], cursor: cursorAt(seq), truncated: false, hasMore: false };
      const [from_, at] = cursor.split(".");
      const from = from_ === epoch && Number(at) <= seq ? Number(at) : undefined;
      const oldest = kept[0]?.seq ?? seq + 1;
      const matching = kept.filter(
        ({ event, seq: s }) =>
          (from === undefined || s > from) &&
          event.type === type &&
          (filter.includeSubagentChildren === true || event.isSubagentChild !== true) &&
          (filter.projectIds === undefined || (event.projectId !== null && filter.projectIds.includes(event.projectId))) &&
          (filter.threadIds === undefined || (event.threadId !== null && filter.threadIds.includes(event.threadId))),
      );
      const page = matching.slice(0, Math.max(1, limit));
      const hasMore = page.length < matching.length;
      return {
        events: page,
        cursor: hasMore ? cursorAt(page.at(-1)!.seq) : cursorAt(seq),
        truncated: from === undefined || from < oldest - 1,
        hasMore,
      };
    },
  };
}

export async function startT3Mock(options: { readonly kept?: number } = {}) {
  const hub = makeHub(options.kept ?? 5);
  const requests: { method: string; params: Record<string, unknown>; headers: IncomingHttpHeaders }[] = [];
  const switches = {
    /** Every call answers 401. */
    unauthorized: false,
    /** Calls get no answer. */
    hang: false,
    /** Results come as one server-sent event instead of a JSON body. */
    sse: false,
    /** `t3_thread_interrupt` on these answers `runtime_mode_escalation_denied`: they run above the caller's level. */
    aboveLevel: new Set<string>(),
    /** What `t3_thread_list` answers (0080/E: the live threads, children with their parent); null: the one-thread stub. */
    threads: null as { threadId: string; status: string; parentThreadId?: string | null }[] | null,
    /** `t3_thread_interrupt` on these answers 401, as T3 does to a revoked sign-in. */
    revokeOn: new Set<string>(),
  };

  async function handle(req: IncomingMessage, res: ServerResponse) {
    let raw = "";
    for await (const chunk of req) raw += chunk;
    const body = JSON.parse(raw) as { id: number; method: string; params: Record<string, unknown> };
    requests.push({ method: body.method, params: body.params, headers: req.headers });
    if (switches.hang) return;
    const json = (status: number, value: unknown) => {
      res.writeHead(status, { "content-type": "application/json" });
      res.end(JSON.stringify(value));
    };
    const reply = (message: object, status = 200) => {
      const value = { jsonrpc: "2.0", id: body.id, ...message };
      if (!switches.sse) return json(status, value);
      res.writeHead(status, { "content-type": "text/event-stream" });
      res.end(`event: message\ndata: ${JSON.stringify(value)}\n\n`);
    };
    const refuse = (code: number, message: string, status = 200) => reply({ error: { code, message } }, status);

    if (req.headers.origin !== undefined) {
      res.writeHead(403);
      return res.end();
    }
    const asked = (body.params?.["arguments"] ?? {}) as { threadId?: string };
    if (body.method === "tools/call" && body.params?.["name"] === "t3_thread_interrupt" && switches.revokeOn.has(asked.threadId ?? "")) {
      switches.unauthorized = true;
    }
    if (switches.unauthorized || req.headers.authorization !== `Bearer ${MOCK_TOKEN}`) {
      return json(401, { error: "invalid_mcp_credential", message: "A valid T3 Code MCP credential is required." });
    }
    const p = body.params;
    if (req.headers["mcp-protocol-version"] !== "2026-07-28") return refuse(-32022, "Unsupported protocol version", 400);
    if (req.headers["mcp-method"] !== body.method) return refuse(-32020, "Mcp-Method header does not match", 400);
    const named = body.method === "events/poll" || body.method === "tools/call";
    if (named && req.headers["mcp-name"] !== p["name"]) return refuse(-32020, "Mcp-Name header does not match request parameters", 400);

    if (body.method === "events/poll") {
      const page = hub.read(
        (p["cursor"] as string | null) ?? null,
        p["name"] as string,
        (p["arguments"] as Filter | undefined) ?? {},
        (p["maxEvents"] as number | undefined) ?? 100,
      );
      const events = page.events.map(({ event }) => ({ eventId: `evt_${event.id}`, name: p["name"], data: event }));
      return reply({ result: { ...page, events, nextPollMs: 30_000 } });
    }
    if (body.method === "tools/call") {
      const args = (p["arguments"] ?? {}) as { threadId?: string; runId?: string; stop?: boolean };
      const text = (value: unknown) => [{ type: "text", text: JSON.stringify(value) }];
      const done = (value: unknown) => reply({ result: { isError: false, structuredContent: value, content: text(value) } });
      if (p["name"] === "t3_thread_list") {
        return done({ projectId: "p1", currentThreadId: null, threads: switches.threads ?? [{ threadId: "t1", title: "one", status: "running" }], nextCursor: null });
      }
      if (p["name"] === "t3_thread_interrupt") {
        if (switches.aboveLevel.has(args.threadId ?? "")) {
          const failure = {
            _tag: "OrchestratorMcpFailure",
            code: "runtime_mode_escalation_denied",
            message: `Thread ${args.threadId} runs in full-access/default mode, above this client's.`,
          };
          return reply({ result: { isError: true, structuredContent: failure, content: text(failure) } });
        }
        return done({ threadId: args.threadId, runId: args.runId ?? "run-1", status: "interrupt_requested" });
      }
      return refuse(-32602, `Tool '${String(p["name"])}' not found`);
    }
    return refuse(-32601, `Method not found: ${body.method}`, 404);
  }

  const server = createServer((req, res) => void handle(req, res));
  const listen = (port: number) => new Promise<void>((done) => server.listen(port, "127.0.0.1", done));
  await listen(0);
  const { port } = server.address() as AddressInfo;
  const stop = () =>
    new Promise<void>((done) => {
      server.close(() => done());
      server.closeAllConnections();
    });

  return {
    url: `http://127.0.0.1:${port}/mcp`,
    hub,
    requests,
    switches,
    /** Refuses connections until `up`. */
    down: stop,
    up: () => listen(port),
    close: async () => {
      if (server.listening) await stop();
    },
  };
}
