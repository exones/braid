# 0014: braid facts, recap and merge

## What changed

- **A, spike: who marks an item Done.** Recommended option C, which the user chose. The coordinator marks Done after review and merge; workers stop when the PR is open, CI is green and the report is written (D43).
- **B, board (#87).** Merged and closed PRs are cached. A PR closed without merging never makes an item Done: a stored `Done` next to one reads as To Do. A strand branch that is merged and already contained in the braid branch yields to the braid branch.
- **C, `braid done <id> [--head <sha>] [--merge]` (#88).** This is the only merge command. For a strand, it merges only the reviewed, green head, then records Done on the braid branch. For a story or the final PR, it makes a status-only commit at the reviewed head in a temporary worktree, waits for green, then merges exactly that head. It refuses when the head moved, the checkout is wrong or dirty, or T3 can't be read, and it can finish a run that stopped halfway. `braid status` prints `run braid done <id>` for items that are merged but not yet Done. The skills and the brief template follow: workers never set Done, and the "CI green" box is gone. D43; D31 and D33 updated.
- **D, `braid facts <pr>` and `braid recap <id>` (#89).**
  - `braid facts` prints each stop-case diff fact with the case it points to: dependency and process files, deleted tests, skip and only markers, and a size over twice the brief's expected size.
  - `braid recap` drafts the recap and the braid log line from `report.md`, the PR head and checks, and the facts.
  - The skills call both commands instead of the hand-run steps, going from 9,384 to 9,131 words. Decision D44.
- **E, final review fixes (#91).** The recap draft gets a Screenshots line, its log line follows the `assets/brief.md` template, branch parsing reuses `keyOfBranch`, the full case name `quality or scope` is kept, and D44 has its decision-log line. `braid facts` now reads the expected size from the number of lines (the upper end of a range); it used to take the file count.
- The goal's separate `braid merge` became `braid done --merge` (A, option C).

## Why

The coordinator used to assemble the stop-case facts, recaps and merges by hand. Done was also set by the worker before review, so the board showed unreviewed work as Done.

## Validation

- `npm run verify` passed on every strand, and CI passed on Windows and Ubuntu for each PR.
- Independent reviews (grok-4.6) of C and D found nothing blocking. C's three suggestions were applied before its merge.
- The final review of #90 (grok-4.6) found nothing blocking. Its five suggestions and one bug found by running `braid recap` are fixed in E (136 tests).
- D was merged with `braid done 0014/D --merge --log -` from this branch's build, the command's first real use.

## Open

- Auto mode's checks in `braid done --merge`: later, when unattended runs are wanted (the user, 2026-11-14).
- What the user learned trying 0008: still to come.

For later items: coordinators use `braid done`, `braid facts` and `braid recap` once 0014 is in `main` and the skills are reinstalled. `workflow.md` allows the D43 Done stamp as an exception to "one writer per branch".

Needs the user: process: the skills' Done rule, accept step and recap changed (C, D; you decided this in the plan and approved it at each merge).
