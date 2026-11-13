---
id: TASK-6.2
title: Live copies from branches
status: Done
assignee: []
created_date: '2026-11-13T22:01:00Z'
updated_date: '2026-11-13T23:16:00Z'
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
- [x] #1 Branch names are in docs/braids-format.md
- [x] #2 A strand set In Progress on its branch shows In Progress on a board run from main, covered by a test with a temp repo
- [x] #3 npm run verify passes; CI green on Windows and Ubuntu
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 The gate command from BRAID.md passes
- [x] #2 Final summary written: what changed, why, validation, anything open
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

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Decisions: a braid branch is read too (its brief and strands), not only strand branches: a strand without its own branch shows its state on the epic branch. Braids and strands that exist only on a branch are added. A branch already in HEAD is skipped (covers merged branches and the checked-out branch, whose uncommitted edits win). Among copies of one item (local/origin/, two slugs) the newest commit wins, local on a tie. A malformed copy on a branch is skipped rather than failing the board. No git fetch on the board.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
What changed: `braid board` reads live copies from branches. New src/braids/branches.ts (`loadLiveBraids`, `braidBranches`, `gitTree`, `treeOf`): lists `braid/*` branches local and remote-tracking with one `git for-each-ref`, reads `braids/` per commit with `git ls-tree -r -t` and `git cat-file`, cached by commit for the server's life. Precedence: strand branch > braid branch > working tree; newest commit among copies of one item, local on a tie; branches already in HEAD and malformed copies are skipped; branch-only braids and strands are added. src/braids/store.ts loads through a `Tree` interface (working tree or commit); `loadBraids` keeps its API; items carry `source` (branch, commit). Board cards, strand rows and /api/item carry `branch`; report and logs come from the same source. Cards and strand rows show a small "from <branch>" note. Branch names and the rules are in docs/braids-format.md ("Branches").
Why: a strand being worked on shows its real state before it is merged.
Validation: npm run verify passes (44 tests); test/branches.test.ts uses temp Git repos: a strand In Progress on its branch shows In Progress on a board run from main (API, report and logs from the branch), origin/-only branch and newer local copy, strand > braid branch > working tree, branch-only braids, skips for merged/checked-out/bad-name/broken branches, no Git.
Open: the item page does not show the branch (the API has it; left out to stay within the agreed UI). The board runs no fetch, so remote branches are as fresh as the last fetch.
For later items: `loadLiveBraids(root)` replaces `loadBraids` in src/commands/board.ts; `BraidCard.branch`, `StrandCard.branch`, `ItemDetail.branch` (null = working tree); `Item.source`; `treeOf(root, item)` reads an item's files from its source; `BRAID_BRANCH`/`STRAND_BRANCH` regexes in src/braids/branches.ts for matching PR head branches in TASK-6.3.
Needs the user: none
<!-- SECTION:FINAL_SUMMARY:END -->
