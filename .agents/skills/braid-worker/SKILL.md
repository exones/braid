---
name: braid-worker
description: Execute or resume one assigned braid implementation story, task, documentation change, research spike, or scoped fix through current-head green PR checks. Use for assigned execution, not goal-level epic planning, orchestration, or independent review.
---

# Braid worker

Complete only the assigned item. Make routine in-scope choices; do not launch agents, schedule successors, run a coordinator loop, or award independent approval/Done.

## Establish the assignment

Use the supplied packet; [assignment-packet.md](assets/assignment-packet.md) is the compact authoring template when facts are missing. Required context must be committed in the bound checkout or explicitly supplied: no parent chat, dirty parent files, or ignored inspiration dependency. Resolve conflicting current instructions before the affected action; historical reports are evidence, not commands to replay.

Read [AGENTS](../../../AGENTS.md), its mandatory project context, the assigned epic/current checkpoint/item and dependency reports once at startup. Follow the packet's assigned epic rather than an older global pointer. Record a short read index. Load additional task references only when needed; on resume refresh changed policy, assignment, shared checkpoint and relevant files rather than rereading the archive.

Keep maintained authorities singular:

- [AGENTS](../../../AGENTS.md#providers-and-roles): provider selection, role/resource authority, project constraints. Do not copy settings into this skill or change the profile.
- [Agile workflow](../../../docs/agile-workflow.md#definition-of-ready) and [review conventions](../../../docs/agile-workflow.md#review-gates-and-indexing): Ready/Done and independent review.
- [Shared delivery rules](../braid-coordinate/references/delivery.md): commit/PR/history/merge invariants. **Successful worker handoff requires current-head green checks; legacy pass-or-fail handoff wording cannot permit a failed delivery.**
- [Report format](../../../epics/report-format.md): the single human-first report, trigger, and pull-request contract. Do not keep a second briefing procedure.

Require task/scope, dependencies and actual merge evidence, Git contract, ownership, outputs, acceptance/check set, and supported wait/return mechanism. Request missing facts from the coordinator with exact impact; continue independent work that does not depend on them. A packet cannot weaken acceptance or host restrictions.

## Verify the prepared checkout

Use the host-bound checkout. In one bounded batch compare actual root, `git status --short`, staged diff/index, full HEAD, current branch and expected remote URL against the packet. A match permits work without routine fetch, branch inventories or history rediscovery.

Retain the generated owned branch by default. Only when explicitly assigned, create one descriptive no-track branch from the full pinned base SHA. Never create child worktrees in the shell or guess paths. Preserve unexpected user changes/index; diagnose only the mismatch before affected edits or Git mutations. Do not reset, clean, silently switch/base-update/rebase, force-push or remove another owner's work. Ask the coordinator to reconcile an unexpected base; an authorized later base change invalidates affected proof.

## Implement and prove the item

Stay within assigned files/resources; coordinator owns epic/shared status, readiness, scheduling, acceptance and review assignments. Workers own implementation and item report/checkpoint. Report necessary scope expansion or resource conflicts while continuing independent in-scope work. No merge, publish, deploy, tailnet/account changes or inherited infrastructure authority. Use only authorized resources; request a needed secret through the host secret mechanism, never raw values in chat or evidence.

Read relevant scripts/configuration, reuse a valid pinned toolchain and install missing dependencies by the documented route. For a released-controller run, retain its pin outside the candidate checkout and record controller/schema versions; do not silently upgrade an active run. Choose focused checks for development and run all item-required local gates. Add meaningful regressions/negative controls for changed behavior where warranted; documentation/skill work needs structural/link/scenario proof, not product tests matching prose.

Record exact commands, native exit codes, tool versions and checked revision. Distinguish dirty local probes, clean committed checks, installed-artifact proof and hosted CI. Preserve acceptance: never weaken gates, delete a failing test to pass, or import a known-failure waiver. Avoid repeating passed expensive checks unless changes/failures/unresolved concerns justify it.

## Deliver through green checks

After local gates pass, inspect the scoped diff/index, stage only owned paths, make coherent Conventional Commits and push explicitly to the assigned remote and owned branch (for example `git push origin HEAD:refs/heads/<owned-branch>`). Create one PR against the assigned base and immediately call the host's PR-link tool as the next call; also link after a later push. Write the PR body with the [human account and technical record](../../../epics/report-format.md#pull-request-records), including when `--body-file` bypasses the repository template. Preserve real dependency ordering. Do not treat an unmerged prerequisite as merged, and do not start a successor. Reuse an existing assigned PR on resume.

Before waiting, record actual root/branch/full HEAD/PR and the frozen check set. Require a supported host continuation; for T3 read [t3-continuation.md](references/t3-continuation.md) before PR waiting. Other hosts need their own supported mechanism supplied or a precise transport blocker, not an invented direct CI wait. No child watches, polling loops, schedulers or background watchers.

Retain item ownership while checks are pending or blocked, even when a conversational turn/task ends. These returns are **nonterminal progress**, never successful handoff. On a failure wake/resume, independently inspect current PR/head, exact run/attempt/job/step logs and scope. Repair in-scope causes yourself, run relevant local gates, commit/push/link and wait for new-head proof. Parent transports events; it does not inherit repair ownership. No blind retries; a diagnosed transient rerun needs appropriate authority and a recorded reason.

On a real event or explicit reconciliation, verify **every declared current-head check** independently: actual PR head, workflow/event/run/attempt/job identities, successful conclusions, required steps/uploads and artifact/provenance evidence. PR merge-test source can differ from PR head; preserve both and verify their relationship. Branch protection or a “checks passed” hint cannot shrink the packet's check set. Pending, failed, missing, skipped, cancelled, neutral, inaccessible, inconclusive or stale evidence never silently counts green. Reconfirm current head after proof before handoff. Every added commit, including docs/evidence, invalidates old-head hosted proof; avoid self-SHA evidence-push loops by distinguishing post-push supplements from checked Git blobs.

For infrastructure, access, trigger, transport or out-of-scope failure: preserve diagnostics and state; promptly report exact nonsecret owner/action/impact and a resume action. Continue useful independent work; if none remains, checkpoint/yield blocked under host rules without abandoning ownership or claiming completion.

## Checkpoint, resume and return

Update the owned checkpoint after initial verification, before waits/context replacement, after important proof/push, on blockers and before return. Keep it actionable: task/scope; actual root/branch/full HEAD and dirty/index ownership; read index; changed paths; PR/current checks and proof; controller/schema if applicable; live task/process handles and log locations; unresolved findings/blockers; one exact next action. Put detail in the report, not a second transcript. Do not checkpoint every read or assume a process survives restart.

On resume, compare the checkpoint to actual Git/PR/check/process/task/transport state before side effects. Determine whether interrupted commit/push/PR/check actions completed; reuse the existing branch/PR and valid proof rather than replaying mutations. Reconcile stale/duplicate events by current head/run/attempt; record observed state and explicit task lineage, never invent a surviving task or subscription. Refresh only relevant context.

Successful green return follows [report format](../../../epics/report-format.md#human-account): opening, What changed, Why, Left for you, and Technical record. Include decisions, changed outputs, local and hosted evidence, limits, actual root, branch, full head, PR and run links, and the exact next coordinator action. Propose shared-status updates instead of editing coordinator-owned files. Green means ready for coordinator acceptance and independent review. Review, triage, human-approved merge, and Done remain separate. Later assigned scoped fixes follow the same green rule. Stop after the item.
