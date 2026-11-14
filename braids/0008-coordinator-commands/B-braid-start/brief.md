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

Expected size: about 300 to 450 lines with tests (grown: `braid clean` absorbed, user 2026-11-14).

## Start here

- `.agents/skills/braid/SKILL.md` ("Run an item", step 1) and `references/workflow.md`: today's manual steps.
- `src/braids/branches.ts`: branch names.

## Change

- `braid start <id>`: refuses unless the strand is ready (as `braid next` decides) or `--force`; creates `braid/<number>/<letter>-<slug>` from the braid branch tip, pushes it, and adds a worktree in `$BRAID_WORKTREES_DIR/<repo>/<number>-<letter>`, or `~/braid-worktrees/<repo>/<number>-<letter>` when the variable is unset; prints the branch, the commit and the folder. A braid without strands (a story) gets its `braid/<number>-<slug>` branch from `main`.
- Tests in a temporary repository with a local bare remote; `braid help`, `docs/braids-format.md`.
- `braid clean [<number>]` (absorbed): removes the worktrees and local branches of strands whose PR is merged (and the braid's own when the braid is Done and merged). Dry run by default, `--yes` to act. Skips a worktree whose folder is still in use ("still in use, retry later"), never forces; deletes branches with `git branch -d` only; never touches remote branches, the checked-out branch, or worktrees outside the worktree folder unless named. Tests, `braid help`, docs/braids-format.md.

## Already decided

- Worktree folder: `BRAID_WORKTREES_DIR`, else `~/braid-worktrees` (user, 2026-11-14).
- The coordinator launches the worker's T3 thread on that folder (`existing_worktree`); check in a real run that T3 accepts a worktree outside its usual folder, and say so in report.md.

## Out of scope

- Launching the T3 thread (story 6 board actions).

## Acceptance

- [x] `braid start` creates, pushes and checks out the strand branch in a new worktree, and refuses a strand that isn't ready, covered by tests
- [x] `braid clean` dry-runs by default and with `--yes` removes only merged items' worktrees and local branches, skipping in-use, unmerged and foreign ones, covered by tests
- [ ] CI green on Windows and Ubuntu

## Definition of done

- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open

## Plan

1. Extract the per-strand readiness test from `braid next` into a shared function in coordinate.ts.
