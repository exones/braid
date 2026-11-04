# Epic <ID>: <outcome>

Workflow links resolve from this template's Braid installation; rewrite them to that installed location in generated files. Project and work-item links resolve in the target checkout.

Owner: <user>. Coordinator: <role/session reference>. Status: analysis | ready | in-progress | done | blocked | cancelled.
Release target: <milestone or none>. Controller/schema: <version or manual>.
Integration branch: `<epic/name>`, pinned from verified main `<full sha>` before the first plan commit. Item pull requests target this branch. The closing pull request targets main. See [Epic and item branches](../references/delivery.md#epic-and-item-branches).

## Problem and beneficiary
<What needs to improve, for whom, and why now.>

## Outcomes and success measures
1. <Observable outcome and evidence required.>

## Scope and non-goals
<Included behavior, exclusions, constraints, and authority.>

## Analysis
<Relevant repository/CI facts, unknowns, risks, and reasonable defaults.>

## Features and prioritized backlog
<Use feature headings only when useful.>

Assign each backlog `<ID>` using the [backlog item ID convention](../../../../docs/agile-workflow.md#backlog-item-ids).

| ID | Kind | Outcome | Depends on | Owner | Status | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| <ID> | story/task/spike | <backlog file link> | <dependencies> | <role> | backlog | <when available> |

Order/WIP/resource ownership: <reasoning and limits>.

## Review gates
<List reviews with their parent, scope, exact checked revisions, and report links. Read and apply the authoritative review conventions linked below.>

[Review conventions](../../../../docs/agile-workflow.md#review-gates-and-indexing).

## Definition of Ready and Definition of Done
<Project criteria plus epic-specific acceptance and review/release gates.>

## Decisions and open questions
<Dated decisions, unresolved inputs, and owner/impact.>

## Delivery evidence and release checklist
<Outcome-to-proof links, local vs remote proof, final report, retrospective, remaining blockers.>
