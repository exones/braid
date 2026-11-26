---
id: '0078/L'
title: "A live lock holder keeps its lock"
status: To Do
labels: ["kind:task", "tier:L"]
dependencies: []
order: 45
---

## Goal

A writer that holds the request record's lock never loses it while it is alive, however slow the machine; only a dead holder's lock is taken over. Leftover 2026-11-25-skgh, seen close up in the PM's live check of PR #335 at abb76243 (2026-11-26): with 48 extra load processes, single lock holds reached 30.26 s, past the 30 s stale time, so a live holder can have its lock taken over and two writers run at once, which can lose an update; and once a separate-process writer in "overlapping writers in separate processes lose no update" exited 1 with its stderr discarded, so nobody knows why. Taken into 0078 at the PM's request.

Expected size: about 80 to 150 lines in 2 to 4 files.

## Start here

- `src/braids/state.ts`: `locked` (creates the lock with a random token since 0078/K), `takeOverStale` (age by mtime against `LOCK_STALE_MS`, 30 s, under a `.takeover` guard), the release in `locked`'s `finally`.
- `src/braids/gitbranch.ts`: `lockedBranch` and `writeBranchUnlocked`: what runs under the lock (git commit and push, the slow part).
- `test/requests.test.ts`: "overlapping writers in separate processes lose no update" (spawns four writers and checks exit codes only), the stale-lock tests, and 0078/K's injected clock (`LockClock`).

## Change

- A live holder keeps its lock: either it refreshes the lock (touches it) while it holds it, often enough that a waiter never sees it as stale (between the git calls of a write, or on a timer that works while the holder is blocked in a synchronous git call), or staleness counts from the last refresh. Pick the simplest one that holds while the holder's process is busy in a synchronous child process, and say why in the plan.
- Release deletes the lock only when it is still ours (its token is ours); a lock that was taken over and re-created by someone else is left alone.
- A holder that finds its lock taken over (its token gone) fails loudly before it writes, instead of writing beside another writer.
- The separate-process writers test keeps each writer's stderr and prints it on a non-zero exit, so a failure says why.
- Regression tests, timing-free where possible (0078/K's injected clock): a holder slower than the stale time keeps its lock; a dead holder's lock is still taken over; release leaves someone else's lock alone; a taken-over holder doesn't write.

## Already decided

- Tier L: it is crash and recovery behaviour of the record's lock. The reviewer re-checks after fixes that change it.
- Runs right after 0078/D, at the PM's request. The coordinator ports the change to `main` (with PR #335 or after it) as the PM decides.
- 0072 doesn't touch src/braids/state.ts or gitbranch.ts.

## Out of scope

- Fewer git calls per write (leftover gprw, P24/0077).

## Failure modes and regression tests

- A live holder slower than the stale time loses its lock to a waiter → two writers, a lost update: test that it keeps it.
- A dead holder (killed process) leaves its lock forever → nothing can write: test that it is still taken over after the stale time.
- A holder whose lock was taken over deletes the new holder's lock on release → a third writer gets in: test that release leaves it.
- A refresh that keeps a dead holder's lock alive (a timer outliving the holder): test or argue why it can't.

## Completion

- [ ] A live holder slower than the stale time keeps its lock, tested
- [ ] A dead holder's lock is still taken over, tested
- [ ] Release deletes only our own lock, and a taken-over holder doesn't write, tested
- [ ] The separate-process writers test prints a failing writer's stderr
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated (docs/braids-format.md on the lock), or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
