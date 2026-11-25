# 0074/F report

**What changed:** `derive` in `src/board/model.ts` no longer reads a strandless braid as stalled while its coordinator thread is working (`t3.coordinators`, built by `working()`), the same rule as the braid-level stall. The wrap-up call for a braid with strands passes no coordinators, so its behaviour is unchanged. Cards still list agents as before.

**Why:** inbox 2026-11-25-hooh: a running coordinator of a strandless braid read "Stalled: nobody is working" after 10 minutes.

**Validation:** new test in `test/board-nudge.test.ts` (strandless running: not stalled; idle: stalled; with strands idle: stalled, running: not; card `running` stays false). Local `npm run verify` (2026-11-26, under load): 725 of 727 tests pass; the two failures are the multi-process lock tests in `test/requests.test.ts` (known flake, leftover 2026-11-25-01yh). CI on the PR is the gate evidence.

**Docs:** `docs/board.md` stalled bullet updated. No others affected.

**Open:** none.

For later items: none.
Needs the user: none.
