# T3 parent relay for worker-owned CI

Read before waiting for a worker-created PR in T3. The accepted [continuation evidence](../../../../epics/braid/003-worker-skill/reports/A-acceptance.md) supports one bounded parent-relay lifecycle; it is not a universal host guarantee. Check current host contracts. [Delegation mechanics](../../braid-coordinate/references/delegation.md) belong to the parent; the worker does not invoke delegation.

## Roles and finite readiness

The parent alone registers/transports PR-watch events and records task lineage/teardown. The same assigned worker/item/thread/worktree retains diagnosis, repair, verification and green handoff. A fresh task ID in the same worker thread is allowed with explicit old-to-new lineage; do not call a completed task running. Follow the host's returned `next` at every transition.

1. Worker passes local gates, commits/pushes, creates/links its PR, checkpoints full head/check set and returns a **nonterminal waiting update**. Parent completion wake is the transport-start boundary, not successful delivery.
2. Before registration, parent queues exactly one readiness reconciliation in its own existing thread with `t3_thread_send(mode: 'queue')`, keyed to PR/registration generation. Parent then calls `watch_pull_request` and **immediately ends that turn**. No post-watch read/send in that turn. Failed queue/registration is a transport blocker; no readiness claim.
3. The queued parent turn confirms the actual watch result (`watching: true`), takes one post-registration PR/head/run/check snapshot and relays readiness/observations to this worker. This closes completed-before-registration and registration-race windows without assuming event replay. If pending, await real watch events; never repeatedly snapshot or self-queue for the unchanged pending head. Missing queued delivery/readiness requires explicit recovery, not a timeout loop.
4. On real failure/success notifications, parent transports the actual notification plus PR/full head, run/attempt/job/log references and intended continuation via the supported thread-send mode. It records returned delivery/task/run identities, including fresh-task lineage. It does not repair source or declare worker checks accepted.
5. If a new head completed while a worker waiting turn was ending, one reconciliation tied to that **new-head waiting update** may cover the missed window. Label it a snapshot, not a watched event; do not requeue for the same pending head. Deduplicate races by PR/head/run/attempt/event identity. A delayed notification for an old head is history, never proof for the new head.

Do not inject deliberate failures unless separately authorized as a bounded trial. Ordinary delivery needs no canary or repeat trial. No child watch, periodic polling, scheduled/background watcher, original-task-survival requirement or provider substitution.

## Worker continuation and green handoff

Treat any parent notification as a wake hint. Independently reconcile current PR/head and the frozen check set, including configured events/jobs/uploads beyond branch protection's minimum. Pending checks retain ownership/waiting; missing/inaccessible or non-success conclusions require diagnosis and a precise nonterminal blocker when no authorized repair is available.

For failure, read exact run/attempt/job/step logs before repair; fix only in-scope causes without weakening gates. Pass relevant local checks, push/link the same PR and checkpoint/yield for new-head proof. The persistent parent watch can transport later-push events without re-registering solely for a push. Reject stale/duplicate results, then verify every declared current-head job, step/upload and required artifact/source mapping. Reconfirm head before successful return. A later evidence commit needs its own proof.

After verified green worker handoff, parent tears down its watch before parent handback and records the actual response. For a blocker with no live transport work remaining, parent records teardown and explicit re-arm responsibility for later continuation. Registration's required immediate yield is a waiting boundary, not final handback. Parent never calls a failed/pending PR delivered or takes over worker repairs as acceptance.

## Interrupted transport or host restart

Read checkpoint/current assignment and inspect actual checkout/index/HEAD, PR/runs, process/task and parent subscription/lineage state once before retrying interrupted effects. Reuse completed push/PR actions. Have the parent reconcile/re-arm only as required using the finite readiness handshake. If the supported route or actual readiness cannot be established, report exact host/coordinator owner/action/impact and remain blocked/owned; request a supported mechanism rather than inventing a direct CI wait.

Observed thread continuation and a bounded relay do not prove arbitrary restart recovery, durable/exactly-once messages, automatic watch reattachment, every missed-window case, or cross-provider behavior. No process/subscription is assumed alive after restart; files enable manual reconciliation, not automatic durability.

## Stalled yield recovery

Apply the worker skill's blocker trigger only to naturally observed repeated yields with the same host run still active and its intended continuation queued. Assistant prose saying finished is not authoritative run completion; ordinary pending CI alone does not meet this condition. Do not add timers, poll run/queue state, repeatedly rewrite unchanged status or self-queue further readiness generations.

Preserve checkpoint, PR/full head, watch/registration generation and exact active/queued run/message/event identities. Send one explicit blocker to the coordinator through the supported return channel, record the delivery identity and stop ordinary execution under host rules. The coordinator may reconcile and use supported interruption at a safe boundary within its authority; this grants no automatic self-restart, provider substitution, queue deletion or repair takeover. Before continuation require actual recovery facts and explicit old-to-new run lineage, reconcile preserved effects, and retain every acceptance gate. An intervention demonstrates that intervention, not a known host root cause or unassisted recovery.
