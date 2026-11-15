---
id: '0014/F'
title: "braid done ignores the coordinator thread"
status: Done
labels: ["kind:task", "tier:S"]
dependencies: []
order: 50
---

## Goal

`braid done <braid> --head <sha>` refuses to stamp the braid the coordinator is finishing, with "a worker thread for 0014 is still running". The running thread is the coordinator itself: its checkout is on the braid branch, so the T3 matching (by worktree path, then branch) assigns its thread to the braid. Every braid's finish hits this. Make `braid done` ignore the caller's own thread.

Expected size: about 30 to 60 lines in 3 files.

## Start here

- `src/commands/done.ts`: the running-thread check (around line 146) and `--thread` parsing.
- Where T3 threads are matched to items (by linked PR, single PR, worktree path, branch), under `src/board/`; `docs/board.md` "Where the states come from".
- `test/done.test.ts`.

## Change

- `src/commands/done.ts`: the running-thread check skips the thread whose id is the `--thread` value (the caller). The refusal names the running thread (id and title) so the coordinator can see whose it is.
- `.agents/skills/braid/SKILL.md` and `references/workflow.md`: wherever the coordinator runs `braid done`, it passes `--thread <your thread id>` (check; add only where missing; keep the skills from growing more than needed).
- `docs/braids-format.md`: one sentence on the skip.
- Tests: a running thread that is the caller doesn't block; another running thread still does, and the message names it.

## Already decided

- Match by the caller's thread id, not by guessing which thread is a coordinator.

## Out of scope

- The board showing a braid as Working because the coordinator's checkout is on its branch (braid 0015 territory; note it in report.md under For later items).

## Acceptance

- [x] `braid done 0014 --head <sha> --thread <coordinator id>` passes the running-thread check when only the coordinator's thread runs, covered by a test
- [x] Another running thread still refuses, and the message names it

## Definition of done

- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open

## Plan

Skip the caller's thread (`--thread`, compared by its 8-character short id) in the running-thread check; add the thread's title to `T3Thread` so the refusal names id and title; pass `--thread` in the coordinator's `braid done` commands in the braid skill; one sentence in `docs/braids-format.md`; tests.
