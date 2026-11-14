---
id: '0002'
title: "Ground research: a new braid CLI, board and T3 automation"
status: Done
labels: ["kind:spike", "tier:M"]
dependencies: []
order: 20
delivery: epic
---

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

## Acceptance

- [x] No product code or skill changes
- [x] All three spikes are Done on the epic branch
- [x] The reports doc-1 to doc-3 give the recommendation on fork, wrap or rewrite, the CLI estimate and the board path, and doc-4 records the user's decisions

## Definition of done

- [x] The gate command from BRAID.md passes
- [x] Final summary written: what changed, why, validation, anything open
