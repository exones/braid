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

For goal-level coordination, start at the [epic index](../epics/README.md), then read the selected epic's files. Assigned workers start at the exact filled packet; resumed workers open their named checkpoint first. The records are:

- `epic.md`: outcomes, prioritized backlog, dependencies, status, decisions, and PR/CI/review links.
- `checkpoints/current.md`: the coordinator's exact resume point and in-flight work.
- `backlog/<ID>-<slug>.md`: the assigned story/task/spike and its acceptance criteria.
- `checkpoints/<ID>.md` and `reports/<ID>.md`: worker handoff and evidence.

Do not copy current IDs, completion states, next assignments, or dated runtime/provider observations into this guide. The epic and checkpoint are the maintained sources for progress.

## Manual worker assignment

Use [braid-worker](../.agents/skills/braid-worker/SKILL.md) for one assigned implementation item or its resumption. Explicit Codex selection is `$braid-worker`; in Cursor select it from the skill picker, or read its file directly when discovery is unavailable. Goal-level work uses the coordinator entrypoint above; independent review uses its separately assigned scope and [review conventions](agile-workflow.md#review-gates-and-indexing).

Coordinators fill the [canonical assignment packet](../.agents/skills/braid-worker/assets/assignment-packet.md) for manual delivery exactly as for automatic dispatch. Workers consume the filled packet at its supplied path, not the blank authoring template. Separate read-now project/policy sections, verified dependency facts with exact evidence references, and on-demand history; name entry mode, first action, outputs and expected upstream state. Applicable target-project instructions remain mandatory; installed workflow references resolve from the skill installation. Read the provider authority at dispatch time; do not copy live settings into reusable examples.

For isolation, every required file must be committed at the supplied revision or explicitly supplied; no parent chat or dirty parent checkpoint is inherited. Let the host bind and return the actual root/generated branch. For expressly shared work, name existing dirty/index ownership and allowed operations instead of cleaning it. On resume supply the worker checkpoint/phase/PR/head, continuation generation and interrupted action; open that checkpoint first, refresh applicable instructions and reconcile relevant actual effects before retrying. Continue the recorded action rather than replaying initial discovery.

## Delivery and verification

Follow the [Agile workflow](agile-workflow.md) and the skill's [delivery rules](../.agents/skills/braid-coordinate/references/delivery.md) for scoped commits, PRs, CI, review, and merge authority. A required human merge uses the [human merge stop](../.agents/skills/braid-coordinate/references/delivery.md#human-merge-stop). Do not duplicate that policy here.

A prepared workflow, a passing local gate, and a passing hosted CI run are different evidence. Record actual revisions, run URLs, findings, and results in the epic/report. The workflow file defines when CI runs; this guide does not track whether a particular run happened.

Keep one owner for shared status. At a safe boundary, inspect using the worker's returned actual root/branch/full HEAD/PR and complete current-head green evidence; do not blindly check out a branch occupied by another worktree or take over pending/failing implementation. Shared Git/index boundaries and the green-only invariant are maintained in the delivery rules. For T3 use the [finite parent relay](../.agents/skills/braid-worker/references/t3-continuation.md) for transport; a waiting/blocker return retains worker ownership. Before assigning review follow the review conventions. Use the [report contract](../epics/report-format.md): short progress stays short, and item outcomes, user blockers, substantive child returns, and milestones use its human account. The coordinator translates child evidence; it does not forward the packet unchanged.
