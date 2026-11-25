---
id: '0074/F'
title: "A strandless braid counts its coordinator before it reads stalled"
status: To Do
labels: ["kind:task", "tier:S"]
dependencies: []
order: 60
---

## Goal

A braid with no strands is one item; its stall (`src/board/model.ts`, about line 504) holds when it has no worker or reviewer agent and no pending checks. The coordinator is never counted there, so a running, waiting or busy coordinator of a strandless braid still reads "Stalled: nobody is working and nothing was asked" after 10 minutes (inbox 2026-11-25-hooh). Count the coordinator there by the same `working()` rule the braid-level stall (about line 734) uses.

Expected size: about 40 lines in 2 files.

## Start here

- `src/board/model.ts`: the item's `holds` near line 504 and the braid-level stall near line 734; `working()` in `src/board/t3.ts`.
- D46 in `docs/decisions.md` (why the coordinator isn't an item's agent) and docs/board.md's stall bullets.

## Change

- `src/board/model.ts`: for a braid with no strands, the item's stall doesn't hold while its coordinator is working by `working()`. Cards keep listing agents as before.
- Tests: a strandless braid with a running coordinator and no worker doesn't read stalled; with an idle coordinator and nothing open it still does; a braid with strands is unchanged.

## Already decided

- Only the stall changes, not which agents a card shows.

## Out of scope

- Stalls of braids with strands.

## Completion

- [ ] A strandless braid whose coordinator is working doesn't read stalled, with tests for both sides
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
