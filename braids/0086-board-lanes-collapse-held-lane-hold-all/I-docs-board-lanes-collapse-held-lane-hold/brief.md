---
id: '0086/I'
title: "Docs: Board lanes collapse, Held lane, Hold all"
status: To Do
labels: ["kind:task", "tier:L"]
dependencies: ['0086/A', '0086/B', '0086/C', '0086/D', '0086/E', '0086/F', '0086/G', '0086/H']
order: 90
---

## Goal

Bring the project's docs up to date as a whole for everything braid 0086 changed: the lanes and the Held lane, holds and Hold all, finishing a programme, and limits as what is left.

Expected size: about 200 lines in 8 files.

## Start here

- Everything the braid changed, from its first strand: `git log` and the diff of the braid branch against `main`, each strand's `report.md` under `braids/0086-board-lanes-collapse-held-lane-hold-all/`, the braid's log.
- `docs` in `BRAID.md`: the public docs (README.md, docs/getting-started.md, docs/cli.md, docs/board.md, docs/autonomy.md, the CLI's help text in src/cli.ts and the commands' usage lines) and the internal ones (docs/development.md, docs/decisions.md, docs/braids-format.md, docs/roadmap.md, docs/npm-distribution.md).

## Change

- Bring the docs from `docs` up to date as a whole: overview and README, getting started, roadmap status, the decisions record (new decisions for one hold record, holds sent and counted by code, Held in its own lane, closing a programme, thresholds as what is left and how the old form reads), help text, and the board's screenshots where they changed.
- In `report.md`, list each doc checked as updated or unchanged.

## Already decided

- The decisions record says why; the docs say how (current behaviour, not history).

## Out of scope

- Product code and skills.

## Completion

- [ ] Every doc in BRAID.md `docs` is checked and brought up to date for this braid's changes; report.md lists each as updated or unchanged
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
