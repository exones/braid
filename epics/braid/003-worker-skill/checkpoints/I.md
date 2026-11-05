# BRAID-003/I checkpoint

Date: 2026-11-05. Task: repair review001/F1 live target-base resolution. Role: worker. No controller. Package 0.1.1, schema 1. Operating pin `d30e3a93a2a3690934d059357eb2ed9b1494d6ca` unchanged.

## Checkout

Root `C:\worktrees\agento\item-braid-003-i-pr-proof`. Branch `item/braid-003-i-pr-proof`, attached. Origin `https://github.com/exones/braid.git`. Existing PR https://github.com/exones/braid/pull/21. Reviewed head `ad0b1b6dc5bf434f487ba0605e269e79194ef1f9`. Frozen epic tip `7714587cfa7846c13560e0fd8c7f9a4c99b670f9` is merged. The commit that contains this checkpoint is the repair candidate. This file does not name that SHA.

## Read index

`checkpoints/I.md` first, then `assignments/I-fix-001.md` and retained review001 at the frozen tip. `checkpoints/log.md` was not read.

## Completed

Open-PR proof resolves the base branch tip and fails when the merge-test first parent is not that tip, including with `-SkipArtifacts`. Merged proof is labelled historical. Details are in [reports/I.md](../reports/I.md).

## Checks

Fixtures exited 0, including advanced base, base moving during proof, matching live base, and historical scope. `npm run verify` exit 0, dirty probe from `5c479e6`, candidate false, Node v26.13.0, npm 11.20.0, pwsh 7.6.9, docs `text=256`, 40 tests. Both skill validators exit 0. PR 21 at `ad0b1b6` now exits 1 against live base `7714587`. PR 20 exits 0 with `proofScope` historical. Hosted proof of the repair head is not claimed.

## Changed paths

`scripts/Test-PrProof.ps1`, `test/fixtures/pr-proof/Test-PrProof.ps1`, worker skill, T3 continuation, assignment-packet asset, review template, `reports/I.md`, `checkpoints/I.md`.

## Next action

Push this repair to PR 21, link, and watch. Take one catch-up snapshot. If every declared check has already finished, run full-mode `scripts/Test-PrProof.ps1` on PR 21 and require `proofScope` `current`, live base `7714587cfa7846c13560e0fd8c7f9a4c99b670f9`, and an unchanged reread. If that passes, unwatch and send one result. If any check is pending, end the turn and keep ownership.

## Blockers

None. D is not started. Do not chase later coordinator records; the frozen base is `7714587cfa7846c13560e0fd8c7f9a4c99b670f9`.
