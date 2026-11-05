# Commits, PRs, CI, review, and repository documentation

## Delivery unit and authority

Use one item branch and one pull request per story, task, or spike. Branch names, bases, and pull-request targets follow [Epic and item branches](#epic-and-item-branches). Checkout ownership follows [Workspaces](#workspaces). Supporting checklist tasks belong to that delivery pull request. Review reports do not: see [Record ownership](../../../../docs/agile-workflow.md#record-ownership). Do not create an endless chain of pull requests reviewing review reports. Split a large item before implementation. A genuinely indivisible bootstrap may group earlier work with a logged reason, preserving the actual history.

Routine reviews are gates of their parent item/epic, not new lettered backlog entries. Index passes and findings using `docs/agile-workflow.md`; fixes stay on the item PR, while review files follow [Record ownership](../../../../docs/agile-workflow.md#record-ownership). A genuinely separate implementation outcome may justify its own backlog item, but another reviewer or review round alone does not.

Once relevant local gates pass, inspect the diff and stage only owned changes, then commit, push the owned feature branch, and open a PR. These routine steps are authorized by a scoped delivery request. Do not use `git add .` to sweep unrelated changes into a commit. Preserve another person's index and never rewrite their commits or force-push their branch. Do not switch/stage/commit a shared checkout while its worker is running.

The PR body uses the same human account as an item report, then a Technical record for continuation. Follow [report format](../../../../epics/report-format.md#pull-request-records). [`.github/PULL_REQUEST_TEMPLATE.md`](../../../../.github/PULL_REQUEST_TEMPLATE.md) is only an authoring aid; a body supplied with `gh pr create --body-file` or `gh pr edit --body-file` still contains that account. Use Conventional Commit style for the title too. Immediately link each created/pushed PR through the host's required PR-link tool. The body carries the account known when the pull request is opened. Facts learned after the push follow [Commit boundary](../../../../docs/agile-workflow.md#commit-boundary).

For docs-only spikes, commit the analysis/decision/report, validate links and skill/schema content where applicable, and let applicable CI run. Review the research evidence and conclusions. Do not create product-code tests merely to make a documentation PR look tested. A failed required build is not a docs exemption.

## Epic and item branches

Create a new epic's named integration branch from a verified full main revision before the first plan commit or assignment. Example: `epic/braid-004-supervised-execution`. Do not start that epic by writing on main. The coordinator pins the branch, the base, and the pull-request target. The host creates and binds the workspace.

Each item uses its own branch from the current accepted epic tip, for example `item/braid-004-a-contract`. Its pull request targets the epic branch. It does not target main, and it does not target a preceding item's branch. Same-item fixes stay on that pull request. Do not retarget it to main because a predecessor merged.

Green CI and independent exact-head review precede the human merge into the epic. Apply the [human merge stop](#human-merge-stop) before dependent work. An item is Done after that accepted human merge into the declared epic branch. The epic is complete after its final gates and the human merge of one epic-branch pull request into main, plus any explicitly required release evidence. Earlier item checks are evidence for that candidate. They do not replace final integration proof. Main integration and registry publication are separate actions. Prefer merge commits so reviewed ancestry stays traceable. A different merge strategy needs explicit identity and revalidation handling.

History already on main stays. Do not rewrite it onto this model. An epic that already delivered earlier items to main keeps that history and uses the epic branch for the remaining items, with one final pull request for that remainder. Later epics use this model from their first plan commit.

## Epic branch sync and skill pinning

At each item boundary, after the item merges into the epic and before the next dispatch, count commits on main that the epic lacks: `git rev-list --count <epic>..origin/main`. When the count is not zero, merge main into the epic with a merge commit. When that merge conflicts, open a small pull request into the epic so the resolution is visible. Sync once more before the final epic pull request into main.

Never rebase or force-push the epic branch. Do not sync while an item worker is mid-flight unless the user asks. If the epic moves under an open item pull request anyway, the worker merges the new epic tip into the item branch and reruns its proof.

A worker runs the skill revision named in its packet. When the epic does not edit the skills, that revision is the checkout copy at the dispatch tip, and the packet names its path and full revision. When the epic edits the skills, the coordinator supplies a pinned installed copy outside the checkout, at main or another recorded commit, under the same rule as a released controller. The packet names that path and revision. A skill change in an item applies to later items only after the coordinator records that adoption in `epic.md`. Recording this rule does not change the revision of a run already dispatched.

## Workspaces

A branch is a line of Git history. A worktree is a physical checkout. A T3 thread is an agent session bound to a checkout. One checkout has one writer.

| Workspace | Branch and owner | Rule |
| --- | --- | --- |
| User project root | User-owned branch and dirty state | Agents do not repurpose, clean, or switch it to make setup convenient. |
| Epic integration worktree | Named epic branch; coordinator | One per active epic, from planning through the final merge. Item results are accepted here. |
| Active item worktree | Named item branch; assigned worker | One implementation worker at a time. The host creates and binds it from the pinned epic tip. Reuse that checkout and thread for the item's fixes and resumes. Waiting on CI keeps this ownership. |
| Independent review workspace | Separately assigned reviewer | Read the exact candidate objects. Never write the author's source or index. Use a separate host-bound workspace when the reviewer's outputs need a writable checkout. Detached HEAD is not a routine writable checkout. |

The default is one epic coordinator worktree plus one active item checkout. One shared epic worktree with alternating exclusive ownership is possible and is not the default: it forbids coordinator writes during the worker's turn and needs an explicit binding handoff. No second writer in a checkout.

The coordinator asks the host to create or bind the workspace and supplies the named branch at creation. Record the returned thread id, root, attached branch, full head, base, pull-request target, and writer. That record is coordination. It is not a hand-edited `.braid/run.json` and it is not an ownership service. The host may choose an opaque folder name. The branch and the thread title stay meaningful. A title update does not change a binding.

At startup, confirm the checkout is attached to the named branch and the full HEAD is the committed epic tip supplied at launch. Later commits stay on that same branch. A missing checkout, a detached HEAD, or a branch other than the named item branch stops the affected writes. Do not guess a path from the UI, create a worktree in the shell, rename the bound branch, or repair the binding. The worker reports that blocker. The coordinator does not ask the user to clean or retarget the checkout.

Use the packet's schema 1 contract and `pwsh -NoProfile -File scripts/Test-WorkspaceBinding.ps1 -ContractPath <contract.json> -RepositoryRoot <absolute-root>` for that confirmation ([schema](../../../../scripts/workspace-binding.md)). Exit 0 proceeds. Exit 1 is reconciled only for the reported fields. Exit 2 stops the affected writes. The checker does not fetch, repair upstream, switch, clean, or write the checkout. A manual Git batch is the fallback only when the pinned helper is unavailable.

After the item's review, its human merge into the epic, and durable copies of the report, checkpoint, and evidence, the coordinator may retire that item's stopped, clean, owned workspace. Do not force-remove a dirty tree, untracked evidence, or a checkout with a live owner. Keep an unresolved workspace. Adopting this policy does not retire any existing workspace. Deleting a thread does not remove its worktree.

## Conventional Commits: source and local convention

Source: [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/).

Use this shape:

```text
type(scope): short imperative summary

Optional body explaining why and relevant constraints.

Refs: BRAID-001/C
```

`feat` introduces capability; `fix` corrects behavior. Our additional types include `docs`, `test`, `ci`, `build`, `refactor`, and `chore`; these are project conventions permitted by the specification. Scope is optional. Mark a breaking interface change with `!` before the colon or a `BREAKING CHANGE:` footer describing the migration. Types can support later release tooling, but commit naming alone does not publish a package.

Examples:

```text
docs(spike-a): define the seed ledger contract
feat(cli): add help and version commands
ci: verify the CLI on Windows and Linux
fix(storage): preserve state when replacement fails
```

Keep commits coherent and passing their relevant gates; use separate commits when changes have separate intent. Do not amend/rebase already shared or user-authored commits merely to fix old wording. Start the convention with new commits.

## Review and Done

1. Local gate passes on the proposed change; commit and PR exist.
2. Hosted required CI passes for the current PR head. Keep exact run/check evidence; a prepared workflow is not a passed workflow.
3. A reviewer other than the implementation author examines the diff and evidence. Where the pass, triage, and coordinator commits are written is [Record ownership](../../../../docs/agile-workflow.md#record-ownership) and [Commit boundary](../../../../docs/agile-workflow.md#commit-boundary). Retain fresh-context milestone review where declared.
4. If branch protection requires formal GitHub approval from another identity, obtain it; do not label an agent's local review as a platform approval or bypass protection.
5. Obtain human merge approval under current policy; merge only the checked/reviewed head. Revalidate after relevant changes. Record merge SHA and mark Done. Until then use In Review with local/CI/review state visible.

**Successful implementation-worker handoff requires independently verified current-head green evidence for every declared check.** Freeze workflow/event/job/step/upload/artifact requirements before dispatch, including configured checks beyond branch protection. Missing, pending, failed, skipped, cancelled, neutral, inaccessible, inconclusive or stale evidence cannot silently count green. A new commit invalidates old-head proof; distinguish PR merge-test source from PR head and verify their relationship. See [Commit boundary](../../../../docs/agile-workflow.md#commit-boundary).

The [worker skill](../../braid-worker/SKILL.md#deliver-through-green-checks) owns the operational pull-request, wait, diagnose, repair, verify, and resume lifecycle. A top-level item thread follows [T3 continuation](../../braid-worker/references/t3-continuation.md#top-level-item-thread): it watches its own pull request, ends the turn, and one watch wake drives verification and one result. The coordinator dedupes results by head. The [legacy parent relay](../../braid-worker/references/t3-continuation.md#legacy-parent-relay-for-delegated-children) applies only to a delegated child, and only when that route is explicitly selected. It is not a silent fallback when the top-level route fails. Waiting or blocked updates may end a turn but remain nonterminal; report the exact blocker owner, action, and impact rather than handing off a failed pull request. Follow the host's end-of-turn rules. Delegated children do not watch or poll. The coordinator checks the returned root, branch, full head, and complete green evidence at a safe boundary before acceptance or review. It does not take over pending or failing implementation. Respect a user's instruction to wait for a running delegate rather than replacing or interrupting it merely to adopt a new Git workflow.

## Human merge stop

When a later item requires a prerequisite pull request to be merged, report that result and the exact human merge, checkpoint, and stop before dispatching the dependent item. Under [Epic and item branches](#epic-and-item-branches), that prerequisite is the item pull request merged into the declared epic branch. The epic pull request into main is a later, separate human stop, and it is not item Done. Green CI and independent review are not a merge. Verify the actual merge commit and the current dependency facts before resuming. Prepare or revalidate a safe base transition when the recorded base is stale. Do not merge automatically, stack the dependent work silently, dispatch a successor automatically, or open a new approval loop inside work the user already authorized. The implementation worker still owns repair and current-head green proof for its own delivery.

Record accepted revisions and actual merge evidence in the assignment. Reconcile outstanding bootstrap history at a safe boundary. Preserve user commits rather than manufacturing earlier pull requests.

## README boundary

README describes what the checked-in project currently supports and how to use/build it. Include accurate limits, installation, commands, architecture, and stable contributor-guide links. It must not contain current story IDs, active worker assignments, progress tables, next backlog recommendations, or session-resume instructions.

Put those operational details in `epics/<project>/<epic>/epic.md`, item files, checkpoints, and reports. Change README when capabilities or user instructions change, not on each coordination turn. When an active worker owns README, wait for its result before cleaning its content.

The same boundary applies to reusable handoff guides: document how to assign/resume work with placeholder examples, not which item is currently active or complete. Keep actual work state in the epic/checkpoints, and link there rather than copying a status table.

## Migration from the local-only bootstrap

Earlier A/B acceptance was local evidence, not PR/CI/merge completion. Keep original reports as historical records and mark outstanding delivery gates explicitly. At the next safe boundary, inspect current Git history, branch/index, and diff; form reviewable PRs from the real available changes. Do not retroactively assert that a past spike passed hosted CI. If earlier changes are already bundled in a user commit, preserve it and explain the bootstrap grouping.
