# Epic BRAID-003: a focused, resumable worker skill

Created: 2026-11-03. Owner: user. Coordinator: this planning session.
Status: in-progress.
Release target: workflow improvement for the current manual bootstrap; no CLI release.
Controller/schema: coordinator skill and Markdown files; no new machine ledger or released-controller adoption.

## Problem and beneficiary

Workers currently reconstruct their operating instructions from AGENTS, coordinator guidance, delivery/delegation references, task prompts, and older reports. The maintainer pays for repeated discovery, contradictory context, fragile resumes, and PRs returned before the worker has finished delivery. Workers need a small, explicit execution contract, and the coordinator needs a short assignment that carries current facts without copying an entire handbook.

The [planning analysis](reports/planning.md) distinguishes observed Git overhead from document reading/design and derives stage-appropriate rules from ignored inspiration material. The [proposed rules](proposed-rules.md) are the concrete review surface. These files retain the original planning rationale; adopted revisions below govern delivery.

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

Records and implementation follow [Record ownership](../../../docs/agile-workflow.md#record-ownership). The historical planning scope is retained in Git history; approved delivery preserves user files and existing IDs.

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
| A | spike | [Prove worker-owned CI waiting](backlog/A-worker-ci-wait.md) | accepted and human merged | Sol High worker; separate reviewer | done | [PR #8](https://github.com/exones/braid/pull/8), reviewed `c86bc3990a63a5b18d582782e54f9a3cffa18928`; [no-findings pass 001](reports/reviews/A/A-worker-ci-wait-review-001.md); merged `a2120bfa084a32212a780a0fdc095c38d8869ef5` on 2026-11-04; all four jobs/uploads/artifacts and teardown verified |
| B | story | [Create the worker execution skill](backlog/B-worker-skill.md) | main integration delivered | author/reviewer stopped | done | reviewed `0183817`, PR #9 feature merge preserved; main delivery via #11 `7707524`; [acceptance](reports/B-acceptance.md), [E delivery](reports/E-acceptance.md) |
| C | task | [Integrate assignments and remove duplicated duties](backlog/C-assignment-integration.md) | main integration delivered | author/reviewer stopped | done | reviewed `6c3fcc1`, PR #10 feature merge preserved; main delivery via #11 `7707524`; [no findings](reports/reviews/C/C-assignment-integration-review-001.md), [E delivery](reports/E-acceptance.md) |
| E | task | [Consistent reports, PR human/technical parts and merge stopping gates](backlog/E-reporting-and-merge-gates.md) | human main merge verified | author/reviewer stopped | done | [PR #11](https://github.com/exones/braid/pull/11) merged `7707524a0b5a007794f22fab6ae1439d93458bb6`; accepted `f6b1360` ancestor; [no findings](reports/reviews/E/E-reporting-and-merge-gates-review-001.md), [delivery](reports/E-acceptance.md) |
| G | spike | [Verify independent-thread PR waiting and result delivery](backlog/G-independent-thread-ci.md) | user approved; committed context/packet before launch | positive for minimal watch-wake: probe PR15 showed one short-prompt top-level worker completing from a single watch wake; original run negative (self-restart loop, kept as history); watch survival/unassisted repair/exactly-once unproven. PR13 head 90a5fe1 green (push 41914429306, PR 41914439542); reviews [001](reports/reviews/G/G-independent-thread-ci-review-001.md), [002](reports/reviews/G/G-independent-thread-ci-review-002.md), [003](reports/reviews/G/G-independent-thread-ci-review-003.md) findings resolved (003 F1 wording fix checked by coordinator) | done | [execution policy](execution-policy-proposal.md); PR13 merged 2026-11-04 as 5c9f38f |
| F | task | [Integrate epic/workspace and assignment policy](backlog/F-epic-workspaces-and-assignments.md) | G accepted and human merged into epic | worker/reviewer stopped | done | [PR16](https://github.com/exones/braid/pull/16) human-merged as `7ddc561`; [acceptance](reports/F-acceptance.md); [review 001](reports/reviews/F/F-epic-workspaces-and-assignments-review-001.md) findings fixed at `f8c1f5b` |
| H | task | [Make `npm run verify` the single deterministic gate, including docs](backlog/H-deterministic-verify-gate.md) | F merged into epic | worker/reviewer stopped | done | [PR18](https://github.com/exones/braid/pull/18) human merge `2b6c2f4`; accepted `7b56b82`, [review 001](reports/reviews/H/H-deterministic-verify-gate-review-001.md) no findings; [acceptance](reports/H-acceptance.md) |
| J | task | [Record ownership, timing and epic branch hygiene](backlog/J-record-ownership-and-timing.md) | H and plan PR19 merged | completed | done | [PR20](https://github.com/exones/braid/pull/20) squash merge `d30e3a9`, tree-identical to reviewed `d28e052`; [acceptance](reports/J-acceptance.md), review001 F1-F3 resolved in review002 |
| I | task | [Temporary script for current-head PR proof](backlog/I-pr-proof-script.md) | reviewed and human-merged | completed | done | [PR21](https://github.com/exones/braid/pull/21) squash merge `d66843c`, tree-identical to reviewed `4fed09d`; [review003](reports/reviews/I/I-pr-proof-script-review-003.md) no findings, prior findings resolved; [acceptance](reports/I-acceptance.md) |
| D | spike | [Prove startup, recovery, and green handoff](backlog/D-worker-behavior-proof.md) | I reviewed and human-merged into epic | independent reviewer001 | in-review | [PR23](https://github.com/exones/braid/pull/23) cleanup `faca856` current/full-artifact green on frozen `3101d84`; guided F/R/C and transport negatives retained in [triage](reports/D-coordinator-triage.md); [review packet](assignments/reviews/D/D-worker-behavior-proof-review-001.md), no merge/Done |
| K | task | [Preserve proof while retaining coordinator records](backlog/K-coordinator-push-timing.md) | J/I evidence; later user priority decision | unassigned | backlog | deferred formulation only; outside the current delivery sequence, no dispatch |

## Delivery sequence

G -> F -> H -> J -> I -> D, then the final milestone review, outcome report, retrospective and one epic PR into main. Keep the existing IDs. Each item follows the applicable CI/review/human merge gates before dependent work. Live execution handles and the next action live only in [current checkpoint](checkpoints/current.md).

## Adopted workflow

2026-11-05 scoped D proof window: reuse the local-records/base-stability tactic approved for I during the one guided D live trial and independent review. Publish the concrete trial packet first; hold that exact target tip while the worker verifies F/R/C and the reviewer checks C. Later coordinator records/review outputs stay locally committed until the human D merge, then reconcile/publish acceptance. Independent remote movement still invalidates readiness and must be reconciled. This operational window does not adopt K or weaken any CI/review/human merge gate. The canary is explicitly guided setup/repair with predeclared decommission after R succeeds; no generic unassisted-recovery claim.

2026-11-05 I adopted after human squash merge `d66843cfb23b1c5c3891732c458d30d2b077fae1`, exact reviewed tree `74eac2da893d1fa1af1dd7a20b29c8f65ec65696`. [Acceptance](reports/I-acceptance.md) retains full proof and review limits. D uses immutable installation `C:/Users/exon/.codex/braid-pins/d66843cfb23b1c5c3891732c458d30d2b077fae1`, worker blob `13c3cf9679f6abb78d242840a80574abeb5ecf9d`; old J pin remains historical for I's run. The scoped I freeze is complete after verified merge; retained records are published now. Main-ahead0. K remains deferred, so no general push-timing rule is changed.

D's original evidence obligations remain. The user continued to D after I's merge; references to awaiting G/F adoption and A's parent relay are superseded by the delivered top-level route. The worker prepares small fixtures and raw scenarios; coordinator dispatches any blind subjects serially, then resumes the same D owner to analyze real observations. No worker launches agents, no live failure occurs before a concrete scoped trial packet, and no product/merge/release authority expands.

2026-11-05 scoped I exception approved by user: after publishing the F1 fix assignment, freeze the epic branch through I's next CI/review cycle. Coordinator status/review records remain committed locally and are pushed with acceptance after the human merge. This prevents those records from repeatedly invalidating exact live-base proof. No acceptance gate is relaxed; independent remote movement is reconciled explicitly. Later generalization of J's push timing is a separate decision.

2026-11-05 user amendment: lightweight coordinator scope-plus-Markdown checking supersedes the full records gate; the singular rule is [Commit boundary](../../../docs/agile-workflow.md#commit-boundary). The user then explicitly authorized the small helper/rule directly in this coordinator thread without a separate PR. [Direct change record](reports/coordinator-records-gate.md) lists scope and checks. The added I assignment was withdrawn; I continues its original PR-proof work. Individual-epic/thread ownership refinement is deferred.

J's D25 workflow is adopted from squash merge `d30e3a93a2a3690934d059357eb2ed9b1494d6ca`, exact tree identity `a5168f1558b4f6e56019a7044d39bac9370eb53a` with reviewed head `d28e052e26ac3a13dc2c34c3fa3cc1838864c8ca`. See [acceptance](reports/J-acceptance.md). The installed operating baseline is `C:/Users/exon/.codex/braid-pins/d30e3a93a2a3690934d059357eb2ed9b1494d6ca`, with worker source `.agents/skills/braid-worker/SKILL.md` at that Git revision. Its reference graph is preserved outside candidate checkouts. I uses this pinned installation; a later candidate's skill edits apply only after an explicit adoption record here.

The coordinator migrates this epic's backlog status narratives into the table and rewrites `checkpoints/current.md` as now-state. Earlier checkpoint versions remain in Git history; [event log](checkpoints/log.md) is append-only and is not routine resume context. Authorities: [ownership and commit boundary](../../../docs/agile-workflow.md#record-ownership), [status](../../../docs/agile-workflow.md#one-home-for-status), [main sync and pinning](../../../.agents/skills/braid-coordinate/references/delivery.md#epic-branch-sync-and-skill-pinning).

## Review gates

Apply [review conventions](../../../docs/agile-workflow.md#review-gates-and-indexing). Item reviews check the exact candidate and have parent-scoped evidence. A final fresh-context milestone review uses `BRAID-003-review-001`. Human merge remains separate from technical review and hosted CI. Item PRs target the epic; the final epic PR targets main.

## Definition of Ready and Definition of Done

Use [project Ready/Done](../../../docs/agile-workflow.md#definition-of-ready): scoped committed packet, verified dependency merges, explicit writer/checkout/skill baseline, declared proof and continuation before dispatch. D additionally needs the approved behavioral evidence and its limitations. Epic closure requires final integrated-head proof, milestone review, outcome report, retrospective and human merge into main; registry publication is separate and excluded here.

## Historical planning and decisions

Original planning rationale is in [planning](reports/planning.md), [proposed rules](proposed-rules.md) and the [execution-policy proposal](execution-policy-proposal.md). Historical provider overrides and assignments retain their actual settings. [E acceptance](reports/E-acceptance.md) records the B/C/E integration into main; retained item reports and review passes preserve their exact local/hosted/merge evidence. Earlier dashboard versions remain in Git history rather than being repeated as current status.
