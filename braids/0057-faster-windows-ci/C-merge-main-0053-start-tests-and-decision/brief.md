---
id: '0057/C'
title: "Merge main: 0053 start tests and decision number"
status: Done
labels: ["kind:task", "tier:S"]
dependencies: []
order: 30
---

## Goal

The final PR of 0057 (#219) now conflicts with `main`, after braid 0053 merged (PR #218). Merge `origin/main` into this strand's branch and resolve the two conflicts, keeping everything both sides added. The final PR then merges cleanly again.

Expected size: the merge, plus about 170 lines moved into the right test file and a renumbered decision.

## Start here

- `git merge origin/main` on this branch: it conflicts in `test/start.test.ts` and `docs/decisions.md`.
- 0057/B (PR #215) split `test/start.test.ts` into `test/start.test.ts` and `test/start-clean.test.ts`, with shared helpers in `test/support/start-fixtures.ts`. Its report (`braids/0057-faster-windows-ci/B-apply-the-chosen-windows-ci-speedups/report.md`) says how the tests were grouped.
- 0053/B (PR #214) added about 164 lines of tests to the old single `test/start.test.ts`, for worktrees in a folder per project.

## Change

- `test/start.test.ts` / `test/start-clean.test.ts`: put each test 0053/B added into whichever file of the split it belongs to by subject. Keep the tests and their assertions exactly as 0053 wrote them; adapt only imports and helper calls to `test/support/start-fixtures.ts`. If 0053 changed an existing test or helper, carry that change into wherever the test or helper lives now.
- `docs/decisions.md`: `main` now has D83 and D84 (from 0053), so this braid's decision (Windows CI: TEMP on D:, the split test files) becomes **D85**, both in the table and in its decision-log line. Keep main's D83 and D84 as they are.
- Update this braid's references to its decision from D83 to D85 in `braids/0057-faster-windows-ci/report.md` and `braids/0057-faster-windows-ci/B-apply-the-chosen-windows-ci-speedups/report.md`. Log files are history; leave them.

## Already decided

- No other change to tests, product code or docs.
- The count of tests after the merge is `main`'s count plus nothing lost: compare `node --test` totals on `origin/main` and on this branch.

## Out of scope

- Anything 0053 or 0057 could do better. Note it in the report instead.

## Completion

- [x] `origin/main` is merged in with no conflict markers left, and the PR into the braid branch shows no conflict with `main` (`git merge-tree` of the result against `origin/main` is clean)
- [x] Every test 0053/B added runs in `test/start.test.ts` or `test/start-clean.test.ts`, unchanged; the report gives the `node --test` total on `origin/main` and on this branch, and they match
- [x] This braid's decision is D85 in `docs/decisions.md` and in both 0057 reports; main's D83 and D84 are unchanged
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open
