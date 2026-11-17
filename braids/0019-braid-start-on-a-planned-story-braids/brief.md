---
id: '0019'
title: "braid start on a planned story; braids-only commits need no new CI"
status: Done
labels: ["kind:story", "tier:S"]
dependencies: []
delivery: epic
---

## Goal

Two CLI gaps found while running 0018 (user, 2026-11-17: fix them in one small story before 0009):

- `braid start` on a story the coordinator planned refuses, because the plan already pushed the story's branch (`0018 already has the branch …; nothing was created`). The skill says the worker starts on that branch, so the coordinator made the worktree by hand.
- After `braid accept` stamps a story or final PR Done, the coordinator waits for a full CI run before `braid handover`, though the new commit only changes the brief's status under `braids/`. Same after a log or report commit.

Expected size: about 120 lines in 4 files, with tests.

## Plan

- `start`: a story's own existing branch (local or `origin/`) gets a worktree instead of a refusal; strands, an open PR, an existing folder or a worktree on the branch, and non-`To Do` status still refuse.
- `checksProblem` takes an optional history (root, gh runner, notes): a pending or missing head passes when every commit back to the newest all-green one (`gh api .../check-runs`) changes only `braids/`; callers are `accept`, `accept --merge`, `handover` and `facts`.
- Tests with a fake `gh api`; docs in `braids-format.md`, `cli.md`, decisions D49.

## Start here

- `src/commands/start.ts` around `startCommand`: the `own` refs check that refuses an existing branch; how a strand's branch and worktree are made.
- `src/commands/done.ts` `checksProblem`, and its callers in `done.ts` (accept, `--merge`), `requests.ts` (handover) and `facts.ts`.
- `test/start.test.ts`, `test/done.test.ts`, `test/requests.test.ts` and their fake gh.
- `docs/braids-format.md` and `docs/cli.md` for `start`, `accept` and `handover`.

## Change

- **`braid start <story>`:** when the story's own branch already exists (local or `origin/`) and the story is `To Do` with no PR and no worktree, make the worktree on that branch (tracking `origin/` if only the remote has it) instead of refusing. Other cases keep refusing as today (a strand, a PR open, a worktree already there, a status other than `To Do`).
- **Green after a braids-only commit:** where braid requires the PR's checks green on its head (`accept`, `accept --merge`, `handover`, `facts`), a head whose checks are missing or pending counts as green when every commit since the newest commit with all `ci` checks green changes only files under `braids/`; the message names that commit. A failed check on the head still refuses.
- Docs for both; the coordinator skill needs no change.

## Already decided

- Only `braids/**` counts as a no-CI change (the same rule as the CI workflow's `paths-ignore`).
- One story into `main`, before 0009.

## Out of scope

- The CI workflow; GitHub branch protection.

## Completion

- [x] `braid start` on a `To Do` story whose branch exists only on `origin/` or locally makes its worktree on that branch (tested); the other refusals still hold (tested)
- [x] A head that adds only `braids/` changes on top of a green commit passes `accept`, `accept --merge` and `handover` without new checks (tested with the fake gh); a code change on top, or a failed check on the head, still refuses (tested)
- [x] `docs/braids-format.md` and `docs/cli.md` describe both
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open
