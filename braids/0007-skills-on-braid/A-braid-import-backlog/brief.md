---
id: '0007/A'
title: "braid import-backlog"
status: Done
labels: ["kind:story", "tier:M", "ask:architecture"]
dependencies: []
order: 10
---

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

## Acceptance

- [x] braid import-backlog turns a fixture backlog/ into braids/ that pass braid check, mapping ids, strands, statuses, labels, dependencies, order, acceptance, plan, notes, final summary and docs as described
- [x] --dry-run prints what it would write and writes nothing; existing targets or unparsable input stop it before any write
- [x] docs/braids-format.md and the README describe the command
- [x] npm run verify passes; CI green on Windows and Ubuntu

## Definition of done

- [x] The gate command from BRAID.md passes
- [x] Final summary written: what changed, why, validation, anything open

## Plan

1. src/backlog/parse.ts: parse a Backlog.md task file (YAML front matter subset incl. lists and folded `>-` scalars; sections between SECTION/AC/DOD markers) into a plain object; parse docs (front matter + body).
2. src/backlog/import.ts: plan the import (pure): TASK-N -> braid, N.M -> strand letters in subtask-number order, status/labels/deps/order mapping, brief body, log from notes, report from final summary plus linked docs; collect refusals (existing braid number/folder, unparsable input); write only after planning succeeds; then run checkBraids.
3. src/commands/import.ts + cli wiring: `braid import-backlog [--dry-run]`; dry run prints the plan, writes nothing; archived/drafts reported as not imported.
4. Tests (test/import.test.ts) on a fixture copied from a few real tasks (parent+subtasks, lone task, task with doc, task with notes and final summary); refusal cases and dry run.
5. docs/braids-format.md and README: the command. Verify, PR.
