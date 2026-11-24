# 0073/G report

## What changed

- `notDone()` in `src/commands/clean.ts` reads the braid's brief on the local branch, `origin/<branch>`, `main` and `origin/<main>`. Done on any of them counts as Done. The branch is kept only when none says Done. When no copy can be read it is kept as before.
- `merge-gate`'s timeout message in `src/commands/mergegate.ts` gives a limit under a minute in seconds ("1 second"), not "0 minutes".

## Why

`braid accept` stamps Done in a temporary worktree and pushes it only to `origin/<branch>`. The local branch stays behind, so `braid clean` read "not Done" and kept the branch of a braid or story that was Done and merged.

## Validation

- New tests in `test/start-clean.test.ts`: a braid and a story whose local branch lags an `origin/<branch>` with the Done stamp are removed. A braid Done only on main is removed. The existing test for a live braid with a merged early PR still passes.
- `test/merge-gate.test.ts` now expects "1 second" for a 400 ms limit.
- The gate `npm run verify` passed.

## Docs

`docs/braids-format.md` and `docs/cli.md` (the `braid clean` text) now say the branch is kept until the braid's brief says Done on the local branch, `origin/<branch>`, `main` or `origin/main`.

## Open

None.

For later items: none.
Needs the user: none.
