---
id: '0085/D'
title: "Docs: braid clean works in repos with submodules"
status: To Do
labels: ["kind:task", "tier:S"]
dependencies: ['0085/A', '0085/B', '0085/C']
order: 40
---

## Goal

Bring the project's docs up to date as a whole with what braid 0085 changed: `braid clean` in repositories with submodules, one line per kept worktree, the cleanup request, and `braid clean` without a number.

Expected size: about 60 lines in 4-6 files.

## Start here

- Every change on the braid branch since it was cut: `git log` and `git diff` from the planning merge, and the strands' `report.md` files (0085/A, B, C).
- `docs` in `BRAID.md`: public `README.md`, `docs/getting-started.md`, `docs/cli.md`, `docs/board.md`, `docs/autonomy.md`, the CLI's help text; internal `docs/development.md`, `docs/decisions.md`, `docs/braids-format.md`, `docs/roadmap.md`, `docs/npm-distribution.md`.

## Change

- Bring the docs from `docs` up to date as a whole: `braid clean` in `docs/cli.md` and its help line, the cleanup request in `docs/board.md`, a decision in `docs/decisions.md` for the safe forced removal (why `--force` only after the checks) and for the cleanup request, and the roadmap status if it lists this.
- List in `report.md` each doc checked as updated or unchanged.

## Out of scope

- Skills, `AGENTS.md`, `CLAUDE.md`, `BRAID.md`.

## Completion

- [ ] The docs from `docs` in BRAID.md are up to date with everything the braid changed, read from its first strand
- [ ] report.md lists each doc checked as updated or unchanged
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
