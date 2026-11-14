---
id: '0008'
title: "Coordinator commands"
status: Outline
labels: ["kind:story", "tier:L"]
dependencies: ['0007']
order: 80
delivery: epic
---

## Goal

Story 5 of the braid plan. `braid next`, `status`, `facts`, `recap` and `merge` take over steps the braid skills do by hand today.

## Working at the end

The coordinator calls one command where it ran several.

## Open questions

- Which skill steps become commands first, and what each prints.
- `braid list` and `braid view` lack strand dependencies; `braid next` needs them (from TASK-7.3).
- "Fixes still failing after two review rounds" becomes a Needs You reason here (board decision, 2026-11-13).
- The `epic/**` CI trigger can go once the epic branches are `braid/**`.

Plan it fully when its turn comes, asking the user if needed.
