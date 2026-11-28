## What changed

- `src/board/t3.ts`: the board process remembers, per thread id, each recorded subagent it has seen `done`, `completed`, `failed` or `archived`, and no longer runs `t3 thread show` for it on every read. It asks again:
  - at once when the record's time moves, or when `thread list` names the thread running;
  - otherwise **5 minutes** after it was last asked (`FINISHED_RECHECK_MS`), at most **6** such re-checks per read (`FINISHED_RECHECKS`), longest unasked first.
- Running, idle and waiting records are asked on every read, as before. A record T3 can't answer for is not taken as finished.
- `src/braids/reviews.ts`: recording an item's thread again (`braid review` with the same thread) now moves the record's time. The stored fields are unchanged.
- No new file; calls still go through the asynchronous `T3Runner`, in the refresh only.

## Why

Every read ran `t3 thread show` for each record in `.braid/reviews.json`. At about 10 s a call, 31 records used up the 60 s read limit on every read (the user's "1. C").

## Choices

- **5 minutes, not longer.** A coordinator that messages a finished child (`t3_thread_send`) writes nothing to the record, and `thread list` leaves subagents out. Under the ten-minute stall clock, the board sees such a child running before its item reads stalled or "checks failed" alarms.
- **PM checker records (`pm/<slug>`) are asked on every read.** A checker starts again while T3 shows it `completed` and its record doesn't move. Its 24 h cap already bounds those calls. Its record keeps its first time, so the cap is unchanged.
- **6 re-checks per read** is one round of the call pool, so records seen finished together don't all come due in one read.

## Validation

- Gate (`node dist/cli.js gate`): exit 0; 805 tests, 804 passed, 0 failed, 1 skipped; 1476 s.
- New tests in `test/reviews.test.ts`: the T3 calls of two reads (33 records, then only the running, idle and waiting 3); woken by re-record, by `thread list` and by the interval; the per-read limit and an unanswered re-check. `test/board-async.test.ts` passes.
- One existing assertion changed on purpose: a repeated `braid review` now moves the record's time (it asserted the first time stayed).
- `BRAID_BOARD_TIMINGS=1`, a scratch project with 31 finished records and a fake T3 taking 10 s per `thread show` (script: `~/.braid/artifacts/agento/0077/J-time.mjs`):

| | read 1 | read 2 |
| --- | --- | --- |
| before | t3 60040 ms, 31 `thread show` | t3 60050 ms, 31 `thread show` |
| after | t3 60032 ms, 31 `thread show` | t3 1 ms, 0 `thread show` |

## Docs

`docs/board.md` (what a read asks T3, the interval) and `docs/cli.md` (`braid review` again moves the time). The other docs from `BRAID.md` `docs` are not affected; the help text stays true.

## Open

- The first read after a board start still asks every record once. At 10 s a call that read can pass 60 s and count as failed; the calls still finish and are remembered, so the next read is fast. The same can recur only for records that are not finished or that T3 can't answer for: those (a deleted thread, say) are still asked on every read.
- A finished subagent woken only by a message shows as running up to 5 minutes late (longer with more than 60 finished records, since a read re-checks at most 6).
- The braid branch has no `braid launch` yet (0060 is on `main`). `launch --child` records through `recordReview`, so it gets the new behaviour after `main` is merged in. Expect conflicts there in `src/board/t3.ts` (the recorded-thread loop) and `src/braids/reviews.ts` (`recordReview`, which has a `role` on `main`): keep `toShow`/`remember` around main's loop, and the time move with main's signature. A finished child is not running, so it adds nothing to main's `occupied`.

For later items: (skill change, needs the user's go) the coordinator skill could run `braid review <id> --thread <child>` again after messaging a finished child, so the board sees it at once.

Needs the user: none
