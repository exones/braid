---
id: TASK-2.2
title: 'Spike: the board''s path: starting agents, derived states, the first version'
status: To Do
assignee: []
created_date: '2026-11-13T12:37:00Z'
updated_date: '2026-11-13T12:42:00Z'
labels:
  - kind:spike
  - tier:M
milestone: m-1
dependencies:
  - TASK-2.1
parent_task_id: TASK-2
ordinal: 20
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Goal: the smallest path to braid's own board (roadmap "braid's own board") and how it can start agents, building on TASK-2.1's recommendation. Feeds the follow-up goals. Time box: about two hours of agent work; if it runs out, report what is known and what isn't.

Expected size: an updated roadmap section of about 30 to 60 lines.

Start here (read in this order):
- TASK-2.1's final summary and `docs/backlog-md.md`.
- `docs/roadmap.md`: "braid's own board".
- `.agents/skills/braid/references/workflow.md`: branches, statuses, what the board shows.

Questions:
1. Starting work from outside T3: can a local program start a T3 thread on a worktree, or send a message to an existing thread (API, CLI, link scheme)? If not, the fallback (for example the `claude` or `codex` CLI) and what it loses.
2. Derived states: for Running, In Review, Waiting for you (with the stop case) and Done, the source (`gh`, T3, task labels, branches), how reliable it is and its cost per refresh.
3. The smallest first version: a read-only local board with derived columns, where a goal is one top-level card that expands (or opens) to show its subtasks together, on TASK-2.1's recommended base; its size, and the follow-up goals after it. Also say whether Backlog.md 1.55.3's own board or task view can already show a parent with its subtasks, and how.

Change:
- `docs/roadmap.md` "braid's own board": the recommended path, the first version and the follow-up goals, marked as proposed until the user decides.

Out of scope:
- Re-deciding fork or reference (TASK-2.1), building the board, product code and skill changes.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Each of the three questions is answered with evidence (commands run, files or docs read)
- [ ] #2 The roadmap section proposes the path, the first version with its size, and the follow-up goals
- [ ] #3 No product code or skill changes
- [ ] #4 The first version shows a goal as one top-level card that expands to its subtasks; the doc says what Backlog.md already offers for this
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 The gate command from BRAID.md passes
- [ ] #2 Final summary written: what changed, why, validation, anything open
<!-- DOD:END -->
