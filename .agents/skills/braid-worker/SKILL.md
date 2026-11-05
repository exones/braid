---
name: braid-worker
description: Execute or resume one assigned braid implementation story, task, documentation change, research spike, or scoped fix through current-head green PR checks. Use for assigned execution in any target project, not goal-level epic planning, orchestration, or independent review.
---

# Braid worker

Complete only the assigned item. Make routine in-scope choices; do not launch agents, schedule successors, run a coordinator loop, or award independent approval/Done.

## Initial entry: context and checkout

Use the shared [workflow map](../../../docs/directory-structure.md) only for Braid records. Target layout, architecture and checks come from project instructions and the approved brief, not Braid's repository. Workflow links resolve in the skill installation; project-context paths resolve in the target checkout.

Open the exact supplied filled-packet path; do not search for it or routinely load the blank [coordinator authoring template](assets/assignment-packet.md). Read applicable target-project instructions, this skill, the assigned item and read-now context once; assignment paths override global pointers. Keep a short read index. These skills cannot waive another project's mandatory instructions; unresolved conflicts go back to the coordinator before affected actions.

Use the packet's separate read-now context, verified dependency facts with exact evidence references, and on-demand history. Accept recorded dependency/merge facts unless inputs change or evidence contradicts them; independently verify your checkout and your own acceptance evidence. Required context must be committed or explicitly supplied, not dependent on parent chat/dirty files/ignored inspiration. Historical reports support re-evaluation when needed, not routine startup.

Use singular authorities: [Agile workflow](../../../docs/agile-workflow.md) for Ready/Done/review; [delivery rules](../braid-coordinate/references/delivery.md) for Git and green-only handoff; [report format](../../../epics/report-format.md) for reports/PRs. Load relevant sections as needed. Legacy wording cannot permit failed handoff.

Require scope, dependency/merge evidence, Git/ownership contract, outputs, check set and supported continuation. Report missing facts and impact to the coordinator; continue independent work. The packet cannot weaken acceptance or host restrictions.

In one batch compare host-bound root, status/staged index, full HEAD, branch, origin and expected upstream state against the packet. A new branch without upstream is normal when declared; use the explicit first push destination. A match needs no routine fetch, upstream repair, history or branch inventory: perform the packet's concrete first useful action. Stay on the packet's named item branch, started from the accepted epic tip. Retain a generated branch only when the packet explicitly assigns that legacy route. On the initial batch, a missing checkout, a detached HEAD, or a branch or head that differs from the packet stops the affected writes. Never create child worktrees in the shell, guess a path, rename the bound branch, or repair the binding. Preserve unexpected changes/index; reconcile only the mismatch before affected actions. No reset/clean, silent base switch/rebase or force-push. Authorized base changes invalidate affected proof.

## Resumed entry: checkpoint first

Open the named worker checkpoint first to recover phase, ownership, existing PR/head, continuation generation and next action. Refresh applicable instructions and changed policy as needed. Before side effects, reconcile only relevant actual Git/PR/check/process/task/transport state, including whether interrupted commit/push/PR/check operations completed. Reuse the existing branch/PR and valid proof; continue the recorded action without replaying the original implementation prompt or architecture research.

Reconcile stale/duplicate events by current head/run/attempt; record observed state and explicit task lineage. Do not assume a subscription or process survived, create another PR, or repeat readiness registration without a demonstrated need. Concrete contradictions, changed dependencies and high-risk ambiguity still warrant investigation before affected work.

Naturally observed repeated apparent final/yield responses while the same host run stays active and its intended continuation remains queued are a host/transport blocker, not ordinary pending CI. Preserve state, send one explicit blocker through the assigned return channel, report it and stop ordinary execution under host rules; do not replay startup or add readiness generations. For T3 use [stalled yield recovery](references/t3-continuation.md#stalled-yield-recovery).

## Execute first; investigate incrementally

Treat the coordinator's approved brief as the implementation plan. Reopen architecture only for concrete contradictions, missing decisions or risk uncovered by evidence; report material changes before dependent work.

After mandatory context and checkout checks, take the smallest meaningful action: inspect the named function, run a targeted test, reproduce the issue or make a bounded edit. Use a short internal plan for well-defined work, not a second planning deliverable.

- Simple known change: inspect, edit, check. Specified CLI command: inspect adjacent patterns, make a short plan, implement and test. Unfamiliar crash/recovery behavior: investigate alternatives and failure modes before changing the protocol.
- Search named paths/symbols with `rg`; read relevant sections before whole files/directories. Expand only when findings justify it. Batch independent operations and request only relevant diffs, logs and failures.
- Reuse facts already read. Reinspect only for a new question, changed state or required revision verification. If investigation yields no actionable finding, decide whether enough is known to act; further exploration needs a concrete question affecting correctness or proof. No rigid time/tool limits.

## Implement and prove the item

Stay within assigned ownership. Coordinator owns shared epic/status and scheduling; worker owns implementation and item report/checkpoint. Report scope/resource conflicts without blocking independent work. Follow AGENTS security/resource boundaries: no merge/publish/deploy/account/tailnet changes; obtain secrets only through the host mechanism, never chat or evidence.

Reuse the pinned toolchain; install missing dependencies by documented routes. Released controllers stay pinned outside the candidate checkout; record controller/schema versions, never silently upgrade active runs. Use focused development checks, then all required local gates. For this repository, `npm run verify` is the deterministic offline pre-PR gate for code and docs. Run it before opening the pull request. External skill validators stay separate: when a change edits skill content, run them and report that result on its own, including when they are unavailable in CI. Add meaningful regressions when warranted; skill/docs changes need structural/link/scenario proof, not tests matching prose.

Record commands, exit codes, versions and revision; distinguish dirty probes, clean checks, installed-artifact proof and hosted CI. Never weaken a gate, delete failing tests to pass or inherit failure waivers. Repeat passed expensive checks only for relevant changes, failures or unresolved concerns.

## Deliver through green checks

After local gates pass, inspect the scoped diff/index, stage only owned paths, make coherent Conventional Commits and push explicitly to the assigned remote and owned branch (for example `git push origin HEAD:refs/heads/<owned-branch>`). Create one PR against the assigned base and immediately call the host's PR-link tool as the next call; also link after a later push. Write the PR body with the [human account and technical record](../../../epics/report-format.md#pull-request-records), including when `--body-file` bypasses the repository template. Preserve real dependency ordering. Do not treat an unmerged prerequisite as merged, and do not start a successor. Reuse an existing assigned PR on resume.

Before waiting, include actual root/branch/full HEAD/PR and the frozen check set in the return message. Require a supported host continuation; for T3 read [t3-continuation.md](references/t3-continuation.md) before PR waiting. A top-level item thread links its pull request and watches it, then runs the one catch-up snapshot in that reference. If every declared check has already finished, verify and deliver in that same turn; otherwise end the turn. One watch wake drives verification and a single result to the coordinator. A delegated child does not watch or poll; the legacy parent relay applies only when the packet explicitly selects it. Other hosts need their own supported mechanism supplied or a precise transport blocker, not an invented direct CI wait. No polling loops, schedulers, or background watchers.

Retain item ownership while checks are pending or blocked, even when a conversational turn/task ends. These returns are **nonterminal progress**, never successful handoff. On a failure wake/resume, independently inspect current PR/head, exact run/attempt/job/step logs and scope. Repair in-scope causes yourself, run relevant local gates, commit/push/link and wait for new-head proof. The coordinator dedupes results by head and does not inherit repair ownership. No blind retries; a diagnosed transient rerun needs appropriate authority and a recorded reason. Do not send another result for a head already reported.

On a real event or explicit reconciliation, verify **every check the packet declares** independently: actual PR head, workflow/event/run/attempt/job identities, successful conclusions, and required steps and uploads, including artifact digest and provenance when the packet declares them. A packet may explicitly declare artifact verification not required (for example a docs-only change); the report then says so. PR merge-test source can differ from PR head; preserve both and verify their relationship. Branch protection or a “checks passed” hint cannot shrink the packet's check set. Pending, failed, missing, skipped, cancelled, neutral, inaccessible, inconclusive or stale evidence never silently counts green. Reconfirm current head after proof before handoff. When the target checkout provides `scripts/Test-PrProof.ps1`, produce this proof by running that command. It is a finite snapshot: one `PASS`, `FAIL`, or `PENDING` line plus JSON, and it exits 0 only for `PASS`. Full artifact mode is the default. Pass `-SkipArtifacts` only when the packet explicitly waives artifact verification; the JSON records that limitation, and a download or proof failure never selects the switch. The prose check set above remains the definition. The command is outside `npm run verify` and does not watch or poll. Accept a PASS for an active pull request only when `proofScope` is `current`. A historical PASS is a merged snapshot and is not current readiness. Every added commit, including docs or evidence, invalidates old-head hosted proof. Record files after that push follow [Commit boundary](../../../docs/agile-workflow.md#commit-boundary).

For infrastructure, access, trigger, transport or out-of-scope failure: preserve diagnostics and state; promptly report exact nonsecret owner/action/impact and a resume action. Continue useful independent work; if none remains, yield blocked under host rules without abandoning ownership or claiming completion. Post-push blockers use the PR comment and result, without editing committed records ([Commit boundary](../../../docs/agile-workflow.md#commit-boundary)).

## Checkpoint, resume and return

Update the owned checkpoint before the push that publishes it. A later update belongs only in a repair commit ([Commit boundary](../../../docs/agile-workflow.md#commit-boundary)). Keep it actionable: task/scope; actual root/branch/full HEAD and dirty/index ownership; read index; changed paths; PR/current checks and proof; controller/schema if applicable; live task/process handles and log locations; unresolved findings/blockers; one exact next action. Put detail in the report, not a second transcript. Do not checkpoint every read or assume a process survives restart.

Use the resumed-entry procedure above after continuation or context replacement; fewer history reads never reduce required current-head checks. If this run already sent the result for the current head, stop without sending another. A repeated reading of the launch prompt inside the same run is not a new assignment. The launch prompt stays short and step-explicit; do not expand it into a resume narrative.

Successful green return follows [report format](../../../epics/report-format.md#human-account): opening, What changed, Why, Left for you, and Technical record. Include decisions, changed outputs, local and hosted evidence, limits, actual root, branch, full head, PR and run links, and the exact next coordinator action. Propose shared-status updates instead of editing files the coordinator writes ([Record ownership](../../../docs/agile-workflow.md#record-ownership)). Green means ready for coordinator acceptance and independent review. Review, triage, human-approved merge, and Done remain separate. Later assigned scoped fixes follow the same green rule. Stop after the item.
