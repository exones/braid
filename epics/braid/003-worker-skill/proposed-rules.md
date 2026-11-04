# Proposed worker rules for user review

Status: approved design, 2026-11-03; user authorized committing the plan and proceeding with Sol High. This is a design for `braid-worker`, not an active skill. See [epic](epic.md), [source analysis](reports/planning.md), and [backlog](epic.md#prioritized-backlog).

## Operating contract and motivation

### R01: finish one assigned item; keep routine autonomy

Execute the named story, task, or research spike through its agreed evidence and PR delivery. Make routine implementation/dependency choices within scope. Do not launch agents, plan successors, become the coordinator, or award your own delivery Done. If a discovered issue is necessary and inside the acceptance boundary, fix it; otherwise record it and request a scoped decision while continuing independent work.

Why: the current project has one implementation worker and separate review/status ownership. Broad multi-stream autonomy from inspiration would create resource collisions and scope drift here. Repeated permission requests for already-authorized routine work also waste turns.

Proof: a successor-item request in background context causes no successor edits; a routine in-scope fix proceeds without a fresh permission gate. Review remains with the assigned independent reviewer/coordinator.

### R02: separate stable instructions from a complete task packet

The worker loads its skill plus the named project context; it does not reconstruct its role from coordinator prose. The coordinator supplies task path, purpose/scope, acceptance/check set, context/dependency reports and current merge evidence, Git facts, file/resource ownership, output paths, and wait/return contract. Required context must exist in the assigned revision or be explicitly supplied. No parent history, uncommitted parent file, or ignored inspiration directory is assumed.

Read AGENTS and its mandated files once at startup; use a small read index in the checkpoint. Load task-specific references as needed. On resume, refresh changed policy/current checkpoint/task/files; do not reread an entire epic archive without a reason. A packet supplements project policy and cannot weaken acceptance or host rules. Actual Git/PR state is the execution fact; conflicting current instructions are reconciled before the affected action. Historical reports retain their original observations.

Why: exact paths and dependency evidence prevent the stale-status investigation seen in C. Progressive loading reduces repeated context without skipping mandatory project instructions.

Proof: a fresh worker can identify task, branch, checks, dependencies, and exclusions using only the committed packet and named files. A deliberately conflicting packet triggers a precise mismatch report.

### R03: verify a prepared checkout once; use one branch policy

Use T3's bound worktree. Batch root/status/index/HEAD/branch/expected remote verification. A match permits implementation; no routine fetch/full branch inventory/history walk is needed. Default: retain the generated owned `t3/<id>` branch. If the assignment requires a descriptive branch, use one no-track branch creation from the full pinned base SHA. Do not create worktrees in the shell or guess their paths.

Preserve unexpected user changes/index. Diagnose only the mismatch; do not reset, clean, switch another checkout, rebase shared history, force-push, or remove another owner's work. The coordinator prepares/reconciles the base before dispatch. A necessary later base update is explicit and invalidates affected proof.

Why: C already had a base SHA but still inventoried branches and then removed an inherited upstream. A single branch policy removes those choices. Verification protects against stale or misbound context.

Proof: matching/mismatching checkout scenarios; explicit push destination; actual returned worktree path permits later coordinator access with `git -C` after handoff.

### R04: use the project's toolchain and relevant proof

Read current scripts/configuration rather than trusting stale README/toolchain prose. Reuse a valid installed pinned toolchain; install missing dependencies through documented commands. Run focused checks while developing and all item-required gates before delivery. Add regression tests when they establish the changed behavior; use negative controls for a guard. Documentation/skill changes get structural/link and behavioral validation as applicable, without artificial product tests. Avoid rerunning a passed expensive gate unless changes or unresolved concerns justify it.

Record commands, native exit codes, revision, and relevant tool versions. Keep dirty local probes, clean candidate checks, installed-artifact proof, and hosted results distinct. No deleted failing tests, weakened gates, inherited known-failure waivers, or unchecked claims of Linux/crash/runtime behavior.

Why: the seed's Windows/Linux mistakes were real, and inspiration's runtime health failures show why green compilation alone is insufficient. Conversely, blanket full-suite repetition or invented tests add cost without evidence.

Proof: task-appropriate gate selection and a preserved negative-control failure, with no assertion that a docs validator proves CI continuation.

### R05: own a coherent PR and keep evidence tied to its head

After relevant local gates pass, inspect the diff, stage only owned paths, make a Conventional Commit, push explicitly to the owned feature branch, and open/link the PR against the assigned base. Use the host's PR-link rule immediately. Record the actual branch/path/PR and full head SHA. Reuse an existing assigned PR on resume rather than opening another.

Any new pushed commit, including an evidence/documentation fix, needs current-head hosted checks. A result for an old head cannot clear a new one. Avoid circular evidence commits that continually change the SHA: keep the report's checked source revision and PR/run links, put the final delivery head in the handoff, and let coordinator-owned evidence record it externally when appropriate.

Why: explicit destinations prevent upstream ambiguity; exact revision identity prevents stale proof; avoiding self-referential SHA updates saves entire CI cycles.

Proof: a head-change scenario invalidates prior green evidence; a resumed PR is reused; no unrelated index entry is committed.

### R06: wait for green, repair failures, then hand off

Before dispatch, the coordinator names the acceptance check set (including required Windows/Linux jobs even if branch protection is absent), and resolves how the assigned worker waits and resumes. The worker opens its PR and retains ownership through pending checks, diagnoses failures, fixes in-scope causes, pushes, and waits again. Successful handoff requires every declared check to have an acceptable successful conclusion on the current head; skipped, cancelled, missing, or inconclusive results need explicit evaluation against declared criteria and cannot silently count as success. Missing checks on a repository that requires CI are a blocker, not an empty green set.

Do not pass a failed PR to the coordinator to fix or label a pending result complete. Use only a host-supported wait/continuation; no polling loops, forbidden child watches, invented tools, or silent model/provider/role substitutions. Item A must prove this mechanism before normal activation. Parent event relaying is acceptable only if the supported mechanism is proved and the worker still receives the result, performs repairs, verifies the head, and makes the handoff; it is not automatic coordinator takeover.

Why: this is the user's explicit requirement. Current text saying to return a pass *or fail* result is insufficient. Host restrictions are an implementation constraint, not permission to lower delivery standards.

Proof: pending produces only progress/checkpoint; a failed check is repaired by the same worker; a subsequent push requires new proof; final handoff cites all checks and current SHA. If the host cannot support it, the outcome is blocked, not a claimed success.

### R07: report blockers promptly without abandoning ownership

A permission, credential, service outage, missed check trigger, unrelated baseline failure, or necessary scope change can prevent repair. Preserve diagnostics and the failed state, notify the coordinator with the exact nonsecret action/owner/impact, and continue independent in-scope work. If no useful action remains, checkpoint as blocked and stop activity as the host requires; do not loop indefinitely. The worker remains responsible for resuming its item unless the coordinator explicitly reassigns it.

A blocker update can end a conversational turn; it is not a successful delivery handoff. Do not retry unchanged failures until green by chance. One justified rerun for a diagnosed transient issue may be documented when authorized; persistent failure remains visible. Worker messages must distinguish blocked, waiting, locally proven, and ready for acceptance without inventing new persisted statuses.

Why: forbidding failed handoff must not force silence, conceal an outage, or waste unlimited compute. Escalation and completion are different events.

Proof: an infrastructure-failure scenario yields precise evidence and a resume action, with no Done/ready assertion or coordinator product fix disguised as acceptance.

### R08: checkpoint the next action, not the entire transcript

Update the worker-owned checkpoint at meaningful boundaries: initial verification, before a long wait/context replacement, after important proof or push, on failure/blocker, and before final return. Include task/scope, actual root/branch/HEAD and dirty/index ownership, read context, changed files, PR/current check state, in-flight process/task handles and log locations, completed proof, unresolved findings, and one exact next action. Update a compact current checkpoint; keep detailed outcomes in the report and link larger retained logs.

Do not copy private infrastructure identities or secrets into evidence. Do not create a checkpoint after every read-only command or claim a suspended process is still alive after restart.

Why: inspiration's MAP/HVAR checkpoints identify exact gate/PR/SHA, interrupted waiters, worktree exclusions, and resume commands. That is valuable here without their long autonomous infrastructure diaries.

Proof: another session can identify whether to inspect a live task, repair a check, or resume implementation, without the chat transcript.

### R09: reconcile before resuming side effects

On resume, read the owned checkpoint plus required current context, confirm the assigned checkout/branch, inspect actual Git/PR/check/process state, and compare it to the recorded revision. Verify whether the last action completed before retrying commit/push/PR creation or a long check. Reuse valid proof and rerun only invalidated checks. If the checkpoint is stale, update it from observed state rather than replaying its command list blindly.

Why: a continuation is frequently a partial completion, not a fresh task. Preventing duplicate mutations saves time and protects user work.

Proof: interrupted-push/PR/wait and stale-head scenarios produce no duplicate PR, reset, or old-head acceptance.

### R10: keep role, resource, and external authority narrow

Worker owns only its assigned implementation/resources and item report/checkpoint. Coordinator owns epic/shared status, readiness, acceptance, scheduling, and review assignments. Reviewers own their independent review evidence. Stop after the item; do not merge, publish, deploy, access inspiration infrastructure, alter tailnet policy, start successor work, or change the provider profile. Request secrets only through the host mechanism when needed and authorized; never ask for raw values in chat.

Why: inspiration's protected namespaces/one-applier rules generalize to ownership boundaries. Its actual permissions, merge exceptions, attribution identities, tools, paths, and production access do not transfer to braid.

Proof: conflicting-resource and secret-needed scenarios stop only the affected action and report the exact blocker; the worker never awards its own independent approval.

### R11: return evidence a person and a fresh coordinator can use

Return introduced behavior/value, important decisions, validation/limits, unresolved points, actual checkout/branch/full head, PR URL, current-head check results/run links, and exact next coordinator action. Follow the shared report format; keep routine updates short and the final rundown readable with a technical record. Propose shared-status changes instead of editing coordinator-owned files.

Green worker handoff means ready for coordinator acceptance/review, not Done, merged, or released. Keep review findings bound to exact revisions. If later assigned scoped review fixes, repair and revalidate under the same ownership/green rule; do not independently launch a reviewer.

Why: the user wants both the reason for a change and evidence that can survive context loss. Current checkout return also prevents the parent's already-used-worktree checkout error.

Proof: the final packet supports review without reading the worker transcript and makes remaining human merge authority explicit.

### R12: keep policy owners singular and the skill small

Use AGENTS for provider profile/shared authority, the Agile workflow for review naming and Ready/Done, shared delivery rules for delivery invariants, and report-format for reporting. Keep execution steps in `braid-worker`; coordinator guidance links there. Use one assignment asset with placeholders and one host-specific reference only if A justifies it. Normal task execution must not require all inspiration files, every historical report, a new automation service, or hard-coded current model settings.

Why: moving copied prose into another long file would preserve the original cost and drift. A lightweight operational skill is appropriate to the current manual stage.

Proof: every old worker-duty source maps to a retained authority, a link, a moved operational instruction, or a documented obsolete exception; active documents contain no competing failed-handoff rule.

## Approved choices

- Adopt R01–R12, with R06's green-only requirement already confirmed by the user.
- Retain T3's generated branch by default; use descriptive names only when assigned.
- Treat blocked/waiting updates as nonterminal ownership updates, so a worker can surface an unfixable problem without handing off a failing PR.
- Keep the initial skill lightweight and manual; prove CI continuation first, then extract, integrate, and evaluate.
- Keep automatic skill discovery enabled, with a clear boundary excluding goal-level planning and independent review; no new provider settings or permissions.

The user's subsequent "ok go, commit the current plan and go" authorizes execution within the epic and its item boundaries. Start A before downstream implementation. Live trials remain subject to the one-worker/resource boundary and host restrictions; this approval does not authorize merge, release, infrastructure changes, or changes to acceptance standards.
