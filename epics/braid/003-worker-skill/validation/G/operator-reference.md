# Independent-thread PR wait

Operator reference for one top-level T3 item thread that owns its pull-request wait and sends the result to the existing coordinator. This is the BRAID-003/G trial record. It does not change the worker skill, the parent-relay note, or broad delivery policy. F integrates the contract after this item is accepted and human-merged into the epic.

The blob below records the binding observed before its own commit, and the procedure this trial follows. Watch registration, hosted check conclusions, artifact digests, and coordinator delivery identities are resume supplements at `epics/braid/003-worker-skill/checkpoints/G.md` and `epics/braid/003-worker-skill/reports/G.md`. Those supplements are written after this head exists. A later commit whose only purpose is to store this head's SHA is not part of the trial.

Product remains 0.1.1, schema 1 manual ledger. No controller or braid API is adopted here.

## Question this answers

Can one actual top-level T3 item thread bind a named branch and worktree, watch and resume its own pull request, keep verification and repair, and deliver the outcome to the existing coordinator without a per-event parent relay or a delegate-completion wake?

Bound: one documentation pull request, one finite self-readiness reconciliation, and at most one focused correction if this trial demonstrates a contract mismatch. No injected failure, extra pull request, polling loop, or parent CI relay. D keeps the later failure-and-repair case.

## Binding observed at startup

Launch facts below came from the coordinator's required thread read and were checked here against Git and `t3_worktree_status`. This worker did not send a startup acknowledgement.

| Fact | Observed value |
| --- | --- |
| Thread | `mcp:launch:b4318dded53b10790c1cb711c5a4496141347271c88ddce9a5892d38485b3a80` |
| Startup run | `run:thread:mcp%3Alaunch%3Ab4318dded53b10790c1cb711c5a4496141347271c88ddce9a5892d38485b3a80:ordinal:1` |
| Parent thread / relationship | `null` / `null` |
| Host attachment | `attached: true` |
| Worktree | `c:\worktrees\agento\item-braid-003-g-independent-thread-ci` |
| Project root | `C:\code\agento` |
| Branch | `item/braid-003-g-independent-thread-ci` |
| Full HEAD at startup | `180f2e0b3cb6fc1a380a955e24a9580d0a4c85b8` |
| Tree and index | clean; no upstream configured |
| Origin | `https://github.com/exones/braid.git` |
| Pull-request base | `epic/braid-003-worker-skill` |
| Implementation profile | Cursor `grok-4.7`, high reasoning, 500k context, as confirmed by the launch result |
| Coordinator thread | `8a3c206a-9192-498f-b90a-19b5bf807c8c` |
| Project id | `8ec7d749-3a96-4edd-a27a-20fb28983dee` |

`t3_worktree_status` also reported `defaultStartFromOrigin: true`. That flag was not used to create or switch a checkout. The user root and every other worktree stay outside this item.

Startup HEAD is the committed epic tip named at launch. The packet cannot contain its own future SHA; the launch message supplied `180f2e0b3cb6fc1a380a955e24a9580d0a4c85b8`, and local `git rev-parse HEAD` matched it.

## Who may watch

Delegated children never watch, even when a brief says to babysit. This trial does not relabel a child. `parentThreadId` and `relationshipToParent` were both null, and the worktree status showed this thread attached to the named item branch. A top-level thread is the actor the host watch tools address.

`delegate_task` has no branch field, and its child must not watch. `create_threads` inherits a checkout and is not the route for an isolated item worker. `t3_thread_launch` is the coordinator's creation route for this trial. Creation itself was already done before this worker started. This worker does not launch threads or subordinate agents.

Exposed tool descriptions used here, read before any wait call:

| Tool | Contract used |
| --- | --- |
| `t3_worktree_status` | Reports attachment, path, branch, and project root. |
| `link_pull_request` | Links a pull request to this thread. Linking alone is not a check subscription. |
| `watch_pull_request` | Watches an open pull request and links it first if needed. The caller ends the turn after the call. The watch stays after each wake. A wake is not a merge decision. |
| `unwatch_pull_request` | Stops the watch. The link remains. |
| `t3_thread_send` | `mode: queue` starts a later turn. `mode: auto` starts an idle thread, steers a running turn, or queues. A send acknowledges delivery, not that the recipient has read or acted. |
| `t3_queue` | Lists or edits this thread's queued messages. Not a CI poll. |

`watching: true` is claimed only when a returned watch or unwatch payload contains it. A missing field is not success.

## Procedure

1. Verify root, branch, full HEAD, clean owned tree, and origin once against the launch facts. Record them. Do not create, rename, or clean a worktree in the shell.
2. Make the in-scope change. Run the repository local gate. A dirty tree is a pre-commit probe. Hosted verification requires a clean checkout.
3. Commit only owned paths, push `HEAD` to `refs/heads/item/braid-003-g-independent-thread-ci`, and open one pull request against `epic/braid-003-worker-skill`.
4. Call `link_pull_request` with the full URL as the next call.
5. Write the checkpoint with root, branch, full head, pull request, base, and the frozen check set.
6. Queue exactly one readiness reconciliation on this same thread with `t3_thread_send(mode: 'queue')`, keyed to the pull request and registration generation. Do this before `watch_pull_request`.
7. Call `watch_pull_request`, save the returned payload, and end the turn. Do not read the pull request or send another message after that call.
8. The queued turn establishes registration from the stored payload or the registration turn's tool activity, then takes one post-registration snapshot of head and checks. That snapshot is not a watched event.
9. If checks are still pending, keep the existing watch and wait. Do not snapshot again, queue again, sleep, or poll for that same head.
10. On a real wake, or when the snapshot shows a finished head, verify every frozen job, step, upload, and artifact for that head. Repair in-scope failures on this branch and wait for the new head. Keep the same watch across pushes.
11. Before a green or stopped-blocker return, call `unwatch_pull_request` and save the payload. If no watch was registered, say so.
12. Send the outcome to the coordinator with `t3_thread_send(mode: 'auto')`. Keep the returned thread, message, and run identities in the checkpoint and report.

The parent does not register this watch, relay each CI event, or poll this pull request. The coordinator's next action starts from the explicit result or blocker message.

## Finite readiness

Completed checks do not replay onto a watch that starts after they finish. One queued turn closes that window.

The queued turn does only this:

- Read the stored watch response. If it does not show an actual registration, stop with a host blocker. Do not infer `watching: true`.
- Take one snapshot of the pull request head and the frozen jobs.
- Label that snapshot `reconciliation`, not `watched event`.
- If anything required is pending or missing, record the snapshot and end the turn on the existing watch.
- If the head already satisfies the frozen set, continue verification. Do not pretend a watch notification arrived.

A later real notification for that same head and run is a duplicate. Compare pull request, head, run, and attempt. Keep one authoritative result. A notification for an older head is history after a newer push.

Do not queue another readiness turn because the first snapshot is still pending. A new head, a real wake, or an explicit recovery from a failed queue or failed registration is a different generation.

## Event versus snapshot

| Kind | What it is | What it can prove |
| --- | --- | --- |
| Reconciliation snapshot | One self-queued read after registration | Whether checks that finished before the watch already exist. Not a host CI notification. |
| Watch wake | A later turn started by the registered watch | That the host delivered a failed check, passed required checks, a new comment or review, or a conflict to this thread. The worker still re-reads the current head. |
| Absent wake while pending | No turn arrives | Nothing about the jobs. Ownership stays here. It does not prove the watch is dead and it does not authorize polling. |
| Coordinator send | `t3_thread_send` to the existing coordinator thread | The transport accepted the message and returned delivery identities. It does not prove the coordinator has read it, and it is not a child-completion callback. |

At authoring time, registration, the snapshot, a watch wake, and the coordinator send are **unobserved**. The supplement names which of those branches actually occurred. An unobserved branch stays unobserved. This trial does not manufacture a second pull request to force a wake.

## Frozen hosted proof

Workflow `.github/workflows/ci.yml`, name `CI`, triggers `push` and `pull_request`. Each trigger has `verify (windows-latest)` and `verify (ubuntu-latest)`. All four jobs need successful Install dependencies, Verify, and Upload packed tarball. Verify includes typecheck, build, the repository tests, and external packed-install proof. Artifact names are `braid-package-windows-latest` and `braid-package-ubuntu-latest`.

Pending, failed, skipped, cancelled, neutral, missing, inaccessible, or stale results do not count. An empty branch-protection list does not shrink this set.

For each run and attempt, record the event, job and step identities, and artifact ids. Download all four artifacts. Check the archive service digest and the contained tarball SHA-256 against the sibling provenance file: `candidate` true, `worktreeDirty` false, and the source mapping below.

| Event | Source identity |
| --- | --- |
| `push` | Provenance `sourceRevision` is the item head. |
| `pull_request` | The merge-test commit has the epic base parent, then the item head parent. `pullRequestHeadSha` equals the item head. `githubSha` is the merge-test commit, not a substitute for the item head. |

Push proof and pull-request proof are both required. Reconfirm the pull request head after verification. Any new commit invalidates the previous hosted proof.

Local `npm run verify` on a dirty tree is a separate probe. It does not clear the hosted set.

## Explicit return

Green requires the full current-head set, a reconfirmed head, and watch teardown. The worker then sends that account to `8a3c206a-9192-498f-b90a-19b5bf807c8c`. The message includes the pull request URL, full head, check and artifact identities, and the hashes and paths of the uncommitted supplements.

A blocker with no authorized in-scope repair uses the same send. It names the owner, the exact nonsecret action, and the impact. F and D stay unready. This worker does not fall back to parent relay, launch a reviewer, merge, or mark the item Done.

There is no demonstrated automatic wake of the coordinator when this top-level thread finishes. The explicit send is the completion path under test.

## Failure and recovery

| Condition | Owner | Effect |
| --- | --- | --- |
| In-scope check failure | This worker | Read the failed run, attempt, job, and step. Fix the cause, rerun the relevant local gate, push the same branch, link, and wait for the new head. |
| Registration or queue call fails | Host, reported to the coordinator | Keep the diagnostics. Do not claim readiness and do not invent a direct poll. |
| Watch payload omits an actual registration | Host, reported to the coordinator | Same. Do not treat a link as a watch. |
| Required job missing or inconclusive on the current head | This worker diagnoses; repository or host owner if the workflow or access is outside scope | No green handoff. |
| Notification for an old head | This worker | Keep it as history. Verify the current head. |
| Interrupted push or pull-request creation | This worker | Read the checkpoint and the actual Git and pull-request state. Reuse a completed push or pull request. |
| Host restart | Unproven | Files support a manual resume. They do not prove the watch, the queue, or the original run survived. |

Not claimed: restart durability, exactly-once delivery, automatic reattachment, survival of this run after the turn ends, cross-provider behavior, or a measured speedup. A's parent relay remains the legacy delegated-child result. It is not the route for this top-level trial. See [A](../../reports/A.md) and the [parent-relay note](../../../../../.agents/skills/braid-worker/references/t3-continuation.md). The approved [execution policy](../../execution-policy-proposal.md#3-independent-t3-workers-and-pr-waiting) is the routing change under test, only for this bounded trial, until F.

## Evidence in this candidate

| Item | State in this blob |
| --- | --- |
| Named root, branch, startup HEAD, null parent | Observed, table above |
| `t3_worktree_status` attachment | Observed |
| Local gate command and exit | Recorded in the supplement after the dirty or clean probe. Not hosted proof |
| `link_pull_request` result | Unobserved at authoring |
| Queued readiness run id | Unobserved at authoring |
| `watch_pull_request` payload | Unobserved at authoring |
| Reconciliation snapshot | Unobserved at authoring |
| Real watch wake | Unobserved at authoring; may remain unobserved if the snapshot already covers the head |
| Four job, step, and artifact identities | Unobserved at authoring |
| `unwatch_pull_request` payload | Unobserved at authoring |
| Coordinator send identities | Unobserved at authoring |

## What F can take from a green supplement

After the supplement records an actual registration, one readiness snapshot or a real wake, complete current-head proof, teardown, and a coordinator delivery identity, F can treat this procedure as the observed top-level contract:

- Item pull requests target the epic branch.
- The item thread links, queues one readiness turn, watches, and yields.
- The same thread verifies and repairs.
- The coordinator receives one explicit result or blocker, not each CI event.
- Review `G-independent-thread-ci-review-001` and the human merge of this pull request into `epic/braid-003-worker-skill` still gate F. Green worker handoff is not Done and not a merge. See [review conventions](../../../../../docs/agile-workflow.md#review-gates-and-indexing) and the [human merge stop](../../../../../.agents/skills/braid-coordinate/references/delivery.md#human-merge-stop).

Until that supplement exists, F stays unready. A useful procedure without the live registration, proof, and delivery identities does not answer the spike.

## Sources

- [G backlog](../../backlog/G-independent-thread-ci.md)
- [G assignment](../../assignments/G.md)
- [CI workflow](../../../../../.github/workflows/ci.yml)
- [Report format](../../../../../epics/report-format.md)
