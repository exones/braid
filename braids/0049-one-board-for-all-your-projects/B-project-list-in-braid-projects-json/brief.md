---
id: '0049/B'
title: "Project list in ~/.braid/projects.json"
status: Done
labels: ["kind:story", "tier:L", "ask:architecture"]
dependencies: ['0049/A']
order: 20
---

## Goal

braid has no list of the user's projects: each board finds its one repository from the folder it runs in. After this strand, `~/.braid/projects.json` is a per-machine list of the projects one board will serve (strand C). The user manages it with `braid projects`, which shows each project's readiness (strand A).

Expected size: about 400 lines in 6 files, with tests.

## Start here

- `braids/0045-working-on-several-projects-research-and/report.md`: option 3 and follow-up 2, and "How others do it" (other tools keep their list of repositories in the user's folder).
- The readiness module from strand A, and `src/board/t3.ts` (`mainCheckout`, T3's project list).
- `src/notify/config.ts`: the existing per-machine settings under `~/.braid` (where they live, how they are written, how a broken file is handled). Follow its pattern.
- `src/braids/worktrees.ts`: item worktrees go to `~/braid-worktrees/<repo>/`, keyed by the folder name.
- `src/cli.ts` and `docs/cli.md` for the command style.

## Change

- `~/.braid/projects.json`, its format documented in `docs/braids-format.md` or `docs/cli.md`: a version field and a list of projects. Each project has a unique name, the main checkout's absolute path and an optional fixed port.
- `braid projects add [<path>] [--name <n>] [--port <n>]` resolves the main checkout of the path (default: the current folder) and prints its readiness. It refuses a duplicate name or path, and a folder that isn't a Git repository.
- `braid projects remove <name>`.
- `braid projects list`: name, path and readiness of each project.
- `add` warns when two listed projects share a folder name, because both would use `~/braid-worktrees/<repo>/` (leftover 2026-11-20-ob03).
- `docs/cli.md`, and in `docs/board.md` a short note that strand C will read the list.

## Already decided

- The list lives per machine in the user's folder. Nothing about it goes into any repository.
- Writes re-read the file first, then write a temporary file and rename it, as `notified.json` does. An unreadable file is reported and never silently overwritten.
- Tests that redirect the home folder run `node dist/cli.js`, not the installed `braid.cmd`: the Volta shim fails when `LOCALAPPDATA` points elsewhere (leftover 2026-11-20-ob03).
- Tier L: it is a new persistent format.
- No `braid projects suggest`: the `t3` CLI has no project list to suggest from, so projects are added only by path (user, 2026-11-20; see 0049/A).

## Failure modes and required regression tests

- A missing file reads as an empty list, and `add` creates it.
- A corrupt file, or one with an unknown version: every command reports it and stops, and nothing rewrites it.
- Two `add` runs at once: neither entry is lost.
- A listed path that no longer exists: `list` shows it as a problem, and the other projects still list.

## Out of scope

- The board reading the list (strand C), and any page change (strand D).
- A unique worktrees folder per project. This strand only adds the warning.

## Completion

- [x] `braid projects add`, `remove` and `list` work as described, with readiness in `add` and `list`
- [x] The four failure modes above each have a passing test
- [x] The format of `projects.json` is documented
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open

## Plan

- `src/projects/list.ts`: the file `~/.braid/projects.json` (`{ "version": 1, "projects": [{ name, path, port? }] }`), a strict reader (missing → empty; corrupt, unknown version or bad entries → `ProjectsFileError`, nothing rewrites it) and `updateProjects`, a locked read-modify-write (the `locked` helper of the requests store, lock file next to the list) that writes a temporary file and renames it.
- `src/commands/projects.ts`: `braid projects add [<path>] [--name] [--port]`, `remove <name>`, `list`. `add` resolves the main checkout (`git rev-parse --show-toplevel`, then `mainCheckout`), refuses a non-repository, a duplicate name or path; the name defaults to the main checkout's folder name; warns when two projects share a folder name. Readiness from `readiness(path, null)`: GitHub is not checked here (no `gh` call per project).
- `src/cli.ts` wiring, help line; `docs/cli.md` command row and the file format in `docs/braids-format.md`; note in `docs/board.md`.
- `test/projects.test.ts`: runs `node dist/cli.js` with HOME/USERPROFILE/APPDATA/LOCALAPPDATA/XDG_* in a temp folder; the four failure modes plus the happy paths.
