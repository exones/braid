## What changed

- docs/board.md: Open thread takes the link from the snapshot and reads T3 only when the snapshot has none.
- `catBatch` (src/braids/gitio.ts) has a 60 s timeout like `gitAsync`: on expiry it kills git and rejects, so the board read ends with an error instead of hanging.
- `prefetchLive` (src/braids/branches.ts) fetches report.md and log files in the same batch as briefs, so `toDetail` of a branch-sourced item runs no sync git. Same complete data, read earlier.
- `openAction` (src/commands/board.ts) uses the snapshot card and no longer loads the braids; it loads them only when the snapshot has no such card or no link.
- Signals read (item 5): measured with `BRAID_BOARD_TIMINGS=1` on this repository, `signals` took 54-55 ms per read, under the 100 ms bar, and making loadRequests, the alarm clock and doneAt async is a large change. It stays synchronous, as the brief allows.

## Why

The board server stays responsive and a hung git can't stall the first request. No data changes; the D64 rules hold (complete snapshots, Start and Merge read fresh).

## Validation

- New tests: a hung `cat-file --batch` rejects after the timeout and the process is killed; a branch-sourced item's report and logs are read with no sync git (test hook `noteSyncGit`); Open thread with a snapshot link doesn't call `src.braids`.
- `npm run verify`: see PR checks.

## Open

Nothing.

For later items: make the signals read async if its timing ever grows past about 100 ms.
Needs the user: none
