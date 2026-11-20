# 0049/G report

## What changed

- Merged `origin/main` into the strand branch (merge commit). Two conflicts: `docs/decisions.md` (kept main's D76 and D77, then this braid's D78 and D79, in order) and `src/commands/board.ts`.
- `board.ts`: 0049/C already carried main's watcher filter per project (the auto-merge kept `isFolder` in `watchFolder`, one watcher per served project). The conflict was the end of `startBoardWith`: `close()` is back, and it now waits for every project. `Feed` (`src/board/feed.ts`) got `idle()`, which resolves once no read runs and none is queued; `close()` awaits `idle()` of every served project and of every project dropped from the list while the board ran (their reads still have children in the repository).
- `src/projects/list.ts`: `samePath` uses main's shared `normPath` (real paths, slashes, case on Windows) instead of its own copy.
- `test/board-projects.test.ts`: a test with two projects, one slow, that `close()` returns only after both reads ended.

## Why

The braid branch must contain `main` before the final PR, with 0052's fix (no `git`, `gh` or `t3` still running when `close()` returns) holding for each project, and 0049/C's per-project reads, timeouts and last good snapshots unchanged.

## Validation

`npm run verify`: 432 tests pass, docs gate clean. Main's board tests (`test/board.test.ts`, which uses `close()`) passed unchanged.

## Open

Nothing. A read that timed out still counts as running for `close()` until it ends, on purpose: its children are still alive.

For later items: none.
Needs the user: none.
