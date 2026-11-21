# 0057/C report

**What changed**
- Merged `origin/main` (0053, PR #218) into the branch and resolved two conflicts.
- `test/start.test.ts` / `test/start-clean.test.ts`: the seven tests 0053/B added are in the split files, unchanged. Four that only start items (two twins with one folder name, a project list `braid` can't read, a case-only name difference, the board counting an old-folder worktree) are in `start.test.ts`; three that run `braid clean` (old-folder worktrees found by start and clean, a listed project's new folder, clean among twins) are in `start-clean.test.ts`. 0053's `basename` import follows into `start.test.ts`.
- `test/support/start-fixtures.ts`: gained `listed`, `agentsDirs` and `load` (exported; 0053's helpers), with the `homes` counter local to the fixture. Only imports and the `../../dist` path in the moved board test changed.
- `docs/decisions.md`: main's D83 and D84 kept; this braid's decision is D85 in the table and in its decision-log line. The two 0057 reports say D85.

**Why:** the final PR (#219) conflicted with `main` after 0053 merged.

**Validation:** `node --test` total is 443 on `origin/main` and 443 on this branch, 0 failed. `npm run verify` passes. No conflict markers left.

**Docs:** only the renumbering; nothing else is untrue.

**Open:** nothing. For later items: none. Needs the user: none.
