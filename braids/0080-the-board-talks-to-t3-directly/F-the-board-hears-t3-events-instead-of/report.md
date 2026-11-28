## What changed

Signed in (`access: auto`), the board reads T3 over its one MCP session and refreshes a project on T3's events. Signed out, `access: cli`, a 401 or T3 down, it reads with the `t3` command line as before.

- `src/board/t3-mcp.ts` (new): one live-only `t3_thread_list` per refresh for all projects; `t3_thread_read {limit: 1}` only for what isn't cached; the unsettled list at the first read, every 5 minutes and after a `braids/` change; three event readers (`thread.run_settled`, `thread.needs_input`, `pr.watch_wake`); the CLI fallback.
- `src/board/t3.ts`: `readFresh` split into the reads and one assembly (`snapshotOf`), used by both paths, so the lanes can't differ by path.
- `src/board/failure.ts`: a failed thread's error is one MCP read when signed in; both paths read at most four at a time (leftover 2026-11-26-zqfe's unbounded `Promise.all`; its "review gaps" are not covered here).
- `src/board/stop.ts`, `steerer.ts`: the stop step takes the refresh's live list. That list is now paged to its end (it was one page of 100).
- `src/commands/board.ts`: wiring; a `braids/` change marks the full list stale; an event refreshes its project (200 ms debounce, reads still one at a time).

## Why

The user's priority is performance: per-record `t3 thread show` processes took 7 to 24 s each under load. 0083 found the cost is the `t3` process, not T3's queries.

## Choices to know

- A pending question count is trusted only while the events have been read since before the read that gave it. A working thread with a pending question, a changed status or latest run, or named by an event is read again. Without events, every working thread is read each refresh (still no process).
- Settled threads are listed once (first read, and after a gap in the events), apart from the unsettled list: PM and request threads and coordinator buttons need them. On this machine's T3 that is a few pages, once. A settled thread archived later stays in the board's view until a restart or a gap.
- A recorded child or PM checker that isn't live is not read, so a checker archived without the board having seen it run is dropped at its 24 h cap rather than at once.
- Events are polled every 5 s (or sooner if T3 asks), 30 s after a failure.

## Measured

This machine, 2026-11-28, about 80% CPU. Script and output: `~/.braid/artifacts/braid/0080/f-time.mjs`, `f-time.txt`.

| What | Time |
| --- | --- |
| `t3 thread list` (real T3, 13 threads listed, 3 running), 3 runs | 3.0 to 3.8 s (1.4 to 2.2 s in an earlier round) |
| `t3 thread show` of one thread (real T3), 3 runs | 2.0 to 2.5 s (1.8 to 2.1 s earlier) |
| Signed-in read on the mock T3 (450 threads, 6 running), first: lists plus 6 reads, 14 calls | 365 ms |
| Signed-in read on the mock, later refreshes: 1 call | 19 to 33 ms |

The signed-in read could not be timed against the real T3: that needs the user's sign-in. The mock's server time is near zero; 0083 measured T3's own at about 90 ms for the live list and 20 to 40 ms per thread read. A CLI board read is one list plus one `show` per running thread and per recorded child asked, six at a time, so several seconds at the figures above (0083: 7 to 24 s per process under heavier load).

## Validation

- `test/board-t3-mcp.test.ts` (6 tests, mock T3): the MCP snapshot equals the CLI read's over the same threads, with no `t3` call and no synchronous child process; the calls of each refresh; the full list only after 5 minutes or a `braids/` change; an archived thread leaves; events refresh and a truncated page reads everything; signed out, 401 and T3 down read by the CLI; the failure read over MCP, four at a time; a running board refreshes on an event long before its timed refresh.
- Existing `board-stop`, `board-failure`, `t3`, `board-async`, `t3mcp`, `t3-signin`, `board` and `board-projects` tests pass.
- Gate: `npm run verify` passed locally (exit 0; 917 tests, 916 pass, 0 fail, 1 skipped; about 12 min of tests).

## Left to do: the live check

Not run: it needs the user's sign-in, through the coordinator, with D's and E's checks. Steps, on another port with a temporary `HOME` / `BRAID_HOME` and scratch threads only: sign in; start `braid board` with `BRAID_BOARD_TIMINGS=1`; check the `board t3 …: mcp N ms, K calls` lines; let a scratch thread finish a turn and see the board change within about 5 s; note the signed-in read time.

Unchecked against the real T3 until then: the shapes of `t3_project_list`, `t3_thread_list` and `t3_thread_read` (taken from T3 0.1.12's sources; an unexpected answer falls back to the CLI), and how long T3's `events/poll` takes.

## Docs

`docs/board.md` (new "The read over MCP" and "Events"; "Where the states come from", "Refresh", "T3 sign-in", "Stop before the words") and `docs/decisions.md` (D122). README, getting-started, the CLI docs and help text are unaffected (no command or flag changed).

For later items: 0080/H: the signed-in read and events are documented in `docs/board.md`. A later item could re-list the settled threads now and then.

Needs the user: none
