---
id: '0049/G'
title: "Merge main into the braid branch"
status: In Progress
labels: ["kind:task", "tier:S"]
dependencies: ['0049/D']
order: 50
---

## Goal

Before the final PR, `main` must be merged into the braid branch (workflow: "Merge `main` into a braid branch ... before the final PR"). The merge conflicts in `src/commands/board.ts`: since this braid started, `main` got 0052's fix (ef74a74: `close()` waits for the background read; the file watcher ignores a folder's own change event, `isFolder`), while this braid rewrote the same code to serve several projects (one `Sources`, one refresh and one notifier per project, `refreshAll`). After this strand, the braid branch contains `main` with both behaviours kept.

Expected size: the merge, plus about 40 lines of resolution in 2-3 files.

## Start here

- `git log` on `origin/main` since the braid branch's base: ef74a74 (board close and watcher), fec55eb and 53d55b7 (one path normaliser, native real paths), 918ec3c (`braid start` safe to run again), 31fe3dc (`braid wait` exit 3).
- `src/commands/board.ts`: `startBoardWith`, the per-project refresh from 0049/C, and main's `close()` and watcher; `test/board.test.ts`, which uses `close()`.
- 0049/C's report.md for the per-project read cycle.

## Change

- In this strand's branch, merge `origin/main` (a merge commit, no rebase) and resolve every conflict.
- Keep main's behaviour for every served project: `close()` waits until no project's read is running or queued; the watcher's folder-change filter holds for each watched folder (one watcher per project, if 0049/C watches per project).
- Keep 0049/C's behaviour: per-project reads, timeouts and last good snapshots.
- Check that main's other changes (the path normaliser in particular) still fit the code this braid added (`src/projects/list.ts` `samePath`, worktree comparisons); use main's shared normaliser where this braid has its own copy.
- Tests: main's board tests pass, and with two projects `close()` waits for both projects' reads.

## Already decided

- The coordinator doesn't resolve product-code conflicts; this tier S strand does (braid skill, "Fixes").

## Out of scope

- Any new behaviour.

## Completion

- [x] `origin/main` merged with every conflict resolved, and both main's and this braid's behaviour kept
- [x] A test that `close()` waits for every project's read
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open
