---
id: TASK-6.4
title: T3 threads and live refresh
status: To Do
assignee: []
created_date: '2026-11-13T22:01:00Z'
updated_date: '2026-11-14T09:20:00Z'
labels:
  - kind:story
  - tier:M
  - ui
milestone: m-3
dependencies:
  - TASK-6.3
parent_task_id: TASK-6
ordinal: 40
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Goal: the board shows what the agents are doing: running, waiting with a question, or stopped; and it stays current by itself.

Expected size: about 500 to 800 lines with tests and sample data.

Start here (read in this order):
- `backlog/docs/doc-3 - TASK-2.2-report-the-boards-path.md`: the `t3` CLI, `list` vs `show` fields, how to join a thread to a strand, refresh cost.

Change:
- `t3 thread list --json` and `show --json`; join a thread to a strand by its linked PR, then by its worktree path matched to `git worktree list`; cache the join.
- Running thread → In Progress; a pending question → Waiting, reason "question"; an interrupted or cancelled thread with no PR → Waiting, "agent stopped"; failing checks while an agent is running stay In Progress. When T3 isn't running, the board says so.
- Refresh every 30 s while the page is open, at once when a file under `braids/` changes, and a Refresh button; push updates to the page.
- `braid board --demo`: serves built-in sample braids and strands, with faked GitHub and T3 results, so every lane and every Waiting reason (question, agent stopped, checks failed, ask:<key>) shows; it reads no repo, no `gh` and no `t3`, and never writes. Keep the sample data in one module the tests can reuse.
- `docs/design/board-screenshots/`: retake the screenshots from `--demo` so they show In Review, every Waiting reason, a running agent, the T3-down note and the Refresh button.

Already decided (don't re-investigate): the parent TASK-6 and doc-5 (`backlog/docs/doc-5 - New-braid-implementation-plan-draft.md`). Reuse the reader in `src/braids/` (`loadBraids`, `parseBrief`). Node.js 26, strict TypeScript, ESM; Windows and Ubuntu.

UI: the Refresh button and the T3-down note follow the existing header style; anything else visible beyond the approved mockups, stop and ask the coordinator first.

Out of scope: starting or messaging threads (story 6).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Running, question and stopped threads put the strand in the right lane with its reason, covered by tests with t3 output stubbed
- [ ] #2 The page updates by itself every 30 s and on a file change, and has a Refresh button
- [ ] #3 Without T3 the board still works and says so
- [ ] #4 npm run verify passes; CI green on Windows and Ubuntu
- [ ] #5 braid board --demo shows every lane and every Waiting reason without touching the repo, gh or t3; the screenshots are retaken from it
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 The gate command from BRAID.md passes
- [ ] #2 Final summary written: what changed, why, validation, anything open
<!-- DOD:END -->
