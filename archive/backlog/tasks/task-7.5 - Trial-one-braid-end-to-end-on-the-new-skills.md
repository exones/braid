---
id: TASK-7.5
title: 'Trial: one braid end to end on the new skills'
status: To Do
assignee: []
created_date: '2026-11-14T11:19:00Z'
labels:
  - kind:story
  - tier:S
milestone: m-4
dependencies:
  - TASK-7.4
parent_task_id: TASK-7
ordinal: 50
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Goal: prove the MVP: with the skills and `braid` installed from the epic branch, one small real braid runs from plan to merge without Backlog.md.

Expected size: the trial braid's own change plus fixes to the skills or CLI it shows are needed.

Start here (read in this order):
- The parent TASK-7 (from TASK-7.4 on, braid `0007`) and the new skills.

Change:
- The coordinator installs the skills and `braid` from the epic branch (installer with `-Ref`), plans one small real braid with the user (a one-strand item from the outlines or a small fix), and runs it end to end on the new skills: brief, worker, review, merge into the epic branch, log and report.
- Every gap it shows is fixed in this strand's PR, or proposed as follow-up if large.
- The report lists what worked, what broke and what was fixed.

Already decided (don't re-investigate): the parent TASK-7; the trial braid is chosen with the user when this strand starts.

Out of scope: new features beyond what the trial needs.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 One real braid ran from plan to merge on the new skills, with its brief, logs and report in braids/
- [ ] #2 Gaps found are fixed or proposed as follow-ups in the report
- [ ] #3 npm run verify passes; CI green on Windows and Ubuntu
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 The gate command from BRAID.md passes
- [ ] #2 Final summary written: what changed, why, validation, anything open
<!-- DOD:END -->
