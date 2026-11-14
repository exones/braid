---
id: TASK-7
title: Skills on braid, with the import
status: In Progress
assignee: []
created_date: '2026-11-14T11:17:00Z'
updated_date: '2026-11-14T11:25:00Z'
labels:
  - kind:story
  - tier:L
milestone: m-4
dependencies:
  - TASK-6
ordinal: 70
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Goal: story 4 of the new braid, the end of the MVP (plan: `backlog/docs/doc-5 - New-braid-implementation-plan-draft.md`, "Decided so far" and story 4). This repository's work lives in `braids/`; the installed braid skills call `braid`, not `backlog`; one small real braid runs end to end on them; Backlog.md is no longer needed.

Strands, in order:
- TASK-7.1: `braid import-backlog`.
- TASK-7.2: the installer also installs `braid`.
- TASK-7.3: the skills on braid.
- TASK-7.4: switch this repository (import, outline braids, `archive/backlog/`).
- TASK-7.5: trial run end to end.

Already decided (don't re-investigate): doc-5 "Decided so far" and story 4's decisions (2026-11-14): other projects switch together, one version of the skills, braid only; the import is a lasting command; stories 5 to 9 become Outline braids `0008` onward, doc-5's decisions go to `docs/decisions.md`, doc-1 to doc-4 become braid `0002`'s reports; `backlog/` moves to `archive/backlog/` with links rewritten. Branches `braid/<number>-<slug>` and `braid/<number>/<letter>-<slug>`. Agents edit `brief.md` and `report.md` directly, then `braid check`.

Out of scope: the skills diet (TASK-3, after the MVP), coordinator commands (story 5), board actions (story 6), npm publishing.

Until TASK-7.4 merges, this story is tracked in Backlog.md on its epic branch and the coordinator runs on the skills installed from `main`.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 All five strands are Done on the epic branch
- [ ] #2 This repository's work is in braids/, the skills call braid, and one braid ran end to end on them
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 The gate command from BRAID.md passes
- [ ] #2 Final summary written: what changed, why, validation, anything open
<!-- DOD:END -->
