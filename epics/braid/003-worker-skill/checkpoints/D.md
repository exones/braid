# BRAID-003/D checkpoint

Date: 2026-11-05. Task: host project-worktree adaptation for the three behavior probes. Role: worker. No controller. Package 0.1.1, schema 1. Skill pin `d66843cfb23b1c5c3891732c458d30d2b077fae1`, blob `13c3cf9679f6abb78d242840a80574abeb5ecf9d`.

## Checkout

Root `C:/worktrees/agento/item-braid-003-d-worker-behavior-proof`. Branch `item/braid-003-d-worker-behavior-proof`, attached. Origin `https://github.com/exones/braid.git`. Upstream: none. Parent of this adaptation is `89fc1ea35fa81de627d5345553ff8bee328c96d8`, clean before these writes. The commit that contains this note does not name its own SHA. Not pushed. No pull request.

## Read index

This resume opened this checkpoint first, then `D-resume-002` via `git show 47b4dbeae0cc783ffb2b5449e09321df19f26272:epics/braid/003-worker-skill/assignments/D-resume-002.md`. Reconciled HEAD and a clean status only. It did not reread the startup packet, replay fixtures, or run gates. `t3_thread_launch` accepts `workspaceStrategy.type` `worktree` with `baseRef`, `branch`, and `startFromOrigin`. `existing_worktree` requires a path from `t3_worktree_list`.

## Completed

Fixture setup, native cleanup, and the retained `-Keep` repositories remain historical evidence under `validation/D/` and `C:/Users/exon/AppData/Local/Temp/braid-003-d-fixtures`. Detail is in [reports/D.md](../reports/D.md).

Ordinal1 was stopped with `braid003-d-stop-startup-replay-001`. Ordinal2 was stopped at the clean handoff with `braid003-d-preparation-handoff-stop-001` (`activeRunId` null). This adaptation keeps that lineage.

Probe 1 launch `braid003-d-probe-1-retained-binding-001` used `existing_worktree` on the retained `probe-1` path. The host returned `invalid_request`: `worktreePath must be one of the project's git worktrees. t3_worktree_list shows them.` No subject thread was created.

The replacement plan is [validation/D/live/setup.md](../validation/D/live/setup.md): three serial idle `worktree` launches from this adaptation commit, owned paths under `validation/D/live/`, and probe 2's per-worktree index edit. Raw prompts are revised. Historical fixture identities stay in `setup-observation.json`.

## Checks

- Historical fixture and docs-gate results are in the report. They were not rerun.
- Adaptation text check: `git diff --check` exited 0. A trailing-whitespace and CR scan of the edited Markdown and new live text was clean. The staged whitespace check exited 0. Full `npm run verify` and the docs gate were not rerun. Skill validators were not run.

## Changed paths

`epics/braid/003-worker-skill/validation/D/live/`, `epics/braid/003-worker-skill/validation/D/raw/probe-1.md`, `probe-2.md`, `probe-3.md`, `epics/braid/003-worker-skill/validation/D/oracle/observations.md`, `epics/braid/003-worker-skill/reports/D.md`, `epics/braid/003-worker-skill/checkpoints/D.md`.

## Next action

After this commit, send one nonterminal adaptation result to coordinator `8a3c206a-9192-498f-b90a-19b5bf807c8c` and stop. On resume, open this checkpoint first. Do not send a second result for this commit. Do not replay fixtures, push, open a pull request, launch subjects, or start the canary.

Next coordinator action: create the three serial idle worktrees in `validation/D/live/setup.md` and return each thread link, root, branch, and HEAD. The coordinator commits any concrete subject packet before launch. No binding outcome is claimed.

## Blockers

None for this adaptation. Subject threads still have to be created by the coordinator. A worktree path outside `t3_worktree_list` cannot be bound.
