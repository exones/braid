# 0040/A report: braid wait

## What changed

- `braid wait <number> [--timeout <minutes>]` (new, `src/commands/wait.ts`, wired in `src/cli.ts`). It finds the braid's branch, fetches only that branch from `origin`, and walks its first-parent history to the newest commit with changes outside `braids/` and `epics/`, so a Done stamp or log commit on top is skipped and named. It then polls that commit's check runs every 15 s for the `ci` names of BRAID.md. Exit 0 and `green at <sha>`; exit 1 and the failed names once all have finished; exit 2 at the timeout (default 30 minutes, naming what failed, what is still running and what has not started), when no run has appeared within 5 minutes, or on any error. Once a run was seen, a failed or empty GitHub read is retried until the timeout. With no `ci` names it exits 0 at once.
- `auto-mode.md`, "Merging" step 4: run `braid wait <number>` as a background command and wait on it with the host's wait for background commands (`t3_background_wait` with `taskIds` in T3); the step also says what each exit code means (0 go on, 1 "Fixes", 2 `braid ask`). The step reads on its own, so 0040/E can move it as it is.
- `SKILL.md`, "Talking to the user": say "waiting" only when a watch, a background wait or a thread wait will wake you; otherwise say what you will do when the user next writes.
- Docs: `docs/cli.md` (table row), `docs/braids-format.md` (full behaviour), `docs/decisions.md` (D65 and its log line).
- `commitChecks` in `done.ts` is now exported so both commands read check runs the same way.

## Why

After a merge the coordinator made itself there is no PR to watch, so nothing woke it and the thread settled on "waiting" (braids 0012, 0020, 0027). A command that ends when CI ends gives the host something to wake on.

## Decisions made here

- Errors exit 2, not 1, so exit 1 always means a `ci` check failed and leads to "Fixes"; an error leads to `braid ask` instead.
- The command judges results itself: only success, neutral and skipped pass. The shared `runsOf` counts `cancelled` as passing, which would turn a cancelled matrix job into a green wait.
- The branch is that of the braid in this checkout; otherwise the only braid branch with that number. This repository has two braids numbered 0040 (`braid/0040-autonomy-presets` and `braid/0040-board-item-details-in-a-side-panel-not-a`); the first draft picked the wrong one, so a clash outside a checkout of the braid is refused, naming both branches.
- "No run appeared" ends after 5 minutes (or the timeout, if shorter), and only when no run was ever seen. A GitHub read error is retried until then, or until the timeout once a run was seen (the review found the first version gave up on one error after 5 minutes).
- The exit 2 `braid ask` in the skill step carries no `--key`: no stop case fits a missing CI answer.

## Validation

- `test/wait.test.ts`, 13 tests with a real repository, a bare remote, a fake `gh` and a fake clock: green after polling, failed (failure and cancelled), timeout while running, never started, a late start with a GitHub error, an error and an empty answer after 5 minutes of a running check, a timeout naming a failed check next to a running one, a BRAID.md without `ci` names, a braids/epics-only tip, the remote tip over an unpushed local commit, the number clash, usage errors, and the CLI's exit 2 on an error.
- A read-only run in this checkout, `braid wait 0040 --timeout 0.5`, skipped the braids-only tip 5a6d610 and answered `green at 68fe828` with exit 0.
- `npm run verify` passes.

## Open

- None for this strand.

For later items: `runsOf` in `src/board/github.ts` treats a `CANCELLED` (and `ACTION_REQUIRED`, `STALE`) conclusion as passing, so `braid accept`, `handover` and the board can count a cancelled `ci` check as green. Worth a small fix. Separately, two braids share the number 0040 on this repository's branches.
Needs the user: none
