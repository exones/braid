---
id: TASK-1
title: 'Auto mode: braid merges phases into the epic branch'
status: Done
assignee: []
created_date: '2026-11-12T17:28:00Z'
updated_date: '2026-11-12T21:27:00Z'
labels:
  - kind:story
  - tier:L
milestone: m-0
dependencies: []
ordinal: 10
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Goal: when the user asks for auto mode on a goal, `braid` merges each phase's PR into the epic branch itself once every check and condition passes, and stops for the user only on defined stop cases. Merges into `main` stay the user's. This is the groundwork for a later unattended mode. The goal itself also exercises the current goal flow (planning PR, epic branch, phases, final PR).

Expected size: three subtasks of about 120-180 lines each, mostly skill and doc text plus a few Pester tests.

Start here (read in this order):
- `.agents/skills/braid/SKILL.md`: the coordinator's steps.
- `.agents/skills/braid/references/workflow.md`: branches, tiers, merges.
- `docs/decisions.md` D28-D30: why the rules are as they are.

Change:
- TASK-1.1: stop cases and where each role records them; plan review as local task files; the parent's log of finished subtasks.
- TASK-1.2: a `braid-reviewer` skill.
- TASK-1.3: auto mode and merge on request.

Already decided (don't re-investigate):
- Keep instructions very short: current models follow brief instructions well. One sentence per rule; no examples, rationale or repetition unless a model would get it wrong without them; extend an existing line before adding a section. Expected sizes are ceilings, not targets. Each subtask's final summary gives the line counts of the skill files it changed, before and after; the reviewer flags wording that could be shorter.
- Switching on needs the user's request plus `auto: allowed` in `BRAID.md`.
- No auto mode in projects with `ci: none`.
- In auto mode every item gets an independent review, tier S included.
- Stop cases: security, dependency, architecture, data, process, outward, scope, quality. They are detected by the plan, the worker, the reviewer and cheap generic facts from the diff; no per-project path masks.
- The reviewer is Grok 4.6 in Cursor (effort high, fast mode off) with the `braid-reviewer` skill once it exists.
- The coordinator merges any PR when the user explicitly asks.

Out of scope:
- Unattended mode (the next goal).
- Merging into `main` other than at the user's explicit request.
- Changes to the CLI or the `.braid/` ledger.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 All three subtasks are Done on the epic branch
- [ ] #2 The epic to main PR is green and reviewed
- [ ] #3 A fresh coordinator can follow the skills without this chat
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 The gate command from BRAID.md passes
- [ ] #2 Final summary written: what changed, why, validation, anything open
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-11-12: TASK-1.3 extended at the user's request: the planning PR of a goal targets its epic branch, and workers push the In Progress commit at once, because main's own copies hid subtask progress on the board after PR #45 merged.

2026-11-12 TASK-1.1 merged: PR #47, cfbfbe4. Done: stop-cases.md (8 keys) in braid and braid-worker, kept identical by the docs gate; ask:<key> labels and the recap's Needs the user line; local plan review squashed and pushed once; this log; one milestone per goal with a safe ID-collision check; parent In Progress from the epic's first commit. Two blocking review findings fixed, second review clean. For later items: any same path under references/ in two skills must be identical, so braid-reviewer's copy of stop-cases.md is checked automatically; the reviewer's section is named "Needs the user". Plan changes: TASK-1.3 now also moves a goal's planning PR into the epic branch and has workers push In Progress at once (user's request, see above). User decided: none.

2026-11-12 TASK-1.2 merged: PR #48, a117dc4. Done: braid-reviewer skill (41 lines, its own stop-cases.md copy) replaces assets/review.md; braid launches it with a 3-line first message plus a Re-check line when needed; BRAID.md, its template, AGENTS.md and README name it (`; skill braid-reviewer`); Pester test for the installed skill set. Review not blocking; its 3 suggestions applied. For later items: the reviewer comment opens with "**Review of <task-id> at <short sha>** — blocking | not blocking" and has Blocking, Suggestions and Needs the user lines; its coordinator message carries blocking or not, Needs the user, the reviewed commit and the link. Plan changes: none. User decided: install the skills from the epic branch after this merge, so TASK-1.3's review uses braid-reviewer.

2026-11-12 TASK-1.3 merged: PR #49, b15e9ed. Done: merge on request pinned to the recapped head; auto mode (auto: allowed plus the user's request, refused with ci: none or for a story; auto label and note; 7 conditions; evidence comment; epic CI before the next item; stops; final PR always the user's); a goal's planning PR targets its epic branch and workers push In Progress at once; workflow.md, BRAID.md template and this repo's BRAID.md (auto: allowed), AGENTS.md, D31. First review with the braid-reviewer skill: not blocking, 4 suggestions applied. For later items: recap header ends "at <head commit>"; BRAID.md key auto; parent label auto. Plan changes: none. User decided: none.
Closing: all three subtasks merged into the epic branch. A behavior trial of auto mode is still to do; the steps are in TASK-1.3's final summary.
<!-- SECTION:NOTES:END -->
