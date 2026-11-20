---
id: '0044/B'
title: "A braid whose coordinator stopped reads stalled"
status: In Progress
labels: ["kind:story", "tier:M"]
dependencies: []
order: 20
---

## Goal

A coordinator that stops between strands without asking anything leaves its braid reading Working forever, because a braid with strands is never `stalled` (docs/board.md). After this strand such a braid reads Needs You `stalled` after the usual ten minutes, so the board, `braid status` and the notifications of 0044/A show it.

Expected size: about 150 lines in 5 files, most of them tests and docs.

## Start here

- `docs/board.md`: the lane rules, the broke alarms, and the paragraph on which threads count (the coordinator is never an item's agent).
- `src/board/model.ts`: `derive` (the item-level `stalled` alarm) and the braid-with-strands part of `toCard` ("a braid with strands is never stalled"), `laneOfLanes`, `coordinatorOf`.
- `src/board/t3.ts`: `coordinators` (running) and `idleCoordinators`.
- `src/board/signals.ts`: `brokeClock`, the ten-minute clock kept in `.braid/broke.json`.
- `test/lanes.test.ts` and `test/board.test.ts`: how lanes are tested with fake GitHub and T3.

## Change

- `src/board/model.ts`: a braid with strands gets the `stalled` alarm (keyed by the braid's number) when all of these hold: stored `In Progress`; no open request of its own; every strand is To Do or Done (none Working, Needs You or To Review); no final PR whose checks are pending; T3 and GitHub were read; and no coordinator thread of the braid is running. It then reads Needs You `stalled` with the text "Stalled: the coordinator stopped and nothing was asked", `who` null. Any condition failing clears the clock, as for items. A braid whose last strand merged with the final PR open stays with the existing rules (To Review or Working).
- `braid status` shows it the same way (it reads the same model).
- `docs/board.md`: the braid-level stall under the broke alarms, and the sentence saying a braid with strands is never stalled corrected; `docs/decisions.md`: amend D46 or add an entry.
- Tests: stalled after ten minutes; not before; cleared by a running coordinator, a running strand, a strand with pending checks, a request on the braid or a strand; no clock start when T3 or GitHub is down; a To Do braid never stalls.

## Already decided

- The coordinator still never counts as an item's agent; its running thread only holds back this braid-level alarm.
- Same ten minutes and the same `.braid/broke.json` clock as the existing alarms; same red clock icon.
- Related to 0044/A only through the board model: whatever reads Needs You is notified, so no notifier change is needed here.

## Out of scope

- Detecting a running but hung thread.
- A lone story or a braid being planned: their existing rules stay.
- Notification code (0044/A).

## Completion

- [x] A braid as described reads Needs You `stalled` on the board and in `braid status` after ten minutes, and not in the cases listed under Change
- [x] Tests listed under Change pass
- [x] `docs/board.md` and `docs/decisions.md` updated
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open

## Plan

In `toCard` (src/board/model.ts) a braid with strands gets the `stalled` alarm on its number when the Change conditions hold; it then becomes the braid's own need (who null, since = clock start). Tests in test/lanes.test.ts, docs in board.md and D46.
