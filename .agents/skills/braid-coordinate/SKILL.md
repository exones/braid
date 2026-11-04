---
name: braid-coordinate
description: Analyze a goal, create or refine Agile epics and backlog items, and coordinate staged braid delivery or resumption from checkpoints. Use for goal-level planning and orchestration in any target project; assigned implementation workers follow their backlog item instead.
---

# Braid coordinator

Turn goals into implementation-ready backlog items; coordinate only the requested scope. Focused edits, assigned execution and factual questions do not need this loop.

## Context and mode

- Use the shared [workflow map](../../../docs/directory-structure.md) only for Braid records. Discover target layout, architecture and checks from project instructions, not Braid's repository.
- Read target `AGENTS.md` and its mandatory context, plus assigned epic/checkpoint/items/dependency reports. Consult project decisions/roadmap where named; do not require Braid-specific filenames. Workflow links resolve in the skill installation; project-context paths resolve in the target checkout. Report missing required context rather than inventing it.
- Read required context once per assignment. On resume refresh changed policy, checkpoint, relevant files and actual in-flight state; reuse valid decisions and evidence.
- **Plan:** produce a reviewable epic/backlog and stop before implementation. **Deliver:** advance Ready items within authorized scope. **Resume:** reconcile actual revisions, reviews and processes; continue the earliest actionable item within the existing stop boundary.
- Build/fix requests imply delivery, including “I want…”. Clarify materially ambiguous scope before dependent execution; continue useful independent work.

## Plan once, make briefs executable

- Identify outcome, beneficiary, exclusions, constraints, unknowns and relevant build/CI facts. Scale analysis to uncertainty and risk; do substantial architecture work here once, recording decisions so workers can execute them.
- Inspect named paths and targeted search results before broad exploration. Batch independent reads/checks, bound logs/diffs to the question, and reuse context. Further investigation needs a concrete unresolved question that affects implementation or proof; if none remains, proceed. No rigid time or tool-call budget.
- Match an existing epic or use [epic](assets/epic.md) and [backlog](assets/backlog-item.md) templates for necessary new files. Preserve IDs and user work; follow [ID rules](../../../docs/agile-workflow.md#backlog-item-ids). Reviews are parent gates, not new backlog letters.
- Split into small usable stories and necessary tasks or bounded spikes. Order dependencies and ownership/resource conflicts; enforce WIP and project Ready/Done criteria. Do not implement future roadmap automation incidentally.
- Write implementation-ready briefs: relevant paths/patterns, settled decisions and rationale, constraints/non-goals, dependencies, acceptance examples and exact verification. Carry research forward; do not assign the same discovery again without changed facts or a specific unresolved question.
- For bounded spikes, supply a small question/procedure/observation-table/result-and-limits outline. Record observations during the trial and derive conclusions afterward; do not require a long operating manual before observing behavior.
- Ask only for missing facts that materially affect scope, acceptance or execution. Choose routine details within authority. Do not add acknowledgment loops or coordination messages without an actionable change.

## Dispatch and supervise

File ownership is [Record ownership](../../../docs/agile-workflow.md#record-ownership). Keep one implementation worker at a time. Route product fixes back to that worker.

- Before assignment consult the target project's authorized provider profile; never substitute settings/providers silently. For automatic cross-provider dispatch load [delegation](references/delegation.md); otherwise supply a complete manual packet and explain the limitation.
- Author one filled [assignment packet](../braid-worker/assets/assignment-packet.md) for [braid-worker](../braid-worker/SKILL.md). Give its exact path, entry mode, concrete first action and exact outputs; separate read-now sections, verified dependency facts with evidence, and on-demand history. Name the execution-skill revision and source path. Reconcile mandatory target-project instructions before dispatch; installed skills cannot waive external AGENTS obligations. Commit the filled packet at `assignments/<ID>.md` and the required context before creating the item checkout. Supply the resulting full context SHA at launch. Do not embed that file's own commit SHA or an unknown thread or root. Record returned binding identities separately and supply remaining launch identities once in an actionable binding message, without acknowledgment loops. A change to a running assignment is a new committed revision, sent explicitly, not a dirty edit in the parent checkout.
- Before dispatch align active epic/item/packet/checkpoint statements on approval, owner, phase and next action. Clearly separate obsolete instructions from active status while preserving original historical evidence. A resumed packet names the worker checkpoint first, existing PR/head/continuation generation and interrupted action, not a replay of initial discovery. The single active implementation worker includes CI waiting and same-item repair; independent review and human merge stay separate.
- Freeze local/hosted checks, Git/base/remote/dependency merge facts, expected full HEAD/branch/origin/upstream state (including normal no-upstream), explicit first push destination, return channel, outputs and stop boundary. The normal item route is one top-level thread via `t3_thread_launch` with a workspace strategy: full base ref at the accepted epic tip, the explicit item branch, and origin policy. Honor the project's explicit standing thread request on continuation within authorized scope; do not ask again for each item. Provider/model/settings differences alone do not override a requested top-level route when the host permits it. Use `delegate_task` for a user-selected child or a host-required exception, and explain the exception. Follow host review routing. Let the host return the actual root and confirm the attached branch. Do not create the checkout in the shell or in the prompt.
- Keep the worker prompt short and step-explicit: confirm the binding, implement, run local gates, commit, push, open one pull request into the epic, link, and watch. Right after `watch_pull_request`, run one catch-up snapshot (`gh pr checks` / `gh run list --commit <head>`). If every declared check has already finished, verify and deliver in that same turn; otherwise end the turn. On a wake, pending checks end the turn; the worker repairs an in-scope failure; green current-head proof unwatches and sends one result. Dedupe results by head. Drive recovery from an interrupted run with an explicit snapshot. A watch wake is not that recovery. Do not treat watch survival, unassisted repair, or exactly-once delivery as settled.
- Resolve continuation before dispatch. In T3 load [T3 continuation](../braid-worker/references/t3-continuation.md). The top-level thread owns its watch and result message. Use the legacy parent relay only when the packet explicitly selects a delegated child. The worker retains repair and current-head verification. Follow host `next`; pending/failed/blocked returns remain nonterminal. Reconcile transport after interruption rather than assuming survival. Default to one epic worktree plus one active item checkout, with one writer in a checkout. See [Workspaces](references/delivery.md#workspaces).
- Intervene for dependencies, blockers, architectural contradictions or meaningful verification failures. Let routine in-scope implementation proceed without repeated approval or research.
- At a safe handoff inspect actual diff and full current-head check evidence using returned root/branch/HEAD/PR (`git -C <root>`). Do not switch to occupied branches or mutate a running worker's shared checkout/index/files. Reconcile base changes and invalidated proof explicitly.
- Preserve failed gates; send scoped actionable fixes to the worker. Run independent checks required by acceptance. Before review/recheck read [review conventions](../../../docs/agile-workflow.md#review-gates-and-indexing) and use [review template](assets/review.md). A worker claim is not independent acceptance.

## Delivery gates and stop conditions

Use [delivery rules](references/delivery.md) for commits, PRs, current-head green checks, review and human merge, including spikes. At an item boundary, before the next dispatch, apply [Epic branch sync and skill pinning](references/delivery.md#epic-branch-sync-and-skill-pinning). For this repository, `npm run verify` is the deterministic offline pre-PR gate for code and docs. External skill validators stay separate when they cannot run in CI. Local success produces a scoped commit/PR, not Done. Record PR/head, hosted CI, review triage and actual merge; never fabricate retrospective proof.

Before a dependent item requiring merge, apply the [human merge stop](references/delivery.md#human-merge-stop): report the exact human action, checkpoint and stop until actual merge is verified. Planning-only and user-defined report/choice boundaries also stop dispatch. General delivery authority does not authorize different providers, unrelated work, publication or deployment.

Keep README about supported capabilities and usage; live work belongs in epics/checkpoints/reports. Reusable guides contain mechanics and placeholder examples, not duplicate progress.

## Checkpoint and report

At meaningful boundaries update epic/backlog, decisions when changed, and shared checkpoint: actual revision/checkout, completed evidence, in-flight commands/logs, blockers, controller/schema where applicable and exact next action. Do not duplicate machine authority or checkpoint every read.

Use [report format](../../../epics/report-format.md) for item outcomes, substantive child returns, user blockers and milestones; inspect evidence and translate it for the user. Combine overlapping triggers; routine progress/unchanged waiting stays short Done / You / Next. Reporting adds no approval gate inside already authorized work.

At epic closure reconcile outcomes against evidence, write final report/retrospective and identify follow-ups/release blockers. Distinguish local readiness, hosted CI, merge and publication.
