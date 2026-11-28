# 0078/L report

## What changed

- `src/braids/state.ts`: every hold of a lock, `locked` and the board's `lockedAsync`, now:
  - writes a token of its own into the lock file;
  - starts a small worker thread that touches the lock every 5 s (a sixth of the 30 s stale time) while the lock still holds that token;
  - stops the worker before release. The worker and the holder share an `Int32Array` (running, stopping, touching), and the stop waits out a touch under way, so no touch happens after the hold ends;
  - deletes the lock on release only when it still holds our token.
- `checkHeld(name?)` throws a `LockError` ("lost the lock …; nothing was written") when a lock this process holds no longer has its token.
- The waiter's "has the lock changed hands" identity no longer includes the lock's change time. It is now inode, birth time and token. Otherwise each refresh would look like a new holder, and a waiter would never give up on a live but stuck holder.
- `src/braids/gitbranch.ts`: `writeBranchG` calls `checkHeld("<lock>.lock")` after building each commit and before it pushes or moves the local branch (offline). Moving the local branch is already a compare-and-swap.
- `test/lock.test.ts` (new): five tests:
  - a holder blocked in a synchronous child process keeps a lock that aged past the stale time;
  - a dead holder (`process.exit` inside the hold) stops refreshing, and its lock is taken over;
  - a holder that lost its lock leaves the new lock alone, never refreshes it, and `checkHeld` refuses;
  - the async hold is refreshed too, and its release leaves another writer's lock;
  - a branch write whose lock was taken over throws before it pushes or moves the branch.
- `test/requests.test.ts`: both separate-process writer tests keep each writer's stderr and print it on a non-zero exit.

## Why

On a loaded machine, single holds of the request record's lock passed the 30 s stale time (30.26 s in the PM's check of PR #335). A waiter could then take over a live holder's lock, and two writers ran at once.

A timer on the main thread can't fix this. The slow part of a hold is a synchronous `spawnSync` git call (a push), and no timer or code runs between its start and end. A worker thread is its own OS thread, so it keeps running, and it dies with its process. That means a killed holder still goes stale. Counting staleness "from the last refresh" is the same mechanism, because mtime is that clock.

## Validation

- `node --test test/lock.test.ts`: 5/5 pass.
- `test/requests.test.ts` lock, stale and overlapping-writers tests: 10/10 pass after the merge with the braid branch.
- Gate (`npm run verify`): passed, 864 tests (863 pass, 1 skipped), 16 min on a loaded machine.

## Docs

- `docs/braids-format.md`: the lock line for the inbox and requests (token, refresh, takeover of a dead holder only, still-ours check, own-token release) and the projects-list lock line.

## Open

- The merge with the braid branch (0077's one git runner and `lockedAsync`) is resolved by keeping both sides. `lockedAsync` got the same refresh and own-token release.
- Every hold now starts a worker thread, about a few ms each. I measured 5 holds in 21 ms.

For later items: none
Needs the user: none
