---
id: '0022'
title: "Board: a braid being planned shows Working"
status: To Do
labels: ["kind:story", "tier:M"]
dependencies: []
delivery: epic
---

## Goal

A braid that a coordinator is planning shows in Working on the board and in `braid status`, not in To Do. Today the user sees a To Do card (and has to remember that someone already has it) from the moment a coordinator starts until the braid's `In Progress` commit after the planning merge. Observed on 0020 on 2026-11-18: the coordinator was merging the planning PR #123 and waiting for its CI while the card sat in To Do as `Outline`.

Expected size: about 150 lines in 7 files.

## Start here

- `docs/board.md`: "Lanes" (the Working row promises "the coordinator planning"), "How an item's lane is chosen", "What counts as an agent of an item" and "Start". Decision D46 in `docs/decisions.md` is the reason the coordinator is no agent.
- `src/board/model.ts`: `derive` (an item's lane), `braidLane` and `toCard` (a braid's lane), `startOf` (when Start is off) and `coordinatorOf`.
- `src/board/t3.ts`: `coordinators`, the running coordinator threads by braid number, found by the title `<repo> <number> coordinator: …`.
- `src/board/github.ts`: `readFresh` and `keyOfBranch`. A planning PR (`plan/<slug>` into `braid/<number>-<slug>`) has no item key, so it is dropped today; `baseRefName` is already read.
- `src/commands/coordinate.ts`: `braid status`, which builds the same cards.
- `test/lanes.test.ts`, `test/github.test.ts`, `test/board-start.test.ts`: the tests to extend.

## Change

- `src/board/github.ts`: keep the open planning PRs, by the braid number of their base branch (head `plan/…`, base `braid/<number>-<slug>`), apart from `prs`.
- `src/board/model.ts`: a braid whose lane would be To Do is Working when a coordinator thread of it runs, or a planning PR into its braid branch is open. This holds with and without strands. While that PR's checks run, the card shows the checks activity.
- `src/board/model.ts`, `startOf`: when a coordinator runs, Start's reason stays "a coordinator for this braid is running" (check it before the lane).
- `src/commands/coordinate.ts`: the braid's line in `braid status` shows the same lane as the board.
- `docs/board.md`: the new rule in "How an item's lane is chosen" and in "What counts as an agent of an item". `docs/decisions.md`: a new decision that amends D46, with the reason from the Goal.

## Already decided

- Only To Do is lifted. Done, To Review and Needs You are decided as today, so an open plan request (`braid ask --kind plan`) still shows Needs You while a coordinator runs or a planning PR is open.
- The coordinator is still no agent of an item: it does not count for a strand, does not hold back or start the `checks failed` and `stalled` alarms, does not block `braid accept`, and gets no agent mark. The card already shows its thread button.
- A planning PR is never the braid's own PR. It must not be put into `prs` under the braid's number: a merged one would make the braid Done.
- A coordinator thread that is idle (its turn ended, nothing asked, no planning PR open) lifts nothing: the braid reads To Do again. No alarm is added for that.
- Between strands is already covered by `braidLane` (stored In Progress, or a strand Done).
- Start after PR #122 (0021) is merged, and merge `main` first: it changes the same functions in `src/board/model.ts`, `github.ts` and `t3.ts`, and adds a `plans` map of merged planning PRs that is not this one.

## Out of scope

- How coordinator threads are found. A coordinator whose thread isn't titled `<repo> <number> coordinator: …` stays unseen.
- Any change to the alarms, to the lanes of strands, or to the Start action itself.
- New marks, icons or colours on the card.

## Completion

- [ ] A To Do or Outline braid with a running coordinator thread is in Working on the board and in `braid status`, with and without strands; with no coordinator and no planning PR it is in To Do (tests)
- [ ] A braid with an open planning PR into its braid branch is in Working, with the checks activity while the checks run; after that PR merges or closes, the PR alone no longer moves the lane, and the braid is never Done because of it (tests)
- [ ] An open request on the braid still wins: Needs You or To Review with a running coordinator and an open planning PR (test)
- [ ] A running coordinator changes no strand's lane and no alarm (test)
- [ ] Start on a braid with a running coordinator is off with the reason "a coordinator for this braid is running" (test)
- [ ] `docs/board.md` states the rule, and `docs/decisions.md` has the new decision amending D46
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
