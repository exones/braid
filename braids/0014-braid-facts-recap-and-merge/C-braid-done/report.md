# 0014/C report: braid done

## What changed

- **`braid done <id> [--head <sha>] [--merge] [--log <file>|-] [--thread <id>]`** (`src/commands/done.ts`), option C of spike 0014/A:
  - Strand, PR open: needs `--head` and `--merge`. Checks the base is the braid branch, the head is the reviewed sha, each `ci` check passes on it, GitHub says mergeable, no unticked box at that head, `report.md` there, T3 readable with no running thread for the strand, and this checkout on the braid branch with no tracked changes (so the stamp can follow). Then `gh pr merge --merge --match-head-commit <head>`, then the merged path.
  - Strand, PR merged (any way): this checkout must be on the braid branch with no tracked changes. Pulls `--ff-only`, sets Done, appends the `--log` entry to the braid's log, commits `docs(braids): <id> done`, pushes.
  - Story or final PR, open: the same checks against `main` (for a final PR also every strand Done at the head). Then a status-only commit in a temporary detached worktree at the head, pushed to the PR branch, and `head <new sha>` printed. `--merge` polls until the `ci` checks pass on the new head, then merges exactly that head. A failure or a moved head stops it: Done, not merged.
  - Already Done: says so and changes nothing. A story already stamped at the head, run with `--merge`, only waits and merges (resume after a crash). No PR, a closed PR, a merged story without Done (braid never commits to `main`), a wrong checkout and bad arguments are refusals. Each names the failed condition.
- **`braid status`** ends a line with `run braid done <id>` when its PR is merged and the stored status isn't Done.
- **Skills**: the worker no longer sets Done and makes no commit after green. The template drops the CI box and gets `braid done` lines; the braid log entry now goes through `braid done --log -`. The coordinator runs `braid done` in Accept and hand over (story before the recap, strand after the merge), Merge on request, Auto mode (condition 2 reworded: boxes ticked and `report.md` present) and Finish (the braid's report and boxes before review, Done after). Resuming follows the status hint. The workflow's "One writer per branch" (including the one exception: the Done stamp the coordinator commits on a story's or final PR's branch after its worker has stopped) and the cases table changed to match.
- **Docs**: D43 and a log line in `docs/decisions.md`. D31 and D33 reworded. `docs/board.md` rule 1, `docs/braids-format.md` (the command and the status hint), the README's board sentence, `braid help`.

## Why

This is the user's choice of 2026-11-14 on spike 0014/A. A strand's merged head is exactly the reviewed one, and its stamp costs no CI run. Done means reviewed and merged (or accepted, for a story), not the worker's first green run.

## Validation

- `test/done.test.ts`, 13 tests. They use temporary repositories with a bare remote, a fake `gh` whose merge really merges in the remote, and stubbed T3. Covered: strand merge and stamp (with the log entry), every refusal on an open strand PR (no `--merge`, head moved, checks failing or pending, conflicts, mergeable unknown, wrong base, running worker, T3 down, unticked box, no report), a UI-merged strand stamped once and the status hint before and after, wrong checkout and dirty tree (also refused before the merge of an open strand PR), a story stamped (only `brief.md` in the diff, no worktree left), a story with `--merge` (waits through pending, merges the new head; stops on failure), the recovery path (a story already Done at `--head`, a second call with `--merge` waits for green and merges that head without a second stamp), a final PR needing its strands Done, the remaining refusals, and `openBoxes`.
- `npm run verify` passes (128 tests).

## Open

- A box naming CI is exempt from the ticked-boxes check, because older briefs still carry one and `braid done` checks CI itself. It is not ticked by the stamp.
- The T3 check refuses when T3 can't be read. In a project without T3 a strand can still be merged by the user and then stamped with `braid done <id>`, which needs no T3.

For later items: `mainBranch` is now exported from `src/commands/start.ts`. 0014/D (`braid facts`, `braid recap`) can print the `braid done` line for the recap's head. Idea: the board could flag "merged, not Done" like `braid status` does.

Needs the user: none
