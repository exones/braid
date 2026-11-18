---
id: '0028/C'
title: "Merge main: Coordinator button meets the snapshot"
status: In Progress
labels: ["kind:task", "tier:S"]
dependencies: []
order: 30
---

## Goal

The 0028 braid branch takes in `main`, which now has braid 0030 (the board's Coordinator button), so the final PR into `main` can open. Merging `origin/main` conflicts in two places. Both behaviours must survive.

Expected size: about 60 lines in 4 files, tests included.

## Start here

- `src/commands/board.ts`, `openAction`: on the braid branch it takes the thread link from the snapshot (0028/A) and reads T3 only when the snapshot has none; on `main` (0030) it accepts `{ id, thread: "coordinator" }`, refuses a strand or another `thread` value, and picks `card.coordinator?.link`.
- `docs/decisions.md`: 0030 took D63 for the Coordinator button; 0028's decision about the snapshot and cheaper reads is also D63 on the braid branch, with its line in the decision log at the end.
- 0028/A's and 0028/B's `report.md`.

## Change

- In this strand's branch, merge `origin/main` (a merge commit; no rebase).
- `openAction`: 0030's `thread: "coordinator"` option and refusals, with the link taken from the snapshot as 0028/A does (fresh T3 only when the snapshot has no such link).
- `docs/decisions.md`: keep 0030's D63; renumber 0028's to D64, in the table and in the decision log, and wherever docs refer to it (`rg "D63"`).
- `docs/board.md`: both the Coordinator button text and the snapshot text read right together.

## Already decided

- Nothing else from either side changes.

## Completion

- [x] A test shows `{ id, thread: "coordinator" }` opens the coordinator link from the snapshot without calling `t3`, and the 0030 refusals still hold
- [x] `rg "D63"` and `rg "D64"` each name only their own decision
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open
