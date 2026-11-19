---
id: '0028'
title: "Board: fast first open and fast item open"
status: Done
labels: ["kind:goal", "tier:M"]
dependencies: ['0012']
delivery: epic
---

## Goal

`braid board` feels fast to the user: the first open shows the complete board within a few seconds instead of over ten, and opening an item (its detail with the brief) or pressing Open thread answers at once instead of after several seconds. What the board shows is always complete and correct: never a partial view.

Measured on 2026-11-18 (this repository: 26 braids, 199 T3 threads, 8 of them running), one board read costs:

- about 7 s for the first read of the braids from branches (`loadLiveBraids`: one `git` per merge-base check and per file read; later reads in the same process hit its commit cache and take about 0.2 s);
- about 4 s for `gh pr list`;
- about 11 s for T3: every `t3` CLI call costs about 2 s (even `t3 --version`), and the board runs `t3 thread list` and then one `t3 thread show` per running thread (6 at a time) on every read;
- about 1.4 s for the inbox.

On top of that:

- `gh` and `git` run through `spawnSync`, so while one runs the server answers no other request, not even a static file.
- `/api/item` (the item detail) reads GitHub and T3 again once their 3 s cache has expired, and the Open thread and Start actions always read both fresh before they answer.

Strands, in run order:

- 0028/A: the server reads in the background and answers from the latest snapshot; opening an item and Open thread read nothing slow.
- 0028/B: the reads themselves get cheaper: Done dates and braids from branches through batched `git` reads, without blocking the server (T3 stays read in full: a `thread show` cache was dropped after review).

Starts after braid 0012 (board on the phone) has merged into `main`; merge `main` into the braid branch first.

## Working at the end

- Opening the board shows the complete board in a few seconds on this repository (the sources read in parallel, each cheaper), not over ten.
- Opening an item's detail, and Open thread, answer from what the board already read, in well under a second.
- A refresh (the 30 s tick, a file change, the Refresh button) never blocks the page: it keeps showing the last snapshot until the new one is ready.
- The actions that change something (Start, Merge) still check against fresh reads before acting.

## Already decided

- The rules stay as `docs/board.md` describes them: lanes, requests, broke signals, the Merge and Start refusals. Only when and how the data is read changes.
- No new dependency and no on-disk cache of GitHub or T3 data.
- The board always shows a complete, correct read: no partial first view with GitHub or T3 still loading (the user dropped that strand). A snapshot is stored only when every source has been read; an item's detail shows the same snapshot as the board.

## Out of scope

- Phone layout and lane order (braid 0012).
- Changing the `t3` CLI itself, or reading T3's internal storage.

## Completion

- [x] Every strand is Done on the braid branch
- [x] `docs/board.md` describes how the board reads and refreshes after the change
- [x] report.md gives the measured times before and after on this repository
