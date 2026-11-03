# Commits, PRs, CI, review, and repository documentation

## Delivery unit and authority

Use one scoped feature branch and PR per deliverable story or spike by default. Supporting checklist tasks and review reports belong to that delivery PR; do not create an endless chain of PRs reviewing review reports. Split a large item before implementation. A genuinely indivisible bootstrap may group earlier work with a logged reason, preserving the actual history.

Routine reviews are gates of their parent item/epic, not new lettered backlog entries. Index passes and findings using `docs/agile-workflow.md`; attach their evidence and fixes to the parent's delivery PR. A genuinely separate implementation outcome may justify its own backlog item, but another reviewer or review round alone does not.

Once relevant local gates pass, inspect the diff and stage only owned changes, then commit, push the owned feature branch, and open a PR. These routine steps are authorized by a scoped delivery request. Do not use `git add .` to sweep unrelated changes into a commit. Preserve another person's index and never rewrite their commits or force-push their branch. Do not switch/stage/commit a shared checkout while its worker is running.

The PR body explains the outcome, relevant validation, limits, epic/item reference, and evidence paths. Use Conventional Commit style for the title too. Immediately link each created/pushed PR through the host's required PR-link tool. Record its URL and head SHA in the epic/report.

For docs-only spikes, commit the analysis/decision/report, validate links and skill/schema content where applicable, and let applicable CI run. Review the research evidence and conclusions. Do not create product-code tests merely to make a documentation PR look tested. A failed required build is not a docs exemption.

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
3. A reviewer other than the implementation author examines the diff and evidence. The coordinator may review worker-authored changes; coordinator-authored changes need another reviewer. Record findings and triage in the PR-linked report. Retain fresh-context milestone review where declared.
4. If branch protection requires formal GitHub approval from another identity, obtain it; do not label an agent's local review as a platform approval or bypass protection.
5. Obtain human merge approval under current policy; merge only the checked/reviewed head. Revalidate after relevant changes. Record merge SHA and mark Done. Until then use In Review with local/CI/review state visible.

Dependencies already satisfied by local acceptance may proceed with explicitly documented branch/base ordering while PR delivery is pending; never pretend the dependency is merged. For the running seed, C retains its accepted local B dependency. Reconcile existing A/B commits into honest bootstrap PR coverage after C returns; preserve user history instead of manufacturing earlier PRs.

Use host PR watches for required check/review waits, follow their end-turn instructions, and never implement polling loops. Respect a user's instruction to wait for a running delegate: do not launch another or interrupt it merely to adopt a new Git workflow.

## README boundary

README describes what the checked-in project currently supports and how to use/build it. Include accurate limits, installation, commands, architecture, and stable contributor-guide links. It must not contain current story IDs, active worker assignments, progress tables, next backlog recommendations, or session-resume instructions.

Put those operational details in `epics/<project>/<epic>/epic.md`, item files, checkpoints, and reports. Change README when capabilities or user instructions change, not on each coordination turn. When an active worker owns README, wait for its result before cleaning its content.

The same boundary applies to reusable handoff guides: document how to assign/resume work with placeholder examples, not which item is currently active or complete. Keep actual work state in the epic/checkpoints, and link there rather than copying a status table.

## Migration from the local-only bootstrap

Earlier A/B acceptance was local evidence, not PR/CI/merge completion. Keep original reports as historical records and mark outstanding delivery gates explicitly. At the next safe boundary, inspect current Git history, branch/index, and diff; form reviewable PRs from the real available changes. Do not retroactively assert that a past spike passed hosted CI. If earlier changes are already bundled in a user commit, preserve it and explain the bootstrap grouping.
