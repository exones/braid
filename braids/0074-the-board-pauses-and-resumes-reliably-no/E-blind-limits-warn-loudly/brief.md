---
id: '0074/E'
title: "Blind limits warn loudly"
status: To Do
labels: ["kind:story", "tier:M", "ui"]
dependencies: ['0074/A']
order: 50
---

## Goal

After the 2026-11-25 00:40 process kill, T3's provider caches stopped updating and were still stale at 07:48Z; `braid limits` read them as "unknown (launch as usual)", so nothing would pause at a threshold and nobody was told (inbox idea 2026-11-25-boj7). When a provider's reading is stale or unreadable, the board warns loudly: its chip turns amber with "limits blind since <time>" and the reason, and one push goes out per provider and blind spell.

Expected size: about 200 lines in 5 files.

## Start here

- `src/braids/limits.ts` `readProvider`: the `unknown` reasons (no file, unreadable JSON, no usageLimits, stale, bad windows); `limits.stale` in BRAID.md (default 10 min).
- `src/board/limits.ts` (`ChipState`, `stateOf`, `buildView`), `src/board/limits-view.ts`: the chip.
- `src/board/steer.ts` `limitPush` and `LimitEvent`: how a limit push is keyed and sent once.
- docs/board.md "Provider limits".

## Change

- **Mockups first** (`ui`): show the amber blind chip next to today's chips (ok, near, over, paused, unknown, unmeasured) with realistic data, in light and dark, and stop for the coordinator; build after the verdict.
- A new chip state `blind` for a provider that is in use (a role in BRAID.md names it and T3 runs one of its threads) and whose reading has been `unknown` for a reason other than "unsupported" for longer than 30 minutes: its text says since when and why ("cache not updated since 00:31; restart T3"). `unmeasured` (cursor) stays grey.
- One `blind` push per provider and blind spell, sent by the acting board (0074/B); a reading that recovers ends the spell, quietly.
- `braid limits` prints the same "blind since" line, and its exit stays 0 (unknown never pauses).
- Round every percent the board shows (the header chip, the limits panel's percent column, pushes) to a whole number or one decimal: cursor sends unrounded values (67.560833…, 70.496946…) that overflow the chip ("S 70.4969465…" over "paused"). The user: "a small thing, absolutely not critical". The raw value comes from `{w.usedPercent}%` in `web/src/Limits.tsx` (about lines 43 and 89); on 2026-11-25 19:25 the chip read "S 73.21908396946564%" over "paused · resumes Dec 3 09:53". Round in one shared helper, used by the web page and the CLI.
- Tests: a cache 31 minutes stale on a provider in use reads `blind` and pushes once; 9 minutes stale doesn't; an unsupported provider never reads `blind`; recovery ends the spell and a later spell pushes again.

## Already decided

- Unknown still never pauses; this only makes it visible.
- 30 minutes before the warning, so a short T3 restart stays quiet.

## Out of scope

- Restarting T3 or its probes; the parse fix (0074/A).

## Completion

- [x] Mockups of the blind chip approved before building (log entry with the verdict)
- [x] A provider in use with an unknown reading for over 30 minutes reads `blind` on the board and in `braid limits`, with tests
- [x] One push per provider and blind spell, with tests
- [x] Every percent the board shows is rounded, with a test on an unrounded cursor value
- [x] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open
