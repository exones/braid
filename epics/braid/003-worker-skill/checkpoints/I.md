# BRAID-003/I checkpoint

Date: 2026-11-05. Task: repair review002/F1 final pull-request identity. Role: worker. No controller. Package 0.1.1, schema 1. Operating pin `d30e3a93a2a3690934d059357eb2ed9b1494d6ca` unchanged.

## Checkout

Root `C:\worktrees\agento\item-braid-003-i-pr-proof`. Branch `item/braid-003-i-pr-proof`, attached. Origin `https://github.com/exones/braid.git`. Existing PR https://github.com/exones/braid/pull/21. Current head before this repair commit: `d5fbbff821dbbd5f987aa2bc71a0a0296efb0777`. Frozen epic tip `7714587cfa7846c13560e0fd8c7f9a4c99b670f9` was not moved. The commit that contains this checkpoint is the repair candidate. This file does not name that SHA.

## Read index

`checkpoints/I.md` first, then `I-fix-002.md` and the copied review002 report at `953dfbffdada6ef11819ed7a362406fbdd8d9322`. Unpublished coordinator commits were not merged. `checkpoints/log.md` was not read.

## Completed

Final state and target ref name are rechecked, and the final merge parents are compared with the final tip before a current PASS. Close, merge, and same-SHA retarget fail through the live second-read seam. Details are in [reports/I.md](../reports/I.md).

## Checks

Fixtures exited 0, including the four stubbed second-read cases. `npm run verify` exit 0, dirty probe from `d5fbbff`, candidate false, Node v26.13.0, npm 11.20.0, pwsh 7.6.9, docs `text=256`, 40 tests. Both skill validators exit 0. Hosted proof of the repair head is not claimed. Pull request 21 was not closed or retargeted.

## Changed paths

`scripts/Test-PrProof.ps1`, `test/fixtures/pr-proof/Test-PrProof.ps1`, worker skill, T3 continuation, assignment-packet asset, review template, `reports/I.md`, `checkpoints/I.md`.

## Next action

Push this repair to PR 21, link, and watch. Take one catch-up snapshot. If every declared check has already finished, run full-mode `scripts/Test-PrProof.ps1` on PR 21 and require `proofScope` `current`, `currentReady` true, final state open, final target `epic/braid-003-worker-skill`, and live base `7714587cfa7846c13560e0fd8c7f9a4c99b670f9`. If that passes, unwatch and send one result. If any check is pending, end the turn and keep ownership.

## Blockers

None. D is not started. Do not chase unpublished coordinator records.
