---
id: '0084/B'
title: "Mockups: several open questions on the board"
status: To Do
labels: ["kind:task", "tier:S", "ui"]
dependencies: []
order: 20
---

## Plan

1. `mockups.html`: standalone page on test data, in 0082's mockup style, with today's card, details, panel and programme markup: strand rows (Details on and off), the folded braid card, variants A and B, a handover beside questions, the details banner and Requests tab, the Questions panel, the programmes panel, phone width.
2. `report.md`: screens, variants, questions for the user. Stop for the look.
3. After approval: log the verdict, run the gate, open the PR.

## Goal

Mockups, on realistic test data, of the board when one item has several open questions, so the user approves the look before 0084/C builds it. The worker stops at the mockups for the user's look.

Expected size: about 400 lines in one HTML file.

## Start here

- `braids/0082-the-questions-panel/A-mockups-the-questions-panel/mockups.html`: the approved Questions panel design (D118); start from it and keep its style.
- `braids/0082-the-questions-panel/E-the-questions-panel-on-the-board/`: screens of the built panel.
- `docs/board.md` "The Questions panel" and the card and details sections; `web/src/App.tsx` (the card's request line, the details' Requests tab, the programmes panel).
- `src/board/model.ts` `Need`, and how a card shows the coordinator's request beside the PM's today.

## Change

- `mockups.html` in this item's folder: a standalone page (no build, no server) with these screens:
  - a strand card with three open questions of its coordinator, and one with a question of the coordinator and one of the PM, compact and with Details on;
  - the braid card that shows a strand's questions;
  - the details panel's Requests tab with three open;
  - the Questions panel with three rows from one item;
  - a programme in the programmes panel with two open `pm/<slug>` questions;
  - the card at phone width.
- At most two variants where the card's look is a real choice (for example every question listed, or the first and "+2 more"), with a recommendation.
- `report.md`: the screens, the variants and the questions for the user.

## Already decided

- Read the braid brief `braids/0084-several-open-questions-per-item/brief.md` "Already decided": it is binding.
- Each open question stays its own row in the Questions panel, answered on its own; the panel's ranking doesn't change.
- Keep within 0082's design (D118): no new panel, no new lane.
- P5 (Board lanes, Held lane, Hold all) will change the cards and lanes too; don't design lanes here.

## Out of scope

- Building anything in `web/` or `src/`.

## Completion

- [x] `mockups.html` in the item folder shows the screens listed under Change on test data, readable in light and dark and at phone width
- [x] report.md lists the screens, any variant with its recommendation, and the questions for the user
- [x] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
