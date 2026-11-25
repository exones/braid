---
id: '0060/D'
title: "Docs: Workers as T3 subagents"
status: To Do
labels: ["kind:task", "tier:S"]
dependencies: ['0060/A', '0060/B', '0060/C']
order: 40
---

## Goal

Bring the project's docs up to date as a whole for subagent workers and `braid launch`, from everything 0060 changed since its first strand.

Expected size: about 80 lines in 6 files.

## Start here

- The braid's log and each strand's `report.md` (0060/A, 0060/B, 0060/C).
- BRAID.md `docs` (public and internal lists).

## Change

- Read everything the braid changed, from its first strand, and bring the docs from `docs` up to date as a whole: README and getting started (how workers run), `docs/cli.md` (`braid launch`, `braid review`, `braid clean`), `docs/board.md` (subagent workers, Open thread), the decisions record, `docs/roadmap.md` status, and the help text.
- In `report.md`, list each doc checked as updated or unchanged.

## Out of scope

- Skills (0060/C). New behaviour.

## Completion

- [ ] Every doc in BRAID.md `docs` checked against the braid's changes; report.md lists each as updated or unchanged
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
