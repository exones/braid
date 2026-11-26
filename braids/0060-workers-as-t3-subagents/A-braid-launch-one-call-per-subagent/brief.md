---
id: '0060/A'
title: "braid launch: one call per subagent, workers recorded like reviewers"
status: To Do
labels: ["kind:task", "tier:M"]
dependencies: []
order: 10
---

## Goal

One CLI call prepares each subagent launch, and a second records the child, so the coordinator's launch is two reliable calls around `delegate_task` instead of prose it must remember. `braid launch <id> --role worker|review|research` checks the provider limits for that role, starts a worker's item (branch only, no worktree), resolves the model and title, writes the first message, and prints the `delegate_task` input. `braid launch <id> --role <role> --child <thread id>` records the child the way `braid review` does today, with a `role`.

Expected size: about 350 lines in 6 files, tests included.

## Start here

- `.agents/skills/braid/SKILL.md`: "Run an item" steps 1-2, "Accept and hand over" step 1 and "Plan" step 2 (Research): the launch prose and the three first-message templates this command replaces.
- `src/braids/limits.ts` (`readModelLines`, `roleLines`) and `src/commands/limits.ts`: model lines per role, tier and kind, and the limits check with its exit 3.
- `src/commands/start.ts`: `braid start` (branch, push, worktree, `started` event); `src/braids/title.ts`: `braid title`.
- `src/commands/requests.ts` (`reviewCommand`) and `src/braids/reviews.ts`: how `braid review` records a child with T3's folder and branch.
- `src/cli.ts`: the dispatch, `BRAID_COMMANDS` and help (a command is registered in several places; see 0071/F).

## Change

- New `braid launch <id> --role worker|review|research [--thread <coordinator thread id>] [--pr <n>] [--focus <text>] [--question <text>]`. In order, stopping at the first failure:
  1. The limits check for the role's model (as `braid limits --role`); on `pause` print the provider, window and resume time and exit 3, starting nothing.
  2. Worker only: `braid start` without a worktree (create and push the item branch, record `started` with `--thread`); safe to run again, as `braid start` is.
  3. Print one JSON object, the `delegate_task` input: `role` (`implementation` for a worker, `review`, `research`), `isolation` (`worktree` for worker and review, `shared` for research), `mode: async`, `title` (as `braid title`), `target` (`providerInstanceId`, `model`, `options` as an object, from BRAID.md `models` by tier and kind; the role's skill name stays in the message), and `task`, the first message.
- The first messages, generated: worker (skill, `braid view <id>`, branch and short sha, base branch, "switch T3's checkout to the branch: `git fetch`, `git switch <branch>`", "your thread id: `parentThreadId` from `orchestrator_capabilities`", "end your run with `PR <url>, head <sha>, checks <state>`"); reviewer (PR url and head from `--pr`, focus); researcher (question, the decision it feeds, time box, next source id). Keep them as short as the skill's templates are now.
- `braid launch <id> --role <role> --child <thread id>`: record the child in `.braid/reviews.json` with `role`, T3's folder and branch, as `braid review` does (reuse its code). `braid review <id> --thread <id>` keeps working and records `role: review`; `pm/<slug>` records are unchanged.
- `src/braids/reviews.ts`: an optional `role` (`worker`, `review`, `research`); a record without one reads as `review`. No new file.
- `braid start` gains the branch-only path (a flag, or a function `braid launch` calls); the worktree stays the default for `braid start`.
- Tests: the printed input for each role and tier (models from a test BRAID.md, never the real one), exit 3 on pause with nothing started, a second worker launch is a no-op start, the child record with its role, an old record without role reads as review.

## Already decided

- See the braid's "Already decided", especially the branch, the record and the models.
- `--child`, not `--thread`, names the child: `--thread` stays "your (the coordinator's) thread" across braid commands.
- The command prints; it never calls T3 to launch. The coordinator passes the printed input to `delegate_task`.

## Out of scope

- The board, status, clean and pause changes (0060/B); skill text (0060/C).
- Launching coordinators.

## Completion

- [x] `braid launch --role worker|review|research` prints a `delegate_task` input with the role's model from BRAID.md and the right title, isolation and first message, with tests
- [x] On a limits `pause` it exits 3 and starts nothing, with a test
- [x] A worker launch creates and pushes the item branch and records `started` without making a worktree, and is safe to run twice, with tests
- [x] `braid launch <id> --role <role> --child <thread id>` records the child with its role in `.braid/reviews.json`; `braid review` and old records keep working, with tests
- [x] `braid help` and `docs/cli.md` list `braid launch`
- [x] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open

## Plan

`startBranch` in start.ts (flag `--no-worktree`); `launch.ts` for the input and the child record; `recordChild` extracted from `reviewCommand`; `role` on the review record; `options` on `ModelLine`; tests in test/launch.test.ts; docs/cli.md and braids-format.md.
