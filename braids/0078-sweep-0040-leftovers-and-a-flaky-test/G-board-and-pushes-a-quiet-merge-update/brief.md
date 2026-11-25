---
id: '0078/G'
title: "Board and pushes: a quiet merge update, the forwarded Done card"
status: To Do
labels: ["kind:task", "tier:M"]
dependencies: []
order: 70
---

## Goal

The board and its pushes agree with docs/board.md and stop re-alerting: a merge that only shrinks the PM's group of merges updates the push quietly, a stored Done forwarded under a programme reads as the docs say, and the docs name the handover push title the phone shows. Leftovers 2026-11-23-cbe9, 2026-11-23-cft5 and the docs half of 2026-11-23-uanu (full text in the braid brief).

Expected size: about 120 lines in 4 to 7 files.

## Start here

- `src/notify/message.ts` (lines ~135-152, the merges group push) and `src/notify/notifier.ts` (resend on a changed key).
- `src/board/model.ts`: `derive`, `heldReview`, the braid card lane for a stored Done whose PR lookup missed; `docs/board.md:27`, lane rule 1.
- `docs/board.md:421` ("What a push contains": a handover is `In Review`) and LANE_LABEL in `src/board/marks.ts`.

## Change

- A merges-group push whose set only shrank goes out quiet (ntfy priority low or min, no sound), and still replaces the earlier one; a grown set alerts as today. Tested.
- cft5: decide which of the card (In Progress) and lane rule 1 (To Do) is right for a stored Done whose PR lookup missed, its review with the PM or forwarded under a programme, and fix the other; tested if the code changes.
- docs/board.md names the handover push title `To Review`.

## Already decided

- Start after 0074, 0072 and 0060 have merged into main and main was merged into the braid branch: they change src/notify/notifier.ts (0074), the pushes (0072/C) and src/board/model.ts (0060).

## Out of scope

- Other push contents and lanes.

## Completion

- [ ] A shrink-only merges-group update is quiet, a grown one alerts, tested
- [ ] The card and lane rule 1 agree for the cft5 case, tested if code changed
- [ ] docs/board.md says `To Review` for the handover push title
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
