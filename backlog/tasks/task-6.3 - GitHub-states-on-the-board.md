---
id: TASK-6.3
title: GitHub states on the board
status: To Do
assignee: []
created_date: '2026-11-13T22:01:00Z'
labels:
  - kind:story
  - tier:M
  - ui
milestone: m-3
dependencies:
  - TASK-6.2
parent_task_id: TASK-6
ordinal: 30
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Goal: the board shows what GitHub knows: a strand's PR in review, merged, or with failing checks.

Expected size: about 300 to 500 lines with tests.

Start here (read in this order):
- `backlog/docs/doc-3 - TASK-2.2-report-the-boards-path.md`: derived states and their cost.

Change:
- One `gh pr list` call per refresh (head branch, state, checks); merged PRs cached.
- Open PR from a strand's branch → In Review; merged → Done; failing checks with no agent working → Waiting, reason "checks failed" (until TASK-6.4 knows about agents, treat failing checks as Waiting); an `ask:<key>` label on the strand → Waiting with that key.
- The card links to its PR. Without `gh` or offline, the board says so and falls back to stored states.

Already decided (don't re-investigate): the parent TASK-6 and doc-5 (`backlog/docs/doc-5 - New-braid-implementation-plan-draft.md`). Reuse the reader in `src/braids/` (`loadBraids`, `parseBrief`). Node.js 26, strict TypeScript, ESM; Windows and Ubuntu.

Out of scope: T3 (TASK-6.4).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 An open, merged and failing PR each put the strand in the right lane, covered by tests with gh output stubbed
- [ ] #2 An ask:<key> label shows Waiting with its key
- [ ] #3 Without gh the board still works and says why states are missing
- [ ] #4 npm run verify passes; CI green on Windows and Ubuntu
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 The gate command from BRAID.md passes
- [ ] #2 Final summary written: what changed, why, validation, anything open
<!-- DOD:END -->
