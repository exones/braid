---
id: TASK-5
title: 'Braids folder: the braids/ format and its commands'
status: To Do
assignee: []
created_date: '2026-11-13T18:28:00Z'
updated_date: '2026-11-13T18:36:00Z'
labels:
  - kind:story
  - tier:L
milestone: m-2
dependencies: []
ordinal: 50
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Goal: story 2 of the new braid (plan: `backlog/docs/doc-5 - New-braid-implementation-plan-draft.md`, "Decided so far" and "Round 3"). braid tracks braids and strands in `braids/` from the command line: read, create, edit, log and report. Runs after TASK-4 (fresh start) is merged into main; merge main into the epic branch before strand A starts.

Strands, in order:
- TASK-5.1: read braids (the format, `braid list`, `braid view`).
- TASK-5.2: create and edit (`braid new`, `braid strand new`, `braid edit`, `braid brief`).
- TASK-5.3: logs and reports (`braid log`, `braid report`).

Already decided (don't re-investigate): everything under "Decided so far" in doc-5: the `braids/` layout, strands with fixed letters, `brief.md` / `report.md` / per-thread `log-<date>-<thread>.md` / `temp/`, `braid log` stages but never commits, delivery mode `epic | main`, the Outline status, no Backlog.md compatibility, no MCP or JSON output.

Out of scope: the board (story 3), the import of `backlog/` and the skills switch (story 4).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 All three strands are Done on the epic branch
- [ ] #2 A braid with strands can be created, edited, logged, reported, listed and viewed entirely from the CLI
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 The gate command from BRAID.md passes
- [ ] #2 Final summary written: what changed, why, validation, anything open
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-11-13 Back to To Do at the user's request: nothing in TASK-5 starts until TASK-4 (fresh start) is merged; set In Progress when TASK-5.1 starts.
<!-- SECTION:NOTES:END -->
