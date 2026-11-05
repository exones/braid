# BRAID-003/D checkpoint

Date: 2026-11-05. Task: phase R of the one guided canary trial. Role: worker. No controller. Package 0.1.1, schema 1. Skill pin `d66843cfb23b1c5c3891732c458d30d2b077fae1`, blob `13c3cf9679f6abb78d242840a80574abeb5ecf9d`.

## Checkout

Root `C:/worktrees/agento/item-braid-003-d-worker-behavior-proof`. Branch `item/braid-003-d-worker-behavior-proof`, attached. Origin `https://github.com/exones/braid.git`. Upstream `origin/item/braid-003-d-worker-behavior-proof`. HEAD before the phase R commit is `bf11570c483aae0c84e613266cd894f64e3324b3`. The commit that contains this note does not name its own SHA. Pull request https://github.com/exones/braid/pull/23. Base frozen at `3101d8405e0b0eba0f3c2f11a719a77eba5d888e`. Watch is registered (`watching: true`) and must not be registered again.

## Read index

Resumed from this checkpoint, then the trial packet and recheck report/trace at `3101d8405e0b0eba0f3c2f11a719a77eba5d888e`. Phase F was pushed and the catch-up snapshot diagnosed the canary logs. No startup or fixture replay.

## Completed

Ordinal4 stop `braid003-d-assessment-handoff-stop-001` remains the lineage into this run. The recheck completed naturally. Detail is in [reports/D.md](../reports/D.md).

Phase F head `bf11570c483aae0c84e613266cd894f64e3324b3` failed `Require canary GOOD` on attempt 1 of push run 42018659597 job 127215502534 and pull_request run 42018669987 job 127215536552. Bytes were `4241440A`. This was catch-up, not a watch wake. F CI runs 42018659429 and 42018669998 were pending. Phase R sets canary bytes to `474F4F440A` only.

## Checks

- Phase F local `npm run verify` exited 0 as a dirty probe at source `d61058daa313f3f30976a4a0179fb00566915b63`. Package sha256 `16bb1e4957258317830c2d78cdaaeed116cf46f479dec99c96fc30aefdb7fa36`, candidate false.
- Phase R local gate: `npm run verify` exited 0. Node v26.13.0, npm 11.20.0, PowerShell 7.6.9. Docs gate passed. Tests 40 passed and 0 failed. Package proof sha256 `16bb1e4957258317830c2d78cdaaeed116cf46f479dec99c96fc30aefdb7fa36`, source revision `bf11570c483aae0c84e613266cd894f64e3324b3`, worktree-dirty true, candidate false. Pre-commit probe. Skill content is not edited, so external skill validators were not run.

## Changed paths

`epics/braid/003-worker-skill/validation/D/trial/canary.txt`, `epics/braid/003-worker-skill/reports/D.md`, `epics/braid/003-worker-skill/checkpoints/D.md`.

## Next action

After the phase R commit, push `origin` `item/braid-003-d-worker-behavior-proof`, link pull request 23, and end the turn if the new head's checks are pending. Do not watch again. On the R wake, prove both canary events and full CI artifacts with `scripts/Test-PrProof.ps1`. Comment F and R only after that proof. Do not send a ready result for F or for an unproven R head.

## Blockers

None for the repair. F CI success is still unverified and stays required before the F/R comment. Independent review and human merge stay after phase C.
