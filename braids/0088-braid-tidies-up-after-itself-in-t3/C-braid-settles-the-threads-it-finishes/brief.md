---
id: '0088/C'
title: "braid settles the threads it finishes"
status: To Do
labels: ["kind:story", "tier:L"]
dependencies: []
order: 30
---

## Goal

Threads braid finishes don't stay unsettled in T3, where each one with a branch costs a PR-sweep lookup a minute while a T3 window is in use (0083, "What else loads the machine", finding 5, and recommendation 9). A worker's thread is settled once its PR is merged, a reviewer's once its review is posted, and a coordinator's own thread once its braid closes. braid's code has no way to settle (T3's CLI can't, and its MCP client isn't in `main`), so this is skill steps with T3's `t3_thread_organize {action: "settle", threadId}`, where the skills already act on those events.

Expected size: about 40 lines in 4 files (skills and their references).

## Start here

- `.agents/skills/braid/SKILL.md`: "Accept and hand over" step 6 "After the merge" (step 1 cancels a running task: settle there), "Finish" and "Merge on request" (the coordinator's own thread at the braid's end), the reviewer's result in "Accept and hand over" step 1.
- `.agents/skills/braid-pm/SKILL.md`: when a braid closes under a PM, and the PM's own checker threads.
- `.agents/skills/braid/references/workflow.md` and `references/autonomy.md` ("Merging", step 3): the other places a merge is made.
- The goal's "Already decided" for the live list of what T3 leaves unsettled.

## Change

- The braid skill: after an item's merge, settle its worker child and its reviewer children; after a reviewer's review is posted and read, settle the reviewer child; when the braid closes (the final PR merged, or a story's PR merged), settle the coordinator's own thread as the turn's last step. Without T3 (no `t3_thread_organize`), skip.
- The braid-pm skill: settle a PM checker thread once its check is read; nothing for the PM's own thread.
- The fewest words: one line per place, in the skills' style. No new state, no record of what was settled.

## Already decided

- 0080's coordinator, 2026-11-28: 0080 builds nothing for settling; these skill steps settle coordinators and their children (0080/G, auto-settle off, was dropped by the user).
- A settle is reversible (`unsettle`) and changes nothing but T3's lists; a later message to a settled thread is still delivered (check this on a scratch thread and note it).
- Skill changes are the user's merge: the final PR into `main` is the user's.

## Out of scope

- Settling old threads already left unsettled (0088/E), and archiving.

## Failure modes and required checks

- A settle of a thread still working (a worker fixing review findings): only after the merge, never before; a check on a scratch thread that a settled child still receives `t3_thread_send` and runs.
- A coordinator that settles itself before its last message: the step is the turn's last, and a settle of the calling thread applies at turn end anyway.

## Completion

- [ ] The braid skill settles a worker's and a reviewer's child after the item's merge, a reviewer's child after its review is read, and the coordinator's own thread when the braid closes; the braid-pm skill settles a checker thread once read
- [ ] On scratch threads (`t3_thread_launch` `scratch: true`, archived afterwards): a settle by `t3_thread_organize` works on a child and on the calling thread, and a settled child still takes a message and runs; recorded in report.md
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
