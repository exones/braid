---
id: '0064/C'
title: "The board pauses and resumes through a steering thread"
status: Outline
labels: ["kind:story", "tier:L"]
dependencies: ['0064/A', '0064/B']
order: 30
---

## Goal

When a provider goes over its threshold, the board starts a steering thread. That thread pauses every running agent on the provider and records the pause. After the reset plus the buffer, the board re-checks and resumes. Outline: detailed from 0064/A's report once the user has reviewed it.

Expected size: about 450 lines in 8 files; A's report sets it.

## Start here

- 0064/A's report; `src/commands/board.ts` (Start's `t3 thread start`), `src/board/t3.ts`, `src/braids/pauses.ts`, `src/commands/pauses.ts`.

## Change

- From A's report.

## Already decided

- See the braid's brief. Starts after 0062 merges into `main`.

## Out of scope

- Skill changes (D).

## Completion

- [ ] Over a threshold the board starts one steering thread per provider and pause; it pauses every running agent of the braids on that provider and records `braid pause --by board`; braids on other providers are untouched
- [ ] The board resumes at reset plus buffer after a re-check, schedules a new resume when still over, and resumes on start a pause it missed
- [ ] Tests cover the decisions with a fake T3 and fake limits; a live run is reported
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
