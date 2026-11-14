---
id: '0008'
title: "Coordinator commands"
status: To Do
labels: ["kind:story", "tier:L"]
dependencies: ['0007']
order: 80
delivery: epic
---

## Goal

Story 5 of the braid plan, first cut (user, 2026-11-14): `braid status`, `next` and `start` take over steps the braid skills do by hand today (doc-2 in `archive/backlog/docs/`, "Skill step today → CLI candidate"), so the coordinator calls one command where it ran several, and the skills get shorter.

## Working at the end

A coordinator runs a braid with `braid status`, `next` and `start`; the skills call them instead of describing the steps; the `epic/**` CI trigger is gone.

## Strands

- A. `braid status <number>` and `braid next <number>` (M).
- B. `braid start <id>`: strand branch, push, worktree (S).
- C. The skills call the commands; drop the `epic/**` CI trigger; "still blocking after two fix rounds" shows on the board (M).

`braid facts`, `recap` and `merge` follow in braid 0014, after the user tries this cut.

## Already decided

- Plain text output for agents, no JSON (doc-5). Commands read; only `start`, `merge` and `log` change things, and each says what it did.
- Reuse the board's sources: branch copies (`src/braids/branches.ts`), GitHub (`src/board/github.ts`), T3 (`src/board/t3.ts`) and `derive` (`src/board/model.ts`).

## Acceptance

- [ ] All three strands are Done on the braid branch
- [ ] The braid skills use status, next and start, and a braid run uses them end to end

## Definition of done

- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
