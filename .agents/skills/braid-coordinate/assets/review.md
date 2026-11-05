# <review-name>: <review scope>

Workflow links resolve from this template's Braid installation; rewrite them to that installed location in generated files. Project and work-item links resolve in the target checkout.

Read and apply the [review conventions](../../../../docs/agile-workflow.md#review-gates-and-indexing) before filling in names/paths.

Parent: <existing item or epic ID>. Pass: <pass>. Reviewer: <role/session>.
Agent/assignment name: <review-name>.
Report/checkpoint: <paths chosen under the review conventions>.
Assignment packet, when used: `assignments/reviews/<parent>/<review-name>.md`. The pass stays under `reports/reviews/`.
Candidate: <exact commit>. PR/artifact: <URL and identity when applicable>.
Workspace check: phase `review`, with `expected.head` and `candidateHead` set to that candidate SHA and `packetRevision` set to the commit that supplied this packet. Invoke `pwsh -NoProfile -File scripts/Test-WorkspaceBinding.ps1 -ContractPath <contract.json> -RepositoryRoot <absolute-root>` ([schema](../../../../scripts/workspace-binding.md)). A mismatch or inspection failure stops the affected writes. The packet revision is not the candidate.
Pass state: requested | findings | no-findings. Date: <date>.
Item status is not copied here. See [One home for status](../../../../docs/agile-workflow.md#one-home-for-status).
Legacy alias: <only if needed to preserve an existing reference>.

## Scope and evidence

When the target checkout provides `scripts/Test-PrProof.ps1`, run it for current-head CI proof. The script implements the packet's declared check set; that prose set remains the definition. `-SkipArtifacts` is valid only when the packet explicitly waives artifact verification, and that limitation stays in the review record. Accept a PASS for an active pull request only when `proofScope` is `current` and the final view is still open on the same target ref. A historical PASS is a merged snapshot and is not current readiness.

<Acceptance criteria/outcomes examined, sources read, checks actually run, and coverage limits.>

## Findings
<Stable finding labels such as F1. For each: severity, file/line, concrete failure scenario, expected behavior, and evidence. If none, say no actionable findings.>

## Acceptance assessment
<For each relevant criterion/outcome: proven, unproven, or contradicted, with evidence.>

## Triage and gate
<Coordinator records fixed/refuted/deferred findings with exact fix/check revisions; do not present a review as a GitHub approval or an automatic merge decision. A new independent recheck gets the next parent-scoped pass. The coordinator's user briefing follows [report format](../../../../epics/report-format.md); this file stays the technical gate record.>

## Resume
<Next concrete action, remaining limits, report/checkpoint paths, and shared-status proposal.>
