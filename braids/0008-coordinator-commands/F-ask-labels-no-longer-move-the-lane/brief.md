---
id: '0008/F'
title: "ask labels no longer move the lane"
status: In Progress
labels: ["kind:story", "tier:S"]
dependencies: ['0008/A']
order: 15
---

## Goal

An `ask:<key>` label set when planning means "this will need the user's decision at review" (and keeps auto mode from merging it), not "the user is needed now". Today the board puts such a strand, and its whole braid, in Needs You before work has even started (user, 2026-11-14: 0008 sat in Needs You because 0008/C carries `ask:process`).

Expected size: about 30 to 80 lines with tests.

## Start here

- `src/board/model.ts` (`derive`, rule 2) and `src/board/marks.ts` (the flag and its hover).
- `docs/board.md` ("How an item's lane is chosen", "Icons") and D32 in `docs/decisions.md`.

## Change

- `derive`: an `ask:<key>` label no longer sets the lane; the other rules decide it (Working while an agent runs, To Review with an open PR, and so on).
- The amber flag stays on the row and card wherever the label is, with the hover "Will need your decision: <key>".
- `braid status` (0008/A) shows the label without a Needs You lane.
- `docs/board.md` and its decision entry: Needs You means a real block (a question, an agent stopped, checks failed with no agent working); the flag marks a decision expected at review.
- Update the demo data and screenshots only if a lane in them changes.

## Already decided

- No `stop:` label; how the board learns that the coordinator itself is waiting for the user is braid 0015 (Outline).

## Out of scope

- Auto mode's use of `ask:` labels (unchanged).

## Acceptance

- [x] A strand with an `ask:` label sits in the lane its other state gives, with the flag, covered by tests
- [x] docs/board.md describes the flag and Needs You as above
- [ ] CI green on Windows and Ubuntu

## Definition of done

- [x] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open

## Plan

`derive` returns the ask key as a separate `ask` field (cards, strands, item detail) instead of a Waiting reason; marks adds the flag from `ask`; `braid status` prints `ask:<key>`; docs and tests updated.
