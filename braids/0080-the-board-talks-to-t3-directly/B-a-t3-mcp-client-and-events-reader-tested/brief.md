---
id: '0080/B'
title: "A T3 MCP client and events reader, tested on a mock"
status: To Do
labels: ["kind:task", "tier:M"]
dependencies: []
order: 20
---

## Goal

A small module the board will use to talk to T3's MCP endpoint over HTTP: one JSON-RPC call (tools and events), and an events reader that keeps a cursor per event type, pages while `hasMore`, and asks for a full re-read on `truncated`. Tested against the mock T3 server ported into the tests. Nothing is wired into the board and nothing stores a token: the caller passes a function that returns one. This is the user's "first test on some mock, and if it holds, implement".

Expected size: about 350 lines in 4 files (module, mock, tests).

## Start here

- `~/.braid/artifacts/braid/p27-t3-tests/events-mock/server.mjs`, `client.mjs`, `demo.mjs`: the mock and the consumer shape; run `node demo.mjs` there to see the four cases.
- `~/.braid/artifacts/braid/p27-t3-tests/t3-src-v0.1.12/apps_server_src_mcp_McpHttpServer.ts`: the headers and errors T3 checks (`mcp-method`, `mcp-name`, `mcp-protocol-version: 2026-07-28`, Bearer); `apps_server_src_milestones_MilestoneHub.ts`, `packages_contracts_src_milestones.ts`: cursor, window, filters, payloads; `apps_server_src_mcp_toolkits_orchestrator_tools.ts`: `t3_thread_list` and `t3_thread_interrupt` (input `stop`, `runId`) as `tools/call`.
- `src/board/t3.ts`: how the board reads T3 today (`runT3`, `T3Runner`, replaced in tests); the new client follows the same idea: an injectable transport, never a real T3 in tests.

## Change

- `src/t3mcp/client.ts` (new): `callMcp(endpoint, method, params, token)` with the headers above, a timeout, and typed failures: `unauthorized` (401 or T3's auth error: the caller treats it as signed out), `unreachable` (connection refused, timeout: the caller retries later), `error` (a JSON-RPC error, with code and message). `callTool(name, args)` on top for `tools/call`, returning the structured result. The token is never logged or put in an error message.
- `src/t3mcp/events.ts` (new): `eventsReader(client, name, args, { onEvent, onReread })` as `client.mjs` does: cursor null starts from now; page while `hasMore`; on `truncated` call `onReread` first, then apply the page; return T3's `nextPollMs`. Events are hints: a lost or repeated one never breaks the board, so no event is acknowledged or stored.
- `test/fixtures/t3-mcp-mock.ts` or similar (new): the mock ported to TypeScript, with `tools/call` stubs for `t3_thread_list` and `t3_thread_interrupt` and a switch for 401 and for refusing connections.
- `test/t3mcp.test.ts` (new): start from now, paging, falling behind, a T3 restart, nothing new, a filter by project, a 401, T3 down, a tool call; the token absent from every error text.

## Already decided

- No dependency: Node's `fetch` and `http` are enough (the mock shows it). Stateless HTTP calls, no SSE stream and no webhooks here (`events/stream` may come later if polling at T3's `nextPollMs` proves slow).
- The module knows nothing of the board, braids or the secret store.
- Related to 0077 (owns the board's T3 call path): this strand adds only new files under `src/t3mcp/` and `test/`, so it can run now.

## Out of scope

- Signing in and keeping the token (0080/A, 0080/D), wiring events into the board (0080/F), stopping threads (0080/E).

## Completion

- [x] `src/t3mcp/` has the client and the events reader, with the failures typed as above
- [x] Tests against the ported mock cover the cases listed under Change, and no test reaches a real T3
- [x] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open
