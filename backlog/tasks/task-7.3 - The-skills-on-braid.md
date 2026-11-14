---
id: TASK-7.3
title: The skills on braid
status: To Do
assignee: []
created_date: '2026-11-14T11:18:00Z'
updated_date: '2026-11-14T12:10:00Z'
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
- [ ] #1 No skill, template, BRAID.md, AGENTS.md or README text tells an agent to call backlog, except to run braid import-backlog once
- [ ] #2 The skills use braid commands or direct edits plus braid check for every item operation, and braid/... branch names
- [ ] #3 The Outline step, the report rule, the converge loop, decided-means-documented, side ideas and the CI-tick rule are in the skills, each in a few lines
- [ ] #4 A new decision replaces D30 in docs/decisions.md
- [ ] #5 npm run verify passes; CI green on Windows and Ubuntu
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 The gate command from BRAID.md passes
- [ ] #2 Final summary written: what changed, why, validation, anything open
<!-- DOD:END -->
