---
id: TASK-6.1
title: Board skeleton and braid check
status: To Do
assignee: []
created_date: '2026-11-13T22:01:00Z'
labels:
  - kind:story
  - tier:M
  - ui
milestone: m-3
dependencies: []
parent_task_id: TASK-6
ordinal: 10
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Goal: a first board you can open, from the stored statuses only, and a `braid check` for agents that edit braid files directly.

Expected size: about 700 to 1,100 lines with tests, the web UI included.

Start here (read in this order):
- `docs/braids-format.md` and `src/braids/`.
- `backlog/docs/doc-2 - TASK-2.3-report-how-the-braid-CLI-could-be-built.md`, section 4 (UI stack): a proposal, not binding beyond the stack.

Change:
- `braid check`: validate every brief under `braids/`, list every error with its file, exit 2 on any.
- `docs/braids-format.md` and `README.md`: briefs and reports may be edited directly; run `braid check` afterwards (they now say "not by hand").
- `braid board`: serves a page on 127.0.0.1 (free port, printed) and opens the browser; React, Vite, Tailwind and Radix, built into the package.
- Lanes To Do · In Progress · In Review · Waiting · Done from the stored status (Outline shows in To Do with a badge; In Review and Waiting stay empty until TASK-6.3 and 6.4). A braid is one card in its most urgent strand's lane, with a progress count, that expands in place to its strands. Clicking a card shows its brief and report.
- Screenshots of the board on the playground repo in the PR.

Already decided (don't re-investigate): the parent TASK-6 and doc-5 (`backlog/docs/doc-5 - New-braid-implementation-plan-draft.md`). Reuse the reader in `src/braids/` (`loadBraids`, `parseBrief`). Node.js 26, strict TypeScript, ESM; Windows and Ubuntu.

Out of scope: branches, GitHub and T3 (TASK-6.2 to 6.4); refresh beyond a page reload.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 braid check lists every broken brief with its file and exits 2, and exits 0 on a clean folder
- [ ] #2 The format doc and README allow direct edits followed by braid check
- [ ] #3 braid board opens a page showing braids in the five lanes, expanding to their strands, with brief and report on click
- [ ] #4 npm run verify passes; CI green on Windows and Ubuntu; screenshots in the PR
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 The gate command from BRAID.md passes
- [ ] #2 Final summary written: what changed, why, validation, anything open
<!-- DOD:END -->
