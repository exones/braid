# D1 implementation assignment

Date: 2026-11-03. Role: one implementation worker, Cursor `grok-4.7`, `reasoning_effort: xhigh`.
Checkout: `C:\code\agento`. Branch: `feat/sequential-backlog-ids`.
Base main: `709de209b7fd39980a2134f6c574306c8485d7bf`. The coordinator handoff commit follows that base.
Backlog: [D1](../backlog/D1-sequential-backlog-ids.md).

## Ready and scope

D's dependency is satisfied: PR #2 human-merged at `d81f4a5765b6b34e686d3827a15aaaf726e76f01`, final PR head `147a4bd` Windows/Ubuntu CI succeeded. User requested continued delivery. Preserve all newer main commits; the separately planned epic is outside this assignment.

Read root AGENTS, README, decisions, Agile workflow, coordinator skill and its templates, epic/current checkpoint, the backlog and its dependency reports. Also read `C:/Users/exon/.codex/skills/.system/skill-creator/SKILL.md` before editing skill instructions. If unavailable in the worker host, report it without substituting unrelated guidance.

Implement D1's centralized backlog-ID convention in `docs/agile-workflow.md`, with minimal read/reference routing in the coordinator skill/templates and other entry points only as necessary. The policy belongs in one section; do not copy the detailed rule into README, AGENTS, decisions, or reusable handoffs. Preserve existing item IDs, legacy reports/findings, the review naming convention, and all files in the separately planned epic. No product/CLI/schema/package/script/workflow changes are needed.

## Ownership and gates

Worker owns the scoped documentation/skill changes, backlog checklist, `checkpoints/D1.md`, and `reports/D1.md`. Do not edit `epic.md`, `checkpoints/current.md`, candidate report/retro, or unrelated reports. Those coordinator handoff changes are already committed.

Validate skill structure, local links/anchors, formatting, and consistency of naming-policy references. Run applicable local verification required by the delivery policy before PR creation; report exact commands/results and limits honestly. Do not invent behavioral proof or write a test merely matching policy wording. Do not launch agents: the coordinator separately arranges the fresh planning exercise required by acceptance criterion 5 after a committed candidate exists, then reviews the implementation/evidence. Leave those gates pending in your report.

At the safe boundary, inspect/stage only owned changes, create scoped Conventional Commits, push `feat/sequential-backlog-ids`, open a PR to `main`, and immediately link it with the host tool as the next tool call. Include the coordinator handoff commit in this delivery PR. No amend/rebase/force-push, merge, release, publication, credentials request, or new stage work. As a delegated child do not watch CI. Stop after returning the candidate/report.

## Return

Explain changed behavior and why it helps, central policy location and entry-point routing, existing-ID/compatibility treatment, checks, exact candidate SHA/PR, and pending fresh proof/review/CI/merge. Propose In Review, not Done. Final line: `PR <full URL>, head <SHA>, checks and reviews <actual state>.`
