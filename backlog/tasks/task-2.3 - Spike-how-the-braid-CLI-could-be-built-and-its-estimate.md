---
id: TASK-2.3
title: 'Spike: how the braid CLI could be built, and its estimate'
status: To Do
assignee: []
created_date: '2026-11-13T12:45:00Z'
updated_date: '2026-11-13T13:25:00Z'
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
- [ ] #1 It states what the MIT licence requires for each way and what braid lacking a licence means
- [ ] #2 No product code or skill changes
- [ ] #3 It estimates reimplementing in lines and in goals with tiers, fork and wrap roughly, and lists the follow-up goals as bigger stories with phases
- [ ] #4 It recommends a UI stack for a minimal board with several lanes, saying what to choose now and what can wait
- [ ] #5 docs/braid-cli.md answers the five questions with evidence (files read, commands run, upstream pages)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 The gate command from BRAID.md passes
- [ ] #2 Final summary written: what changed, why, validation, anything open
<!-- DOD:END -->
