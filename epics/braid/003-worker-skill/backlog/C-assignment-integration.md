# C: integrate assignments and remove duplicated worker duties

Kind: task. Epic: [BRAID-003](../epic.md).
Status: backlog. Owner: one implementation worker under the current provider profile.
Depends on: B delivered/reviewed; A mechanism available; approved rule set; safe ownership boundary for shared policy edits.

## Read first

[AGENTS](../../../../AGENTS.md), README, [workflow](../../../../docs/agile-workflow.md), [decisions](../../../../docs/decisions.md), [epic](../epic.md), [current checkpoint](../checkpoints/current.md), [rules](../proposed-rules.md), [source map](../reports/planning.md#instruction-ownership-and-migration), `reports/A.md`, `reports/B.md`, current worker/coordinator skills, their references, handoff guide, and report format.

## Value

Coordinators generate a small, complete assignment instead of copying an execution handbook. Workers discover their own skill and receive current dependency/base/check facts. Shared policy has one authority, so later edits do not recreate conflicting handoff rules.

## Scope and non-goals

Update worker routing in AGENTS; coordinator worker-dispatch prose and delegation reference; shared delivery wording; and the manual assignment example in `docs/agent-handoff.md`. Link the packet asset rather than maintaining several competing packet templates. Update Agile/decision/reporting documents only where an actual shared invariant or cross-reference requires it. Preserve the user's newer provider-profile edits; do not copy their values into skills.

Replace current pass-or-fail handoff wording with the approved green-only invariant, link the worker operational lifecycle, and keep coordinator acceptance/human merge authority intact. Clarify committed context, current dependency evidence, actual returned worktree, and shared versus isolated checkout modes. Do not repair unrelated historical epic status, rename existing IDs/reviews, relocate all docs for aesthetics, or change product/CI scripts. README gets at most a necessary stable contributor link, never a progress dashboard.

## Acceptance criteria

1. Given the source inventory, every dispersed worker instruction is retained as shared authority, moved to the worker skill, replaced by a reference, or explicitly identified as obsolete historical text. No active duplicate rule allows failing/pending PR handoff.
2. Given a fresh coordinator assignment, the packet includes exact skill/task/context/dependency/base/branch/remote/ownership/gates/wait/outputs/return facts. Provider settings remain sourced from AGENTS at dispatch time.
3. Given isolated dispatch, the packet's required files are committed and accessible at the assigned revision; no uncommitted parent checkpoint is assumed. For an expressly shared checkout, the packet names the existing dirty/index ownership and allowed operations rather than demanding destructive cleanup.
4. Given worker handback, the coordinator uses the returned checkout/branch/HEAD and current-head green evidence at a safe boundary; it does not blindly check out a branch occupied by another worktree or take over pending/failing implementation.
5. Routing/link/skill validation and exact-diff review pass; historical reports/settings/IDs and unrelated user edits are preserved. Plan/worker/reviewer entrypoints remain distinguishable.

## Tasks

- [ ] Reconcile active ownership and re-read current policy, preserving concurrent user changes.
- [ ] Apply the source-map migration and update the manual assignment to reference the canonical packet.
- [ ] Validate links/routing and record changed authorities/removed duplication in `reports/C.md` and `checkpoints/C.md`.

## Ownership and verification

Own the agreed policy/routing files listed above, necessary links to B's asset, this item's delivery fields, and C report/checkpoint. The coordinator still owns epic/shared checkpoint and review scheduling. Link validation and skill structural checks are local proof; existing required Windows/Linux PR CI must pass for delivery. Do not weaken CI for docs.

## Review and delivery

Independent parent-scoped pass `C-assignment-integration-review-001` checks preservation, authoritative links, complete packet, and policy consistency on the exact candidate. Follow the [review convention](../../../../docs/agile-workflow.md#review-gates-and-indexing). Scoped Conventional Commit/PR, green current-head CI, review/triage, and human-approved merge are required. No PR/revision/check result exists yet.

## Report and resume

Follow [report-format](../../../report-format.md). Write `reports/C.md` and `checkpoints/C.md`, with source disposition, user-edit preservation, evidence/limits, actual checkout/branch/head/PR, and proposed shared updates. Stop after C; do not launch D or rewrite the other epics.
