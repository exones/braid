---
id: TASK-6.2
title: Live copies from branches
status: In Progress
assignee: []
created_date: '2026-11-13T22:01:00Z'
updated_date: '2026-11-13T23:11:00Z'
labels:
  - kind:story
  - tier:L
milestone: m-3
dependencies:
  - TASK-6.1
parent_task_id: TASK-6
ordinal: 20
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Goal: a strand being worked on shows its real state on the board before it is merged, by reading its brief from its own branch.

Expected size: about 300 to 600 lines with tests.

Start here (read in this order):
- `backlog/docs/doc-1 - TASK-2.1-report-Backlog.md-as-braids-reference.md`: how Backlog.md reads other branches (a reference).
- The board from TASK-6.1.

Change:
- Branch names (decided): `braid/0006-<slug>` for a braid, `braid/0006/A-<slug>` for a strand; write them into `docs/braids-format.md`.
- Read a strand's `brief.md` from its branch (local or `origin/`) with `git ls-tree` / `git show`; that copy wins over the one in the working tree; cache by commit.
- The board shows those states; the card says which branch its state came from.

Already decided (don't re-investigate): the parent TASK-6 and doc-5 (`backlog/docs/doc-5 - New-braid-implementation-plan-draft.md`). Reuse the reader in `src/braids/` (`loadBraids`, `parseBrief`). Node.js 26, strict TypeScript, ESM; Windows and Ubuntu.

Out of scope: GitHub and T3 (TASK-6.3, 6.4).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Branch names are in docs/braids-format.md
- [ ] #2 A strand set In Progress on its branch shows In Progress on a board run from main, covered by a test with a temp repo
- [ ] #3 npm run verify passes; CI green on Windows and Ubuntu
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 The gate command from BRAID.md passes
- [ ] #2 Final summary written: what changed, why, validation, anything open
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. docs/braids-format.md: a "Branches" section with `braid/0006-<slug>` (a braid: its epic branch, or its only branch without strands) and `braid/0006/A-<slug>` (a strand); update the `braid board` paragraph.
2. src/braids/store.ts: load briefs through a small tree interface (list a folder, read a file) so the same loader reads the working tree or a Git commit; `loadBraids` keeps its API. Items get `source` (branch and commit, null for the working tree).
3. src/braids/branches.ts (new): `git for-each-ref` over `refs/heads/braid/*` and `refs/remotes/*/braid/*`; parse braid and strand branch names; one tree per commit from `git ls-tree -r`, files via `git show <commit>:<path>`; cache by commit for the life of the process. `loadLiveBraids(root)`: start from the working tree, replace a braid (and its strands) with its braid branch's copy, then each strand with its strand branch's copy (strand branch > braid branch > working tree). Branches only add or replace the item their name names. Local and `origin/` copies of one branch: the newer commit wins, local on a tie. The checked-out branch is skipped (the working tree is its live copy). A branch whose brief is missing or malformed is skipped.
4. src/board/model.ts: cards, strand rows and item details carry `branch` (null for the working tree); report and logs are read from the same source as the brief. src/commands/board.ts uses `loadLiveBraids`.
5. web/src/App.tsx: a small "from <branch>" note on strand rows, braid cards and the item page (no other UI change).
6. Tests (test/board.test.ts, temp Git repos): a strand set In Progress on its branch shows In Progress on a board run from main (local and origin/), braid branch copies, precedence, checked-out branch skipped, malformed branch copy ignored, report from the branch.
<!-- SECTION:PLAN:END -->
