The board answers from a complete snapshot read in the background, and the reads behind it are batched and no longer block the server.

- 0028/A (PR #150): one background loop reads GitHub, T3, the braids and the inbox (on start, every 30 s, 200 ms after a change under `braids/`, on Refresh), one read at a time with one queued. `/api/board` and `/api/item` answer from the latest complete snapshot; the first request waits for it; a failed read shows its error until the next good one. `gh` runs without blocking. Open thread takes its link from the snapshot; Start and Merge still read fresh. `BRAID_BOARD_TIMINGS=1` prints each source's time per read.
- 0028/B (PR #152): the Done dates come from one batched `git` read (same dates for all 88 Done items; renamed folders checked with `--follow`); the braids from branches and the inbox are read asynchronously through one `git cat-file --batch` each. T3 is still read in full every time: a `thread show` cache was dropped after review, because `thread list` gives no pending count and its `updatedAt` lags.
- 0028/C (PR #153): merged `main` (braid 0030's Coordinator button) in; Open thread keeps the Coordinator option and takes links from the snapshot; 0028's decision is D64.

Measured on this repository (the timing line, 2026-11-18):

| | Before | After |
| --- | --- | --- |
| First open (`/api/board`, cold) | 20.9 s | 6.4 s (GitHub 4.9 s, T3 3.1 s, braids 2.7 s, Done dates 1.2 s, in parallel) |
| Board again | 4.8 s | 4 ms |
| Opening an item (`/api/item`) | 3.7 s, about 10 s when the T3 cache had expired | 0.1 s |
| A later background read | about 15 s, blocking the server | about 3 s (T3 2.4 s), not blocking |

All Completion boxes hold. The "After" column is one cold run of the merged branch; 0028/B measured the first open at 4.3 to 4.8 s (braids 1.1 to 1.7 s), so the cold read varies with `gh` and disk cache by a few seconds. The first open is now bound by `gh pr list` and the `t3` CLI (about 2 s per call), which this braid leaves as they are; the goal's "within a few seconds" holds at about 6 s on this repository.

Validation: each strand's tests and the gate on its PR; CI green on every strand PR; reviews of 0028/A and 0028/B by an independent reviewer (one blocking finding each, fixed), 0028/C read by the coordinator.

Decisions: the user dropped the planned strand for a partial first view (the board must always show complete, correct data) and asked to start after braid 0012; the user chose a fix strand (0028/C) for the conflict with braid 0030; the coordinator dropped the T3 `thread show` cache after review for the same correctness reason.
For later items: leftover 2026-11-18-kgwa (the signals read is still synchronous, about 80 ms).
Needs the user: none
