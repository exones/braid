# 007: Standalone worker support

Status: planning.
The user's merge into `main` marks it done.
Branch: `epic/007-standalone-worker` from `main` at `d4ab2f4`.

## Goal

Let a user hand one bounded task directly to braid-worker and receive a verified PR without creating an epic or involving a coordinator. Preserve the existing assigned-item workflow in the same skill.

## Scope

In: two worker entry paths; safe checkout ownership; direct scope/blocker escalation; PR targeting, CI, reporting, artifacts and resumption without epic bookkeeping; routing and usage documentation; independent review without a coordinator; validation of both paths.

Out: a second worker skill, new CLI dispatch or state schema, mandatory standalone task files, changing installed skills, releases, and repository-wide model changes.

## Items

Rows are in run order. Execution is on hold until the user approves this plan; `ready` indicates dependencies are satisfied, not permission to launch.

| ID | Title | Kind | Tier | UI | Depends on | Status | PR | Threads |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A | [Support standalone tasks in the worker skill](items/A.md) | story | L | no | none | ready | | |

One cohesive item keeps the worker contract, routing and user guidance consistent in one reviewed PR. Tier L applies because agent instructions change. After implementation and independent review, the user merges the item into this epic; the coordinator then prepares the final PR into main for the user's merge.

## Decisions

- 2026-11-06: Plan only. Do not launch implementation or review until the user explicitly requests execution. The earlier attempt was stopped and removed; this is a fresh plan from current main.
- 2026-11-06: User overrides models for this epic: coordinator `codex / gpt-6-astra / reasoningEffort=medium`; worker `codex / gpt-6-astra / reasoningEffort=medium`; reviewer `codex / gpt-6.1-sol / reasoningEffort=medium`. Use top-level T3 threads with separate worktrees for implementation and review. Verify availability before launch; do not substitute. These overrides do not change repository defaults.
- 2026-11-06: Keep one braid-worker skill. Explicit assigned briefs use the existing epic path; direct bounded user requests use standalone mode. Resolve genuinely ambiguous context before writes.
- 2026-11-06: Standalone mode derives project facts from BRAID.md, targets its main branch, reports to the user, and never merges. It does not require an epic, item ID, coordinator thread, or committed brief.
- 2026-11-06: Independent review is available directly to the user and respects project review requirements. It is not a reason to require a coordinator or automatically spawn another agent without authorization.
- 2026-11-06: Inspection found coordinator assumptions in the worker skill and README/AGENTS routing. CLAUDE.md includes AGENTS.md. Install-Skills.ps1 already copies complete committed skill folders; no installer or CLI behavior change is currently justified.
- 2026-11-06: Validation must cover workflow behavior with scenario walkthrough evidence, plus the normal gate and CI. Do not claim a prose walkthrough proves live agent behavior or add brittle tests that merely match instruction wording.
