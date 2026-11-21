# Report: 0059 sweep

## What changed

- **Part 1 (1gie).** The refresh count in `test/t3.test.ts` depended on the board's 30 s refresh timer: a gate run that took longer than 30 s got an extra refresh and counted 4 `thread show` instead of 3. `start()` now defaults the refresh interval to 600 s, so only the explicit `fresh=1` reads and the start read count. The assertion is unchanged; the tests that set their own interval (timer and watcher tests) are unchanged. The same default covers the other call-counting test ("a refresh inside the share window").
- **Part 3 (az63).** `braid check` reports, as errors (like a bad `autonomy` value), a `docs.update` that is not `strand`, `braid`, `both` or `on-demand`, and a `docs.public` or `docs.internal` that is not a list, naming the value found. A BRAID.md without `docs` stays valid. Code: `docsProblems` in `src/braids/check.ts`; test in `test/autonomy.test.ts` (with the other check tests).
- **Part 2 (27yx).** Throwaway draft PR #216 (branch `tmp/0059-flaky-probe`, now closed and deleted) ran the unmodified `verify:full` on windows-latest 16 times in one round on the current CI (0057 not merged), with the node test output in junit and the job logs. All 16 passed ([run 44916576023](https://github.com/exones/braid/actions/runs/44916576023)); only the probe's own junit upload step failed (a `..` path). So the failing test was not named: 16 clean runs against the earlier 2 of 15 failures. The earlier failures came in rounds `gitcfg 2` and `all 2` of the spike, which may have run alongside other load; nothing here shows which test.
- **Part 4 (jhmo).** `mail` now has a stored last-good snapshot (`Sources.seed`, taken by the feed before its first read) and every real read fails, so the first page load already shows the dashed edge, ⚠ and red notes. `test/board-projects.test.ts` checks it on the very first `api/all`; `docs/board.md` updated.

## Validation

`npm run verify` passed (436 tests) after parts 1 and 3. Part 1's repeated runs under load are still to do.

## Docs

`docs/braids-format.md` (the `braid check` entry) and `docs/cli.md` (the command table) name the new check.

## Open

For later items: none yet.
Needs the user: none.
