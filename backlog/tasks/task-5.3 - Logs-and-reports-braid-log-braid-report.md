---
id: TASK-5.3
title: 'Logs and reports: braid log, braid report'
status: To Do
assignee: []
created_date: '2026-11-13T18:28:00Z'
labels:
  - kind:story
  - tier:M
milestone: m-2
dependencies:
  - TASK-5.2
parent_task_id: TASK-5
ordinal: 30
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Goal: a strand's whole life can be recorded through braid: per-thread logs that also serve as checkpoints, and the report.

Expected size: about 250 to 450 lines with tests, in 3 to 6 files.

Start here (read in this order):
- doc-5 ""Decided so far"": logs and decision 4.
- `docs/braids-format.md` from TASK-5.1.

Change:
- `braid log <id> --thread <id> <text>`: appends a dated entry to `log-<creation date>-<short thread id>.md` (8 characters; `user` without a thread), creating it on first use, and stages it with `git add`; never commits. Settle the entry format and how a checkpoint entry is marked; add them to `docs/braids-format.md`.
- `braid report <id>`: write or append `report.md`; multi-line text from a file or standard input.

Already decided (don't re-investigate): doc-5 "Decided so far" (`backlog/docs/doc-5 - New-braid-implementation-plan-draft.md`) and the parent TASK-5. Node.js 26, strict TypeScript, ESM; the skeleton from TASK-4 (`src/cli.ts` router, tests that run the built CLI). Cross-platform: Windows and Ubuntu.

Out of scope: the board, the import, resuming runs (story 8).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 braid log creates or appends the right per-thread file and stages it without committing, covered by tests
- [ ] #2 The entry and checkpoint format is in docs/braids-format.md
- [ ] #3 braid report writes and appends report.md
- [ ] #4 npm run verify passes; CI green on Windows and Ubuntu
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 The gate command from BRAID.md passes
- [ ] #2 Final summary written: what changed, why, validation, anything open
<!-- DOD:END -->
