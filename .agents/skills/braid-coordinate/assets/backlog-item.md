# <ID>: <small outcome>

Workflow links resolve from this template's Braid installation; rewrite them to that installed location in generated files. Project and work-item links resolve in the target checkout.

Choose `<ID>` using the [backlog item ID convention](../../../../docs/agile-workflow.md#backlog-item-ids).

Kind: story | task | spike. Epic: <ID/path>. Feature: <optional group>.
Status: backlog. Owner: <role>. Depends on: <IDs or none>.

## Read first
<AGENTS.md, relevant decisions, epic, checkpoint, and dependency reports.>

## Value or research question
<For a story: beneficiary, capability, and value. For a task: parent outcome supported. For a spike: question, bounded effort/time, and required decision.>

## Scope and non-goals
<Small included slice and explicit exclusions.>

## Acceptance criteria
1. Given <context>, when <action>, then <observable behavior>.
2. <Failure/edge behavior and evidence method where relevant.>

## Implementation or research tasks
- [ ] <Concrete step. Keep this checklist short.>

## Ownership and verification
<Files/resources, exact meaningful checks, review requirement, and required evidence.>

## Review gates
<Review assignments, exact candidate revision, reviewer/scope, report path, findings/triage, and gate result. Read and apply the authoritative review conventions linked below.>

[Review conventions](../../../../docs/agile-workflow.md#review-gates-and-indexing).

## Delivery record
<Owned branch/PR, Conventional Commit messages, checked head SHA, local gate, hosted CI, reviewer findings/triage, human merge decision, and merge SHA. For a docs-only spike use applicable documentation/CI checks. Do not mark Done from local proof alone.>

## Report and resume
Write <epic path>/checkpoints/<ID>.md and <epic path>/reports/<ID>.md. Follow [report format](../../../../epics/report-format.md): opening, What changed, Why, Left for you, and Technical record. In coordinated mode the coordinator owns shared status and translates child evidence into the user account. Stop after this item.
