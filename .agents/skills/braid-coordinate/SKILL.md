---
name: braid-coordinate
description: Analyze a goal, create or refine Agile epics and backlog items, and coordinate staged braid delivery or resumption from checkpoints. Use for goal-level planning and orchestration in this project; assigned implementation workers follow their backlog item instead.
---

# Braid coordinator

Turn a short goal into an evidence-backed epic and actionable backlog, then coordinate only the delivery the user requested. Support planning-only requests and resumption. Keep the first implementation small and use accepted braid releases to organize later milestones.

## Load the right context

1. Locate the project root from the working directory; read its `AGENTS.md`, `docs/decisions.md`, and `docs/agile-workflow.md`.
2. Read `epics/README.md`. If the goal belongs to an existing epic, read its `epic.md`, `checkpoints/current.md`, relevant backlog items, and dependency reports. Preserve IDs, progress, and user changes.
3. Read `docs/roadmap.md` for release capability boundaries. Do not implement later automation merely because the workflow mentions it.

Paths above are relative to the target project root, not the skill directory. If used in a checkout lacking these files, explain the missing project context rather than inventing it. Focused edits, direct worker assignments, and simple factual questions do not require this coordinator loop.

## Analyze and refine

- Identify the problem, beneficiary, verifiable outcome, exclusions, constraints, unknowns, and existing build/test/CI behavior. Inspect available repository facts before asking the user.
- Match the goal to an existing epic or create `epics/<project>/<NNN>-<slug>/`. For a new epic use [the epic template](assets/epic.md); create only the files needed for its current scope.
- Divide work into small usable stories and necessary enabler tasks. Use bounded spikes for uncertainty; optional features group related work. A checklist inside an item is usually enough for its implementation tasks. Before assigning backlog IDs or filenames, read [Backlog item IDs](../../../docs/agile-workflow.md#backlog-item-ids). Routine reviews are parent-item or epic gates, not new lettered backlog items; use the parent-scoped review convention in `docs/agile-workflow.md`.
- For new backlog items use [the backlog template](assets/backlog-item.md). Record kind, beneficiary/value or spike question, scope, dependencies, ownership, testable acceptance criteria, evidence, and report/checkpoint paths. Prefer concrete Given/When/Then examples when they clarify behavior.
- Order the backlog by value and dependencies, explain resource/file conflicts, and enforce the current WIP limit. Record the Definition of Ready and Definition of Done from the project workflow; add item-specific criteria where needed.
- Ask only when missing information materially changes outcome/scope or blocks execution. Make routine choices, record why, and continue independent work. Do not recreate already documented answers.

## Choose the requested mode

- **Plan/analyze:** produce the analysis, epic/backlog, acceptance criteria, and a concise reviewable proposal. Do not launch implementation.
- **Build/deliver:** do the analysis/refinement first, then advance Ready items within the requested epic and authority. Do not repeatedly request permission for routine steps already authorized by the delivery request.
- **Resume/continue:** reconcile checkpoint, actual files/revisions, outstanding reviews, and in-flight work. Resume the earliest actionable item; do not restart completed work or create a new epic without cause. Honor an existing stopping boundary, such as "A only."

Before dispatch, verify the item's Ready criteria. A general goal does not authorize unrelated scope, a different model/provider, or external publication/deployment. Follow project policy for those actions; prepare a concrete result before seeking any necessary final authorization.

Treat a request to build, fix, or implement as delivery even when phrased "I want...". Keep an explicitly planning-only or exploratory request in analysis/refinement. If the mode is materially unclear, make useful progress on the analysis and clarify before dependent delivery.

## Coordinate delivery

The coordinator owns `epic.md` and `checkpoints/current.md`. Workers own `checkpoints/<ID>.md`, `reports/<ID>.md`, and their assigned implementation scope. Stay in the coordinator role; route product changes through scoped worker assignments.

Before each implementation assignment, read the authoritative [provider profile in AGENTS.md](../../../AGENTS.md#providers-and-roles) and pass its model and explicit options to T3. Keep the profile there rather than copying settings into this skill or templates. When cross-provider work is authorized and T3 tools are available, read [delegation mechanics](references/delegation.md). Otherwise prepare one complete manual worker assignment; clearly state why automatic delegation is unavailable. Do not silently substitute another model or provider.

Assign implementation through [braid-worker](../braid-worker/SKILL.md), using its [canonical assignment packet](../braid-worker/assets/assignment-packet.md) for both automatic and manual dispatch. Supply current task/context/dependency and actual merge evidence, Git/base/remote facts, ownership, frozen local/hosted check set, supported continuation, outputs and stop boundary. Required isolated context must be committed at the assigned revision; an expressly shared checkout must name dirty/index ownership and allowed operations. Let the host return the actual bound root/generated branch; do not guess them. Keep one seed implementation worker at a time. The worker skill owns execution/resume mechanics; [delivery](references/delivery.md) owns the shared green-only invariant.

Resolve the supported wait/return mechanism before dispatch. For T3, use the worker's [parent-relay reference](../braid-worker/references/t3-continuation.md): parent transports events, worker retains diagnosis/repair/current-head verification. A pending/failing/blocker return is nonterminal progress, not successful delivery or a transfer of repairs to the coordinator. Reconcile actual task/transport state after interruption rather than assuming a surviving subscription.

At a safe handoff boundary, use the returned actual checkout/branch/full HEAD/PR and independently inspect current-head green evidence for the entire assigned check set. Use `git -C <returned-root>` for inspection; do not blindly check out a branch occupied by another worktree. Preserve user index/dirty ownership. Reconcile a base change explicitly and revalidate affected proof before advancing. Before dispatching an item that requires a merged prerequisite, apply the [human merge stop](references/delivery.md#human-merge-stop).

Inspect the actual changes and check relevant evidence before moving In Review to Done. Run independent checks where the item's gate requires them. A worker report is a claim, not automatic acceptance. Preserve blockers and failed gates; return actionable findings as scoped fixes. Request fresh reviews at the declared milestone.

Before assigning an independent review/recheck, read and follow the authoritative [review conventions](../../../docs/agile-workflow.md#review-gates-and-indexing). Use [the review template](assets/review.md) for its exact scope, revision, findings, and evidence.

## Commit, PR, CI, and review

Use [delivery rules](references/delivery.md) for every delivery item, including research spikes. Passing local gates should produce a scoped Conventional Commit and PR; do not leave accepted work indefinitely uncommitted. Normal delivery requests authorize scoped commits, pushes to an owned feature branch, and PR creation without another permission question. Merge authority remains with the human unless explicitly changed.

Keep local acceptance separate from delivery Done. Record PR URL, checked head SHA, hosted CI, review triage, and merge result in the epic. Do not mark an item Done solely because its local gate passes. A docs-only spike still has a reviewable PR and applicable documentation/CI checks; do not add meaningless tests or bypass required checks.

README is the repository frontend: supported capabilities, setup, usage, architecture, and known limits. Keep active work, backlog IDs/status, next assignments, and coordinator handoffs in epic/checkpoint/report files. Update README only when documented project behavior changes. A stable development-guide link is fine; a progress dashboard is not.

Reusable guides such as `docs/agent-handoff.md` describe mechanics and clearly marked placeholder examples. Do not put current assignments, completed-item tables, next-work recommendations, or dated runtime observations there. Link to the epic index instead; avoid maintaining duplicate progress sources.

If a worker is already running in a shared checkout, do not switch branches, stage, commit, push, or edit its files concurrently. Apply the new delivery workflow when its result returns. Preserve existing user commits/index; reconcile earlier local-only acceptance honestly without rewriting history or inventing retrospective PR/CI proof.

## Close or checkpoint

Update epic/backlog status, decisions, shared checkpoint, and next action at meaningful boundaries. Record revision, controller version if one exists, in-flight commands/logs, completed evidence, blockers, and exact resume point. Plans and runtime state must not become two competing authorities. Follow [report format](../../../epics/report-format.md) for item reports and user briefings. Inspect child evidence and translate it; do not forward an opaque handoff as the user account.

At epic completion, reconcile every outcome with evidence, write the final report and retrospective, and identify follow-up backlog items and release blockers. Describe local readiness separately from remote CI and publication. Improve skills/defaults through reviewable changes based on observations; do not silently relax acceptance.

## Progress updates and human reports

Routine progress, CI waiting, duplicate same-head notices, and transport housekeeping stay short `Done / You / Next` updates, as specified in [report format](../../../epics/report-format.md#report-triggers). They do not replace an item briefing.

After inspecting evidence, write the user account from that same authority: opening, What changed, Why, Left for you, and Technical record. Combine overlapping triggers into one report. The reporting contract does not add an approval question for work the user already authorized. A required human merge is a stopping gate: report the exact merge, checkpoint, and do not dispatch the dependent item. The worker still owns repair through current-head green on the item already assigned. If the user asks for a report and says they will choose the next action, finish the requested edits and checks, checkpoint, and stop before the next dispatch.
