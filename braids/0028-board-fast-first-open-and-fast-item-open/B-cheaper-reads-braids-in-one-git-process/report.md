## Done

- The Done dates of all Done items come from one `git log -M --name-status` of the history plus one `git cat-file --batch` (`prefetchDoneDates` in `src/board/done.ts`), kept in the same caches as `doneDate`. Same rule as before; on this repository the 88 Done items give the same dates as the one-by-one `doneDate` (checked: 0 differences). An item whose first version is already Done (a renamed-in file the one log may not pair) is checked with its own `git log --follow`, so the dates stay exact (5 items here).
- The braids from branches are read asynchronously: the merge checks, the trees and all briefs go through `git` without blocking, and the briefs through one `git cat-file --batch` process (`loadLiveBraidsAsync`, `src/braids/gitio.ts`). Files are cached by blob id, so one text in many commits is read once. The sync `loadLiveBraids` stays for the CLI.
- The inbox is read asynchronously with one `git cat-file --batch` for all entries (`inboxOfAsync`); diverged inbox branches (rare) use the old sync read.
- T3 reads are unchanged: every read runs `thread show` for every running thread. A cache keyed on `thread list`'s `updatedAt` was dropped after review: that time lags `thread show` and carries no pending count, so a pending question could be missed.
- `BRAID_BOARD_TIMINGS=1` names the `done dates` as their own source. docs/board.md and D63 describe the reads.
- The folder watcher ignores a `change` event of a folder itself: reading the braids reports one on Windows, and with the reads now running after the watcher starts it caused a spurious second read at start.

## Validation

- New `test/board-cheaper-reads.test.ts`: Done dates of four items (one renamed folder, one never Done) from one `git log` and one `cat-file --batch`, equal to `doneDate`, no further `git`; braids from three strand branches through one `cat-file --batch`, equal to the sync loader; every running thread is shown on every read, also with an unchanged `updatedAt`; a static file is served in under 500 ms while the board's braids read takes 1.5 s.
- Gate `npm run verify` passes (294 tests).
- Times on this repository (26 braids, ~200 T3 threads, 88 Done items), `braid board` server, ms:

| source / request | before (0028/A) | after |
|---|---|---|
| braids (first read) | 2674 | 1100-1700 |
| done dates (first read) | ~10 000 (inside `board`) | 910-990 |
| done dates (later reads) | cached | 42-66 |
| signals | 61 | 50-60 |
| inbox (read, no fetch) | 791 | 150 |
| inbox (Refresh, fetches origin) | 1750 | 1200 |
| github / t3 (first, in parallel) | 3842 / 4231 | 3300-3800 / 2700-3000 (unchanged) |
| t3 (later reads) | 2700 | 2700 (unchanged, no cache) |
| `board` (toBoard) | 10 154 | 1-2 |
| first `/api/board` (cold) | 12 453 | 4300-4800 |

The first read is now bound by GitHub and T3 (about 3 s, in parallel with the rest, about 2.6 s).

## Open

- The 1.4 s inbox cost has two parts: one `git` process per entry (fixed, now batched: 790 → 150 ms) and, on Refresh, the `git ls-remote` + `git fetch` of `braid-inbox` from origin (about 1.1 s of network, unavoidable; only Refresh does it).
- Signals still read the requests with sync `git` (about 50 ms per read); not changed, the cost is small. `for-each-ref` and `rev-parse` in `loadLiveBraids` also still run sync after the async prefetch (a few ms).
- T3 (`thread list` plus `thread show` of every running thread) stays about 2.7 s per read.

For later items: signals (`loadRequests`) could be made async too if it ever shows in the timing line.
Needs the user: none
