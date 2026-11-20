## What changed

- **Cause of the EPERM.** `startBoardWith` starts its first background read as soon as it is called (`const first = refresh()`). The in-process test "the server binds to 127.0.0.1 only" closed the server right after it started, so that read was still running `git`, `gh` and `t3` with their working folder in the test's repository inside the scratch folder. The `after` hook then deleted the scratch folder; on Windows a folder that is a running process's working folder can't be deleted, so `rmSync` failed with EPERM even with 20 retries over 5 s whenever those children were slow (the runner was busy; the board test file took 57 s there).
  - Evidence: both failed Windows jobs (run 44753244091 job 136346226237, run 44757589491 job 136361293131) fail only in the `after` hook at `test/board.test.ts:14` with `EPERM, Permission denied` on the scratch root. Locally on Windows, `startBoard` + `server.close()` + an immediate `rmSync` of the repository failed 10 times out of 10; with the fix 0 out of 10.
  - The `braid board` processes started by `withBoard` were not the cause: they run with `PATH` set to the scratch folder, so they find no `git`, `gh` or `t3` and start no children.
- **Board.** `Started` has a new `close()`: it closes the server (and the Tailscale listener) and resolves once the read in flight and the one queued after it have ended. Nothing else in the board changed; `braid board` itself still stops by being ended.
- **Tests.** `test/board.test.ts`: the in-process test stops the board with `await close()`. `withBoard` waits for the board process to exit for at most 10 s and then fails with its pid. A new test, "a stopped board leaves nothing running in its repository folder", starts the board in process and through the CLI and deletes each repository at once, without retries. The `after` hook keeps its retries as the second line of defence.
- **AGENTS.md.** "Where to look" has one line for braid-researcher, in the style of the worker and reviewer lines. Nothing else in it changed.

## Validation

- The new test fails without the fix (with `close()` not waiting): `EPERM, Permission denied: '...\braid-board-...\repo-10'`, the same error as in CI. With the fix it passes.
- `node --test test/board.test.ts`: 11 of 11 pass on Windows.
- `npm run verify` (the gate) passes on Windows: 386 of 386 tests.

## Open

- Other test files start the board in process and only call `server.close()` (`test/github.test.ts`, `test/t3.test.ts`, `test/board-actions.test.ts` and more). Those mostly inject fake `gh`/`t3`, but `git` still runs, so the same flake is possible there, less likely.

For later items: switch the other in-process board tests to `close()` (`test/github.test.ts`, `test/t3.test.ts`, `test/board-*.test.ts`); small, tier S.
Needs the user: process: this PR changes AGENTS.md (the braid-researcher line you asked for in the sweep); you merge it.
