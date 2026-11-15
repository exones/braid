---
id: '0014/E'
title: "Final review fixes"
status: In Progress
labels: ["kind:task", "tier:S"]
dependencies: []
order: 40
---

## Goal

Fix the five suggestions from the final review of 0014 (PR #90, comment 6886497015) before 0014 goes to `main`.

Expected size: about 40 to 80 lines in 4 files.

## Start here

- The review comment: https://github.com/exones/braid/pull/90#issuecomment-6886497015
- `src/commands/facts.ts`: the recap draft and its log line; `idOfBranch`.
- `.agents/skills/braid/SKILL.md` ("Talking to the user"): the recap format; `.agents/skills/braid/assets/brief.md`: the braid log entry.

## Change

- `src/commands/facts.ts`: the recap draft includes the `**Screenshots:**` line from the skill's format (an `<edit: ...>` placeholder, or "none" when the item has no `ui` label).
- `src/commands/facts.ts`: the drafted log line follows the template in `assets/brief.md`, `<id> merged: PR #<n>, <sha>. Done: ... For later items: ... Plan changes: ... User decided: ...`, with `<edit: ...>` for the parts it can't know. Update `test/facts.test.ts`.
- `src/commands/facts.ts`: drop `idOfBranch`; reuse `keyOfBranch` from `src/board/github.ts`.
- `src/commands/facts.ts`: the recap's Needs the user line keeps the full case name (`quality or scope`, not `quality`).
- `docs/decisions.md`: a dated line for D44 under "Decision log", like D43's.

## Already decided

- The review's points are accepted as written; don't re-investigate.

## Out of scope

- Anything else in braid facts, braid recap or the skills.

## Acceptance

- [x] The five suggestions are fixed, with tests for the recap's Screenshots line, the log line shape and the full case name

## Definition of done

- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open
