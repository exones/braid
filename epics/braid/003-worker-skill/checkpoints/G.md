# BRAID-003/G worker checkpoint

Date: 2026-11-04. Role: worker. State: documentation head `9b043f0fadc381d2dfa173fe28d7fdfb4f76c920` has a verified four-job proof in the uncommitted section below. Continuation result remains negative/partial. Not Done. Not merged. A new review, human merge, F, and D are not started.

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

## Next action recorded with the documentation proof

Coordinator: record G's continuation result as negative/partial, take the verified four-job proof of `9b043f0fadc381d2dfa173fe28d7fdfb4f76c920` below, and decide whether to assign a review of that head. Human merge of https://github.com/exones/braid/pull/13 stays the stop before F. This worker does not watch, launch a reviewer, merge, or start F or D. The proof stays an uncommitted supplement. Do not add a commit whose only purpose is its own SHA.

## Replacement collision

The replacement thread `mcp:launch:7c30a9962f5352a1d5b673802a04f5ac5c1e1b6a89514bc74427a8c7f08a3d53` re-entered its launch prompt while the scoped-fix child was already writing this checkout. It rechecked the historical head and did not edit the operator reference, did not commit, and did not push. It did not watch.

- Historical head still `ccabae4df1f813317b8dd1247ea04878ee6ce023`. PR 13 still OPEN on that head when the check finished.
- Blocker send: `delivery: started`, `status: starting`. Message `message:mcp:c249b90a-4546-49f3-9133-8ebe58e4297b:thread-send:g-blocker-writer-collision-ccabae4df1f813317b8dd1247ea04878ee6ce023`. Run `run:thread:8a3c206a-9192-498f-b90a-19b5bf807c8c:ordinal:86`. Link `<t3-thread://v2/c361f221-e595-46eb-8f4b-7926ea55f19c/8a3c206a-9192-498f-b90a-19b5bf807c8c>`.
- Live writer at that send: `<t3-thread://v2/c361f221-e595-46eb-8f4b-7926ea55f19c/thread:delegated-task:command%3Amcp%3A1375c3de-8be9-4699-81fb-c1be4f9630d2%3Adelegate-task%3Ag-scoped-fix-001>`.
- This section is a post-send supplement. It is not a new CI head.

## Current-head proof

Verified on this fresh launch of `mcp:launch:7c30a9962f5352a1d5b673802a04f5ac5c1e1b6a89514bc74427a8c7f08a3d53`, run `run:thread:mcp%3Alaunch%3A7c30a9962f5352a1d5b673802a04f5ac5c1e1b6a89514bc74427a8c7f08a3d53:ordinal:1`, `parentThreadId` null. Label: explicit recovery snapshot. This thread did not call `watch_pull_request`. The launch unwatch was `watching: false`, `wasWatching: false`, with no active run and an empty queue. Host branch metadata was null for `existing_worktree`; local Git was left attached to `item/braid-003-g-independent-thread-ci` and was not renamed or rebound.

- Root: `C:\worktrees\agento\item-braid-003-g-independent-thread-ci`
- Branch: `item/braid-003-g-independent-thread-ci`
- HEAD and `origin/item/braid-003-g-independent-thread-ci`: `9b043f0fadc381d2dfa173fe28d7fdfb4f76c920`
- Parent: `ccabae4df1f813317b8dd1247ea04878ee6ce023`
- Origin: `https://github.com/exones/braid.git`
- Index empty. Unstaged supplements: this checkpoint and `epics/braid/003-worker-skill/reports/G.md` only.
- PR https://github.com/exones/braid/pull/13 OPEN, MERGEABLE, `mergeStateStatus` CLEAN, `reviewDecision` empty
- Base `epic/braid-003-worker-skill` `180f2e0b3cb6fc1a380a955e24a9580d0a4c85b8`
- Merge-test `723d6b3b54f5de069989cce0d9563fe3e0dcbbb7`. Parents, in order: the epic base, then the item head. Its file list matches `git diff --name-status` from the base to the item head: the three added G documents.
- Reconfirmed after the archive check: local HEAD and PR head were still `9b043f0fadc381d2dfa173fe28d7fdfb4f76c920`.
- Only two CI runs exist for this head, both workflow CI, attempt 1, conclusion success. Each job's Install dependencies, Verify, and Upload packed tarball steps succeeded. Each Verify log showed typecheck, `tsc -p tsconfig.build.json`, `tests 40`, `pass 40`, `fail 0`, `skipped 0`, and clean package proof.
- Downloaded zip SHA-256 matched the artifact service digest on all four archives. Contained tarball SHA-256 matched provenance `digest` on all four. Provenance: `@exones/braid` 0.1.1, `released` false, registry publication `not performed`, `installOutsideCheckout` true, executable `braid`, Node v26.13.0, npm 11.20.0, PowerShell 7.6.9, `candidate` true, `worktreeDirty` false.
- Push `sourceRevision` and `githubSha` were the item head, ref `refs/heads/item/braid-003-g-independent-thread-ci`, `pullRequestHeadSha` empty. Pull-request `sourceRevision` and `githubSha` were the merge-test, ref `refs/pull/13/merge`, `pullRequestHeadSha` equal to the item head.
- Same-OS tarball hashes match each other and the prior head's tarballs. Zip digests differ. Cross-machine and cross-OS equality is not claimed.
- Archives remain in ignored `.tools/G-hosted/9b043f0/`. They are not part of a commit.
- The earlier `cannot write state` failure stays on push run `41896581649` attempt 1. It is not a result for this head.

| Event | Run | Attempt | Job | Result | Artifact | Zip SHA-256 | Tarball SHA-256 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| push | [41909573028](https://github.com/exones/braid/actions/runs/41909573028) | 1 | verify (ubuntu-latest) `126853232354` | success | `13362830129` | `ce1047016cdf2d411c690447dc223d0e11c6b1f82216a01902dc25304bce9643` | `b8a96b1baee9bad89259d05087e016f8889c94c8b0a6954d774e8835d4d880ec` |
| push | 41909573028 | 1 | verify (windows-latest) `126853231613` | success | `13360919188` | `01904c42fe40f98379f2fe0df4fbbf8049e6b9cf12982584bfbfe70fa035778a` | `8c434113e62663591c23faebcf35aeb13162a130446fa8423de514d92538f92d` |
| pull_request | [41909584011](https://github.com/exones/braid/actions/runs/41909584011) | 1 | verify (ubuntu-latest) `126853267579` | success | `13362805073` | `59700efcfcd90d722db8a781f0973a3f6d0d4d54efd13dd9aac430407ee06da2` | `b8a96b1baee9bad89259d05087e016f8889c94c8b0a6954d774e8835d4d880ec` |
| pull_request | 41909584011 | 1 | verify (windows-latest) `126853268037` | success | `13361967930` | `60209623a7c0f767fd5143338913dcf881eb44167bfda3d73fbcfdf02a2dc3a2` | `8c434113e62663591c23faebcf35aeb13162a130446fa8423de514d92538f92d` |

## Proof send

`delivery: started`, `status: starting`. Message `message:mcp:c249b90a-4546-49f3-9133-8ebe58e4297b:thread-send:g-proof-9b043f0fadc381d2dfa173fe28d7fdfb4f76c920`. Run `run:thread:8a3c206a-9192-498f-b90a-19b5bf807c8c:ordinal:90`. Link `<t3-thread://v2/c361f221-e595-46eb-8f4b-7926ea55f19c/8a3c206a-9192-498f-b90a-19b5bf807c8c>`. Acceptance is delivery, not evidence the coordinator has read or acted. This paragraph is the post-send supplement. It does not change the four-job table and it is not a new CI head.

## Fresh re-entry recheck

Same launch `mcp:launch:7c30a9962f5352a1d5b673802a04f5ac5c1e1b6a89514bc74427a8c7f08a3d53`, run `run:thread:mcp%3Alaunch%3A7c30a9962f5352a1d5b673802a04f5ac5c1e1b6a89514bc74427a8c7f08a3d53:ordinal:1`, `parentThreadId` null, entered the launch prompt again. Local Git was read once. Root `C:\worktrees\agento\item-braid-003-g-independent-thread-ci`, attached branch `item/braid-003-g-independent-thread-ci`, HEAD and `origin/item/braid-003-g-independent-thread-ci` `9b043f0fadc381d2dfa173fe28d7fdfb4f76c920`, parent `ccabae4df1f813317b8dd1247ea04878ee6ce023`. Origin `https://github.com/exones/braid.git`. No upstream. Host branch metadata stayed null. The checkout was not renamed or rebound.

The launch prompt still named `ccabae4df1f813317b8dd1247ea04878ee6ce023`. That SHA is the parent, not HEAD. This pass re-downloaded the four archives for `9b043f0fadc381d2dfa173fe28d7fdfb4f76c920` into ignored `.tools/G-hosted/9b043f0-recheck/`. Zip SHA-256 matched the artifact service on all four. Tarball SHA-256 matched provenance `digest` on all four. The numbers are the table above. Provenance on all four: `@exones/braid` 0.1.1, `released` false, registry publication `not performed`, `installOutsideCheckout` true, executable `braid`, Node v26.13.0, npm 11.20.0, PowerShell 7.6.9, `candidate` true, `worktreeDirty` false. Push source and `githubSha` are the item head, ref `refs/heads/item/braid-003-g-independent-thread-ci`, `pullRequestHeadSha` empty. Pull-request source and `githubSha` are merge-test `723d6b3b54f5de069989cce0d9563fe3e0dcbbb7`, ref `refs/pull/13/merge`, `pullRequestHeadSha` equal to the item head. Merge-test parents, in order: `180f2e0b3cb6fc1a380a955e24a9580d0a4c85b8`, then the item head. Its file list is the three added G documents, the same name-status as the base-to-head diff. Each Verify log showed typecheck, `tsc -p tsconfig.build.json`, `tests 40`, `pass 40`, `fail 0`, `skipped 0`, and clean package proof. Push package-proof text names the item head. Pull-request package-proof text names the merge-test.

After that check, local HEAD and PR head were still `9b043f0fadc381d2dfa173fe28d7fdfb4f76c920`. PR 13 OPEN, MERGEABLE, `mergeStateStatus` CLEAN, `reviewDecision` empty. `link_pull_request` returned `alreadyLinked: true`. This pass did not watch. The supplied unwatch remains `watching: false`, `wasWatching: false`. Index empty. Dirty paths remain this checkpoint and `epics/braid/003-worker-skill/reports/G.md`. This section is not a new CI head.

## Next action

Coordinator: dedupe this re-entry with the ordinal-90 proof send, record the continuation result as negative/partial, and decide whether to assign a review of `9b043f0fadc381d2dfa173fe28d7fdfb4f76c920`. Human merge of https://github.com/exones/braid/pull/13 stays the stop before F. This worker does not watch, launch a reviewer, merge, or start F or D. Not Done.

## Recheck send

`delivery: steered`, `status: starting`. Message `message:mcp:c249b90a-4546-49f3-9133-8ebe58e4297b:thread-send:g-recheck-9b043f0fadc381d2dfa173fe28d7fdfb4f76c920`. Run `run:thread:8a3c206a-9192-498f-b90a-19b5bf807c8c:ordinal:93`. Link `<t3-thread://v2/c361f221-e595-46eb-8f4b-7926ea55f19c/8a3c206a-9192-498f-b90a-19b5bf807c8c>`. Acceptance is delivery, not evidence the coordinator has read or acted. This paragraph is the post-send supplement. It does not change the four-job table and it is not a new CI head.
