---
id: TASK-1.1
title: >-
  Stop cases and plan review: when braid waits for the user, and where that is
  recorded
status: In Progress
assignee: []
created_date: '2026-11-12T17:28:00Z'
updated_date: '2026-11-12T20:07:00Z'
labels:
  - kind:task
  - tier:L
milestone: m-0
dependencies: []
parent_task_id: TASK-1
ordinal: 10
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Goal: one shared list of the cases where `braid` must wait for the user, and a fixed place where each role records them, so the coordinator, worker and reviewer flag the same things in the same words. In normal mode the cases only appear in plans and recaps; auto mode (TASK-1.3) refuses to merge on them. Also: the user reviews a plan as real task files before it is pushed, a goal's parent keeps a log that carries each finished subtask's report and history to the next worker, and each goal is one milestone so the board groups it in one lane.

Expected size: about 170 lines in 8 files.

Start here (read in this order):
- `.agents/skills/braid/SKILL.md`: "Plan" steps 3-6, "Accept", "Adjusting the plan", "Resuming" and "Talking to the user" (the recap).
- `.agents/skills/braid-worker/SKILL.md`: Deliver step 0 and "Final report".
- `.agents/skills/braid/assets/task.md`: Fields and labels.
- `README.md`: "Braid skills in other projects" (the board).
- `scripts/Test-DocsGate.ps1`: skill folders must be self-contained; a link can't reach into another skill.

Change:
- New `.agents/skills/braid/references/stop-cases.md`: the 8 cases, each with its key, one line of meaning and examples:
  - `security`: authentication or authorization, permissions, secrets, cryptography, sandboxes or tool restrictions, handling of untrusted input, network exposure, logging of personal data.
  - `dependency`: a new library or tool, a major version bump, a new external service or paid API, a licence change.
  - `architecture`: a new module, service, process or storage; a changed public API, CLI, config or file format; a refactor across many files.
  - `data`: a migration, a changed stored format, deleting or rewriting user data, a backward-incompatible change.
  - `process`: skills, `AGENTS.md`, `CLAUDE.md`, `BRAID.md`, CI workflows or the gate; deleted, skipped or weakened tests.
  - `outward`: publishing, releasing, deploying, sending messages, anything irreversible outside the repository.
  - `scope`: a change to the goal or acceptance criteria, growth beyond the mandate, new tier L work, a deviation from the task.
  - `quality`: still blocking after 2 fix rounds, worker and reviewer disagree, the same check fails twice, a merge conflict outside task files, a worker that fails twice.
  The same file says who records what: the plan (`ask:<key>` labels the coordinator adds where the plan already shows a case); the worker (a `Needs the user:` line in its final summary); the reviewer (a section in its PR comment, TASK-1.2); and the coordinator's diff facts as runnable commands (`git diff --name-status <base>...<head>` and the added lines): changed dependency manifests or lockfiles (the common ones by name), changed `.github/workflows/`, `BRAID.md`, `AGENTS.md`, `CLAUDE.md` or `.agents/skills/`, deleted test files or added skip/only markers in tests, a diff over twice the task's expected size.
- An identical copy in `.agents/skills/braid-worker/references/stop-cases.md`.
- `braid` SKILL.md, stop cases: planning adds `ask:<key>` labels and the plan shown to the user lists them; the recap gets a `**Needs the user:**` line (`none`, or each case with its source: plan, worker, reviewer or facts); the user's answer goes into the parent's notes.
- `braid` SKILL.md, "Plan" steps 4-5: the plan is reviewed as real tasks before anything is pushed.
  - Create the tasks on the branch in the coordinator's worktree: `plan/<slug>` from `main` for a goal, `item/<id>-<slug>` from `origin/main` for a story. Give the user links to the task files.
  - Each round of the user's comments is one local commit, `docs(backlog): <id> amend: <what>`. Check `git diff` first so that only the intended lines changed, then tell the user briefly what changed in that round (no pasted diff).
  - On approval, squash the round commits into one `docs(backlog): plan <id>` and push once. A story's worker then starts on that branch; a goal's planning PR opens and the user's merge records the approval.
  - "Resuming" also checks local `plan/` and `item/` branches that haven't been pushed.
- The parent's log, for a goal or grown story:
  - After each subtask merges into the epic branch, and before the next item's branch is cut, the coordinator appends one dated entry with `backlog task edit <parent> --append-notes` and commits it on the epic branch.
  - Every item gets an entry, even when nothing unusual happened: the item, its PR and merge sha, a short report of what was done, what later items must know (or `none`), plan changes since the last entry and why, and the user's decisions. A few lines; the PR holds the detail.
  - Then the coordinator fixes any task that hasn't started and that the entry makes wrong, as a plan change (goal, acceptance criteria or new tier L work go to the user first).
  - Workers already read the parent, so the log reaches them; a resuming coordinator reads it too. "Resuming"'s rule on parent notes points to the log. `workflow.md` names the log in one line.
- A goal is one milestone, for board grouping only:
  - When planning a goal, or when a story grows into an epic, the coordinator creates a milestone `<ID> <short title>` whose description is one line pointing to the parent, and creates the parent and every subtask, including later ones, with `--milestone`. Stories get none. Never archive it: an archived milestone's tasks fall into "No milestone".
  - The coordinator sets the parent `In Progress` in its first commit on the epic branch.
  - `assets/task.md`: the commands; `workflow.md`: the table rows; README: view the board with "Group by milestone".
  - Check whether two plan branches can get the same milestone ID; if they can, the skill says how to avoid it.
- `braid-worker` SKILL.md: the final summary gets a `For later items:` line (changed names or interfaces, deviations from the plan, new decisions, or `none`).
- `braid-worker` SKILL.md: the final summary and the chat report carry `Needs the user: none` or `<key>: <one sentence>` per case, judged against the list.
- `.agents/skills/braid/assets/task.md`: the `ask:<key>` label.
- A check in the gate (Pester or the docs gate) that fails when the copies of `stop-cases.md` differ.

Already decided (don't re-investigate):
- Keep the skill text short, as the parent's rule says; give the before and after line counts of changed skill files in the final summary.
- The milestone only groups; the parent task holds the goal, decisions and log (Backlog.md's maintainer treats milestones as epics, MrLesk/Backlog.md#581). TASK-1 already uses `m-0` this way.
- No project-specific path masks; the diff facts are generic and need only `git` and `gh`.
- No helper script: the facts are commands in the reference file, usable from bash and pwsh.
- Normal mode changes only by the plan labels and the recap line.
- Plans stay local until the user approves; no round is pushed, so no force-push or squash merge is needed.

Out of scope:
- Auto mode and merging (TASK-1.3).
- The reviewer skill and its copy of the list (TASK-1.2).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 stop-cases.md exists in braid and braid-worker with the 8 keys, and the gate fails if the copies differ
- [ ] #2 The worker final summary and chat report formats include the Needs the user line
- [ ] #3 Planning documents ask:<key> labels and the recap shows Needs the user with its source
- [ ] #4 The diff facts are listed as runnable git/gh commands
- [ ] #5 npm run verify passes
- [ ] #6 The plan of a goal or story is reviewed as task files in the coordinator's worktree, one local commit per round with a brief note of what changed, and pushed once, squashed into one commit, after the user's approval
- [ ] #7 After each subtask merges into the epic branch the parent's log has a short entry for it, written before the next item's branch is cut, and the worker's final summary has a For later items line
- [ ] #8 A goal's parent and subtasks share one milestone, shown as one lane with Group by milestone; the milestone is never archived; the parent is In Progress from the epic branch's first commit
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 The gate command from BRAID.md passes
- [ ] #2 Final summary written: what changed, why, validation, anything open
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. New `.agents/skills/braid/references/stop-cases.md`: the 8 keys with meaning and examples; who records what (plan `ask:<key>` labels, worker `Needs the user:` line, reviewer section, coordinator diff facts as git/gh commands). Identical copy in `braid-worker/references/`.
2. Docs gate (`scripts/Test-DocsGate.ps1`, part of `npm run verify`): a file with the same path under `references/` in two skills must be byte-identical. Negative case in `test/fixtures/docs-gate/Test-DocsGateNegatives.ps1`.
3. `braid` SKILL.md: plan steps 3-5 (ask labels, milestone, local review rounds, squash and push once), recap `**Needs the user:**` line, parent's log after each merged subtask, Resuming checks local plan/item branches and reads the log.
4. `braid-worker` SKILL.md: final summary gets `For later items:` and `Needs the user:`; chat report gets `Needs the user:`.
5. `assets/task.md`: `ask:<key>` label, milestone commands and the ID-collision check; `workflow.md`: milestone in the table, the log in one line; README: Group by milestone.
6. Run the gate, record before/after line counts in the final summary.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Milestone IDs: tested with backlog 1.55.3 in a temp repo. `milestone add` numbers from local files only, so two plan branches cut from the same main both get the same ID. Archived milestones still count, so archiving a colliding milestone and adding it again gives the next free ID. Labels outside config.yml are accepted.
<!-- SECTION:NOTES:END -->
