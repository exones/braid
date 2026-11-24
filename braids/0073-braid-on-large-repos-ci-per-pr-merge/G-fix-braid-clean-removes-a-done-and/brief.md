---
id: '0073/G'
title: "Fix: braid clean removes a Done and merged braid again"
status: Done
labels: ["kind:task", "tier:S"]
dependencies: []
order: 70
---

## Goal

The PM's live check of 0073's final PR #287 at 93cb010 found a regression in the puxp fix (0073/C). `braid clean` no longer removes the branch of a story or braid that is Done and merged through the normal accept flow.

The cause: `notDone()` reads the brief on the local branch. `braid accept` stamps Done in a temporary worktree and pushes the stamp only to `origin/<branch>`, so the local branch stays at the commit before the stamp. Braid 0001, Done on main and on origin, reads "not Done (In Progress)"; story 0003 reads "(To Do)". The origin/main build removes both. The evidence is in `C:\tmp\b73` (`gh\calls.log`, `gate.log`; read only).

Expected size: about 30 lines of code and tests in 2 files.

## Start here

- `src/commands/clean.ts`: `notDone()` and where it is called.
- The puxp test added by 0073/C (`rg -n "not Done" test`).
- `src/commands/done.ts`: how `braid accept` stamps Done (temporary worktree, push to origin).

## Change

- `notDone()` counts the braid as Done when its brief says `Done` on any of these: the local branch, `origin/<branch>`, or `main` (BRAID.md `main`, and `origin/<main>`). Read each copy, and if any says Done, it is Done. It keeps the branch only when no copy says Done. A missing brief everywhere still keeps it.
- Test the accept-then-clean flow:
  - a story and a braid whose local branch is behind an `origin/<branch>` that carries the Done stamp are removed;
  - one Done only on main is removed;
  - a live braid (In Progress everywhere) with a merged early PR is still kept.
- `merge-gate`'s time limit under a minute is reported in seconds, not "0 minutes" (in `src/commands/mergegate.ts`), with a test.

## Already decided

- `status` showing a braid as "To Review · run braid accept" after an early PR is not for this braid. It predates 0073, and the PM routes it to P22 · 0075.

## Out of scope

- Any other `braid clean` behaviour.

## Completion

- [x] `braid clean` removes a Done and merged story's or braid's branch when Done is only on `origin/<branch>` or on main, and still keeps a live braid's branch; tests cover the accept-then-clean flow
- [x] A merge-gate limit under a minute is reported in seconds, with a test
- [x] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open
