## What changed

- `src/board/t3.ts`: a recorded `pm/` checker counts as running while T3 shows `running`, or `completed` (between its runs) until 3 hours after its last update (`updatedAt` of `thread show`, else the record's time). Any other status (idle, failed, archived) or past the cap drops the record; a thread T3 can't be asked about keeps its record, as before. `readT3` takes an optional `now` for tests.
- `docs/board.md`: the checker rule and the cap.
- `test/reviews.test.ts`: the real case (completed between runs, runCount 3, activeRunId null) still counts; past the cap and failed drop the record; unknown thread keeps it. The programme side is unchanged: `pmChecks` feeds `checkerOf`/`holds`, already covered in `test/programmes.test.ts`.

## Why this signal (open)

The `t3` CLI isn't installed in this worktree, so I couldn't read the real `thread show` output; the fixture is the shape in the brief plus `updatedAt`, which is an assumption. I found no verified "seen finished" field, so I did not use the "PM thread started a run after the checker's last run" idea: I can't confirm what T3 gives for a run start. A checker that really finished while T3 shows `completed` therefore counts until the 3 h cap. Per the brief I added no new command.

## Validation

`node --test test/reviews.test.ts test/programmes.test.ts` pass; `npm run verify` passes (682 tests, ~6 min).

Docs updated: `docs/board.md`.

For later items: a "seen finished" signal from T3 (PM run after the checker's last run), checked against a real thread; "quiet until <time>" not built.
Needs the user: none.
