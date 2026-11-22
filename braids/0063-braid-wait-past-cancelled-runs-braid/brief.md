---
id: '0063'
title: "braid wait past cancelled runs; braid clean drops reviewer branches"
status: Done
labels: ["kind:story", "tier:M"]
dependencies: []
delivery: epic
---

## Goal

Two bugs that a coordinator in another project reported in braid's own tooling. They cost a coordinator time after every merge it makes itself.

1. **`braid wait` reports a false failure when a newer commit cancels the run.** In a project whose CI cancels older runs on the same branch (`concurrency` with `cancel-in-progress`), the `Done` commit that `braid accept` pushes right after the merge commit starts its own run and cancels the merge commit's run. `braid wait` reads only the newest commit outside `braids/` and `epics/` (the merge commit), so it sees `CANCELLED` and exits as failed. The coordinator saw exit 126. The `Done` commit's run tests the same code and passed. That project's CI doesn't skip `braids/`-only pushes, so the assumption written in the header of `wait.ts` doesn't hold there.
2. **`braid clean` keeps the reviewers' `t3/*` branches** with "not fully merged here". `git branch -d` checks the branch against this checkout's `HEAD`, while the reviewer's branch sits at the PR head or at a braid branch's commit that `HEAD` doesn't hold. This checkout already has 22 `t3/*` branches, and 21 of them have tips that are on `origin`.

Expected size: about 150 lines in 4 files, most of them tests.

## Start here

- `src/commands/wait.ts`: `ciCommit` walks the first-parent line to the newest commit that changes code. `resultOf` treats every finished conclusion other than success, neutral or skipped (including `CANCELLED`) as failing.
- `src/commands/done.ts`: `commitChecks` reads one commit's check runs. `greenBelow` already accepts a green run on a lower commit when everything above it is `braids/`-only, so it is the mirror case and worth reading.
- `src/commands/clean.ts`: in `reviewThreads`, the block that deletes the `t3/…` branch with `git branch -d`.
- `test/wait.test.ts`, `test/clean.test.ts` (or wherever these commands are tested now) and `test/reviews.test.ts`: the fakes for `gh` and T3.

## Change

- `src/commands/wait.ts`: a check is answered by the newest commit, from the branch tip down to the CI commit, that has a run for it. Every commit above the CI commit changes only `braids/` or `epics/`, so it tests the same code. A `CANCELLED` run on a commit stays pending, not failing, while a newer commit in that range has a run for the same check, or may still start one. Give the second case a bounded window, like the 5-minute start limit, and record the window chosen in report.md. When the answer comes from a newer commit, the output names that commit, as the `tip … CI runs on …` line does today. A cancelled run with no newer run still ends as failed.
- `src/commands/clean.ts`: a recorded reviewer's `t3/…` branch whose worktree was removed is deleted when its tip is on a remote-tracking ref of `origin` (`git branch -r --contains`) or is the merged PR's head. Then it is safe to force the delete, because no commit is lost. A branch with commits found nowhere else is still kept, with the current message.
- The help line for `wait` in `src/cli.ts`, the header comments of both files, and `docs/cli.md` wherever they describe this behaviour.
- Tests: a cancelled run on the CI commit with a green run on a `braids/`-only commit above it gives exit 0, and the same with a failing run gives exit 1. A cancelled run with no newer commit gives exit 1. A cancelled run with a newer commit and no run yet keeps waiting (exit 3 at a short timeout). A reviewer branch whose tip is on `origin` but not in `HEAD` is removed, and one with a commit of its own is kept.

## Already decided

- This is braid's bug, not the other project's: `braid wait` must work with any project's CI, including one that runs on `braids/`-only pushes and cancels older runs.
- Only the recorded reviewer's branch is in scope for `braid clean`. Other `t3/*` branches stay untouched, since they may belong to the user's own T3 worktree threads.
- No change to `.agents/skills/` or `BRAID.md`.

## Out of scope

- A sweep of the `t3/*` branches already left in this checkout whose review records are gone.
- Changing this repository's CI workflow (`concurrency`, `paths-ignore`).
- Where the exit code 126 came from in the other project's shell: `braid wait` itself exits 1 on a failure.

## Completion

- [x] `braid wait` answers from a newer commit's run when the CI commit's run was cancelled and every commit between them changes only `braids/` or `epics/`, with tests for green, failed, cancelled with no newer commit, and a newer run not started yet
- [x] `braid clean --yes` deletes a recorded reviewer's `t3/…` branch whose tip is on `origin` or is the merged PR's head, and keeps one with commits found nowhere else, with tests for both
- [x] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open
