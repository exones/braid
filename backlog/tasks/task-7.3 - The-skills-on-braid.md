---
id: TASK-7.3
title: The skills on braid
status: Done
assignee: []
created_date: '2026-11-14T11:18:00Z'
updated_date: '2026-11-14T12:23:00Z'
labels:
  - kind:story
  - tier:L
  - ask:process
milestone: m-4
dependencies:
  - TASK-7.2
parent_task_id: TASK-7
ordinal: 30
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Goal: the braid skills (coordinator, worker, reviewer) keep items in `braids/` through `braid` instead of Backlog.md, with the fewest wording changes, and learn the ways of working the user decided.

Expected size: about 400 to 700 changed lines across the skill files, templates and docs; the skills should get shorter, not longer.

Start here (read in this order):
- `.agents/skills/braid/` (`SKILL.md`, `assets/task.md`, `assets/braid-md.md`, `assets/backlog-config.yml`, `references/workflow.md`, `references/stop-cases.md`), `.agents/skills/braid-worker/SKILL.md`, `.agents/skills/braid-reviewer/SKILL.md`: every Backlog.md use.
- `docs/braids-format.md` and `braid help`: what replaces each `backlog` call.
- The parent's log (TASK-7.1 and TASK-7.2 entries) and README "Braid skills in other projects" for the missing-`braid` message.
- doc-5, story 4: the report rule, the Outline step and the three ways of working, in the user's words.
- `BRAID.md`, `AGENTS.md`, `README.md`, `docs/decisions.md` (D30, D31).

Change:
- Every `backlog` call becomes a direct edit of `brief.md` or `report.md` followed by `braid check`, or a `braid` command where it holds logic (`new`, `strand new`, `edit`, `log`, `report`, `list`, `view`). `assets/task.md` becomes a brief template. The Windows `backlog.exe` lookup, the milestone steps, "never edit task files by hand" and `assets/backlog-config.yml` go.
- Branches: `braid/<number>-<slug>` for a braid (its epic branch when it has strands) and `braid/<number>/<letter>-<slug>` for a strand, in the workflow and in every example. The parent's log becomes `braid log` entries on the braid; worker notes become `braid log` on the strand.
- When a project has `backlog/` and no `braids/`, or `braid` is missing, the coordinator stops and tells the user what to run (`braid import-backlog`; the installer).
- Added, short: the Outline step (when a braid merges, reread the next outline, detail it, set it To Do); the report rule (after a fix round the worker rewrites `report.md`, history in the log); the converge loop; "decided means documented"; side ideas get a home; the worker ticks the CI criterion only once CI is green; the coordinator removes a worker's worktree only after that worker's session has ended (on Windows its agent process holds the folder for a while after the report), and retries later if the delete fails; workers stop any server or browser they started before reporting.
- `BRAID.md` and `assets/braid-md.md` drop the Backlog.md facts and name `braid`; `AGENTS.md` and the README say `braids/` and `braid`; a new decision in `docs/decisions.md` replaces D30 (D31 keeps auto mode, reworded for braids).

Already decided (don't re-investigate): the parent TASK-7 and doc-5; one version of the skills, braid only; keep each skill's structure and rules, change only what the store changes plus the listed additions; skill instructions stay very concise.

Out of scope: the skills diet (TASK-3), coordinator commands (story 5), running the import here (TASK-7.4).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 No skill, template, BRAID.md, AGENTS.md or README text tells an agent to call backlog, except to run braid import-backlog once
- [x] #2 The skills use braid commands or direct edits plus braid check for every item operation, and braid/... branch names
- [x] #3 The Outline step, the report rule, the converge loop, decided-means-documented, side ideas and the CI-tick rule are in the skills, each in a few lines
- [x] #4 A new decision replaces D30 in docs/decisions.md
- [x] #5 npm run verify passes; CI green on Windows and Ubuntu
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 The gate command from BRAID.md passes
- [x] #2 Final summary written: what changed, why, validation, anything open
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. braid skill: SKILL.md (project facts, ground rules, plan, run, grow, accept, auto, finish, resuming) moves from backlog calls to `braid` commands and direct edits of brief.md/report.md plus `braid check`; IDs `0012` and `0012/A`; "parent" becomes the braid, "subtask" the strand; milestones, backlog-config.yml and the backlog.exe lookup go; stop and tell the user when `braid` is missing or the project has backlog/ and no braids/.
2. assets/task.md becomes assets/brief.md: the brief template (front matter via `braid new`/`strand new`, body sections Goal, Expected size, Start here, Change, Already decided, Out of scope, Acceptance, Definition of done) and the command sheet (new, strand new, edit, brief, log, report, list, view, check). Outline braids described there.
3. references/workflow.md: items are braids and strands; branches braid/<n>-<slug> and braid/<n>/<L>-<slug> (plan/<slug> stays); the board is `braid board`; Outline status; dropped strands are removed with a log entry; failure modes trimmed of Backlog.md rows.
4. Additions, a few lines each: Outline step (coordinator, after a merge); report rule (worker rewrites report.md after a fix round, history in its log); converge loop (worker proposes and stops; coordinator logs each verdict); decided means documented (worker); side ideas get a home (coordinator); CI-tick rule (worker's last commit ticks CI and sets Done after green); worktree removal after the worker's session ends, retry; workers stop servers/browsers before reporting.
5. braid-worker and braid-reviewer: drop the brief-file/task dual mode (one version, braid only), use `braid view`, `braid log`, report.md; stop-cases (three identical copies): "task files" wording.
6. assets/braid-md.md and BRAID.md: drop `backlog:` and the Backlog.md facts, name `braid`; AGENTS.md and README: braids/ and braid, setup steps (installer, import-backlog, .gitignore temp line), `braid board`; ci.yml push trigger braid/* and braids/** ignored (epic/** kept until TASK-7 ends).
7. docs/decisions.md: D32 replaces D30; D31 and D29 reworded for braids; decision log entry.
8. scripts/Test-BraidBacklogFlow.ps1 replays the Backlog.md commands from task.md and is not in the gate: remove it.
9. npm run verify; PR into epic/task-7-skills-on-braid; CI green; tick CI criterion and set Done in the last commit.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-11-14 Decisions: the worker skill drops its brief-file mode (epics/ era) since there is one version of the skills; assets/task.md is renamed assets/brief.md; the new decision is D33 (D32 is the attention board); scripts/Test-BraidBacklogFlow.ps1 is removed (it replayed the Backlog.md commands of task.md and was not in the gate); doc-1 is frozen in the link exclusions because it links the old task.md; ci.yml pushes run on braid/* (braid branches) and skip braids/**; a grown story's branch becomes its braid branch (same name), no separate epic branch; a dropped strand's folder is removed after a log entry (braids have no archive); BRAID.md here keeps a one-line note that items stay in backlog/ until TASK-7.4.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
What changed: the braid, braid-worker and braid-reviewer skills keep items in braids/ through the braid CLI instead of Backlog.md. Direct edits of brief.md and report.md plus `braid check`, and braid new, strand new, edit, brief, log, report, list and view where there is logic. assets/task.md became assets/brief.md (brief template and command sheet); backlog-config.yml, the backlog.exe lookup, milestones and "never edit task files by hand" are gone. Branches are braid/<number>-<slug> and braid/<number>/<letter>-<slug>; the parent's notes and log are `braid log` on the braid, worker notes `braid log` on the strand, the final summary is report.md. The coordinator stops and says what to run when braid is missing or a project has backlog/ and no braids/. Added in a few lines each: Outline step, report rule, converge loop, decided means documented, side ideas, CI-tick rule, worktree removal after the worker's session ends, workers stop servers/browsers. BRAID.md, its template, AGENTS.md and README name braids/ and braid; D33 replaces D30, D16/D29/D31 reworded; ci.yml pushes on braid/* and ignores braids/**. Test-BraidBacklogFlow.ps1 removed.
Why: TASK-7 story 4, the skills switch to braid's own store with one version of the skills.
Validation: npm run verify passes; the template's commands were run against the built CLI in a temp repository (new, strand new, edit --dep/--order/--labels, brief --file -, log --thread, check, view). Skills shrank from 9776 to 9038 words.
Open: this repository still tracks work in backlog/ until TASK-7.4; the coordinator keeps using the skills installed from main until then.
For later items: TASK-7.4 rewrites backlog/ links (docs/roadmap.md line 3 and 15 still describe Backlog.md as the store; doc-1's frozen exclusion can go when backlog/ moves) and removes the BRAID.md transition line; `delivery: main` braids are not used by the skills yet; `braid view` doesn't list strand dependencies, so "next ready strand" needs a look per strand (a candidate for story 5's `braid next`); the epic/** CI trigger can go after TASK-7.
Needs the user: process: the braid skills, BRAID.md, AGENTS.md and the CI workflow change (asked for in this task).
<!-- SECTION:FINAL_SUMMARY:END -->
