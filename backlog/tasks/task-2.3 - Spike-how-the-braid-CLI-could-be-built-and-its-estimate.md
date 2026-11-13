---
id: TASK-2.3
title: 'Spike: how the braid CLI could be built, and its estimate'
status: Done
assignee: []
created_date: '2026-11-13T12:45:00Z'
updated_date: '2026-11-13T13:33:00Z'
labels:
  - kind:spike
  - tier:M
milestone: m-1
dependencies:
  - TASK-2.1
parent_task_id: TASK-2
ordinal: 15
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Goal: a design sketch and an estimate for a new braid CLI as its task tracker, board and, later, automation of T3 (starting and following agents), reimplemented as a compatible Node tracker with Backlog.md as the reference (the user's lean), with fork and wrap estimated only roughly for comparison, so the user can confirm the way and plan the follow-up goals. Time box: about three hours of agent work; if it runs out, report what is known and what isn't.

Expected size: one new doc of about 150 to 250 lines.

Start here (read in this order):
- TASK-2.1's final summary and `docs/backlog-md.md`.
- `docs/roadmap.md` ("braid's own board") and `docs/decisions.md`.
- `.agents/skills/braid/` and `BRAID.md`: what the skills do by hand today that a CLI could do.

Questions:
1. What the CLI must do: task commands with plain output for agents (the Backlog.md features braid uses), goals with subtasks, derived states, actions (Start, Merge on request, Open thread), the board, and later T3 automation; which of these come first.
2. Reimplement: the architecture (modules, what Backlog.md's code and tests teach, what is new), on Node.js 26 and ESM, leaving room for the later features (checkpoints, reports, better resuming, multiple agents, running a task from the board).
3. Estimates: reimplement in lines of code and goals with tiers, and its riskiest parts; fork and wrap roughly, for comparison.
4. UI stack: modern libraries for a minimal but functional board with several lanes (framework, components, drag and drop, how the CLI serves it locally); what to choose now and what can wait.
5. Licence: what Backlog.md's MIT licence requires when its code is read, copied or ported (notices, attribution), and what braid's missing licence means if it reuses or publishes code.

Change:
- `docs/braid-cli.md` (new): the answers, ending with the follow-up goals in order, each a bigger story with phases (the user prefers those for long unattended runs), and the conditions that would change the way.

Already decided (don't re-investigate):
- The current braid CLI (`src/`, the `.braid/` ledger) and the roadmap's stages built around it are dismissed: the new CLI starts fresh and needn't fit them.
- The user leans to reimplementing (2026-11-13): a compatible Node tracker with Backlog.md as the reference, wrapping its CLI during the transition. The product will grow: richer UI, checkpoints, reports, better resuming, multiple agents, running a task from the board.
- UI: modern UI libraries; minimal but functional, the main view a board with several lanes (the lanes are defined later).

Out of scope:
- Building anything, product code, skill changes; the board's T3 and derived-state details (TASK-2.2).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 It states what the MIT licence requires for each way and what braid lacking a licence means
- [x] #2 No product code or skill changes
- [x] #3 It estimates reimplementing in lines and in goals with tiers, fork and wrap roughly, and lists the follow-up goals as bigger stories with phases
- [x] #4 It recommends a UI stack for a minimal board with several lanes, saying what to choose now and what can wait
- [x] #5 docs/braid-cli.md answers the five questions with evidence (files read, commands run, upstream pages)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 The gate command from BRAID.md passes
- [x] #2 Final summary written: what changed, why, validation, anything open
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Clone Backlog.md v1.55.3 into inspiration/ (gitignored); read the compatible subset (markdown/, prefix-config, task-loader, task-identity-index, config, CLI commands braid calls) and count it with wc.
2. Inventory what the braid skills do by hand (SKILL.md, workflow.md, task.md, braid-worker, braid-reviewer) that a CLI could do; order the CLI features.
3. Sketch the architecture: modules, Node 26/ESM, lessons from Backlog.md code and tests, room for later features.
4. Estimate reimplement in lines and goals with tiers, riskiest parts; fork and wrap roughly from docs/backlog-md.md.
5. UI stack: check current versions of candidate libraries (npm view) for framework, components, drag and drop, local server; choose now vs later.
6. Licence: MIT terms (LICENSE file of Backlog.md), braid package.json and repo licence state.
7. Write docs/braid-cli.md ending with follow-up goals (stories with phases) and conditions that change the way; npm run verify; final summary; Done.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Compatible subset estimated at 4.8k-6.7k product lines (confirms TASK-2.1's 5k-8k at its low end); first full product with the board 7.2k-10.7k. Drag and drop deferred: lanes are derived states, so a drag would be an action, not an edit. braid has no licence (no license field, no LICENSE file, gh api license null, public repo).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
What changed: new docs/braid-cli.md answers the five questions. (1) What the CLI must do: the Backlog.md subset braid calls, plus the steps the skills do by hand (next item, resume status, start, checks by ci names, auto-mode merge checks, stop-case facts, recaps); order: read-only board with nested goals and derived states, then compatible write commands, coordinator commands, board actions, T3 automation. (2) Architecture: format, config, ids, git, store, model, cli, sources, derive, actions, server, web on Node 26/ESM with two or three dependencies; Backlog.md code and 17 test files (5,074 lines) as the specification; a round-trip suite against backlog.exe-written files; runtime state in an untracked runs module for checkpoints and several agents; multi-line fields also from a file or stdin because npm shims on Windows cut them. (3) Estimate: compatible tracker 4.8k-6.7k product lines, with board 7.2k-10.7k, about five goals (three tier L); riskiest: byte-exact round-trip, IDs across branches, outside sources, concurrent writers; fork ~36k-52k plus the Bun port, wrap 3k-5.5k but never drops backlog. (4) UI: React 19.3, Vite 8, Tailwind 4.3, Radix primitives, node:http with SSE on 127.0.0.1 and a session token for actions; drag and drop (pragmatic-drag-and-drop when wanted), router, query cache and editor can wait. (5) Licence: reading needs nothing; ported pieces keep the MIT notice (THIRD_PARTY_NOTICES.md and file headers); wrap nothing unless bundled; fork keeps LICENSE. braid has no licence: others have no right to use it, so pick one (MIT simplest) before publishing.
Why: the user leans to reimplementing and needs the estimate, stack and follow-up goals to plan.
Validation: claims from the v1.55.3 source (wc, grep), npm view on 2026-11-13, gh api repos/exones/braid, the braid skills; npm run verify passes.
Open: cross-branch read time on large repos, T3 programmatic interface (TASK-2.2), exact per-command sizes in cli.ts.
For later items: TASK-2.2 supplies the lanes and derived-state rules that goal 1 (read-only board) needs; the doc proposes derived lanes with actions as buttons, not drag.
Needs the user: decision: confirm the reimplement way and the follow-up goal order; decision: pick a licence for braid before publishing.
<!-- SECTION:FINAL_SUMMARY:END -->
