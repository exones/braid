---
id: '0075/F'
title: "Limits count a model only against the windows that bill it"
status: To Do
labels: ["kind:task", "tier:S"]
dependencies: []
order: 27
---

## Goal

`braid limits` and the board count a model only against the usage windows that bill it. Today every window of a provider counts for every model on it. The cursor reviewer, grok-4.6, is billed under "Cursor Models" (auto), but it is stopped by "Other Models" (apiPercentUsed) at 100%, which blocks every review on cursor until 2026-12-03. The user: "Please edit somewhere close in the program because it will constantly stop reviews. It's quite urgent" (inbox 2026-11-24-83cd, 2026-11-24-99xh). This is a hotfix into `main` on its own PR, ahead of the rest of 0075.

Expected size: about 60 lines in 2 to 4 files, half of them tests.

## Start here

- `src/braids/limits.ts`, about lines 180-300: the windows a provider reports, their thresholds, the verdict (`ok`, `pause`, `unknown`) and the pause window.
- `src/commands/limits.ts`: the `braid limits` output. `src/board/limits.ts` and `src/board/limits-view.ts`: the board's use of the same verdict, and its pauses.
- Today's real reading, from `braid limits --role reviewer --tier M` (cursor, roles reviewer, models grok-4.6):
  - Other Models (apiPercentUsed): 100% of 97%, OVER.
  - Cursor Models (autoPercentUsed): 61.7% of 97%.
  - Overall (totalPercentUsed): 65.2% of 97%.
  - verdict: pause.

  The right verdict is ok for grok-4.6.

## Change

- Make the window-to-model mapping per model, wherever cursor's windows are read and judged. For cursor, the models it bills under "Cursor Models" (auto), grok-4.6 among them, are judged on that window and "Overall". "Other Models" (apiPercentUsed) judges only the models billed there. Other providers' windows keep applying to all their models, unless the same per-model rule is simpler for them.
- Keep it small. Add no new config unless a model list is unavoidable. Say in report.md how a new model gets mapped.
- Tests: today's real reading gives ok for grok-4.6. "Overall" over its threshold still pauses grok-4.6. A model billed under "Other Models" still pauses on that window. A provider without per-model windows is unchanged.
- Docs: where limits are described (`docs/board.md`, `docs/cli.md` or wherever `braid limits` is explained).

## Already decided

- Decided by the PM: this hotfix goes into `main` on its own PR, ahead of 0075's final PR, "because the wrong mapping stops every review on cursor until 3 Dec, instead of waiting for 0074". Its branch is cut from `main`, and its PR goes into `main`. The braid branch merges `main` afterwards.
- Thresholds and the pause and resume flow stay as they are. Only which windows apply to which model changes.

## Out of scope

- The board's pause and resume flow (0074). Anything else of 0075.

## Completion

- [ ] `braid limits` and the board judge a model only on the windows that bill it: today's real cursor reading gives ok for grok-4.6 (test)
- [ ] "Overall" still pauses grok-4.6, a model billed under "Other Models" still pauses on it, and a provider without per-model windows is unchanged (tests)
- [ ] report.md says how a new model gets mapped
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
