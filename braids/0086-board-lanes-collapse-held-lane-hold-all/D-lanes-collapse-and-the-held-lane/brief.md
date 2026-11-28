---
id: '0086/D'
title: "Lanes collapse and the Held lane"
status: To Do
labels: ["kind:story", "tier:M", "ui"]
dependencies: ['0086/A', '0086/C']
order: 40
---

## Goal

The lanes tell the truth about what works. Every lane collapses and opens like Done; a Held lane holds the braids under a deliberate hold or a limit pause, each card saying the reason, who held it, since when and what it waits for; the project row's "working" and the Working lane's count leave them out. A request forwarded to the user on a held or paused braid shows in the Questions panel marked held, with no push. As 0086/A's approved mockups (frames 1, 2, 3, 8) show.

Expected size: about 450 lines in 10 files, tests included.

## Start here

- The parent brief `braids/0086-board-lanes-collapse-held-lane-hold-all/brief.md`, "Already decided": the user's words on the counts ("it seems that I have like 13 braids working which is not true") and on forwarded requests ("2. E").
- `braids/0086-board-lanes-collapse-held-lane-hold-all/A-mockups-lanes-holds-programmes-and-what/mockups.html` and its `report.md` and log: the approved design and the user's verdicts, among them where a held braid with a PR or a question sits. Build what they show.
- 0086/C's `report.md`: the hold record's fields and the one function that reads holds.
- `src/board/model.ts`: `LANES`, `laneOfStatus`, the lane of an item (`ownLane`'s block around line 495), `laneOfLanes` and `URGENCY`, the pause mark on a card, the project counts.
- `web/src/App.tsx`: `Board` (lanes, phone tabs, `SHORT_LABEL`, `LANE_LABEL`, `LANE_DOT`), `DoneLane` (the collapsed strip), `Card` and `PauseLine`, `LaneCounts`, `useRemembered` (how panels remember open or closed).
- `src/board/pm.ts` `routeOf` (a paused braid keeps a forwarded request with the PM), the push code that sends a forwarded request (`src/board/done.ts`, `src/board/marks.ts`, `src/notify/`), `web/src/Questions.tsx`.
- `docs/board.md`: the lanes, the pause mark ("the braid stays where its lanes put it (usually Working)").

## Change

- A `Held` lane in `LANES`, placed as the approved mockups place it, for a braid under a hold or a limit pause (and its strands not Done); the lane's own count. Held and paused braids leave In Progress and its counts, in the project row and on the phone tabs.
- Every lane collapses and opens from its header as Done does today; the choice is remembered per lane in the page (as the panels are); which lanes start open is as the mockups' verdict says.
- The Held card: the reason (the hold's words, or the provider window for a limit pause), who held it, since when, what it waits for.
- `routeOf`: a request forwarded to the user on a held or paused braid goes to the user marked held; the Questions panel shows the mark; no push is sent for it while the braid is held or paused, and the push the forward would have sent goes out at the resume as today. A request to the PM that isn't forwarded stays with the PM, as today.
- `src/board/demo.ts`: demo braids in Held.
- Tests: the lane of a held braid, a paused braid, a held braid with a PR to merge or a question (as the mockups decide); the counts leave held and paused out; a forwarded request on a held braid is the user's, marked held, and sends no push until the resume.

## Already decided

- Held covers deliberate holds and limit pauses alike: both are "not working" for the counts (the user, 2026-11-26).
- Holds are read through 0086/C's one function, never from the plan file directly.
- 0077 (The board stays fast under load) changes the board's read path and the programme count; if it has merged into `main` when this strand starts, the coordinator merges `main` into the braid branch first.

## Out of scope

- The Hold and Go buttons (0086/E), Hold all (0086/F), the programmes panel's groups (0086/G).

## Completion

- [ ] A Held lane shows held and paused braids with the reason, who, since and what they wait for; Working and the project row count only braids that work
- [ ] Every lane collapses and opens like Done, remembered per lane
- [ ] A request forwarded to the user on a held or paused braid shows in the Questions panel marked held, with no push until the resume, with a test
- [ ] The board matches the approved mockups' frames 1, 2, 3 and 8 (screens in report.md)
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
