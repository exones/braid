---
id: TASK-1
title: 'Auto mode: braid merges phases into the epic branch'
status: To Do
assignee: []
created_date: '2026-11-12T17:28:00Z'
updated_date: '2026-11-12T19:36:00Z'
labels:
  - kind:story
  - tier:L
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
- [ ] #1 All three subtasks are Done on the epic branch
- [ ] #2 The epic to main PR is green and reviewed
- [ ] #3 A fresh coordinator can follow the skills without this chat
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 The gate command from BRAID.md passes
- [ ] #2 Final summary written: what changed, why, validation, anything open
<!-- DOD:END -->
