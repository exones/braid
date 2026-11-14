---
id: '0008/B'
title: "braid start"
status: In Progress
labels: ["kind:story", "tier:S"]
dependencies: ['0008/A']
order: 20
---

## Goal

Starting a strand is one command: its branch from the braid tip, pushed, and a worktree for the worker.

Expected size: about 150 to 250 lines with tests.

## Start here

- `.agents/skills/braid/SKILL.md` ("Run an item", step 1) and `references/workflow.md`: today's manual steps.
- `src/braids/branches.ts`: branch names.

## Change

- `braid start <id>`: refuses unless the strand is ready (as `braid next` decides) or `--force`; creates `braid/<number>/<letter>-<slug>` from the braid branch tip, pushes it, and adds a worktree in `$BRAID_WORKTREES_DIR/<repo>/<number>-<letter>`, or `~/braid-worktrees/<repo>/<number>-<letter>` when the variable is unset; prints the branch, the commit and the folder. A braid without strands (a story) gets its `braid/<number>-<slug>` branch from `main`.
- Tests in a temporary repository with a local bare remote; `braid help`, `docs/braids-format.md`.

## Already decided

- Worktree folder: `BRAID_WORKTREES_DIR`, else `~/braid-worktrees` (user, 2026-11-14).
- The coordinator launches the worker's T3 thread on that folder (`existing_worktree`); check in a real run that T3 accepts a worktree outside its usual folder, and say so in report.md.

## Out of scope

- Launching the T3 thread (story 6 board actions).

## Acceptance

- [ ] `braid start` creates, pushes and checks out the strand branch in a new worktree, and refuses a strand that isn't ready, covered by tests
- [ ] CI green on Windows and Ubuntu

## Definition of done

- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open

## Plan

1. Extract the per-strand readiness test from `braid next` into a shared function in coordinate.ts.
