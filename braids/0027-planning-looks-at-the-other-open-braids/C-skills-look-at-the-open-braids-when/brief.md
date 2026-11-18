---
id: '0027/C'
title: "Skills: look at the open braids when planning"
status: To Do
labels: ["kind:task", "tier:L", "ask:process"]
dependencies: ['0027/A', '0027/B']
order: 30
---

## Goal

The coordinator's Plan looks at the other open braids before it drafts briefs: it links the ones that overlap, and puts a duplicate or a contradiction to the user before the plan is approved instead of planning around it silently.

Expected size: about 40 lines in 3 files.

## Start here

- `.agents/skills/braid/SKILL.md`, "Plan", steps 1 to 5. Braid 0024 edits "Accept and hand over" in the same file: merge `main` into the braid branch first if 0024 is merged by then.
- `.agents/skills/braid/assets/brief.md`: the template and "Create".
- `.agents/skills/braid/references/stop-cases.md`: `scope` is the key for a goal that changes or duplicates agreed work.
- `docs/braids-format.md` after 0027/A and 0027/B: `braid list --open`, `related`, `linked from:`.

## Change

- `SKILL.md`, "Plan": a step after "Understand the goal": run `braid list --open`, read the briefs (`braid view`) of those whose goal touches the same commands, files or decisions, and judge each:
  - overlap without conflict: `related`, plus one line under "Already decided" saying what is shared and how the two stay apart (order, which merges first);
  - one needs the other's result: a dependency where the id resolves, else that line says to start after the other braid merges;
  - duplicate (the other already covers this goal or part of it) or contradiction (this goal undoes or conflicts with the other's goal or an "Already decided" line): `related`, and a warning in the plan request with the other braid's id, title and branch, the conflicting text, and the options (narrow this plan, fold it into the other braid, change the other through its coordinator, go on as planned). The user decides; the answer goes into the braid's log.
- `SKILL.md`, Plan step 5: what the plan shows the user includes the related braids and any warning, context first.
- `assets/brief.md`: `--related` in "Create" and the related line under "Already decided".

## Already decided

- The coordinator never edits another braid's brief for a link; the other side sees it as `linked from:`.
- A warning never stops planning: the plan is drafted and shown with it, and the approval is the user's answer.
- Keep to the skills' style: each rule in one place, no repetition across files.

## Out of scope

- The worker and reviewer skills.
- Comparing with Done braids or `docs/decisions.md`.

## Completion

- [ ] "Plan" has the look-around step with the three cases above
- [ ] The plan shown to the user names the related braids and puts duplicates and contradictions to the user
- [ ] The brief template shows `--related` and the related line
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
