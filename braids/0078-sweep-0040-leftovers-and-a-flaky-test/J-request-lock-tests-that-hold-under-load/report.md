# 0078/J: Request lock tests that hold under load

## What changed

`locked` (`src/braids/state.ts`) now gives up only when the lock has **not changed hands** for its wait (10 s; 60 s for the record's branch). Before, it gave up that long after a waiter started waiting, however far the queue had moved. A new lock file (inode, creation and modification time) restarts the wait. A lock older than 30 s is still taken over as before.

## Why: the cause

The cause is in the product, and on this machine it needs no extra load. One write of the request record takes 7–9 s here (measured: 8.7, 7.6, 7.3 s; Git trace: about 38 git processes per write). The four-writer test makes 16 writes in turn, about 2 minutes, so a writer's 60 s ran out while others were still making progress.

Reproduced with `node --test --test-name-pattern="overlapping writers" test/requests.test.ts`, with each writer's stderr printed: a writer exits 1 with `LockError: the requests record is locked (...)`. The four-writer test failed this way (exit codes `[0,1,0,0]` / `[1,0,0,0]`), and so did its six-writer sibling "... when they start on a stale lock" (three of six). No lost update and no takeover of a live lock was seen.

The stale-lock test the leftover says also failed alone did **not** fail here (one run alone passed in 10 s, and 10 loaded runs passed). I have no cause for that report.

## Tests

- The two tests are unchanged: they have no sleeps or margins of their own, and pass once the product stops giving up on a moving queue.
- New: "a waiter outlasts a queue of holders longer than its wait ...". The holder renames a new lock over the old one 20 times, so the waiter finds no gap. Without the fix it failed 5 of 5 runs; with it, passed 5 of 5.
- New: "a live lock that never changes hands is still given up on after the wait".

## Validation

- Load: 24 busy `node -e "for(;;){}"` processes (one per logical core), then both tests 10 times in a row: `bash ~/.braid/artifacts/agento/0078/load-run.sh 24 10` (a loop of `node --test --test-name-pattern=... test/requests.test.ts`). **10/10 passed**, 161–325 s per run.
- Negative checks, on a copy of the built `dist/`:
  - lock removed (`locked` just runs its function): both tests fail; the four writers exit `[1,1,0,0]`.
  - stale lock never taken over (`takeOverStale` returns false): the stale-lock test fails after 71 s. The four-writer test passes, as it should.
- Gate `npm run verify`: passed, 709/709 tests, 754 s.

## Docs

Updated the lock sentence in `docs/braids-format.md` (projects list). No other doc from `docs` states the lock's wait.

## Anything open

- A waiter now waits as long as the queue keeps moving, with no overall cap.
- The two tests take about 3–5 minutes per run on this loaded machine, because each write is slow.

For later items:
- **A live lock can still be taken over as stale.** A holder is considered dead 30 s after it made the lock and never refreshes it. A record write took 7–9 s idle here and about 10–20 s under load (estimated from run times), so a heavier load or a slow push could pass 30 s and let a second writer in. Not observed. Suggested: the holder refreshes the lock's time between its git calls.
- **A record write is slow on Windows** (about 38 git processes, 7–9 s here). Fewer calls would speed every `braid ask`/`handover` and these tests.

Needs the user: none
