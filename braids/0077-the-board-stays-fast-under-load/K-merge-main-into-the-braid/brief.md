---
id: '0077/K'
title: "Merge main into the braid"
status: To Do
labels: ["kind:task", "tier:M"]
dependencies: []
order: 80
---

## Goal

The braid branch holds `main` before the final PR. Merging origin/main (0060 Workers as T3 subagents, 0082 The Questions panel, and whatever else landed) into the braid branch conflicts in 13 files: docs/board.md, docs/cli.md, docs/decisions.md, docs/roadmap.md, src/board/t3.ts, src/board/wake.ts, src/braids/reviews.ts, src/cli.ts, src/commands/board.ts, src/commands/clean.ts, test/cli.test.ts, test/requests.test.ts, test/reviews.test.ts. This strand resolves them, keeping both sides' intent.

Expected size: the merge itself, plus about 50 lines of resolution.

## Start here

- The braid's log and the reports of 0077's strands, in order A, B, G, D, H, C, E, F, I, J. J's report.md says how to resolve its conflicts in src/board/t3.ts and src/braids/reviews.ts with `braid launch` (0060).
- `git log origin/braid/0077-the-board-stays-fast-under-load..origin/main`: what main brings.

## Change

- Merge origin/main into this branch as its own merge commit and resolve every conflict.
- Keep 0077's async board path (no sync child process: test/board-async.test.ts), the git runner and per-root cache, fast-import record writes, the finished-thread memory (J), the probe, `braid gate`, the running count and the Tailscale caching.
- Keep main's `braid launch`, subagent workers, the Questions panel and their tests.
- In docs/decisions.md keep both sides' entries, and renumber where two share a number. In docs/roadmap.md keep both sides' lines.
- A call that main added on the board path must go through 0077's async runners.

## Already decided

- The coordinator's call under the free preset (2026-11-27): a merge strand, because the conflicts are in product code, which the coordinator doesn't resolve.

## Out of scope

- New behaviour.

## Completion

- [ ] origin/main is merged, with every conflict resolved, and the resolution of each file is listed in report.md
- [ ] test/board-async.test.ts and main's new tests pass
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
