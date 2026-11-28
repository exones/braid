---
id: '0080/F'
title: "The board hears T3 events instead of polling"
status: To Do
labels: ["kind:story", "tier:M"]
dependencies: ['0080/B', '0080/D']
order: 60
---

## Goal

Signed in (0080/D), the board reads T3 over its one MCP connection instead of spawning `t3 thread list/show` processes, the light way 0083 measured, and learns of a finished turn, a question or a PR wake from T3's events within seconds instead of at the next 30 s poll. Performance is the user's priority (2026-11-28): per-record `t3 thread show` spawns took 7 to 24 s each under load and flooded T3. Signed out, or `access: cli`, the board reads T3 exactly as today. If events don't hold live, the board keeps its 30 s cadence on the light read.

Expected size: about 500 lines in 6 to 8 files.

## Start here

- `braids/0083-how-braid-can-read-t3-lightly/report.md` (in `main`), "Recommendation for braid" 1 to 4 and 7: the calls, the caches, what to avoid.
- `src/board/t3.ts`: `readT3` / `readFresh` (today's CLI read: `thread list` per project, `thread show` per running thread and recorded reviewer), the `T3` snapshot every lane reads, `working()`, `showThread`.
- `src/board/inputs.ts` (`InputSources.t3`, `failures`), `src/commands/board.ts` (`repoSources`, `REFRESH_MS`, the refresh loop), `src/board/feed.ts`.
- `src/board/failure.ts` (0080/C: one cached `thread show` per newly failed thread; leftover 2026-11-26-zqfe: its unbounded `Promise.all`).
- `src/board/stop.ts` (0080/E): already makes one `allProjects` live-only `t3_thread_list` per refresh when signed in; share it rather than add another.
- `src/t3/signin.ts`: `BoardSignIn.client()` (null: use the CLI). `src/t3mcp/client.ts`, `src/t3mcp/events.ts` (0080/B: the events reader with cursor, paging, `onReread`).
- `~/.braid/artifacts/braid/p27-t3-tests/t3-src-v0.1.12/` (`apps_server_src_mcp_toolkits_orchestrator_tools.ts`, `packages_contracts_src_milestones.ts`): `t3_thread_list` and `t3_thread_read` inputs and outputs, event payloads.

## Change

- **The signed-in read** (a new module, e.g. `src/board/t3-mcp.ts`), producing the same `T3` snapshot `readFresh` produces, so no lane changes:
  - per refresh: one `t3_thread_list` with `includeSubagents: true`, `allProjects` and the five live `statuses` (shared with 0080/E's stop step: one call per refresh in all), then `t3_thread_read {limit: 1, runLimit: 1, maxCharsPerItem: 1}` only for live threads whose worktree, branch or pending count isn't cached; recorded reviewers and checkers resolved from the live list, no per-record read;
  - the full list (idle threads, idle coordinators, titles; `settled: false` where settled threads don't matter) every 5 minutes or when `braids/` changes, cached in between;
  - caches: worktree and branch per thread id; the full list between its reads; T3's project ids for the served projects (resolved once);
  - never an unfiltered list paged to the end, never a status filter with a non-live status.
- **0080/C's failure read** signed in: the error from the same `t3_thread_read` (or one cached read per newly failed thread), bounded to a few at a time (leftover 2026-11-26-zqfe), never a `thread show` spawn.
- **Events:** one `eventsReader` per type (`thread.run_settled`, `thread.needs_input`, `pr.watch_wake`) on the one session, polled at T3's `nextPollMs` (or 5 s if shorter is cheap; decide and log); an event for a served project triggers that project's refresh at once (debounced, one at a time); `truncated` triggers one full read. Events are hints: a lost one costs at most one refresh period.
- **Fallback:** `client()` null, an `unauthorized` (signs out, as D does) or `unreachable`: that refresh reads with the CLI as today; events stop until signed in again.
- **Measure:** with `BRAID_BOARD_TIMINGS`, the read's time signed in vs the CLI on the same machine; put the numbers in report.md.
- Tests against the mock T3: the snapshot the MCP read builds equals the CLI read's for the same threads; the calls per refresh (one live list, reads only for uncached live threads); the full list only every 5 minutes or on a `braids/` change; events trigger a refresh, `truncated` a full read; a 401 and T3 down fall back to the CLI; signed out is unchanged; nothing synchronous (test/board-async.test.ts), nothing on the request path.

## Already decided

- 0083's recommendations 1 to 4 and 7 (above) are the design; the user's priority is fewer and lighter T3 calls.
- One MCP session (one client) for the board process; events and reads share it.
- The request path reads only snapshots (0077's rule).
- Live check with the user's sign-in, scratch threads only (another port, temporary HOME), as for D and E.

## Out of scope

- `events/stream` (SSE) and webhooks; settling threads (P35); the CLI path's own caching (P35's strand).

## Completion

- [x] Signed in, the board reads T3 over MCP as described (one live list per refresh, cached per-thread reads, the full list every 5 minutes or on a `braids/` change), and the snapshot matches the CLI read's
- [x] 0080/C's failure read uses MCP when signed in and is bounded
- [x] Events trigger a project's refresh within seconds; `truncated` triggers one full read
- [x] Signed out, `access: cli`, a 401 or T3 down: the CLI read as today (tests prove it)
- [x] report.md has the measured read times signed in vs the CLI
- [x] Live check on scratch threads with the user's sign-in (a finished turn shows on a test board within seconds), or report.md says what is left
- [x] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open
