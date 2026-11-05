# BRAID-003/D acceptance

D is Done after the verified human merge of PR #23 into the epic. Its behavioral result is mixed, and the negatives stay part of the record. Final integration into main remains a separate gate.

## What changed

D exercised the worker workflow on live T3 threads. Startup preservation probes held: a note-only append and preservation of user-owned files. A deliberately bad canary failed CI and the guided repair passed. The cleanup head removed the canary fixture, so normal CI is unchanged. Independent review 001 found no actionable findings.

## Why

D tests behavior rather than wording. It shows the startup and repair route works under guidance. It also preserved transport failures: the worker replayed after its final result while CI notifications were queued, and the coordinator interrupted it and cancelled only the already-handled notifications.

## Left for you

No user action is needed for D. Final epic review and the human merge of the epic pull request into main remain.

## Technical record

- [PR #23](https://github.com/exones/braid/pull/23): MERGED at `2026-11-05T12:10:28Z`, target `epic/braid-003-worker-skill`, merge `a7cbf760a920db90c2dec34e5d9364161286232b`, parents frozen base `3101d8405e0b0eba0f3c2f11a719a77eba5d888e` then accepted head `faca8568a0b22aba2a443d4ed2c2d28fd0783564`. `gh pr view` verified the merge.
- Checked evidence on the accepted head: push run `42021303056` and pull-request run `42021309845`, attempt 1, success; `Test-PrProof.ps1` full mode PASS, retained in [cleanup proof](evidence/D/cleanup-current-proof.json).
- [Coordinator triage](D-coordinator-triage.md) (written before merge), [review 001](reviews/D/D-worker-behavior-proof-review-001.md) with an exact reviewer-checkpoint copy.
- Unproven: watch-wake consumption, unassisted repair, exactly-once delivery.
- Retired after merge: D item and review worktrees and the merged item branch. Kept: `item-d-live-probe-1` and `item-d-live-probe-2` worktrees (deliberately modified fixture files) pending a user decision; local branch `item/d-live-recheck-1` (`b738dd5`, not on origin).
