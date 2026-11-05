# BRAID-003/D checkpoint

Date: 2026-11-05. Task: phase F of the one guided canary trial. Role: worker. No controller. Package 0.1.1, schema 1. Skill pin `d66843cfb23b1c5c3891732c458d30d2b077fae1`, blob `13c3cf9679f6abb78d242840a80574abeb5ecf9d`.

## Checkout

Root `C:/worktrees/agento/item-braid-003-d-worker-behavior-proof`. Branch `item/braid-003-d-worker-behavior-proof`, attached. Origin `https://github.com/exones/braid.git`. Upstream: none until the first push. HEAD before the phase F commit is merge `d61058daa313f3f30976a4a0179fb00566915b63`. Parents: `2591a5a8757134944be0c261257f17210c123741` and frozen epic `3101d8405e0b0eba0f3c2f11a719a77eba5d888e`. The commit that contains this note does not name its own SHA. No pull request yet.

## Read index

This resume opened this checkpoint first, then `D-trial-001` via `git show 3101d8405e0b0eba0f3c2f11a719a77eba5d888e:epics/braid/003-worker-skill/assignments/D-trial-001.md`, then `reports/D-recheck-001-coordinator.md` and `reports/evidence/D/recheck-001-trace.json` from that same object. It reconciled root, branch, full HEAD `2591a5a8757134944be0c261257f17210c123741`, clean status, and absent upstream before the merge. It did not replay startup, fixtures, or another subject.

## Completed

Historical fixture setup, host-worktree adaptation, and the three live probes remain in [reports/D.md](../reports/D.md).

Ordinal1 stop `braid003-d-stop-startup-replay-001`. Ordinal2 stop `braid003-d-preparation-handoff-stop-001`. Ordinal3 stop `braid003-d-adaptation-handoff-stop-001`. Ordinal4 stop `braid003-d-assessment-handoff-stop-001` with `activeRunId` null before the recheck. This trial run continues that fourth stop. Those interventions stay on the record.

The recheck subject completed naturally. Thread `mcp:launch:288ba046bb1928501ce36429446e29ff17d772322dd1c40be8173884ecc11b1e`. Full stdout, only the allowed reads, correct current-fail classification, unchanged files. No further loading or blinding test.

Phase F local candidate: `.github/workflows/d-trial-canary.yml` and `validation/D/trial/canary.txt` bytes `4241440A`. Existing CI is unchanged.

## Checks

- Historical fixture and assessment checks were not rerun.
- Phase F local gate: `npm run verify` exited 0. Node v26.13.0, npm 11.20.0, PowerShell 7.6.9. Docs gate passed. Tests 40 passed and 0 failed. Package proof sha256 `16bb1e4957258317830c2d78cdaaeed116cf46f479dec99c96fc30aefdb7fa36`, source revision `d61058daa313f3f30976a4a0179fb00566915b63`, worktree-dirty true, candidate false. Pre-commit probe. Skill content is not edited, so external skill validators were not run.

## Changed paths

`.github/workflows/d-trial-canary.yml`, `epics/braid/003-worker-skill/validation/D/trial/canary.txt`, `epics/braid/003-worker-skill/reports/D.md`, `epics/braid/003-worker-skill/checkpoints/D.md`, plus the merge of the frozen epic tip.

## Next action

After the phase F commit, push `git push -u origin item/braid-003-d-worker-behavior-proof`, open one pull request into `epic/braid-003-worker-skill`, link it, watch it, and take one catch-up snapshot. If that snapshot is still pending, end the turn on the watch. If the current-head canary run has already failed, diagnose that run and repair in this worker. Do not send a ready result for the failing head.

Frozen set: F canary `d-trial-canary` step `Require canary GOOD` fails, while CI `push` and `pull_request` Ubuntu and Windows verify jobs succeed at Install dependencies, Verify, and Upload packed tarball. R requires that CI set with full artifacts plus canary success on both events. C removes the two temporary files only after F failure and R success are commented, then full CI artifact proof.

## Blockers

None before the push. Loading and clean blinding are not reopened. Independent review and human merge stay after phase C.
