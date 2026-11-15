# 0014/A report: who marks an item Done

**Research, not decided.** The user chooses; 0014's merge strand builds the choice.

## Answer

Yes: the coordinator should mark an item Done, not the worker. Where it lands should depend on who holds the base branch:

- **Strands:** after the merge, on the braid branch, in the commit where the coordinator already writes the braid's log entry. The PR never carries Done. Its reviewed head is the head that gets merged, and stamping Done costs no CI run.
- **Stories and the braid's final PR** (base `main`): on the PR branch, after review and green CI and before the handover, as a commit that changes only the status. The coordinator never commits to `main`.

The worker stops at **In Progress + an open PR**. That already shows as "In Review" on the board, so no new stored status is needed. One command, `braid done <id> [--head <sha>] [--merge]`, checks the conditions, sets Done, commits and pushes, and can also merge (details below).

## Evidence

- **Today Done comes before review in every multi-round PR.** In the PR histories of braid 0008, the worker's `Done` commit comes before the review fixes each time:
  - #80: `e7bb334 done`, then `b39c263 fix`
  - #81: `f9a7d0f Done`, then `4be188d fix`
  - #82: Done twice (`32165e5`, `39ca2e4`), then `4465338 fix`
  - #83: `996727f Done`, then `ab52585 docs`

  So "Done" meant "the worker's first green run", and it stayed Done through the fix rounds. 0008/F had to add a board rule for exactly this (an open PR wins over a stored Done, `derive` in `src/board/model.ts`).
- **Each Done commit costs a CI run.** `pull_request` CI has no path filter (`.github/workflows/ci.yml`), so a status-only commit reruns both OS jobs, about 3 to 4 minutes per run (the 0008/G runs). Push CI on `main` and `braid/*` ignores `braids/**`, so a status commit on the braid branch costs nothing.
- **The braid's own Done also moves a reviewed head.** In 0008 the final PR #84 was reviewed, and then `ec0077f docs(braids): 0008 done: report` landed on it and triggered another CI run.
- **A PR closed without merging can show Done.** `readGithub` keeps only open and merged PRs (`src/board/github.ts`), so a closed PR becomes `pr = null`. `derive` then treats a stored Done with no open PR as Done. If the closed PR's branch still exists, its copy (with Done) overlays the working tree (`loadLiveBraids`). The board then shows Done for work that was never merged. This affects today's flow and any option that stamps Done before the merge.
- **Merged strand branches stay on the remote** (`delete_branch_on_merge` is false). From the user's checkout of `main`, a strand's copy comes from its strand branch whenever that branch isn't in `main`. That is true until the braid's final merge (`src/braids/branches.ts`: strand branch, else braid branch). So the board reads a strand's stored status from its strand branch, not from the braid branch, until the braid merges. If Done is stamped after the merge on the braid branch, this matters (see the follow-ups).
- **The rules today:** the worker sets `In Progress` first and `Done` "in its last commit before reporting green" (skill, workflow "One writer per branch", brief template "Work on it"). Auto mode condition (2) reads "on the PR branch the strand is Done with every box ticked". `braid next` and `braid start` read the derived lane, not the stored status (`notReady`, `start.ts`), so they already treat a merged PR as Done.

## Options

- **A. The worker stamps it, and the board masks it** (today, patched). The worker keeps setting Done in its last commit. Patches: closed PRs count as not Done, Done is set once after the last fix round, and the CI box is dropped.
- **B. The coordinator stamps it on the PR branch before the merge.** It runs `braid done <id> --head <reviewed sha> [--merge]` once the review passes and CI is green. This commits Done on the PR branch (the worker has stopped by then), waits for CI on the new head, and then merges with `--match-head-commit <new head>`. It works the same way for stories, strands and the final PR.
- **C. The coordinator stamps it where it holds the base** (recommended). For a strand: after the merge, on the braid branch. For a story or the final PR: as in B, on its branch before the handover.

## Cases

| Case | A: worker stamps (today) | B: coordinator, on the PR branch before the merge | C: coordinator, on the base after the merge (stories: B) |
| --- | --- | --- | --- |
| Where the Done commit lands | PR branch, before review | PR branch, after review and green CI | Strand: the braid branch after the merge, in the log-entry commit. Story/final PR: as in B |
| "Merge exactly the reviewed head" | Holds only if Done precedes review. Fix rounds move the head anyway | Breaks: the head moves after review. `braid done` must check that the diff since the reviewed sha is the status line only | Strand: holds exactly. Story: as in B |
| Extra CI runs | One per Done commit (0008/B: two) | One per item, and the merge waits for it (~3-4 min) | Strand: none (braid-branch push ignores `braids/**`). Story: one, as today |
| Who writes the worker's branch | Worker only | Coordinator after the worker stops: one writer, handed over. If fixes follow, the worker must pull first | Strand: worker only. Story: as in B |
| What "Done" means | "The worker saw CI green" | Reviewed, green and accepted | Strand: merged. Story: reviewed, green and accepted, then merged |
| Should strands store Done at all? | Yes, set early | Yes | Yes, stamped after the merge. Without it, briefs on `main` say In Progress forever, and offline reads (`braid list`, the board without `gh`) are wrong |
| New "Ready" / "In Review" status | Not needed | Not needed | Not needed: an open PR is In Review (workflow). A stored one would lie after a close or a reopen |
| User merges in GitHub's UI | Done already in the PR | Not stamped. Repair needs a commit after the merge: on the braid branch for a strand, on `main` for a story (not allowed) | Strand: normal path (`braid done <id>` after the merge). Story: stamped before the handover, so already in |
| Squash merge | The PR counts as merged. The leftover branch still overlays (already in docs) | Same | Strand: `braid done` reads the PR state as MERGED, so the stamp works. Story: as today |
| PR closed unmerged | Shows Done (bug, see evidence) | Done only if stamped before the close: same bug, rarer | Strand: never stamped, stays In Progress, and the resume rules apply. Story: same bug as B, rarer |
| PR reopened | Open again, so In Review | Same | Same |
| Auto mode | Condition (2): "Done with boxes ticked" | `braid done --merge` checks 1-7, stamps, waits for CI, merges | `braid done --merge` checks 1-7 on the reviewed head, merges, stamps. Condition (2) becomes "boxes ticked and report.md present" |
| Spike / doc item without code | Same as code | Same | Same. With `ci: none`, the worker's gate report is the evidence and no CI wait applies |
| The braid's final PR | Coordinator's last commit after review moves the head (0008: `ec0077f`) | Same as a story | Same as a story: report before review, Done stamp after review, before the handover |
| Resuming after a crash | Done may be set with review pending; the board masks it | Stamp pushed but not merged: the diff check shows it is status-only, then merge. Merged but not stamped: as in a UI merge | Merged but not stamped: `braid status` shows lane Done with stored In Progress, so it can say "run braid done <id>". `braid done` is idempotent |
| Board / `braid status` / `braid next` | Lane: worker running, then In Review; Done after the merge; stored Done early | Lane the same; stored Done only after review | Lane the same. A strand's stored status reads In Progress until the stamp, and from `main` until the follow-up fix on branch overlay |
| Worker's last step | Tick boxes, report, Done, then a "CI green, Done" commit after green | Tick boxes and report; after green, only the chat report | Same as B |
| The "CI green" box | Ticked by the worker in an extra commit | Dropped: `braid done` checks CI | Dropped: `braid done` checks CI |

## Trade-offs

- **A** costs nothing to build, but Done never means accepted. It keeps an extra CI run per item and needs the board rule to hide it.
- **B** is one rule everywhere, but each item pays an extra CI run, and the merge waits for it. The reviewed head always moves. And merges in GitHub's UI need a commit on `main` for stories, or stay unstamped.
- **C** costs strands nothing in CI or head moves. It stamps where the coordinator already writes (the log entry), and handles UI and squash merges. Its costs: two rules (strand vs story), and strands read In Progress from `main` until the overlay fix below.

## Recommendation (research, not decided)

**C**, with a single command:

`braid done <id> [--head <sha>] [--merge]`, run by the coordinator:

- **Strand, PR open, `--merge`:** checks that the PR's base is the braid branch, its head is `<sha>` (the reviewed one), the `ci` checks are green on it, it is mergeable, the boxes are ticked, `report.md` exists and no worker thread is running. Then it runs `gh pr merge --merge --match-head-commit <sha>`, then does the next step.
- **Strand, PR merged (by any method):** in the coordinator's worktree on the braid branch, pulls, sets Done, and commits `docs(braids): <id> done` (optionally with the braid log entry from `--log -`), then pushes.
- **Story or the braid's own final PR, PR open:** the same checks. Then a status-only commit on its branch (a temporary worktree for a story, the coordinator's own worktree for the braid), pushed. It prints the new head for the recap. `--merge` (on request only) then waits for green and merges with `--match-head-commit <new head>`.
- **Already Done:** prints that and changes nothing.

This replaces the planned `braid merge <pr> --head <sha>` for strands, and wraps it for stories. 0014's merge strand would build `braid done` instead of `braid merge`, or keep `braid merge` as the bare merge step it calls.

## Proposed follow-ups

1. **0014 merge strand** (M, maybe L because it changes skills): `braid done` as above, plus skill, workflow and template changes:
   - The worker no longer sets Done and makes no commit after green.
   - The "CI green" acceptance box is dropped from the template and the skill.
   - Auto mode condition (2) is reworded.
   - "Accept and hand over" step 3 and "Finish" call `braid done`.
   - D-entry in `docs/decisions.md`, plus `docs/board.md` rule 1.
2. **Board fix, needed by A, B and C** (S): treat a closed, unmerged PR as not Done. Keep CLOSED PRs in `readGithub`, and ignore a stored Done whose branch copy has a closed PR. A test for "closed PR with Done on its branch".
3. **Overlay fix, needed by C** (S): skip a strand branch whose commit is already in its braid branch tip, so the stamped copy on the braid branch wins when read from `main`. One more `merge-base --is-ancestor`.
4. **`braid status` hint** (S, can go with 1): for "merged, stored not Done", print `run braid done <id>`.

Needs the user: decide A, B or C. If C, decide whether `braid merge` survives as its own command.

For later items: none built. The merge strand's brief should replace `braid merge <pr> --head <sha>` with `braid done <id> [--head <sha>] [--merge]` if C is chosen.

## Validation

Read the files listed under "Start here", `src/board/github.ts`, `src/braids/branches.ts` and `.github/workflows/ci.yml`. Checked the commit lists of PRs #80-#85 and the CI run times with `gh`. No code changed. The gate isn't needed for a report-only change, but it runs in CI on the PR.
