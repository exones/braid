---
id: '0061/D'
title: "Pause and resume in the skills"
status: To Do
labels: ["kind:task", "tier:L", "ask:process"]
dependencies: ['0061/A', '0061/B', '0061/C']
order: 40
---

## Goal

The braid, braid-pm and braid-worker skills carry the pause and resume protocol, so a coordinator or PM checks limits before every launch, pauses its agents cleanly when a provider crosses its threshold, and resumes them by itself after the reset. Agents on other providers keep running.

Expected size: about 120 lines across 4 to 5 skill and reference files.

## Start here

- `braid view 0061` and its log: the settled rules (reading rules, unknown never pauses, defaults 97% session and 95% weekly, buffer 5 min, weekly windows also ask the user, no snooze, no hard-stop handling).
- `braids/0061-…/A-…/report.md`, "For 0061/D": the measured protocol this brief takes over (resume task, pause message, waiting for the clean point, PM-run braids).
- `docs/cli.md`: `braid limits` (0061/B) and `braid pause` / `braid resume` (0061/C), their flags, JSON fields and exit code 3.
- `.agents/skills/braid/SKILL.md`: "Run an item" (launch, wait), "Accept and hand over" step 1 (reviewer launch), "Plan" step 2 (researchers), "Launched by a PM", "Talking to the user" ("Say waiting").
- `.agents/skills/braid-pm/SKILL.md`: "Running" (launching coordinators) and "Resuming".
- `.agents/skills/braid-worker/SKILL.md`: "Work" and "Habits".

## Change

- **braid skill**, a new section "Provider limits" (or a reference file `references/limits.md` linked from it, if it is long), and one line at each launch point that points to it:
  - **Check before launch.** Before launching a worker, reviewer, researcher or spike, run `braid limits --role <role> --kind <kind>` (or `--tier`) for the model that agent will use. Exit 0 (`ok` or `unknown`): launch; on `unknown` say so in one line. Exit 3 (`pause`): don't launch; pause the braid.
  - **Pause.** Send each running or idle agent of this braid on that provider (workers; a running `delegate_task` child too) a pause message with `t3_thread_send` `mode:"auto"` (never `queue`: it arrives only after the whole turn). The message: "Pause for <provider> <window> until <resume time>. Finish or undo your current step; never stop mid-commit. A running command may already have moved to the background: let it finish. Commit and push your WIP, log a checkpoint (`braid log --checkpoint`), send `Paused: <id> at <sha>` to <coordinator thread>, end your turn. Start no new work until a resume message; if something wakes you meanwhile (a background command, a PR watch), note it, include your item's CI result in a short reply if that is what woke you, and end your turn again."
  - **Wait for the clean point.** `t3_thread_wait` each paused thread and read its last message for the `Paused:` line; a wait cut short by an incoming message is re-checked, not taken as the result.
  - **Schedule the resume** in the coordinator's own thread: `schedule_task` with `{type:"interval", everyMs: max(60000, resumeAt − now)}`, bound to this thread, title `braid <number> resume <provider>`. Its prompt starts with deleting itself (`delete_scheduled_task <id>`), then re-checks `braid limits`. Never `fixed_time` (skipped when T3 was down for over 10 min). Prefer a one-shot (`once`) when the `schedule_task` schema offers it.
  - **Record it:** `braid pause <number> --provider <id> --thread <own thread id> --task <scheduled task id>`, so the board shows the pause. Then end the turn with `⏳ Paused for <provider> <window>; resumes at <time>`.
  - **Resume.** The scheduled run deletes its task first, then `braid limits`: exit 0 (`ok`, or `unknown`: a stale cache or a past `resetsAt`, as on 2026-11-21) sends `Resume: continue <id> from your checkpoint` (`mode:"auto"`) to each paused thread, runs `braid resume <number>`, and goes on with the braid where it left off. Exit 3: schedule a new resume at the new resume time and update the pause (`braid pause` again with the new `--task`).
  - **A resume prompt for a braid no longer paused** (the user resumed by hand; a deleted task's run was already queued) just ends.
  - **Weekly windows:** pause and schedule as above, and also `braid ask <number> "<what is needed>" --kind decision` with the options *Wait for the reset* and *Move <role> to another provider* (the user edits `BRAID.md` `models`). Never switch providers yourself.
  - **The user asks for a pause** ("pause, limit close"): the same steps, with `braid pause --until <resetsAt + buffer>` when `braid limits` doesn't say `pause` yet.
  - Only agents on the paused provider stop; launches on other providers go on (a Codex worker while Claude is paused).
- **Launched by a PM**, in the braid skill: a PM-run coordinator doesn't schedule its own resume. On the PM's pause message it pauses its agents as above, `braid pause --by pm` is the PM's, and it replies `Paused: <number>` to the PM; it resumes its agents on the PM's resume message.
- **braid-pm skill:** before launching a coordinator, the same check for the coordinator's model. When a provider crosses its threshold, the PM pauses every braid it runs on that provider: steers each coordinator (`mode:"auto"`), runs `braid pause <number> --by pm --thread <PM thread> --task <id>` for each, and schedules one resume in its own thread; on resume, `braid resume` each and tells each coordinator to resume. The digest names the pause.
- **braid-worker skill**, "Habits": on a pause message, do what it says and wait; on `Resume:`, read your last checkpoint and go on.
- **braid-reviewer and braid-researcher:** no change. They run as short `delegate_task` children; the launch check covers them, and a running one gets the pause message like any running agent.
- `.agents/skills/braid/references/workflow.md` "Failure modes": one row, "a provider crosses its usage threshold" → the skill's "Provider limits".

## Already decided

- The coordinator or PM pauses; the board only shows it (0061/A, D86).
- No hard-stop detection or recovery; no snooze (the user, 2026-11-21).
- A scheduled task survives a T3 restart (the user checked it many times).
- Measured 2026-11-21 in this braid: a worker reached its clean point about 1 minute after an `auto` pause message; the `interval` resume fired on time; at the resume the cache was 25 min stale with a past `resetsAt`, which reads as go.

## Out of scope

- A periodic limit check while the coordinator waits on a long-running worker, unless the user picks it in the go for this strand.
- Product code; `BRAID.md`, `AGENTS.md`, `CLAUDE.md`.

## Failure modes and regression tests

- A resume task that repeats: its prompt deletes it first; a repeat that finds the braid not paused ends.
- A pause message that never gets a `Paused:` reply (the thread ended, the session died): after the wait, read the thread's last message and the branch; record what is known in the braid log and pause anyway.
- A resume while still over: reschedule; never resume into a limit.
- Tests: the Pester or node checks the repo already runs on skills (links, names) pass; no new product tests.

## Completion

- [ ] The braid skill has the check before every launch, the pause, the wait for the clean point, the scheduled resume, the resume, weekly windows and the user-asked pause, with exact commands
- [ ] The PM-run case is covered in the braid skill's "Launched by a PM" and in braid-pm
- [ ] braid-worker says what a worker does on a pause message and on resume
- [ ] workflow.md has the failure-mode row
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
