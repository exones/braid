---
id: TASK-1.2
title: braid-reviewer skill
status: Done
assignee: []
created_date: '2026-11-12T17:28:00Z'
updated_date: '2026-11-12T20:42:00Z'
labels:
  - kind:task
  - tier:L
milestone: m-0
dependencies:
  - TASK-1.1
parent_task_id: TASK-1
ordinal: 20
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Goal: a reviewer skill that works with any model (Grok 4.6 in Cursor first) and replaces the short `assets/review.md` brief, so reviews apply one bar, report in one shape and check the stop cases independently.

Expected size: about 150 lines in 9 files.

Start here (read in this order):
- `.agents/skills/braid/assets/review.md`: the brief being replaced.
- `.agents/skills/braid/SKILL.md`: "Accept and hand over" step 1.
- `.agents/skills/braid-worker/SKILL.md` and `agents/openai.yaml`: structure and front matter to follow.
- `.agents/skills/braid/references/stop-cases.md` (from TASK-1.1).
- `scripts/Install-Skills.ps1` and `test/pester/Install-Skills.Tests.ps1`: it installs `braid-*`; the tests list folders exactly.

Change:
- New `.agents/skills/braid-reviewer/SKILL.md` (and `agents/openai.yaml`):
  - Inputs from the first message: task ID, PR, head commit, focus, optional "commits since <sha>" for a re-check, the coordinator's thread.
  - Start: read `BRAID.md`, `AGENTS.md` or `CLAUDE.md`, the task and its parent (`backlog task view --plain`), `gh pr diff`; confirm the worktree is at the head commit, and say so in the report if the PR has moved on.
  - What to check: each acceptance criterion, correctness, unsafe behavior, missing tests on risky paths, tests weakened or deleted, scope creep. Run code only to confirm a suspicion; CI results are the evidence; with `ci: none`, run the gate once at the head.
  - Blocking bar: an acceptance criterion not met, wrong behavior, a security or data-loss risk, missing tests on a risky path, a broken gate, weakened tests. Everything else is a suggestion.
  - Stop cases: a `Needs the user` section using `references/stop-cases.md` (a third identical copy, covered by TASK-1.1's check), with evidence per case.
  - Output: one PR comment (numbered blocking findings, suggestions, Needs the user) and one message to the coordinator with `t3_thread_send`: blocking or not, Needs the user, the reviewed commit, the comment link.
  - Never pushes, edits tasks, merges or approves.
- `braid` SKILL.md "Accept and hand over" step 1: launch the reviewer with the `braid-reviewer` skill and a short first-message template; delete `assets/review.md`.
- `.agents/skills/braid/assets/braid-md.md`: the reviewer line names `skill braid-reviewer`.
- `BRAID.md` of this repository: reviewer `cursor / grok-4.6 / effort=high, fastMode=false; skill braid-reviewer`.
- `AGENTS.md`: "Where to look" and the providers line. README: the skills list.
- Installer Pester tests: `braid-reviewer` is installed and removed like the other braid skills.

Already decided (don't re-investigate):
- Keep the skill text short, as the parent's rule says; give the before and after line counts of changed skill files in the final summary.
- Plain language and commands only: no host-specific review skill and no Claude-only tools; the same skill must work in Cursor, Codex and Claude.
- The reviewer works in a worktree detached at the head commit, never on the branch.

Out of scope:
- Auto-mode conditions and merging (TASK-1.3).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 braid-reviewer has inputs, blocking bar, stop-case section and output shape, with no links outside its folder
- [x] #2 Install-Skills.ps1 installs it into all targets (Pester)
- [x] #3 assets/review.md is gone and the coordinator review step uses the skill with a short first message
- [x] #4 BRAID.md, the template, AGENTS.md and the README name it
- [x] #5 npm run verify passes
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 The gate command from BRAID.md passes
- [x] #2 Final summary written: what changed, why, validation, anything open
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. New .agents/skills/braid-reviewer/: SKILL.md (inputs, start, what to check, blocking bar, Needs the user, output, never-list), agents/openai.yaml, references/stop-cases.md (identical copy).
2. braid SKILL.md "Accept and hand over" step 1: reviewer launched with the braid-reviewer skill and a short first-message template; delete assets/review.md.
3. assets/braid-md.md reviewer line, BRAID.md reviewer, AGENTS.md (Where to look, providers), README skills list.
4. Pester: install this repository's HEAD into temp targets and assert braid, braid-reviewer, braid-worker land in every target; stale removal stays covered by the generic test.
5. npm run verify (and Pester), PR into epic/task-1-auto-mode.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
What changed: new `.agents/skills/braid-reviewer/` (SKILL.md, agents/openai.yaml, references/stop-cases.md as a third identical copy checked by the docs gate). The skill gives the inputs from the first message, the start (BRAID.md, AGENTS.md/CLAUDE.md, task and parent, `gh pr diff`, confirm the detached worktree is at the head commit and report if the PR moved on), what to check, the blocking bar, an independent Needs the user judgement with evidence, one PR comment in a fixed shape and one `t3_thread_send` message; it never commits, pushes, edits tasks, merges or approves. `braid` "Accept and hand over" step 1 now launches the reviewer with a four-line first-message template (with a re-check line); `assets/review.md` is deleted. The BRAID.md template, this BRAID.md, AGENTS.md (Where to look, providers) and the README name the skill. New Pester test installs this repository's HEAD into two temporary targets (exactly braid, braid-reviewer, braid-worker, stamped) and then removes braid-reviewer and braid-worker once they leave the ref.

Why: one review bar and report shape for any model, and an independent stop-case check for auto mode (TASK-1.3).

Line counts: braid/SKILL.md 124 -> 131; braid/assets/braid-md.md 40 -> 40; braid/assets/review.md 13 -> deleted; braid-reviewer/SKILL.md new, 41; braid-reviewer/agents/openai.yaml new, 6; braid-reviewer/references/stop-cases.md new, identical copy.

Validation: `npm run verify` passes; Install-Skills Pester suite 8/8.

Open: none.

For later items: the reviewer comment heading is `**Review of <task-id> at <short sha>** — blocking | not blocking` with Blocking, Suggestions and Needs the user lines, and the coordinator message carries blocking or not, the Needs the user line, the reviewed commit and the comment link; TASK-1.3 can read these. The BRAID.md template now writes the skill as `; skill <name>` after the options (the old `skill: <name>` put a colon inside a YAML value). The new Pester test lists this repository's braid-* folders exactly, so a new braid skill must be added there.

Needs the user: process: changes braid skills, BRAID.md, AGENTS.md and the BRAID.md template, as the task asks.
<!-- SECTION:FINAL_SUMMARY:END -->
