---
id: '0078/M'
title: "Merge main into the braid branch after 0077"
status: To Do
labels: ["kind:task", "tier:S"]
dependencies: []
order: 44
---

## Goal

The braid branch has `main` merged in, with every conflict resolved so both sides' behaviour holds, before 0078 goes on. `main` moved a lot since 0078's last merge (561d1d3): 0060 (Workers as T3 subagents), 0072 (Questions say what they unblock), 0074 (The board pauses and resumes reliably), 0077 (The board stays fast under load, 397b2431) and 0082 (the Questions panel). A plain `git merge origin/main` on the braid branch conflicts in seven files.

Expected size: conflict resolution only, about 50 to 150 lines in 7 files.

## Start here

- `git merge origin/main` on this branch: the conflicts are in docs/autonomy.md, docs/braids-format.md, docs/cli.md, docs/development.md, src/braids/autonomy.ts (4 hunks), src/cli.ts and src/commands/pauses.ts.
- The braid's log (`braid view 0078`) and the merged strands' reports: what 0078 changed on its side. 0078/C: `braid pause --window` without `--until` stays refused, and the usage line says so; `braid wait --once`; the notify send id. 0078/D: `braid autonomy` and `accept --preset` read the preset from `origin/<base>` and accept a strand id; `braid decisions --since <iso time>`. 0078/A and 0078/B: the PowerShell harnesses are Pester suites, and the release guard runs in verify:full (scripts/Verify.ps1, docs/development.md).

## Change

- Merge `origin/main` into this branch with a merge commit (no rebase). Resolve each conflict so that both 0078's change and main's change hold: for example the pause usage line keeps 0078/C's "refused unless braid limits says pause" and main's new `braid resume --limit --all` form; src/braids/autonomy.ts keeps 0078/D's base reading together with whatever main changed there.
- Run the focused tests for the conflicted files first (test/autonomy*.test.ts, test/pauses.test.ts, test/cli.test.ts, the Pester suites if docs/development.md or scripts changed), then the gate.
- report.md lists each conflict and how it was resolved.

## Already decided

- One worker at a time and focused tests before the gate (the PM, 2026-11-28: keep the load light).
- 0078/L (A live lock holder keeps its lock) waits for this; it then merges the braid branch into its own branch and resolves its own conflicts with 0077's src/braids/gitbranch.ts rewrite.
- 0087 (lighter local gates) also changes scripts/Verify.ps1 and test helpers; whichever braid merges into main second merges main in first. Nothing to do here beyond this merge.

## Out of scope

- Any change beyond resolving the merge.

## Completion

- [ ] `origin/main` at the time of the merge is merged into this branch, every conflict resolved with both sides' behaviour kept, and report.md lists each
- [ ] The focused tests for the conflicted files pass
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
