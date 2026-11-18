---
id: '0012/A'
title: "Mockups: phone layout and the new lane order"
status: In Progress
labels: ["kind:story", "tier:S", "ui"]
dependencies: []
order: 10
---

## Goal

Mockups for the user to choose from before anything is built: the board on a phone screen, and the new lane order with Done collapsed, on the demo data. The worker stops after the mockups; the user picks a variant in the converge loop, and 0012/B builds it.

Expected size: about 400 lines in 3 to 6 files (HTML mockups and screenshots; no product code).

## Start here

- `docs/board.md`: the lanes, cards, the item page, actions; "Changing the board" (mockups first, on demo data).
- `docs/design/board-mockups/`: earlier approved mockups (`needs-you.html`, screens 21 to 28); build these the same way.
- `web/src/App.tsx`, `web/src/index.css`: the board as it is; `src/board/demo.ts`: the demo data (`braid board --demo`).

## Change

- `docs/design/board-mockups/`: one HTML mockup file (or a few) with:
  - desktop: the new lane order, and Done collapsed (closed, and opened with 10 items and Show more);
  - phone (about 390 px wide): 2 or 3 variants of switching lanes, for example a tab bar with counts, swiping between lanes, a lane picker; each with Needs You open first, a card, the item page, and the Start and Merge buttons at phone tap size (at least 44 px); Open thread not offered on the phone;
  - a short note per variant: what is good and bad about it.
- PNG screenshots of each screen next to the existing ones, numbered after the last.

## Already decided

- Lane order: Needs You, To Review, Working, To Do, Done.
- Done: collapsed by default; opened, the 10 newest, newest first, then a "Show more" button. Say in the notes which date "newest" uses (when the item became Done, or its merge).
- Open thread is not offered on the phone.

## Out of scope

- Changing `web/src` or anything the board runs; the server and Tailscale (0012/C).

## Plan

One self-contained `docs/design/board-mockups/phone-lanes.html` (hash-routed screens, demo-like data), screenshots 29 to 40 with headless Chrome. Desktop: lane order, Done closed and opened. Phone: A tabs, B swipe, C picker, 390 px.

## Completion

- [x] Mockups of the desktop lane order and of Done collapsed and opened, on demo data
- [x] 2 or 3 phone variants with notes, at about 390 px wide, tap targets at least 44 px
- [x] Screenshots of each screen in `docs/design/board-mockups/`
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, the variants, anything open; the worker stops for the user's choice
