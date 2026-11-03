# D: prove startup, recovery, and green handoff

Kind: spike. Epic: [BRAID-003](../epic.md).
Status: backlog. Owner: one evaluator/trial worker at a time; coordinator selects assignments after approval.
Depends on: C delivered/reviewed; A's supported continuation available; committed context and an explicitly authorized low-impact trial scope.

## Read first

[AGENTS](../../../../AGENTS.md), [workflow](../../../../docs/agile-workflow.md), [epic](../epic.md), [current checkpoint](../checkpoints/current.md), [approved rules](../proposed-rules.md), [planning matrix](../reports/planning.md#behavioral-validation-design), delivered `reports/A.md`, `reports/B.md`, `reports/C.md`, and the actual skill/packet revision. Evaluation prompts receive only the minimal raw scenario/skill/context; do not reveal expected answers to the evaluating worker.

## Value and research question

Does the integrated skill actually prevent redundant startup, context-loss mistakes, and premature PR handoff in the configured host/provider, and what remains unproved?

Bound: one prepared scenario suite, one controlled live trial, and at most one focused recheck after findings. Reuse suitable A evidence where the mechanism/revision still applies, explicitly separating old mechanism proof from new integrated-skill behavior. Do not create multiple implementation streams or endless self-evaluation PRs.

## Scope and non-goals

Evaluate discovery, matching/mismatching checkout, stale dependency context, dirty user index, interrupted push/PR/wait, new-head invalidation, failed-check repair, missing/infrastructure-blocked checks, and final evidence. Use isolated disposable fixtures for destructive-risk scenarios. For live proof, assign a small approved documentation/fixture task and demonstrate same-worker continuation through current-head green. Any controlled CI failure must stay within the separately authorized disposable trial branch and be repaired; never weaken an existing check to finish the demonstration.

Measure startup context reads, Git command invocations, time until first meaningful item action, avoidable repeated actions, and coordinator interventions. Separate reading/design/toolchain/network/CI time. Compare cautiously with the recorded C observation; it is a single mixed-work baseline, not a controlled benchmark. No automatic performance threshold, universal reliability claim, production resource, release, or product automation.

## Acceptance criteria

1. Given fresh-context prompts, the worker discovers/loads the correct skill and executes only its assigned item; raw outputs and exact skill/packet/candidate revisions are retained.
2. Given a matching checkout, it verifies facts in one bounded batch and proceeds without unrelated branch/history discovery. Given a mismatch or pre-existing index, it preserves user work and reports the precise affected action.
3. Given interrupted actions and an already-open PR, resume reconciles actual state without duplicate PRs, reset, or blindly replayed mutations; the checkpoint alone identifies the next action.
4. Given pending/failure/new-head events, the same worker retains ownership, repairs in-scope failures, waits via A's mechanism, and returns only after declared checks pass on its current SHA. Missing/blocked checks produce a nonterminal blocker record, never a successful delivery.
5. Evidence reports actual reads/commands/timings/interventions and limitations, including which cases were fixture simulations and which were live. No claimed savings beyond the observations.
6. Findings are triaged against approved rules; significant new rules or authority changes return to the user. The coordinator records gate outcomes, final outcome report, and retrospective only after applicable delivery/review/merge evidence exists.

## Tasks

- [ ] Prepare blinded scenarios and the single authorized live trial; enforce one active worker slot.
- [ ] Inspect actual outputs, revisions, mutations, checkpoints, PR/check evidence, and measurements.
- [ ] Record `reports/D.md` and `checkpoints/D.md`; propose precise fixes/limits for coordinator triage.

## Ownership and verification

Own `validation/` fixtures/evidence within this epic, the assigned disposable trial scope, and D report/checkpoint. No concurrent edits to another item's outputs/shared status. The coordinator owns final/retro and any follow-up assignment. Structural validation supports the evaluation but cannot replace observed behavior. Retain negative cases/failures; redact secrets and keep binaries/log excerpts bounded.

## Review and delivery

Independent parent-scoped pass `D-worker-behavior-proof-review-001` checks exact revisions and claims; final milestone pass `BRAID-003-review-001` assesses outcomes and remaining blockers. They are separately scheduled gates under the [review convention](../../../../docs/agile-workflow.md#review-gates-and-indexing), not new backlog letters or worker-launched agents. The evidence deliverable requires a scoped Conventional Commit/PR, applicable current-head green CI, triaged review, and human-approved merge. None exists yet.

## Report and resume

Use [report-format](../../../report-format.md), explain practical gains and remaining uncertainty, give actual checkout/branch/head/PR/check state and exact next coordinator action. Stop after D; do not expand into product dispatch or a new release.
