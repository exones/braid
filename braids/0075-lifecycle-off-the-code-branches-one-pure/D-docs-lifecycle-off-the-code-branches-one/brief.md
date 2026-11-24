---
id: '0075/D'
title: "Docs: Lifecycle off the code branches, one pure lane"
status: To Do
labels: ["kind:task", "tier:L", "ask:process"]
dependencies: ['0075/A', '0075/B', '0075/C']
order: 40
---

## Goal

Bring the docs and the braid skills up to date with all of 0075, as a whole, and make the skills shorter: with Done derived from the merged PR, the accept/re-watch dance and the Done-stamp exception go. The user's requirement: "don't overblow skills, try to see how to make easier".

Expected size: about 150 lines changed in 10 files, net fewer lines in `.agents/skills/`.

## Start here

- Everything 0075 changed, from 0075/A on: `git diff main...HEAD`, and each strand's `report.md`.
- The skill text about accepting and Done: `.agents/skills/braid/SKILL.md` (Watch rule, "Accept and hand over" step 5, "After the merge", "Merge on request", "Finish", "Say waiting"), `references/workflow.md` 21-30, `references/autonomy.md` (merge conditions 2 and 7, the `accept --merge --preset` line), `assets/brief.md` (accept examples), `references/resuming.md` ("merged but not stamped"), and `.agents/skills/braid-worker/SKILL.md` (the `In Progress` first commit).

## Change

- The skills: remove what only the Done stamp needed (watching a story or final PR again after accept, "merged but not stamped", the stamp exception to one writer per branch, the worker's `In Progress` commit if `braid start` now records it). Shorter or the same size, no new special cases.
- The docs from `docs` in `BRAID.md`: README, getting started, `docs/cli.md`, `docs/board.md`, `docs/autonomy.md`, help text, `docs/braids-format.md`, `docs/decisions.md` (a decision for lifecycle on the record and one for the pure lane, with their reasons), `docs/roadmap.md` status.

## Already decided

- Skill and instruction changes are the user's to merge into `main` (AGENTS.md); they go with the final PR.

## Completion

- [ ] The braid skills say nothing that only the old Done stamp needed, and `.agents/skills/` has fewer lines than at the braid's start (report.md gives both counts)
- [ ] Docs from BRAID.md `docs` are brought up to date as a whole; report.md lists each doc as updated or unchanged
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
