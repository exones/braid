---
id: '0014/D'
title: "braid facts and braid recap"
status: Done
labels: ["kind:story", "tier:M", "ask:process"]
dependencies: ['0014/C']
order: 30
---

## Goal

The stop-case diff facts and the coordinator's recap come from braid instead of being assembled by hand.

Expected size: about 250 to 400 lines with tests.

## Start here

- `.agents/skills/braid/references/stop-cases.md`: the diff facts and the case each points to.
- `.agents/skills/braid/SKILL.md` ("Talking to the user"): the recap format; `assets/brief.md`: the braid log entry.
- `src/commands/coordinate.ts`, and `braid done` (0014/C).

## Change

- `braid facts <pr>`: runs the stop-case diff facts for the PR's base and head and prints each fact with the case it points to (dependency, process, deleted tests, skip markers, size against the brief's expected size).
- `braid recap <id>`: a draft recap in the skill's format from the item's `report.md`, its PR (head, checks) and `braid facts`, plus the braid log line, for the coordinator to edit.
- The skills call both instead of the hand-run steps (shorter, not longer).
- Tests on temporary repositories; `braid help`, `docs/braids-format.md`.

## Out of scope

- Judging the cases (the coordinator still decides).

## Acceptance

- [x] braid facts prints the stop-case facts with their cases, covered by tests
- [x] braid recap drafts the recap and the log line from report.md and the PR, covered by tests
- [x] The skills call them and are not longer

## Definition of done

- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open

## Plan

- New `src/commands/facts.ts`: `braid facts <pr>` (gh pr view for base/head, fetch both, the stop-case git diffs, each fact printed with its case; size vs the brief's expected size found from the branch name) and `braid recap <id>` (draft recap from report.md at the PR head, PR head and checks, the facts, plus the braid log line).
- Export the small git/gh helpers of done.ts; wire both commands into cli.ts, `braid help`, docs/braids-format.md.
- Tests on temporary repositories with a fake gh (test/facts.test.ts).
- Skills: replace the hand-run diff block in stop-cases.md (3 copies) by `braid facts <pr>`, and SKILL.md's recap/diff-facts steps by the commands; net word count must not grow.
