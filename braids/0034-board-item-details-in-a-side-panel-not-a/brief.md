---
id: '0034'
title: "Board: item details in a side panel, not a page"
status: In Progress
labels: ["kind:story", "tier:M", "ui"]
dependencies: []
related: ['0033']
delivery: epic
---

## Goal

Clicking a card, a strand row or a Done row on `braid board` opens the item's details over the board, as a side panel or a pop-up, instead of replacing the board with the item page. The board stays where it was (scroll, open lanes, Done expanded); closing the details returns to it as it was. The URL may still change (`#/0003`, `#/0003/A?tab=report`) so Back, reload and a shared link work, but nothing navigates away from the board.

The user picks the shape from mockups first (converge loop), then the worker builds it.

Expected size: about 200 lines in 4 files, mockups and tests included.

## Start here

- `web/src/App.tsx`: the hash router (`parseHash`, `go`, `useRoute`), `App` (board, inbox page or `ItemPage`), `ItemPage` with `Contents` (the braid's strand list, "← Board") and `Detail` (header, actions, request banner, fields, Brief/Report/Logs tabs). `Card` and `DoneLane` call `go(id)`.
- `web/src/api.ts`: `useItem`; the session token is taken from `#token=` in the hash and removed, so the router and the token share `location.hash`.
- `docs/board.md`, "The item page", and the phone layout section; `docs/design/board-mockups/` for earlier mockups made on the demo data (`braid board --demo`, `src/board/demo.ts`).
- `test/board.test.ts` and the other `test/board-*.test.ts` for what the page is tested with today.

## Change

- **Mockups first** (stop for the user's verdict): on the demo data, at least two shapes, each on desktop and phone width, in light: (a) a side panel sliding in from the right over the board, the board still visible and scrollable beside it; (b) a centred pop-up (modal dialog). Each shows a braid with strands (how to move between the braid brief and its strands inside the details), a strand with a request banner, and the actions (Open thread, Coordinator, Start, Merge) in place. Put them in the item folder (`mockups/`, an HTML file and PNGs) and say which you recommend and why.
- After approval: build the chosen shape in `web/src/App.tsx`. Opening an item keeps the board mounted underneath; the hash keeps today's form, so a direct `#/0003/A?tab=logs` opens the board with those details open. Close by a close button, Esc, a click outside (if the shape has an outside) and browser Back; each restores the board without a reload or a scroll jump. Moving between a braid and its strands, and between tabs, stays inside the details. The details keep refreshing with the board (`tick`).
- Phone width (below `md`): the details take the whole screen, with a clear close; Back closes them.
- `docs/board.md`: rewrite "The item page" for the new shape, with a new screenshot in `docs/design/board-screenshots/`.
- Tests for the route handling that can be tested without a browser (for example, parsing `#/0003/A?tab=report` while the board stays the base view).

## Already decided

- The hash routes stay (`#/<id>`, `?tab=`), and `#token=` handling in `web/src/api.ts` keeps working: the token is still moved out of the hash before the router reads it.
- Only the item details change shape. The Inbox page (`#/inbox`) stays a page.
- Answering a request still happens in the coordinator's thread; the details get no Answer or Approve button.
- Use the existing Radix UI (`radix-ui`, already used for `Dialog`, `Tabs`, `Tooltip`) for the panel or dialog; no new UI library.
- Related to 0033 (Board: say why an action is forbidden, on `braid/0033-board-say-why-an-action-is-forbidden`): both touch the board's actions; 0033 changes the server's 403 texts and maybe `web/src/api.ts`, this story the layout in `web/src/App.tsx`. Whichever merges second merges `main` first.

## Out of scope

- A dark theme, new actions, or changes to the board data or the server (`src/commands/board.ts`).
- Changing what the details contain (fields, tabs, banner text), beyond what the new shape needs.

## Completion

- [ ] Mockups of both shapes (desktop and phone) in the item folder, and the user's verdict in the item's log
- [ ] Clicking a card, strand row or Done row opens the details over the board; the board's scroll and open lanes are unchanged after closing (demo screenshots in the report: board, details open, closed again)
- [ ] The hash still names the item and tab; a direct `#/<id>?tab=…` opens the board with the details open; Back and Esc close them
- [ ] Phone width: the details fill the screen and close cleanly (screenshot)
- [ ] `docs/board.md` describes the new shape, with a screenshot
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
