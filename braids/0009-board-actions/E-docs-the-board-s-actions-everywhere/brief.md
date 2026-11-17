---
id: '0009/E'
title: "Docs: the board's actions everywhere"
status: Done
labels: ["kind:task", "tier:S", "docs"]
dependencies: []
order: 50
---

## Goal

The docs describe the board as it now is: it can Start a braid, ask the coordinator to Merge, and Open a thread. Found by the final review of 0009 (https://github.com/exones/braid/pull/120#issuecomment-6961395061); the user wants it in this braid's PR (2026-11-17).

Expected size: about 20 lines in 2 to 4 docs files.

## Start here

- `docs/roadmap.md` line 5: "serves the read-only attention board".
- `docs/getting-started.md`, "See the board": names Open thread and Merge, not Start.
- `docs/board.md` is the reference; link to it rather than repeating it.

## Change

- Fix the two places above.
- Search the current docs (`README.md`, `docs/`, CLI help in `src/cli.ts`) for any other wording that calls the board read-only or omits Start, and fix it. Leave past records alone: `epics/`, decisions describing their time (for example D41), and commands that really are read-only (`braid status`, `facts`, `recap`).

## Out of scope

- Code changes. The Start lock across reloads (noted in the 0009 report).

## Completion

- [x] No current doc calls the board read-only; getting-started names Start, Merge and Open thread
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, anything open
