# BRAID-003/G continuation result

The overall result is revised from negative to positive-for-minimal-watch-wake. On 2026-11-04 a minimal top-level Cursor grok-4.7 high thread opened throwaway https://github.com/exones/braid/pull/15 (head `242b20cc76566b4db713a02c91c57f8d43e0efad`), watched, ended its turn, and completed from one watch wake: 2 runs, 1 wake, no re-entry, one coordinator result, thread settled. The original-run history below stays as recorded. The earlier replacement's 46-minute loop stayed inside one run and is attributed to a long resume-oriented worker prompt, not to the watch. Detail is in [Follow-up watch probe (PR 15)](../validation/G/operator-reference.md#follow-up-watch-probe-pr-15). Review of the documentation head, and the human merge of https://github.com/exones/braid/pull/13, still gate F.

Original-run result, superseded for the watch-wake part by the PR 15 probe: one top-level item thread did not watch, verify, repair, and deliver on its own. The original worker's runs were interrupted or cancelled, the user reran the failed push job, and a coordinator-launched replacement finished the hosted proof from an explicit recovery snapshot. That replacement then restarted inside the same run and sent duplicate results for one head. This negative, partial result is the original-run limit G found. Review of the new documentation head, and the human merge of https://github.com/exones/braid/pull/13, still come next. This file ships in the documentation commit. Hosted proof of that commit is checked after push and is not stored in this blob.

## What changed

The operator reference now lets F adopt worktree binding, the watch registration payload, one catch-up readiness snapshot, own-thread completion from a single watch wake for a short step-explicit prompt that ends its turn right after watching, the current-head CI and artifact verification recipe, and explicit coordinator message delivery. Probe PR 15 proved that watch-wake completion. Watch survival, unassisted repair, and exactly-once delivery stay unproven. The original-run result, superseded by the PR 15 probe, was that F must not rely on same-thread completion driven by a watch wake, a watch surviving interruption, one result per head, or unassisted repair. The coordinator still drives recovery from interruption with an explicit snapshot and should dedupe by head.

Delivery evidence for the earlier reference commit `ccabae4df1f813317b8dd1247ea04878ee6ce023` remains below. Push attempt 2 and the pull-request run met the frozen four-job set for that head, and the four archives matched their provenance. That evidence is green for that head's files. It does not answer the continuation question, and it is not proof of the commit that contains this report.

## Why

G asked whether one top-level item thread can bind a named worktree, keep the proof, and deliver the outcome to the existing coordinator. The trial did not show that path. A report that called the same evidence a green handoff would let F consume a contract the run contradicted.

The replacement's repeated self-restarts show that delivery is not idempotent and is not single-shot. The receiver has to deduplicate by head. The unwatch result does not explain when the watch ended.

## Continuation result

The continuation question has a negative answer on the original run. That original-run result is superseded for the watch-wake part by the PR 15 probe. What follows is the partial result.

### Original worker

Thread `mcp:launch:b4318dded53b10790c1cb711c5a4496141347271c88ddce9a5892d38485b3a80`. Review 001 read the host record. None of the five runs completed. Times are UTC.

| Ordinal | Requested | Started | Ended | Status |
| --- | --- | --- | --- | --- |
| 1 | 19:17:50 | 19:18:05 | 19:37:58 | interrupted |
| 2 (readiness) | 19:24:45 | 19:38:00 | 19:51:36 | interrupted |
| 3 | 19:27:39 | never | 20:02:13 | cancelled |
| 4 | 20:05:20 | 20:05:20 | 20:07:41 | interrupted |
| 5 | 20:09:57 | 20:09:57 | 20:10:01 | interrupted |

Ordinal 1 registered `watch_pull_request` with `watching: true` and `wasWatching: false`, kept running about ten minutes after that call, and was then interrupted. The queued readiness turn, ordinal 2, started only after that interruption and was interrupted too. It found push attempt 1 red. Ordinal 3 was requested at 19:27:39Z, after both pull-request jobs had produced artifacts, and was cancelled before it started. No watch wake drove verification or completion.

The user account `exones` reran the failed push job. GitHub records that actor on push attempt 2, starting at 20:04:47Z. The worker did not rerun it. Attempt 1 Windows job `126807600244` stays failed. Verify reported `package proof failed: concurrent adds failed` and `error: cannot write state`. Upload on that job was skipped. The cause stays unidentified.

The coordinator launched the replacement. The original thread never verified a finished head.

### Replacement self-restarts and duplicate results

Replacement thread `mcp:launch:7c30a9962f5352a1d5b673802a04f5ac5c1e1b6a89514bc74427a8c7f08a3d53`, run ordinal 1, on the same attached item branch. After its first send, the same launch prompt was entered again inside that run, and it was entered again after later sends. Each pass re-verified head `ccabae4df1f813317b8dd1247ea04878ee6ce023` and sent another coordinator message for that same head. This is the same in-run restart pattern that stopped the original worker.

| Message | Coordinator run | Role |
| --- | --- | --- |
| `g-final-ccabae4df1f813317b8dd1247ea04878ee6ce023` | `run:thread:8a3c206a-9192-498f-b90a-19b5bf807c8c:ordinal:78` | first explicit result for this head |
| `g-reconfirm-ccabae4df1f813317b8dd1247ea04878ee6ce023` | `run:thread:8a3c206a-9192-498f-b90a-19b5bf807c8c:ordinal:80` | duplicate for the same head |
| `g-verify-ccabae4df1f813317b8dd1247ea04878ee6ce023` | `run:thread:8a3c206a-9192-498f-b90a-19b5bf807c8c:ordinal:81` | duplicate for the same head |
| `g-recheck-ccabae4df1f813317b8dd1247ea04878ee6ce023` | `run:thread:8a3c206a-9192-498f-b90a-19b5bf807c8c:ordinal:84` | duplicate for the same head |

Each message id is prefixed `message:mcp:c249b90a-4546-49f3-9133-8ebe58e4297b:thread-send:`. Each return was `delivery: started` and `status: starting` on `<t3-thread://v2/c361f221-e595-46eb-8f4b-7926ea55f19c/8a3c206a-9192-498f-b90a-19b5bf807c8c>`. Acceptance is delivery. It is not evidence the coordinator read the message. Ordinals 80 and 81 were stored and then failed on a provider usage limit before acting. That limit explains why those sends were not acted on. It does not explain the re-entry.

Named limit for F: delivery is not one result per head. The coordinator must deduplicate by head.

### Unwatch

The replacement's launch prompt stated the prior unwatch as `watching: false` and `wasWatching: false`, with an empty queue and no active run. Label: no active subscription at unwatch; termination cause and time unobserved. The value is second-hand. This replacement thread did not call `unwatch_pull_request`, and the payload was not saved by the thread that called unwatch. Watch lifetime across interruption and cancellation is an open host question for F. The unwatch shows that nothing was left to stop. It does not show when or why the subscription ended.

## Left for you

No product repair is requested. The attempt-1 `cannot write state` result stays unidentified unless the same failure recurs.

Coordinator: record G's original-run continuation result as negative, superseded for the watch-wake part by the PR 15 probe. Keep F to the current contract in [What F can take from this trial](../validation/G/operator-reference.md#what-f-can-take-from-this-trial). Review `G-independent-thread-ci-review-001` covered head `ccabae4df1f813317b8dd1247ea04878ee6ce023` and produced findings F1 to F4, which this commit addresses. A review of the new head is a separate assignment. Human merge of https://github.com/exones/braid/pull/13 into `epic/braid-003-worker-skill` remains the stop before F. F and D stay stopped. Done stays separate.

Proposed shared status, for the coordinator to record: original-run continuation result negative/partial, superseded for the watch-wake part by the PR 15 probe. The current F contract allows own-thread completion from a single watch wake for a short step-explicit prompt. Watch survival, unassisted repair, and exactly-once delivery stay unproven. Delivery evidence for `ccabae4df1f813317b8dd1247ea04878ee6ce023` passed and does not prove single-worker continuity. Not Done. Not merged.

## Technical record

- Item: [G](../backlog/G-independent-thread-ci.md). Assignment [assignments/G.md](../assignments/G.md). Reference [validation/G/operator-reference.md](../validation/G/operator-reference.md). This report and [checkpoints/G.md](../checkpoints/G.md) ship in the same documentation commit. That commit's parent is `ccabae4df1f813317b8dd1247ea04878ee6ce023`. This blob does not name its own SHA.
- Root: `C:\worktrees\agento\item-braid-003-g-independent-thread-ci`. Branch: `item/braid-003-g-independent-thread-ci`. Origin: `https://github.com/exones/braid.git`. No upstream at authoring.
- PR: https://github.com/exones/braid/pull/13. State OPEN at authoring. Base `epic/braid-003-worker-skill` `180f2e0b3cb6fc1a380a955e24a9580d0a4c85b8`.
- Historical delivery head: `ccabae4df1f813317b8dd1247ea04878ee6ce023`. Parent of that commit: `180f2e0b3cb6fc1a380a955e24a9580d0a4c85b8`. The four-job table below proves that head only.
- Replacement thread: `mcp:launch:7c30a9962f5352a1d5b673802a04f5ac5c1e1b6a89514bc74427a8c7f08a3d53`. Run `run:thread:mcp%3Alaunch%3A7c30a9962f5352a1d5b673802a04f5ac5c1e1b6a89514bc74427a8c7f08a3d53:ordinal:1`. `parentThreadId` null. Profile: Cursor `grok-4.7`, high reasoning, 500k context. This thread linked PR 13 (`alreadyLinked: false`) and did not watch.
- Original thread: `mcp:launch:b4318dded53b10790c1cb711c5a4496141347271c88ddce9a5892d38485b3a80`. Registration payload `watching: true`, `wasWatching: false`. Readiness snapshot found attempt 1 red.
- Verification label for the historical head: explicit recovery snapshot on the replacement. It is not a watched event.
- Workflow `.github/workflows/ci.yml`, name CI. Required steps on each current job of that head: Install dependencies (step 5), Verify (step 6), Upload packed tarball (step 7), all success. Verify logs for the successful jobs showed typecheck, `tsc -p tsconfig.build.json`, `tests 40`, `pass 40`, `fail 0`, `skipped 0`, and packed-install proof.
- Attempt 1 push Windows job `126807600244` remains failed evidence. Its upload was skipped. Its Ubuntu artifact is not the attempt-2 archive below. Attempt 2 is the push proof for `ccabae4df1f813317b8dd1247ea04878ee6ce023`.
- Merge-test at the time of that proof: `fe91513892f02aa72ba6588215362c7741e4451b` at `refs/pull/13/merge`. Parents, in order, were the epic base and the item head. Its only file change was `epics/braid/003-worker-skill/validation/G/operator-reference.md`. This documentation commit replaces that merge-test. The new merge-test is part of the post-push proof, outside this blob.

| Event | Run | Attempt | Job | Result | Artifact | Zip SHA-256 | Tarball SHA-256 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| push | [41896581649](https://github.com/exones/braid/actions/runs/41896581649) | 2 | verify (ubuntu-latest) `126830530443` | success | `13359641660` | `88a11012bde702d0e5cf2ebfc904db37414b52cc607d847815a022b9f45d91c8` | `b8a96b1baee9bad89259d05087e016f8889c94c8b0a6954d774e8835d4d880ec` |
| push | 41896581649 | 2 | verify (windows-latest) `126830530560` | success | `13359736544` | `6d6c8f366251d9cdc3e35eb28e49b11c1fb3a3147fe3e4aa8e27bf4f2bf95fd0` | `8c434113e62663591c23faebcf35aeb13162a130446fa8423de514d92538f92d` |
| pull_request | [41896593015](https://github.com/exones/braid/actions/runs/41896593015) | 1 | verify (ubuntu-latest) `126807638760` | success | `13355946835` | `fc64844cdd6293abb16d82616aaa93d3ee15b11d394248b17dcb6a66e803e48a` | `b8a96b1baee9bad89259d05087e016f8889c94c8b0a6954d774e8835d4d880ec` |
| pull_request | 41896593015 | 1 | verify (windows-latest) `126807638492` | success | `13355987092` | `6ce14a1f55fedb61628ccbd00106fa33d5fe8815506735870a0728c7ca2dd82b` | `8c434113e62663591c23faebcf35aeb13162a130446fa8423de514d92538f92d` |

- Provenance on all four historical archives: `@exones/braid` 0.1.1, `released` false, registry publication `not performed`, `installOutsideCheckout` true, executable `braid`, Node v26.13.0, npm 11.20.0, PowerShell 7.6.9, `candidate` true, `worktreeDirty` false. Push `sourceRevision` and `githubSha` were the item head, ref `refs/heads/item/braid-003-g-independent-thread-ci`, `pullRequestHeadSha` empty. Pull-request `sourceRevision` and `githubSha` were merge-test `fe91513892f02aa72ba6588215362c7741e4451b`, ref `refs/pull/13/merge`, `pullRequestHeadSha` equal to the item head. Same-OS tarball equality across the two events is an observation. The provenance text says cross-machine and cross-OS equality is not claimed.
- Archives from that check stayed in ignored `.tools/G-hosted/`. They are not part of the commit.
- Local dirty probe, recorded earlier and not re-run for this documentation edit: `npm run verify` exit 0, Node v26.13.0, npm 11.20.0, PowerShell 7.6.9, 40 tests passed, `candidate` false, `worktreeDirty` true, source `180f2e0b3cb6fc1a380a955e24a9580d0a4c85b8`. That probe is not hosted proof.
- Next coordinator action: read this original-run negative result, superseded for the watch-wake part by the PR 15 probe, take the post-push four-job proof of the documentation commit from the worker return, and decide whether to assign a new review of that head. This worker does not launch a reviewer, merge, or start F or D.

### Replacement collision after this draft

The replacement thread re-entered its launch prompt while the scoped-fix child was writing this checkout. It rechecked historical head `ccabae4df1f813317b8dd1247ea04878ee6ce023` and left the operator reference, this report's findings, and the checkpoint's findings in place. It did not commit or push. PR 13 was still OPEN at that head after the archive check. This thread did not watch.

The blocker send returned `delivery: started` and `status: starting`. Message `message:mcp:c249b90a-4546-49f3-9133-8ebe58e4297b:thread-send:g-blocker-writer-collision-ccabae4df1f813317b8dd1247ea04878ee6ce023`. Run `run:thread:8a3c206a-9192-498f-b90a-19b5bf807c8c:ordinal:86`. Link `<t3-thread://v2/c361f221-e595-46eb-8f4b-7926ea55f19c/8a3c206a-9192-498f-b90a-19b5bf807c8c>`. That acceptance is delivery, not evidence the coordinator has read or acted. The live writer named in the message is `<t3-thread://v2/c361f221-e595-46eb-8f4b-7926ea55f19c/thread:delegated-task:command%3Amcp%3A1375c3de-8be9-4699-81fb-c1be4f9630d2%3Adelegate-task%3Ag-scoped-fix-001>`. This paragraph is the post-send supplement. It does not change the historical four-job table.

### Documentation-head proof

The documentation commit is `9b043f0fadc381d2dfa173fe28d7fdfb4f76c920`. Its parent is `ccabae4df1f813317b8dd1247ea04878ee6ce023`. This section is an uncommitted supplement. It is not inside that commit, and it is not a reason to push another commit.

Local Git on this launch: root `C:\worktrees\agento\item-braid-003-g-independent-thread-ci`, attached branch `item/braid-003-g-independent-thread-ci`, HEAD equal to `origin/item/braid-003-g-independent-thread-ci`. Host metadata had a null branch for the existing worktree. The checkout was not renamed or rebound. The index was empty. The only dirty paths are this report and `epics/braid/003-worker-skill/checkpoints/G.md`.

PR https://github.com/exones/braid/pull/13 stayed OPEN on that head, MERGEABLE, `mergeStateStatus` CLEAN, with an empty `reviewDecision`. Base `epic/braid-003-worker-skill` is `180f2e0b3cb6fc1a380a955e24a9580d0a4c85b8`. Merge-test `723d6b3b54f5de069989cce0d9563fe3e0dcbbb7` has those parents in that order. Its only changes are the three added G documents, the same name-status as the base-to-head diff. Local HEAD and the PR head were reconfirmed at that SHA after the archive check.

The frozen set for this head passed. Both runs are workflow CI, attempt 1, conclusion success, and they are the only CI runs for the SHA. On every job, Install dependencies, Verify, and Upload packed tarball succeeded. Verify logged typecheck, `tsc -p tsconfig.build.json`, `tests 40`, `pass 40`, `fail 0`, `skipped 0`, and clean package proof. Each downloaded zip matched its artifact service digest. Each contained tarball matched provenance `digest`. Provenance on all four: `@exones/braid` 0.1.1, `released` false, registry publication `not performed`, `installOutsideCheckout` true, executable `braid`, Node v26.13.0, npm 11.20.0, PowerShell 7.6.9, `candidate` true, `worktreeDirty` false. Push source and `githubSha` are the item head, ref `refs/heads/item/braid-003-g-independent-thread-ci`, `pullRequestHeadSha` empty. Pull-request source and `githubSha` are the merge-test, ref `refs/pull/13/merge`, `pullRequestHeadSha` equal to the item head. Same-OS tarball hashes match each other and the prior head. Zip digests differ. Cross-machine and cross-OS equality is not claimed. Archives stay in ignored `.tools/G-hosted/9b043f0/`.

This proof covers the files at `9b043f0fadc381d2dfa173fe28d7fdfb4f76c920`. It does not change the original-run negative continuation result, which the PR 15 probe later superseded for the watch-wake part. The attempt-1 `cannot write state` failure remains on run `41896581649` and is not evidence about this head. Verification was an explicit recovery snapshot. This launch did not watch. The supplied unwatch was `watching: false` and `wasWatching: false`.

| Event | Run | Attempt | Job | Result | Artifact | Zip SHA-256 | Tarball SHA-256 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| push | [41909573028](https://github.com/exones/braid/actions/runs/41909573028) | 1 | verify (ubuntu-latest) `126853232354` | success | `13362830129` | `ce1047016cdf2d411c690447dc223d0e11c6b1f82216a01902dc25304bce9643` | `b8a96b1baee9bad89259d05087e016f8889c94c8b0a6954d774e8835d4d880ec` |
| push | 41909573028 | 1 | verify (windows-latest) `126853231613` | success | `13360919188` | `01904c42fe40f98379f2fe0df4fbbf8049e6b9cf12982584bfbfe70fa035778a` | `8c434113e62663591c23faebcf35aeb13162a130446fa8423de514d92538f92d` |
| pull_request | [41909584011](https://github.com/exones/braid/actions/runs/41909584011) | 1 | verify (ubuntu-latest) `126853267579` | success | `13362805073` | `59700efcfcd90d722db8a781f0973a3f6d0d4d54efd13dd9aac430407ee06da2` | `b8a96b1baee9bad89259d05087e016f8889c94c8b0a6954d774e8835d4d880ec` |
| pull_request | 41909584011 | 1 | verify (windows-latest) `126853268037` | success | `13361967930` | `60209623a7c0f767fd5143338913dcf881eb44167bfda3d73fbcfdf02a2dc3a2` | `8c434113e62663591c23faebcf35aeb13162a130446fa8423de514d92538f92d` |

Coordinator next action: record the original-run negative continuation result, superseded for the watch-wake part by the PR 15 probe, use this table as the current-head proof, and decide whether to assign a review of `9b043f0fadc381d2dfa173fe28d7fdfb4f76c920`. Human merge of PR 13 remains the stop before F. This worker does not launch a reviewer, merge, or start F or D. Not Done.

The proof send returned `delivery: started` and `status: starting`. Message `message:mcp:c249b90a-4546-49f3-9133-8ebe58e4297b:thread-send:g-proof-9b043f0fadc381d2dfa173fe28d7fdfb4f76c920`. Run `run:thread:8a3c206a-9192-498f-b90a-19b5bf807c8c:ordinal:90`. Link `<t3-thread://v2/c361f221-e595-46eb-8f4b-7926ea55f19c/8a3c206a-9192-498f-b90a-19b5bf807c8c>`. That acceptance is delivery, not evidence the coordinator has read or acted. This paragraph is the post-send supplement. It does not change the four-job table.

### Fresh re-entry artifact recheck

The same launch entered its prompt again. Local Git was read once and left attached. HEAD is `9b043f0fadc381d2dfa173fe28d7fdfb4f76c920`. The launch prompt's `ccabae4df1f813317b8dd1247ea04878ee6ce023` is that commit's parent. The checkout was not renamed or rebound. Host branch metadata was null and was not repaired.

This pass downloaded the four archives again into ignored `.tools/G-hosted/9b043f0-recheck/`. Each zip matched its artifact-service digest. Each tarball matched provenance `digest`. The hashes are the documentation-head table above. Provenance fields match that section, including push source equal to the item head and pull-request source equal to merge-test `723d6b3b54f5de069989cce0d9563fe3e0dcbbb7` with `pullRequestHeadSha` equal to the item head. Merge-test parents are the epic base, then the item head. Its changed files are the three added G documents. Each of the four Verify logs showed typecheck, `tsc -p tsconfig.build.json`, `tests 40`, `pass 40`, `fail 0`, `skipped 0`, and clean package proof.

After the download, PR 13 was still OPEN on that head, MERGEABLE, `mergeStateStatus` CLEAN, `reviewDecision` empty. `link_pull_request` returned `alreadyLinked: true`. This pass did not watch. The supplied unwatch remains `watching: false` and `wasWatching: false`. The only dirty paths are this report and `epics/braid/003-worker-skill/checkpoints/G.md`. This recheck is not a new CI head. Dedupe the following send with the ordinal-90 proof send. The original-run continuation result, superseded for the watch-wake part by the PR 15 probe, stays negative/partial. Not Done.

The recheck send returned `delivery: steered` and `status: starting`. Message `message:mcp:c249b90a-4546-49f3-9133-8ebe58e4297b:thread-send:g-recheck-9b043f0fadc381d2dfa173fe28d7fdfb4f76c920`. Run `run:thread:8a3c206a-9192-498f-b90a-19b5bf807c8c:ordinal:93`. Link `<t3-thread://v2/c361f221-e595-46eb-8f4b-7926ea55f19c/8a3c206a-9192-498f-b90a-19b5bf807c8c>`. That acceptance is delivery, not evidence the coordinator has read or acted. This paragraph is the post-send supplement. It does not change the four-job table.
