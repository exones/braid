# 0080/C: Stalled cards say why a thread failed

## What changed

- A stalled card whose thread failed says why in place of the generic stall sentence: the reason's icon and a few words, "stalled for N min" under it, T3's whole error on hover. Reasons: usage limit (with the reset time when the text has it), provider or network error, stopped run, or T3's own text, cut. With Details off, the icon takes the red clock's place. It shows only once the card reads stalled (the user's q-n7xu).
- `src/board/failure.ts` (new): `failureOf(error, thread)` and the board's one extra read, `thread show` once per newly failed idle thread of an open item, kept until the list gives that thread another status.
- `src/board/t3.ts`: `Where` and `showThread` gained `error`; nothing else.
- The read is wired as an optional `failures` source (`Sources`, `InputSources`, `repoSources`, `readInputs`, timed as `failures`); if it fails, the cards say only that they stalled.

## Why

A card said only that nobody was working. T3 already has the error.

## Decisions

- The brief assumed the board already read the error. It runs `thread show` only on running threads, so the coordinator decided on one cached read per new failure, agreed with 0077's coordinator.
- `failures` takes `(t3, braids)`, not only `(t3)`, and runs after the braids are read: Done braids and strands are skipped only with the braids in hand.
- The kind comes from the text: T3 v0.1.12 gives no error class in `thread show` or `thread list`. Texts matched are Claude Code's documented messages and Codex's from its source.
- A temporary 429 counts as a provider error, not a usage limit, so 0080/E won't treat it as paused.
- Which thread is named: the item's newest idle worker; when that one didn't fail, and for the braid's own stall, the braid's idle coordinator.
- Paused braids, broken waits and programme stalls keep their own words. After a nudge the reason also replaces "Stalled after a nudge: …".
- The decision log has the user's verdict without a `D` number: other open braids already hold D107 to D110.

## Validation

- `npm run verify`: passed, 726 tests, 0 failed (about 15 min on a loaded machine).
- `test/board-failure.test.ts`: `failureOf` on the real error texts (usage limits, overloaded, 5xx, network, stop, unknown), `showThread` reading `error`, the cache, the card and strand marks, and a failing read leaving the lanes.
- Live look: the built board on demo data with failed threads, a free port and a temporary `BRAID_HOME`; the lines, icons and tooltip render as approved. No real T3 thread was read: no captured T3 error was checked.

## Docs

`docs/board.md` (new "Why a thread failed", the icon table, what T3 is read for) and `docs/decisions.md` (the verdict).

## Open

Nothing in this strand's scope.

For later items:
- The whole error isn't reachable on a phone (no hover); the user left it for later.
- A stalled programme doesn't say why its PM thread failed.
- `braid status` doesn't show the reason.
- 0080/E: `Signals.failures` covers only the idle threads a stalled card can name; E needs its own read for any other thread it wants to treat as paused.

Needs the user: none
