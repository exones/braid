# 0074/E report: Blind limits warn loudly

## What changed

- **A `blind` reading** (`src/braids/limits.ts`). `ProviderReading.blindSince` is set when a provider's reading has been `unknown`, for a reason other than "T3 cannot measure it" (cursor), for over `BLIND_MINUTES` (30): the cache's `checkedAt`, else the file's modified time. A missing cache file is never blind (T3 may not have checked yet).
- **A `blind` chip state** (`src/board/limits.ts`). `stateOf(reading, paused, inUse)`: blind only for a provider in use (a `BRAID.md` role names it and T3 runs one of its threads). A pause record still wins; `mergeLimits` ranks blind above near.
- **The words** (`src/board/limits-view.ts`): "blind since 00:31" on the chip, "cache not updated since 00:31; restart T3" in the tooltip and panel, and that nothing pauses on it while blind.
- **The page** (`web/src/Limits.tsx`): the orange chip with a thick border and ⚠, no meters, an orange "blind" panel badge and line, and the blind chip first on the phone strip. Built as in `docs/design/board-mockups/blind-chip.html`, approved as shown (q-ex55).
- **One push per provider and blind spell** (`blindPush` in `src/board/steer.ts`, step 4 of the steerer). Key `pause:blind:<provider>:<cache's last update>`: the same spell keeps its key (the pusher sends it once and keeps it, also across a restart), a later spell has another. Sent only by the acting board for that provider (0074/B). A recovery sends nothing.
- **Combined board** (`mergeLimits`): `blind` wins over another project's `unknown` or `ok` in either project order (review fix); the push stays one per provider and spell (the steerer sends once per provider per tick and the key is the cache's last update).
- **`braid limits`** prints `blind since <time>: cache not updated since <time>; restart T3` under the unknown verdict, `blindSince` in `--json`; exit stays 0.
- **Rounding** (`src/braids/percent.ts`, `percent()`): one pure helper (whole numbers) used by the page (chips, panel), the chip title, `braid limits`, the pause lines and the pushes. State decisions use the raw value.

## Why

After the 2026-11-25 T3 process kill the provider caches stopped updating, `braid limits` read them as "unknown (launch as usual)" and nobody was told while nothing paused at a threshold. Cursor's unrounded percents also overflowed the chip.

## Validation

- `test/board-steer.test.ts` (new): 31 minutes stale reads `blind` and pushes one key (twice ticked); 9 minutes is `ok`, 20 minutes `unknown`, not blind; a provider no thread uses and an unsupported one never blind; recovery sends nothing and a later spell gets its own key; the key sent once through the real limit pusher; `braid limits` prints the blind line and exits 0; `percent()` and unrounded cursor values (70.4969465, 67.560833, 73.21908396946564) on the chip title, the CLI, `usage()` and a push body.
- `npm run verify`: 723 pass, 2 fail, both in `test/requests.test.ts` ("overlapping writers in separate processes …", multi-process lock tests; 3 to 4 minutes under this machine's load). They pass alone (20 of 20) and touch nothing this change does; CI is the judge.

## Docs

`docs/board.md` (Provider limits: the blind state, the push, rounding) and `docs/cli.md` (`braid limits`) updated. The mockup `docs/design/board-mockups/blind-chip.html` is the design record.

## Open

- A missing cache file and a fresh `checkedAt` with unreadable windows never read blind (no "since" without a first reading, and the clock restarts at each refresh). The mockup drew "file missing" as blind; I chose to stay quiet there: there is no time to say "since" (decided, accepted by the coordinator under the preset).
- The "in use" test is the board's: a role names the provider and a thread runs on it. `braid limits` has no T3 view, so it prints the line for any listed provider that has been unknown for over 30 minutes.
- Other review bot comments: none yet.

For later items: none.
Needs the user: none.
