---
id: '0060/B'
title: "The board, status, pauses and clean see subagent workers"
status: To Do
labels: ["kind:task", "tier:M"]
dependencies: ['0060/A']
order: 20
---

## Goal

The board, `braid status`, the stall and limit counts, the pause targets, `braid accept` and `braid clean` see a subagent worker exactly as they see a worktree worker today, through the child record 0060/A writes. Open thread opens the child, by T3's own link.

Expected size: about 250 lines in 6 files, tests included.

## Start here

- `src/board/t3.ts`: how the snapshot finds agents (worktree workers, recorded reviewers, PM checkers), `T3Thread.link` (null for a subagent reviewer today) and `showThread`.
- `src/braids/reviews.ts` after 0060/A: the record with `role`.
- `src/board/programme.ts` and `src/board/nudge.ts`: when an item or programme reads stalled; "PR checks pending" already counts as not stalled for programmes.
- `src/commands/done.ts` (around "is still running"): `braid accept` refuses while a worker runs.
- `src/commands/clean.ts` (`reviewThreads`): how a recorded reviewer's checkout and `t3/` branch are removed.
- 0074/C's brief on `braid/0074-the-board-pauses-and-resumes-reliably-no`: its pause targets come from this snapshot.

## Change

- The snapshot: a recorded `worker` child is its item's `worker` while `t3 thread show` says it runs (as recorded reviewers are), with its provider; its `link` is T3's `link` (also for recorded reviewers, replacing null). Records keep the full `thread:` id.
- Between a worker's runs (finished child, its PR's checks pending): the item doesn't read stalled. Use the rule the programme already uses, or say in the report why another fits.
- Limits and pause targets count a running recorded worker by its provider. 0074/C takes its targets from this snapshot (agreed); check that nothing filters recorded threads to `reviewer`.
- `braid status` shows the worker and its link as it does for a worktree worker.
- `braid accept` refuses while a recorded worker child runs, as for a worktree worker.
- `braid clean` after the merge removes a recorded worker's T3 checkout, its `t3/<hex>` branch and the item branch, and drops the record, as for reviewers; a folder still in use is kept and named.
- Old top-level workers in braid worktrees are found as before.
- Tests for each, with T3 output faked from the real `t3 thread show --json` shape (`sources.md` S10), never the real T3.

## Already decided

- See the braid's "Already decided": the record, Open thread by T3's link, pauses through the snapshot.

## Out of scope

- The pause texts and sends (0074). The page's own Open thread action (leftover 2026-11-24-90kb).

## Completion

- [ ] A running recorded worker child shows on the board and in `braid status` as its item's worker, with T3's link for Open thread (reviewers get their link too), with tests
- [ ] An item whose worker child finished while its PR's checks are pending doesn't read stalled, with a test
- [ ] Limits counts and the snapshot the pause targets come from include running recorded workers by provider, with tests
- [ ] `braid accept` refuses while a recorded worker child runs, with a test
- [ ] `braid clean` removes a merged item's worker child checkout, `t3/` branch and record, with tests
- [ ] Worktree workers are still found, with the existing tests passing
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
