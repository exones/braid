---
id: '0077/B'
title: "Nothing blocks the board: no synchronous git, gh or T3 calls in the board process"
status: To Do
labels: ["kind:story", "tier:M"]
dependencies: ['0077/A']
order: 20
---

## Goal

The board process never blocks its event loop on git or gh: every call in the refresh, the wakes and the actions is asynchronous, so `/api/session`, the page and a click answer within a second while a read is slow. Idea 2026-11-24-z45n (`/api/session` took 26 ms to 5.1 s, `braid board --url` then said no board ran) and leftover 2026-11-23-5bor (the board writes the request record with synchronous git).

Also (the PM, 2026-11-25 19:25, CPU 100%, about 61 node processes): a slow `t3` or `gh` reads as "not installed". `runT3` (src/board/t3.ts, about line 106) kills `t3 thread list` at 30 s, the exit code is then null, so the error is set and `readFresh` (about line 252) says "t3 is not installed or not on PATH"; `parsed` in src/board/github.ts (about line 159) does the same for gh. A timeout must say what happened.

Expected size: about 450 lines in 13 files.

## Start here

- `src/board/feed.ts`: one project's read cycle; `readSnapshot` and `BRAID_BOARD_TIMINGS`.
- `repoSources` in src/commands/board.ts: every source the read calls, and the actions (merge, start, promote, open) with their `runGit`.
- The sync spawn sites the board process reaches: `runGh` in src/board/github.ts, `mainCheckout` in src/board/t3.ts (A caches it), `runGit` in src/board/done.ts, `catBatchSync` and the sync paths of src/braids/branches.ts, src/braids/requests.ts as src/board/wake.ts and src/board/remind.ts call it, src/board/signals.ts, src/board/plans.ts, src/board/inbox.ts. Find them all from `repoSources` and the server's handlers; don't trust this list.
- test/board-cheaper-reads.test.ts: `spyOnGit` with its `sync` flag.
- 0077/A's report: the shared git runner and its async form.

## Change

- Every git and gh call reachable from the board process (refresh, wakes, reminders, nudges, actions, the steerer) goes through the async runner; the request record write from the board (wake, remind) runs async too.
- A timed-out `t3` or `gh` call reads as "T3 didn't answer within 30 s; retrying" (and the same for gh), not as "not installed"; only a missing command (ENOENT) says not installed. The header and the project's failure line show it.
- From idea l7dw (handed over by P15's sweep, the PM 2026-11-25): `readInputs` (src/board/inputs.ts) always calls `src.github(true)` and `src.t3(true)`, so `fresh` is always true and the 3-second caches behind them (`readGithubAsync`'s and `readT3`'s ttl, wired in `repoSources`, src/commands/board.ts) never hit. Remove the `fresh` parameter and the dead caches, or make them hit if measuring shows they help; say which in report.md.
- A test that drives a full board read and fails on any sync git or gh call (the `sync` flag of `spyOnGit`, and the same for gh).
- A test that runs a read whose git takes seconds (a fake git that sleeps, through the runner's test hook) and asserts `/api/session` answers within a second meanwhile.
- A live check on a scratch board (temporary `BRAID_HOME`, a port other than 7800, a scratch clone): run a full gate in another worktree at the same time and time `/api/session` every second; report the numbers.

## Already decided

- The request path keeps answering from snapshots; nothing new is read there.
- CLI commands outside the board may stay synchronous.
- The record writes stay exactly as they are (same commits, same pushes, same ordering in wake.ts); only how they are called changes.
- No worker threads or child processes for the read: async calls are enough unless measuring shows otherwise; if they aren't, stop and propose.

## Out of scope

- T3 calls (already async), T3 MCP events, the probe (C), the gate (D).

## Completion

- [x] No sync git or gh call runs in a board read, wake or action, with a test that fails if one is added
- [x] A test shows `/api/session` answering within a second while a read's git calls take seconds
- [x] A `t3` or `gh` call that times out reads as not answering within its timeout, not as not installed, with a test for each
- [x] report.md has the live check's `/api/session` timings while a gate ran
- [x] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open

## Plan

One request-record algorithm, two drivers: gitbranch.ts writes reads and writes of a data branch once, as generators that yield each git call, run by a blocking driver (CLI) or an awaiting one (board); async forms of loadRecord, endRequest, addEvent, loadLifecycle, braidAt, readSignals and readiness (primed caches for the sync branch loader) feed the wake, reminders and the read. Actions' git runner goes async. A timed-out t3/gh reads as "didn't answer within 30 s; retrying" (src/board/timeout.ts). Remove `fresh` and the dead caches (l7dw). Tests: no synchronous child process in a read, wake, reminder, nudge or action; /api/session while git is slow; timeout wording. Live check on a scratch board under a gate.
