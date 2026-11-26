---
id: '0074/H'
title: "Fixes from the live check: Resume on a failed pause, Done braids leave no pause"
status: To Do
labels: ["kind:task", "tier:S"]
dependencies: []
order: 80
---

## Goal

Two fixes the PM's live check of the final PR #339 (at 4d92a1b) found before the user's merge. Evidence and screenshots: `C:\Users\exon\.braid\artifacts\agento\0074\pm-check\` (05 shows the failed-pause card).

Expected size: about 120 lines in 5 files.

## Start here

- `web/src/App.tsx` around line 906: the ▶ Resume now button renders only for In Progress and To Do cards.
- `src/board/resume.ts` (the one resume path) and `src/board/steerer.ts` (the resume step and early resume); `src/braids/pauses.ts` (`clearPause`).
- docs/board.md: the Resume now section and its tooltip list.

## Change

- A paused braid whose card sits in Needs You (a failed or partial pause keeps its record) shows the same ▶, with the same tooltip and confirm dialog, as in To Do and In Progress. The buttons stay icon-only, and thread access doesn't change (the user's rules).
- A board pause record of a braid that is Done (as the board reads it, a merged PR included) is cleared at the next refresh, with no resume sends. It never appears in a PM's resume message.
- Tests: the Needs You card of a failed pause shows ▶; a braid that turns Done during a pause loses its record with no send and is left out of the PM's resume ask.
- docs/board.md: the "Ask the coordinator to resume" tooltip joins the tooltip list.

## Already decided

- Found by the PM's live check of #339; both go into the final PR before the user's merge.

## Out of scope

- Anything else in the pause or resume.

## Completion

- [ ] A paused braid in Needs You shows ▶ Resume now, with a test
- [ ] A Done braid's board pause record is cleared without sends and is never in a PM's resume ask, with a test
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
