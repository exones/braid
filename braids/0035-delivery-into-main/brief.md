---
id: '0035'
title: "Delivery into main: strands land on main"
status: Outline
labels: ["kind:story", "tier:L"]
dependencies: ['0034']
related: ['0034']
delivery: epic
---

## Goal

A goal can be delivered without a braid branch: each strand's PR goes into `main`, as if the strands were independent stories, and there is no final PR. The brief field for it exists (`delivery: main`), but the skills, the workflow and the commands only know `epic`. For work whose strands are each safe on `main` (a sweep, a set of fixes, a long initiative where a drifting branch costs more than a half-finished state) this removes the branch that drifts, the strands that only merge `main` in (0028/C) and the wait for one large final PR. The default stays `epic` (user, 2026-11-19).

## Working at the end

A goal planned with `delivery: main` runs three strands; each lands on `main` through its own PR with its status and log, and a closing review reads the whole range.

## Strands (titles only)

- Spike: where the plan, the log and the Done stamps live without a braid branch, and what the board shows
- Commands: `braid start`, `braid next`, `braid accept` and `braid wait` for strands whose base is `main`
- Skills and workflow: planning, running and finishing a goal delivered into `main`, with the closing review
- Docs and the board

## Open questions

- The plan: a planning PR into `main`, or the first strand's PR carries it?
- The coordinator has no branch of its own: do log entries, plan changes and Done stamps ride in each strand's PR, as a story's do?
- D31 moved planning off `main` because `main`'s copy of each subtask hid its progress on the board. Does that return?
- What a preset's `merge: strands` means here: a strand's merge is a merge into `main`.
- The closing review: who starts it, on which range of commits, and where its fixes go.
- Abandoning a half-done goal means reverts on `main`: is a rule needed, or only a warning in the plan?
- How this meets the idea of a ledger on its own branch (2026-11-18-lpz8), which would answer several of these.

Plan it fully when its turn comes, asking the user if needed.
