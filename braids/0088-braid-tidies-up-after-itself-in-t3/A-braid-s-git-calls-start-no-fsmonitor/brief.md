---
id: '0088/A'
title: "braid's git calls start no fsmonitor daemon"
status: To Do
labels: ["kind:task", "tier:S"]
dependencies: []
order: 10
---

## Goal

braid's own git calls never start an fsmonitor daemon, so a `braid` command or a gate braid runs in a repository with `core.fsmonitor=true` (everix4 shares it across 82 worktrees) adds no daemon per worktree. T3 always passes `-c core.fsmonitor=false`; braid doesn't (0083, "What else loads the machine", finding 9).

Expected size: about 60 lines in 4 files.

## Start here

- `braids/0083-how-braid-can-read-t3-lightly/report.md`, finding 9: the evidence and where T3 does it.
- `src/braids/gitio.ts`: `gitSync`, `gitAsync`, `catBatch`, `catBatchSync`, braid's git runners (they already pass `-c core.quotePath=false`).
- `rg -n '"git"' src` and the files that import `node:child_process` (`src/commands/{board,gate,mergegate,service}.ts`, `src/board/*.ts`): any git spawned outside `gitio.ts`, and the gate command braid runs.

## Change

- Every git process braid spawns passes `-c core.fsmonitor=false`.
- Commands braid runs whose children run git (the gate in `src/commands/gate.ts`, `mergegate.ts`): the environment equivalent (`GIT_CONFIG_COUNT`, `GIT_CONFIG_KEY_<n>`, `GIT_CONFIG_VALUE_<n>`), appended to any entries already in the environment, never replacing them.
- A test that a braid git call carries the setting (the `spyOnGit` hook) and that the gate's environment does.

## Already decided

- braid's runtime calls only. 0087 pins git settings for test repositories; this strand doesn't change test setup.
- The setting is fixed, not an option.

## Out of scope

- Changing any repository's config, or stopping daemons that already run.

## Completion

- [ ] Every git process braid spawns passes `core.fsmonitor=false`, and the gate braid runs gets it through the environment, keeping existing `GIT_CONFIG_*` entries; tests show both
- [ ] In a scratch repository with `core.fsmonitor=true`, a `braid` command that runs git and a gate run start no daemon (`git fsmonitor--daemon status` before and after, in report.md); never in `C:\code\everix4`
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
