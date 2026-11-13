---
id: TASK-2
title: 'Ground research: a new braid CLI, board and T3 automation'
status: In Progress
assignee: []
created_date: '2026-11-12T20:01:00Z'
updated_date: '2026-11-13T12:57:00Z'
labels:
  - kind:spike
  - tier:M
milestone: m-1
dependencies: []
ordinal: 20
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Goal: the ground research for a new braid: a CLI that tracks tasks, a board, and eventually automation of T3 (starting and following agents). Decide how to build it (fork Backlog.md and adjust it, wrap it, or reimplement with its code as a reference) and the smallest path to a board that shows derived states and can start agents. The user decides from the spikes' answers.

Subtasks, in order:
- TASK-2.1: Backlog.md's implementation as a reference, and fork or reference.
- TASK-2.3: how the braid CLI could be built, with an estimate per way and the licence.
- TASK-2.2: the board's path: starting agents, derived states, the first version.

Already decided (don't re-investigate):
- Backlog.md stays the store until braid reads the same files, so existing tasks need no conversion (roadmap).
- The current braid CLI (`src/`, the `.braid/` ledger) and the roadmap's stages built around it are dismissed: the new CLI starts fresh and needn't fit them.
- Spikes recommend; the user decides. No product code or skill changes in this goal.
- Backlog.md source for reading: github.com/MrLesk/Backlog.md at tag v1.55.3 (MIT), the version braid pins.

Out of scope:
- Building the board or the tracker.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 No product code or skill changes
- [ ] #2 All three spikes are Done on the epic branch
- [ ] #3 docs/backlog-md.md, docs/braid-cli.md and the roadmap give the user a recommendation on fork, wrap or reimplement, the CLI estimate, and the board path with its first version and follow-up goals
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 The gate command from BRAID.md passes
- [ ] #2 Final summary written: what changed, why, validation, anything open
<!-- DOD:END -->
