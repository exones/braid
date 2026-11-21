---
id: '0061/A'
title: "Spike: scheduled resume, pause messages, and who pauses"
status: In Progress
labels: ["kind:spike", "tier:M"]
dependencies: []
order: 10
---

## Goal

Answer, with evidence, the questions the pause protocol (0061/D) and the paused state (0061/C) depend on, and recommend coordinator/PM-driven or board-driven pausing. Time box: 2 hours. The decision it feeds: the messages, waits and resume in D, and whether C's board also sends messages.

Expected size: `report.md` and `sources.md`, no product code.

Follow the braid-researcher skill's Method. Look at the T3 source (pingdotgg/t3code: the scheduler behind `schedule_task`, `t3_thread_send` and how a message to a running thread is queued or delivered) and the T3 tool descriptions; about 4 to 8 sources. Read each one rather than its title, record each in `sources.md` in the item folder in the [braid-researcher](../../../.agents/skills/braid-researcher/SKILL.md) source line format, and cite source ids (`[S1]`) for claims in `report.md`. Measure on this machine where it is cheap and safe: a `schedule_task` one-shot a few minutes out, then cancelled; a throwaway thread to message mid-turn; a T3 restart only if the user agrees. Never use real quota up to a limit.

## Start here

- `braid view 0061`: what is already established about the caches and the reading rules, and that the goal is only the pre-emptive pause; don't re-investigate either.
- `.agents/skills/braid/SKILL.md`, "Run an item": how the coordinator launches, messages and waits on workers today.
- `.agents/skills/braid-pm/SKILL.md`: how the PM launches and talks to coordinators.
- `braids/0060-workers-as-t3-subagents/` (`brief.md`, `sources.md`): what is already measured about `delegate_task` children, follow-ups and wakes.
- `src/board/t3.ts`: how the board reads threads today.

## Questions

1. `schedule_task`: does a one-shot survive a T3 restart; can it wake a specific existing thread (the coordinator's or the PM's) or only start a new one; how precise is its timing; how is it listed and cancelled (`list_scheduled_tasks`, `delete_scheduled_task`)?
2. Can a running worker thread, or a running `delegate_task` child (reviewer, researcher), receive a message mid-turn (`t3_thread_send` queues it, or interrupts)? When does a pause message reach it, and how does the coordinator know each thread has reached its clean point?
3. Coordinator/PM-driven or board-driven: confirm or overturn the braid brief's recommendation with what 1 and 2 found.

## Out of scope

- Building anything; editing skills, docs or `docs/roadmap.md`. Proposed changes go in `report.md` as follow-ups for C and D.

## Plan

1. Read the T3 scheduler, `sendToThread` and the provider steering code, both in upstream main and in the installed server bundle (the version in use).
2. Measure here: a `once` task (does the installed build take it?), a bound `interval` task left to fire into this thread mid-turn, then deleted; an unbound `fixed_time` task created and deleted; two throwaway `delegate_task` children on claude-haiku-5-5 messaged mid-command and mid-`t3_thread_wait` with `auto` and `queue`.
3. Leave out a T3 restart unless the user agrees.
4. Write `report.md` (Q1–Q3, proposals for C and D) and `sources.md`.

## Completion

- [x] `report.md` answers questions 1 to 3, each marked measured, read in source, or unknown, with a recommendation and proposed changes for 0061/C and 0061/D
- [x] Research items only: `sources.md` in the item folder (per source: id, link, version, access date, how it was read (whole, part, search result only), what it says, adopted or not and why), and `report.md` cites source ids for its claims
- [x] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open
