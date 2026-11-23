# 0069/F report

**Done**
- A programme request opened without `--thread` now pushes with the plan file's PM thread as its click link. I did it in the push (`forUser` takes the programme's thread as its fallback), so nothing new is stored and old requests work too.
- The Done push of a braid no programme runs now clicks the braid's coordinator thread when it is known.
- `docs/board.md` says a push ends "Open the board" only when no thread can be named (none recorded and T3 lists none).

**Validation:** new tests in `test/notify-rule.test.ts` (programme request without thread opens the PM thread; with none known, "Open the board"; Done push with and without coordinator) and `test/notify.test.ts`. `npm run verify` passes (561 tests).

**Docs:** `docs/board.md` updated; no other doc is affected.

**Decided:** fall back in the push, not at ask time (simpler, no stored change).

For later items: none.
Needs the user: none.
