---
name: braid-worker
description: Execute or resume one assigned braid implementation story, task, documentation change, research spike, or scoped fix through current-head green PR checks. Use for assigned execution, not goal-level epic planning, orchestration, or independent review.
---

# Braid worker

Complete only the assigned item. Make routine in-scope choices; do not launch agents, schedule successors, run a coordinator loop, or award independent approval/Done.

## Establish context and checkout

Use the supplied [assignment packet](assets/assignment-packet.md). Read [AGENTS](../../../AGENTS.md), its mandated context, assigned epic/checkpoint/item and dependency reports once; assignment paths override global pointers. Keep a short read index. Required context must be committed or explicitly supplied, not dependent on parent chat/dirty files/ignored inspiration. Resolve current conflicts before affected actions; historical reports are evidence, not commands.

Use singular authorities: [Agile workflow](../../../docs/agile-workflow.md) for Ready/Done/review; [delivery rules](../braid-coordinate/references/delivery.md) for Git and green-only handoff; [report format](../../../epics/report-format.md) for reports/PRs. Load relevant sections as needed. Legacy wording cannot permit failed handoff.

Require scope, dependency/merge evidence, Git/ownership contract, outputs, check set and supported continuation. Report missing facts and impact to the coordinator; continue independent work. The packet cannot weaken acceptance or host restrictions.

In one batch compare host-bound root, status/staged index, full HEAD, branch and expected remote against the packet. A match needs no routine fetch/history/branch inventory. Retain the generated branch unless explicitly assigned a no-track branch from a pinned full SHA. Never create child worktrees in the shell or guess paths. Preserve unexpected changes/index; reconcile only the mismatch before affected actions. No reset/clean, silent base switch/rebase or force-push. Authorized base changes invalidate affected proof.

## Execute first; investigate incrementally

Treat the coordinator's approved brief as the implementation plan. Reopen architecture only for concrete contradictions, missing decisions or risk uncovered by evidence; report material changes before dependent work.

After mandatory context and checkout checks, take the smallest meaningful action: inspect the named function, run a targeted test, reproduce the issue or make a bounded edit. Use a short internal plan for well-defined work, not a second planning deliverable.

- Simple known change: inspect, edit, check. Specified CLI command: inspect adjacent patterns, make a short plan, implement and test. Unfamiliar crash/recovery behavior: investigate alternatives and failure modes before changing the protocol.
- Search named paths/symbols with `rg`; read relevant sections before whole files/directories. Expand only when findings justify it. Batch independent operations and request only relevant diffs, logs and failures.
- Reuse facts already read. Reinspect only for a new question, changed state or required revision verification. If investigation yields no actionable finding, decide whether enough is known to act; further exploration needs a concrete question affecting correctness or proof. No rigid time/tool limits.

## Implement and prove the item

Stay within assigned ownership. Coordinator owns shared epic/status and scheduling; worker owns implementation and item report/checkpoint. Report scope/resource conflicts without blocking independent work. Follow AGENTS security/resource boundaries: no merge/publish/deploy/account/tailnet changes; obtain secrets only through the host mechanism, never chat or evidence.

Reuse the pinned toolchain; install missing dependencies by documented routes. Released controllers stay pinned outside the candidate checkout; record controller/schema versions, never silently upgrade active runs. Use focused development checks, then all required local gates. Add meaningful regressions when warranted; skill/docs changes need structural/link/scenario proof, not tests matching prose.

Record commands, exit codes, versions and revision; distinguish dirty probes, clean checks, installed-artifact proof and hosted CI. Never weaken a gate, delete failing tests to pass or inherit failure waivers. Repeat passed expensive checks only for relevant changes, failures or unresolved concerns.

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
