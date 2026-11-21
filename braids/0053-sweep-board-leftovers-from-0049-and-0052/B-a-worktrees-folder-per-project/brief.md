---
id: '0053/B'
title: "A worktrees folder per project"
status: To Do
labels: ["kind:story", "tier:M", "ask:architecture", "ask:data"]
dependencies: []
order: 20
---

## Goal

Item worktrees go to `~/braid-worktrees/<repo>/`, keyed by the main checkout's folder name, so two listed projects with the same folder name share one folder and their items can collide. Give each project its own worktrees folder, and keep the worktrees that already exist working.

Expected size: about 80 to 150 lines in 5 to 8 files.

## Taken leftover

- `2026-11-20-vk6w`, from 0049/B, ref https://github.com/exones/braid/pull/197. **A worktrees folder per project, not per folder name.** What: item worktrees go to `~/braid-worktrees/<repo>/` keyed by the folder name, so two listed projects with the same folder name share it. `braid projects add` only warns; give each project its own folder (for example by project name). Where: src/braids/worktrees.ts, src/projects/list.ts (`folderKey`), braid clean. Why: with several projects on one machine, two same-named checkouts can collide in worktrees.

## Start here

- `src/braids/worktrees.ts`: `worktreesDir`, `repoNameOf`, `agentsDir`.
- `src/commands/start.ts` (around line 87) and `src/commands/clean.ts` (around line 187): where the folder is built, and where clean decides which folders are its own.
- `src/projects/list.ts` `folderKey` and `src/commands/projects.ts` (around line 97): the warning in `braid projects add`.
- Docs that name `~/braid-worktrees/<repo>/` (`rg -n "braid-worktrees" docs README.md`), and docs/decisions.md on worktrees.
- Everything else that finds a worktree by its folder (the board, `braid status`, resuming): `rg -n "agentsDir|worktreesDir|repoName\(" src`.

## Change

First a proposal on realistic examples, then stop (converge loop): the new folder key (project name from `~/.braid/projects.json`; a repository not in the list; started from the main checkout or from a worktree), what happens to worktrees already under the old folder (left where they are and still found, or moved), and what `braid projects add` says afterwards. Send it to the coordinator and wait for the user's verdict. Then build it: the key, start, clean and every lookup, the docs, and tests.

## Already decided

- The user decides the layout and the handling of existing worktrees before it is built (labels `ask:architecture` and `ask:data`: it changes where files live, and worktrees with unpushed work must never be lost).
- Repositories not listed in `projects.json` keep working without a project entry.
- `BRAID_WORKTREES_DIR` keeps its meaning: the root above the per-project folders.

## Failure modes

- An existing worktree under the old folder is no longer found: `braid clean` leaves it behind, or a resumed worker can't find its checkout.
- `braid clean` removes a folder that belongs to another project.
- A move of worktrees on Windows fails while a process holds one; nothing may be left half-moved.

## Out of scope

- Board fixes (strand A).

## Completion

- [ ] The proposal (key, existing worktrees, `projects add` message) was approved by the user, and the item's log records the verdict
- [ ] Two listed projects with the same folder name get different worktrees folders; a test shows it
- [ ] Worktrees made under the old layout are still found by start, clean and the board, or moved as approved; a test shows it
- [ ] Docs that name the worktrees folder describe the new layout
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
