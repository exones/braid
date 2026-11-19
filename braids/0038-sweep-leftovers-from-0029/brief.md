---
id: '0038'
title: "Sweep: leftovers from 0029"
status: To Do
labels: ["kind:task", "tier:M", "sweep"]
dependencies: []
delivery: epic
---

## Goal

Clear eight leftovers from the inbox: two that 0029 (Sweep: leftovers from 0027, PR #158) left (the CLI page gets its missing `braid title` entry, and `catBatchSync` gets failure tests), and four added at the 0034 sweep (a cancelled CI check no longer counts as green, `braid ask` and `braid answer` find a braid that lives only on its branch, the board panel's history rules get tests, and the README shows the new item panel), and two added at the 0037 sweep (two Windows test flakes). Tier M because the CI-check fix decides whether a PR may be accepted or merged. Runs after 0037 (Coordinator asks with the question tool and set options).

Expected size: about 240 lines in 11 files, tests included.

## Start here

- `docs/cli.md` and `braid help`: the page says it mirrors help.
- `src/braids/gitio.ts`: `catBatchSync` and the async `catBatch` (which takes a command override to inject a hang); `src/braids/branches.ts`: `prefetchBriefs`, `gitTree.read`.
- The existing tests of `catBatch` under `test/`.
- `src/board/github.ts`: `runsOf`; `src/commands/wait.ts` for the conclusions it already treats as passing.
- `src/commands/requests.ts` (`braid ask`, `braid answer`) and how `braid view` and `braid list --open` find a braid on its own branch.
- `web/src/App.tsx`: `go`, `closeDetails`, `pushedOpen`; `src/board/route.ts` and `test/board-route.test.ts`.
- `README.md` around lines 59-61 and `docs/design/board-screenshots/71-details-panel.png`.

## Change

- **docs/cli.md lacks braid title** (leftover 2026-11-19-8nw9, from 0029, https://github.com/exones/braid/pull/158): docs/cli.md says it mirrors braid help, but it has no entry for braid title (the command that prints thread titles such as "💻 braid 0021 worker: ..."). Add it so the CLI page matches help.
- **catBatchSync has no failure test** (leftover 2026-11-19-u94h, from review 0029, https://github.com/exones/braid/pull/158#issuecomment-7016854656): catBatchSync (src/braids/gitio.ts, added by 0029) has no test for a Git failure, a missing object or a hung process, and unlike the async catBatch it takes no command override to inject a hang. On a non-zero exit it returns nulls, prefetchBriefs does not cache them, and gitTree.read falls back to `git cat-file blob` with no timeout. A test for each case would lock the fallback behavior of braid list --open, braid view --links and braid check.

- **A cancelled CI check counts as green** (leftover 2026-11-19-u5b4, from 0034/A, https://github.com/exones/braid/pull/162): runsOf in src/board/github.ts treats the check conclusions CANCELLED, ACTION_REQUIRED and STALE as passing. braid accept, braid handover and the board read checks through it, so a `ci` check that was cancelled (a superseded or manually stopped run) can let a PR be accepted, handed over or merged as green. braid wait (src/commands/wait.ts) decides for itself and passes only success, neutral and skipped; the shared reader should do the same, with a test per conclusion.
- **braid ask can't find a braid that lives only on its branch** (leftover 2026-11-19-5aug, from 0041): from the main checkout, `braid ask 0041 ...` failed with "no braid 0041" while `braid list --open` showed 0041 (read from its braid branch). A coordinator waiting for a go on a story that isn't started has to open a temporary worktree on the branch to ask. ask (and answer) should find a braid the way list and view do.
- **Test the board panel history rules** (leftover 2026-11-19-qk9d, from review 0034, https://github.com/exones/braid/pull/161#issuecomment-7018360826): web/src/App.tsx: go, closeDetails and pushedOpen decide push vs replace when opening, moving inside and closing the item panel (0034). Only parseHash/hashFor are tested (test/board-route.test.ts). A pure helper for push-vs-replace and close-with-back-vs-replace, with tests, would lock that one Back closes the panel and that a link opened on a fresh load closes to #/ by replace instead of leaving the site.
- **README still shows the old full-page item screenshot** (leftover 2026-11-19-urnm, from review 0034, same comment): README.md (around lines 59-61) shows docs/images/item-page.png as "an item page on the board". Since 0034 the item details open as a side panel over the board. Replace it with a screenshot of the panel (docs/design/board-screenshots/71-details-panel.png is one) and fix the caption.
- **Flaky temp-folder cleanup in tests on Windows** (leftover 2026-11-19-duld, from 0040/B): the teardown hook of test/t3.test.ts (line 10) deletes its temp folder with rmSync(scratch, { recursive: true, force: true }), and on the Windows runner it failed once with EPERM (a process still held the folder). The whole verify (windows-latest) job went red on a docs-only PR (#164 at cdb7f02) and passed on a re-run. Adding maxRetries (and retryDelay) to that rmSync, and to the other temp cleanups in test/, would stop a red CI that blocks auto-mode merges for no reason.
- **Flaky hung cat-file test in board-cheaper-reads** (leftover 2026-11-19-kr3i, from 0039): the test "a hung git cat-file --batch ..." in test/board-cheaper-reads.test.ts uses a 400 ms timeout that races the start-up of the child node process when the full suite runs on Windows, so the gate fails at random (seen locally in 0039; it passes 3 of 3 runs on its own). A longer timeout or a start-up handshake before the clock starts would make it stable.

## Already decided

- `catBatchSync` may take a command override like `catBatch`, for tests only; its behaviour stays as it is (nulls on failure, no caching of nulls).
- Runs after 0037; no shared files.
- Cancelled, action-required and stale checks are not green anywhere: the shared reader passes the same conclusions as `braid wait` (success, neutral, skipped).
- The duplicate braid number leftover (2026-11-19-fi8d) is not in this sweep: it becomes its own braid, planned when the user asks.

## Out of scope

- Changing the fallback itself (for example a timeout on `git cat-file blob`); if a test shows it is needed, propose it under "For later items".

## Completion

- [ ] `docs/cli.md` has a `braid title` entry matching `braid help`
- [ ] Tests for `catBatchSync`: a Git failure, a missing object, and a hung process (through an injected command)
- [ ] A cancelled, action-required or stale `ci` check is not green for `braid accept`, `braid handover` or the board (a test per conclusion)
- [ ] `braid ask` and `braid answer` work from the main checkout for a braid that lives only on its branch (test)
- [ ] The panel's push/replace and close rules are a pure helper with tests, including a link opened on a fresh load
- [ ] README shows the item panel screenshot with a matching caption
- [ ] Temp-folder cleanups in test/ retry on Windows (maxRetries, retryDelay), and the hung cat-file test no longer races the child's start-up
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
