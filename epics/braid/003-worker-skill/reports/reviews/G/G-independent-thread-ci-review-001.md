# G-independent-thread-ci-review-001: PR 13 candidate, hosted evidence and own-thread continuation

The delivery evidence for candidate `ccabae4df1f813317b8dd1247ea04878ee6ce023` is sound: all four frozen jobs passed, every artifact matches its digest and provenance, and the source mapping is correct. The spike's continuation question is not answered positively. The original worker never completed a run, and a replacement thread finished the proof from an explicit recovery snapshot. The committed reference and the worker report would let F consume a "same thread verifies and repairs" contract that this trial did not demonstrate. Findings F1 to F4 go to the coordinator for triage. This review is not a merge decision.

Parent: BRAID-003/G. Pass: 001 (no earlier G pass). Reviewer: independent review role, in T3 Code through the Cursor harness, model Claude Opus 5.5 (`claude-opus-5-5`). This is the coordinator's current model, used because the assigned Codex Sol High route had hit its usage limit.
Agent/assignment name: G-independent-thread-ci-review-001 ([assignment](../../../assignments/reviews/G/G-independent-thread-ci-review-001.md)).
Report/checkpoint: `epics/braid/003-worker-skill/reports/reviews/G/G-independent-thread-ci-review-001.md`, `epics/braid/003-worker-skill/checkpoints/reviews/G/G-independent-thread-ci-review-001.md`.
Candidate: `ccabae4df1f813317b8dd1247ea04878ee6ce023`. Base: `180f2e0b3cb6fc1a380a955e24a9580d0a4c85b8`. PR: https://github.com/exones/braid/pull/13, OPEN, head and base unchanged when re-read during this review.
Status: findings. Date: 2026-11-04.

## Scope and evidence

**Sources read.** AGENTS.md, the review conventions in `docs/agile-workflow.md`, `epics/report-format.md`, the review template, the [G criteria](../../../backlog/G-independent-thread-ci.md), the assignment, and the committed `validation/G/operator-reference.md` read from the candidate Git object. I also read the explicitly supplied final worker snapshots, which match the hashes supplied:

| Snapshot | SHA-256 (verified) |
| --- | --- |
| `C:\Users\exon\AppData\Local\Temp\braid-G-review-inputs-20261104213359\reports\G.md` | `BCB6ED1B922D2AFA815C200A00462F73C67CF4399F287B0BF00C41301007C4E3` |
| `C:\Users\exon\AppData\Local\Temp\braid-G-review-inputs-20261104213359\checkpoints\G.md` | `B0B5346C1DCC1638F13B1833B80B8374DEAC84B1772EA18AC01816164E33E468` |

**Candidate and source mapping, checked with Git.**

- The candidate's only parent is the base. `git diff --numstat` shows one added file, `epics/braid/003-worker-skill/validation/G/operator-reference.md`, with 175 lines. `git diff --check` passes, and the blob has no trailing whitespace.
- I fetched `refs/pull/13/merge`, which is `fe91513892f02aa72ba6588215362c7741e4451b`. Its parents, in order, are the base and then the candidate. It changes only the same file, and its tree equals the candidate's tree.
- `refs/pull/13/head` is the candidate, and `origin/epic/braid-003-worker-skill` is the base.
- `gh pr view 13` reports state OPEN, head `ccabae4…`, base `epic/braid-003-worker-skill` at `180f2e0…`, and `mergedAt` null.

**Links.** All nine relative links in the reference resolve at the candidate. The three anchors also resolve: `#3-independent-t3-workers-and-pr-waiting`, `#review-gates-and-indexing`, and `#human-merge-stop`.

**Hosted jobs, read from the GitHub API for each attempt.**

- Push run 41896581649, attempt 2: Ubuntu job `126830530443` and Windows job `126830530560`.
- Pull-request run 41896593015, attempt 1: Windows job `126807638492` and Ubuntu job `126807638760`.
- All four jobs concluded success with head `ccabae4…` and workflow `.github/workflows/ci.yml`. Steps 5 (Install dependencies), 6 (Verify) and 7 (Upload packed tarball) succeeded on each.
- Push attempt 1 Windows job `126807600244` stays failed: Verify failed and Upload was skipped. Push attempt 1 Ubuntu job `126807599716` succeeded, but its artifact is not part of the attempt-2 proof.
- GitHub records `exones` as the triggering actor of attempt 2, starting at 20:04:47Z.

**Logs.** I fetched attempt-specific logs from `actions/jobs/<id>/logs`. `gh run view --job` for the failed job returned the attempt-2 log, so I did not use it. SHA-256 of each downloaded log:

| Job | Log SHA-256 | Verify result |
| --- | --- | --- |
| `126830530443` | `4d50ecda6ef6487b94026a0e1f4dfa8a6968689574a01db9b1a7ead3e1110a2f` | build; tests 40, pass 40, fail 0, skipped 0; concurrent-add proof passed; `package-proof candidate True` |
| `126830530560` | `3131314db94c5f313141711b29f35696926d92fc4aeeea4ed2b5142f299a80af` | same |
| `126807638760` | `bdfa90b6d487b1f637b68f68b4613e393269a7bda333b62a1da0aa84ea12c83e` | same |
| `126807638492` | `5b606a18dfc5e793ad55293324d7a0531371332366fd588b3adee5e8ceb38c4e` | same |
| `126807600244` (failed) | `11edfc7033d9044c1bb385b3a1f7df28e38f0b1ff4c43fabb2c6305c9375d8bd` | tests 40/40 pass; `lock timeout 5533ms` is expected test output; then `package proof failed: concurrent adds failed … error: cannot write state`, exit 1 |

**Artifacts.** I hashed both the retained archives in `.tools/G-hosted/` and fresh re-downloads in `%TEMP%\braid-G-review-dl-20261104213601`. In all four cases the retained ZIP, the downloaded ZIP and the artifact service digest are equal. The tarball inside each ZIP equals both the provenance `digest` and the retained extracted `.tgz`.

| Artifact | ZIP SHA-256 | Tarball SHA-256 | Provenance source |
| --- | --- | --- | --- |
| push Ubuntu `13359641660` | `88a11012bde702d0e5cf2ebfc904db37414b52cc607d847815a022b9f45d91c8` | `b8a96b1baee9bad89259d05087e016f8889c94c8b0a6954d774e8835d4d880ec` | `sourceRevision`/`githubSha` = candidate, ref `refs/heads/item/braid-003-g-independent-thread-ci`, `pullRequestHeadSha` empty |
| push Windows `13359736544` | `6d6c8f366251d9cdc3e35eb28e49b11c1fb3a3147fe3e4aa8e27bf4f2bf95fd0` | `8c434113e62663591c23faebcf35aeb13162a130446fa8423de514d92538f92d` | same as push Ubuntu |
| PR Ubuntu `13355946835` | `fc64844cdd6293abb16d82616aaa93d3ee15b11d394248b17dcb6a66e803e48a` | `b8a96b1baee9bad89259d05087e016f8889c94c8b0a6954d774e8835d4d880ec` | `fe91513892f02aa72ba6588215362c7741e4451b`, ref `refs/pull/13/merge`, `pullRequestHeadSha` = candidate |
| PR Windows `13355987092` | `6ce14a1f55fedb61628ccbd00106fa33d5fe8815506735870a0728c7ca2dd82b` | `8c434113e62663591c23faebcf35aeb13162a130446fa8423de514d92538f92d` | same as PR Ubuntu |

These digests equal those in the worker report table. All four provenance records show `@exones/braid` 0.1.1 with `released` false, `registryPublication` `not performed`, `candidate` true, `worktreeDirty` false, `installOutsideCheckout` true, Node v26.13.0, npm 11.20.0 and pwsh 7.6.9.

**Continuation provenance, from the host thread record.** I read the original worker thread `mcp:launch:b4318dded53b10790c1cb711c5a4496141347271c88ddce9a5892d38485b3a80` read-only with `t3_thread_read`, covering two activity pages and its recent runs:

- Run ordinal 1 recorded `watch_pull_request` → `watching: true`, `wasWatching: false`, and that readiness generation 1 was queued as ordinal 2.
- The thread's runs, all on Cursor `grok-4.7`, in times UTC:

| Ordinal | Requested | Started | Ended | Status |
| --- | --- | --- | --- | --- |
| 1 | 19:17:50 | 19:18:05 | 19:37:58 | interrupted |
| 2 (readiness) | 19:24:45 | 19:38:00 | 19:51:36 | interrupted |
| 3 | 19:27:39 | never | 20:02:13 | cancelled |
| 4 | 20:05:20 | 20:05:20 | 20:07:41 | interrupted |
| 5 | 20:09:57 | 20:09:57 | 20:10:01 | interrupted |

- The thread status is interrupted, with no active run. None of its runs completed normally.

**Not done.**

- I did not rerun the full product Verify, because the candidate changes documentation only.
- I did not read the replacement thread's or the coordinator's activity. Coordinator delivery identities and the unwatch payload are taken from the snapshots.
- I did not exhaustively page the original thread beyond 200 items, so I did not see what triggered ordinals 3 to 5.
- No PR link, watch, push, rerun, or source change was made.

## Findings

### G-independent-thread-ci-review-001/F1: worker report presents a green handoff without the negative continuation result

- **Severity:** High.
- **File:** `epics/braid/003-worker-skill/reports/G.md` in the supplied snapshot, lines 1–3 (heading and lead), 13–15 (Why) and 19–25.
- **What happens:** The report opens "current-head proof is complete" and calls itself a green handoff. It does not state the spike's answer. Its Why section gives one cause for replacement: the prior thread was "interrupted", the success notice was "cancelled", and the watch was "already off". The host record shows more than that:
  - None of the original worker's five runs completed.
  - The registering turn (ordinal 1) kept running about ten minutes past its watch call, contrary to reference step 7 ("end the turn"). Then it was interrupted.
  - The queued readiness turn (ordinal 2) started only after that interruption, and it was interrupted too.
  - Ordinal 3, requested at 19:27:39Z after both PR jobs had produced artifacts, was cancelled before it started.
  - The failed push job was rerun by `exones` (the user account), not by the worker.
  - The assignment records repeated restarts within the same active run and the coordinator and user interruptions that were needed. None of this is in the report.
- **Effect:** A reader of the report or the PR, F included, sees a successful trial with a recovery footnote. The actual outcome was a negative or incomplete result on single-worker continuity, assisted by manual intervention.
- **Expected:** State plainly that the continuation question was answered negatively or incompletely on this run. List the run statuses and every manual intervention: the interruptions, the human-triggered rerun, the cancelled notification, and the replacement launch. Keep "green" scoped to current-head delivery evidence.

### G-independent-thread-ci-review-001/F2: committed reference offers F an unproven contract

- **Severity:** High.
- **File:** `epics/braid/003-worker-skill/validation/G/operator-reference.md` at the candidate, lines 158–168 ("What F can take from a green supplement").
- **What happens:** The section says that once the supplement records a registration, one snapshot or wake, current-head proof, teardown and a delivery identity, "F can treat this procedure as the observed top-level contract". Its bullets include "The item thread links, queues one readiness turn, watches, and yields" and "The same thread verifies and repairs".
- **Effect:** The supplements tick every one of those boxes, but across two different threads:
  - Registration and the snapshot happened on the original thread.
  - Proof and delivery happened on the replacement.
  - Teardown found the watch already gone.

  Taken literally, the gate admits a contract that was not observed. "Yields" was violated, and same-thread verification and repair never occurred.
- **Expected:** Before this reference is consumed, the coordinator should keep the historical blob and add a dated limitation through a scoped worker fix or the F intake. The limitation should say that the gate was not met by one thread. It should say which bullets were observed and which were not, and that F must not adopt the same-thread wake-to-completion contract from G.

### G-independent-thread-ci-review-001/F3: replacement thread showed the same in-run re-entry and sent three results

- **Severity:** Medium.
- **File:** `reports/G.md` snapshot lines 55–83, and `checkpoints/G.md` snapshot lines 53–89.
- **What happens:** The replacement thread's single run (ordinal 1) took in its launch prompt three more times after its final send. Each time it re-verified and sent another coordinator message for the same head: `g-final` (ordinal 78), `g-reconfirm` (ordinal 80) and `g-verify` (ordinal 81).
- **Effect:** The report describes this as "the launch prompt was entered again". It does not record it as the same in-run restart pattern that disqualified the original worker. Nor does it reconcile it with the reference's single-result claim at line 165, "receives one explicit result". The coordinator usage limit explains why the later sends were not acted on, but not why the run re-entered itself.
- **Expected:** Record this as a recurrence observed on the replacement thread. Make duplicate same-head results a named limit for F: delivery is not idempotent or single-shot, and the receiver must deduplicate by head.

### G-independent-thread-ci-review-001/F4: watch lifetime and teardown are unexplained and second-hand

- **Severity:** Medium.
- **File:** `reports/G.md` snapshot lines 15 and 35, and `checkpoints/G.md` line 25.
- **What happens:** The unwatch result `watching: false`, `wasWatching: false` means the subscription had already ended before teardown. Neither the report nor anything visible to me shows when or why it ended: host cancellation with ordinal 3, an interruption, or something else. The value is also cited from the replacement's launch prompt, not from a payload saved by the thread that called unwatch.
- **Effect:** Reference step 11 and criterion 4 treat teardown as evidence that ownership stopped. Here it only shows that nothing was left to stop. Watch survival across interruption and cancellation is therefore unknown, and F needs exactly that.
- **Expected:** Label teardown as "no active subscription at unwatch; termination cause and time unobserved". List watch lifetime across interrupt and cancel as an open host question for F.

No finding is raised against the CI and artifact evidence, the source mapping, the link targets, or the documentation scope and whitespace. The attempt-1 Windows `cannot write state` failure is honestly preserved. Its cause stays unidentified, and further investigation is deferred by the user unless the failure recurs.

## Acceptance assessment

**1. Binding: supported.**

- The candidate blob records the original thread's binding: attached, named root and branch, startup HEAD equal to the committed base, null parent, and the Cursor grok-4.7 high/500k profile.
- The replacement used the same attached Git branch. Its host branch metadata was null for `existing_worktree`. That is a metadata gap, not a detached-HEAD state, and I make no detached-HEAD claim.

**2. Registration and readiness: supported, narrowly.**

- Registration is confirmed directly in the original thread's host activity (`watching: true`).
- One reconciliation turn (ordinal 2) reached that worker and found attempt 1 red. It started only after the registering turn was interrupted (F1).
- No watch wake was observed to drive any completion. Ordinal 3 was cancelled. Both supplements label the final verification as an explicit recovery snapshot, not a watched event, and keep the event branch unobserved, as the criterion requires.

**3. Same worker verifies before GREEN: unsupported as written.**

- The verification content is correct. I independently confirmed all four jobs, steps 5 to 7, every artifact, the provenance, the source mapping and the final head, and stale or failed attempts were not counted.
- It was not performed by the same worker. The original thread never verified a finished head. A user-authorized replacement did (F1).

**4. Explicit delivery to the coordinator: supported, with limits.**

- The snapshots record explicit `t3_thread_send` deliveries with message, run and link identities.
- The report says ordinal 78 accepted the handoff and started this review. I did not inspect the coordinator thread to confirm that.
- There was no per-CI-event parent relay and no assumed child-completion wake. Restart durability is not claimed.
- Limits: the deliveries came from the replacement, not the original worker; there were three same-head sends (F3); and teardown evidence is weak (F4).

**5. Answers the spike and unblocks F, or names an exact blocker: unsupported.**

- Neither outcome is met. The trial did not observe the full contract on one thread, and the supplements do not record a blocker that keeps F unready. Instead, the committed reference offers F the full contract (F2).
- Under the criterion, F should not take the continuation contract as proven.
- F can safely take these, all observed:
  - `t3_thread_launch` binding to a named existing worktree, including the null-metadata case.
  - `link_pull_request` and `watch_pull_request` registration payload shapes, including that a missing field is not success.
  - One queued reconciliation snapshot to cover checks that finished before registration.
  - The frozen four-job artifact and provenance verification recipe.
  - Explicit `t3_thread_send(mode: auto)` delivery with identities, where acceptance means delivery, not that the coordinator read it.
  - Explicit-recovery-snapshot labelling.
- F must not take these, unobserved or contradicted:
  - A single item thread going from watch wake to verification, repair and completion.
  - A watch surviving interruption or cancellation.
  - Exactly one result per head.
  - Unassisted handling of a failed check.

  Review and the human item-to-epic merge are still required either way.

## Triage and gate

Coordinator to record: fixed, refuted or deferred for each finding, with revisions. F2 touches committed content, so a fix would make a new head and require new hosted proof. Recording it as a deferral with an explicit F intake limit is an alternative for the coordinator to choose. This file is not a GitHub approval and not a merge decision.

## Resume

- Next action: the coordinator triages F1 to F4. It records G's continuation result as negative or incomplete for single-worker continuity. It decides whether F stays unready or proceeds only with the safe subset above, and that decision may be the user's. The human item-to-epic merge of PR 13 remains a separate stop.
- Output root: `c:\worktrees\agento\t3-fc55576d`, branch `t3/fc55576d`, HEAD `6064cc254ef705905eac7f0c3164d3d22d8176b8`. Outputs are uncommitted, and the index is empty.
- Proposed shared status: G review 001 complete with findings (two High, two Medium) at candidate `ccabae4…`. Delivery evidence passes. Spike continuation criteria 3 and 5 are unsupported. Not Done, not merged.
