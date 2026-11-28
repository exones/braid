---
id: '0085'
title: "braid clean works in repos with submodules"
status: In Progress
labels: ["kind:story", "tier:L"]
dependencies: []
related: ['0077']
delivery: epic
autonomy: free
---

## Goal

Programme pm/autonomous-dev-machine (PM thread 9b3a8157-f696-45de-ac39-f35a4a90cf9b). The user, 2026-11-26 (from the SFIL PM's finding; idea 2026-11-26-tk9f): `git worktree remove` refuses worktrees with checked-out submodules (everix4: .build, data, docs, two airflow), so `braid clean` silently leaves item worktrees and reviewers' checkouts behind; everix4 has ~70 worktrees, one is 15 GB, C: at 98%.

After this braid, in any repository, with or without submodules:

1. `braid clean` removes a finished item's worktrees (item worktrees, reviewers' checkouts, T3 subagent checkouts it recorded) that have submodules: it checks the branch is merged and that the worktree and every submodule have no uncommitted or unpushed work, then deinits the submodules and removes the worktree (`--force` only after those checks).
2. No silent skips: every worktree clean keeps gets one line saying why.
3. When clean can't remove something it should, the user is asked to act: a request on the board ("Needs you") naming the folder, its size and the reason (the user: "if it's not good I will see it and at least asked to take action to clean up").
4. `braid clean` without a number sweeps every finished item of the project (idea 2026-11-25-npvd).
5. Tests on a repository with submodules, run on Windows and Linux.

## Already decided

- The goal above is the user's, quoted from the PM's launch message (2026-11-28); changing it or a Completion box goes to the PM.
- Data loss is a stop case: never remove a worktree or submodule with uncommitted or unpushed work. `--force` (on `git worktree remove` or `git submodule deinit`) only after the checks in strand A passed.
- Tests never touch real repositories: `C:\code\everix4` is read-only for agents. Fixture repositories with submodules are built in temp folders (local `file://` submodules need `-c protocol.file.allow=always`).
- Programme rules (the user): don't overblow skills, make things easier, no spaghetti states, lean to reliable calls such as requests. Strand C uses the request record as it is on `main`; it adds no new state file. One open cleanup request per project lists every kept folder (the PM, 2026-11-28, approving the plan), not one per folder.
- Related to 0077 (The board stays fast under load, on `braid/0077-the-board-stays-fast-under-load`): 0077 changes `src/commands/clean.ts` (git through `gitSync`) and merges into `main` first; merge `main` into this braid branch before each strand once it has, and before the final PR.
- Related to 0084 (P31, several open questions per item) and 0086 (P5, board lanes, Held lane), planned in parallel by the PM: strand C opens a request with today's record; 0084 changes the rule so questions on an item stop replacing each other (the PM, 2026-11-28); if it lands first, its rule applies; the coordinator tells the PM of any contact.
- Disk use on the board and sharing submodules between worktrees are P26, not here. Per-item caches under `~/.braid` (idea 2026-11-25-v2ub) are not here either.

## Out of scope

- Disk use per project on the board; shared submodule checkouts (`--reference`, alternates); cache folders under `~/.braid`.
- Worktrees braid has no record of and that are not in a braid worktree folder (a `delegate_task` live check outside `braid launch`): clean names them (strand B) but doesn't remove them.

## Completion

- [ ] `braid clean --yes` removes a merged item's worktree with checked-out submodules, and keeps one with uncommitted or unpushed work in it or a submodule, on Windows and Linux CI
- [ ] Every worktree clean keeps gets one line with its reason
- [ ] A worktree clean should remove but can't shows as a request for the user on the board, naming folder, size and reason
- [ ] `braid clean` without a number covers every finished item of the project
- [ ] Docs from BRAID.md `docs` are up to date with the braid (docs strand)
- [ ] report.md written: what changed, why, validation, anything open

## Autonomy

PM-run (thread 9b3a8157-f696-45de-ac39-f35a4a90cf9b): security, data and outward: always ask. architecture, dependency and scope: ask when expensive to reverse (the platform or technology, the form of the product, a contract with another braid); scope: also ask for any change to the goal or the Completion boxes; otherwise decide and log it. Before merging a story or the final PR into main, send the PM the PR and its head, and merge only on the PM's go.
