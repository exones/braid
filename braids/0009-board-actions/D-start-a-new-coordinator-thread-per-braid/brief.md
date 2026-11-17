---
id: '0009/D'
title: "Start: a new coordinator thread per braid"
status: To Do
labels: ["kind:task", "tier:M", "ui", "ask:process"]
dependencies: ['0009/A', '0009/B']
order: 40
---

## Goal

**Start** on a To Do braid launches a new coordinator thread in T3 that runs it, as in the approved mockups (0009/A).

Expected size: about 250 lines in 6 files, with tests.

## Start here

- The goal brief, "Already decided" (how Start launches, the project default model, the warning).
- `src/board/t3.ts` (`runT3`, `t3Command`), `t3 thread start --help` (T3 0.1.6: `--title --provider --model --worktree --branch --json`; no effort option).
- `braids/0002-ground-research/B-spike-the-board-s-path-starting-agents/report.md`: the T3 CLI notes.
- `BRAID.md` `models.coordinator`; the braid skill's thread naming (`<repo> <id> <role>: <title>`).

## Change

- **Start:** after the confirmation, `t3 thread start <main checkout> - --title "<repo> <id> coordinator: <title>" --worktree <base> --branch <name> --json`, with the first message on standard input: use the braid skill and run `<id>`; no model flags, so T3 uses the project default. Choose the base and branch name so the coordinator can then work on the braid's branches (`plan/<slug>` from `main` for a braid that isn't planned yet; the braid branch when it exists); say which in the report.
- After the launch, read the thread (`t3 thread show <id> --json`) and warn on the card when its provider or model differ from `BRAID.md`'s coordinator; the effort can't be read.
- Start disabled, with the reason, when T3 isn't reachable, the braid isn't To Do, or a coordinator thread for it is running.
- `BRAID.md`: the coordinator's effort becomes `medium` (user, 2026-11-17). `docs/board.md`.

## Out of scope

- Starting single strands from the board. Parallel runs (0011).

## Completion

- [ ] Start launches one coordinator thread with the title, base and first message above (tested with a fake `t3`)
- [ ] The warning shows when the thread's provider or model differ from `BRAID.md` (tested)
- [ ] Start is disabled with its reason in the three cases above (tested)
- [ ] `BRAID.md`'s coordinator effort is `medium`
- [ ] Final screenshots in the report, light and dark
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
