# <ID>: <small outcome>

Choose `<ID>` using the [backlog item ID convention](../../../../docs/agile-workflow.md#backlog-item-ids) (template reference; resolve against the project root when generating an item).

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

[Review conventions](../../../../docs/agile-workflow.md#review-gates-and-indexing) (template reference; resolve against the project root when generating an item).

## Delivery record
<Owned branch/PR, Conventional Commit messages, checked head SHA, local gate, hosted CI, reviewer findings/triage, human merge decision, and merge SHA. For a docs-only spike use applicable documentation/CI checks. Do not mark Done from local proof alone.>

## Report and resume
Write <epic path>/checkpoints/<ID>.md and <epic path>/reports/<ID>.md. Follow epics/report-format.md: explain introduced capability, important changes and operator impact, then checks/results, revision/artifact identity, limitations, and next action. In coordinated mode the coordinator owns shared status. Stop after this item.
