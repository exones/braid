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
