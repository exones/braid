# 0077/A report

## What changed

- `src/braids/gitio.ts` gains `gitSync(root, args, {input, env, timeout, maxBuffer})`, the one synchronous runner (`core.quotePath=false`, `windowsHide`, UTF-8, reported to `spyOnGit` as a sync process). `gitAsync` stays the async one. The sync spawn sites in `branches`, `gitbranch`, `numbers`, `board/done`, and `commands/{done,clean,start,board,coordinate,logs,requests,projects}` now call `gitSync`; each keeps its own timeout and buffer.
- New `src/braids/repo.ts`: `mainCheckout`, `mainCheckoutOf`, `repoNameOf`, `originRepoName` (the title name, `titleRepoName`) and async forms `mainCheckoutAsync`, `mainCheckoutOfAsync`, `originRepoNameAsync`. Each is read once per resolved root and kept for the process's life; `resetRepoCache()` is the test hook. A root that is not a repository is not cached. The four old copies (`state.ts`, `worktrees.ts`, `board/t3.ts`, `title.ts`) re-export or wrap these.
- New test `test/git-cached-per-root.test.ts`: two refreshes' worth of lookups start exactly two git processes (one `rev-parse`, one `remote get-url`), the second refresh none.

## Why

Every refresh re-asked git for the same two values, about eight synchronous processes each. B makes the board's git calls async through this one runner.

## Validation

- `npm run verify`: `npm run verify` passed (709 tests). An earlier run failed once in the cross-process stale-lock test of requests.test.ts under machine load; it passes alone and on the rerun.
- `BRAID_BOARD_TIMINGS=1`, `braid board --port 7911` of this repository, 40 s per run, temp HOME, t3 off PATH. The machine was running other gates, so times swing widely; steady reads (after the first):
  - before (d8411ad): `braids 1169 ms, signals 487, done dates 106, board 1181` and `braids 2458, signals 2228, board 1982` (load spike).
  - after: `braids 1008 ms, signals 182, done dates 85, board 1508` and `braids 1970, signals 312, done dates 111, board 1295`.
  The gain is small against the noise (about 8 short git processes per read); the deterministic evidence is the process count in the new test.

## Docs

None affected: no doc names these functions; behaviour and output are unchanged.

## Open / deviations

- `t3.mainCheckout` used `git worktree list` (first entry); it now uses the common dir, as the other three did. Same folder for ordinary repositories; on Windows it comes back with backslashes rather than forward slashes (the T3 comparison normalises both).
- Left alone: `board/github.ts` spawns `gh`, not git; `catBatch`/`catBatchSync` stay in gitio.ts with their own streaming spawn (stdin input, a custom command).
- The new `.ts` files are LF.

For later items: callers in the board's sync reads can move to `mainCheckoutAsync` / `originRepoNameAsync` in B.
Needs the user: none
