---
id: '0078/N'
title: "A strand parked behind a sibling never reads stalled"
status: To Do
labels: ["kind:task", "tier:S"]
dependencies: ['0078/M']
order: 47
---

## Goal

The board never shows "Stalled" for a strand that is only parked behind its coordinator's running work or behind a sibling it depends on. Idea 2026-11-28-n6qp, added to 0078 by the user's "A" (2026-11-28) through the PM. Seen on everix 0035/A: "Stalled: nobody is working and nothing was asked, for 8 h" while its coordinator was waiting on its 0035/D worker, a running subagent listed in the coordinator's pendingBackgroundTasks. 0078/L shows the same while 0078/M runs.

Expected size: about 40 to 80 lines in 2 to 3 files.

## Start here

- `src/board/model.ts`, `derive()` (around line 535): `coordinating` holds the stall off only for braids without strands.
- `src/board/t3.ts`, `working()`: a thread counts as working when it is running or waiting, has pendingBackgroundTasks, or is blockedOnThreadWait.
- The stall tests in `test/board*.test.ts`.

## Change

- A strand doesn't read stalled when its braid's coordinator is working (`working()`), or when one of its dependency strands isn't Done. In the second case it reads as waiting on that strand, with the strand named (for example "waiting on 0078/M").
- A real stall still shows when the coordinator is idle and no sibling it depends on is in progress.
- Tests for both cases, and for the real stall that must stay.

## Already decided

- The user decided the scope ("A", 2026-11-28); tier S, one worker at a time, after 0078/M merges (it branches from the braid branch with main merged in, since 0077 changed the board).
- docs/board.md's stall rule is updated to match.

## Out of scope

- Other lanes and stall rules.

## Completion

- [ ] A strand whose coordinator is working, or whose dependency strand isn't Done, doesn't read stalled; the second reads as waiting on the named strand; tested
- [ ] A strand with an idle coordinator and no dependency in progress still reads stalled, tested
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated (docs/board.md), or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
