---
id: '0070/E'
title: "Docs: Questions on record"
status: To Do
labels: ["kind:task", "tier:S"]
dependencies: ['0070/A', '0070/B', '0070/C', '0070/D']
order: 50
---
## Goal

The project's docs describe questions on record as a whole: the `braid-requests` branch and its form, codes, states and history, who answered, "done when", withdrawing, the board and pushes, the skills' chat questions and end markers.

Expected size: about 150 lines in 6 files.

## Start here

- Everything this braid changed, from its first strand: `git log --oneline main..braid/0070-questions-on-record` and each strand's `report.md`.
- The `docs` list in `BRAID.md`.

## Change

- Bring the docs from `docs` in `BRAID.md` up to date as a whole: README and getting started, `docs/cli.md`, `docs/board.md`, `docs/autonomy.md`, `docs/braids-format.md` (the record's form), `docs/decisions.md` (the record on its own branch, codes, states, answers off the braid branch, no question tool, the end markers, and why), `docs/roadmap.md` status, and the CLI's help text.

## Already decided

- The decisions record names the user's words from the braid's "Already decided" for each user decision.

## Out of scope

- Code and skills.

## Completion

- [ ] Docs from BRAID.md `docs` that this braid makes untrue are updated
- [ ] report.md lists each doc from `docs` as updated or unchanged
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
