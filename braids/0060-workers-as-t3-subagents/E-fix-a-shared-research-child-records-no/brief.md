---
id: '0060/E'
title: "Fix: a shared research child records no checkout, and clean never removes a live thread's"
status: To Do
labels: ["kind:task", "tier:S"]
dependencies: []
---

## Goal

The PM's live check of PR #324 at d8e4d784 found a data-loss bug: `braid clean` can delete the coordinator's own checkout. A `shared` research child's T3 `worktreePath` is the parent's checkout; `braid launch --role research --child` records it as the child's folder, and `braid clean` then removes it (reproduced in a temp repo: "removed 0001/A: review thread … checkout …\t3wt\coord"). It could also force-delete the coordinator's `t3/<hex>` branch. Fix that, and label research children as research, not reviewer.

Expected size: about 80 lines in 4-5 files, tests included.

## Start here

- `src/commands/launch.ts` (`--child`, the `research` role: `isolation: "shared"`), `src/braids/reviews.ts` (`recordChild`), `src/commands/clean.ts` (how recorded threads' checkouts and `t3/` branches are removed), `src/board/t3.ts` and `braid status` (labels of recorded threads).

## Change

- A `shared` child (research) is recorded with no folder and no branch, so `braid clean` has nothing of it to remove.
- `braid clean` never removes a folder or branch that is the main checkout, the caller's own checkout, or one another live (running) thread uses, whatever the record says; it keeps it and names why. Its forced `t3/` branch delete stays limited to a recorded child's own branch.
- `braid status`, the board's limits list and `braid clean` label a research child `research` ("thread research running", `<n>:researcher:running` as the role key the limits list uses, "research thread"), not `review`/`reviewer`.
- Regression tests: a research child recorded with the parent's `worktreePath` (faked `t3 thread show --json`, the shape in `sources.md` S10) leaves the coordinator's checkout and branch in place after `braid clean`; a record pointing at a live thread's folder is kept; the research labels.

## Out of scope

- The PM's other leftovers (`braid launch --help`, `--child` accepting an unknown thread, "?." punctuation, stale comments in `src/board/demo.ts`, limits.md's Resume line).

## Completion

- [x] A shared research child is recorded with no folder or branch, with a test
- [x] `braid clean` never removes the main checkout, the caller's checkout or a live thread's folder or branch, with a regression test from the PM's reproduction
- [x] Status, the board's limits list and clean label a research child as research, with a test
- [x] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open

## Plan

- `braid launch --role research --child` records no folder or branch and doesn't ask T3 for them.
- `braid clean` ignores a research record's checkout (older records hold the parent's), and one guard (main checkout, caller's checkout, running threads' checkouts and branches, from the T3 snapshot) covers every removal it makes.
- The snapshot gives a research child the role `researcher`; status, limits, pause targets, clean and accept's message follow it.
