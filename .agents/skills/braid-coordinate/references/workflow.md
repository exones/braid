# Braid workflow

How work is organized in a project that uses braid. Project-specific values (gate command, main branch, epics folder, models) come from the project's `BRAID.md`; this file never overrides them.

## Entry boundary

This workflow governs coordinator-led epics and assigned items. A bounded standalone task can use braid-worker with a user-confirmed chat plan, an owned worktree and `item/<task-slug>` branch, and a PR into the project's `main` value. It needs no epic table or item ID. The worker owns implementation, CI and fixes and runs required/requested independent review as a subagent; the user receives the result and merges. Direct questions and small interactive edits need neither workflow. Assigned-item tiers and coordinator-led review below remain unchanged.

## Epics and items

An epic lives in `<epics>/<NNN>-<slug>/`, where `<epics>` is the `epics` value in `BRAID.md`:

- `epic.md`: goal, scope, decisions, and the item table (ID, title, kind, tier, UI, depends on, status, PR, threads). Rows are in run order; the next item is the first `ready` row. Item status lives only in that table.
- `items/<ID>.md`: one brief per item, written from the [brief template](../assets/brief.md). It is both the backlog entry and the worker's instructions.
- `reports/<ID>.md`: a spike's answer.
- `checkpoints/<ID>.md`: only when a worker has to stop before finishing.
- `notes.md`: optional coordinator notes a fresh session couldn't work out from the files and GitHub.

`<NNN>` is the next unused three-digit epic number in that folder. Item IDs are letters in planned order: A, B, … Z, then AA, AB. An ID stays once given; to change the order, move the row. A new item takes the next unused letter and goes at the end; the coordinator asks the user before moving any row.

Only the coordinator changes an item's status, in the `epic.md` table, and commits it at the milestones its skill names.

| Status | When |
| --- | --- |
| `backlog` | The brief is written. |
| `ready` | Its dependencies are done. |
| `in-progress` | A worker is launched on it; its PR and thread show progress. |
| `done` | It is merged into the epic branch. |
| `blocked` | It can't continue; put the reason and who can unblock it in the row. |
| `cancelled` | It was dropped; put the reason in the row. |

## Kinds

Every brief states a kind.

- **Story:** a usable outcome for someone (a user, an operator, a developer), small enough for one PR.
- **Task:** technical work that supports stories, such as setup, refactoring, tooling or CI.
- **Spike:** time-boxed research for something that must be learned before it can be planned or estimated. The brief states the question, the time box, and what the answer will decide. The result is a written answer in `reports/<ID>.md` plus proposed follow-up items, delivered through a PR like any other item. Throwaway experiments are fine; feature code is not.

## Tiers

Every brief states a tier. Pick the lowest one that fits.

| Tier | Typical work | Review | Merges the item into the epic |
| --- | --- | --- | --- |
| S | Small script, doc, config, or contained fix | Coordinator reads the diff | Coordinator |
| M | Normal feature | Independent reviewer comments on the PR | Coordinator, once nothing blocking remains |
| L | Persistent data formats, crash or recovery behavior, release or publishing, security, and any change to agent instructions (skills, `AGENTS.md`, `CLAUDE.md`, `BRAID.md`) | Independent reviewer, again after fixes that substantially change failure or recovery behavior; the brief lists failure modes and required regression tests | User |

Whatever the tier, the user merges a `UI: yes` item (new or noticeably changed user-facing UI) after review; the coordinator sends final screenshots and waits.

## Branches and merges

- Every commit uses Conventional Commits.

- An epic has a branch `epic/<NNN>-<slug>` from the `main` branch named in `BRAID.md`. The coordinator commits the plan, briefs and item table directly on it.
- Each item has a branch `item/<NNN>-<id>-<slug>` from the current epic tip, and one PR into the epic branch.
- The coordinator merges an S or M item PR without `UI: yes` with a merge commit once `gh pr checks` is green on the PR's latest commit and review has nothing blocking.
- When the epic is finished, the coordinator marks it `ready for main` and opens one PR from the epic branch into `main`. Only the user merges into `main`; no commit follows that merge.
- If `main` has moved, merge it into the epic branch before starting the next item and before the final PR. Never rebase or force-push shared branches.

## Checks

- The `gate` command in `BRAID.md` must pass before every PR.
- CI evidence is CI's own result: green `gh pr checks` on the PR's latest commit, limited to the `ci` names in `BRAID.md` if it lists any. A required check that never reports isn't green. With `ci: none` the gate run before the PR is the evidence.

## Reports

The PR description is the item's record: what changed, why, how it was checked, and anything left open. The worker's final report and the coordinator's recap to the user follow their skills.
