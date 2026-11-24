# 0071/F report

**What changed.** `eta` is in `BRAID_COMMANDS` in `src/cli.ts`, so `braid eta <code> 2h "<why>"` runs instead of "unknown command". `test/board-remind.test.ts` gains a test that runs `dist/cli.js eta` on an open wait and sees the estimate set; `test/cli.test.ts` gains a test that every command named in `helpText` is accepted by `run` (commands `main` handles before `run` are skipped by name).

**Why.** `eta` was in the help and `dispatch` but not the list `run` checks; the tests called `etaCommand` directly.

**Docs checked:** none affected (docs/cli.md and the help already describe `braid eta`).

**Validation.** Both new tests fail without the fix; the gate `npm run verify` result is in the PR.

**Open.** Nothing.

For later items: the commands `main` handles itself (`status`, `next`, `start`, `accept`, `facts`, `recap`, `handover`, `review`, `wait`, `board`, `notify`, `projects`, `clean`) are skipped by the help test by name; a test through the CLI for them would close the same gap.
Needs the user: none.
