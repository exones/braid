**0080/B: A T3 MCP client and events reader, tested on a mock**

**What changed**

- `src/t3mcp/client.ts`: `callMcp(endpoint, method, params, token, options)` makes one stateless JSON-RPC POST (MCP 2026-07-28); `mcpClient(endpoint, token)` gives `call` and `callTool`. Failures are `McpError` with `kind` `unauthorized` (401), `unreachable` (refused, reset, timeout, a 5xx with no JSON-RPC body) or `error` (JSON-RPC error, failed tool, other HTTP status), and a `code`: the JSON-RPC code, the tool's failure code (`runtime_mode_escalation_denied`) or the HTTP status. It retries nothing, sends no `Origin` and no `T3-Mode-Limit`, refuses redirects and reads an answer sent as JSON or as server-sent events. The token is in no error.
- `src/t3mcp/events.ts`: `eventsReader(client, name, args, { onEvent, onReread }, { maxEvents? })` with `pollOnce()` (returns `nextPollMs`) and `cursor`. A failed poll or handler leaves the cursor after the last page handled, so the next poll reads the rest again.
- `test/fixtures/t3-mcp-mock.ts`: the mock in TypeScript, with T3 v0.1.12's header checks, 403 on an Origin, 401, tool failures, stubs for `t3_thread_list` and `t3_thread_interrupt`, and switches for 401, refused connections, no answer, server-sent events and a thread above the caller's level.
- `test/t3mcp.test.ts`: 12 tests.

**Why:** 0080/D (sign-in) and 0080/F (events) build on this. Nothing is wired into the board and nothing stores a token.

**Validation**

- `node --test test/t3mcp.test.ts`: 12 pass. No test reaches a real T3.
- `npm run verify`, run once on the loaded machine: 717 of 719 tests pass (about 980 s of tests). The two failures are both "overlapping writers in separate processes lose no update" in `test/requests.test.ts` (known flaky under load, idea 2026-11-25-kzbl); this diff only adds new files under `src/t3mcp/` and `test/`. CI on the PR runs the same checks.
- Gate box: the local run failed only the two "overlapping writers" lock tests in `test/requests.test.ts` under load (leftover 2026-11-25-kzbl, untouched by this diff), and CI's verify (the same `npm run verify`) is green on both platforms at PR #334.
- Not checked against a real T3: the mock follows T3's v0.1.12 source. 0080/D's live check is the first real call.

**Docs:** none affected: the module isn't used by any command or the board yet. No user decision to record.

**Size:** 641 lines in 4 files, against about 350 expected (the added failure cases, the mock's switches and the tests for them).

**Open:** the gate Completion box is unticked until the flaky pair is judged against CI's result.

For later items: 0080/D: pass `mcpClient` the stored token through its token function and check the endpoint is local or `https` before calling (this client takes any URL). 0080/F: one `eventsReader` per event type; run one `pollOnce` at a time per reader.

Needs the user: none
