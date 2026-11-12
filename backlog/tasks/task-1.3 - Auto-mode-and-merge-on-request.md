---
id: TASK-1.3
title: Auto mode and merge on request
status: To Do
assignee: []
created_date: '2026-11-12T17:29:00Z'
updated_date: '2026-11-12T20:26:00Z'
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
- [ ] #1 The skill documents auto mode: switch-on rules, the 7 conditions, the evidence comment, the stops and the resume rule
- [ ] #2 Auto mode is refused with ci: none, without auto: allowed, and for a story
- [ ] #3 Merge PR N or merge it merges, pinned to the recapped commit, in any mode
- [ ] #4 AGENTS.md, the workflow, the template, D31 and the README agree
- [ ] #5 The final summary contains the manual trial steps
- [ ] #6 npm run verify passes
- [ ] #7 A goal's planning PR targets its epic branch, and the worker pushes its In Progress commit before coding, so a board on main shows running and finished subtasks
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 The gate command from BRAID.md passes
- [ ] #2 Final summary written: what changed, why, validation, anything open
<!-- DOD:END -->
