---
id: '0028/A'
title: "Board answers from a snapshot read in the background"
status: To Do
labels: ["kind:story", "tier:M"]
dependencies: []
order: 10
---

## Goal

The board server stops reading GitHub, T3, the braids and the inbox inside a request. One background loop reads them (on start, every 30 s, 200 ms after a change under `braids/`, and on the Refresh button) and keeps the latest result as a snapshot. `/api/board` and `/api/item` answer from it, and pages are told to refetch when a new snapshot is ready. Opening an item and Open thread then cost no `gh` or `t3` call.

Expected size: about 350 lines in 7 files, tests included.

## Start here

- `braids/0028-board-fast-first-open-and-fast-item-open/brief.md`: the measurements and the goal.
- `src/commands/board.ts`: `Sources`, `api()` (what each request reads today), the actions (`startAction`, `mergeAction`, `openAction`) and `startBoardWith` (the 30 s timer, the `braids/` watcher, `/api/events`).
- `src/board/github.ts` (`readGithub`, `SHARE_MS`, `runGh` through `spawnSync`) and `src/board/t3.ts` (`readT3`; `runT3` is already async).
- `src/board/signals.ts` (`readSignals`; `sig.commit()` writes `.braid/broke.json`) and `src/board/inbox.ts`.
- `web/src/api.ts`: `useTick`, `useLoad`, the `fresh=1` parameter.
- `docs/board.md`, "Refresh" and "Data".
- The existing board tests under `test/` (search for `startBoardWith` and `repoSources`).

## Change

- `src/commands/board.ts`: a snapshot holder that reads every source off the request path, one read at a time (a refresh asked for while one runs queues exactly one more). It serves `/api/board` and `/api/item` from the snapshot and pushes `refresh` over `/api/events` when it stores a new one. Before the first snapshot exists, a request waits for it. `?fresh=1` asks for a fresh read and answers when it is done.
- `src/board/github.ts`, and the other readers on the board's path that spawn: async runners (`execFile` or `spawn`), so the server answers other requests while `gh` or `git` runs. Keep the injectable runner types the tests use.
- Open thread: takes the link from the snapshot (a thread's link doesn't change); only when the snapshot has none does it read T3 again.
- Start and Merge: still read GitHub and T3 fresh before acting, as now.
- A timing line per background read, printed only when asked for (for example `BRAID_BOARD_TIMINGS=1`), naming each source and its milliseconds.
- `docs/board.md`: the Refresh section says how reads and the snapshot work, and how to turn the timing line on.

## Already decided

- `/api/board` and `/api/item` keep their response shapes; the page needs no change in this strand.
- Broke signals (`.braid/broke.json`) are still committed once per read, now by the background read instead of by a request.

## Out of scope

- Making the individual reads cheaper (0028/B).
- Any partial view: the first open waits for the first complete snapshot (the sources may read in parallel).

## Completion

- [ ] A test with slow fake `gh` and `t3` shows that, once a snapshot exists, `/api/item` and the open action answer without calling either
- [ ] A test shows a static file and `/api/board` are served while a slow `gh` read runs
- [ ] A test shows that Start and Merge still read GitHub and T3 fresh
- [ ] The timing line is documented, and report.md gives its numbers before and after for `/api/board` and `/api/item` on this repository
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
