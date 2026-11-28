---
id: '0077/L'
title: "A fresh board recovers with many finished subagent records"
status: To Do
labels: ["kind:story", "tier:M"]
dependencies: ['0077/K']
order: 90
---

## Goal

After a board start, a project with many finished subagent records recovers on its own. The PM asked (2026-11-27, on leftover 2026-11-27-d1zk): the first read after a start still asks T3 once per record in `.braid/reviews.json`. With everix4's 31 records at about 10 s each, that first read alone passes the 60 s read limit. Does the board recover by itself, because the answers that first read gathered still fill 0077/J's memory so the next read succeeds? Or does every read keep timing out? Prove which, and if it never recovers, fix it here.

Expected size: about 80 lines in 3 files (about 200 if a fix is needed).

## Start here

- 0077/J's report.md and its change in src/board/t3.ts: the finished-thread memory, `remember()`, the 6-per-read cap on re-checks, the pool that runs `thread show`.
- src/board/feed.ts: `READ_TIMEOUT_MS`, and what happens to a read that times out (it "still runs until it ends, because its children do").
- J's review (https://github.com/exones/braid/pull/367#issuecomment-7228817121): "a late first read still finishes remember() after the 60 s snapshot is dropped, so the next read sees the map".

## Change

- A test through the feed, not only t3.ts: a fresh board (empty memory) and a project with 31 finished records. A fake T3 answers `thread show` after 10 s each and `thread list` at once, with the timeout at its real 60 s or scaled with fake timers. Assert what the first read does (it times out, or not), and that a later read succeeds within the limit using the remembered answers. Report the timings.
- If it doesn't recover (for example, the timed-out read's answers are dropped, or every read restarts all 31 calls), fix it inside 0077: cap or spread the first-read calls across refreshes (live threads first), so each read finishes within the limit and the rest fill in over the next reads. Keep no new stored file unless that is the only way, and say why in report.md.

## Already decided

- Asked by the PM (2026-11-27): a leftover only if the board recovers by itself; otherwise a fix before the final PR.
- Calls stay async through T3Runner (test/board-async.test.ts).

## Out of scope

- Unknown (deleted) threads being asked on every read: leftover d1zk, unless the fix covers it cheaply.

## Completion

- [ ] A test shows a fresh board with 31 finished records at 10 s per call recovering: a read within the limit by the second (or a stated) read, with timings in report.md
- [ ] If it didn't recover on the base, the fix and a test that failed before it
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated (docs/board.md, Refresh), or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open

## Plan

From the code, the base should recover by the second read: the feed drops a late snapshot, but the read still runs to its end and `remember()` in `src/board/t3.ts` fills the process's memory as each `thread show` answers.

1. Add a test through `feed` and the real `readT3` in test/reviews.test.ts: 31 finished records, a fake T3 (`thread list` at once, `thread show` after 10 s), the real 60 s limit, mocked timers and clock. A second refresh is asked at 30 s, as the board's interval does.
2. Measure the same with real timers (a script in the artifacts folder, temporary folders, fake T3).
3. Only if it doesn't recover: fix it. Otherwise no product change; report.md says so.

