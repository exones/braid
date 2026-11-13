---
id: TASK-2
title: 'Ground research: a new braid CLI, board and T3 automation'
status: In Progress
assignee: []
created_date: '2026-11-12T20:01:00Z'
updated_date: '2026-11-13T13:27:00Z'
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

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-11-13 User decided (on TASK-2.1): leans to reimplementing a compatible Node tracker with Backlog.md as the reference, then growing the product (richer UI, checkpoints, reports, better resuming, multiple agents, running a task from the board); follow-ups as bigger stories with phases. UI: modern libraries, minimal but functional, a board with several lanes defined later. Plan changes: TASK-2.3 now details reimplementing (fork and wrap only roughly) and adds the UI stack; TASK-2.2 proposes candidate lanes.

2026-11-13 TASK-2.1 merged: PR #54, f11fe6e. Done: docs/backlog-md.md maps Backlog.md 1.55.3 (66.6k product lines, 88.5k test lines, Bun only, MIT, one maintainer in practice) and recommends reimplementing a compatible Node tracker with it as the reference, wrapping its CLI during the transition; review not blocking, three factual corrections applied. For later items: the board shows the working copy first (selectTaskRecord), not the newest; the compatible subset is a rough 5k-8k lines for TASK-2.3 to confirm.
Plan changes: TASK-2.3 and TASK-2.2 adjusted to the user's lean (see the note above). User decided: leans to reimplement (see above).
<!-- SECTION:NOTES:END -->
