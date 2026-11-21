# 0057/B report

**What changed**

- `.github/workflows/ci.yml`: a Windows-only step ("Put TEMP on D:") before setup-node and `npm ci` creates `$RUNNER_TEMP\tmp` (on D:) and sets `TEMP`/`TMP` through `GITHUB_ENV`. It is skipped on the braids-only fast path; Ubuntu is unchanged. A comment gives the reason. The CI log shows `TEMP and TMP: D:\a\_temp\tmp`. (My first push had the step name unquoted with a trailing colon, which made the workflow file invalid; fixed in the next commit.)
- `test/done.test.ts` (23 tests) is now `done.test.ts` (13: stories, a braid's final PR, refusals, box check) + `done-merge.test.ts` (10: strands, `--merge --preset`). `test/start.test.ts` (22 tests) is now `start.test.ts` (13: `braid start`) + `start-clean.test.ts` (9: `braid clean`). Totals 23 and 22 before and after (45 tests in the four files, all pass). Shared helpers are in `test/support/done-fixtures.ts` and `start-fixtures.ts`; tests and assertions are unchanged. Summed test time measured locally per half: done 89 s / 89 s, start about 89 s / 70 s.
- `docs/development.md` describes the setup; `docs/decisions.md` has D83 (renumbered from D80 when main was merged in; TEMP on D:, the split, the Windows check stays one job, no paid runner or Dev Drive).

**Why:** the spike 0057/A measured `node --test` 13–21% faster in paired runs with TEMP on D:, and one test file runs on one thread.

**Validation:** `npm run verify` passes locally (434 tests). CI is green on both OSes on 46446c3. Windows job, three full runs of the same head ([run 44915556460](https://github.com/exones/braid/actions/runs/44915556460), attempts 1–3):

| Attempt | `verify (windows-latest)` | `node --test` (`duration_ms`) |
| --- | --- | --- |
| 1 | 404 s | 247 s |
| 2 | 425 s | 262 s |
| 3 | 400 s | 249 s |

Before (spike, 5 runs of the same job): whole job 353–500 s (typical ~400), `node --test` 226–310 s (typical ~250).

**Open:** the whole-job numbers show no visible gain against the spike's baseline. They sit in the middle of the baseline range. That matches the spike's own warning: runner-to-runner noise is ±25%, and its unpaired whole-job check of TEMP on D: was also flat; the 13–21% gain was measured only in pairs on one runner. Three unpaired runs cannot tell a 15% gain from noise, and a paired before/after on this PR was not run (it would need a variant of the workflow). The split should shorten `node --test` only when threads are free: with 3 concurrent files on 4 vCPUs, the longest single file went from about 160 s to about 90 s of summed test time, but the suite stays CPU-bound, as the spike found. So the expected saving is small (the spike estimated 30–55 s from TEMP, nothing proven here). The change is free and low-risk, so it stays, but the user should not expect the job to be visibly faster than 6–8 min. Sharding (declined) is the change that cuts it in half.

For later items: re-measure after D: becomes ReFS (2026-11-30); a paired measurement of this PR against main would settle the 13–21% claim; fewer `git` starts in the tests (from the spike).

Needs the user: none
