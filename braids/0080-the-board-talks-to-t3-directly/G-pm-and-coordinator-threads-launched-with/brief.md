---
id: '0080/G'
title: "PM and coordinator threads launched with auto-settle off"
status: To Do
labels: ["kind:task", "tier:L", "ask:process"]
dependencies: []
order: 70
---

## Goal

PM and coordinator threads run for days and wait often; T3 auto-settles a quiet thread out of the active list (T3 #33995 made sends un-settle them). The user agreed ("D. Ok, add") that PM and coordinator threads are launched with auto-settle off. This strand adds that one step where those threads are launched, if T3 offers an agent a way to do it.

Expected size: about 10 lines in 2 to 3 skill files, or a report only.

## Start here

- `~/.braid/artifacts/braid/p27-t3-tests/t3-src-v0.1.12/Orchestrator.ts`: `thread.auto-settle.set` (about line 5126) exists as an internal command; in v0.1.12 neither `t3_thread_launch` nor `t3_thread_organize` (pin, snooze, settle, archive) has an auto-settle option, and `t3 thread` has none either.
- The T3 tool list as installed now (`orchestrator_capabilities`, the `t3_thread_launch` and `t3_thread_organize` schemas): T3 may have added the option since v0.1.12.
- `.agents/skills/braid/SKILL.md` ("Plan" step 0, the coordinator launch) and `.agents/skills/braid-pm/SKILL.md` (its coordinator launches, and how a PM thread itself starts).

## Change

- First check whether an agent can turn auto-settle off at launch or right after (a launch field, an organize action, a CLI flag). Write what you found to the log.
- If it can: one short line at each launch step that starts a PM or coordinator thread, in the skills' existing style; nothing else in the skills changes.
- If it can't: no skill change. Stop and report to the coordinator what exists (pinning, for example, and whether it keeps a thread from settling), so the PM and the user decide; don't pick a substitute yourself.

## Already decided

- The user agreed to the line (2026-11-25, "D. Ok, add"); it merges with the braid's final PR, which is the user's merge.
- Skills grow by this line only ("don't overblow skills").
- Runs after 0074, 0072 and 0060 are in `main` and merged into this braid: they change the same skill files.

## Out of scope

- Any other skill change; settling or archiving finished threads.

## Completion

- [ ] The log says whether T3 lets an agent launch a thread with auto-settle off, and how
- [ ] If it does, each PM and coordinator launch step has the line; if not, report.md says what exists and no skill changed
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
