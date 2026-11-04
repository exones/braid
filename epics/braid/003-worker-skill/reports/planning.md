# BRAID-003 planning: a worker skill that preserves ownership and context

Status: planning analysis complete; implementation unstarted. Date: 2026-11-03.
Checkout: `C:\code\agento`, branch `main`, HEAD `acd87301c8c267b7b89651c1e2b01913d6c84692`.
Observed local `origin/main`: `0f2dd8637be8f87237c5622c8314aea28b9068ac` (local main behind three commits). No fetch, merge, switch, staging, or commit was performed for this plan. Future execution must reconcile its actual base and ownership at a safe boundary.

## Outcome and request boundary

The user requested an epic and thorough, motivated analysis before approving rules for a separate worker skill. The concrete proposal is [proposed-rules.md](../proposed-rules.md); the ordered scope is [epic.md](../epic.md). Four backlog items cover capability proof, worker skill, integration, and behavior proof. This is a reviewable plan, not an implemented or activated worker skill.

Confirmed requirement: a worker waits for checks on PRs it creates, repairs failing checks, and does not hand off a failing PR. This supersedes the current project wording that permits a finished pass-or-fail handoff. The active policy files are not changed by this planning turn; the planned integration item must reconcile that wording. The user explicitly set the stopping boundary: inspect these rules with them before implementation.

## Observed project constraints

- The CLI currently tracks a manual ledger. Product dispatch/messaging/coordination/recovery are later roadmap stages. A workflow skill does not need a new run-state engine or controller installation.
- Current implementation uses TypeScript/Node.js plus PowerShell. `scripts/Verify.ps1` selects the project toolchain and runs the install-policy fixture, typecheck, build, tests, and external packed-install proof in this checkout. GitHub Actions runs Windows and Ubuntu verification/upload jobs. Their configured existence is not a claim that a particular future head passed.
- Provider/model/options now have one authoritative AGENTS profile. Existing dirty user changes explicitly centralize it. Do not re-embed historical settings in a new skill or template.
- Coordinator owns epic/shared checkpoint and acceptance; workers own item implementation/report/checkpoint; separately assigned reviewers own their review evidence. Keep one implementation worker at a time.
- Isolated T3 children receive supplied task text without parent history and omit uncommitted parent files. A required current checkpoint that exists only in the coordinator's dirty tree cannot be assumed visible.
- When inspected for this analysis, epic 002/current checkpoint contained old planning/dependency/path statements. Other epic 002 files changed concurrently later in the turn. Treat the inspected mismatch as evidence for better dispatch preparation, not a claim about the latest external edits or authorization to rewrite another epic or its assignment.

## Why startup is slow, and what this proposal addresses

The earlier [Git analysis](../../002-trusted-publish/reports/git-handoff-analysis.md) records a C worker given an exact base SHA and desired branch. It still listed all branches, inspected history, created a feature branch tracking origin/main, and then unset that upstream. Approximately 8m50 elapsed before final branch setup, mixed with required reading, implementation design, and CI-tool investigation. Three Git invocations are identified; this is not eight minutes of Git execution or a controlled performance baseline.

The parent also attempted to check out a branch already bound to the worker's worktree. This motivates returning the actual checkout path, not merely the branch name. The proposed packet resolves prepared-checkout semantics, one branch policy, current merge evidence, committed context, check ownership, and exact outputs. It does not remove verification or mandated reads. Checkpoint/resume rules address another cost: replaying actions after context replacement.

The prior report is supplementary evidence currently present in the workspace; the essential findings are retained here so future worker execution does not depend on uncommitted analysis artifacts. The coordinator must commit all required context before isolated delivery.

## Inspiration analysis: retain principles, reject inherited authority

Read ignored `inspiration/` explicitly using `rg --hidden --no-ignore` and direct file reads. This was a representative selection of reusable briefs/checkpoints, not an exhaustive reading of every report, binary, or data file. The table preserves the relevant lesson without requiring future workers to read this ignored archive. File identifiers below are local source paths, not new permissions or runtime dependencies.

| Local source under inspiration/ | Lesson retained for braid | Adaptation or exclusion, and why |
| --- | --- | --- |
| `README.md` | One maintained status source; durable briefs/reports; milestone checkpoints; no secrets. | Use braid's current epic/item vocabulary and ownership. Do not add a second prompts/status tree when the backlog and packet already supply it. |
| `sfil/001-staging-merge-and-upgrade/prompts/B-lts-port.md` | Read the actual prerequisite analysis; order small changes; targeted proof during implementation; checkpoint actual PR/SHA/outcome. | One assigned item/PR at this stage. Reject self-created worktrees, automatic admin merges, frequent rebases, worker-launched reviews, and hard-coded attribution/provider identities. |
| `sfil/001-staging-merge-and-upgrade/prompts/G-workflow-proof.md` | Prove the user-visible workflow, record pre-existing failures separately, protect other resource owners. | Use installed CLI/package/CI proof relevant to the item. No inherited deployment namespace, production data, token access, or baseline-failure exception. |
| `sfil/001-staging-merge-and-upgrade/prompts/K-verification.md` | Build-green can coexist with runtime failure; check the actual promised outcome and fail visibly. | Retain meaningful proof and honest limits. Do not implement deployment rollback, nightly environments, scans, schedules, or notifications merely because inspiration has them. |
| `sfil/001-staging-merge-and-upgrade/prompts/L-stability-performance.md` | Profile/compare rather than guess; preserve reference inputs; respect resource exclusion; review at meaningful milestones. | Record startup categories and one bounded trial; no arbitrary speedup promise, global performance project, known-failure waiver, or permission to stop another owner's processes. |
| `sfil/001-staging-merge-and-upgrade/prompts/M-automapper.md` | Safety net before risky change; avoid using scarce CI as a local compiler; continue useful work around unrelated missing input. | Relevant local gates first, same-worker CI repair, precise blockers. No dependency/license migration or fixed inherited test-count floor. |
| `sfil/001-staging-merge-and-upgrade/checkpoints/L2a-C-evidence.md` | Negative controls and representative evidence need explicit limits; investigate a wrong reference instead of changing correct behavior just to match it. | Do not weaken tests or claim broad correctness from a small sample. Keep engineering proof proportional; no imported pricing/domain implementation. |
| `everix/007-mapping-replacement/checkpoints/MAP-progress.md` | Exact candidate, gate/log handles, interrupted waiter, and concrete restart steps survive long context/restarts. | Compact current checkpoint plus report. No elaborate event ledger, automatic merge, external services, or assumed process liveness after restart. |
| `everix/011-historical-var/checkpoint.md` | Assigned worktree exclusion, dependency-specific readiness, exact gate/PR state, and a resume command. | Verify actual state before retry. Reject inherited gate waivers/production credentials and machine-specific shell commands. |

These sources explain the motivations for R01–R12; they are not authoritative braid policy. The proposal intentionally retains the reusable operating principles and excludes infrastructure identities, permissions, historical model selections, copied numeric test floors, and accepted-red-build exceptions.

## Instruction ownership and migration

| Current source | Authoritative content to retain | Proposed change in B/C |
| --- | --- | --- |
| `AGENTS.md` | Provider profile, project stack, authority, WIP, role/resource ownership, essential required context. | Add the worker-skill route for an assigned item; preserve the recent user changes. Do not copy the whole worker procedure here. |
| `braid-coordinate/SKILL.md` | Goal analysis, readiness, dispatch, shared status, acceptance/review, user rundown. | Replace embedded worker lifecycle/no-separate-builder statements with a reference to `braid-worker` and its packet. |
| Coordinator `references/delegation.md` | Host dispatch mechanics, committed context, isolation, next/cancellation semantics. | Keep coordinator mechanics; point to the canonical packet and worker wait reference. Do not force workers through the coordinator skill. |
| Coordinator `references/delivery.md` | Shared commit/PR/CI/review/merge invariant and history-preservation policy. | Keep the location initially; correct failed-handoff wording and link the worker's operational lifecycle. No duplicate delivery handbook. |
| `docs/agent-handoff.md` | Reusable entrypoints and locating actual state. | Reference the packet asset and worker skill instead of a competing incomplete assignment example. |
| `docs/agile-workflow.md` | IDs, review indexing, Ready/Done and status vocabulary. | Retain authority; make only necessary consistency/link edits. Do not turn a progress label into a new persisted state. |
| `docs/decisions.md` | Project decisions and their motivation. | Record adopted worker-skill/green-handoff decision when approved/implemented; do not record an unapproved proposal as adopted now. |
| `epics/report-format.md` | Shared substantive reports/checkpoints/user briefing. | Reference it. Add only missing shared semantics if implementation proves necessary. |
| Task packet/backlog | Current assignment/dependencies/check set/base/ownership/outputs. | Keep actual facts here and in coordinator-owned current status, not hard-coded inside reusable skills. |

Initial worker package: one `SKILL.md`, ordinary discovery metadata, one packet asset, and a host reference only if A justifies it. No new helper script, duplicate quick-reference README, generic context database, copied provider profile, or skill for independent reviewers is presumed necessary.

## CI ownership and the unresolved host constraint

Current host instructions prohibit delegated children from watching PRs, prohibit polling loops, and require use of supported tool continuation. The available PR-watch description wakes its owning thread, but that alone does not establish a legal resumable child lifecycle. Thread waits and a Claude-only background-wait description also do not prove that the configured implementation worker can wait for GitHub checks. No wait/watch/delegate was started to test this during planning.

Therefore A is a real capability spike, not paperwork. Its positive result must show who waits, which event reaches the worker, how the task stays resumable, how failure returns to the same worker for repair, and how the final head is verified. If no supported path exists, report a host capability blocker; do not suggest a forbidden watch, hidden scheduler, silent provider change, or coordinator takeover as the default fallback. A parent relaying CI events could be evaluated only if a supported mechanism exists and does not transfer repair/handoff ownership.

Blocker notification remains permitted and necessary. It names the failed/missing evidence and exact nonsecret action needed; the item stays blocked/owned and is not accepted. The rule is to prevent abandoning red PRs, not to trap a worker in unlimited retries or prevent a usage-limit/service-outage report. This also applies to A's own eventual PR: if delivery cannot legally wait, it remains blocked, with no special spike exemption.

## Why four backlog items

- **A, spike:** separates a host unknown from prose design. A negative result stops activation before spending time on a skill that cannot honor its central promise. One session/one authorized lifecycle bounds cost.
- **B, story:** gives an assigned worker a usable explicitly loaded skill, including startup, proof, green delivery, and resume. Keep this coherent lifecycle together rather than separate stories for each paragraph.
- **C, task:** normalizes routing and removes the old copies once the destination exists. Sequential ownership prevents competing edits to AGENTS/coordinator references and preserves the current provider-profile changes.
- **D, spike:** independently checks behavior with realistic raw scenarios and one live integrated trial. A proves a transport mechanism; D proves workers actually follow the resulting skill. It records overhead without pretending incomparable tasks form a benchmark.

Reviews remain parent-scoped gates. There is no extra letter for review/report/retrospective. Future product automation belongs to later roadmap work and requires its own scope, not a hidden fifth phase here.

## Behavioral validation design

| Scenario | Observable expected result | Proof type |
| --- | --- | --- |
| Matching prepared checkout, complete packet | One bounded verification, correct owned branch, first item action without unrelated Git inventory. | Fresh-context fixture plus live trial trace. |
| Wrong base/remote/branch or stale dependency claim | Precise mismatch and affected-action stop; no reset/cleanup/history rewrite or wrong-base implementation. | Disposable fixture. |
| Existing user index/dirty shared checkout | Owned changes remain disjoint; nothing unrelated staged/committed/deleted. | Disposable Git fixture with before/after identity. |
| Interrupted push/PR creation, already-open PR | Observe actual completion, reuse PR/branch, no duplicate mutation or new PR. | Resume fixture; live observation where practical. |
| Pending checks then failure | Worker stays responsible, receives result via A mechanism, diagnoses/repairs/pushes. | Positive claim requires live worker event evidence. |
| Green old head, new pushed head or late old event | Old proof rejected; declared checks verified on current head before handoff. | Fixture plus live PR/run/head evidence. |
| Missing/cancelled check, service/permission blocker | Explicit nonterminal blocker, exact action needed, no false ready/Done or blind retry loop. | Fixture and observed host behavior where available. |
| Context replacement while waiting | Checkpoint identifies actual PR/head/task/log and next action; process/task state checked before retry. | Fresh-context resume evaluation. |
| Final worker return | Human explanation plus current-head green results, paths/branch/PR/head, limits and next review action. | Inspect actual report, checkpoint, PR and run identities. |

Keep evaluation prompts blind to expected answers; give the skill and minimum raw artifacts. Retain observed outputs and distinguish fixture reasoning from live actions. Structural skill validation covers frontmatter/naming/links, not operational correctness. Applicable repository CI still runs for a docs/skill PR. Do not add product tests that merely assert exact prose.

Measurements: context files/reads, Git command count, time to first meaningful item action, redundant mutations, coordinator interventions, and category-specific waits. D is limited to one suite/trial plus one focused recheck. If results are mixed, report that and propose a narrow correction; do not expand into a benchmarking/telemetry service.

## Planning validation and remaining limits

This turn reads current instructions/skills/templates, named epic/checkpoints/backlog/dependency evidence, CI scripts, previous analysis, and the nine inspiration sources above. It writes only the new epic plan/backlog/rules/report/checkpoint and the epic-index entry. Local validation passed for eight Markdown files, 63 local links/anchors, sequential A-D backlog IDs, all items remaining backlog, no worker-skill directory, and trailing whitespace. `git diff --check` passed for tracked changes. Final status also showed concurrent epic 002 edits outside this plan; they were not staged, reverted, or edited here. The checkpoint records the resume boundary and limits.

No worker skill/metadata/helper, active routing rule, delivery policy, product code, CI workflow, or machine state was implemented. No delegate/reviewer/PR/watch, live experiment, commit/push/merge, release, or deployment occurred. Existing dirty AGENTS/skill/workflow/decisions/seed-checkpoint changes and earlier untracked Git-analysis files are not adopted into this plan's delivery. The plan is local and uncommitted, with no hosted CI/review/merge proof. No percentage time-saving or host compatibility is claimed.

## Source fingerprints

SHA-256 identifies the local ignored source snapshot read for this analysis. Abstracted lessons above remain understandable if the ignored directory is absent later; these are not runtime dependencies.

| Source key from inspiration table | SHA-256 |
| --- | --- |
| README | `a968858d969c9f3aaa2010d96115172a253c8edade77d306cc5647c502432c36` |
| B brief | `2a99b483f92f6d93ecdec9fbf6e3fd8680511384324ef96dfd339de813631d51` |
| G brief | `2d3e92e6e6ef34590aacf857810eab7d31bc4560b63653869ce17c68b115d06b` |
| K brief | `8e6face36ed6a08a2177c4ba721aae698c0fa99545a2a2f95e27f3d2df4b1452` |
| L brief | `c0ccf3cda2fe875e5b0be67dc1dff8c334e009030cccd33120713d27c0f2e2bf` |
| M brief | `05d074c83689a34f3752b7661d8b57115185333c20e389700b83bb4aceb2a120` |
| L2a-C checkpoint | `ff3b6043f7958a362d18385d982b8c3209325d7d83b5ca835b6f108095186d01` |
| MAP checkpoint | `ac1203f7404e9a265d722510e984aa3a960a88882feaace44994b02b23c355e6` |
| HVAR checkpoint | `234f45816fd3265f2ce3349b83cfac099efd2c02485153ad4fba8a73a7e22957` |

## Next action

User reviews R01–R12 and the four-item scope, then explicitly approves/revises the rules and execution boundary. Recommended first execution authorization is A only, because its result controls feasibility. Until then, stop after planning. A fresh coordinator resumes from [current checkpoint](../checkpoints/current.md), not by treating backlog proposals as Ready.

## Branch handoff after planning

At the user's request on 2026-11-03, created and switched to `docs/003-worker-skill-plan` from unchanged local HEAD `acd87301c8c267b7b89651c1e2b01913d6c84692`, carrying all working-directory changes. Compared full status, staged/unstaged binary diffs, HEAD, and SHA-256 hashes of all untracked files before/after the switch: unchanged. This follow-up then updated only this report and the owned current checkpoint to record the branch. No upstream, base synchronization, staging, commit, push, or implementation was performed. The earlier analysis-checkout record describes where the original analysis occurred; the current checkpoint owns the resume location.

## Execution authorization

The user subsequently approved committing the current plan and proceeding, with Sol High for the worker. The rule set is now approved; A is the first ready item. T3 capabilities confirmed provider `codex`, model `gpt-6.1-sol`, `reasoningEffort: high`. This override is scoped to BRAID-003 and does not replace the global AGENTS profile. The plan commit includes this epic/index and the earlier Git-analysis report/checkpoint required by its evidence links, preserving unrelated policy and release edits outside the index. Another epic's isolated release assignment occupies the implementation lane; A can inspect contracts independently but cannot start its live PR trial until that slot is free. B/C/D remain dependent on A's viable result.
