# 0073/A report

**Changed**
- `.github/workflows/ci.yml`: push CI only on `main` (`paths-ignore` kept); comment rewritten (PR runs cover PR branches; braid and story branches get no push run; `main` keeps its).
- `src/commands/wait.ts`: the check range gets the CI commit's second parent as its last entry, so a merge commit with no runs of its own is answered by the merged strand's head (or `main`'s tip). Exit codes, cancelled rule and start limit unchanged.
- `test/wait.test.ts`: merge answered green and red from its second parent; a merge with its own runs still uses them.
- Docs: `docs/cli.md`, `docs/braids-format.md`, `src/cli.ts` help, `docs/development.md`, a dated note on D71 in `docs/decisions.md`. `docs/autonomy.md` stays true.
- braid-worker skill: one push per review round; `wc -w` 1774 before, 1773 after.

**Why:** fewer CI runs per strand; `braid wait` keeps answering without push CI on braid branches.

**Validation:** `npm run verify` passes (614 node tests).

**For later items:** none.
**Needs the user:** none.
