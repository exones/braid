---
id: '0009'
title: "Board actions"
status: Done
labels: ["kind:goal", "tier:L", "ui", "auto"]
dependencies: ['0008']
order: 90
delivery: epic
---

## Goal

The board can act, locally: **Start** a braid by launching a new coordinator thread for it, **Merge** a PR that waits for the user, after a confirmation, and **Open** an item's agent thread in T3. Story 6 of the braid plan; the phone braid (0012) builds on it (user, 2026-11-17).

## Working at the end

- From the board, the user starts a To Do braid; a new coordinator thread appears in T3 and runs it.
- From a card in To Review, after a confirmation that names the PR, its head commit and the target branch, the user asks the coordinator to merge; it merges and the strand is Done on the braid branch.
- Every card and strand row with an agent thread has a small button that opens it in T3.
- No action works without the board session's token, or from another origin.

## Strands

- A. Mockups of the actions (S, ui): stop for the user's review.
- B. Write path and session token (M).
- C. Open thread and Merge on request (M, process).
- D. Start: a new coordinator thread per braid (M, process).

## Already decided

- **Start** launches a **new coordinator thread** for the braid with `t3 thread start <project> … --worktree <base>`, with no model flags: T3 uses the project's default model, which the user set to Opus 5.5, effort medium. `BRAID.md`'s coordinator becomes effort=medium to match (user, 2026-11-17: High showed no visible advantage). The board can't read a thread's effort; it warns when the thread's provider or model differ from `BRAID.md`'s coordinator. When `t3 thread start` gains `--option` (in T3's nightly since 2026-11-17), passing the settings explicitly is a later change.
- That coordinator launches its workers as today (`braid start`, `t3_thread_launch` with the full settings); the board binds no worktree itself. (wtw registers worktrees as T3 projects by writing T3's database: not used.)
- **Merge** doesn't merge from the board: after a confirmation dialog (PR, head commit, target branch, checks), the board sends the coordinator that handed the PR over "Merge #<n> at <head>", and that coordinator merges as on the user's "merge it" (user, 2026-11-17).
- **Open thread**: a small button per card and strand row with a thread, using the thread link T3 reports.
- Local only (`127.0.0.1`); network access and real sign-in are 0012.
- UI: mockups on demo data first; the user reviews them before anything is built.

## Completion

- [x] Strands A to D Done on the braid branch
- [x] `main` merged in; the gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, decisions from the log, anything open
