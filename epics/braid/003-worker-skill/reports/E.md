# Task E: consistent human reports and merge stopping gates

Status: partly proven. Date: 2026-11-04.
Backlog item: [E](../backlog/E-reporting-and-merge-gates.md). Checkout: `C:\worktrees\agento\t3-61a93ffc`. Branch: `t3/61a93ffc`. Checked head: `f6b136099889205545d3bfde2595f626a264efb2`.

The reporting contract and the human-merge stop are in place, and the current-head CI proof is green. This pull request is ready for coordinator inspection and a new independent review. It is not Done, and it is not merged.

## What changed

- Item reports, user briefings, and pull requests now share one account: the current situation, then What changed, Why, Left for you, and Technical record. The coordinator translates child evidence.
- A dependent item stops until the required pull request is actually merged. Green CI and independent review are not a merge.
- Accepted B and C are on this branch through non-rewriting merge commits with current main. Product, tests, CI workflows, and the other epics are unchanged.
- All four current-head CI jobs succeeded. Their Verify and Upload steps, artifact digests, clean provenance, and the pull-request merge-test parents were checked independently.

## Why

Briefings were drifting, and local acceptance could stack more unmerged work. The maintainer can see the outcome and the remaining human merge before reading hashes. D stays stopped until this pull request is merged by a person.

## Left for you

No user action is needed now. The next owner is the coordinator: inspect this head and assign `E-reporting-and-merge-gates-review-001`. The human merge comes after that review. Do not start D, and do not treat this green result as Done. Nothing is published.

## Technical record

This file in the worktree is the final unstaged supplement. The checked blob at `f6b136099889205545d3bfde2595f626a264efb2` is the pre-CI report. The index is empty. These bytes are not pushed.

### Binding and lineage

Root `C:\worktrees\agento\t3-61a93ffc`, branch `t3/61a93ffc`, origin `https://github.com/exones/braid.git`. Startup HEAD `f99de9d9b9e7d27d8907315dc7a10b2bce5d7608` was clean. Delivery HEAD remains `f6b136099889205545d3bfde2595f626a264efb2`. Pull request: https://github.com/exones/braid/pull/11, base `main` `a2120bfa084a32212a780a0fdc095c38d8869ef5`, OPEN.

Ordinal 1 returned nonterminal `WAITING_CI_RELAY` and is complete. This wake is parent arm `PR11-ARM-001` READY: `watching: true`, `wasWatching: false`. No new task or run id was supplied, so none is invented, and the completed ordinal is not described as still running. The parent snapshot was readiness for checks that finished before registration. It was not treated as artifact or source proof. Teardown has not been observed.

Git preparation used `git merge --no-ff`, not rebase:

| Input | Commit | Result on this branch |
| --- | --- | --- |
| main | `a2120bfa084a32212a780a0fdc095c38d8869ef5` | `b83ef41a0c68115604a93d52e67155cd438f0aff` |
| B human merge | `71071ef4bbf380213a5f5cd1b74eb458016b14e3` | `7783cdacf90510589b940f9ce2705250c4044486` (no file delta; reviewed B `01838178e67e4aa7fdb382587d15527c8cd3402b` was already an ancestor) |
| C human merge | `4e7e976a4030f23d63b846f156a307a7b70fc870` | `087dff46001b5353700dcf282e5e459b9f1f9530` |

C report and checkpoint conflicts kept the context supplements. Their SHA-256 values remain report `29487ccfb1bf4865c230d0a53a93a6b25a0428738254c4ce95b80fb31d75caf4`, checkpoint `b1d3ce7e81be16627e259cd597c59ea004278929734a9138babcd05b5a38e527`, review report `f851b25a3b8293fd30f1d0142125741933ea71a26002fd99c57e4dca3154e6e0`, review checkpoint `17d6b15dadc9bbfa8abb50fbaa494cec351487c4472131ac83900e3cdf4f73b1`. Epic, current checkpoint, and the E assignment match `f99de9d9`. Policy matches reviewed C except main's trusted-publishing decision line and these E edits. `git diff a2120bf --` product, workflow, seed, and trusted-publish paths is empty.

#9 and #10 were read once and not edited. Both stay feature-base evidence: #9 head `01838178e67e4aa7fdb382587d15527c8cd3402b`, merge `71071ef4bbf380213a5f5cd1b74eb458016b14e3`; #10 head `6c3fcc112a344daed36b8d782426d65509ff35db`, merge `4e7e976a4030f23d63b846f156a307a7b70fc870`.

### Local proof

Dirty probe before the delivery commit, source `087dff46`, candidate false. Both skill validators exit 0. Sixteen changed Markdown files, 103 local links, 0 missing. `git diff --check` exit 0. `scripts/Verify.ps1` exit 0: Node v26.13.0, npm 11.20.0, pwsh 7.6.9, 40 tests passed. That probe is not the hosted candidate.

### Independent current-head proof

`python -X utf8 .tools/E-hosted-verify.py` exit 0. Ignored aid only. It calls `gh pr view` and the run, job, artifact, log, and git-commit APIs. Workflow CI, path `.github/workflows/ci.yml`, attempt 1 for both events. Every run and job head is the delivery HEAD. Verify is step 6 and Upload packed tarball is step 7, both success. Each log shows 40 tests, pass 40, fail 0, `package-proof candidate True`, and `package-proof worktree-dirty False`. Each artifact zip has three members (`exones-braid-0.1.1.tgz`, `exones-braid-0.1.1.provenance.json`, `npm-pack.json`). The downloaded zip SHA-256 matches the artifact-service digest. The tarball SHA-256 matches that provenance record and the job log.

| Event / attempt-1 run | Windows job / artifact | Ubuntu job / artifact |
| --- | --- | --- |
| [push 41833239781](https://github.com/exones/braid/actions/runs/41833239781) | [126585490215](https://github.com/exones/braid/actions/runs/41833239781/job/126585490215) / [13324446109](https://github.com/exones/braid/actions/runs/41833239781/artifacts/13324446109) | [126585489564](https://github.com/exones/braid/actions/runs/41833239781/job/126585489564) / [13323906396](https://github.com/exones/braid/actions/runs/41833239781/artifacts/13323906396) |
| [pull_request 41833245907](https://github.com/exones/braid/actions/runs/41833245907) | [126585509871](https://github.com/exones/braid/actions/runs/41833245907/job/126585509871) / [13323751800](https://github.com/exones/braid/actions/runs/41833245907/artifacts/13323751800) | [126585510180](https://github.com/exones/braid/actions/runs/41833245907/job/126585510180) / [13323656674](https://github.com/exones/braid/actions/runs/41833245907/artifacts/13323656674) |

| Artifact | ZIP SHA-256 |
| --- | --- |
| push Windows `13324446109` | `e87a461789769a90479325d0a9a1cf9a1c451e45455acd6a583dc0da6b943e3f` |
| push Ubuntu `13323906396` | `0f6dfa79982fef20e597dcc685152456e6f5cae50443f933e147a4de66455ab6` |
| pull_request Windows `13323751800` | `416cf5c16dfcbdb011ba7ce861867ab5244d05c6daf3aa4ac4af9929520d47d7` |
| pull_request Ubuntu `13323656674` | `becdac717ee5265a7d7d44f335c1401ab0407cbf5805d12be569f367bf1343e4` |

Tarball SHA-256 observed for both events: Windows `fec13ceb154797c551c96230455708b9523c0516927bd5fd8fc1f34c35c95d1c`; Ubuntu `3f35c881253ed9e651bce8c591d61fb11024495ac757d6612682a8d12930fc04`. Same-OS equality across these two events is an observation, not a reproducibility guarantee. Provenance on every artifact: `candidate true`, `worktreeDirty false`, `installOutsideCheckout true`, executable `braid`, `@exones/braid` 0.1.1, Node v26.13.0, npm 11.20.0, PowerShell 7.6.9, `released false`, registry publication not performed.

Push `sourceRevision` and `githubSha` are the delivery head, ref `refs/heads/t3/61a93ffc`, pull-request head field empty. Pull-request `sourceRevision` and `githubSha` are merge-test `de5d836637d60f3b53128ad6b55a2e6dece620bf`, ref `refs/pull/11/merge`, and `pullRequestHeadSha` is the delivery head. `gh api repos/exones/braid/git/commits/de5d836637d60f3b53128ad6b55a2e6dece620bf` shows ordered parents main `a2120bfa084a32212a780a0fdc095c38d8869ef5` and head `f6b136099889205545d3bfde2595f626a264efb2`. Job completion times match the supplied snapshot: push Windows 12:55:23Z, push Ubuntu 12:54:36Z, pull_request Windows 12:55:23Z, pull_request Ubuntu 12:54:44Z. After that proof, the pull request was still OPEN on the same head and base, with no reviews, review decision, or comments.

### Scenario traces

Authored checks only, not a fresh-agent trial. Implementation green while review is pending produces one outcome report and does not claim Done. A no-findings review and a findings review each become one translated coordinator account. A user-owned blocker names the partial work and the exact action. Ordinary CI waiting and duplicate notices stay short. Overlapping triggers become one report. A green unmerged prerequisite stops the dependent item. Resumption waits for the real merge commit. A new head or base needs new proof. Human and technical readers use the same pull-request account.

### Proposed shared status

Do not edit the coordinator epic or current checkpoint from here. Propose E in review, with this head and pull request as the candidate. Assign `E-reporting-and-merge-gates-review-001` after coordinator inspection. Leave D blocked until E's human merge. The worker checklist on the checked blob stays open so ticking it is not an evidence-only commit.

### Limits and next action

No fresh-agent adherence, measured speedup, restart durability, or exactly-once delivery is claimed. Artifacts can expire. The ignored `.tools/E-hosted/` proof is local only. No review, merge, release, or publication is claimed. Parent watch teardown is the parent's action after this handoff.

Exact next coordinator action: retain this unstaged supplement, record the green head, tear down the PR 11 watch, and assign the new independent review. This worker stops after E.
