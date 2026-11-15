# Report: 0014/D braid facts and braid recap

## What changed

- `braid facts <pr>` (src/commands/facts.ts): fetches the PR's base and head, runs the stop-case diff checks and prints each fact with its case: dependency files, process files (workflows, BRAID.md, AGENTS.md, CLAUDE.md, skills), deleted tests, skip/only markers, and size over twice the brief's `Expected size:` (item found from the branch name).
- `braid recap <id>`: a draft recap in the skill's format from `report.md` at the PR head, the head and `ci` checks, and the facts, plus the braid log line. Placeholders read `<edit: ...>`.
- done.ts exports its small git/gh helpers for reuse. `braid help`, docs/braids-format.md and decisions.md (D44) updated.
- The skills call both: the hand-run diff block in the three stop-cases.md copies and the diff-facts and recap steps in braid/SKILL.md now name the commands. Skill words: 9381 before, 9128 after.

## Validation

- test/facts.test.ts: 7 tests on temporary repositories with a bare remote and a fake gh (each fact and its case, size, no-fact diff, usage errors, recap fields, missing PR).
- `npm run verify` passes (135 node tests plus Pester and the other gates).

## Open

- Nothing. Per D43 the item is left In Progress for the coordinator's `braid done`.

For later items: none
Needs the user: none
