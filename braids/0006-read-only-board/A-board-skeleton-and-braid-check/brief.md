---
id: '0006/A'
title: "Board skeleton and braid check"
status: Done
labels: ["kind:story", "tier:M", "ui"]
dependencies: []
order: 10
---

Goal: a first board you can open, from the stored statuses only, and a `braid check` for agents that edit braid files directly.

Expected size: about 700 to 1,100 lines with tests, the web UI included.

Start here (read in this order):
- `docs/braids-format.md` and `src/braids/`.
- `archive/backlog/docs/doc-2 - TASK-2.3-report-how-the-braid-CLI-could-be-built.md`, section 4 (UI stack): a proposal, not binding beyond the stack.

Change:
- **First, mockups, then stop.** Before building the board, make mockups of the board with realistic test braids (several braids, strands in every lane, an Outline braid, a Waiting card with its reason, an expanded braid card, and a card's brief and report view): a static page or screenshots saved under `temp/` and shown in the PR. Commit and push them, report to the coordinator and wait: the user reviews the design and may change the plan. Build only after the coordinator passes on the user's go. The mockups show the final state, not only this strand: Start and Merge buttons on cards (built in story 6; in this strand they are shown disabled or left out of the build). Clicking a braid opens its page: a left panel lists the braid and its strands like a table of contents; selecting one shows its main details and brief by default, with tabs or a switch to its report and its logs (one per thread).
- `braid check`: validate every brief under `braids/`, list every error with its file, exit 2 on any.
- `docs/braids-format.md` and `README.md`: briefs and reports may be edited directly; run `braid check` afterwards (they now say "not by hand").
- `braid board`: serves a page on 127.0.0.1 (free port, printed) and opens the browser; React, Vite, Tailwind and Radix, built into the package.
- Lanes To Do · In Progress · In Review · Waiting · Done from the stored status (Outline shows in To Do with a badge; In Review and Waiting stay empty until TASK-6.3 and 6.4). A braid is one card in its most urgent strand's lane, with a progress count, that expands in place to its strands. Clicking a card shows its brief and report.
- Screenshots of the board on the playground repo in the PR.

Already decided (don't re-investigate): the parent TASK-6 and doc-5 (`archive/backlog/docs/doc-5 - New-braid-implementation-plan-draft.md`). Reuse the reader in `src/braids/` (`loadBraids`, `parseBrief`). Node.js 26, strict TypeScript, ESM; Windows and Ubuntu.

Out of scope: branches, GitHub and T3 (TASK-6.2 to 6.4); refresh beyond a page reload.

## Acceptance

- [x] braid check lists every broken brief with its file and exits 2, and exits 0 on a clean folder
- [x] The format doc and README allow direct edits followed by braid check
- [x] braid board opens a page showing braids in the five lanes, expanding to their strands, with brief and report on click
- [x] npm run verify passes; CI green on Windows and Ubuntu; screenshots in the PR
- [x] Mockups with test braids were reviewed by the user before the board was built

## Definition of done

- [x] The gate command from BRAID.md passes
- [x] Final summary written: what changed, why, validation, anything open

## Plan

1. Mockups (this stop): one static page temp/mockups/board.html (plain HTML/CSS/JS, no build) with realistic test braids, in the final design: five lanes, braid cards with progress and in-place expansion, Outline badge, Waiting card with reason, disabled Start/Merge buttons, and a braid page (left table-of-contents panel, main details + brief, tabs Brief/Report/Logs). Screenshots in temp/mockups/*.png. Commit, push, draft PR, report, STOP until the user's go.
2. After go: braid check (validate all briefs, list errors with file, exit 2); docs/braids-format.md and README allow direct edits + braid check; braid board (node:http on 127.0.0.1, free port, JSON API from loadBraids, React/Vite/Tailwind/Radix built into dist/web); lanes from stored status; tests; screenshots on the playground repo; verify; Done.
