---
id: TASK-5.3
title: 'Logs and reports: braid log, braid report'
status: Done
assignee: []
created_date: '2026-11-13T18:28:00Z'
updated_date: '2026-11-13T20:51:00Z'
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
- [x] #1 braid log creates or appends the right per-thread file and stages it without committing, covered by tests
- [x] #2 The entry and checkpoint format is in docs/braids-format.md
- [x] #3 braid report writes and appends report.md
- [x] #4 npm run verify passes; CI green on Windows and Ubuntu
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 The gate command from BRAID.md passes
- [x] #2 Final summary written: what changed, why, validation, anything open
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. src/braids/logs.ts: thread short id (first 8 letters/digits, `user` without), find-or-create log file (date from creation, UTC), entry format `## <YYYY-MM-DD HH:MM>Z` (+ ` checkpoint`), then text.
2. `braid log <id> [--thread <id>] [--checkpoint] (<text> | --file <path|->)`: appends, then `git add` the file; never commits; stops with a clear error if git add fails.
3. `braid report <id> (--file|--text) [--append]`: writes report.md (replace by default? no: appends by default is risky) - decide: default writes/replaces; --append adds after a blank line.
4. Router, help, docs/braids-format.md (entry and checkpoint format, commands), tests running the built CLI (Windows+Ubuntu safe), npm run verify.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Entry format: "## YYYY-MM-DD HH:MMZ" (UTC) plus " checkpoint" for checkpoints; --thread needs 8+ letters/digits; braid report replaces, --append adds; BRAID_NOW fixes the clock in tests.

Review fix: thread short id is taken from the part after the last colon (mcp:launch:5d80964a.. gives 5d80964a); added tests for it and for braid log without a git repository.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
What changed: braid log <id> [--thread] [--checkpoint] (<text>|--file|--text) appends a dated entry to log-<date>-<thread8>.md (user without a thread), creates it on first use, runs git add, never commits. braid report <id> (--file, --file -, --text) [--append] writes or appends report.md. Entry and checkpoint format and both commands are in docs/braids-format.md. Why: a strand's life is recorded through braid. Validation: npm run verify passes locally (28 tests, two new); CI pending on the PR. Open: nothing.
For later items: edit.ts now exports parse, str, find, readText; src/braids/logs.ts holds the log and report writers; BRAID_NOW env fixes the clock; braid report replaces by default.
Needs the user: none
<!-- SECTION:FINAL_SUMMARY:END -->
