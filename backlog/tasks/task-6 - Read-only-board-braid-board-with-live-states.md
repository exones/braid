---
id: TASK-6
title: 'Read-only board: braid board with live states'
status: In Progress
assignee: []
created_date: '2026-11-13T22:00:00Z'
updated_date: '2026-11-13T23:35:00Z'
labels:
  - kind:story
  - tier:L
  - ui
milestone: m-3
dependencies: []
ordinal: 60
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Goal: story 3 of the new braid (plan: `backlog/docs/doc-5 - New-braid-implementation-plan-draft.md` ("Decided so far", story 3)). `braid board` opens a local page with the lanes To Do · In Progress · In Review · Waiting · Done; braid cards expand to their strands; states come from the stored status, the strand's own branch, GitHub PRs and T3 threads.

Strands, in order:
- TASK-6.1: board skeleton and `braid check`.
- TASK-6.2: live copies from branches.
- TASK-6.3: GitHub states.
- TASK-6.4: T3 threads and live refresh.

Already decided (don't re-investigate): doc-5 "Decided so far" and story 3's decisions: the five lanes and their meaning; branch names `braid/0006-<slug>` (a braid) and `braid/0006/A-<slug>` (a strand); the four Waiting reasons for now; refresh every 30 s, on file change and by button; tried in the playground repo and on fixtures; React, Vite, Tailwind, Radix; no drag and drop; agents may edit braid files directly, then `braid check`.

Out of scope: board actions (Start, Merge, Open thread are story 6), the import of `backlog/` and the skills switch (story 4), several projects.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 All four strands are Done on the epic branch
- [ ] #2 braid board shows the playground's braids in the five lanes, with a strand's state taken from its branch, its PR and its T3 thread
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 The gate command from BRAID.md passes
- [ ] #2 Final summary written: what changed, why, validation, anything open
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-11-13 User added to TASK-6.1's mockups: the final state with Start and Merge buttons, and a braid page with a strand table of contents on the left, details and brief by default, and tabs for report and logs.

2026-11-14 TASK-6.1 merged: PR #65, 329a8b2. Done: braid check; braid board (127.0.0.1, read-only, React/Vite/Tailwind/Radix bundled into dist/web, 430 KB); five lanes from stored status, expandable braid cards, braid page with contents panel and Brief/Report/Logs tabs; Start/Merge as disabled icons (Start on To Do, Merge on In Review); mockups reviewed by the user first, kept in docs/design/. Review not blocking; 4 suggestions applied (repo label, bound-address and HTML-in-brief tests, size measured). For later items: /api/board and /api/item in src/board/model.ts and src/commands/board.ts; web code in web/ (hash routes #/0002/A?tab=report).
Plan changes: none. User decided: mockup review (icons bottom right); merge on request.

2026-11-14 TASK-6.2 merged: PR #66, db7eae7. Done: board reads a strand's brief, report and logs from braid/0006/A-<slug> (local or origin/), else braid/0006-<slug>, else the working tree; branch-only items shown; newest commit wins, local wins a tie; merged branches and the checked-out branch skipped; no fetch; cards note the branch. Review not blocking; squash note and test, narrower git calls applied. For later items: BRAID_BRANCH and STRAND_BRANCH in src/braids/branches.ts match PR head branches; treeOf(root, item) reads an item's files; /api/item has branch.
Plan changes: TASK-6.3 also shows the branch in the braid page's details (user's yes). User decided: that; merge on request.
<!-- SECTION:NOTES:END -->
