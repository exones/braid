---
id: TASK-2.3
title: 'Spike: how the braid CLI could be built, and its estimate'
status: To Do
assignee: []
created_date: '2026-11-13T12:45:00Z'
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
Goal: a design sketch and an estimate for braid's own CLI as its task tracker, board and coordination tool, built on TASK-2.1's three ways (on Backlog.md's code as a fork or library, wrapping its CLI or MCP server, or own code with Backlog.md as a reference), so the user can choose and plan the follow-up goals. Time box: about three hours of agent work; if it runs out, report what is known and what isn't.

Expected size: one new doc of about 150 to 250 lines.

Start here (read in this order):
- TASK-2.1's final summary and `docs/backlog-md.md`.
- `README.md`, `src/` (about 2,000 lines today) and `.braid/` handling: what the braid CLI already does.
- `docs/roadmap.md` (stages and "braid's own board") and `docs/decisions.md`.
- `.agents/skills/braid/` and `BRAID.md`: what the skills do by hand today that a CLI could do.

Questions:
1. What the CLI must do: task commands with plain output for agents (the Backlog.md features braid uses), goals with subtasks, derived states, actions (Start, Merge on request, Open thread), the board, and how they fit the existing ledger and stages.
2. For each of the three ways: the architecture (modules, what is reused, what is new), the runtime fit with Node.js 26 and ESM, and the upkeep.
3. An estimate per way: lines of code, goals and stories with tiers, and the riskiest parts.
4. Licence: what Backlog.md's MIT licence requires for each way (notices, attribution), and what braid's missing licence means if it reuses or publishes code.

Change:
- `docs/braid-cli.md` (new): the answers, ending with a recommended way, its first goals in order and the conditions that would change it.

Out of scope:
- Building anything, product code, skill changes; the board's T3 and derived-state details (TASK-2.2).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 docs/braid-cli.md answers the four questions with evidence (files read, commands run, upstream pages)
- [ ] #2 It estimates each way in lines and in goals or stories with tiers, and recommends one with its first goals
- [ ] #3 It states what the MIT licence requires for each way and what braid lacking a licence means
- [ ] #4 No product code or skill changes
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 The gate command from BRAID.md passes
- [ ] #2 Final summary written: what changed, why, validation, anything open
<!-- DOD:END -->
