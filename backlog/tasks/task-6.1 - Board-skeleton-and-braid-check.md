---
id: TASK-6.1
title: Board skeleton and braid check
status: Done
assignee: []
created_date: '2026-11-13T22:01:00Z'
updated_date: '2026-11-13T22:39:00Z'
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
- **First, mockups, then stop.** Before building the board, make mockups of the board with realistic test braids (several braids, strands in every lane, an Outline braid, a Waiting card with its reason, an expanded braid card, and a card's brief and report view): a static page or screenshots saved under `temp/` and shown in the PR. Commit and push them, report to the coordinator and wait: the user reviews the design and may change the plan. Build only after the coordinator passes on the user's go. The mockups show the final state, not only this strand: Start and Merge buttons on cards (built in story 6; in this strand they are shown disabled or left out of the build). Clicking a braid opens its page: a left panel lists the braid and its strands like a table of contents; selecting one shows its main details and brief by default, with tabs or a switch to its report and its logs (one per thread).
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
- [x] #1 braid check lists every broken brief with its file and exits 2, and exits 0 on a clean folder
- [x] #2 The format doc and README allow direct edits followed by braid check
- [x] #3 braid board opens a page showing braids in the five lanes, expanding to their strands, with brief and report on click
- [x] #4 npm run verify passes; CI green on Windows and Ubuntu; screenshots in the PR
- [x] #5 Mockups with test braids were reviewed by the user before the board was built
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 The gate command from BRAID.md passes
- [x] #2 Final summary written: what changed, why, validation, anything open
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Mockups (this stop): one static page temp/mockups/board.html (plain HTML/CSS/JS, no build) with realistic test braids, in the final design: five lanes, braid cards with progress and in-place expansion, Outline badge, Waiting card with reason, disabled Start/Merge buttons, and a braid page (left table-of-contents panel, main details + brief, tabs Brief/Report/Logs). Screenshots in temp/mockups/*.png. Commit, push, draft PR, report, STOP until the user's go.
2. After go: braid check (validate all briefs, list errors with file, exit 2); docs/braids-format.md and README allow direct edits + braid check; braid board (node:http on 127.0.0.1, free port, JSON API from loadBraids, React/Vite/Tailwind/Radix built into dist/web); lanes from stored status; tests; screenshots on the playground repo; verify; Done.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
What changed: `braid check` validates every brief and folder name under braids/ and lists each error as `<file>: <message>` with a count, exit 2 on any, 0 on a clean (or missing) folder. `braid board` serves a read-only board on 127.0.0.1 (free port, printed; `--no-open` skips the browser) from a node:http server with a JSON API (/api/board, /api/item?id=) over the existing loadBraids reader; the page (React 19, Vite 8, Tailwind 4, Radix tabs and tooltips, react-markdown) lives in web/ and is built into dist/web by `npm run build`. Lanes To Do, In Progress, In Review, Waiting, Done come from stored status (Outline shows in To Do with a badge; In Review and Waiting stay empty); a braid is one card in its most urgent unfinished strand's lane with a done/total bar that expands in place; clicking opens the braid page with a table-of-contents panel and Brief, Report and Logs tabs (one chip per thread log). Start (To Do cards) and Merge (In Review cards) are disabled icon buttons at the card's bottom right with a tooltip. docs/braids-format.md and README now say briefs and reports may be edited directly, then run `braid check`. The package proof also requires dist/web/index.html. dist/web is 430 KB on disk after the build (JS 416 KB, 130 KB gzip; CSS 14 KB); the radix-ui umbrella import tree-shakes (React and react-markdown are the bulk), so it stays as is.
Why: first usable board plus a safety check for agents that edit braid files directly (TASK-6).
Validation: npm run verify green; new tests in test/board.test.ts and test/md.test.ts (bound address is 127.0.0.1; HTML in a brief shows as text, not markup; check errors, lanes API, item API, 500 on broken brief, static serving and path traversal, real `braid board --no-open` process); Test-Package.ps1 green from pwsh; screenshots on the playground repo and a demo repo in docs/design/board-screenshots/. The user reviewed the mockups (docs/design/board-mockups/) before the build and asked for the icon-button change.
Review follow-up: header shows <repo> · braids/ (repo comes from /api/board). Open: the mockup page still shows text Start/Merge buttons on every card (design superseded by the icon buttons); no refresh beyond reload (TASK-6.4). Local `npm run verify:full` from Git Bash fails at the packed-install step only because GNU tar cannot read C: paths; from pwsh it passes.
For later items: web code is in web/ (own tsconfig; `npm run typecheck` now checks it too; build is `tsc ... && vite build`); API types are in src/board/model.ts (BraidCard, ItemDetail); lane logic is laneOfBraid in the same file with the URGENCY order Waiting, In Review, In Progress, To Do, Done, so 6.2 to 6.4 add states there; the page is hash-routed (#/0002/A?tab=report); UI libs are devDependencies bundled into dist/web, so the package has no runtime dependencies.
Needs the user: none
<!-- SECTION:FINAL_SUMMARY:END -->
