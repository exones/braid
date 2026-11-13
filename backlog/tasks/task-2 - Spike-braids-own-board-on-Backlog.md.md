---
id: TASK-2
title: 'braid''s own board: the path, and Backlog.md as fork or reference'
status: To Do
assignee: []
created_date: '2026-11-12T20:01:00Z'
updated_date: '2026-11-13T12:38:00Z'
labels:
  - kind:spike
  - tier:M
milestone: m-1
dependencies: []
ordinal: 20
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Goal: decide how braid gets its own task tracker and board (roadmap "braid's own board"): fork Backlog.md and adjust it into braid, wrap it, or reimplement it with its code as a reference; and the smallest path to a board that shows derived states and can start agents. The user decides from the two spikes' answers.

Subtasks, in order:
- TASK-2.1: Backlog.md's implementation as a reference, and fork or reference.
- TASK-2.2: the board's path: starting agents, derived states, the first version.

Already decided (don't re-investigate):
- Backlog.md stays the store until braid reads the same files, so existing tasks need no conversion (roadmap).
- Spikes recommend; the user decides. No product code or skill changes in this goal.
- Backlog.md source for reading: github.com/MrLesk/Backlog.md at tag v1.55.3 (MIT), the version braid pins.

Out of scope:
- Building the board or the tracker.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Both spikes are Done on the epic branch
- [ ] #2 docs/backlog-md.md and the roadmap give the user a recommendation on fork, wrap or reimplement, and the board path with its first version and follow-up goals
- [ ] #3 No product code or skill changes
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 The gate command from BRAID.md passes
- [ ] #2 Final summary written: what changed, why, validation, anything open
<!-- DOD:END -->
