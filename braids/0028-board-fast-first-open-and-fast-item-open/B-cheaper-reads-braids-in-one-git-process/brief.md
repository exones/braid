---
id: '0028/B'
title: "Cheaper reads: braids in one git process, T3 shows only when needed"
status: In Progress
labels: ["kind:story", "tier:M"]
dependencies: ['0028/A']
order: 20
---

## Goal

The background read of 0028/A gets cheap enough that the first open shows the complete board in a few seconds, and no read blocks the server while it runs. After 0028/A the first read still takes about 12 s on this repository, and about 10 s of that is the Done dates (`src/board/done.ts`: one `git log` per Done item, synchronous, inside `toBoard`).

So: the Done dates come from one batched `git` read; the braids from branches come through one `git cat-file --batch` process instead of one `git` per file; T3 reads stay as they are (see the Change section); and the git reads on the board's path run without blocking the server.

Expected size: about 400 lines in 8 files, tests included.

## Start here

- `braids/0028-board-fast-first-open-and-fast-item-open/brief.md`, the braid's log entry for 0028/A, and 0028/A's `report.md` (the timing line `BRAID_BOARD_TIMINGS=1` and its numbers).
- `src/commands/board.ts`: the snapshot holder and `readAll` from 0028/A, and where `toBoard` runs.
- `src/board/done.ts`: `doneDate` and its rule (the oldest commit of the brief's unbroken run of `status: Done` versions, following folder renames), and its caches.
- `src/braids/branches.ts`: `loadLiveBraids`, `folders` (`git ls-tree`), `gitTree.read` (`git cat-file blob`), `inHead` (`git merge-base --is-ancestor`).
- `src/board/t3.ts`: `readFresh`, `show`, `pool`. `t3 thread list --json` gives `threadId`, `status`, `title`, `link` and `updatedAt`, but no `worktreePath` or pending count; those come only from `thread show`.
- `src/board/inbox.ts` and `src/inbox/` (`readInbox`): the inbox read costs about 1.4 s; find out why.

## Change

- `src/board/done.ts`: the Done dates of all Done items from one `git` read per history searched (for example one `git log` over `braids/` with the briefs' `status` changes), giving the same dates as today's rule, including renamed folders. Keep the caches.
- `src/braids/branches.ts`: blob reads through `git cat-file --batch` (one process per read of the braids), keeping the per-commit caches. Reduce or batch the merge-base checks if the timing line shows they matter.
- The git reads on the board's path (braids, Done dates, signals, inbox): asynchronous, so the server answers other requests while they run. The synchronous versions stay for the CLI commands that use them.
- `src/board/t3.ts`: T3 reads are unchanged: every read runs `thread show` for every running thread, because `thread list` gives no pending count and its `updatedAt` lags `thread show`, so skipping could hide a pending question. Any failure still gives `unavailable`.
- The inbox read: make it cheaper if the 1.4 s has an avoidable cause; otherwise say why in report.md.
- The timing line names the Done dates as their own source.

## Already decided

- Reads stay through the `git` and `t3` CLIs; no T3 HTTP API and no access to T3's storage.
- What is read, how items and threads are matched, and what a Done date means don't change.

## Out of scope

- The page and the snapshot logic (0028/A).

## Completion

- [x] A test shows the Done dates of several items, one with a renamed folder, come from one batched `git` read and equal today's `doneDate` results
- [x] A test shows the braids from branches are read through one `git cat-file --batch` process and come out the same as before
- [x] A test shows every running thread is shown on every read (no cache of `thread show`)
- [x] A test shows a static file is served while a slow git read of the board runs
- [x] report.md gives the timing line's numbers per source, and the first `/api/board` time, before and after on this repository
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open

## Plan

1. `src/braids/gitio.ts`: async `git` and `cat-file --batch` helpers. 2. Done dates in one log plus one batch (fallback `--follow` for items whose first version is Done). 3. Branches and inbox through the batch, async. 4. (dropped after review: no T3 `thread show` cache.) 5. Timing line, docs, tests, report.
