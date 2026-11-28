## 2026-11-28 10:26Z

Decided: merged main (397b243) as 28fed82; autonomy.ts keeps 0078/D's read from origin/<base> as a Git-backed Tree for main's tree-based preset readers, through main's gitSync.

## 2026-11-28 12:00Z checkpoint

done: origin/main (397b243) merged as 28fed824, seven conflicts resolved; typecheck, build and 102 focused tests pass; first gate run 857 passed, 1 skipped, 1 load failure (test/start-clean.test.ts 'worktree is still in use', passes alone); second gate run killed by the user's hold (machine restart). next: on Go, rerun the gate, write report.md (conflicts and resolutions), tick the boxes, open the PR into braid/0078-sweep-0040-leftovers-and-a-flaky-test. open: nothing else.
