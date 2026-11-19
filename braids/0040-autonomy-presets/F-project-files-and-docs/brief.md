---
id: '0040/F'
title: "Project files and docs name the presets"
status: To Do
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

## Already decided

- This repository's default is `steady`: goals here have run in auto mode since 0009, and the user asked for the coordinator to make the evident decisions itself.
- `main` stays the user's in this repository, because agents install the CLI and the skills from it. `merge: strands` says that; nothing here uses `all`.
- These files are changed here because the user asked for it in this plan; the PR that changes them still stops for the user (`process`).

## Out of scope

- The skills (0040/E) and the CLI.
- New README screenshots.

## Completion

- [ ] `BRAID.md` names `autonomy: steady` and `braid autonomy` on a braid without its own preset prints it
- [ ] `AGENTS.md`, the README and `docs/getting-started.md` name presets and no longer auto mode
- [ ] `docs/decisions.md` has the new decision, and D28 and D31 point to it
- [ ] Every link the docs gate checks resolves
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
