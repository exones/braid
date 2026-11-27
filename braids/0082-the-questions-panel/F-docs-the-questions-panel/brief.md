---
id: '0082/F'
title: "Docs: The Questions panel"
status: To Do
labels: ["kind:task", "tier:S"]
dependencies: ['0082/A', '0082/B', '0082/C', '0082/D', '0082/E']
order: 60
---

## Goal

Read everything 0082 changed, from 0082/A on, and bring the docs from BRAID.md `docs` up to date as a whole: README and getting started, `docs/board.md` (the Questions panel, answering from the board), `docs/cli.md` and the CLI help (`braid ask --context/--context-file/--option`, `braid answer` by letter), `docs/braids-format.md` (the two request fields), `docs/roadmap.md` status, and `docs/decisions.md` for what 0082 decided.

Expected size: about 150 lines of docs in 8 files.

## Start here

- The braid's log (`braid view 0082`) and every strand's `report.md`, from 0082/A on; D118 and D119 and any later 0082 decisions.
- Known gap from 0082/C's re-check (https://github.com/exones/braid/pull/361#issuecomment-7206268186): `docs/board.md` and the `braid ask` cell in `docs/cli.md` still say a PM request always pushes high, without the `look` exception.
- D118's number: if another braid took D118 or D119 on `main` first, renumber 0082's and their references.

## Out of scope

- Product code; agent instructions (`.agents/skills/`, `AGENTS.md`, `BRAID.md`).

## Completion


- [ ] Docs from BRAID.md `docs` that this braid makes untrue are updated; report.md lists each doc checked as updated or unchanged
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
