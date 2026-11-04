# B: create the worker execution skill

Kind: story. Epic: [BRAID-003](../epic.md).
Status: in-review. Owner: Sol High author stopped after green handoff; independent pass 001 accepted, human merge pending. See [coordinator acceptance](../reports/B-acceptance.md).
Depends on: user-approved rules; A's viable, reviewed wait/continuation result; committed assignment context.

Readiness: A reviewed at `c86bc3990a63a5b18d582782e54f9a3cffa18928` with no actionable findings; [coordinator acceptance](../reports/A-acceptance.md). A/plan PRs are not asserted merged. B starts from committed accepted-context based on that head and targets PR base `t3/85fcb290` while A is open; merge order #6 -> #8 -> B, with later safe retarget/revalidation. Use the generated worker branch; preserve human merge authority.

## Read first

[AGENTS](../../../../AGENTS.md), README, [decisions](../../../../docs/decisions.md), [workflow](../../../../docs/agile-workflow.md), [epic](../epic.md), [current checkpoint](../checkpoints/current.md), [proposed rules](../proposed-rules.md), [planning report](../reports/planning.md), and the delivered `reports/A.md`/`checkpoints/A.md`. Read current delivery/delegation/reporting authorities and the available skill-authoring guidance. Do not require ignored inspiration files at runtime.

## Value

An assigned worker can load one explicit execution skill, complete its item, retain responsibility for its PR through green checks, and resume without reconstructing a coordinator workflow or parent chat.

## Scope and non-goals

Create `.agents/skills/braid-worker/SKILL.md`, appropriate discovery metadata, one compact assignment-packet asset, and only the supporting reference justified by A (for example, a T3 continuation reference). Keep the entrypoint short; reference shared policy rather than restating entire documents. It covers implementation, documentation tasks, research spikes, scoped fix assignments, and resume. Explicitly exclude goal-level planning, independent review, orchestration, successors, and subagents.

Implement the approved R01–R12 behavior without adding product automation or infrastructure powers. Keep current shared delivery authority at its existing path for now. C owns broad routing/deduplication; B can be used by explicit path/invocation before that integration. No placeholder scaffold, generic worker handbook, duplicated provider profile, or extra README inside the skill.

## Acceptance criteria

1. Given a fresh explicit assignment, the skill and asset identify task/context/Git/dependencies/ownership/gates/outputs without parent history; all required references resolve in the committed checkout.
2. Given matching versus mismatching prepared checkouts, the skill prescribes one bounded verification, one selected branch policy, an explicit owned push target, and scoped mismatch handling. It cannot authorize destructive cleanup or shell-created child worktrees.
3. Given pending/failing/new-head/blocked CI, the lifecycle implements A's proved mechanism, same-worker repair, invalidation of stale proof, and green-only successful handoff. No failed PR handoff is presented as normal completion.
4. Given context replacement, a checkpoint containing the approved resume fields supports reconciliation before side effects; existing PR/checks/tasks are reused appropriately.
5. Shared policy is referenced at maintained locations. Skill metadata discriminates assigned execution from planning/review, permits normal implicit discovery, and embeds no provider/model options or live assignments.
6. Relevant skill structural validation, local links, and bounded scenario walkthroughs pass. Structural checks are reported separately from live behavior; no speedup or reliability claim is inferred from metadata.

## Tasks

- [x] Draft the minimal entrypoint, metadata, and assignment asset from the approved rules/A result.
- [x] Exercise the matching/mismatch, stale-head, blocker, and resume scenarios without external side effects.
- [ ] Write `reports/B.md` and `checkpoints/B.md`; deliver the skill through current-head green CI.

## Ownership and verification

Own the new worker skill directory, this item's delivery fields, and B report/checkpoint. Do not edit coordinator-owned shared status or other running workers' files. Use the available skill validator (currently `quick_validate.py` from skill-creator), reference/link checks, and actual required PR CI. Do not introduce product tests that only match prose. D supplies later independent behavioral proof.

## Review and delivery

Independent parent-scoped pass `B-worker-skill-review-001` assesses the exact candidate against approved rules and A's contract. Follow [review naming](../../../../docs/agile-workflow.md#review-gates-and-indexing). Conventional Commit/PR, current-head hosted CI, triaged review, and human-approved merge are required. Local skill/link validation and bounded authored walkthroughs pass; see [B report](../reports/B.md) and [worker checkpoint](../checkpoints/B.md). Hosted green proof and independent review/merge remain outstanding.

## Report and resume

Write `reports/B.md` and `checkpoints/B.md` following [report-format](../../../report-format.md), with introduced behavior, decisions, checks/limits, actual checkout/branch/head/PR, green check evidence, and proposed coordinator status. Stop after B; do not perform C's routing migration.
