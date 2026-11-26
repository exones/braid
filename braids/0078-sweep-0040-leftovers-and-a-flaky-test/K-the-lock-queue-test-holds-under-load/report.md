# 0078/K: The lock queue test holds under load

## What changed

- The queue test ("a waiter outlasts a queue of holders longer than its wait ...", `test/requests.test.ts`) no longer starts a holder process or depends on time. `locked` (`src/braids/state.ts`) takes an optional clock (`now`, `pause`); the test's `pause` moves its own clock by 1 s and hands the lock over, 20 holders against a 4 s wait. Real callers get the same behaviour as before (`Date.now`, a 20 ms nap).
- `locked` writes a random token into the lock file, and a lock's identity includes it. Every hand-off in the test keeps the same file and times, so only the token shows it.
- New test: every hold writes its own token.

## Why

- A margin was not enough. With 20 ms hand-offs, a 4 s wait and a 12 s queue, the test still failed 1 of 10 runs under load. A diagnosis run of the same holder and waiter measured 15.7 s between two hand-offs in 1 of 40 runs (`diag.mjs` in the artifacts folder). I did not find which step of the holder stalled.
- The old identity (inode, creation and modification time) was not sure to change on every hand-off. On Linux (WSL2, ext4) a lock removed and made again reused the inode in 2999 of 3000 tries, leaving only the file times, which can be coarser than the gap between two holders. On this Windows machine 3000 tries gave no repeat.

## Validation

- Load: 24 busy `node -e "for(;;){}"` processes on 24 logical cores, the queue test 10 times in a row: `bash ~/.braid/artifacts/agento/0078/K/load-run.sh 24 10`. **10/10 passed**.
- Negative checks on copies of the built `dist/`, each failing the queue test with "is locked":
  - the wait counted from the start (the identity is recorded once and never restarts the wait);
  - the token left out of the identity.
- Gate `npm run verify`: passed, 710/710 tests, 1244 s.

## Docs

None affected: no doc from `docs` states what the lock file holds or how one lock is told from the next.

## Anything open

- The queue test now runs in one process. Several real processes on one lock are still covered by the two "overlapping writers" tests.
- Porting to PR #335 (branch `fix/request-lock-wait`) is the coordinator's step: both the clock and the token are needed, with the two tests.

For later items: none

Needs the user: none
