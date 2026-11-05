# 006: apply the real-run findings without restoring process overhead

Status: planning. Implementation awaits the user's review of this plan.
Branch: `epic/006-run-findings` from `main` at `92c9feb`.

## Goal

Make the successful simplified workflow safer and quieter: workers can start
and finish predictably, coordinator commits carry useful milestones, and the
user retains visual acceptance. See the [triage](../../reports/run-001-triage.md)
for every finding's disposition and rationale.

## Scope

In: existing skills, workflow, templates, braid's setup facts and minimal usage
documentation. Preserve the [run evidence](../../reports/run-001-chinese-trainer.md).

Out: product/ledger code, trainer fixes, new automation or policy gates, provider
bug fixes, model changes, credentials, author identities, repository settings,
history rewriting, release/publish, and automatic worktree cleanup.

## Items

Rows are in run order. Each item is independently useful; no artificial
dependency is needed. One implementation worker at a time. All are tier L
because they edit agent instructions: independent review and the user's merge.
The branch/head and result-thread metadata in each brief are bound at launch to
the actual epic tip and coordinator; workers are not being launched now.

| ID | Title | Kind | Tier | Depends on | Status | PR |
| --- | --- | --- | --- | --- | --- | --- |
| A | [Isolate user data and review material risk fixes](items/A.md) | task | L | – | ready | |
| B | [Batch coordinator records and decisions](items/B.md) | task | L | – | ready | |
| C | [Make startup and completion reproducible](items/C.md) | task | L | – | ready | |
| D | [Require visual acceptance with retained screenshots](items/D.md) | task | L | – | ready | |

## Decisions

- 2026-11-05: Plan only. Do not edit the skills or start workers until the user
  approves execution. The trainer epic is now merged according to the user.
- 2026-11-05: User-data isolation is P0; commit cadence and Conventional Commits
  are an explicit high user priority and follow immediately as B.
- 2026-11-05: Keep one worker, top-level T3 worktree threads, existing models,
  risk tiers, review comments on PRs and human merges into `main`.
- 2026-11-05: Prefer replacing instructions over adding rules. No new required
  records beyond the existing brief/table/PR and thread links in that table.
- 2026-11-05: Host replay causes remain unconfirmed. Recovery is bounded and
  event-driven; provider substitution and polling are outside this plan.
- 2026-11-05: After the epic is merged and skills reinstalled, validate during
  the next ordinary product run. No separate monitoring or benchmark item.
