---
id: TASK-6.2
title: Live copies from branches
status: To Do
assignee: []
created_date: '2026-11-13T22:01:00Z'
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
