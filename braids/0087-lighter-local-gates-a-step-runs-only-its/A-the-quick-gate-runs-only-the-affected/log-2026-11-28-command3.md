## 2026-11-28 09:23Z

Decided: `import type` and `export type` lines don't make a test depend on a module (erased at runtime, the gate typechecks everything). With them, a change to src/commands/board.ts picked 37 of 74 files, without 19; sweep.ts 51, without 2.
Decided: an empty change set runs every test; web/ and other unclassified paths run every test.
Finding: 0077 is not in main, so the picked files go to node --test directly. When main with 0077 is merged, scripts/Test-Node.ps1 must take the file list or the picked run loses its concurrency cap; git merges both cleanly, so nothing flags it.
