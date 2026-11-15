---
id: '0015/B'
title: "Mockups: five lanes and what is needed"
status: In Progress
labels: ["kind:task", "tier:S", "ui"]
dependencies: []
order: 20
---

## Goal

Mockups of the board under the new status system (`../states.md`), on the demo data, for the user's approval before any build. The user's attention is the expensive resource: a card on their side of the board must say in one line what is needed.

Expected size: about 150 lines of mockup HTML and 4 to 6 screenshots; no product code.

## Start here

- `../states.md`: the five states, requests, the "broke" alarms.
- `docs/board.md` ("Changing the board", icons), `docs/design/board-mockups/` (the approved mockups and how they were made), `src/board/demo.ts`.

## Change

- `docs/design/board-mockups/`: new mockups showing
  - a To Review card with its request ("merge PR #N") and the age of the request;
  - Needs You cards for each reason: question, decision (with its stop-case key), plan approval, checks failed, stalled; each with the one-line "what is needed";
  - a braid whose strand needs the user, and a braid whose coordinator asked (no strand involved);
  - Working cards with agents running and with only CI or a review running (no extra lane).
- Embed the screenshots in report.md and stop: the user reviews the design.

## Already decided

- Lanes and names: To Do, Working, To Review, Needs You, Done. Colours and icons stay as approved unless a new reason needs an icon.
- No lane text on cards; the "what is needed" line is new and is text.

## Out of scope

- Building it (0015/D). Changing `src/`.

## Acceptance

- [x] Mockups cover every case listed under Change
- [ ] The user approved them (the coordinator records it)

## Definition of done

- [x] The gate command from BRAID.md passes
- [x] report.md written, with the screenshots embedded

## Plan

- One mockup page, `docs/design/board-mockups/needs-you.html`, built from `live-lane.html` (same CSS and icons), with hash views on demo-style data.
- New on a card: a one-line "what is needed" under the title (text, amber on Needs You, purple on To Review with the PR and the age of the request). New icons only where a reason has none: plan approval (clipboard), stalled (red clock); Working-only-CI gets a spinner.
- Views, one screenshot each: board, Needs You reasons, braid with strand vs coordinator asking and To Review, Working variants, legend with hovers, braid page with request banner.
