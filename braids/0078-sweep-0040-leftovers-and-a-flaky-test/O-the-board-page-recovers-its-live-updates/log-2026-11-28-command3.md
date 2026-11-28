## 2026-11-28 16:35Z

Decided: resume makes the Refresh button's fresh=1 read; a silent open stream (90 s) is reopened too; a refetch with no reply keeps the shown board, so the offline poll does not blank it. Live-checked on a 390 px viewport against a demo board.

## 2026-11-28 17:10Z

Review round 1 fixed: docs say a silent stream reopens at once (code unchanged); a resume makes at most one fresh read per 30 s; read rules moved to src/board/reply.ts and tested. request-words.test.ts failed once in a gate run and passed on rerun.
