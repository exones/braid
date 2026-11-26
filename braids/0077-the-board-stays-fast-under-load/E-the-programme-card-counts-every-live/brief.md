---
id: '0077/E'
title: "The programme card counts every live braid as running"
status: To Do
labels: ["kind:story", "tier:S"]
dependencies: []
order: 35
---

## Goal

The programme card's "N running" counts every braid that is live, not only those whose coordinator is running this minute (idea 2026-11-25-1r0o: sfil-v5 showed "2 running" with five braids in progress). The user's rule: a braid counts as running while it is started, not Done, and its coordinator is alive, working or waiting (on a PR, a live check, a reviewer, the PM), or the PM is handling it. Dead means failed or archived, or no coordinator thread at all.

Expected size: about 80 lines in 3 files.

## Start here

- `runs()` in src/board/programme.ts (about line 92): counts `card.running`, `card.activity` and `t3.coordinators` only.
- src/board/t3.ts: `coordinators` (running) and `idleCoordinators` (not running, not archived), and `states` (a thread's status: `archived`, failed).
- The programme plan rows (src/board/plans.ts): a row the PM handles.

## Change

- `runs()`: a braid card that is not Done counts when an agent runs on it, its checks are pending, its coordinator thread is running or idle and not failed, or its plan row says the PM handles it (state `running`). A braid with no coordinator thread, or only a failed or archived one, doesn't count.
- Tests per case: running coordinator, idle coordinator waiting on a PR, failed coordinator, archived coordinator, none, Done.

## Plan

1. Merge `origin/main` (0072) as its own merge commit, its new paths through B's asynchronous record read and write; gate.
2. `runs()` in programme.ts counts a started, not Done braid with an agent, pending checks, a coordinator running or idle (not failed or archived), or a request the PM is handling (the coordinator's answer, instead of the plan row's `running`).
3. The programme's stall keeps its own narrower test (something works now).
4. Tests per case in test/programmes.test.ts; docs/board.md, "Programmes".

## Already decided

- Merge `main` (with 0074/D, which changes programme.ts) into the braid branch before this strand starts.
- The card keeps one number and its words; no UI change beyond the count.

## Out of scope

- The Questions panel (P25), the lanes (P5).

## Completion

- [ ] The count follows the rule above, with a test per case
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated (docs/board.md, the programme card), or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
