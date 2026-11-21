---
id: '0055'
title: "Done lane collapses to a narrow strip"
status: In Progress
labels: ["kind:story", "tier:S", "ui"]
dependencies: []
related: ['0053']
delivery: epic
---

## Goal

On the desktop board the Done lane is collapsed only inside: its column keeps a full fifth of the width while it shows just the count and "Show done". Collapsed, the Done lane becomes a narrow strip at the right edge (its dot, "Done" and the count), and the four other lanes share the freed width; opened, it is a full column as today. For the user, who rarely opens Done and wants the room for the lanes that need them.

Expected size: about 40 to 80 lines in 2 to 3 files, plus mockups and retaken screenshots.

## Start here

- `web/src/App.tsx`: `DoneLane` (around line 895) holds the open state today; `Board` (around 931) lays the lanes out with `grid grid-cols-5` from `md` up, and one lane per tab on the phone.
- `docs/board.md`: the "Done is collapsed" paragraph (around line 19) and the phone paragraph (around line 234).
- `docs/design/board-screenshots/`: `61-board-lane-order.png` and `62-done-open.png` show the Done lane today; `braids/0012-board-on-the-phone/B-*/report.md` says how they were taken.

## Change

- First, mockups, then stop: the desktop board with Done collapsed (the strip) and opened, on `braid board --demo` data, at a wide and a narrow desktop width (about 1440 and 900 px). Report them and stop; the user reviews the design before the build.
- `web/src/App.tsx`: the open state moves up to `Board`; collapsed, the Done column is a narrow strip (the whole strip is the button that opens it, with `aria-expanded`) and the grid gives the other four lanes the rest; opened, five columns as today, with Hide done.
- `docs/board.md`: the Done paragraph says the collapsed lane is a strip.
- Retake the desktop screenshots that show the Done lane.

## Already decided

- Phone layout unchanged: the tab bar shows one lane at a time, and the Done tab works as today.
- Opened, the Done lane is unchanged: the 10 newest rows, newest first, Show more.
- The open state is not remembered across page loads, as today.
- Related to 0053 (Sweep: board leftovers from 0049 and 0052, on `braid/0053-sweep-board-leftovers-from-0049-and-0052`): both retake board screenshots in `docs/design/board-screenshots/`; 0053/A adds a demo project and changes no lane layout. Whichever merges second retakes the screenshots it shares with the other.

## Out of scope

- Other lanes' widths or contents, the phone layout, the board's data (`src/board/`).

## Completion

- [x] Mockups of the strip (collapsed and opened, two desktop widths) reported, and the build waited for the user's review of them
- [x] From `md` up, the collapsed Done lane is a narrow strip with its dot, name and count, and the other four lanes take the freed width
- [x] Clicking the strip opens Done as a full column with today's rows and Show more; Hide done collapses it to the strip again
- [x] The phone layout and Done tab behave as before
- [x] Open Done rows at narrow widths: the title wraps and the day goes under it, no overlap (added by the user with the mockup approval)
- [x] `docs/board.md` and the desktop screenshots showing the Done lane are updated
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open

## Plan

1. Mockups (done, on `braid board --demo` data, from a throwaway prototype of the real page): Done collapsed as a 3rem strip and opened, at 1440 and 900 px. Stop for the user's review.
2. After approval: `Board` owns the Done open state; grid is `repeat(4, 1fr) 3rem` collapsed, 5 columns opened; `DoneLane` takes `open`/`setOpen`; the strip is one `aria-expanded` button (dot, count, vertical "Done"); phone unchanged.
3. `docs/board.md` Done paragraph, retake 61 and 62 (and any other desktop shot with Done), report.md, gate, PR.
