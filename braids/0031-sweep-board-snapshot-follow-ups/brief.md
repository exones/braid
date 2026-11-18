---
id: '0031'
title: "Sweep: board snapshot follow-ups"
status: To Do
labels: ["kind:task", "tier:M", "sweep"]
dependencies: []
delivery: epic
---

## Goal

Close the five leftovers that braid 0028 (the board answers from a snapshot read in the background) left open: one wrong doc line, one missing timeout, and three reads that still block the board server or repeat work. The board must keep showing the same complete, correct data.

Expected size: about 200 lines in 7 files, tests included.

## Start here

- `braids/0028-board-fast-first-open-and-fast-item-open/report.md` and `docs/decisions.md` D64: what the snapshot does.
- `src/commands/board.ts` (`openAction`, the snapshot holder), `src/braids/gitio.ts` (`catBatch`, `gitAsync`), `src/board/model.ts` (`toDetail`), `src/board/signals.ts`, `src/braids/requests.ts`.
- `BRAID_BOARD_TIMINGS=1` (docs/board.md, Refresh) to time a read.

## Change

The leftovers taken, each as written, with source and link:

1. **docs/board.md says Open thread reads fresh** (from review 0028, https://github.com/exones/braid/pull/154#issuecomment-6993474045). docs/board.md (around line 132, the Open thread action) still says the link is picked "from fresh reads". Since 0028/A, openAction (src/commands/board.ts) takes it from the snapshot and reads T3 only when the snapshot has none, as the Refresh section says. The user reading the action docs gets the wrong picture.
2. **git cat-file --batch has no timeout on the board** (from review 0028, same link). catBatch in src/braids/gitio.ts starts git cat-file --batch with no timeout, while gitAsync has 60 s. A hung git process would leave the board read, and so the first /api/board request, waiting forever. Give it the same timeout and kill the process on expiry.
3. **Item detail still reads report and logs with sync git** (from review 0028, same link). prefetchLive caches only brief.md for branch-sourced items; toDetail (src/board/model.ts) reads report.md and log files through spawnSync git cat-file. Opening such an item briefly blocks the board server. Prefetch those files with the batch, or read them async.
4. **Open thread still reloads the braids** (from review 0028, same link). openAction (src/commands/board.ts) calls src.braids() (loadLiveBraidsAsync) before taking the link from the snapshot, so Open thread still runs the git reads of the braids. It could find the braid in the snapshot instead; this costs time on large repositories.
5. **Board signals read still synchronous** (from 0028/B, https://github.com/exones/braid/pull/152). readSignals (src/board/signals.ts, loadRequests in src/braids/requests.ts) still runs sync git on the board server, about 50 ms per read after 0028/B. It blocks other requests briefly during each background read; make it async if the BRAID_BOARD_TIMINGS=1 line ever shows it mattering.

## Already decided

- The rules of D64 stay: complete snapshots only, Start and Merge read fresh, T3 read in full.
- For item 5, measure first; if the signals read is under about 100 ms and the change would be large, say so in report.md instead of changing it.

## Out of scope

- The final-PR reviewer thread button (leftover 2026-11-18-gs51) and `braid --version` (2026-11-18-5an0): passed by the user.

## Completion

- [ ] docs/board.md describes Open thread as taking the link from the snapshot
- [ ] A test shows a hung `git cat-file --batch` ends the read with an error after the timeout and the process is killed
- [ ] A test shows opening a branch-sourced item's detail runs no synchronous `git`
- [ ] A test shows Open thread with a link in the snapshot doesn't reload the braids
- [ ] The signals read is async, or report.md gives its measured time and why it stays
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
