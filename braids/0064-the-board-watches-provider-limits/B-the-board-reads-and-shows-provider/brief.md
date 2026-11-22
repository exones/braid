---
id: '0064/B'
title: "The board reads and shows provider limits, and pushes"
status: To Do
labels: ["kind:story", "tier:M", "ui"]
dependencies: ['0064/A']
order: 20
---

## Goal

The running board reads every provider's usage at each refresh and shows it against its threshold. It pushes over ntfy when a provider crosses its threshold, when a braid is paused or resumed, and when a resume is overdue. It acts on nothing yet; C does that.

Expected size: about 400 lines in 10 files; A's report may change it.

## Start here

- `braids/0064-the-board-watches-provider-limits/A-spike-steering-thread-board-limits-view/report.md` and its mockups, as the user approved them.
- `src/braids/limits.ts`, `src/commands/limits.ts`: the verdicts to reuse, not reimplement.
- `src/board/` (`model.ts`, `pause.ts`, `combined.ts`), `src/notify/message.ts`, `src/notify/notifier.ts`, `web/src/`.
- `docs/board.md`, "Notifications" and "Paused".

## Change

- The board snapshot gets each provider's limits, for every project on the board, read at each refresh from T3's caches without extra `t3` calls.
- The page shows them as the approved mockups do, also in `--demo`.
- The notifier pushes the new kinds with the approved texts, with a dedup key per push like the other pushes.

## Already decided

- See the braid's brief. Reuse the code and thresholds of `braid limits`.
- Starts after 0062 merges into `main` (both change `src/board/` and `src/notify/`): merge `main` into the braid branch first.

## Out of scope

- Pausing or resuming anything (C), and skill changes (D).

## Completion

- [ ] The board data and page show each provider's usage and verdict as the approved mockups do, in a real run and in `--demo`
- [ ] Threshold crossed, paused, resumed and resume overdue are each pushed once, with the approved texts; tests cover the keys
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
