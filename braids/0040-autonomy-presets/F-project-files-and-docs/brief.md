---
id: '0040/F'
title: "Project files and docs name the presets"
status: In Progress
labels: ["kind:task", "tier:L", "ask:process"]
dependencies: ['0040/E']
order: 60
---

## Goal

The project's own files and the docs a new user reads still describe auto mode. After this strand they describe presets: this repository names its default, the hard limit on merging says what the preset allows, and the docs show how to pick and write a preset.

Expected size: about 90 lines in 7 files.

## Start here

- `BRAID.md`: `auto: allowed`.
- `AGENTS.md`, "Hard limits": the line on who merges.
- `README.md`: every mention of auto mode (the 0032 front page).
- `docs/getting-started.md`: the `BRAID.md` keys and "Merging and auto mode".
- `docs/decisions.md`, D28 and D31.
- `docs/autonomy.md` and the skills after 0040/E.

## Change

- `BRAID.md`: `auto: allowed` becomes `autonomy: steady`.
- `AGENTS.md`, "Hard limits": agents merge on the user's explicit request, or as the braid's autonomy preset allows; in this repository that is a strand into its braid branch, and everything into `main` stays the user's merge or their explicit request.
- `README.md`: the capability line and the walk-through say "autonomy presets" and what they do in one sentence each; the mock-up images stay as they are unless their text names auto mode.
- `docs/getting-started.md`: the `autonomy` key, and a section on choosing a preset for a project and for one braid, and on writing your own, that replaces "Merging and auto mode".
- `docs/decisions.md`: a new decision for presets with its reasons (the thread review's numbers), and D28 and D31 changed to point to it where they describe auto mode.
- `docs/roadmap.md` if it names auto mode or the unattended mode: one line.

## Plan

1. `BRAID.md`: `auto: allowed` → `autonomy: steady`; check with `braid autonomy 0040` (no preset of its own once the `auto` label is ignored) that it prints `steady` from `BRAID.md`.
2. `AGENTS.md` hard limit on merges: the preset's `merge`, here `strands`; `main` stays the user's.
3. `README.md`: the review bullet, the capability bullet, walk-through step 5, the getting-started pointers; images unchanged (their text doesn't name auto mode).
4. `docs/getting-started.md`: the `autonomy` key; "Merging and autonomy presets" replaces "Merging and auto mode": merges on request, choosing a preset for a project and for one braid, writing your own, hold, the planning PR paragraph kept.
5. `docs/decisions.md`: D73 replaces D31's auto mode (reasons: the thread review's numbers); D31 keeps merge on request and points to D73; D28 points to D73; a log line.
6. Small leftovers in docs that still say auto mode (`docs/board.md`, `docs/autonomy.md` careful line); `docs/roadmap.md` names neither, so it stays.
7. Gate, report, PR.

## Already decided

- This repository's default is `steady`: goals here have run in auto mode since 0009, and the user asked for the coordinator to make the evident decisions itself.
- `main` stays the user's in this repository, because agents install the CLI and the skills from it. `merge: strands` says that; nothing here uses `all`.
- These files are changed here because the user asked for it in this plan; the PR that changes them still stops for the user (`process`).

## Out of scope

- The skills (0040/E) and the CLI.
- New README screenshots.

## Completion

- [x] `BRAID.md` names `autonomy: steady` and `braid autonomy` on a braid without its own preset prints it
- [x] `AGENTS.md`, the README and `docs/getting-started.md` name presets and no longer auto mode
- [x] `docs/decisions.md` has the new decision, and D28 and D31 point to it
- [x] Every link the docs gate checks resolves
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open
