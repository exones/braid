---
id: '0064/D'
title: "Skills: the board pauses, coordinators and PMs follow"
status: Done
labels: ["kind:task", "tier:M", "ask:process"]
dependencies: ['0064/A', '0064/C']
order: 40
---

## Goal

The braid, braid-pm and braid-worker skills say that the board pauses and resumes. Coordinators and PMs keep only the check before a launch. They keep no limits check task, schedule no resume, and act on the board's pause and resume messages. This strand changes agent instructions, which the user asked for in this braid (2026-11-22); `steady` asks about it at the final PR, and the user merges that.

Expected size: about 150 lines of text in 4 files (0064/A's estimate).

## Start here

- `braids/0064-the-board-watches-provider-limits/A-spike-steering-thread-board-limits-view/report.md`, Q2 (the message variants), Q3 and Q4; 0064/C's report (the messages as built).
- `.agents/skills/braid/references/limits.md`; the braid skill's "Run an item" (steps 1 and 3), "Launched by a PM" (its "Provider limits" bullet) and "Finish" step 0; `.agents/skills/braid-pm/SKILL.md`; `.agents/skills/braid-worker/SKILL.md`.

## Change

- `references/limits.md` rewritten:
  - the board pauses and resumes;
  - coordinators and PMs keep the check before a launch: on exit 3 launch nothing, say so once, end the turn;
  - what a coordinator and a PM do on the board's pause message (reply `Paused: <number>` or `Paused: pm`) and on its resume message;
  - what happens without a running board (nothing pauses; the user says go on);
  - weekly windows (the board's Needs You; the user moves a role in `BRAID.md`).
- Remove from limits.md, the braid skill and braid-pm: the 15-minute check task, the wait-timeout check, the resume task and `braid pause`/`braid resume` by agents.
- braid-worker: its pause and resume steps stay. Check that they still match the steering thread's message; say so in the report.
- Mention the `models.steering` role (first and fallback lines) where the skills list `BRAID.md` roles.

## Already decided

- See the braid's brief, including "Decided after spike 0064/A".
- Plans on top of 0062/E's skill changes ("Launched by a PM", braid-pm): merge `main` into the braid branch first.

## Out of scope

- Product code. Editing this repository's `BRAID.md` (the user's edit).

## Completion

- [x] The skills have no limits check task, wait-timeout check or resume task of their own; the check before a launch stays
- [x] What a coordinator, a PM and a worker do on the board's pause and resume messages is stated once, matching 0064/C's messages
- [x] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open

## Plan

Rewrite `references/limits.md` around the board; drop the check task, wait-timeout check and resume task and agents' `braid pause`/`braid resume` from limits.md, the braid skill and braid-pm; use C's messages verbatim; mention `models.steering`; fix the getting-started paragraph.
