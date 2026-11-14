---
id: doc-1
title: 'TASK-2.1 report: Backlog.md as braid''s reference'
type: other
created_date: '2026-11-13T15:19:00Z'
---

# Backlog.md as braid's reference

> Research report for TASK-2.1, 2026-11-13. Findings and recommendations, not decisions: nothing here is decided until the user says so. The user's decisions: [TASK-2 report](doc-4%20-%20TASK-2-report-research-results-and-the-users-decisions.md).

A map of how [Backlog.md](https://github.com/MrLesk/Backlog.md) 1.55.3 is built, what braid uses from
it, and a recommendation on how braid gets its own tracker: fork it, wrap it, or reimplement a
compatible tracker with its code as the reference. Written for TASK-2.1 (2026-11-13); it feeds the
user's choice, TASK-2.3 (the CLI estimate) and TASK-2.2 (the board path).

Source paths below (`src/...`) are relative to a checkout of the tag:
`git clone --branch v1.55.3 --depth 1 https://github.com/MrLesk/Backlog.md inspiration/backlog.md`
(`inspiration/` is gitignored). Line counts are `wc -l` over `*.ts`/`*.tsx` files, tests excluded
unless stated.

## Size by part

66,604 lines of product TypeScript in 1.55.3, plus 88,487 lines of tests (283 `*.test.ts` files,
almost all under `src/test/`) and 2,480 lines of build and launcher scripts. The earlier "about 68k,
16k web UI" holds once the web UI's CSS and HTML (375 lines) and the Markdown guides are counted.

| Part | Where | Lines | What it does |
| --- | --- | ---: | --- |
| Task file format and parsing | `src/markdown/` | 2,246 | Front matter (gray-matter), the `<!-- SECTION:…:BEGIN/END -->` blocks, numbered AC and DoD checklists, comments (`structured-sections.ts` alone is 1,522) |
