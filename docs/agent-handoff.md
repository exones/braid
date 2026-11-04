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
- `assignments/<ID>.md`: the committed packet for a new item. Historical `reports/<ID>-assignment.md` files remain evidence.
- `checkpoints/<ID>.md` and `reports/<ID>.md`: worker handoff and evidence.

Do not copy current IDs, completion states, next assignments, or dated runtime/provider observations into this guide. The epic and checkpoint are the maintained sources for progress.

## Manual worker assignment

Use [braid-worker](../.agents/skills/braid-worker/SKILL.md) for one assigned implementation item or its resumption. Explicit Codex selection is `$braid-worker`; in Cursor select it from the skill picker, or read its file directly when discovery is unavailable. Goal-level work uses the coordinator entrypoint above; independent review uses its separately assigned scope and [review conventions](agile-workflow.md#review-gates-and-indexing).

Fill the [canonical assignment packet](../.agents/skills/braid-worker/assets/assignment-packet.md) for manual delivery exactly as for automatic dispatch. It is the maintained template for task/context/dependencies, Git/base/remote/index, ownership, check set, supported continuation, outputs and return facts. Read the provider authority at dispatch time; do not copy live settings into reusable examples.

For isolation, every required file must be committed at the supplied revision or explicitly supplied; no parent chat or dirty parent checkpoint is inherited. The normal item checkout is a named branch from the accepted epic tip, in its own worktree, with the pull request targeting the epic branch. Let the host bind that checkout and return the actual root and attached branch. Confirm the binding before writes. A missing, detached, or mismatched checkout stops the affected writes. Do not create the worktree in the shell or guess its path. For expressly shared work, name existing dirty/index ownership and allowed operations instead of cleaning it. On resume supply the last checkpoint, pull request, and head and the interrupted action; follow the worker skill's reconciliation before retrying effects. Keep the worker prompt short and step-explicit.

## Delivery and verification

Follow the [Agile workflow](agile-workflow.md) and the skill's [delivery rules](../.agents/skills/braid-coordinate/references/delivery.md) for scoped commits, PRs, CI, review, and merge authority. A required human merge uses the [human merge stop](../.agents/skills/braid-coordinate/references/delivery.md#human-merge-stop). Do not duplicate that policy here.

A prepared workflow, a passing local gate, and a passing hosted CI run are different evidence. Record actual revisions, run URLs, findings, and results in the epic/report. The workflow file defines when CI runs; this guide does not track whether a particular run happened.

Keep one owner for shared status. At a safe boundary, inspect using the worker's returned actual root, branch, full HEAD, pull request, and complete current-head green evidence. Do not check out a branch occupied by another worktree or take over pending or failing implementation. Shared Git and index boundaries and the green-only invariant are maintained in the delivery rules. For a top-level T3 item thread, follow [T3 continuation](../.agents/skills/braid-worker/references/t3-continuation.md#top-level-item-thread): the worker watches its own pull request and sends one result, and the coordinator dedupes by head. The legacy parent relay is only for an explicitly selected delegated child. A waiting or blocker return retains worker ownership. Before assigning review follow the review conventions. Use the [report contract](../epics/report-format.md): short progress stays short, and item outcomes, user blockers, substantive child returns, and milestones use its human account. The coordinator translates child evidence; it does not forward the packet unchanged.
