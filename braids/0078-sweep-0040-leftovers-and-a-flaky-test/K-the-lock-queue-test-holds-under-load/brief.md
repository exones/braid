---
id: '0078/K'
title: "The lock queue test holds under load"
status: To Do
labels: ["kind:task", "tier:S"]
dependencies: []
order: 25
---

## Goal

The regression test 0078/J added, "a waiter outlasts a queue of holders longer than its wait while the lock keeps changing hands" (test/requests.test.ts:274), passes in a loaded local gate. In 0078/B's local `npm run verify` on a heavily loaded machine it failed once and passed when rerun alone. The same test is in PR #335 (J's fix alone, into main), so a flake here would reach every braid's gate.

Expected size: about 20 to 40 lines in 1 to 2 files.

## Start here

- `test/requests.test.ts:274-295`: a holder process renames the lock 20 times with 150 ms naps (about 3 s) against a 1.5 s wait. Under load a single nap can stretch past 1.5 s, so the waiter sees the same lock for its whole wait and gives up, which is the correct product behaviour for a lock that doesn't change hands.
- `src/braids/state.ts`: `locked` and how it tells one lock from the next (its identity: mtime, content).

## Change

- Keep what the test proves (a waiter whose wait is shorter than the whole queue still gets the lock while the lock keeps changing hands) and remove the timing race: for example a hand-off gap far below the wait (naps of about 20 ms against a wait of several seconds, with a queue several times the wait), or a holder that hands off on a signal rather than a timer. Check that the identity `locked` compares changes on every hand-off even within one millisecond (content, not only mtime), and fix it in the product if not.
- Show it: the test passes 10 runs in a row next to a CPU load (as 0078/J did), and still fails on the old wait-from-start behaviour.

## Already decided

- Runs before 0078/C, right after 0078/B. The coordinator ports the change to PR #335 (branch fix/request-lock-wait) after it merges here.

## Out of scope

- Other tests; the stale-lock age (leftover 2026-11-25-skgh).

## Completion

- [x] The queue test passes 10 runs in a row under a CPU load (report the command and the load), and fails with the old wait-from-start (a negative check shows it)
- [x] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open

## Plan

- Queue test: first a holder handing off every ~20 ms against a 4 s wait; it still failed under load, so `locked` takes a clock and the test hands off from the waiter's pause.
- `locked` writes a random token into the lock and `lockIdentity` includes it (Linux reuses the inode at once); a small test.
- Show: 10 runs under a CPU load; negative check on a copy of dist/ with wait-from-start; gate.
