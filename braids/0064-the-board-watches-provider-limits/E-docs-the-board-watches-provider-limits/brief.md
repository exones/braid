---
id: '0064/E'
title: "Docs: The board watches provider limits"
status: To Do
labels: ["kind:task", "tier:S"]
dependencies: ['0064/A', '0064/B', '0064/C', '0064/D']
order: 50
---

## Goal

Bring the docs up to date as a whole for the board-driven pause, reading from the braid's first strand on.

Expected size: about 150 lines in 6 files.

## Start here

- Every strand's `report.md` of 0064, and the diff of the braid branch against `main`.

## Change

- Read everything the braid changed, from its first strand on, and bring the docs in `BRAID.md` `docs` up to date as a whole: the README, getting started, `docs/board.md`, `docs/cli.md`, `docs/autonomy.md`, the roadmap status, the decisions record (the change from D87) and the help text.

## Already decided

- See the braid's brief.

## Out of scope

- Product code and skills.

## Completion

- [ ] report.md lists each doc in `BRAID.md` `docs` as updated or unchanged
- [ ] Docs from BRAID.md `docs` that this braid makes untrue are updated
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
