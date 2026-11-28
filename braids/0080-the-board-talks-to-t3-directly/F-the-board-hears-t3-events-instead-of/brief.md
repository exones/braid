---
id: '0080/F'
title: "The board hears T3 events instead of polling"
status: Outline
labels: ["kind:story", "tier:M"]
dependencies: ['0080/B', '0080/D']
order: 60
---

## Goal

Signed in, the board polls T3's MCP events (`thread.run_settled`, `thread.needs_input`, `pr.watch_wake`) with 0080/B's reader and refreshes the project concerned within seconds, instead of waiting for its 30 s CLI poll; a full `t3 thread list` read stays at start, after `truncated` and as a slow backstop. Signed out, or if events don't hold live, the board polls as today. Starts only after 0077 (which owns the board's T3 call path and refresh) is in `main` and merged into this braid.

## What works at the end

- A finished turn, a question or a PR wake on a scratch thread shows on the board within a few seconds.
- After a T3 restart (`truncated`) the board reads everything once and goes on.
- The slow full read (its period decided here, minutes not seconds) catches anything events miss (no run-started event exists).
- The request path still reads only snapshots (0077's rule).

## Open questions

- Poll at T3's `nextPollMs` or a shorter period; whether `events/stream` is worth it.
- The backstop period.
- Which MCP reads are cheap against T3's store (about 3 GB): read 0083's report (how braid can read T3 lightly) or ask its coordinator before any timed read. Performance is the user's priority (2026-11-28): the board's per-record `t3 thread show` spawns took 7-24 s each under load; signed in, the board should replace them (including 0080/C's failure read) with calls over the one MCP connection where 0083 shows that is cheaper.

## Already decided (from 0083's report, in main at 57e32159: braids/0083-how-braid-can-read-t3-lightly/report.md, "Recommendation for braid" 1-4 and 7)

- One long-lived MCP session in the board process, not one per call (removes the 7-24 s process cost and T3's session writes per call).
- Per board read (keep the 30 s cadence): one `t3_thread_list` with `includeSubagents: true` and the five live `statuses`; one `t3_thread_read {limit: 1, runLimit: 1, maxCharsPerItem: 1}` per live thread that needs its worktree, branch or pending count; recorded subagents and checkers resolved from the live list, with no per-record read.
- The full list (idle threads, idle coordinators, titles) only every few minutes or on a `braids/` change, with `settled: false` where settled threads don't matter.
- Caches in the board process: worktree and branch per thread id; finished records (0077/J); the full list between its refreshes; the project id.
- Avoid an unfiltered list paged to the end, and any status filter that includes a non-live status.
- So F covers the board's whole signed-in T3 read, not only events: signed in, these MCP calls replace the `t3 thread list/show` spawns (0080/C's failure read included); signed out, the CLI path stays.
