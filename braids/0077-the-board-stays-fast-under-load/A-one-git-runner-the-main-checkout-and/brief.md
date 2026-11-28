---
id: '0077/A'
title: "One git runner, the main checkout and repo name cached per root"
status: To Do
labels: ["kind:task", "tier:M"]
dependencies: []
order: 10
---

## Goal

The board and the CLI run git through one runner, and the two values every refresh asks git for again, a root's main checkout and its repository name, are read once per root and cached. Part of idea 2026-11-24-l7dw: sixteen direct `spawnSync("git")` sites and several identical "main checkout" functions; caching removes about eight synchronous git calls per refresh. This strand is the base B builds on: B makes the board process's calls asynchronous through this runner.

Expected size: about 250 lines in 12 files.

## Start here

- `src/braids/gitio.ts`: `gitAsync`, `catBatch`, `catBatchSync`, and `spyOnGit` / `noteSyncGit`, which tests use to count git processes.
- The main-checkout functions: `mainCheckout` in src/board/t3.ts and src/braids/state.ts, `mainCheckoutOf` in src/braids/worktrees.ts and src/commands/projects.ts.
- `titleRepoName` in src/braids/title.ts (`git remote get-url origin` on each call).
- The other git runners: src/braids/branches.ts, src/braids/gitbranch.ts, src/braids/numbers.ts, src/board/done.ts, `runGit` in src/commands/board.ts, `git` in src/commands/done.ts.
- test/board-cheaper-reads.test.ts: how a test counts git calls.
- `BRAID_BOARD_TIMINGS=1` (src/board/feed.ts): per-source timings of one read.

## Change

- One git module (gitio.ts or next to it): a sync and an async runner with the same options (cwd, `core.quotePath=false`, timeout, `windowsHide`), both reported to `spyOnGit`; the other git runners call it.
- `mainCheckout(root)` and `repoName(root)` once, cached per resolved root for the process's life (a main checkout and an origin URL don't change under a running board), with an async form; every caller uses them.
- Measure a board read of this repository with `BRAID_BOARD_TIMINGS=1` before and after, and put both in report.md.

## Already decided

- A cache per root, kept for the process's life; no expiry, no invalidation. Tests that need a fresh value get a reset hook.
- Behaviour doesn't change: same commands, same outputs, same errors.
- Converting the board's sync calls to async is B, not this strand.

## Out of scope

- The rest of l7dw (BRAID.md reader, CLI table, shims, gate scripts).

## Completion

- [x] One git runner; the other git spawn sites in src/ call it (any left say why in report.md)
- [x] Main checkout and repository name are read once per root, with a test counting the git calls of two refreshes
- [x] report.md has the `BRAID_BOARD_TIMINGS` read of this repository before and after
- [x] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open
