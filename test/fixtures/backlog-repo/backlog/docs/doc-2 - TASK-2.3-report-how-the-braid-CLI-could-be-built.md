---
id: doc-2
title: 'TASK-2.3 report: how the braid CLI could be built'
type: other
created_date: '2026-11-13T15:19:00Z'
---

# The new braid CLI: design sketch and estimate

> Research report for TASK-2.3, 2026-11-13. Findings and recommendations, not decisions: nothing here is decided until the user says so. The user's decisions: TASK-2 report.

How a new braid CLI could be built as braid's task tracker, board and, later, the automation of T3
(starting and following agents), with an estimate per way, a UI stack for the board and what the
licences mean. Written for TASK-2.3 (2026-11-13). It builds on [Backlog.md as braid's
reference](doc-1%20-%20TASK-2.1-report-Backlog.md-as-braids-reference.md) (TASK-2.1) and the user's lean of 2026-11-13: reimplement a compatible
Node tracker with Backlog.md as the reference, wrapping its CLI during the transition. Fork and wrap
are estimated only roughly. The board's lanes, derived-state sources and agent starts are TASK-2.2's.

Evidence: the braid skills (`.agents/skills/braid/SKILL.md`, `references/workflow.md`,
`assets/task.md`, `braid-worker`, `braid-reviewer`), BRAID.md, the
