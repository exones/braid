# Analysis: reduce worker Git startup overhead

Status: analysis complete; recommendations unimplemented. Date: 2026-11-03.
Scope: the opening of AGENTO-002/C and its parent's dispatch/handoff behavior.
Analysis checkout: `C:\code\agento`, branch `main`, HEAD `acd87301c8c267b7b89651c1e2b01913d6c84692`.

## Outcome

A more precise delegation contract can reduce repeated Git discovery. The C assignment already supplied the exact base SHA, repository, and desired branch, so adding a SHA alone would not solve the observed problem. The useful improvements are to explain the checkout T3 has prepared, make one explicit branch choice, reconcile current dependency state before dispatch, and prescribe a short verification with a mismatch path.

This was not eight minutes of Git commands. Document reading, implementation design, and conflicting PR-check instructions occurred in the same opening interval. The sample supports removing avoidable work; it does not establish a savings percentage or a pattern across every subagent.

## Evidence

Parent: <t3-thread://v2/c361f221-e595-46eb-8f4b-7926ea55f19c/b8e1d4d8-ca0b-42c9-a84d-bc9cc63381e2>

Worker: <t3-thread://v2/c361f221-e595-46eb-8f4b-7926ea55f19c/thread:delegated-task:command%3Amcp%3A98780089-d762-452d-9cbd-4500c54f364c%3Adelegate-task%3Abraid-002-c-oidc-guard>

Times below are UTC timeline timestamps, not measurements of command CPU time.

| Observation | Evidence |
| --- | --- |
| Parent provided `isolation: worktree`, exact base `acd87301…`, and requested `feat/002-c-oidc-guard`. | Parent activity 1855. |
| T3 prepared `c:\worktrees\agento\t3-579092d3` on `t3/579092d3`; run started at 21:18:08. | Worker thread metadata and activity 1. |
| At 21:19:59, one command checked status, HEAD, origin/main, latest main commit, and listed every local branch/upstream/worktree. HEAD and origin/main both matched the assigned SHA. | Worker activity 24. |
| At 21:25:41, the worker inspected 12 commits, which visibly included B's merge `1261452` and the skill merge `acd8730`. | Worker activity 32. |
| At 21:26:48, `git checkout -b feat/002-c-oidc-guard origin/main` created a branch tracking origin/main. A PowerShell version probe in the same invocation failed due to quoting; branch creation succeeded. | Worker activity 40. |
| At 21:26:58, another command unset the upstream and repeated status/HEAD/origin-main checks. | Worker activity 43. |
| About 8m50 elapsed from run start to that final branch check; only three displayed Git command invocations are identified in this opening. | Activities above. The interval also includes required reading and design. |
| The parent later attempted to check out B's branch in the main checkout and received an already-used-by-worktree error before using B's existing worktree. | Parent activities 1795–1797. This is a separate, concrete handback-location problem. |

Current files corroborate conflicting context: epic 002 and its shared checkpoint still describe planning-only work; B's report/backlog retain pre-merge delivery status; C contains former `epics/agento/` paths and `AGENTO_RELEASE`. The dispatch corrected the rename in prose but did not explicitly give B's merge evidence. Historical reports should retain their original observations; the current epic/checkpoint should supply later outcomes.

## Proposed handoff contract

The coordinator performs repository/dependency reconciliation once before dispatch. Commit any required updated assignment context before isolated delegation; uncommitted parent files are absent from the child. Keep WIP and file ownership unchanged.

Include the following small block in addition to the existing scope, read-first paths, acceptance criteria, and outputs:

```text
Git contract
- Checkout: use only the worktree already prepared and bound by T3.
  Its generated t3/<id> branch is expected. Do not create another worktree.
- Base: <full immutable SHA>. Expected initial HEAD: that SHA; tree/index clean.
- Branch policy: keep the T3 branch and use it for this item's PR.
- Remote: origin, expected repository <owner/repository>; PR base main.
- Dependencies: <item, merged PR URL, merge SHA present in this base>.
  Earlier worker reports describe their original delivery state.
- Coordinator-only files: <exact paths>; worker outputs: <exact paths>.
- Startup: verify root, status, HEAD, branch, and the expected origin once.
  If they match, start the item. No routine fetch, full branch inventory,
  or repeated main/history inspection is needed.
- Mismatch: report actual versus expected state; do not reset, clean,
  rebase, switch another checkout, or alter another owner's branch.
- Delivery: stage owned paths; push explicitly to this branch; PR to main.
- Return: actual checkout path, branch, full HEAD, PR URL, check/review state.
```

If a descriptive branch is required instead, choose that policy in the assignment and use a single `git switch --no-track -c <feature-branch> <full-base-SHA>` after verification. Do not combine both policies. Push with an explicit destination, for example `git push --set-upstream origin HEAD:refs/heads/<owned-branch>`. This avoids accidentally inheriting origin/main as upstream and the follow-up unset step. This is a proposal, not a command executed by this analysis.

The assigned root should come from the host's bound workspace context. The parent cannot know an automatically allocated worktree path before creation; do not invent that path in the initial prompt. The actual path belongs in the worker's first checkpoint and final handback, so the coordinator can use `git -C <returned-path>` at the safe handoff boundary.

## Separate instruction conflict

The task and current delivery guidance require the worker to wait for finished PR checks, while host rules forbid delegated children from watching PRs and forbid polling. The opening included tool discovery about waiting. Better Git instructions cannot resolve this conflict. A future guidance change must state the supported mechanism or explicitly record a host limitation and coordinator monitoring arrangement. It must preserve the distinction between a pending-check notification and accepted delivery; it must not tell a child to violate host rules.

## Proposed follow-up and acceptance

A small documentation task can update the delegation reference and manual assignment example, linking to one maintained Git contract. No product Git automation is needed.

Acceptance for that future task:

1. An isolated-worker example states the immutable base, one branch policy, expected clean state, remote/PR target, dependency merge evidence, file ownership, and mismatch behavior.
2. The startup sequence verifies those facts in one bounded command batch; a matching checkout proceeds without broad Git rediscovery.
3. A descriptive-branch example uses `--no-track` and the pinned SHA; an existing T3-branch example creates no second branch/worktree.
4. Handback includes the actual checkout/branch/HEAD/PR, and coordinator examples use the returned checkout after the worker finishes.
5. A subsequent real assignment records startup time and commands separately from document reading, design, toolchain installation, and CI waiting. Faster delivery remains unproven until then.
6. The PR-check waiting conflict has a host-compatible rule or an explicit unresolved limitation; no acceptance gate is silently relaxed.

## Validation and limits

Read the named parent and child activity, current project instructions, coordinator/delegation/delivery guidance, epic/checkpoint/backlog and dependency reports. Read-only Git checks confirmed the analysis checkout and existing dirty coordinator checkpoint. No product test was needed for this advisory analysis. No implementation, branch/index mutation, commit, push, PR, delegate, or change to the running worker was performed.

Only this report and its scoped analysis checkpoint were added. The pre-existing change to `epics/braid/001-seed/checkpoints/current.md` is preserved. The running C worker and the parent coordinator retain their existing output/status ownership.

## Resume

Review this proposal; if implementation is requested, adopt it through a scoped documentation task/PR and trial it on the next worker. Do not resume C or advance epic delivery from this analysis.
