---
id: TASK-7.4
title: Switch this repository to braids
status: To Do
assignee: []
created_date: '2026-11-14T11:18:00Z'
labels:
  - kind:story
  - tier:S
  - ask:data
milestone: m-4
dependencies:
  - TASK-7.3
parent_task_id: TASK-7
ordinal: 40
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Goal: this repository's work lives in `braids/`, with its history kept in `archive/backlog/` and its future stories visible on the board as outlines.

Expected size: generated files plus about 100 to 200 lines of hand edits.

Start here (read in this order):
- The parent TASK-7 and doc-5 (story 4's decisions; stories 5 to 9; "Decided so far").
- TASK-7.1's command and its final summary.

Change:
- Run `braid import-backlog` here: TASK-1 to TASK-7 become `0001` to `0007`; doc-1 to doc-4 end up as the reports of `0002` and its strands; check the board shows them.
- Stories 5 to 9 of doc-5 become Outline braids `0008` onward (`braid new --status Outline`), each with its goal, "working at the end" and open questions from doc-5; doc-5's decisions that `docs/decisions.md` lacks become decisions there.
- `git mv backlog archive/backlog`; a short `archive/backlog/README.md` says it is frozen history; links to `backlog/` in docs, decisions, README and braid files are rewritten (the link checker passes).

Already decided (don't re-investigate): the parent TASK-7; numbers kept (TASK-N → `000N`); `backlog/` moves to `archive/backlog/`.

Out of scope: changing the content of past tasks beyond the import; the skills (TASK-7.3).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 braids/ holds 0001 to 0007 from the import and Outline braids for stories 5 to 9; braid check passes and the board shows them
- [ ] #2 backlog/ is now archive/backlog/ with a frozen-history note, and no link in the repository points to the old path
- [ ] #3 doc-5's decisions are in docs/decisions.md
- [ ] #4 npm run verify passes; CI green on Windows and Ubuntu
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 The gate command from BRAID.md passes
- [ ] #2 Final summary written: what changed, why, validation, anything open
<!-- DOD:END -->
