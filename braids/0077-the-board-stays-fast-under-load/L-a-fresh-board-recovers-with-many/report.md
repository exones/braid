## Answer

**The base recovers by itself, at the second read. No fix was needed and no product code changed.**

The first read after a board start asks T3 once per record, so with 31 finished records at 10 s a call (six at a time) it runs just past the 60 s limit and counts as failed. Its snapshot is dropped, but the read itself runs to its end, and each answer is remembered as it arrives (`remember()` in `src/board/t3.ts`). The read queued behind it by the 30 s refresh then asks `thread show` for none of them.

## What changed

- `test/reviews.test.ts`: one test through `feed` and the real `readT3`: 31 finished records, the real 60 s limit, a mocked clock and timers, `thread list` answering after 10 ms and `thread show` after 10 s.

## Timings

Mocked clock (the test; the other sources are the demo's):

| | ends at | result | `thread show` |
| --- | --- | --- | --- |
| read 1 | over the limit at 60.00 s (ends 60.01 s) | failed: "the read took longer than 60 s" | 31 |
| read 2 | 60.02 s | stored | 0 |

Real timers (`~/.braid/artifacts/agento/0077/L-time.mjs`: `feed` over the real sources of a scratch project, fake T3 and gh, one refresh asked at 30 s; run once on this machine while other agents' tests ran):

| | stored at | result | `t3` part of the read |
| --- | --- | --- | --- |
| read 1 | 60.01 s | failed: the limit | 60073 ms, 31 `thread show` |
| read 2 | 74.12 s | snapshot | 1 ms, 0 `thread show` |

Read 2's 14 s are the end of read 1 and its own git reads on the loaded machine, not T3.

## What a user sees

For about the first minute after a start the project has no snapshot, and from 60 s the page shows "the read took longer than 60 s". The next read clears it.

## Validation

- Gate (`node dist/cli.js gate`): exit 0; 853 tests, 852 passed, 0 failed, 1 skipped; node tests 2266 s on this machine.
- The new test passes on the base's product code (it took 12 s in the gate). With the memory switched off in the built `dist/board/t3.js` (a finished answer no longer stored), it fails: only the timed-out read is recorded by 70 s. There is no fix, so no test that failed on the base.

## Docs

None affected: `docs/board.md` (Refresh) already says a restarted board asks each record once, and that stays true.

## Open

- The recovery needs T3 to answer. A call that takes more than 30 s is killed and not remembered, so it is asked again at every read; the same holds for a deleted thread (leftover 2026-11-27-d1zk). Neither was part of this question.

For later items: none

Needs the user: none
