# Epic BRAID-003: a focused, resumable worker skill

Created: 2026-11-03. Owner: user. Coordinator: this planning session.
Status: ready. **Rules approved and execution authorized on 2026-11-03; start with A.**
Release target: workflow improvement for the current manual bootstrap; no CLI release.
Controller/schema: coordinator skill and Markdown files; no new machine ledger or released-controller adoption.

## Problem and beneficiary

Workers currently reconstruct their operating instructions from AGENTS, coordinator guidance, delivery/delegation references, task prompts, and older reports. The maintainer pays for repeated discovery, contradictory context, fragile resumes, and PRs returned before the worker has finished delivery. Workers need a small, explicit execution contract, and the coordinator needs a short assignment that carries current facts without copying an entire handbook.

The [planning analysis](reports/planning.md) distinguishes observed Git overhead from document reading/design and derives stage-appropriate rules from ignored inspiration material. The [proposed rules](proposed-rules.md) are the concrete review surface. Neither document installs a skill or changes active policy.

## Outcomes and success measures

1. A discoverable `.agents/skills/braid-worker/SKILL.md` handles one assigned implementation story, task, or research spike and resumption of that item. It does not plan an epic or launch agents.
2. A complete assignment supplies current task/Git/dependency/ownership/check facts; the worker needs no parent chat or inspiration directory to execute it.
3. A matching prepared checkout passes one bounded startup verification without routine full-branch/history discovery. Mismatches lead to scoped diagnosis, never destructive cleanup.
4. A fresh worker can resume from its checkpoint and actual files/PR state without repeating a completed mutation, opening a duplicate PR, or claiming old checks cover a new head.
5. **The worker keeps ownership of every PR it creates until the declared checks pass on its current head. It fixes failures before successful handoff.** Pending, failed, missing, or ambiguous evidence cannot be returned as ready for coordinator acceptance.
6. A supported way for the assigned worker to wait/continue after CI is demonstrated. If host restrictions prevent this, that is a visible blocker; coordinator takeover is not a substitute for this outcome.
7. Shared policy has maintained owners and references. Provider settings, review conventions, and reporting requirements stay at their authoritative locations.
8. A controlled behavioral evaluation records startup/context/recovery outcomes and limits. No percentage speedup or universal reliability claim is required or inferred from one trial.

## Scope and non-goals

Execution, after approval, creates the worker skill, its concise assignment asset, any necessary host-specific reference justified by A, and focused routing/reference edits. It corrects current wording that permits a finished failed-check handoff. It validates discovery, bounded startup, resume, failure repair, and current-head proof.

Keep the current one-implementation-worker WIP limit. Follow the current [provider profile](../../../AGENTS.md#providers-and-roles); do not embed settings in the new skill. Preserve the existing human merge/release authority.

Excluded: CLI T3 dispatch/doctor/state/schema changes; messaging queues; scheduled tick/watchdogs; automatic retries/provider failover; concurrent workers; new reviewer skill; automatic merge/rebase/force-push; package publication; deployments; infrastructure/secret access copied from inspiration; cleanup of unrelated epic 001/002 history. Do not import advanced baseline-failure waivers.

This planning turn owns only this epic directory and its index entry. Existing dirty policy files, other epic checkpoints, in-flight workers, and the Git index remain untouched. Before later delivery, reconcile the then-current branch/base and active file ownership at a safe handoff boundary.

## Analysis and design decisions

- Separate reusable execution from per-assignment facts. Motivation: fewer repeated prompt paragraphs and fewer missing facts; neither a giant prompt nor a bare task name is sufficient.
- Keep one short worker entrypoint with progressive references. Motivation: a worker should not read coordinator orchestration or every host adapter before editing one item.
- Retain existing shared delivery-policy location initially, updating it and linking from both skills. Motivation: extraction does not require a cosmetic file migration or duplicate policy. Operational worker steps live in the worker skill; shared delivery invariants stay shared.
- Treat CI waiting as an unresolved transport capability, not a reason to weaken green-only delivery. Motivation: host instructions currently forbid delegated children from watching PRs and forbid polling loops.
- Record a compact checkpoint at meaningful boundaries, including before waiting/context replacement. Motivation: preserve actionability without a second transcript or status database.
- Use behavioral scenarios and one bounded trial. Motivation: YAML/frontmatter checks cannot prove sensible recovery; repeating live PR experiments indefinitely would consume the savings sought.

The detailed rule-by-rule rationale, failure behavior, source dispositions, and acceptance mapping are in [proposed-rules.md](proposed-rules.md) and [reports/planning.md](reports/planning.md).

## Prioritized backlog

IDs follow the [backlog convention](../../../docs/agile-workflow.md#backlog-item-ids). The user approved the rules and authorized execution on 2026-11-03. A is ready for bounded research; B/C/D retain their evidence dependencies.

| ID | Kind | Outcome | Depends on | Owner | Status | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| A | spike | [Prove worker-owned CI waiting](backlog/A-worker-ci-wait.md) | approval received; live trial also requires free worker slot | Sol High research worker, task-specific user override | ready | capabilities verified; planning identifies host conflict; no live proof |
| B | story | [Create the worker execution skill](backlog/B-worker-skill.md) | A viable result; approved rules | one implementation worker | backlog | proposed rules only |
| C | task | [Integrate assignments and remove duplicated duties](backlog/C-assignment-integration.md) | B delivered/reviewed | one implementation worker | backlog | source ownership map in planning report |
| D | spike | [Prove startup, recovery, and green handoff](backlog/D-worker-behavior-proof.md) | C delivered/reviewed; A mechanism available | one evaluator/trial worker at a time | backlog | scenario matrix defined; unexecuted |

Order: A -> B -> C -> D. A answers a delivery-blocking capability question. B is a usable explicitly loaded worker skill. C makes it the normal assignment path and removes conflicting worker prose. D tests the resulting behavior rather than merely its wording. Keep checklist work within these items; do not add a letter for each review or scenario.

WIP/resource conflicts: B/C share skill and policy paths and must not overlap. A/D must not control an existing worker or PR from another epic. A trial occupying the worker slot prevents a simultaneous implementation assignment. Coordinator owns this table and `checkpoints/current.md`; workers own their item implementation/report/checkpoint only.

## Review gates

Apply the [authoritative review conventions](../../../docs/agile-workflow.md#review-gates-and-indexing). Each delivery receives independent review of its exact candidate. Proposed item pass names start `A-worker-ci-wait-review-001`, `B-worker-skill-review-001`, `C-assignment-integration-review-001`, and `D-worker-behavior-proof-review-001`; confirm no earlier pass before dispatch. A final milestone review uses `BRAID-003-review-001`. These are gates, not backlog items. Do not launch any review in this planning turn.

## Definition of Ready and Definition of Done

Use [project Ready/Done](../../../docs/agile-workflow.md#definition-of-ready). Add to Ready: approved rule version; self-contained packet and committed context; verified current provider/host capabilities; named check set and workable wait ownership; actual checkout/branch boundaries; no conflicting running owner.

A is ready only after approval. If it finds no supported worker wait, record the exact blocker and keep downstream items unready. A useful research result is distinct from delivery Done; the spike's own PR is subject to the same green-only rule, with no bootstrap exemption.

Done requires item acceptance, relevant local checks, scoped Conventional Commit/PR, applicable hosted checks passing on the current head, independent review/triage, and human-approved merge. D also needs behavioral evidence and limitations. Local schema/link checks cannot stand in for live worker waiting. Epic completion needs a final outcome report and retrospective, not an npm release.

## Decisions and approval boundary

Confirmed by the user on 2026-11-03: workers wait for PR checks they create, repair failures, and do not hand off failing PRs. The user requested this epic and a motivated rule proposal before implementation.

Approved on 2026-11-03: the complete [rule set](proposed-rules.md), retaining the T3-generated branch by default, treating blocker updates as nonterminal, keeping manual checkpointing, and the four-item sequence above. No rule here authorizes bypassing host restrictions or widening scope.

The user requested committing the plan and proceeding, and authorized Sol High for this work as a task-specific exception to the default implementation profile. Verified route: Codex `gpt-6.1-sol`, explicit `reasoningEffort: high`; preserve the global AGENTS profile. Start A in tool-managed isolation. Another epic's release assignment occupies the implementation lane; A's independent contract research may proceed, but it must not start a live implementation/PR trial until that lane is free. No merge/publication authority is granted.

## Delivery evidence and release checklist

- [x] Current guidance, prior Git analysis, CI entrypoints, and representative ignored inspiration material inspected; rationale retained in [planning report](reports/planning.md).
- [x] Proposed rules and sequential backlog written with explicit ownership and acceptance.
- [x] User reviewed rules and authorized execution; task-specific Sol High worker approved.
- [ ] A proves a viable supported worker wait/continuation.
- [ ] B/C skill and integration pass local, hosted CI, independent review, and human merge.
- [ ] D behavioral proof and milestone review accepted; outcome report and retrospective written.
- No worker skill implemented, PR created, CI run, merge, release, or deployment is claimed by this planning change.
