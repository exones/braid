# G-independent-thread-ci-review-002: recheck of the negative-result fix

Commit `9b043f0fadc381d2dfa173fe28d7fdfb4f76c920` resolves review 001 findings F1 to F4. The operator reference no longer offers F the unobserved same-thread, watch-wake, one-result, or unassisted-repair contracts, and the negative partial result is stated in the committed report. No new finding. This review is not a merge decision.

Parent: BRAID-003/G. Pass: 002. Reviewer: independent review role, in T3 Code through the Cursor harness, model Grok 4.7 (`grok-4.7`).
Agent/assignment name: G-independent-thread-ci-review-002.
Report/checkpoint: `epics/braid/003-worker-skill/reports/reviews/G/G-independent-thread-ci-review-002.md`, `epics/braid/003-worker-skill/checkpoints/reviews/G/G-independent-thread-ci-review-002.md`.
Candidate: `9b043f0fadc381d2dfa173fe28d7fdfb4f76c920`. Parent: `ccabae4df1f813317b8dd1247ea04878ee6ce023`. Base: `180f2e0b3cb6fc1a380a955e24a9580d0a4c85b8`. PR: https://github.com/exones/braid/pull/13, OPEN, `mergedAt` null, head and base unchanged when re-read during this review.
Prior pass: `epics/braid/003-worker-skill/reports/reviews/G/G-independent-thread-ci-review-001.md` at `ccabae4df1f813317b8dd1247ea04878ee6ce023`.
Status: no-findings. Date: 2026-11-04.

## Scope and evidence

Recheck only. Confirm that `9b043f0` closes F1 to F4, that the reference does not let F adopt the four unproven contracts, that the negative result is plain, that the diff adds no new overclaim, that links and anchors resolve, and that `git diff --check` is clean. Spot-check the new head's four hosted jobs. Do not re-decide review 001's artifact proof for `ccabae4`.

**Sources read.** Review conventions in [docs/agile-workflow.md](../../../../../../docs/agile-workflow.md#review-gates-and-indexing), [report format](../../../../../../epics/report-format.md), the review template, review 001, and the three blobs at `9b043f0` named below. The item worktree was not read or modified.

**Diff, from Git objects.** `9b043f0` has one parent, `ccabae4`. `git diff --numstat ccabae4 9b043f0` is three files, 169 insertions and 8 deletions:

- `epics/braid/003-worker-skill/reports/G.md` added, 89 lines
- `epics/braid/003-worker-skill/checkpoints/G.md` added, 61 lines
- `epics/braid/003-worker-skill/validation/G/operator-reference.md` modified, 19 insertions and 8 deletions

`git diff --check ccabae4 9b043f0` exited 0 with no output.

**Merge-test.** `723d6b3b54f5de069989cce0d9563fe3e0dcbbb7` has parents `180f2e0b3cb6fc1a380a955e24a9580d0a4c85b8` then `9b043f0fadc381d2dfa173fe28d7fdfb4f76c920`. Its tree equals the candidate tree `40d9c3386a3b95433aafae70c90dcf1793c08195`. `gh api repos/exones/braid/pulls/13` reports that same `merge_commit_sha`, the same head, and the same base.

**Links at `9b043f0`.** Every relative link in the three changed files resolves to a blob in that commit. The anchors resolve: `#frozen-hosted-proof`, `#3-independent-t3-workers-and-pr-waiting`, `#review-gates-and-indexing`, and `#human-merge-stop`. The historical Actions URLs in the report and checkpoint are the run ids review 001 already accepted. They were not fetched again.

**Hosted jobs at this head, from `gh run view --json jobs`.** Both runs are workflow CI, attempt 1, conclusion success, `headSha` `9b043f0fadc381d2dfa173fe28d7fdfb4f76c920`. Each run has the Ubuntu job and the Windows job, and no other job. Install dependencies, Verify, and Upload packed tarball succeeded on all four.

| Run | Event | Job | Result |
| --- | --- | --- | --- |
| [41909573028](https://github.com/exones/braid/actions/runs/41909573028) | push | verify (ubuntu-latest) `126853232354` | success |
| 41909573028 | push | verify (windows-latest) `126853231613` | success |
| [41909584011](https://github.com/exones/braid/actions/runs/41909584011) | pull_request | verify (ubuntu-latest) `126853267579` | success |
| 41909584011 | pull_request | verify (windows-latest) `126853268037` | success |

Artifacts were not re-downloaded. The job records show nothing that would require it.

**Not done.** Host threads were not re-read. Review 001's log and artifact hashes were not recomputed. Product Verify was not rerun. No push, link, watch, subagent, or merge.

## Findings

No actionable findings.

Review 001 findings, checked against `9b043f0`:

### G-independent-thread-ci-review-001/F1: resolved

`reports/G.md` lines 1–3 open with a negative partial result. The same file records the five original run statuses, the interruption after registration, ordinal 2 starting only after that interruption, ordinal 3 cancelled before start, the user-account rerun of the failed push job, and the coordinator-launched replacement. "Green" is limited to delivery evidence for `ccabae4` and is stated not to answer the continuation question. The blob says hosted proof of `9b043f0` is outside the blob.

### G-independent-thread-ci-review-001/F2: resolved

`validation/G/operator-reference.md` lines 158–179 replace "What F can take from a green supplement". The section says the continuation result is negative, that the procedure is the attempt and not a proven same-thread contract, and lists only the observed subset for adoption: worktree binding, the watch registration payload, one catch-up readiness snapshot, the CI and artifact recipe, and explicit message delivery. Lines 172–175 forbid same-thread watch-wake completion, a watch surviving interruption, one result per head, and unassisted repair. Lines 177–179 require duplicate deduplication by head and explicit-snapshot recovery, and they keep review 001 and the human merge as gates. The parent commit still holds the previous wording.

### G-independent-thread-ci-review-001/F3: resolved

`reports/G.md` lines 40–52 record the replacement's in-run re-entry and name the limit: delivery is not one result per head, and the coordinator must deduplicate by head. The Why section states that delivery is not idempotent and not single-shot. The reference repeats that limit at lines 174 and 177. The checkpoint records the same limit.

### G-independent-thread-ci-review-001/F4: resolved

`reports/G.md` line 56 uses the expected label: no active subscription at unwatch; termination cause and time unobserved. It says the payload is second-hand, that this replacement did not call `unwatch_pull_request`, and that watch lifetime across interruption and cancellation is an open host question for F. The reference line 173 and the checkpoint say the same.

## Acceptance assessment

The trial facts from review 001 are unchanged. This pass checks whether the new blobs say those facts.

| Criterion | Verdict at `9b043f0` |
| --- | --- |
| 1. Binding | Supported, as in review 001. The reference line 164 still records binding, including empty replacement branch metadata. |
| 2. Registration and readiness | Supported, narrowly. Registration and one catch-up snapshot are adopted. The snapshot is labeled not a watch wake. |
| 3. Same worker verifies before green | Unsupported as a same-thread fact. The blobs now say the replacement verified `ccabae4` from an explicit recovery snapshot. The four new-head jobs succeeded. Their archives were not re-hashed. |
| 4. Explicit delivery | Supported, with the limits now written down: replacement delivery, more than one result for the head, and second-hand teardown. |
| 5. Spike answer | Met as a negative partial answer. The reference states the blocker and blocks the four unproven contracts. It does not prove same-thread watch completion. Human item-to-epic merge is still required. |

## Triage and gate

F1, F2, F3, and F4 are resolved at `9b043f0fadc381d2dfa173fe28d7fdfb4f76c920`. No new finding is offered for triage. This file is not a GitHub approval and not a merge decision.

## Resume

- Next action: the coordinator records this pass. F stays limited to the observed subset in the operator reference. The human merge of https://github.com/exones/braid/pull/13 remains a separate stop.
- Output root: `C:\worktrees\agento\t3-74d6f2fb`. Branch `t3/74d6f2fb`. HEAD `6064cc254ef705905eac7f0c3164d3d22d8176b8`. The two output files are uncommitted.
- Limits: host activity was not re-read, so the added `g-recheck` identity at coordinator ordinal 84 (`reports/G.md` line 48 and `checkpoints/G.md` line 26) was not independently confirmed. Review 001 had already established three same-head sends, so the duplicate-result limit does not depend on that fourth identity. `operator-reference.md` line 5 still says the supplements are written after this head exists, and lines 149–156 still say several rows were unobserved at authoring, while this commit contains the supplements. Line 160's negative sentence includes "bind" in the failed conjunction; line 164 then lists binding as observed. Neither leftover sentence offers the four forbidden contracts, so neither is raised. Artifact bytes for runs 41909573028 and 41909584011 were not hashed. Job logs were not downloaded, so the runner checkout line was not compared with `723d6b3`; the pull request's current `merge_commit_sha` is that object, and its parents and tree were checked.
- Proposed shared status: G review 002 complete with no findings at `9b043f0`. F1 to F4 resolved. Delivery jobs for this head succeeded. Not Done, not merged.
