---
id: '0060/C'
title: "Skills: workers as subagents, the coordinator watches CI"
status: To Do
labels: ["kind:task", "tier:L", "ask:process"]
dependencies: ['0060/A', '0060/B']
order: 30
---

## Goal

The skills launch workers, reviewers and researchers through `braid launch` and `delegate_task`, follow up workers in their own child thread, and let the coordinator watch item PRs while CI runs; the worker ends its run at an open PR and reports by its final message. The skills come out shorter: the launch prose, the watch rule and the worker's CI steps shrink.

Expected size: about 150 lines changed in 7 files, a net decrease.

## Start here

- The braid's "Already decided" (all of it) and `sources.md` S8-S10.
- `.agents/skills/braid/SKILL.md`: "Plan" step 2 (Research), "Run an item" (all), "Accept and hand over" step 1, "Fixes", and the "Say waiting" line of "Talking to the user".
- `.agents/skills/braid-worker/SKILL.md`: "Start", "Deliver" steps 3-5, "Habits" (first message seen again).
- `.agents/skills/braid-reviewer/SKILL.md`, `.agents/skills/braid-researcher/SKILL.md`: how they are launched and report.
- `.agents/skills/braid/references/workflow.md` ("Checks and reports", "Failure modes"), `references/limits.md` ("Check before launch").
- `docs/decisions.md` D69, D75, D77: what is reversed and why.

## Change

- Coordinator: one launch recipe for all three roles: `braid launch <id> --role <role>` (exit 3: launch nothing, as now), `delegate_task` with the printed input, `braid launch <id> --role <role> --child <child thread id>`, and `link_pull_request` for a reviewer. It replaces the three launch passages and their first-message templates.
- Coordinator, after a worker's result: with checks pending, `watch_pull_request` and end the turn; on the CI wake, red goes to the worker with `t3_thread_send`, green goes to review. The watch rule becomes "watch every PR you wait on; unwatch at the handover or after the merge". Fixes, review findings and verdicts go to the worker's child thread with `t3_thread_send`, as now.
- Worker: switch T3's checkout to the item branch; take its thread id from `orchestrator_capabilities`; after the PR, `link_pull_request`, then end the run with the final report and the last line `PR <url>, head <sha>, checks <state>`; no watch, no `t3_thread_send` report. On a follow-up it fixes, pushes and ends the same way. With `review-bots`, the coordinator's green message asks it to handle the bot threads.
- Spikes run as worker children too (D75's top-level spike).
- `references/limits.md` "Check before launch": the check now runs inside `braid launch`; keep only what the coordinator does on exit 3. Don't touch its pause and resume sections (0074's).
- `workflow.md`: "Checks and reports" and "Failure modes" say who waits on CI now.
- The decisions record: a new decision amending D69 (workers stay top-level), D75 (spikes top-level) and D77 (the worker alone waits on CI), with the reasons from S8-S10.
- Line count: the braid skill with its references and `assets/brief.md`, plus braid-worker and braid-reviewer, total 716 lines on `main` at 15da4fd2; the PR leaves them shorter. Put before and after in report.md.

## Already decided

- See the braid's "Already decided". This strand edits skills, which the user asked for through the programme (P8); the final PR into `main` is the user's merge.
- The one line in an ask section this strand changes is "Say waiting" in "Talking to the user"; 0072 owns the rest of that section and the requests.

## Plan

1. braid skill: one "Launch a subagent" section (`braid launch`, `delegate_task`, `--child`, `link_pull_request` for a reviewer, end the turn, follow-ups by role) replaces the researcher, worker and reviewer launch passages and their first-message templates; "Run an item" step 3 becomes the worker's result and the CI wake (pending: watch; red: to the child; green: review); the watch rule shortens to "watch every PR you wait on"; "After the merge", "Fixes" and "Say waiting" follow.
2. braid-worker: switch T3's checkout, thread id from `orchestrator_capabilities`, talk to the coordinator by ending the run; "Deliver" steps 3-5 shrink to one step ending with `PR <url>, head <sha>, checks <state>`; follow-ups (red CI, review findings, bot threads) in one paragraph.
3. braid-reviewer: the report is the task result only (no `t3_thread_send`).
4. workflow.md "Starting the next item", "Checks and reports", "Failure modes"; limits.md "Check before launch" down to exit 3.
5. `src/commands/launch.ts`: drop the "Send your result to" lines from the worker's and reviewer's first message, which would ask for the double report the brief removes (test updated).
6. docs/decisions.md D107 amending D69, D75, D77, and its log line; docs/getting-started.md lines that say workers are top-level and wait on CI.
7. Line count before (716) and after in report.md; gate.

## Out of scope

- The pause and resume texts in the skills and limits.md (0074). The braid-pm skill, except a line it may need if it names how workers are launched.

## Completion

- [x] The braid skill launches workers, reviewers and researchers through `braid launch` and `delegate_task`, and records each child
- [x] The coordinator watches an item PR while its CI runs and sends a red result to the same worker child; the worker no longer waits on CI or sends its report with `t3_thread_send`
- [x] The listed skill files total fewer lines than 716, with before and after in report.md
- [x] The decisions record has a decision amending D69, D75 and D77
- [x] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open
