---
id: TASK-1.3
title: Auto mode and merge on request
status: Done
assignee: []
created_date: '2026-11-12T17:29:00Z'
updated_date: '2026-11-12T21:10:00Z'
labels:
  - kind:story
  - tier:L
milestone: m-0
dependencies:
  - TASK-1.1
  - TASK-1.2
parent_task_id: TASK-1
ordinal: 30
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Goal: on the user's request, `braid` merges a goal's subtask PRs into the epic branch itself when every condition holds and stops on any stop case (auto mode); and when the user explicitly asks to merge a PR, `braid` merges it in any mode (merge on request).

Expected size: about 190 lines in 9 files.

Start here (read in this order):
- `.agents/skills/braid/SKILL.md`: "Plan" step 5, "Accept and hand over", "Finish", "Resuming".
- `.agents/skills/braid/references/workflow.md`: Tiers, the "user merges every item PR" paragraph, Failure modes.
- `.agents/skills/braid/references/stop-cases.md` (TASK-1.1) and the `braid-reviewer` skill (TASK-1.2).
- `AGENTS.md`: Hard limits. `docs/decisions.md`: D28 and D30.

Change:
- `braid` SKILL.md, "Merge on request": the user asks to merge a named PR, or says "merge it" right after a recap that handed it over. Merge with `gh pr merge <pr> --merge --match-head-commit <sha of the last recap>`; if the head moved since the recap, show what changed and ask.
- `braid` SKILL.md, "Auto mode":
  - Switching on: the user asks, for one goal. Refuse, with the reason, if `BRAID.md` lacks `auto: allowed`, if `ci` is `none`, or for a story (its PR goes into `main`). Record an `auto` label and a dated note on the parent as a milestone commit on the epic branch; "stop auto" or "pause" removes them the same way.
  - Merge only when all hold: (1) the worker reported green; (2) on the PR branch the task is Done with every acceptance criterion and Definition of Done box checked; (3) an independent `braid-reviewer` review found nothing blocking, and for tier L any re-check is finished; (4) `gh pr checks` is green on the head commit for the `ci` names; (5) the PR is mergeable and its base is the epic branch; (6) `Needs the user: none` from all four sources: plan labels, worker, reviewer, diff facts; (7) the merge is pinned with `--match-head-commit` to the reviewed commit.
  - Evidence: before merging, a PR comment with the commit, the review link, the checks, the four Needs the user sources and "merged by braid auto mode".
  - After a merge: one line to the user; wait until the epic branch's CI is green on the merge commit before the next item; red means a fix subtask as now, a second red is a stop (`quality`).
  - Stops: any stop case; more than 2 blocking review rounds; branch protection refusing the merge (never `--admin`, never a bypass). On a stop: no merge, unwatch, a recap naming the case and its source, then wait. The user's answer goes into the parent's notes; "merge" from the user is merge on request.
  - Resuming: an `auto` label on the parent means continue in auto mode. The final epic to `main` PR is always handed to the user.
- Board status while a goal runs (`main` holds a copy of every task once the planning PR merges, and a branch's own copy always wins, so `main` shows the subtasks `To Do` until the final PR):
  - `braid` SKILL.md, Plan step 5 and `workflow.md`'s branch table: for a goal, create `epic/<id>-<slug>` from `main` first and open the planning PR from `plan/<slug>` into the epic branch; the user's merge is still the approval, and `main` gets the tasks with the final PR.
  - `braid-worker` SKILL.md: push the `In Progress` commit at once, before coding.
- `references/workflow.md`: who merges what (the user; on request; auto into the epic) and failure-mode rows for branch protection, a red epic CI and a moved head.
- `assets/braid-md.md`: `auto: allowed` (absent means not allowed) with one line on what it allows. `BRAID.md` of this repository: `auto: allowed`.
- `AGENTS.md` hard limit: agents merge only on the user's explicit request, or into an epic branch in auto mode (braid skill); everything into `main` is the user's merge or their explicit request.
- `docs/decisions.md`: a new D31; D28 and D30 updated to match. README: a short "Auto mode" paragraph.

Already decided (don't re-investigate):
- Keep the skill text short, as the parent's rule says; give the before and after line counts of changed skill files in the final summary.
- Auto mode never merges into `main` and never merges a story PR.
- Never with `ci: none`.
- Tier S gets an independent review in auto mode.
- At most 2 rounds of blocking-review fixes.
- Every merge is pinned to the reviewed commit.

Out of scope:
- Unattended mode: answering workers' questions, a wider growth mandate, retries without asking.
- A behavior test of agents; the final summary gives manual trial steps instead (a small goal in auto mode where one phase adds a dependency and must stop).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The skill documents auto mode: switch-on rules, the 7 conditions, the evidence comment, the stops and the resume rule
- [x] #2 Auto mode is refused with ci: none, without auto: allowed, and for a story
- [x] #3 Merge PR N or merge it merges, pinned to the recapped commit, in any mode
- [x] #4 AGENTS.md, the workflow, the template, D31 and the README agree
- [x] #5 The final summary contains the manual trial steps
- [x] #6 npm run verify passes
- [x] #7 A goal's planning PR targets its epic branch, and the worker pushes its In Progress commit before coding, so a board on main shows running and finished subtasks
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 The gate command from BRAID.md passes
- [x] #2 Final summary written: what changed, why, validation, anything open
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. braid SKILL.md: Plan step 5 (goal: epic branch from main first, planning PR into it); a short "Merge on request" section (named PR or "merge it" after a recap, pinned with --match-head-commit to the recapped head, moved head: show and ask); a short "Auto mode" section (switch-on and refusals, label and dated note as a milestone commit, the 7 conditions, evidence comment, after a merge, stops, stop/pause); recap header carries the head commit; Accept step 1: tier S gets an independent review in auto mode; Resuming: auto label; Finish: final PR always the user's.
2. braid-worker SKILL.md: push the In Progress commit at once, before coding.
3. workflow.md: branch table (planning PR into the epic), who merges what, failure-mode rows (branch protection, red epic CI, moved head).
4. assets/braid-md.md: auto: allowed; BRAID.md: auto: allowed.
5. AGENTS.md hard limit; docs/decisions.md: D31, D28 and D30 updated, log line; README: Auto mode paragraph, planning PR wording.
6. scripts/Test-BraidBacklogFlow.ps1 section 1: merge the plan into an epic branch cut from main, and assert main has no task copies yet (run by hand, not part of the gate).
7. Gate, final summary with line counts and manual trial steps, Done.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
What changed: the braid skill gains "Merge on request" (a named PR or "merge it" after a recap, pinned with --match-head-commit to the recapped head; a moved or unrecapped head is shown and asked about) and "Auto mode" (switch-on refused without auto: allowed, with ci: none, or for a story; an auto label and dated note on the parent as one epic-branch commit; the 7 merge conditions; an evidence PR comment; one line after a merge and a green epic CI before the next item, a second red is a quality stop; stops on any stop case, more than 2 blocking rounds, or branch protection, never bypassed; resume on the auto label; the final PR stays the user's). Tier S gets an independent review in auto mode. The recap names the head commit. A goal's planning PR now goes into its epic branch (created from main first), so main gets the tasks with the final PR; the worker pushes its In Progress commit at once. workflow.md: who merges, the branch table, three failure-mode rows (branch protection, red epic CI, moved head). The BRAID.md template documents auto: allowed (absent means not allowed); this repo's BRAID.md sets it. AGENTS.md hard limit, D31 (new), D28 and D30, the decision log and a README "Auto mode" paragraph agree. scripts/Test-BraidBacklogFlow.ps1 now merges the plan into an epic branch and checks main has no copies.

Why: the user wants phases to run without waiting for each merge, with every merge checked, reviewed and pinned; and planning into main had hidden subtask progress on main's board.

Line counts (before -> after): braid/SKILL.md 130 -> 143; braid-worker/SKILL.md 71 -> 71; braid/references/workflow.md 98 -> 104; braid/assets/braid-md.md 40 -> 42.

Validation: npm run verify passed. Test-BraidBacklogFlow.ps1 -SkipVolta (by hand, not in the gate): 27 of 27, including a story planned from main getting task-2 while the goal task-1 exists only on the epic branch (no ID collision).

Manual trial steps: 1. Install the skills from the epic branch. 2. In a scratch repository with BRAID.md auto: allowed and real CI, ask braid for a small goal of two subtasks, where the second adds a dependency (for example a package.json devDependency). 3. Merge the planning PR into the epic branch; check main's board shows the subtasks from their item branches. 4. Ask for auto mode; check the parent gets the auto label and a dated note in one commit. 5. Check subtask 1 is reviewed, gets the evidence comment and is merged into the epic with --match-head-commit, the epic CI is waited for, and you get one line. 6. Check subtask 2 stops with a recap naming dependency and its source, without a merge. 7. Say "merge it" and check it merges the recapped commit. 8. Check the final PR into main is handed to you. Also: ask for auto mode with auto: allowed removed, with ci: none, and for a story; each must be refused with the reason.

Open: none.
For later items: recap header now ends "at <head commit>"; BRAID.md key auto; parent label auto; the planning PR's base is the epic branch.
Needs the user: process: this changes the braid skills, AGENTS.md and BRAID.md, and widens who may merge.
<!-- SECTION:FINAL_SUMMARY:END -->
