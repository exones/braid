# Workflow

How work is organized and handed over in this repository. It records this project's conventions only.

## Epics and items

An epic lives in `epics/braid/<NNN>-<slug>/`:

- `epic.md`: goal, scope, decisions, and the item table (ID, title, tier, status, PR). Item status lives only in that table.
- `items/<ID>.md`: one brief per item, written from the [brief template](../.agents/skills/braid-coordinate/assets/brief.md). It is both the backlog entry and the worker's instructions.
- `checkpoints/<ID>.md`: only when a worker has to stop before finishing.
- `notes.md`: optional coordinator notes a fresh session couldn't work out from the files and GitHub.

Item IDs are letters in planned order: A, B, … Z, then AA, AB. An ID stays once given. Statuses: `backlog`, `ready`, `in-progress`, `in-review`, `done`, `blocked`, `cancelled`.

Closed epics are history: don't edit them. The docs gate doesn't check their links ([frozen list](../scripts/markdown-link-exclusions.json)).

## Tiers

Every brief states a tier. Pick the lowest one that fits.

| Tier | Typical work | Review | Merges the item into the epic |
| --- | --- | --- | --- |
| S | Small script, doc, config, or contained fix | Coordinator reads the diff | Coordinator |
| M | Normal feature | Independent reviewer comments on the PR | Coordinator, once nothing blocking remains |
| L | `.braid/` state format, crash or recovery behavior, release or publishing, security | Independent reviewer; the brief lists failure modes and required regression tests | User |

## Branches and merges

- An epic has a branch `epic/braid-<NNN>-<slug>` from `main`. The coordinator commits the plan, briefs and item table directly on it.
- Each item has a branch `item/braid-<NNN>-<id>-<slug>` from the current epic tip, and one PR into the epic branch.
- The coordinator merges an S or M item PR with a merge commit once `gh pr checks` is green on the PR's latest commit and review has nothing blocking.
- When the epic is finished, the coordinator opens one PR from the epic branch into `main`. Only the user merges into `main`.
- If `main` has moved, merge it into the epic branch before starting the next item and before the final PR.

## Checks

- `npm run verify` before every PR. A push that only changes files under `epics/` can use `pwsh -NoProfile -File scripts/Test-CoordinatorRecordsGate.ps1 -Base <sha>` instead.
- CI (`.github/workflows/ci.yml`) runs `verify` on Windows and Ubuntu. Green `gh pr checks` on the PR's latest commit is the CI result.
- When a change edits a skill, also run the skill validator if one is available and say so in the PR.

## Reports

- The PR description is the item's report: what changed, why, how it was checked, and anything left open.
- The coordinator tells the user when an item is merged, when it needs a decision, and when an epic is ready for `main`. A few sentences, with PR links.
