---
id: '0073/H'
title: "Merge main after 0071: resolve docs, renumber decisions"
status: To Do
labels: ["kind:task", "tier:S"]
dependencies: []
order: 80
---

## Goal

0071 merged into `main` (PR #290) before 0073's final PR #287. As agreed, 0073 merges `main` before its final PR. That merge conflicts in four docs, and both braids numbered new decisions D100 and D101. This strand merges `main` into a branch cut from the braid tip, resolves the conflicts keeping both sides, and renumbers 0073's decisions after 0071's.

Expected size: the merge, plus about 20 changed doc lines.

## Start here

- `git merge origin/main` on this branch: conflicts in `docs/braids-format.md` (`braid wait`, `braid review`, `braid accept`), `docs/cli.md` (`braid review`, `braid accept`, `braid wait`, `braid facts` rows), `docs/decisions.md` (the D100 to D102 rows and the decision log) and `docs/roadmap.md` (the 0070, 0071 and 0073 lines).
- `git grep -nE "D10[0-2]" -- . ':!braids' ':!epics'` for every reference.

## Change

- Merge `origin/main` into this branch (a merge commit, no rebase). In each conflict keep both braids' changes: 0071's text (for example `braid review <id|pm/<slug>>`, the 0071 roadmap line) and 0073's (`ci: all`, the merge gate, `braid facts` naming the gate, the second-parent answer of `braid wait`, the 0073 roadmap line).
- Renumber 0073's decisions, since main's D100 and D101 are 0071's: 0073's D100 (merge gate) becomes D102, D101 (`ci: all`) becomes D103, and D102 (review bots, lines) becomes D104. Change every reference outside `braids/` and `epics/`: decisions.md rows and log lines, docs/autonomy.md, the roadmap line, and any code comment or help text. Logs and briefs under `braids/` stay as written.
- Nothing else changes.

## Already decided

- Both braids' content stays; 0071 keeps D100 and D101 because it reached `main` first.

## Out of scope

- Any behaviour change.

## Completion

- [ ] `origin/main` is merged in, with every conflict resolved keeping both braids' text
- [ ] 0073's decisions are D102, D103 and D104 everywhere outside `braids/` and `epics/`, and decisions.md has D100 to D104 once each
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
