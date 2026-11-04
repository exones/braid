# <review-name>: <review scope>

Workflow links resolve from this template's Braid installation; rewrite them to that installed location in generated files. Project and work-item links resolve in the target checkout.

Read and apply the [review conventions](../../../../docs/agile-workflow.md#review-gates-and-indexing) before filling in names/paths.

Parent: <existing item or epic ID>. Pass: <pass>. Reviewer: <role/session>.
Agent/assignment name: <review-name>.
Report/checkpoint: <paths chosen under the review conventions>.
Assignment packet, when used: `assignments/reviews/<parent>/<review-name>.md`. The pass stays under `reports/reviews/`.
Candidate: <exact commit>. PR/artifact: <URL and identity when applicable>.
Status: requested | in-progress | findings | no-findings. Date: <date>.
Legacy alias: <only if needed to preserve an existing reference>.

## Scope and evidence
<Acceptance criteria/outcomes examined, sources read, checks actually run, and coverage limits.>

## Findings
<Stable finding labels such as F1. For each: severity, file/line, concrete failure scenario, expected behavior, and evidence. If none, say no actionable findings.>

## Acceptance assessment
<For each relevant criterion/outcome: proven, unproven, or contradicted, with evidence.>

## Triage and gate
<Coordinator records fixed/refuted/deferred findings with exact fix/check revisions; do not present a review as a GitHub approval or an automatic merge decision. A new independent recheck gets the next parent-scoped pass. The coordinator's user briefing follows [report format](../../../../epics/report-format.md); this file stays the technical gate record.>

## Resume
<Next concrete action, remaining limits, report/checkpoint paths, and shared-status proposal.>
