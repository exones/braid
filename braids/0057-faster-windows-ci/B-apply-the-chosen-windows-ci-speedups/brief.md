---
id: '0057/B'
title: "Apply the chosen Windows CI speedups"
status: Done
labels: ["kind:task", "tier:M"]
dependencies: ['0057/A']
order: 20
---

## Goal

Make `verify (windows-latest)` faster with the two changes the user picked from 0057/A's report: put `TEMP`/`TMP` on D: in the Windows job, and split the two slowest test files so the test runner can spread them across threads. Record the Windows job times before and after on the PR.

Expected size: about 10–20 lines in `.github/workflows/ci.yml`, two test files split into four, and a short section in the docs.

## Start here

- `braids/0057-faster-windows-ci/A-spike-where-windows-ci-time-goes-and/report.md`: "Recommended for strand B", items 1 and 3, the measurements behind them and the Against section. `sources.md` beside it has the sources ([S8] for D: becoming ReFS, [S22] for how `node --test` schedules files).
- `.github/workflows/ci.yml`: the job, its fast-path step and the order of its steps.
- `test/done.test.ts` and `test/start.test.ts`: the two slowest files (about 160 s and 105 s of summed test time on Windows). Each file runs on one thread.
- `docs/development.md`: where CI is described.

## Change

- `.github/workflows/ci.yml`: in the Windows job, before `npm ci`, a step that creates a folder under `$env:RUNNER_TEMP` (on D:) and sets `TEMP` and `TMP` to it through `GITHUB_ENV`. Skip it on Ubuntu (`if: runner.os == 'Windows'`), and skip it on the fast path like the other steps. A comment says why: C: is slow on hosted Windows runners, and the spike measured `node --test` 13–21% faster in pairs.
- `test/done.test.ts` and `test/start.test.ts`: split each into two files with about the same summed test time. Group the tests by subject, give the files clear names, and keep every test and assertion as it is. Shared helpers move to a helper module under `test/` if both halves need them, without changing what they do.
- `docs/development.md`: two or three sentences on the Windows CI setup (TEMP on D:, why).
- `docs/decisions.md`: one decision with its reasons. TEMP goes on D: and the slowest test files are split. The Windows check stays one job running `verify:full`: the user chose not to split it across parallel jobs (2026-11-21), though the spike measured that at about 2.5–3 min against today's 6–8. A paid runner and a Dev Drive were not taken.
- Measure: after the change, report `verify (windows-latest)` and its `node --test` time from at least three full runs on the PR. The braid's "Measured so far" and the spike's baselines (226–310 s for `node --test`) are the before.

## Already decided

- The Windows check stays one job running all of `verify:full` on every full PR (the user, 2026-11-21). No sharding, no reduced Windows suite.
- The check names stay `verify (windows-latest)` and `verify (ubuntu-latest)`.
- No paid runner, no Dev Drive, no Defender or git-setting changes: the spike measured them as no help or not worth it.
- No product code changes.

## Out of scope

- Fewer `git` process starts in the tests (the report's "For later items"). That needs its own measurement and goes to the inbox.
- The unknown Windows test failure (leftover 2026-11-21-27yx), which goes to the sweep story.
- The Ubuntu job, except where a shared change speeds up both.

## Completion

- [x] The Windows job sets `TEMP`/`TMP` to a folder on D: before `npm ci`, with a comment saying why; Ubuntu and the braids-only fast path are unchanged
- [x] `test/done.test.ts` and `test/start.test.ts` are each split into two files; the total number of tests is the same before and after (state both counts in the report)
- [x] `docs/development.md` describes the Windows CI setup, and `docs/decisions.md` records the decision and its reasons
- [x] `report.md` gives `verify (windows-latest)` and `node --test` times from at least three full PR runs, against the spike's baselines
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open
