# Agent handoffs

This is a reusable operating guide, not an epic dashboard. Examples below use placeholders and do not identify active work.

## Start from a goal

Use the [coordinator skill](../.agents/skills/braid-coordinate/SKILL.md) for goal-level planning, delivery, and resumption. Example requests:

```text
Plan <goal>.
Build <goal>.
Continue <epic>.
```

For explicit Codex selection, prefix the goal with `$braid-coordinate`. In Cursor, select `braid-coordinate` from the skill picker. If discovery is unavailable, ask the agent to read the skill file directly. Model/provider settings come from [AGENTS.md](../AGENTS.md) and [decisions](decisions.md), not from this guide or the skill's invocation text.

## Find actual work state

Start at the [epic index](../epics/README.md), then read the selected epic's files:

- `epic.md`: outcomes, prioritized backlog, dependencies, status, decisions, and PR/CI/review links.
- `checkpoints/current.md`: the coordinator's exact resume point and in-flight work.
- `backlog/<ID>-<slug>.md`: the assigned story/task/spike and its acceptance criteria.
- `checkpoints/<ID>.md` and `reports/<ID>.md`: worker handoff and evidence.

Do not copy current IDs, completion states, next assignments, or dated runtime/provider observations into this guide. The epic and checkpoint are the maintained sources for progress.

## Manual worker assignment

The coordinator normally generates this assignment. If handing work over manually, substitute real paths for the placeholders:

```text
Act as the worker for <epic>/<item>.
Read AGENTS.md, the applicable decisions, <epic>/epic.md,
<epic>/checkpoints/current.md, <item-path>, and its dependency reports.
Execute only that item; do not launch other agents or successor items.
Follow its acceptance criteria and agreed checkout/Git boundaries.
Write <epic>/checkpoints/<ID>.md and <epic>/reports/<ID>.md.
Leave shared epic status to the coordinator.
Surface precise user-owned blockers and continue independent in-scope work.
```

Workers do not inherit another provider's conversation automatically. Include the read-first paths and outputs even when project instructions are discovered by the host. Refresh the relevant files when resuming.

## Delivery and verification

Follow the [Agile workflow](agile-workflow.md) and the skill's [delivery rules](../.agents/skills/braid-coordinate/references/delivery.md) for scoped commits, PRs, CI, review, and merge authority. Do not duplicate that policy here.

A prepared workflow, a passing local gate, and a passing hosted CI run are different evidence. Record actual revisions, run URLs, findings, and results in the epic/report. The workflow file defines when CI runs; this guide does not track whether a particular run happened.

Keep one owner for shared status. Do not switch/stage/commit a shared checkout while its worker is running. Ensure required context is committed before isolated worktree delegation. Before assigning a review, read and follow the [review conventions](agile-workflow.md#review-gates-and-indexing). Use short `Done / You / Next` progress updates and fuller completion briefings per [report guidance](../epics/report-format.md).
