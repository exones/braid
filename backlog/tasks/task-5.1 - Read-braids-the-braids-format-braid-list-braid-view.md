---
id: TASK-5.1
title: 'Read braids: the braids/ format, braid list, braid view'
status: To Do
assignee: []
created_date: '2026-11-13T18:28:00Z'
labels:
  - kind:story
  - tier:L
milestone: m-2
dependencies: []
parent_task_id: TASK-5
ordinal: 10
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Goal: braid reads the `braids/` folder and shows it: the persistent format every later story builds on.

Expected size: about 500 to 900 lines with tests, in 6 to 10 files.

Start here (read in this order):
- doc-5 ""Decided so far"" and ""Round 3"", story 2.
- `backlog/docs/doc-1 - TASK-2.1-report-Backlog.md-as-braids-reference.md`: how Backlog.md parses front matter and sections (a reference, not a format to copy).

Change:
- The format: `braids/<0001-slug>/` with `brief.md` (front matter: id, title, status `Outline | To Do | In Progress | Done`, labels, dependencies, order, delivery mode `epic | main`; then sections), `report.md`, `log-<date>-<thread>.md` files, `temp/`; strands in `<A-slug>/` folders with the same files. Document it in a short `docs/braids-format.md`.
- A parser and loader with clear errors for malformed files.
- `braid list` (braids with their strands, status and order) and `braid view <0002>` / `<0002/A>` (brief, report presence, log files).
- `.gitignore`: `braids/**/temp/`.

Already decided (don't re-investigate): doc-5 "Decided so far" (`backlog/docs/doc-5 - New-braid-implementation-plan-draft.md`) and the parent TASK-5. Node.js 26, strict TypeScript, ESM; the skeleton from TASK-4 (`src/cli.ts` router, tests that run the built CLI). Cross-platform: Windows and Ubuntu.

Out of scope: creating or editing (TASK-5.2), logs and reports (TASK-5.3), reading other branches (story 3).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 docs/braids-format.md describes the folder, file and front matter format
- [ ] #2 braid list and braid view show fixture braids and strands correctly, covered by tests
- [ ] #3 Malformed briefs give a clear error naming the file
- [ ] #4 npm run verify passes; CI green on Windows and Ubuntu
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 The gate command from BRAID.md passes
- [ ] #2 Final summary written: what changed, why, validation, anything open
<!-- DOD:END -->
