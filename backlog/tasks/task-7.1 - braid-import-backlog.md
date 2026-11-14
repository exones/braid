---
id: TASK-7.1
title: braid import-backlog
status: To Do
assignee: []
created_date: '2026-11-14T11:18:00Z'
updated_date: '2026-11-14T11:19:00Z'
labels:
  - kind:story
  - tier:M
  - ask:architecture
milestone: m-4
dependencies: []
parent_task_id: TASK-7
ordinal: 10
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Goal: one command turns a project's Backlog.md tasks into braids, so this repository and every other project on the braid skills can switch to braid the same way.

Expected size: about 500 to 800 lines with tests.

Start here (read in this order):
- `docs/braids-format.md`: the target format (folders, `brief.md` front matter, sections, logs, reports).
- `src/braids/` (`store.ts`, `write.ts`, `numbers.ts`, `logs.ts`) and `src/commands/`: reuse the parser, writer and slug rules; follow how `braid new` and `braid strand new` are wired in `src/cli.ts`.
- `backlog/tasks/` and `backlog/docs/` in this repository: the real input. A task file has YAML front matter (id, title, status, labels, milestone, dependencies, parent_task_id, ordinal, dates) and sections between `<!-- SECTION:…:BEGIN/END -->`, `<!-- AC:… -->` and `<!-- DOD:… -->` markers; a doc links to its task through the task's `documentation` list (TASK-2 and its subtasks have them).

Change:
- `braid import-backlog` (with `--dry-run`): reads `backlog/tasks/` and `backlog/docs/` and writes `braids/`. TASK-N becomes `000N-<slug>`; its subtasks become strands in subtask-number order (TASK-6.1 → `0006/A`, TASK-6.2 → `0006/B`). Status, labels, dependencies (as braid and strand ids) and ordinal → `order` carry over; a parent with subtasks gets `delivery: epic`.
- The brief body keeps the description as is, then `## Acceptance` and `## Definition of done` as checkbox lists with their ticks, then `## Plan`. The notes go into `log-<created date>-import.md`; the final summary into `report.md`; a linked doc's text is appended to that item's report under its title; a doc linked from both a braid and one of its strands goes to the strand only. Milestones are dropped.
- It refuses, changing nothing, when a target folder or number already exists, or when an input file doesn't parse; it ends by running the same checks as `braid check`. It never deletes or moves `backlog/` (TASK-7.4 does that here).
- Tests on a fixture made from a copy of a few of this repository's tasks (a parent with subtasks, a lone task, a task with a doc, one with notes and a final summary).
- `docs/braids-format.md` and the README: the command.

Already decided (don't re-investigate): the parent TASK-7 and doc-5; a lasting, tested CLI command; archived and draft tasks aren't imported (say so in the output); no Backlog.md library dependency.

Out of scope: running it on this repository (TASK-7.4), the skills (TASK-7.3).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 braid import-backlog turns a fixture backlog/ into braids/ that pass braid check, mapping ids, strands, statuses, labels, dependencies, order, acceptance, plan, notes, final summary and docs as described
- [ ] #2 --dry-run prints what it would write and writes nothing; existing targets or unparsable input stop it before any write
- [ ] #3 docs/braids-format.md and the README describe the command
- [ ] #4 npm run verify passes; CI green on Windows and Ubuntu
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 The gate command from BRAID.md passes
- [ ] #2 Final summary written: what changed, why, validation, anything open
<!-- DOD:END -->
