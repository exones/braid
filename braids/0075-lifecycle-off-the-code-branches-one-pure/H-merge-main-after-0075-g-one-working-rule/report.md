# 0075/H report

**What changed:** merged `origin/main` (0075/G, PR #303) into the braid branch with a merge commit.

**Conflicts:**
- `braids/…/G-no-false-stalls…/brief.md` (add/add): took main's copy.
- `src/board/model.ts` (outside braids/): in `derive`, kept 0075/C's `raise(...)`/`stallsOf` form and the `waits(...)` call, with G's updated comment. In `waitStall`, kept C's `raise` parameter and added G's filter `!isTimedWait(r)` (a timed wait has no addressee to be gone or late). G's `waits()` with its `timeAhead` filter is the single waiting rule, used by C's shared stall steps; `working()` (t3.ts) is the single running rule. No second copy; nothing is written outside `ReadSignals.commit`.

**Test adaptation** (`test/board-no-false-stalls.test.ts`): G's tests called `sig.commit()`; C's API is `sig.commit(alarms)`. Changed to `sig.commit(card.alarms)`, and the programme loop collects alarms into an array passed to `toProgrammes`. Checks are unchanged.

**Validation:** typecheck and build clean; `node --test` over all 64 test files in three chunks: 705 pass, 0 fail (includes G's three real cases and timed wait, and 0075/C's tests); docs-gate and OIDC guard pass. `npm run verify` in one piece takes over 10 minutes, so I ran its steps (docs-gate, oidc, typecheck, build, tests) separately.

**Docs:** none affected; G's docs/board.md text already describes `working` and timed waits and still holds.

**Open:** nothing.

For later items: none.
Needs the user: none.
