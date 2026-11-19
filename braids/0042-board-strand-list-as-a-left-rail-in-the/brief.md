---
id: '0042'
title: "Board: strand list as a left rail in the details panel"
status: To Do
labels: ["kind:story", "tier:S", "ui"]
dependencies: []
related: ['0034', '0038', '0041']
delivery: epic
---

## Goal

Since 0034 (PR #161) a braid's details open in a side panel over the board, but its strands became a row of chips across the top of the panel. The user finds that line odd and wants back the left rail the old item page had: "← Board"-style contents with the braid's title, its lane, "Braid brief" and one row per strand (lane dot, `A · Title`, marks), the current one highlighted, and the details to its right, all inside the side panel.

Expected size: about 60 lines in 3 files.

## Start here

- `web/src/App.tsx`: `Contents` (today the chip row) and `DetailsPanel` (the panel, `min(70vw, 1200px)` wide, full screen below `md`). The old rail is `Contents` before 0034: `git show 4be3fad:web/src/App.tsx`, the `Contents` and `ItemPage` functions (a 290 px column, `grid-cols-[290px_1fr]`).
- The user's screenshot of the old page, which is the target look: `braids/0042-board-strand-list-as-a-left-rail-in-the/target.png`.
- `docs/board.md`, "The item details", and its screenshots 71 and 72.

## Change

- **Show first** (stop for the user's verdict): screenshots on the demo data (`braid board --demo`) of the panel with the rail, for a braid with strands on desktop (1440 px) and on the phone (390 px), in the item folder. On the phone, propose how the rail sits (above the details as the old page did, or collapsed); say which you recommend.
- After approval: in `web/src/App.tsx`, the panel for a braid with strands, or one of its strands, is two columns: the rail (about 260-290 px, scrolls on its own) and the details. The rail shows the braid's id and title, its lane and marks, "Braid brief" and the strands, as the old page did; a click moves inside the panel as today (`go`). A braid without strands keeps one column. The panel stays as wide as now.
- `docs/board.md`: "The item details" says the strands are a rail on the left; screenshot 71 updated (and 72 if the phone changes).

## Already decided

- Only the strand navigation inside the panel changes. The panel's width, closing (Esc, ✕, click on the board, Back), history rules and hash routes stay as 0034 made them.
- No "← Board" link in the rail on desktop: the panel's ✕ closes it. The phone keeps its "← Board".
- Related to 0034 (Board: item details in a side panel, not a page, merged in PR #161): this restores the rail that 0034 replaced with chips.
- Related to 0038 (Sweep: leftovers from 0029, In Progress on `braid/0038-sweep-leftovers-from-0029`): it moves the panel's push/replace rules (`go`, `closeDetails`) into a tested helper; this story touches `Contents` and `DetailsPanel` only. Whichever merges second merges `main` first.
- Related to 0041 (Board: numbers in full with bold digits, thread buttons with role icons, To Do): it may change how ids show in the rail; whichever merges second merges `main` first and keeps both.

## Out of scope

- The panel's width or shape, the board, or what the details contain.

## Completion

- [ ] Screenshots of the rail in the panel (desktop and phone) in the item folder, and the user's verdict in the item's log
- [ ] A braid with strands, and each of its strands, opens with the rail on the left and the details on the right; a click on a rail row moves inside the panel (demo screenshot in the report)
- [ ] A braid without strands shows no rail
- [ ] `docs/board.md` "The item details" and its screenshot match
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
