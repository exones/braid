---
id: '0084/E'
title: "Merge main into the braid"
status: To Do
labels: ["kind:task", "tier:S"]
dependencies: []
order: 25
---

## Goal

Bring `main` (with 0077 The board stays fast under load, merged at 397b2431) into the braid branch, so 0084/C builds on the board's new read paths and request-record writes.

Expected size: a merge commit; about 30 lines of conflict resolution in 2 files.

## Start here

- `git merge origin/main` on this strand's branch conflicts in `test/requests.test.ts` (the test's imports: this braid's side adds `resetT3Memory` and drops `handleOf` from the type; `main` adds `handleOf` to the destructured list) and in `docs/decisions.md` (both sides added decisions: this braid D121 and D122, and `main` 0077's).
- `braids/0077-the-board-stays-fast-under-load/` (after the merge): what 0077 changed in `src/braids/requests.ts` (request-record writes) and the board's read paths.
- `braids/0084-several-open-questions-per-item/A-*/report.md`: what 0084/A changed in `src/braids/requests.ts` and `src/commands/requests.ts`.

## Change

- Merge `origin/main` into this strand's branch (a merge commit, no rebase) and resolve the conflicts keeping both sides' intent: both sides' imports in the test; every decision from both sides in `docs/decisions.md`, renumbered so the numbers are unique and in order, with references to renumbered decisions updated (in `docs/`, `braids/0084-*` and the code comments).
- Check that 0084/A's rule (a question never withdraws an open request) survives 0077's change to how `openRequest` writes the record.

## Already decided

- Read the braid brief `braids/0084-several-open-questions-per-item/brief.md` "Already decided": it is binding.
- 0077 merged into `main` first; this braid follows it.

## Out of scope

- Anything beyond the merge and its conflicts.

## Completion

- [x] `origin/main` at 397b2431 or later is merged into the branch; no conflict markers remain
- [x] Decision numbers in `docs/decisions.md` are unique and in order, and every reference to a renumbered one is updated
- [x] The tests for 0084/A's rule (`test/requests-several.test.ts`, `test/requests-record.test.ts`) pass after the merge
- [x] The gate command from BRAID.md passes
- [x] report.md written: the conflicts and how each was resolved

## Plan

1. Merge `origin/main` (397b2431) with a merge commit.
2. `docs/decisions.md`: keep both sides' rows. `main`'s new decisions have slug IDs (D-board-async, D-running-count), so D121 and D122 stay as they are and no reference changes.
3. `test/requests.test.ts`: keep what the merged tree still has and uses.
4. Check `openRequest` and `replaces`, run the 0084/A tests, run the gate.
