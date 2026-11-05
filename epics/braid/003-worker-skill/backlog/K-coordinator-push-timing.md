# K: preserve current-base proof while retaining coordinator records

Kind: task. Epic: [BRAID-003](../epic.md).
Depends on: J's adopted record ownership and I's reviewed live-base proof contract. Deferred follow-up requested by the user; priority and execution require a later decision. It does not block I or D and is not part of the current delivery sequence.

## Value and problem

Coordinators need durable, resumable records without repeatedly invalidating a worker's final CI and review. J currently requires coordinator records to be pushed at each boundary. Each push advances the same epic branch used as the item's target. A proof that correctly certifies head H against base B is no longer current when a records-only push creates B2. BRAID-003/I exposed this interaction; its scoped base freeze is temporary evidence, not a general policy change.

## Scope and non-goals

Refine the singular Commit boundary rule and its coordinator references to distinguish committing records promptly from publishing them at safe boundaries. Define a bounded proof/review freeze, its owner, start/end conditions, recovery after interruption, and publication after human merge or an abandoned cycle. Local records remain committed and their unpublished state is explicit in the current checkpoint.

Do not weaken exact-base proof, classify records as invisible to Git, authorize automatic merge/rebase, add concurrent workers, or introduce another records branch, queue, scheduler or controller. Remote backup of unpublished commits is an explicit durability tradeoff to document; new storage or automation is outside this item.

## Acceptance criteria

1. One authoritative rule names when coordinator records are committed and when they are pushed. Normal boundaries outside a final proof/review cycle retain prompt publication; active cycles have a recorded frozen target SHA and owner.
2. A worked scenario shows worker head H green against base B, coordinator status/review records committed locally without moving remote B, independent review, human merge, then reconciliation and publication of retained records. No paperwork commit is added to H.
3. If the remote base or worker head changes during the window, the old proof loses current readiness. The rule identifies the next owner and required revalidation; no records-only exception silently preserves a stale PASS.
4. Failed checks, repair, cancellation, an interrupted coordinator, prolonged human-merge waiting, and user-requested urgent target changes each have a concrete next action. The rule makes unpublished records and their recovery location visible and never treats elapsed time as permission to push.
5. A coordinator can resume from the checkpoint and actual local/remote Git state without discarding local commits or losing review files. The durability limitation of local-only records is stated plainly.
6. References agree with the singular rule. Current gates, WIP and human merge/release authority remain unchanged. Focused documentation/scenario validation and an independent review cover the change.

## Implementation and verification

- Refine `docs/agile-workflow.md` Commit boundary; update only conflicting coordinator/worker delivery references.
- Use I's records in `reports/I-coordinator-triage.md` and the epic's scoped exception as observed evidence. Do not claim watch survival or crash recovery from this one cycle.
- Exercise the scenarios above as a bounded written walkthrough; use disposable Git fixtures only if implementation introduces executable behavior. Run the applicable docs/full implementation gate and skill validators for edited skills.

## Ownership, delivery and resume

A later assignment owns the policy and conflicting references plus `reports/K.md` and `checkpoints/K.md`. The coordinator retains shared epic/checkpoint ownership. Before execution, commit a filled packet with a pinned skill, explicit scope and provider settings. Deliver through an item PR into the epic, exact-head CI, separate `K-coordinator-push-timing-review-001`, and human merge. Follow [review conventions](../../../../docs/agile-workflow.md#review-gates-and-indexing) and [report format](../../../../epics/report-format.md). No worker is assigned now.
