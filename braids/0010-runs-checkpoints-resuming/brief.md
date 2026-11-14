---
id: '0010'
title: "Runs, checkpoints, resuming"
status: Outline
labels: ["kind:story", "tier:L"]
dependencies: ['0009']
order: 100
delivery: epic
---

## Goal

Story 7 of the braid plan. Each run is recorded with its strand, thread and worktree; checkpoints come from the logs; a stopped run can be resumed.

## Working at the end

Kill a session mid-strand and resume it.

## Open questions

- Whether raw run records are committed or stay untracked (the plan leaned to committing the checkpoint summary and keeping raw records untracked).
- How resume picks the thread and worktree back up.

Plan it fully when its turn comes, asking the user if needed.
