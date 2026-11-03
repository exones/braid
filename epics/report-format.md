# Report and checkpoint format

## Task report

Write `reports/<task>.md` as a substantive delivery report. Lead with what the item introduced and why it matters, then support that account with evidence. Use the structure below where useful; omit empty boilerplate and scale detail to the change.

```markdown
# Task <key>: <title>
Status: done | partly proven | blocked. Date: <date>.
Backlog item: <path>. Checkout/branch/HEAD: <actual values or not available>.

## Outcome
What changed, why, and which acceptance criteria are met.

## Changes introduced
- New capabilities: what the operator or developer can do now; include concrete commands/examples when useful.
- Important behavior and implementation changes: before/after behavior, design choices that affect use or maintenance, and significant fixes.
- Compatibility and operating impact: storage/schema, installation/configuration, migration, defaults, or new requirements where relevant.

## Evidence
| Check | Exact command or method | Result | Revision/log/CI/PR link |
| --- | --- | --- | --- |

Explain which guarantees those checks establish and what remains unproven. Distinguish dirty probes, exact committed candidates, installed-artifact proof, hosted CI, and independent review.

## Decisions
Material choices, reasons, and any changes to the contract.

## Open points
Known limits, missing inputs, findings, follow-ups, release/publication state, and who can unblock them. Link parent-scoped review passes and triage when applicable.

## Resume
One concrete next action and the intended next backlog item.
```

Reference actual evidence; do not invent links, commits, build results, or publication states. Keep secrets out. If there is no Git remote, say so.

## User completion briefing

When an item produces a reviewable delivery or completes, give the user a readable release-note-style account: introduced capability/value, important changes, validation, remaining limits, any required user action, and next step. Include the PR/evidence links needed to assess the result. A status label and test count alone are insufficient. Do not call a candidate released or Done before its required gates pass.

Routine progress/waiting updates can remain short. The earlier three-line/60-word convention is not a cap on item completion briefings or written reports. Do not turn every small coordination update into release notes.

## Review records

Read and follow the authoritative [review conventions](../docs/agile-workflow.md#review-gates-and-indexing) for names, paths, numbering, and existing records. Use the [review template](../.agents/skills/braid-coordinate/assets/review.md) to record the exact checked revision, scope, findings/acceptance assessment, checks, limits, and subsequent triage.

## Current checkpoint

Keep one current handoff per epic. In coordinated mode the coordinator owns `checkpoints/current.md`; workers own `checkpoints/<task>.md` and send proposed shared-status updates in their report. In standalone mode the assigned agent owns the shared handoff. Record date, active task, checkout/branch/HEAD, controller version, completed work, in-flight commands/logs, last check, changed files, blockers, and next action. Before replacing a long-running session, optionally save a dated checkpoint snapshot too.

Prefer concrete actions such as "run the installed-package smoke check from D" over "continue implementation". State whether changes are committed/pushed; never infer that from a report.
