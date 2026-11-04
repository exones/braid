# A single controlled CI-relay trial assignment

Date: 2026-11-03. Authorized within the approved BRAID-003/A scope.
Coordinator-owned packet; worker retains implementation/repair/delivery ownership.

## Readiness and correction

Inspected A's amended report/checkpoint and completed continuation. Parent relay is viable under the exposed watch/send contracts; the initial demand for a new host feature is superseded. Components have been observed, but no A lifecycle proof exists yet.

The latest epic 002 checkpoint explicitly says its implementation worker completed and its exact candidate `625d2557` has passed CI; only independent review/merge/release decisions remain. That frees the implementation slot for A. This does not authorize controlling that PR/reviewer or changing its files. One A trial worker now occupies the slot; no B/C/D implementation starts concurrently.

## Worker and Git boundaries

- Same worker thread, Sol High, `C:\worktrees\agento\t3-85fcb290`, branch `t3/85fcb290`, current HEAD `6dee471c3c0ac6574e153dcbfb39e428d8e9b9c5`.
- Preserve existing untracked A report/checkpoint; verify actual state before acting. Keep the generated branch and owned checkout. No worktree creation, reset/clean, rebase/force-push, profile changes, or shared-parent index changes.
- Push explicitly to the owned branch; create one PR against main. Plan PR #6 is separate, not yet verified merged. A's branch contains the plan commit; state that branch ordering honestly instead of assuming it merged. Do not merge either PR.
- Parent owns relay watch and coordinator status; worker owns A report/checkpoint and authorized trial assets. The worker never calls a PR-watch tool.

## Allowed disposable assets and finite sequence

Only add the minimum isolated test/control needed to make a real CI failure, for example `test/worker-ci-relay.test.mjs` and `epics/braid/003-worker-skill/validation/A-ci-relay/control.json`. The test must only read its own deterministic fixture and use Node's test/assert APIs. It must not alter product behavior, dependencies, existing tests/scripts/workflows, account/release configuration, network behavior, or secrets. Verify that the existing test runner actually discovers it.

Use one PR and these bounded candidate stages:

1. **H0, ready fixture:** record the research/protocol plus a passing disposable canary. Demonstrate locally that the canary fails only for the injected bad control and passes when restored. Run the relevant local/full Verify gate on the passing baseline; commit/push/open/link the PR. Report PR/head and waiting state, explicitly nonterminal. Do not inject the failing commit until the parent relays confirmed subscription readiness.
2. **Hf, controlled failure:** after readiness, change only the disposable control to the known failing value, reproduce the expected local canary failure, document this intentional negative-control exception, commit/push/link to the same PR, and checkpoint/yield. This single deliberate failing push is explicitly authorized to test the gate; it is not deliverable or eligible for merge/handoff. Existing acceptance checks are not weakened.
3. **H2, worker repair:** after parent forwards the failure event, the worker independently checks current PR/head and actual failed job/step logs, identifies its canary failure, restores the control, runs relevant local checks and pushes/links. Keep the canary enabled through actual successful current-head Windows/Ubuntu CI. This proves repair rather than deleting a failing test to pass.
4. **H3, final cleanup/evidence:** only after H2's verified green repair, archive the repaired fixture/test as bounded reproducible trial evidence under `validation/A-ci-relay/` (outside automatic product test discovery), remove the temporary entrypoint from `test/`, and finalize owned reports/evidence. This predetermined cleanup is not removal of a failing product test. No existing test is removed. Push/link, wait for all declared H3 checks, and perform the final worker verification/handoff. Avoid a new evidence-only commit merely to embed its own SHA; the final handoff records the actual head/run evidence.

Budget: one deliberate failure and one repair; at most the four planned candidate stages, plus at most one justified corrective push for an unforeseen in-scope fixture/report problem. A real infrastructure/permission/unrelated failure or persistent unexpected problem produces a precise owned blocker; no blind retries, acceptance relaxation, extra trial PR, or successor. Do not claim failed-event proof unless an actual failed-check notification reaches the parent after its watch is ready.

## Relay handshake and acceptance checks

At H0's waiting return the parent queues one arming-reconciliation turn in its existing thread, then registers the PR watch and immediately ends that turn. The queued turn verifies the actual registration result, snapshots PR/head/checks once, and relays readiness. This closes the pre-registration completion window without assuming initial event replay. The worker does not push Hf until that message. If queue/readiness ordering fails, preserve a transport blocker instead of polling or silently skipping the observation.

Parent transports notifications/current head/run references through messages to the same owning worker. A completed run can resume as a fresh task under stable A/thread/worktree ownership; record old/new task lineage. The parent neither repairs nor accepts a red worker PR. A waiting update is not successful delivery.

Freeze the check set for every candidate head: both configured `push` and `pull_request` CI runs, each with successful `verify (windows-latest)` and `verify (ubuntu-latest)` jobs through successful packed-tarball upload. Record event/run/attempt/job/head identities and reconcile PR merge-test checkout/provenance with the actual PR head. Missing/skipped/cancelled/neutral/failed jobs, failed uploads, inaccessible proof, or stale-head success cannot count as current-head green. Empty branch-protection requirements do not remove declared jobs.

Worker independently inspects actual head/checks/logs on each event and reconfirms head before handoff. No repeated pending-status loop or child watch. A single event/head-change reconciliation handles missed events; do not requeue snapshots for an unchanged pending head. Parent stops its watch after verified final worker handoff or a stopped blocker with no remaining live transport work, before user handback. No crash/restart/durable delivery guarantees beyond observed behavior.

## Evidence and stop boundary

Record initial readiness, failed event, worker diagnosis/fix, later-push event continuity, H2 repair success, H3 cleanup success, old/new task lineage, final head/run/upload identities, and parent teardown. Distinguish plan-PR component evidence from this live A trial. Worker checkpoints remain actionable through yields; the parent's coordinator checkpoint records relay operations and task IDs.

This is execution of A, not acceptance of A. Its final candidate still needs independent review and human-approved merge. The coordinator will inspect the actual result, triage findings and schedule the parent-scoped review separately. No worker-launched reviewer or B/C/D work. No merge, publish, deploy, release variable, registry/account write, secret request, or change to the other epic is authorized.
