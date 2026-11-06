# 007: Standalone worker support

Status: in-progress.
The user's merge into `main` marks it done.
Branch: `epic/007-standalone-worker` from `main` at `d4ab2f4`.

## Goal

Let a user hand one bounded task directly to braid-worker and receive a verified PR without creating an epic or involving a coordinator. Preserve the existing assigned-item workflow in the same skill.

## Scope

In: a minimal extension of the existing worker skill with two entry paths; a standalone plan proposed in chat and confirmed by the user before implementation; the usual worktree, item branch and PR without an epic; worker ownership of implementation, CI and all fixes; review by a subagent; necessary routing/documentation updates and validation of both paths.

Out: a second worker skill, new CLI dispatch or state schema, mandatory standalone task files, changing installed skills, releases, and repository-wide model changes.

## Items

Rows are in run order. The user approved execution on 2026-11-06 after reviewing the refined plan.

| ID | Title | Kind | Tier | UI | Depends on | Status | PR | Threads |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A | [Support standalone tasks in the worker skill](items/A.md) | story | L | no | none | in-progress | | |

One cohesive item keeps the worker contract, routing and user guidance consistent in one reviewed PR. Tier L applies because agent instructions change. After implementation and independent review, the user merges the item into this epic; the coordinator then prepares the final PR into main for the user's merge.

## Decisions

- 2026-11-06: User said "Ok go", approving implementation of the refined plan. Launch A with Astra medium, followed by independent Sol medium review; user merge restrictions remain.
- 2026-11-06: Plan only. Do not launch implementation or review until the user explicitly requests execution. The earlier attempt was stopped and removed; this is a fresh plan from current main.
- 2026-11-06: User overrides models for this epic: coordinator `codex / gpt-6-astra / reasoningEffort=medium`; worker `codex / gpt-6-astra / reasoningEffort=medium`; reviewer `codex / gpt-6.1-sol / reasoningEffort=medium`. Use top-level T3 threads with separate worktrees for implementation and review. Verify availability before launch; do not substitute. These overrides do not change repository defaults.
- 2026-11-06: Keep one braid-worker skill. Explicit assigned briefs use the existing epic path; direct bounded user requests use standalone mode. Resolve genuinely ambiguous context before writes.
- 2026-11-06: Standalone mode derives project facts from BRAID.md, targets its main branch, reports to the user, and never merges. It does not require an epic, item ID, coordinator thread, or committed brief.
- 2026-11-06: Independent review is available directly to the user and respects project review requirements. It is not a reason to require a coordinator or automatically spawn another agent without authorization.
- 2026-11-06: User refinement: implement standalone support as a minimal extension, sharing the existing worker steps rather than rewriting the skill or building a parallel workflow. Keep the usual owned worktree, item branch and PR, with a standalone branch such as `item/<task-slug>`; no epic number or item table is required.
- 2026-11-06: The standalone worker first proposes its intended scope, approach and validation plan directly in chat and waits for user confirmation before implementation. The confirmed chat plan is its brief.
- 2026-11-06: In standalone mode the worker alone owns implementation, CI monitoring and fixes, including review findings. It runs independent review as a subagent when review is required/requested, using the configured reviewer model and host delegation mechanism. The reviewer reports findings and does not implement, monitor CI or merge. This supersedes the earlier direct-review arrangement for standalone work. Existing coordinator-led review, including review of this epic's implementation, remains unchanged.
- 2026-11-06: Inspection found coordinator assumptions in the worker skill and README/AGENTS routing. CLAUDE.md includes AGENTS.md. Install-Skills.ps1 already copies complete committed skill folders; no installer or CLI behavior change is currently justified.
- 2026-11-06: Validation must cover workflow behavior with scenario walkthrough evidence, plus the normal gate and CI. Do not claim a prose walkthrough proves live agent behavior or add brittle tests that merely match instruction wording.
