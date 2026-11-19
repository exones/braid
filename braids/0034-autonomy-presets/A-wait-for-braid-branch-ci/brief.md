---
id: '0034/A'
title: "braid wait: a wait for the braid branch's CI that ends"
status: To Do
labels: ["kind:story", "tier:L", "ask:process"]
dependencies: []
order: 10
---

## Goal

After the coordinator merges a strand itself, it has to wait for the braid branch's CI on that merge before the next strand starts. There is no PR to watch at that point, so nothing wakes it: it says "waiting", its turn ends and T3 settles the thread. The user nudged a stalled coordinator at exactly this step in braids 0012, 0020 (twice) and 0027. After this strand the coordinator runs one command that ends when that CI ends, in the background, and the host wakes it with the result.

Expected size: about 180 lines in 6 files.

## Start here

- `.agents/skills/braid/references/auto-mode.md`, "Merging", step 4: the wait that has no wake.
- `.agents/skills/braid/SKILL.md`, "Run an item", steps 3 and 4: how the coordinator waits for workers and PRs today.
- `.github/workflows/ci.yml`, the comment above `on:`: push CI runs on `braid/*` braid branches, and a push that only changes `braids/` or `epics/` starts no run.
- `src/commands/done.ts`, `checksProblem` and its `history`: how `braid accept` already treats a head whose only changes since the newest green commit are under `braids/`.
- `src/commands/coordinate.ts`, `ciChecks`: the `ci` names of `BRAID.md`.

## Change

- `src/commands/wait.ts` (new), wired in `src/cli.ts`: `braid wait <number> [--timeout <minutes>]`. It finds the newest commit on the braid branch (on `origin`) that changes anything outside `braids/` and `epics/`, polls GitHub for the `ci` checks of `BRAID.md` on that commit, and ends when all have finished: exit 0 and `green at <sha>`, exit 1 and the failed check names, exit 2 on the timeout (default 30 minutes) or when no run appears, saying which.
- `test/wait.test.ts` (new), with a fake `gh` runner as `test/done.test.ts` has.
- `.agents/skills/braid/references/auto-mode.md`, "Merging", step 4: run `braid wait <number>` as a background command and wait on it with the host's wait for background commands (in T3, `t3_background_wait` with its task id) before ending the turn. Exit 1 is "Fixes" in the skill; exit 2 is a `braid ask`.
- `.agents/skills/braid/SKILL.md`, "Talking to the user": one line, tell the user you are waiting only when a watch, a background wait or a thread message will wake you; otherwise say what you will do when they next write.
- `docs/cli.md`, `docs/braids-format.md`: the command. `docs/decisions.md`: the decision and its reason.

## Already decided

- The wait is a CLI command, so it works on any host and can be tested; the skill only says how to wait on it.
- `braid wait` only reads: no fetch of other branches than the braid's, no commit, no merge.
- A push whose tip only changes `braids/` has no CI run of its own; the commit that counts is the newest one with other changes, as `braid accept` already judges it.
- 0034/E moves the auto mode text into the autonomy reference; write the step so it can be moved as it is.

## Out of scope

- Wake-ups for a commit or PR that is already superseded or merged (0036).
- Waiting for a worker's or reviewer's thread, or for a PR's checks: `t3_thread_wait` and `watch_pull_request` stay.

## Completion

- [ ] `braid wait <number>` ends with exit 0, 1 or 2 as described, shown by tests with green, failing, still-running and never-started runs
- [ ] A braid branch whose tip is a `braids/`-only commit waits on the commit before it (test)
- [ ] The auto mode reference tells the coordinator to run it in the background and wait on it, and what each exit code means
- [ ] The skill says when the coordinator may tell the user it is waiting
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
