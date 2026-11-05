# Epic BRAID-005: coordinator records without invalidating proof

Owner: user. Coordinator: unassigned. Status: ready.
Release target: none. Controller/schema: manual.
Integration branch: `epic/braid-005-coordinator-records`, pinned from verified main `f4606f4c5d047f562aac5c2fa9aa38fc23189d0d` before the first plan commit. Item pull requests target this branch. The closing pull request targets main. See [Epic and item branches](../../../.agents/skills/braid-coordinate/references/delivery.md#epic-and-item-branches).

## Problem and beneficiary

Coordinators push status records to the epic branch, which is also the open item PR's target. Each records-only push moves the base and makes a correct current-head proof stale. BRAID-003 worked around this with ad hoc base freezes (I, D, epic PR25). Coordinators and the user need one rule.

## Outcomes and success measures

1. One authoritative rule for committing versus publishing coordinator records, with a frozen-target window, owner and recovery path. Evidence: backlog item A acceptance criteria.

## Scope and non-goals

Documentation and policy only. No new tooling, scheduler, records branch, automatic merge or weaker exact-base proof.

## Features and prioritized backlog

| ID | Kind | Outcome | Depends on | Owner | Status | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| A | task | [Preserve proof while retaining coordinator records](backlog/A-coordinator-push-timing.md) | BRAID-003 on main | unassigned | backlog | moved from BRAID-003/K |

Order/WIP: one item, one worker.

## Review gates

Item review `A-coordinator-push-timing-review-001`; final review `BRAID-005-final-review-001`. [Review conventions](../../../docs/agile-workflow.md#review-gates-and-indexing).

## Decisions and open questions

- 2026-11-05: user moved BRAID-003/K into this epic. Not yet scheduled.