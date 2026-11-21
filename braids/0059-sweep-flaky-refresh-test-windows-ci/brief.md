---
id: '0059'
title: "Sweep: flaky refresh test, Windows CI failure, docs.update check, demo mail"
status: In Progress
labels: ["kind:task", "tier:M", "sweep"]
dependencies: []
related: ['0056', '0057']
delivery: epic
---

## Goal

Empty four open leftovers in one PR (the sweep of 2026-11-21, proposed by the 0057 "Faster Windows CI" coordinator; the user chose "Sweep as proposed"): a timing-dependent test that fails the gate on a busy machine, an unnamed test that fails 2 of 15 Windows CI runs, a `docs.update` value in BRAID.md that no command checks, and a demo project that looks healthy on its first read. The four parts are independent; the worker may do them in any order.

Expected size: about 150 lines in 6 to 8 files, plus throwaway CI runs for part 2.

### The leftovers, as captured

1. **2026-11-21-1gie**, from 0054, ref https://github.com/exones/braid/pull/205
   Flaky timing test: a running thread is shown once per refresh.
   test/t3.test.ts, 'a running thread is shown once per refresh', counted 4 refreshes where it expects 3 during a slow local npm run verify (0054 worker, 2026-11-21); the file passes alone 10/10. The test depends on wall-clock refresh timing, so a busy machine fails the gate on unrelated changes. Make the refresh count deterministic (fake timers or an injected clock).

2. **2026-11-21-27yx**, from 0057/A, ref https://github.com/exones/braid/pull/213
   Unknown test failure in 2 of 15 Windows CI baseline runs.
   During spike 0057/A, the unmodified verify:full baseline on windows-latest exited 1 in 2 of 15 paired runs (rounds gitcfg 2 and all 2 on PR #211). The failing test is unknown because those runs discarded the node --test output. A Windows-only flake in test/*.test.ts would make every PR CI retry-prone. Rerun the baseline with the junit reporter kept (as the spike did for junit-baseline-1) to name it.

3. **2026-11-21-az63**, from 0056, ref https://github.com/exones/braid/pull/207
   braid check does not validate docs.update in BRAID.md.
   D81 (0056) added a nested `docs` key to BRAID.md with `update: strand|braid|both|on-demand` and `public`/`internal` lists, but no CLI reads it: a typo such as `update: strands` is silently ignored and agents fall back to the default `braid`. Where: the BRAID.md readers in src/braids/ (readiness, check) and test/readiness.test.ts. Why: a project that sets the wrong value gets a different docs process than it chose, with no warning. A `braid check` (or readiness) warning for an unknown value would catch it.

4. **2026-11-21-jhmo**, from 0053/A, ref https://github.com/exones/braid/pull/204
   Demo project mail looks healthy for its first read.
   What: in `braid board --demo` the failing sample project `mail` (0053/A) succeeds on its first read and fails only from the second (a refresh or 30 s), so a page opened in the first seconds shows `mail` healthy and the dashed edge, ⚠ tag and red notes are missing. Where: src/board/demo.ts, the `mail` sample project. Why: a demo or screenshot taken right after start misses the failed-read state it was added to show; make the failure visible from the first page load (for example a stored last-good snapshot plus a failed first read). Tier S.

## Start here

- `test/t3.test.ts`, the test 'a running thread is shown once per refresh; an idle one is not shown at all' (about line 155), and the board server's refresh timer it races (the `start` helper and the code it starts in `src/board/`): find what triggers the extra `thread show`.
- `braids/0057-faster-windows-ci/A-spike-where-windows-ci-time-goes-and/report.md` (on `main` once 0057 merges): "Flaky tests seen", the R2 pairs `gitcfg 2` and `all 2`, and how the spike kept junit artifacts (junit-baseline-1). PR #211 and PR #213 hold those runs.
- `src/braids/readiness.ts` (it reads only BRAID.md's top-level keys), `src/braids/check.ts` (its check of BRAID.md's `autonomy` value is the pattern for a value check) and `test/readiness.test.ts`; D81 in `docs/decisions.md` and the `docs:` key in `BRAID.md`, both from 0056.
- `src/board/demo.ts`: the `mail` sample project and how its reads succeed or fail.

## Change

- Part 1: make the count in that test independent of wall-clock timing (fake timers, an injected clock, or a refresh interval the test sets), without weakening what it asserts. Check the other tests in `test/t3.test.ts` that count calls around refreshes for the same race and fix them the same way.
- Part 2: run the Windows `verify` baseline repeatedly with the `node --test` junit (or spec) output kept as an artifact, on a throwaway draft PR from a separate branch, until the failing test is named or about 15 runs pass. Close that PR and delete its branch afterwards; its workflow changes never land on this story's branch. If the test is named, fix its cause in this PR when that takes about 60 lines or fewer; otherwise report what was found and propose it under `For later items:`.
- Part 3: `braid check` reports an unknown `docs.update` value in BRAID.md (allowed: `strand`, `braid`, `both`, `on-demand`) and a `docs.public` or `docs.internal` that is not a list, naming the value found and the allowed ones; a BRAID.md without `docs` stays valid. Treat it as an error or a warning the way `check` treats a bad `autonomy` value, and say which in the report. Tests in `test/readiness.test.ts` or the check tests.
- Part 4: the `mail` sample project in `braid board --demo` shows its failed-read state (dashed edge, ⚠ tag, red notes) from the first page load, with a last-good snapshot behind it.
- Docs: the CLI reference or `docs/braids-format.md` names the new check, as BRAID.md's `docs` key asks.

## Already decided

- This is the sweep of 2026-11-21: leftovers 1gie, 27yx, az63 and jhmo. di81 and qrwu were passed by the 0057 coordinator (qrwu dropped on its second pass). The user's answer is logged on 0057.
- Related to 0056 (Every braid keeps the docs current, on `braid/0056-every-braid-keeps-the-docs-current`, PR #207): part 3 checks the `docs` key and D81 that 0056 adds, and 0056 also changes `test/readiness.test.ts`. 0056 has merged into `main`: merge `main` into this branch first.
- Related to 0057 (Faster Windows CI, on `braid/0057-faster-windows-ci`): 0057/B changes `.github/workflows/ci.yml` and splits `test/done.test.ts` and `test/start.test.ts`. This story starts before 0057 merges (the user, 2026-11-21) and doesn't change `ci.yml`. Do parts 1, 3 and 4 first and part 2 last. At part 2, if 0057 has merged into `main`, merge `main` in and measure on the new CI; if not, measure on the current CI, and if the failing test is in `test/done.test.ts` or `test/start.test.ts`, don't fix it there: report it and stop for the coordinator, which decides whether to wait for 0057.
- Part 2 may come up empty: about 15 green runs with the output kept is an acceptable result, reported with the run links.

## Out of scope

- Other flaky tests, CI speed, or changes to `.github/workflows/ci.yml` on this branch.
- Agents acting on `docs.update` (the skills' docs step is 0056's); this story only validates the value.
- Other demo projects or board behaviour.

## Completion

- [x] 'a running thread is shown once per refresh' no longer depends on wall-clock timing: the report says how, and the test passes under load (for example 10 runs of `test/t3.test.ts` alongside the full suite)
- [x] The Windows baseline was rerun with the test output kept: the report names the failing test and its fix, or links the green runs; the throwaway PR is closed and its branch deleted
- [x] `braid check` reports an unknown `docs.update` value and a non-list `docs.public`/`docs.internal` in BRAID.md, and accepts a BRAID.md without `docs`; tests cover each case
- [x] `braid board --demo` shows `mail` with its failed-read state on the first page load; a test covers it
- [x] The docs name the new check
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open

## Plan

1. t3.test.ts: `start()` default refresh interval 30 s -> 600 s, so a slow run cannot add a timer refresh and change the count.
2. `braid check`: docs.update / docs.public / docs.internal errors (like a bad autonomy value); test in autonomy.test.ts; docs.
3. Part 4 (mail demo project) is not on main (0053 unmerged): waiting for the coordinator.
4. Part 2: throwaway draft PR rerunning Windows verify with junit kept.
