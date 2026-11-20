---
id: '0052'
title: "Sweep: Windows board-test cleanup flake, braid-researcher in AGENTS.md"
status: In Progress
labels: ["kind:task", "tier:L", "sweep"]
dependencies: []
related: ['0049']
delivery: epic
---

## Goal

The sweep of 2026-11-20 (the user chose "Sweep as proposed"). Two leftovers get fixed in one PR into `main`: the Windows CI flake where `test/board.test.ts` fails to delete its temp folder with EPERM, and the missing braid-researcher line in `AGENTS.md`. Unrelated PRs stop needing a rerun, and agents reading `AGENTS.md` learn that the researcher skill exists.

Expected size: about 20 to 40 lines in 2 or 3 files.

## Taken leftovers

- `2026-11-20-uebf`, from 0048, ref https://github.com/exones/braid/actions/runs/44753244091. **Windows CI flake: board.test.ts cleanup fails with EPERM.** On the braid/0048 branch at c1eafc9 (merge of 0048/B), verify (windows-latest) failed only in test/board.test.ts:14 (the after hook): rmSync of C:\Users\RUNNER~1\AppData\Local\Temp\braid-board-* threw EPERM, Permission denied. All 387 tests passed, and a re-run of the job was green. Likely a board server or watcher still holds a handle in the temp folder when the hook deletes it. Fix: close the board and its watchers before cleanup, or rmSync with maxRetries and retryDelay.
- `2026-11-20-vhpm`, from 0050, ref https://github.com/exones/braid/actions/runs/44757589491. **Flaky on Windows: board.test.ts temp-folder cleanup fails with EPERM.** A Windows CI job failed once with EPERM while removing a temporary folder in test/board.test.ts (385 of 386 tests passed); the rerun of the same commit passed. Seen on PR #189 at 82d4b02, run 44757589491. Where: test/board.test.ts, the temp-dir cleanup after a test (likely a file handle still open, e.g. a board server or child process not yet closed on Windows). Why: red CI on unrelated PRs costs a rerun and a worker round each time; retry the rm (fs.rm with maxRetries) or close the handle before cleanup.
- `2026-11-20-88t8`, from 0046, ref https://github.com/exones/braid/pull/180. **AGENTS.md doesn't list braid-researcher.** What: AGENTS.md "Where to look" names braid, braid-worker and braid-reviewer but not the new braid-researcher skill (a researcher subagent for one question, launched by a coordinator or worker). Where: AGENTS.md, Where to look. Why: agents reading AGENTS.md won't know the skill exists; AGENTS.md changes only on the user's request, so 0046 left it out.

## Start here

- `test/board.test.ts`: line 14, the `after` hook, already calls `rmSync(scratch, { recursive: true, force: true, maxRetries: 20, retryDelay: 250 })`, and it still failed twice. So retries alone are not the fix. Read `withBoard` (around line 80): it spawns `braid board --no-open`, then `child.kill()` and waits for that child's `exit`. On Windows `kill()` ends only that process, not the `git` (or other) children the board started for its background read, and those can keep a handle in `scratch` after the hook runs. Also look at the test near line 228 that starts its own `server`.
- `src/` board code (the background snapshot read, added in 98090bc `feat(board): answer from a snapshot read in the background`): how the board starts its children and whether it ends them on SIGTERM.
- The two failed runs above (`gh run view <id> --log-failed`) for which file or folder was locked.
- `AGENTS.md`, "Where to look", and `.agents/skills/braid-researcher/SKILL.md` for its own description.

## Change

- Find what still holds the temp folder on Windows and make the test end it before cleanup (or make the board end its children when it is stopped, if that is the cause and a product bug). A longer retry is acceptable only as a second line of defence, not the fix.
- `AGENTS.md`, "Where to look": one line for braid-researcher, in the style of the worker and reviewer lines: what it is for and that only a coordinator or worker launches it (a researcher subagent for one question, or the method a spike worker follows).

## Already decided

- The user's request for the `AGENTS.md` change is the sweep answer "Sweep as proposed" (2026-11-20); the user merges this PR. That change makes the item tier L (workflow, "Tiers": any change to agent instructions).
- Passed, not in this sweep: `2026-11-20-a3by` (evaluate braid-researcher on real braid questions), spike-sized, its own braid later.
- Related to 0049 (One board for all your projects, on `braid/0049-one-board-for-all-your-projects`): 0049/C reworks the board server and may touch `test/board.test.ts`; 0049/F fixes a different flaky test (`test/notify.test.ts`). Keep this change small and local to the cleanup so 0049 merges `main` with at most a trivial conflict; this story goes into `main` on its own.

## Failure modes

- The fix hides a real leak: the board keeps child processes alive after it is stopped. If so, fix the board (it ends its children when stopped), not only the test.
- Killing a process tree on Windows needs a different call than on Linux (`taskkill /T` versus a process group); keep it cross-platform, CI runs both.
- The test waits forever for a child that never exits: any wait for exit has a bound and fails with a clear message.

## Regression tests

- A check that, after `withBoard` returns, no process the board started is still running (or that the scratch folder can be deleted at once without retries), run on Windows and Linux in CI.
- If the board itself changes how it stops, a test that stopping it ends its background children.

## Out of scope

- Other flaky tests (`test/notify.test.ts` is 0049/F; `test/done.test.ts` at midnight UTC is an idea in the inbox).
- Any other edit to `AGENTS.md`, `CLAUDE.md`, `BRAID.md` or the skills.

## Plan

1. Reproduce on Windows: start the board in process on a temp repo, close the server, delete the folder at once.
2. Board: `Started.close()` closes the server and waits until the read in flight (and the one queued after it) has ended, so no `git`, `gh` or `t3` child it started still runs in the repository.
3. `test/board.test.ts`: the in-process test stops the board with `close()`; `withBoard` waits at most 10 s for the board to exit; a new test deletes both boards' repositories without retries right after they stop.
4. `AGENTS.md`: the braid-researcher line in "Where to look".

## Completion

- [x] The cause of the EPERM is named in report.md, with the evidence (log line, reproduction or reasoning from the code)
- [x] `test/board.test.ts` cleanup no longer depends on retries to pass: what held the folder is ended before the delete
- [ ] The regression test above exists and passes on Linux and Windows
- [x] `AGENTS.md` "Where to look" lists braid-researcher, and nothing else in it changed
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open
