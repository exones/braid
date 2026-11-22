---
id: '0064/D'
title: "Skills: the board pauses, coordinators and PMs follow"
status: Outline
labels: ["kind:task", "tier:L", "ask:process"]
dependencies: ['0064/A', '0064/C']
order: 40
---

## Goal

The braid, braid-pm and braid-worker skills say the board pauses and resumes. Coordinators and PMs keep no limits check task, schedule no resume, and act on the board's messages. Outline: detailed from 0064/A's report. This strand changes agent instructions, which the user asked for in this braid (2026-11-22); the user merges the final PR.

Expected size: about 200 lines in 6 files.

## Start here

- 0064/A's report; `.agents/skills/braid/references/limits.md`; the braid skill's "Run an item", "Launched by a PM" and "Finish"; `.agents/skills/braid-pm/SKILL.md`; `.agents/skills/braid-worker/SKILL.md`.

## Change

- From A's report.

## Already decided

- See the braid's brief. Plans on top of 0062/E's skill changes ("Launched by a PM", braid-pm).

## Out of scope

- Product code.

## Completion

- [ ] The skills have no limits check task and no resume task of their own; what a coordinator, a PM and a worker do on the board's pause and resume messages is stated once
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
