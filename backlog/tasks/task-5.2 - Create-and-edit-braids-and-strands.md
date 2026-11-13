---
id: TASK-5.2
title: Create and edit braids and strands
status: In Progress
assignee: []
created_date: '2026-11-13T18:28:00Z'
updated_date: '2026-11-13T19:18:00Z'
labels:
  - kind:story
  - tier:L
milestone: m-2
dependencies:
  - TASK-5.1
parent_task_id: TASK-5
ordinal: 20
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Goal: braids and strands are made and changed only through braid, so agents never edit the files by hand.

Expected size: about 500 to 900 lines with tests, in 5 to 8 files.

Start here (read in this order):
- `docs/braids-format.md` and the loader from TASK-5.1.
- `.agents/skills/braid/assets/task.md`: which Backlog.md create and edit calls the skills make today; braid needs their equivalents, not all of Backlog.md's options.

Change:
- `braid new <title>`: the next free number, also checking remote branches for numbers already taken; creates the folder and `brief.md`.
- `braid strand new <braid> <title>`: the next free letter; letters never reused.
- `braid edit <id>`: status, title, labels, dependencies, order, delivery mode.
- `braid brief <id> <section>`: set a section of `brief.md`; multi-line text from a file or standard input.

Already decided (don't re-investigate): doc-5 "Decided so far" (`backlog/docs/doc-5 - New-braid-implementation-plan-draft.md`) and the parent TASK-5. Node.js 26, strict TypeScript, ESM; the skeleton from TASK-4 (`src/cli.ts` router, tests that run the built CLI). Cross-platform: Windows and Ubuntu.

Out of scope: logs and reports (TASK-5.3), the board, the import.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A braid with two strands can be created and edited entirely from the CLI, covered by tests
- [ ] #2 Numbers and letters are never reused, including numbers taken on remote branches
- [ ] #3 Multi-line text works from a file and from standard input on Windows and Ubuntu
- [ ] #4 npm run verify passes; CI green on Windows and Ubuntu
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 The gate command from BRAID.md passes
- [ ] #2 Final summary written: what changed, why, validation, anything open
<!-- DOD:END -->
