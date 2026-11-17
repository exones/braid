---
id: '0021'
title: "Board Start: no branch clash"
status: In Progress
labels: ["kind:story", "tier:S"]
dependencies: []
order: 205
delivery: epic
---

## Goal

The board's Start never fails inside T3 because its branch already exists. Found on the first real Start (0020 Gap inbox, 2026-11-18): Start chose `plan/gap-inbox`, which the merged planning PR #114 had left behind, and T3's `git worktree add` failed (`branch_already_exists`) in a new, broken thread.

Expected size: about 100 lines in 4 files, with tests.

## Start here

- `src/board/model.ts` around line 340 (`start`: `planned`, `base`, `branch`), `src/commands/board.ts` (the `start` action, `coordinatorMessage`).
- `src/commands/clean.ts`: today it removes item and review branches only.
- `test/board-start.test.ts` (fake `t3`), `docs/board.md` (Start), D52 in `docs/decisions.md`.
- Braid skill, Plan step 4: a goal is planned on `plan/<slug>`, a story on `braid/<number>-<slug>`.

## Change

- **A braid already in `braids/` on the main branch is planned.** Only its state differs: with a braid branch, start from it as today; without one (an Outline or To Do item merged into main), start from the main branch and tell the coordinator, in the first message, that the item exists and is to be detailed or run, not planned again. Name the new branch with the number: `coordinator/<n>-<slug>`.
- **A free branch name.** Before launching, check local and remote branches (`git branch --list`, `git ls-remote --heads origin`); if the name is taken, add `-2`, `-3`, …. A check that can't run disables Start with `Start: <reason>`.
- **From a fresh main.** Start fetches, then branches from `origin/<main>` (and a braid branch from `origin/braid/…`), never from the local branch: the coordinator of 0020 got the user's stale local `main` (6aeb6e2, without 0020) and had to fast-forward by hand (2026-11-18). A failed fetch disables Start with its reason.
- **`braid clean`** also removes `plan/<slug>` branches whose PR is merged, and their worktree when it is clean, like item branches today (skip and say so when the worktree is in use or dirty).
- `docs/board.md` (Start, and clean in `docs/cli.md`), and D52's branch wording.

## Out of scope

- Start's lock across page reloads. Cleaning up a T3 thread whose Start already failed.

## Completion

- [ ] Start on a braid in `braids/` without a braid branch starts from the main branch on `coordinator/<n>-<slug>`, and its first message says to detail or run the existing item (tested)
- [ ] A taken branch name gets a suffix; Start never passes T3 an existing branch (tested with a fake `git`/`t3`)
- [ ] Start's branch comes from `origin/<main>` (or `origin/<braid branch>`) after a fetch, not from the local branch (tested)
- [ ] `braid clean` removes a merged `plan/` branch and its clean worktree, and skips a dirty or busy one (tested)
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
