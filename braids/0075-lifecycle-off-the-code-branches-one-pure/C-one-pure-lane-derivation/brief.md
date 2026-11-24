---
id: '0075/C'
title: "One pure lane derivation"
status: In Progress
labels: ["kind:task", "tier:M"]
dependencies: ['0075/B']
order: 30
---

## Goal

The lane of an item is one pure function of its inputs, and the board, `braid status` and the Merge action pass it the same inputs, so they can't disagree. Alarms (the broke clock in `.braid/broke.json`) become a separate step after the derivation. Fix by test: a braid with all strands Done, no final PR yet and a live coordinator does not read Done (`docs/board.md`:9).

Expected size: about 400 lines in 8 files; it should remove more than it adds outside tests.

## Start here

- `src/board/model.ts`: `derive` (386-461) calls `sig.alarm` while it derives; `toCard` (590-703) re-implements request routing (625-632, copying `derive` 403-411), its own `<n> coordinator` stall clock (633-660), the limit steps (661-664) and calls `derive` again for the final PR; `braidLane` (527-530) gives Done when every strand is Done and the braid has no lane of its own.
- `src/board/signals.ts` 58-194: `brokeClock`, `ReadSignals.commit`.
- The callers and their inputs: `braid status` (`src/commands/coordinate.ts` 65-88), the board (`src/commands/board.ts` 490-496, `src/board/feed.ts` 60-75: adds `plans`, held pauses and done dates), the Merge action (`src/commands/board.ts` 118-151, `mergeOf` with no T3).
- `test/lanes.test.ts` 152-183, 257-275; `docs/board.md` 9.

## Change

- One input builder used by all three callers (braids, GitHub, T3, signals with plans and pauses, start context); the Merge action reads T3 like the others.
- `derive` and `toCard` return the lane and the alarm conditions they saw; one step after them asks the broke clock and writes. `toCard` uses `derive`'s routing, stall and limit steps instead of its own.
- A braid with all strands Done and no merged final PR is not Done (it reads as its coordinator's state: Working with a live coordinator, else as the stall rules say).

## Already decided

- Lane names, the board's look and the alarm texts don't change; only where they're computed.
- Related to 0074 (board pauses and resumes by code), which starts after this braid merges: keep the change to the lane derivation and its inputs.

## Out of scope

- New lanes, board views, or changes to nudge and stall timing.

## Completion

- [x] The lane derivation writes nothing; alarms are a separate step (a test derives twice with a recording clock and sees no write until the step runs)
- [x] `braid status`, the board and the Merge action build their input with the same function and give the same lane for each fixture braid (test)
- [x] All strands Done, no final PR, live coordinator: not Done (test); with the final PR merged: Done
- [x] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open

## Plan

1. `Signals.alarm` only reads the clock; `derive`, `toCard`, `toProgrammes` return the `Alarm` conditions they saw; `brokeClock.settle` / `ReadSignals.commit(alarms)` is the one step that starts, keeps or drops times and notes nudges.
2. `routing`, `stallsOf`, `withStalls` shared by `derive` and `toCard` (request routing, stall, broken wait, limit).
3. `braidLane`: Done only from the braid's own status.
4. `src/board/inputs.ts` `readInputs`: the one input builder for the board feed, `braid status`, Start, Open thread and Merge.
5. Tests, docs/board.md.
