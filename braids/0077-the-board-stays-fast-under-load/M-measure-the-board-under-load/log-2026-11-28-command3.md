## 2026-11-28 02:35Z

done: measured 0077 under load; report.md. Both targets missed: after a fresh start all three reads fail at 60 s (73-157 s), /api/session up to 59 s, steady p95 2.6 s under two gates; cause: synchronous spawn on the main thread (74 % of the load run). No product code. Decided: measuring harness in Node (preload) with write guard, because the board writes .braid/ in the real projects and braidHome reads no variable.
