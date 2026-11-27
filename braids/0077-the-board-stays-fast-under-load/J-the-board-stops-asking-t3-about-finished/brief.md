---
id: '0077/J'
title: "The board stops asking T3 about finished subagent threads"
status: To Do
labels: ["kind:story", "tier:M"]
dependencies: []
order: 70
---

## Goal

A project with many recorded subagent threads reads well within the 60 s read limit. Today, on every read, the board runs `t3 thread show` for each record in `<repo>/.braid/reviews.json` (src/board/t3.ts, the `showThread` calls around lines 300 to 350). Under load each call takes about 10 s, so everix4's 31 records time its whole read out at `READ_TIMEOUT_MS` (60 s, src/board/feed.ts), and the board shows "read failed, no board yet". Decided by the user ("1. C", 2026-11-27, relayed by the PM): the board stops asking T3 about every recorded subagent thread on every read.

Expected size: about 150 lines in 4 files.

## Start here

- src/board/t3.ts: `showThread`, and how `readFresh` walks the review and worker records (`reviews.json`, the PM checker's `CHECKER_CAP_MS` precedent).
- The `thread list` read in the same file: it already gives each listed thread's status (`states`).
- src/board/feed.ts: `READ_TIMEOUT_MS`, `BRAID_BOARD_TIMINGS`.
- `braid launch --child` and `braid review --thread` (src/commands/): where a record is written when a coordinator launches or re-launches a subagent.

## Change

- Remember, per thread id, a record seen finished (done, completed, failed, archived), kept in the board process. Re-check it rarely (a long interval, stated in report.md). Re-check it at once when its record changes, for example when a coordinator launches, re-launches or messages it and the record's time moves, or when `thread list` shows it running again.
- Live threads (running, working, idle and waiting) keep being read every time, as today.
- No new stored file: the memory lives in the board process. Rebuilding it after a restart costs one read per record.

## Already decided

- The user's choice "1. C": remember finished threads and re-check them rarely, or at once on a launch or message. Live threads are read as today.
- Calls stay asynchronous through the existing `T3Runner` (0077/B). Nothing on the request path.

## Out of scope

- T3 MCP events instead of polling (P5).
- Changing what `reviews.json` stores.

## Completion

- [x] A project with many finished records (for example 30) reads without a `thread show` per finished record after the first read, with a test counting the T3 calls of two reads
- [x] A finished thread that is woken again (its record re-launched, or `thread list` shows it running) shows running again at the next read, with a test
- [x] report.md has the re-check interval and a `BRAID_BOARD_TIMINGS` read of a project with many records, before and after
- [x] Docs from BRAID.md `docs` that this change makes untrue are updated (docs/board.md), or report.md says none are affected
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open

## Plan

1. `src/board/t3.ts`: an in-memory map (per thread id) of item records seen `done`, `completed`, `failed` or `archived`. Such a record is shown again only when its record time changes, `thread list` names it running, or 5 minutes passed (at most 6 of those per read, longest unchecked first). `pm/` checker records are read every time: a checker starts again while T3 shows it `completed`, and its 24 h cap already bounds them.
2. `src/braids/reviews.ts`: recording an item's thread again moves the record's time (same fields), so a re-launch is read at once.
3. Tests in `test/reviews.test.ts`: count T3 calls over two reads; wake by re-record, by `thread list`, by the interval.
4. `docs/board.md`, `docs/cli.md`; timing before/after with a fake T3.

This braid branch lacks `braid launch` (0060 is on `main` only); `launch --child` goes through `recordReview`, so the change covers it after the merge of `main`.
