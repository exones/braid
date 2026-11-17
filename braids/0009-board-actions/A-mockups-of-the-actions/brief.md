---
id: '0009/A'
title: "Mockups of the actions"
status: In Progress
labels: ["kind:task", "tier:S", "ui"]
dependencies: []
order: 10
---

## Goal

Static mockups of the three board actions on realistic demo data, for the user to review before anything is built (converge loop, decision D40).

Expected size: about 300 lines of HTML and CSS in `docs/design/board-mockups/`.

## Start here

- `docs/design/board-mockups/` (the existing `board.html`, `live-lane.html`, `needs-you.html`): the style to follow.
- `web/src/App.tsx`: `Card`, `Actions`, `ActionIcon`, `StartIcon`, `MergeIcon` (the disabled buttons today), the strand rows.
- `src/board/demo.ts`: the demo braids, PRs and threads to draw from.
- The goal brief `braids/0009-board-actions/brief.md`, "Already decided".

## Change

- One or more mockup pages in `docs/design/board-mockups/` showing:
  - **Start** on a To Do braid card, its confirmation (what will launch: a coordinator thread, the model T3 will use, the base branch), the running state, and the warning when T3's model differs from `BRAID.md`.
  - **Merge** on a card in To Review: the confirmation dialog with the PR, head commit, target branch and checks; the merging and merged states; a refusal (head moved, checks not green) with its reason.
  - **Open thread**: a small button on cards and strand rows that have a thread; none where there is no thread.
  - Disabled actions with the reason in a tooltip (for example, Start without T3, Merge with failing checks).
- Light and dark, as the board has both.
- Then stop and report with screenshots; the coordinator shows them to the user.

## Out of scope

- Any server or React code.

## Plan

One self-contained page `actions.html` (hash views, `#<view>&light|dark`) with nine views on demo data: Start, its confirmation, the model warning, running/failed, Merge confirmation, merging/merged, refusals, Open thread, disabled tooltips. PNGs of every view in both themes next to it.

## Completion

- [x] Mockups for Start, Merge and Open thread, with their confirmations, states and disabled reasons, light and dark
- [x] Screenshots in the report
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open
