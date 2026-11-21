---
id: '0053/C'
title: "Sweep: demo first read, docs.update check, t3 timing test"
status: To Do
labels: ["kind:task", "tier:S", "sweep"]
dependencies: []
order: 30
---

## Goal

Three small leftovers from the sweep of 2026-11-21 (the user chose "Sweep as proposed"), in one PR into the braid branch: the demo's failing project shows its failure from the first page load, `braid check` warns about an unknown `docs.update` value in BRAID.md, and the t3 refresh test no longer depends on wall-clock timing.

Expected size: about 40 to 100 lines in 4 to 6 files.

## Taken leftovers

- `2026-11-21-jhmo`, from 0053/A, ref https://github.com/exones/braid/pull/204. **Demo project mail looks healthy for its first read.** What: in `braid board --demo` the failing sample project `mail` (0053/A) succeeds on its first read and fails only from the second (a refresh or 30 s), so a page opened in the first seconds shows `mail` healthy and the dashed edge, ⚠ tag and red notes are missing. Where: src/board/demo.ts, the `mail` sample project. Why: a demo or screenshot taken right after start misses the failed-read state it was added to show; make the failure visible from the first page load (for example a stored last-good snapshot plus a failed first read).
- `2026-11-21-az63`, from 0056, ref https://github.com/exones/braid/pull/207. **braid check does not validate docs.update in BRAID.md.** What: D81 (0056) added a nested `docs` key to BRAID.md with `update: strand|braid|both|on-demand` and `public`/`internal` lists, but no CLI reads it: a typo such as `update: strands` is silently ignored and agents fall back to the default `braid`. Where: the BRAID.md readers in src/braids/ (readiness, check) and test/readiness.test.ts. Why: a project that sets the wrong value gets a different docs process than it chose, with no warning. A `braid check` (or readiness) warning for an unknown value would catch it.
- `2026-11-21-1gie`, from 0054, ref https://github.com/exones/braid/pull/205. **Flaky timing test: a running thread is shown once per refresh.** What: test/t3.test.ts, 'a running thread is shown once per refresh', counted 4 refreshes where it expects 3 during a slow local `npm run verify` (0054 worker, 2026-11-21); the file passes alone 10/10. Where: test/t3.test.ts (around line 152) and the refresh timer it drives. Why: the test depends on wall-clock refresh timing, so a busy machine fails the gate on unrelated changes. Make the refresh count deterministic (fake timers or an injected clock).

## Start here

- `src/board/demo.ts`: the `mail` sample project 0053/A added, and how the board keeps a last good snapshot for a project whose read fails.
- D81 in `docs/decisions.md` and the `docs` key in `BRAID.md`; how BRAID.md's front matter is read (`rg -n "BRAID.md" src/braids`) and where `braid check` and readiness warn.
- `test/t3.test.ts` around line 152, and the board's refresh interval it counts.

## Change

- Demo: `mail` shows its failed read (dashed edge, ⚠ tag, red notes) on the first page load. Retake screenshots 81 to 83 only if they change.
- `braid check` (or readiness, whichever already reads BRAID.md's keys) warns for an unknown `docs.update` value, naming the allowed ones; a valid or absent value gives no warning.
- `test/t3.test.ts`: the refresh count is deterministic (fake timers or an injected clock), with the same assertion.

## Already decided

- The allowed `docs.update` values are D81's: `strand`, `braid`, `both`, `on-demand`. A warning, not an error: an unknown value must not block other checks.
- Passed in this sweep, not here: `2026-11-21-27yx` and `2026-11-21-bc9k` (0057's Windows CI work), `2026-11-21-di81` (a braid-pm skill edit).

## Out of scope

- Other BRAID.md keys, other flaky tests, any change to skills or agent instructions.

## Completion

- [ ] `braid board --demo` shows `mail`'s failed read on the first page load; a test shows it
- [ ] An unknown `docs.update` value in BRAID.md gives a warning naming the allowed values, and a valid or absent one none; tests show both
- [ ] The t3 refresh test counts refreshes without wall-clock timing
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
