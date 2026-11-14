---
id: '0001'
title: "Auto mode: braid merges phases into the epic branch"
status: Done
labels: ["kind:story", "tier:L"]
dependencies: []
order: 10
delivery: epic
---

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

## Acceptance

- [x] All three subtasks are Done on the epic branch
- [x] The epic to main PR is green and reviewed
- [ ] A fresh coordinator can follow the skills without this chat

## Definition of done

- [x] The gate command from BRAID.md passes
- [x] Final summary written: what changed, why, validation, anything open
