---
id: '0071/E'
title: "Docs: The board wakes, reminds and nudges"
status: To Do
labels: ["kind:task", "tier:S"]
dependencies: ['0071/A', '0071/B', '0071/C', '0071/D']
order: 50
---

## Goal

The project's docs describe the board's wake, reminder, estimate and nudge as one whole, after everything 0071 changed.

Expected size: about 150 lines in 6 files.

## Start here

- The braid's brief and log (`braid view 0071`), and the reports of 0071/A to D: everything the braid changed, from its first strand.
- `BRAID.md` `docs`: the public and internal docs to check.
- `docs/decisions.md`: 0064's steering decision and 0070's D96 to D99, for the dated decision this braid adds.

## Change

- Bring the docs from `docs` up to date as a whole: `README.md`, `docs/getting-started.md`, `docs/cli.md` (`braid eta`, `--done-when` conditions checked), `docs/board.md` (wake, reminder, estimate, nudge, escalation, held or paused, without a running board), `docs/braids-format.md` (the record's events), `docs/roadmap.md` status, the CLI's help text.
- `docs/decisions.md`: a dated decision for the board acting without a click (waking, reminding, nudging), next to 0064's steering, with why (passive waits can be forgotten; a missed wake must not stall a braid), and the rf9z decision (a wait replaces only a wait).
- List in `report.md` each doc checked, as updated or unchanged.

## Already decided

- Everything in the braid's "Already decided".

## Out of scope

- Skills (0071/D). Product code.

## Completion

- [ ] Every doc in BRAID.md `docs` checked against what 0071 changed, and report.md lists each as updated or unchanged
- [ ] `docs/decisions.md` has the dated decision for the board acting without a click and the rf9z decision
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
