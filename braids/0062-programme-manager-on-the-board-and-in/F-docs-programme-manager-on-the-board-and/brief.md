---
id: '0062/F'
title: "Docs: Programme manager on the board and in notifications"
status: Outline
labels: ["kind:task", "tier:L"]
dependencies: ['0062/A', '0062/B', '0062/C', '0062/D', '0062/E']
order: 60
---

## Goal

Read everything braid 0062 changed, from its first strand, and bring the docs from BRAID.md `docs` up to date as a whole:

- `README.md` and `docs/getting-started.md`: the programme manager.
- `docs/board.md` and `docs/cli.md`: programmes, PM routing and the pushes.
- `docs/roadmap.md`: status.
- `docs/decisions.md`: a decision for PM routing and the programme on the board, with its reasons.
- The CLI's help text.

Tier L, because the docs describe the agent instructions changed in E.

## Completion

- [ ] Each doc from BRAID.md `docs` is checked, and report.md lists it as updated or unchanged
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
