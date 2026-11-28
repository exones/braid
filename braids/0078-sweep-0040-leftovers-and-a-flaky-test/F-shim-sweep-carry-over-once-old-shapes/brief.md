---
id: '0078/F'
title: "Shim sweep: carry-over once, old shapes, import-backlog"
status: To Do
labels: ["kind:task", "tier:M"]
dependencies: []
order: 60
---

## Goal

Remove compatibility shims whose reason has passed, so fewer paths run on every read: the `.braid/requests.json` carry-over checked on every read, old shapes (the `done` alias, pre-0053 worktree folders, old brief headings), and `braid import-backlog` if no project uses Backlog.md. From idea 2026-11-24-l7dw (Fable's review) and leftover 2026-11-23-hjof (full text in the braid brief).

Expected size: about 700 lines removed and 100 added in 10 to 15 files.

## Start here

- `src/braids/requests.ts` (lines ~288-390): `.braid/requests.json` and the carry-over, how often it runs and where it commits.
- `rg -n "\"done\"|pre-0053|legacy|old heading|backward" src`: the old shapes still read.
- `src/backlog/import.ts`, `src/cli.ts`, `src/braids/readiness.ts`, `src/board/demo.ts`, `test/import.test.ts`, `test/fixtures/backlog-repo`: import-backlog and what depends on it.
- `braid projects` (or the board's project list): which projects this machine runs, to check for `backlog/` folders.

## Change

- The carry-over: after one carry-over a project never needs it again; check it once cheaply (a marker, or only when the old file exists) instead of on every read, or remove it if every known project has carried over; either way it pushes when it commits (hjof), or docs/cli.md says it stays local until the next write.
- Old shapes: remove each one whose data no longer exists in the known projects' `braids/` and record branches, with the evidence (which projects and refs were searched) in the report; keep any still found and say so.
- import-backlog: remove it and its fixtures and docs if no known project has a `backlog/` folder without `braids/`; otherwise keep it and say which project needs it. `braid setup` problems (the setup reference's "project has backlog/ and no braids/") still need a way: if the command goes, the report names what the setup reference should say instead, as a leftover (skills are out of scope).

## Already decided

- Start after 0072 (Questions say what they unblock) has merged into main and main was merged into the braid branch: 0072 changes src/braids/requests.ts and src/commands/requests.ts.
- Removing a read path for data a project still has is a `data` stop: ask first.
- No skill change (braid brief).

## Out of scope

- `fresh` (P24). The board's reads beyond the shims named.

## Completion

- [x] The requests.json carry-over no longer runs a check on every read, and its commit is pushed or documented as local, tested
- [x] Each old shape is removed or kept, with the evidence in report.md
- [x] import-backlog is removed with its tests, fixtures and docs, or kept with the project that needs it named
- [x] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open

## Plan

1. Search the projects on this machine (`braid projects`, the T3 project list, `C:\code\*`) for the data each shim reads.
2. Carry-over: remove it if no `.braid/requests.json` holds a request.
3. Old shapes: remove those with no data left (`done` alias, pre-0053 worktree folders), keep those still found.
4. import-backlog: keep it if a project has `backlog/` without `braids/`.
5. Tests and docs, the gate, report.md.
