---
id: TASK-6.3
title: GitHub states on the board
status: Done
assignee: []
created_date: '2026-11-13T22:01:00Z'
updated_date: '2026-11-13T23:54:00Z'
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
- The braid page's details list also shows which branch the item's state came from (`/api/item` already has `branch`; the user approved this one line).
- The card links to its PR. Without `gh` or offline, the board says so and falls back to stored states.

Already decided (don't re-investigate): the parent TASK-6 and doc-5 (`backlog/docs/doc-5 - New-braid-implementation-plan-draft.md`). Reuse the reader in `src/braids/` (`loadBraids`, `parseBrief`). Node.js 26, strict TypeScript, ESM; Windows and Ubuntu.

Out of scope: T3 (TASK-6.4).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 An open, merged and failing PR each put the strand in the right lane, covered by tests with gh output stubbed
- [x] #2 An ask:<key> label shows Waiting with its key
- [x] #3 Without gh the board still works and says why states are missing
- [x] #4 npm run verify passes; CI green on Windows and Ubuntu
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 The gate command from BRAID.md passes
- [x] #2 Final summary written: what changed, why, validation, anything open
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. src/board/github.ts: one `gh pr list --state all` per refresh (open-only after the first when no open PR vanished; merged PRs cached), PRs keyed by braid/strand number from head branch; checks from statusCheckRollup; gh missing/failing gives an "unavailable" note instead of an error.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Review applied: AC 4 ticked; one gh read shared per page view (3 s window); tests for unauthenticated gh, braid-level branch PR, stored Done with an open PR.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Changed: src/board/github.ts reads PRs with one `gh pr list` per refresh (first call all states, later calls open only, a full read again when an open PR vanishes; merged PRs cached) and keys them by head branch. Lanes (model.ts `derive`): stored Done stays; ask:<key> label -> Waiting with the key; merged PR -> Done; open PR with failing checks -> Waiting "checks failed"; open PR -> In Review; else stored. Cards, strand rows and /api/item carry pr and reason; /api/board has a github status; without gh (or on error) lanes are stored states and the header text names the reason. UI: PR link, Waiting reason, Branch row in details; the unavailable note reuses the header text slot.
<!-- SECTION:FINAL_SUMMARY:END -->
