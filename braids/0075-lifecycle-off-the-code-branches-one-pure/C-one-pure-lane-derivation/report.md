# 0075/C report: one pure lane derivation

## What changed

- **Alarms are a separate step.** `Signals.alarm` now only reads the clock (what an alarm shows now). `derive`, `toCard` (and `toProgrammes`) return the `Alarm` conditions they saw (`alarms`); `brokeClock.settle(alarms)`, called through `ReadSignals.commit(alarms)`, is the one step that starts, keeps or drops the first-seen times and notes the due nudges and escalations. `deriveBoard` returns `{ board, alarms }`; `toBoard` is the same without the step.
- **`toCard` reuses `derive`'s steps.** `routing` (request routing and the PM line), `stallsOf` (stall, pause-overdue stall, broken wait, limit) and `withStalls` are shared; `toCard`'s own copies are gone.
- **A braid is Done only from its own status** (`braidLane`): all strands Done with no merged final PR reads as its coordinator's state (Working with a live coordinator, else the stall rules). The fix was needed: `braidLane` still derived Done from the strand lanes after 0075/B.
- **One input builder**, `readInputs` (`src/board/inputs.ts`): braids, GitHub, T3, signals with plans and held pauses, done dates, start context. The board feed, `braid status`, Start, Open thread and the Merge action all use it, so Merge now reads T3, plans and held pauses like the rest. `readStartContext` moved there (still exported from `commands/board.ts`).

## Decisions

- Uniform stall overlay: a broken wait shows under any non-stall need (before, under a request or question only for items), and the pause's limit replaces any need but a Waiting one for a braid (before, for items only when nothing else matched). Both are edge cases of a braid that also has a broken wait or a pause limit; the lane names and texts are unchanged.
- Net size: src +126 lines (the input builder and the shared steps are new; `feed.ts` and `toCard` shrank). Not below zero as hoped.

## Validation

- Gate in parts (the whole takes over 10 min): docs-gate, typecheck, build, and every suite under `test/` in two chunks (456 + 240 tests, 0 failures).
- New tests: `lanes.test.ts` derives twice with a recording clock and sees no write until `settle` runs; all strands Done, no final PR, live coordinator (and To Do, stopped coordinator, open final PR) is not Done, the merged final PR is Done; `coordinate.test.ts` has `braid status`, the board and the Merge action over the same fixture giving the same lanes and the same merge. Tests that relied on the derivation writing the clock now call `settle`.
- Two old tests expected a braid with all strands Done and no final PR to be Done (`board.test.ts` 0004, `done-date.test.ts` 0003); they now expect Working, which is the brief's fix.

## Docs

`docs/board.md` (Lanes, broke alarms): one input, a pure derivation, the clock step after it, all strands Done is not Done. Other docs: none affected. `docs/decisions.md` has no new entry; 0075/D can add the decision with the rest.

## Open

None.

For later items: none.
Needs the user: none.
