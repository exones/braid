# Report 0044/B

**What changed:** `toCard` in `src/board/model.ts` gives a braid with strands the `stalled` alarm (keyed by the braid's number, same ten-minute `.braid/broke.json` clock). It reads Needs You `stalled`, "Stalled: the coordinator stopped and nothing was asked", `who` null, `need.since` = the clock start so the ntfy key stays stable. `braid status` shares the model. `docs/board.md` and D46 updated.

**Why:** a coordinator that stopped between strands left its braid Working forever.

**Validation:** new test in `test/lanes.test.ts` (stalled at 14 min, not at 9, cleared by a running coordinator / strand / pending checks / requests, no clock start when T3 or GitHub is down, To Do never stalls, final PR with pending checks stays Working); `npm run verify` passes.

**Open:** none. A braid with all strands Done and no final PR also stalls (conditions allow it).

For later items: none
Needs the user: none

**Review fix:** the braid-level clock has its own key (`<number> coordinator`), is settled before wrap-up's derive, and is cleared when a final PR is open or merged; tests added for both.
