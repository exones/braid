---
name: braid-coordinate
description: Analyze a goal, create or refine Agile epics and backlog items, and coordinate staged braid delivery or resumption from checkpoints. Use for goal-level planning and orchestration in this project; assigned implementation workers follow their backlog item instead.
---

# Braid coordinator

Turn goals into implementation-ready backlog items; coordinate only the requested scope. Focused edits, assigned execution and factual questions do not need this loop.

## Context and mode

- Locate unfamiliar paths with the shared [directory map](../../../docs/directory-structure.md), only as needed.
- Read project `AGENTS.md` and its mandatory context, `docs/agile-workflow.md`, `epics/README.md`, and the relevant epic/checkpoint/items/dependency reports. Use `docs/roadmap.md` for release boundaries. Paths are project-relative; report missing context rather than inventing it.
- Read required context once per assignment. On resume refresh changed policy, checkpoint, relevant files and actual in-flight state; reuse valid decisions and evidence.
- **Plan:** produce a reviewable epic/backlog and stop before implementation. **Deliver:** advance Ready items within authorized scope. **Resume:** reconcile actual revisions, reviews and processes; continue the earliest actionable item within the existing stop boundary.
- Build/fix requests imply delivery, including “I want…”. Clarify materially ambiguous scope before dependent execution; continue useful independent work.

## Plan once, make briefs executable

- Identify outcome, beneficiary, exclusions, constraints, unknowns and relevant build/CI facts. Scale analysis to uncertainty and risk; do substantial architecture work here once, recording decisions so workers can execute them.
- Inspect named paths and targeted search results before broad exploration. Batch independent reads/checks, bound logs/diffs to the question, and reuse context. Further investigation needs a concrete unresolved question that affects implementation or proof; if none remains, proceed. No rigid time or tool-call budget.
- Match an existing epic or use [epic](assets/epic.md) and [backlog](assets/backlog-item.md) templates for necessary new files. Preserve IDs and user work; follow [ID rules](../../../docs/agile-workflow.md#backlog-item-ids). Reviews are parent gates, not new backlog letters.
- Split into small usable stories and necessary tasks or bounded spikes. Order dependencies and ownership/resource conflicts; enforce WIP and project Ready/Done criteria. Do not implement future roadmap automation incidentally.
- Write implementation-ready briefs: relevant paths/patterns, settled decisions and rationale, constraints/non-goals, dependencies, acceptance examples and exact verification. Carry research forward; do not assign the same discovery again without changed facts or a specific unresolved question.
- Ask only for missing facts that materially affect scope, acceptance or execution. Choose routine details within authority. Do not add acknowledgment loops or coordination messages without an actionable change.

## Dispatch and supervise

Coordinator owns epic/shared checkpoint, readiness, scheduling and acceptance. Workers own implementation and item report/checkpoint; route product fixes back to them. Keep one seed implementation worker at a time.

- Before assignment consult the [provider profile](../../../AGENTS.md#providers-and-roles); never substitute settings/providers silently. For automatic cross-provider dispatch load [delegation](references/delegation.md); otherwise supply a complete manual packet and explain the limitation.
- Use [braid-worker](../braid-worker/SKILL.md) and its [assignment packet](../braid-worker/assets/assignment-packet.md). Freeze local/hosted checks, supply committed isolated context (or explicit shared dirty/index ownership), Git/base/remote/dependency merge facts, outputs and stop boundary. Let the host return actual bound root/branch.
- Resolve continuation before dispatch. In T3 load [parent relay](../braid-worker/references/t3-continuation.md). Parent transports events; worker retains repair and current-head verification. Follow host `next`; pending/failed/blocked returns remain nonterminal. Reconcile transport after interruption rather than assuming survival.
- Intervene for dependencies, blockers, architectural contradictions or meaningful verification failures. Let routine in-scope implementation proceed without repeated approval or research.
- At a safe handoff inspect actual diff and full current-head check evidence using returned root/branch/HEAD/PR (`git -C <root>`). Do not switch to occupied branches or mutate a running worker's shared checkout/index/files. Reconcile base changes and invalidated proof explicitly.
- Preserve failed gates; send scoped actionable fixes to the worker. Run independent checks required by acceptance. Before review/recheck read [review conventions](../../../docs/agile-workflow.md#review-gates-and-indexing) and use [review template](assets/review.md). A worker claim is not independent acceptance.

## Delivery gates and stop conditions

Use [delivery rules](references/delivery.md) for commits, PRs, current-head green checks, review and human merge, including spikes. Local success produces a scoped commit/PR, not Done. Record PR/head, hosted CI, review triage and actual merge; never fabricate retrospective proof.

Before a dependent item requiring merge, apply the [human merge stop](references/delivery.md#human-merge-stop): report the exact human action, checkpoint and stop until actual merge is verified. Planning-only and user-defined report/choice boundaries also stop dispatch. General delivery authority does not authorize different providers, unrelated work, publication or deployment.

Keep README about supported capabilities and usage; live work belongs in epics/checkpoints/reports. Reusable guides contain mechanics and placeholder examples, not duplicate progress.

## Checkpoint and report

At meaningful boundaries update epic/backlog, decisions when changed, and shared checkpoint: actual revision/checkout, completed evidence, in-flight commands/logs, blockers, controller/schema where applicable and exact next action. Do not duplicate machine authority or checkpoint every read.

Use [report format](../../../epics/report-format.md) for item outcomes, substantive child returns, user blockers and milestones; inspect evidence and translate it for the user. Combine overlapping triggers; routine progress/unchanged waiting stays short Done / You / Next. Reporting adds no approval gate inside already authorized work.

At epic closure reconcile outcomes against evidence, write final report/retrospective and identify follow-ups/release blockers. Distinguish local readiness, hosted CI, merge and publication.
