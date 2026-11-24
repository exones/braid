## What changed

- `src/board/t3.ts`: a recorded `pm/` checker counts as running only while T3 shows `running`. Its record is no longer dropped on `completed` (or any other live status): it is kept, uncounted, so a later run on the same thread counts again. It is dropped only when T3 shows the thread archived (`showThread` now reports `archived` from the archived flags), or 24 h after the record (`CHECKER_CAP_MS`, bounds the `thread show` reads). A thread T3 can't be asked about keeps its record.
- `docs/board.md`: the rule and the 24 h cap.
- `test/reviews.test.ts`: the real timeline: recorded at 07:42 while `completed` (not counted, kept); `running` at 08:24 (counted); `completed` at 09:20 (not counted, kept); inside/past the 24 h cap; archived dropped; unknown thread kept. The programme side is unchanged and covered in `test/programmes.test.ts`: `pmChecks` feeds `checkerOf` and `holds`, so a counted checker keeps the programme working and un-nudged.

## Cause and signal (from the coordinator's check of the real threads)

- Each checker run is a separate task the PM starts with `t3_thread_send`. Between runs the checker has really finished (it isn't waiting on background work); each run's completion reaches the PM within about 2 s, which is the "seen finished" signal and already wakes the PM.
- The bug: the PM recorded the checker at 07:42 while it was `completed` between tasks; the next board read dropped the record at once. When run 3 started at 08:12 nothing counted, so the board nudged the PM at 08:24 and 08:37 during the run.
- `updatedAt` moves without a run (09:49:57 vs the last run's completion at 09:19:57), so it is no run-end time. My first version (count `completed` for 3 h from `updatedAt`) was wrong: it would have hidden a really idle PM and still dropped the record over the 3 h 24 min gap.

## Validation

`npm run verify` passes; docs updated: `docs/board.md`.

For later items: "quiet until <time>" for a PM or coordinator that doesn't land on the user, not built.
Needs the user: none.
