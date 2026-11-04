# T3 continuation for worker-owned CI

Read this before a T3 item thread waits on a pull request it created. The normal route is a top-level thread bound to a named item worktree. Delegated children never watch. The [legacy parent relay](#legacy-parent-relay-for-delegated-children) is that child's historical route, and only when the packet explicitly selects it. If the top-level route fails, report the host blocker. Do not fall back to the relay.

Evidence and limits are the adopted subset in [What F can take from this trial](../../../../epics/braid/003-worker-skill/validation/G/operator-reference.md#what-f-can-take-from-this-trial). Workspace and branch rules are [Workspaces](../../braid-coordinate/references/delivery.md#workspaces) and [Epic and item branches](../../braid-coordinate/references/delivery.md#epic-and-item-branches).

## Top-level item thread

`t3_thread_launch` with a workspace strategy binds a top-level thread to a named item worktree and branch. `delegate_task` has no branch field, and its child must not watch. `create_threads` inherits a checkout and is not the isolated item route. A top-level thread requires an explicit user-authorized thread assignment. It is not a renamed child.

The launch prompt stays short and step-explicit. A long resume-oriented prompt can restart inside one run and send the result again. Name the steps. Do not paste a resume narrative into the prompt.

1. Confirm the returned binding once: attached root, named branch, and full HEAD equal to the committed epic tip supplied at launch. A missing, detached, or mismatched binding stops writes. Do not create, rename, or clean a worktree in the shell.
2. After local gates, commit, push the named branch, and open one pull request into the epic branch.
3. Call `link_pull_request` with the full URL, then `watch_pull_request`. Claim `watching: true` only when the returned payload contains it. A missing field is not success. Linking alone is not a watch. Right after `watch_pull_request`, run one catch-up snapshot (`gh pr checks` / `gh run list --commit <head>`). If every declared check has already finished, verify and deliver in this same turn. Otherwise end the turn.
4. On a watch wake, re-read the current head. Pending checks: end the turn on the same watch. Do not watch again. An in-scope failure: diagnose it, fix it, push, and end the turn for the new head. The same watch stays across pushes.
5. When every declared current-head check has succeeded, call `unwatch_pull_request`, then send exactly one result to the named coordinator thread with `t3_thread_send`. Acceptance means the transport took the message. It does not mean the coordinator has read it. A top-level thread has no child-completion wake. Do not send another result for the same head.
6. The coordinator dedupes by head. A later message for an older head is history. The coordinator drives recovery from an interrupted run with an explicit snapshot. A watch wake is not that recovery path.

Pending and failed checks stay with the worker. The coordinator does not repair the source or call a pending pull request delivered. Human merge and release stay separate. See the [human merge stop](../../braid-coordinate/references/delivery.md#human-merge-stop).

Step 3's catch-up snapshot is the one read of checks that finished before the watch. It is not a watch wake and not a poll. Do not run a second snapshot because that one is still pending. A new head, a real wake, or recovery from a failed registration is a different generation.

The packet's frozen set still applies, including configured jobs beyond branch protection. Verify every check the packet declares, including artifact digest and provenance when declared. A packet may explicitly declare artifact verification not required (for example a docs-only change); the report then says so. For this repository the usual job set is workflow `.github/workflows/ci.yml`: both `push` and `pull_request`, Ubuntu and Windows `verify` jobs, and successful Install dependencies, Verify, and Upload packed tarball. A green job conclusion is not itself a digest match. Pending, failed, skipped, cancelled, neutral, missing, inaccessible, or stale results do not count. Reconfirm the pull-request head after verification. A new commit invalidates the previous hosted proof.

Not claimed, and not to be treated as settled: a watch surviving interruption, unassisted repair of a failing check, restart durability, exactly-once delivery, or automatic reattachment. One short-prompt probe completed from a single watch wake and sent one result. That observation is not a guarantee for a later run. Files support a manual resume. They do not prove the watch or the original run survived.

## Legacy parent relay for delegated children

The accepted [continuation evidence](../../../../epics/braid/003-worker-skill/reports/A-acceptance.md) supports one bounded parent-relay lifecycle for a delegated child. It is not the normal route for a top-level item thread, and it is not a universal host guarantee. Check current host contracts. [Delegation mechanics](../../braid-coordinate/references/delegation.md) belong to the parent; the worker does not invoke delegation.

### Roles and finite readiness

The parent alone registers and transports pull-request watch events and records task lineage and teardown. The same assigned worker, item, thread, and worktree retains diagnosis, repair, verification, and green handoff. A fresh task ID in the same worker thread is allowed with explicit old-to-new lineage; do not call a completed task running. Follow the host's returned `next` at every transition.

1. The worker passes local gates, commits and pushes, creates and links its pull request, checkpoints the full head and check set, and returns a nonterminal waiting update. Parent completion wake is the transport-start boundary, not successful delivery.
2. Before registration, the parent queues exactly one readiness reconciliation in its own existing thread with `t3_thread_send(mode: 'queue')`, keyed to the pull request and registration generation. The parent then calls `watch_pull_request` and immediately ends that turn. No post-watch read or send in that turn. A failed queue or registration is a transport blocker; no readiness claim.
3. The queued parent turn confirms the actual watch result (`watching: true`), takes one post-registration pull-request, head, run, and check snapshot, and relays readiness and observations to this worker. This closes completed-before-registration and registration-race windows without assuming event replay. If pending, await real watch events; never repeatedly snapshot or self-queue for the unchanged pending head. Missing queued delivery or readiness requires explicit recovery, not a timeout loop.
4. On real failure or success notifications, the parent transports the actual notification plus pull request, full head, run, attempt, job, and log references and the intended continuation. It records returned delivery, task, and run identities, including fresh-task lineage. It does not repair source or declare worker checks accepted.
5. If a new head completed while a worker waiting turn was ending, one reconciliation tied to that new-head waiting update may cover the missed window. Label it a snapshot, not a watched event; do not requeue for the same pending head. Deduplicate races by pull request, head, run, attempt, and event identity. A delayed notification for an old head is history, never proof for the new head.

Do not inject deliberate failures unless separately authorized as a bounded trial. Ordinary delivery needs no canary or repeat trial. No child watch, periodic polling, scheduled or background watcher, original-task-survival requirement, or provider substitution.

### Worker continuation and green handoff

Treat any parent notification as a wake hint. Independently reconcile the current pull request and head and the frozen check set, including configured events, jobs, and uploads beyond branch protection's minimum. Pending checks retain ownership and waiting. Missing, inaccessible, or non-success conclusions require diagnosis and a precise nonterminal blocker when no authorized repair is available.

For a failure, read the exact run, attempt, job, and step logs before repair. Fix only in-scope causes without weakening gates. Pass relevant local checks, push and link the same pull request, and checkpoint and yield for new-head proof. The persistent parent watch can transport later-push events without re-registering solely for a push. Reject stale and duplicate results, then verify every declared current-head job, step, upload, and required artifact and source mapping. Reconfirm the head before a successful return. A later evidence commit needs its own proof.

After verified green worker handoff, the parent tears down its watch before parent handback and records the actual response. For a blocker with no live transport work remaining, the parent records teardown and explicit re-arm responsibility for later continuation. Registration's required immediate yield is a waiting boundary, not final handback. The parent never calls a failed or pending pull request delivered, and it does not take over worker repairs as acceptance.

### Interrupted transport or host restart

Read the checkpoint and current assignment and inspect the actual checkout, index, HEAD, pull request, runs, process, task, and parent subscription and lineage once before retrying interrupted effects. Reuse a completed push or pull request. Have the parent reconcile and re-arm only as required, using the finite readiness handshake. If the supported route or actual readiness cannot be established, report the exact host or coordinator owner, action, and impact and remain blocked and owned. Request a supported mechanism rather than inventing a direct CI wait.

Observed thread continuation and a bounded relay do not prove arbitrary restart recovery, durable or exactly-once messages, automatic watch reattachment, every missed-window case, or cross-provider behavior. No process or subscription is assumed alive after restart. Files enable manual reconciliation, not automatic durability.

## Stalled yield recovery

Apply the worker skill's blocker trigger only to naturally observed repeated yields with the same host run still active and its intended continuation queued. Assistant prose saying finished is not authoritative run completion; ordinary pending CI alone does not meet this condition. Do not add timers, poll run/queue state, repeatedly rewrite unchanged status or self-queue further readiness generations.

Preserve checkpoint, PR/full head, watch/registration generation and exact active/queued run/message/event identities. Send one explicit blocker to the coordinator through the supported return channel, record the delivery identity and stop ordinary execution under host rules. The coordinator may reconcile and use supported interruption at a safe boundary within its authority; this grants no automatic self-restart, provider substitution, queue deletion or repair takeover. Before continuation require actual recovery facts and explicit old-to-new run lineage, reconcile preserved effects, and retain every acceptance gate. An intervention demonstrates that intervention, not a known host root cause or unassisted recovery.
