---
id: '0075/H'
title: "Merge main after 0075/G: one working rule, one waiting rule"
status: To Do
labels: ["kind:task", "tier:M"]
dependencies: []
order: 50
---

## Goal

Bring `main` into the braid branch after the hotfix 0075/G (PR #303, merge commit c543d51), so that 0075's final PR can open. G changed the stall code on `main`'s old structure, and 0075/C rewrote that code on the braid branch, so `git merge origin/main` conflicts in `src/board/model.ts` (and in G's brief). Resolve it so that both changes hold, in 0075/C's shape.

Expected size: the merge plus about 100 lines of resolution in 2 to 4 files.

## Start here

- `git merge origin/main` on this branch: the conflicts are in `src/board/model.ts` and `braids/…/G-no-false-stalls-background-work-and/brief.md`. Take main's copy of G's brief; it is the more advanced one.
- 0075/G's PR #303, its report.md, and its review https://github.com/exones/braid/pull/303#issuecomment-7146450201 (the merge advice on `waits()` and `waitStall()`).
- 0075/C's PR #298 and report.md: `derive`, `toCard` and `toProgrammes` only collect alarm conditions; `ReadSignals.commit(alarms)` writes; `routing`, `stallsOf` and `withStalls` are shared; `readInputs` (src/board/inputs.ts) feeds every caller.

## Change

- Merge `origin/main` into this branch and resolve every conflict so that:
  - `working()` (src/board/t3.ts, from G) stays the one rule for "a thread runs";
  - G's `waits()` with its time filter becomes the one rule for "deliberately waiting", used inside 0075/C's shared stall steps (`stallsOf`/`withStalls`), not in a second copy;
  - the derivation stays pure (no write outside `ReadSignals.commit`).
- All of G's tests and all of 0075/C's tests pass. Where a test from one side assumes the other side's old structure, adapt the test to the merged structure without weakening what it checks.

## Already decided

- This is the merge 0075's log announced when G was added (as 0073/H did for 0071).
- No new behaviour beyond what 0075/C and 0075/G each built.

## Out of scope

- The leftovers 2026-11-24-8wr2 and 2026-11-24-ob08; anything else.

## Completion

- [ ] `origin/main` (with 0075/G) is merged into this branch, and every conflict is resolved
- [ ] One running rule (`working`) and one waiting rule (`waits` with its time filter), used by 0075/C's shared stall steps; the derivation writes nothing
- [ ] G's tests (the three real cases and the timed wait) and 0075/C's tests all pass
- [ ] Docs from BRAID.md `docs` that this merge makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
