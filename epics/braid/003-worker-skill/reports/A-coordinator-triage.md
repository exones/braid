# A coordinator triage: child-watch restriction and parent relay evidence

Date: 2026-11-03. Status: A blocked on positive live proof; no delivery acceptance.
Parent plan/source head: `6dee471c3c0ac6574e153dcbfb39e428d8e9b9c5`.

## Inspected worker result

Read the actual report/checkpoint at `C:\worktrees\agento\t3-85fcb290\epics\braid\003-worker-skill\reports\A.md` and `checkpoints\A.md`, inspected the worker's Git status/HEAD/index, and read its completed task/thread result after the completion notification. Only those two output files are untracked, HEAD is the assigned plan commit, and the index is empty. No commit, A PR, push, live trial, hosted A checks, or independent review occurred. The terminal task status is completed research, not completed delivery of item A.

Original task: `node:delegated-task:command%3Amcp%3A6a76856b-4898-4ba9-92d2-b31e7ce196ed%3Adelegate-task%3Abraid-003-a-worker-ci-wait-sol-high`.

Worker: <t3-thread://v2/c361f221-e595-46eb-8f4b-7926ea55f19c/thread:delegated-task:command%3Amcp%3A6a76856b-4898-4ba9-92d2-b31e7ce196ed%3Adelegate-task%3Abraid-003-a-worker-ci-wait-sol-high>

## Findings accepted and limits

- Direct child PR watching is forbidden by current host instructions and absent from the inspected child surface. Preserve this restriction.
- Thread-run waits, Claude-only background wait, and generic capability flags are not demonstrated Codex CI waits. No workaround or policy waiver is accepted.
- A has not demonstrated its required worker-owned pending/failure/repair/new-head-green lifecycle. Keep it blocked and B/C/D backlog/unready.
- The report's parent-relay discussion is an unproven candidate, not a demonstrated impossibility. Do not require a host modification merely because parent-side evidence was unavailable inside the child.

## Parent-side evidence now supplied

1. This parent registered `watch_pull_request` for plan PR #6. The response returned `watching: true`; the watch description promises wakes on failed/passed checks and says watches persist across pushes. The parent then ended its turn as required.
2. A later host notification reached this thread: all two checks passed on `6dee471`, identifying PR #6 and its URL. Independent `gh pr view` confirmed successful Windows/Ubuntu jobs for both configured triggers: runs `41732187164` (PR) and `41732178178` (push). These are plan checks, not A trial proof.
3. The parent's informational `t3_thread_send(mode: steer)` returned `delivery: steered` into A's original run. The worker's readback/checkpoint acknowledges that update, so delivery into the active worker thread is observed. That message was a PR status observation, not the full A CI-event/repair trial.
4. Host `t3_thread_send` explicitly documents that sending to a finished child starts a fresh task and returns its taskId. The approved A scope permits investigating whether the original task survives **or a fresh task is explicitly linked to the same assignment**. Original task-ID preservation is not an additional user acceptance standard.

These facts establish separate event/messaging components, not a complete tested relay. A positive result still needs the owned trial PR, a nonterminal waiting checkpoint, actual CI notification forwarded to the owning worker, same-worker repair, a new pushed head, and successful declared current-head checks verified by that worker. Cancellation/restart/durability beyond what is observed must remain limited. If the continuation task ID changes, preserve explicit lineage under stable item A and the same worker thread/worktree; do not relabel a finished task as still running.

## Scoped follow-up to the worker

Supply the parent facts above and request an addendum to A's owned report/checkpoint that distinguishes direct-watch unsupported, parent relay plausible/documented components, and full lifecycle unproven. Prepare a finite trial protocol using only those supported calls, with the exact ownership and task-lineage boundary, or identify a specific remaining contract contradiction. This is continuation/scoped correction of the same research item, not an independent review.

No live PR, product edit, polling, watcher script, provider change, or successor is authorized by this follow-up. The implementation slot remains unavailable according to the latest separate-epic checkpoint; that is a separate resource blocker and was not re-polled. Once the coordinator has an available slot, the approved single controlled trial can test the candidate. Do not request new host functionality unless the concrete protocol actually needs it.

## Evidence and delivery state

The worker outputs remain in their owned worktree, uncommitted. This triage and shared status are coordinator-owned local records, not an independent review, gate pass, or PR handoff. Plan PR #6 was rechecked and remains OPEN with null merge timestamp/SHA despite the user's earlier merge report. Its passing checks cannot satisfy A's live proof or independent review.

Next: receive the scoped A addendum/protocol, then reconcile the implementation slot before any trial. Keep acceptance unchanged and do not start B/C/D.

## Follow-up: corrected protocol and trial authorization

Inspected the actual amended report/checkpoint after continuation completion. The worker corrects its initial conclusion: parent relay is viable under exposed contracts; no new feature or original-task survival is required. The full lifecycle remains unproved. The finite queue/watch/readiness protocol, failure/later-push relay, same-worker repair, current-head verification and teardown are retained as prospective steps.

Latest epic 002 checkpoint explicitly records its implementation worker completed, with candidate `625d2557` and passing hosted CI; its next work is independent review. The implementation slot is therefore free for A, without touching the release candidate/reviewer. The coordinator authorizes the one [trial packet](A-trial-assignment.md), including a single disposable canary failure and worker repair, followed by predetermined cleanup only after successful repaired-head proof. B/C/D remain unready until positive A evidence is inspected.

## Usage-limit recovery, 2026-11-04

The trial task ordinal 3 failed on a usage limit after useful mutations completed. On the user's continue request, inspected actual worker state before attempting a restart: H0 commit `0ead4f37f3d109269aefe0d55d0f3f7ab336eea5` exists locally/remotely on `t3/85fcb290`, worker tree was clean, and [PR #8](https://github.com/exones/braid/pull/8) already exists against main. Both Windows/Ubuntu jobs succeeded in push run `41735141751` and PR run `41735151328`. The older checkpoint still described pre-create actions; those must not be replayed. Worker thread ordinal 4 was already running with Sol High, so no duplicate worker or substitute provider was started.

This provides concrete interrupted-action reconciliation evidence: preserve the committed/pushed PR and continue from relay arming rather than repeating implementation. It does not prove automatic restart durability or the failure/repair lifecycle. Parent supplied observed H0 state to the active worker and begins the one-time queue/watch/reconciliation handshake. No Hf push until confirmed watch readiness, no parent product repair, no acceptance of A yet.

## Observed readiness handshake, PR8-ARM-001

The parent queued exactly one reconciliation turn before registering its watch for PR #8, then ended the registration turn. The queued turn retrieved the actual saved response (`watching: true`, `wasWatching: false`) and took one post-registration GitHub snapshot. It confirmed the unchanged H0 `0ead4f37f3d109269aefe0d55d0f3f7ab336eea5` and successful Windows/Ubuntu push/PR checks, which had completed before registration. Parent relayed READY to the existing A worker using the generation-specific message. This observes the finite queue/watch/reconcile/relay handshake and pre-registration completion reconciliation; it does not prove failure-event or later-push transport yet.

Hf is now authorized under the frozen single-failure budget. Worker must checkpoint/yield after its deliberate failing push and await the actual parent failure-event relay before repairing. Parent keeps the same watch, deduplicates delayed readiness/results, and does not change worker files or claim A accepted. Exact delivery/run/task identity is retained in the coordinator checkpoint.

The parent subsequently received a real watched-PR notification for A's PR #8: all two checks passed on baseline `0ead4f3`. One event-driven snapshot confirmed the actual PR head was still H0 with the same four successful push/PR jobs. This was deduplicated against READY's known baseline proof; no extra worker turn/arming or repair was triggered. It observes baseline CI-to-parent delivery for the owned trial PR, without claiming generic event replay, controlled failure receipt, subsequent-head repair, or complete lifecycle acceptance. The watch remains active for the next genuine transition.

## Observed controlled failure transport

The same watch delivered a real failed Ubuntu-check event on Hf `602f8918b6188c43d91f6236f3ed70590f280fcb`. One event-driven reconciliation confirmed PR #8 still at that head, PR run `41787761322` Ubuntu job `126433728421` failed Verify and skipped upload; same-head push run `41787755919` Ubuntu job `126433711293` also failed. Windows jobs were still running at inspection. Parent forwarded the actual event and exact head/run/job identities once to the same worker, retaining parent transport and worker diagnosis/repair ownership. The parent changed no worker files and made no green/handoff claim.

This observes failure-event delivery across the H0->Hf push under the existing subscription. H2 repair/current-head green, H3 cleanup/final proof, and parent teardown remain outstanding. Later old-Hf trigger/job events are deduplicated rather than triggering additional repair turns.

The later Windows notification for that same Hf and PR run was inspected: Windows job `126433728679` also failed Verify, and the PR run completed failure. Actual PR head still matched Hf. Recorded the additional job outcome under the existing failure generation without another worker message/repair turn, demonstrating parent event deduplication while repair ownership remains with the worker.

## Observed same-worker repair and H2 reconciliation

Worker returned WAITING_H2_CI after independently diagnosing the failed log and pushing repair `2916951832f8b8d32565ea91ccb8b9fee86a627e`. The coordinator inspected the actual report/checkpoint and commit: only BAD->GOOD control changed, the canary stayed enabled, and full local Verify passed with 41 tests. On the new-head waiting return, one permitted reconciliation observed actual PR H2 and four successful jobs in runs `41788283965` and `41788279080`. Parent relayed those observations to the same worker for independent step/upload/artifact/provenance verification; this was a check snapshot, not a newly observed watch notification.

The worker retains H3 cleanup/finalization and final-head verification. No temporary entrypoint may be removed before verified H2 repair success; no existing product tests may be removed. Parent has not accepted A, repaired the fixture, cleaned worker files, or started B/C/D. Exact continuation/task lineage and dedup generation are recorded in the coordinator checkpoint.

The existing watch later delivered the actual H2 success notification (`All 2 checks passed on 2916951`). One event-driven snapshot confirmed unchanged H2 and the same four successful jobs. This adds observed later-push success-event delivery under the persistent watch, separate from the earlier reconciliation; it was action-deduplicated rather than triggering a second cleanup turn. Additional provenance will be supplied at the next necessary worker relay, avoiding a context turn solely for duplicate green state.

## H3 success transport and pending final worker handoff

The same watch delivered actual success on H3 `c86bc3990a63a5b18d582782e54f9a3cffa18928`; one event-driven snapshot confirmed that actual PR head and four successful jobs in runs `41789153808` and `41789149321`. Worker WAITING_H3_CI and actual checkpoint confirm H2 was independently verified before the planned archival cleanup, with original 40 product tests/full local Verify passing. Parent relayed the H3 event/check identities and the additional actual H2 event provenance once to the same worker. It has not assumed worker artifact verification or accepted the item.

Final worker current-head/job/upload/artifact/provenance confirmation, parent teardown, and exact-revision independent review remain outstanding. No new trial or extra evidence-only push is requested. The parent still owns event transport only, preserving same-worker repair/final delivery ownership.

## Green handoff inspected and parent teardown complete

The worker returned its final GREEN handoff at exact H3 `c86bc3990a63a5b18d582782e54f9a3cffa18928`. The coordinator inspected actual local post-push report/checkpoint, worker status/index, net candidate paths, and current PR/head/check conclusions. H3 has four successful declared jobs, and worker evidence records Verify/upload steps, downloaded artifacts and source/PR provenance. Candidate scope versus pinned plan is exactly five owned evidence/archive paths, no net product/test/policy change. The post-push supplements are explicitly uncommitted and fingerprinted in the current checkpoint; they do not masquerade as checked candidate blobs.

The parent then called `unwatch_pull_request` for #8; actual response was `wasWatching: true`, `watching: false`. This observes final relay teardown after worker green handoff. The full bounded trial is ready for independent review, not Done/merged. Assign fresh `A-worker-ci-wait-review-001` at exact H3 with the supplements identified and no new proof claim for arbitrary restart durability or another provider. The author is stopped; no further cleanup, mutation or repeat experiment is needed.
