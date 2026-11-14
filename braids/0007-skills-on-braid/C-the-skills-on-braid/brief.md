---
id: '0007/C'
title: "The skills on braid"
status: Done
labels: ["kind:story", "tier:L", "ask:process"]
dependencies: ['0007/B']
order: 30
---

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

## Acceptance

- [x] No skill, template, BRAID.md, AGENTS.md or README text tells an agent to call backlog, except to run braid import-backlog once
- [x] The skills use braid commands or direct edits plus braid check for every item operation, and braid/... branch names
- [x] The Outline step, the report rule, the converge loop, decided-means-documented, side ideas and the CI-tick rule are in the skills, each in a few lines
- [x] A new decision replaces D30 in docs/decisions.md
- [x] npm run verify passes; CI green on Windows and Ubuntu

## Definition of done

- [x] The gate command from BRAID.md passes
- [x] Final summary written: what changed, why, validation, anything open

## Plan

1. braid skill: SKILL.md (project facts, ground rules, plan, run, grow, accept, auto, finish, resuming) moves from backlog calls to `braid` commands and direct edits of brief.md/report.md plus `braid check`; IDs `0012` and `0012/A`; "parent" becomes the braid, "subtask" the strand; milestones, backlog-config.yml and the backlog.exe lookup go; stop and tell the user when `braid` is missing or the project has backlog/ and no braids/.
2. assets/task.md becomes assets/brief.md: the brief template (front matter via `braid new`/`strand new`, body sections Goal, Expected size, Start here, Change, Already decided, Out of scope, Acceptance, Definition of done) and the command sheet (new, strand new, edit, brief, log, report, list, view, check). Outline braids described there.
3. references/workflow.md: items are braids and strands; branches braid/<n>-<slug> and braid/<n>/<L>-<slug> (plan/<slug> stays); the board is `braid board`; Outline status; dropped strands are removed with a log entry; failure modes trimmed of Backlog.md rows.
4. Additions, a few lines each: Outline step (coordinator, after a merge); report rule (worker rewrites report.md after a fix round, history in its log); converge loop (worker proposes and stops; coordinator logs each verdict); decided means documented (worker); side ideas get a home (coordinator); CI-tick rule (worker's last commit ticks CI and sets Done after green); worktree removal after the worker's session ends, retry; workers stop servers/browsers before reporting.
5. braid-worker and braid-reviewer: drop the brief-file/task dual mode (one version, braid only), use `braid view`, `braid log`, report.md; stop-cases (three identical copies): "task files" wording.
6. assets/braid-md.md and BRAID.md: drop `backlog:` and the Backlog.md facts, name `braid`; AGENTS.md and README: braids/ and braid, setup steps (installer, import-backlog, .gitignore temp line), `braid board`; ci.yml push trigger braid/* and braids/** ignored (epic/** kept until TASK-7 ends).
7. docs/decisions.md: D32 replaces D30; D31 and D29 reworded for braids; decision log entry.
8. scripts/Test-BraidBacklogFlow.ps1 replays the Backlog.md commands from task.md and is not in the gate: remove it.
9. npm run verify; PR into epic/task-7-skills-on-braid; CI green; tick CI criterion and set Done in the last commit.
