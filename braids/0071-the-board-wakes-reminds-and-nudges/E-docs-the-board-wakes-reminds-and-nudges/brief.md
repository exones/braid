---
id: '0071/E'
title: "Docs: The board wakes, reminds and nudges"
status: In Progress
labels: ["kind:task", "tier:S"]
dependencies: ['0071/A', '0071/B', '0071/C', '0071/D']
order: 50
---

## Goal

The project's docs describe the board's wake, reminder, estimate and nudge as one whole, after everything 0071 changed.

Expected size: about 190 lines in 8 files.

## Start here

- The braid's brief and log (`braid view 0071`), and the reports of 0071/A to D: everything the braid changed, from its first strand.
- `BRAID.md` `docs`: the public and internal docs to check.
- `docs/decisions.md`: 0064's steering decision and 0070's D96 to D99, for the dated decision this braid adds.

## Change

- Bring the docs from `docs` up to date as a whole: `README.md`, `docs/getting-started.md`, `docs/cli.md` (`braid eta`, `--done-when` conditions checked), `docs/board.md` (wake, reminder, estimate, nudge, escalation, held or paused, without a running board), `docs/braids-format.md` (the record's events), `docs/roadmap.md` status, the CLI's help text.
- `docs/decisions.md`: a dated decision for the board acting without a click (waking, reminding, nudging), next to 0064's steering, with why (passive waits can be forgotten; a missed wake must not stall a braid), and the rf9z decision (a wait replaces only a wait).
- List in `report.md` each doc checked, as updated or unchanged.
- Leftover 2026-11-23-ozjp (from 0071/C), the one code change here: `braid review pm/<slug> --thread <id>` records a PM's checker in `.braid/reviews.json` (src/braids/reviews.ts), and those records are never dropped, so each finished checker costs one `t3 thread show` per board refresh. A new record for a `pm/<slug>` item replaces the older one for that item, and the board (src/board/t3.ts) drops a `pm/` record once its thread is no longer running. A test covers both.

## Already decided

- Everything in the braid's "Already decided".

## Out of scope

- Skills (0071/D). Product code other than ozjp.

## Completion

- [x] Every doc in BRAID.md `docs` checked against what 0071 changed, and report.md lists each as updated or unchanged
- [x] A `pm/<slug>` review record is replaced by the next one for that item and dropped once its thread stops running; a test covers it
- [x] `docs/decisions.md` has the dated decision for the board acting without a click and the rf9z decision
- [x] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open

## Plan

Code first (ozjp: a `pm/<slug>` record replaces the older one; the board drops it once T3 says its thread isn't running), then read the docs as a whole and fix what is stale: README, getting-started, roadmap, board (the exceptions line), cli and braids-format (the checker record), decisions (D100 the board acting without a click, D101 a wait replaces only a wait, D45 and D89 notes).
