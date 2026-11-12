---
id: TASK-3
title: 'Skills diet: shorter braid skills, one place per rule'
status: To Do
assignee: []
created_date: '2026-11-12T21:36:00Z'
labels:
  - kind:story
  - tier:L
dependencies: []
ordinal: 30
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Goal: shorter braid skills with one place per rule, after auto mode (TASK-1) grew `braid/SKILL.md` by about 30% (2,552 to 3,328 words).

Run after the user's behavior trial of auto mode, so the trial uses the skills as reviewed.

Expected size: net fewer lines; about 6 files.

Start here (read in this order):
- `.agents/skills/braid/SKILL.md`, `references/workflow.md`, `assets/task.md`, `references/stop-cases.md`.
- `.agents/skills/braid-worker/SKILL.md`, `.agents/skills/braid-reviewer/SKILL.md`.
- TASK-1's notes (the log) and the final review of PR #50.

Change:
- Move auto mode to `braid/references/auto-mode.md`; `SKILL.md` keeps one line saying to read it when the user asks for auto mode.
- Remove duplication between `SKILL.md` and `workflow.md` (who merges what, branch rules, tiers and review): each rule lives in one place, the other points to it.
- Fold the prose in `assets/task.md` into its command examples.
- Fix three leftovers from TASK-1 (PR #50 review): ground rule 2 still says the parent goes In Progress in "the epic's first commit" (the commit-points rule says after the planning merge); the skill's YAML description can be read as forbidding merge on request of a story or the final PR (only auto mode never merges them); the grown-story row in workflow.md and "Finish" disagree on when the parent goes Done.
- Parent's references: the coordinator adds the epic branch and the planning PR with `--add-ref` at planning, and the final PR when it opens, so a goal's properties show at the top of its parent.

Already decided (don't re-investigate):
- No rule is lost: the reviewer compares old and new rule by rule.
- Keep instructions very short, as TASK-1's rule says; give before and after word and line counts of every changed skill file.

Out of scope: new behavior beyond the references field.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 braid/SKILL.md is at most 2,600 words; auto mode lives in references/auto-mode.md
- [ ] #2 Each rule is stated in one place; the reviewer confirms no rule was lost
- [ ] #3 The three PR #50 leftovers are fixed
- [ ] #4 A goal's parent carries the epic branch, planning PR and final PR as references
- [ ] #5 npm run verify passes
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 The gate command from BRAID.md passes
- [ ] #2 Final summary written: what changed, why, validation, anything open
<!-- DOD:END -->
