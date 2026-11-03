# Checkpoint A

Updated: 2026-11-03.
Task: spike A, preflight and seed contract. Worker result: complete and waiting for coordinator acceptance.
Checkout: `C:\code\agento`.
Branch/HEAD: not a Git repository. `git rev-parse --is-inside-work-tree` exited 128.
Controller: bootstrap `agento-coordinate` skill and manual files. No released CLI.
Commit/push: no repository, so this spike made no commit and no push.

## Resume here

Read `docs/seed-contract.md`, `epics/agento/001-seed/reports/A.md`, and backlog items B, C, and D. The coordinator owns `epic.md` and `checkpoints/current.md`; this worker left both unchanged.

If the coordinator accepts A, the next assignment is B. B uses Node.js `>=26.13.0 <27` and `pwsh` 7.6 or newer. This machine currently has Node `v24.19.0`. B initializes local Git only if the directory is still not a repository, and it does not create a remote.

If the coordinator returns findings, edit only `docs/seed-contract.md`, this checkpoint, and `reports/A.md`.

## Done

- Inspected Node, npm, PowerShell, Git, GitHub CLI, and `t3` help without printing secrets or starting a thread.
- Selected Node.js 26 Active LTS and PowerShell 7.6 LTS from the official sources cited in the contract.
- Wrote schema 1 in `docs/seed-contract.md`: command grammar, exits, transitions, manual completion, storage, lock, replace procedure, and the six acceptance scenarios.
- Checked that text against B, C, and D. Decisions and the remaining external gaps are in `reports/A.md`.

## In flight

None.

## Last verification

Toolchain commands and the official Node and PowerShell pages listed in `reports/A.md`. No product build exists, so no package test was run. The PowerShell 7.6.9 release-page fetch timed out.

## Files changed

- `docs/seed-contract.md`
- `epics/agento/001-seed/checkpoints/A.md`
- `epics/agento/001-seed/reports/A.md`

## Blockers

No blocker inside A. Node 26 is not installed on this machine. The GitHub owner/repository and the npm publication identity are still unknown. Those block a remote CI claim and publication, not local B.

## Next concrete action

Coordinator: read the contract and `reports/A.md`, record acceptance or a scoped fix, and update the shared epic row and `checkpoints/current.md`. On acceptance, assign B to one implementation worker. Do not start B from this checkpoint.
