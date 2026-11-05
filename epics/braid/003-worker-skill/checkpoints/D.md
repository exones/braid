# BRAID-003/D checkpoint

Date: 2026-11-05. Task: phase C of the one guided canary trial. Role: worker. No controller. Package 0.1.1, schema 1. Skill pin `d66843cfb23b1c5c3891732c458d30d2b077fae1`, blob `13c3cf9679f6abb78d242840a80574abeb5ecf9d`.

## Checkout

Root `C:/worktrees/agento/item-braid-003-d-worker-behavior-proof`. Branch `item/braid-003-d-worker-behavior-proof`, attached. Origin `https://github.com/exones/braid.git`. Upstream `origin/item/braid-003-d-worker-behavior-proof`. HEAD before the phase C commit is `eaad41778520cc3679410bc58f26b1e3d1c00320`. The commit that contains this note does not name its own SHA. Pull request https://github.com/exones/braid/pull/23. Base frozen at `3101d8405e0b0eba0f3c2f11a719a77eba5d888e`. Watch is registered (`watching: true`) and must not be registered again.

## Read index

Resumed from this checkpoint, then the trial packet and recheck report/trace at `3101d8405e0b0eba0f3c2f11a719a77eba5d888e`. No startup or fixture replay. No further loading or blinding test.

## Completed

Ordinal4 stop `braid003-d-assessment-handoff-stop-001` remains the lineage into this run. The recheck completed naturally. Detail is in [reports/D.md](../reports/D.md).

Phase F head `bf11570c483aae0c84e613266cd894f64e3324b3` failed `Require canary GOOD` on attempt 1. Push run 42018659597 job 127215502534. Pull_request run 42018669987 job 127215536552. Bytes were `4241440A`. That observation was catch-up, not a watch wake. F CI runs 42018659429 and 42018669998 later succeeded, including Install dependencies, Verify, and Upload packed tarball. Their archives were not downloaded.

Phase R head `eaad41778520cc3679410bc58f26b1e3d1c00320` passed both canary events on attempt 1. Push run 42019563734 job 127218614162 checked out that head. Pull_request run 42019574413 job 127218649110 checked out merge `7ce6d85acb750f2f6349b38c8f9e6b4f52a24bd0`, parents `3101d8405e0b0eba0f3c2f11a719a77eba5d888e` then `eaad41778520cc3679410bc58f26b1e3d1c00320`. `scripts/Test-PrProof.ps1 -PullRequest 23` exited 0: PASS, `proofScope=current`, `currentReady=true`, open on that head. Tarball sha256 `16bb1e4957258317830c2d78cdaaeed116cf46f479dec99c96fc30aefdb7fa36`. The F/R comment is https://github.com/exones/braid/pull/23#issuecomment-6657061453. This continuation proved a completed R head. It did not receive a separate watch-wake payload and did not re-register the watch.

Phase C removes `.github/workflows/d-trial-canary.yml` and `epics/braid/003-worker-skill/validation/D/trial/canary.txt` after that comment. `proposal.md` stays.

## Checks

- Phase C local gate: `npm run verify` exited 0. Node v26.13.0, npm 11.20.0, PowerShell 7.6.9. Docs gate passed. Tests 40 passed and 0 failed. Package proof sha256 `16bb1e4957258317830c2d78cdaaeed116cf46f479dec99c96fc30aefdb7fa36`, source revision `eaad41778520cc3679410bc58f26b1e3d1c00320`, worktree-dirty true, candidate false. Pre-commit probe. Skill content is not edited, so external skill validators were not run.

## Changed paths

`.github/workflows/d-trial-canary.yml` deleted, `epics/braid/003-worker-skill/validation/D/trial/canary.txt` deleted, `epics/braid/003-worker-skill/reports/D.md`, `epics/braid/003-worker-skill/checkpoints/D.md`.

## Next action

After the phase C commit, push `origin` `item/braid-003-d-worker-behavior-proof` and link pull request 23. Do not watch again. End the turn if the new head's checks are pending. On the C wake, prove standard CI and full artifacts with `scripts/Test-PrProof.ps1`, comment that proof, unwatch, and send one final-head result to coordinator `8a3c206a-9192-498f-b90a-19b5bf807c8c`. Do not send a ready result for this unproven cleanup head.

## Blockers

None for the cleanup push. Independent review and human merge stay after phase C hosted proof.
