# BRAID-003/G worker checkpoint

Date: 2026-11-04. Role: worker. State: continuation result negative/partial, recorded for the documentation commit. Not Done. Human merge, F, and D are not started.

## Scope

Scoped fix for review `G-independent-thread-ci-review-001` findings F1 to F4. Coordinator triage: the spike outcome is negative/partial and must say so. F2 rewrites the F-intake section of the operator reference. F1, F3, and F4 are recorded in this checkpoint and `epics/braid/003-worker-skill/reports/G.md`. Both files ship in the pull request.

## Continuation result

Negative. One top-level thread did not complete the contract.

- Original thread `mcp:launch:b4318dded53b10790c1cb711c5a4496141347271c88ddce9a5892d38485b3a80`. Runs, UTC, from review 001's host read: ordinal 1 interrupted (19:17:50 requested, 19:18:05–19:37:58); ordinal 2 readiness interrupted (19:24:45 requested, 19:38:00–19:51:36); ordinal 3 cancelled before start (19:27:39 requested, ended 20:02:13); ordinal 4 interrupted (20:05:20–20:07:41); ordinal 5 interrupted (20:09:57–20:10:01). None completed. Ordinal 1 registered `watching: true`, `wasWatching: false`, ran about ten minutes past that call, then was interrupted. Ordinal 2 started only after that interruption and found push attempt 1 red. No watch wake drove completion.
- The user account `exones` reran the failed push job. Attempt 2 of run `41896581649` started at 20:04:47Z. The worker did not rerun it. Attempt 1 Windows job `126807600244` remains failed with `error: cannot write state`. Cause unidentified.
- The coordinator launched replacement thread `mcp:launch:7c30a9962f5352a1d5b673802a04f5ac5c1e1b6a89514bc74427a8c7f08a3d53`. That thread verified historical head `ccabae4df1f813317b8dd1247ea04878ee6ce023` from an explicit recovery snapshot.

## Replacement duplicates

Same replacement run, ordinal 1, re-entered its launch prompt after the first send and again after later sends. Each pass sent another result for the same head. Named limit: delivery is not one result per head. The coordinator must deduplicate by head and must drive recovery with an explicit snapshot.

| Message suffix | Coordinator ordinal |
| --- | --- |
| `g-final-ccabae4df1f813317b8dd1247ea04878ee6ce023` | 78 |
| `g-reconfirm-ccabae4df1f813317b8dd1247ea04878ee6ce023` | 80 |
| `g-verify-ccabae4df1f813317b8dd1247ea04878ee6ce023` | 81 |
| `g-recheck-ccabae4df1f813317b8dd1247ea04878ee6ce023` | 84 |

Message prefix: `message:mcp:c249b90a-4546-49f3-9133-8ebe58e4297b:thread-send:`. Link `<t3-thread://v2/c361f221-e595-46eb-8f4b-7926ea55f19c/8a3c206a-9192-498f-b90a-19b5bf807c8c>`.

## Unwatch

No active subscription at unwatch. The replacement launch prompt reported `watching: false`, `wasWatching: false`. Termination cause and time are unobserved. The payload is second-hand: this replacement did not call `unwatch_pull_request`, and the calling thread did not leave a saved payload. Watch lifetime across interrupt and cancel is an open host question for F.

## Checkout

- Root: `C:\worktrees\agento\item-braid-003-g-independent-thread-ci`
- Branch: `item/braid-003-g-independent-thread-ci`
- Parent of the documentation commit: `ccabae4df1f813317b8dd1247ea04878ee6ce023`
- That parent's parent: `180f2e0b3cb6fc1a380a955e24a9580d0a4c85b8`
- Origin: `https://github.com/exones/braid.git`. No upstream at authoring.
- This checkpoint does not name its own commit SHA.
- PR https://github.com/exones/braid/pull/13 OPEN at authoring
- PR base `epic/braid-003-worker-skill` `180f2e0b3cb6fc1a380a955e24a9580d0a4c85b8`
- Owned paths in the documentation commit: `epics/braid/003-worker-skill/validation/G/operator-reference.md`, `epics/braid/003-worker-skill/reports/G.md`, `epics/braid/003-worker-skill/checkpoints/G.md`

## Historical proof

The four-job set for `ccabae4df1f813317b8dd1247ea04878ee6ce023` passed and is not proof of the documentation commit. Detail and digests are in `epics/braid/003-worker-skill/reports/G.md`.

- Push [41896581649](https://github.com/exones/braid/actions/runs/41896581649) attempt 2 success. Ubuntu job `126830530443`, artifact `13359641660`. Windows job `126830530560`, artifact `13359736544`.
- Pull request [41896593015](https://github.com/exones/braid/actions/runs/41896593015) attempt 1 success. Ubuntu job `126807638760`, artifact `13355946835`. Windows job `126807638492`, artifact `13355987092`.
- Install dependencies, Verify, and Upload packed tarball succeeded on those four jobs.
- Merge-test at that proof: `fe91513892f02aa72ba6588215362c7741e4451b`.

## F may adopt

Only worktree binding, the watch registration payload, one catch-up readiness snapshot, the current-head CI and artifact recipe, and explicit coordinator message delivery. F must not rely on same-thread completion driven by a watch wake, a watch that survives interruption, one result per head, or unassisted repair.

## Next action

After this commit is pushed, verify the frozen four-job set on the new head: push and pull_request, Ubuntu and Windows, Install dependencies, Verify, and Upload packed tarball, plus artifact digests against provenance. Record that proof in the worker return. Do not store it in a follow-up commit whose only purpose is its own SHA. Coordinator then decides whether to assign a new review. No watch, no reviewer launch, no merge, and no F or D work from this item.
