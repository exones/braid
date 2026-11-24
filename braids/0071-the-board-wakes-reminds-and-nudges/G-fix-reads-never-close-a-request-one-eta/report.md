# 0071/G report

**What changed**
- Reads never close a request. `liveRequests` (which recorded `met`/`withdrawn` on every `braid requests`) is now `holding`, a pure check. The list shows such a request as open: "condition holds: the board wakes the asker" (or "withdraws it"). Only the running board's tick records an ending, with its wake, and it still skips held or paused braids. `liveRequests` had one caller (the list); no other read path writes.
- One wording for an `eta` event: `braid requests <code>` now says "the 0002 coordinator" (the addressee's braid), as the details panel does; other coordinator events name the asking braid.
- A card with an open question and a missed estimate or gone addressee shows the question first and the red stall line under it (`Need.also`; card and details panel).

**Why:** the PM's live check of #290: a plain `braid requests` closed held 0077's wait and a passed time wait without a wake; the board only wakes open requests, so the wake was lost.

**Validation:** new `test/requests-read.test.ts` runs `dist/cli.js requests` on a due `time:` wait (nothing written on `braid-requests`, request open, then one board tick sends one wake) and on a held braid's wait (stays open); card test in `test/board-remind.test.ts`; old `liveRequests` tests changed to `holding`. `npm run verify` passes (659 tests).

**Docs updated:** docs/cli.md (the list and `braid ask`), docs/board.md, docs/braids-format.md, D100 and D98 in docs/decisions.md, the braid's "Already decided".

**Open:** two boards started in the same instant can still both send one wake (P21 · 0074's lock), as the brief decided.

For later items: none.
Needs the user: none.
