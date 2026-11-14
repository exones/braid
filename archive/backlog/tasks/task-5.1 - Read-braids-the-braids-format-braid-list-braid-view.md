---
id: TASK-5.1
title: 'Read braids: the braids/ format, braid list, braid view'
status: Done
assignee: []
created_date: '2026-11-13T18:28:00Z'
updated_date: '2026-11-13T19:09:00Z'
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
- [x] #1 docs/braids-format.md describes the folder, file and front matter format
- [x] #2 braid list and braid view show fixture braids and strands correctly, covered by tests
- [x] #3 Malformed briefs give a clear error naming the file
- [x] #4 npm run verify passes; CI green on Windows and Ubuntu
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 The gate command from BRAID.md passes
- [x] #2 Final summary written: what changed, why, validation, anything open
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Format (docs/braids-format.md): `braids/NNNN-slug/` braids and `X-slug/` strands (one capital letter); each with `brief.md`, optional `report.md`, `log-YYYY-MM-DD-<thread>.md` (thread: 8 letters/digits or `user`), `temp/` (gitignored). Front matter is a small YAML subset: `key: value`, quoted strings, inline `[a, b]` or block `- a` lists. Keys: id (braid `0002`, strand `0002/A`, must match the folder), title, status (Outline | To Do | In Progress | Done), labels, dependencies (braid or strand ids), order (integer, optional), delivery (epic | main, braids only, default epic). Unknown keys are errors. Body: `## ` sections.
2. Code: `src/braids/frontmatter.ts` (subset parser, line-numbered errors), `src/braids/brief.ts` (validated Brief + sections), `src/braids/store.ts` (find root: nearest ancestor with `braids/` or `.git`, else cwd; load braids, strands, report presence, logs; errors name the file), `src/commands/list.ts`, `src/commands/view.ts`; `src/cli.ts` routes `list` and `view` and lists them in help. No new dependencies.
3. Output: `braid list` prints braids by number with strands indented in run order (order, then letter); `braid view <0002>` / `<0002/A>` prints fields, folder, report yes/no, log files, strands (for a braid), then the brief body. Exit 1 for usage or not found, 2 for malformed braids files.
4. Tests (built CLI, like test/cli.test.ts): a fixture repo under test/fixtures/braids/ (two braids, one with strands out of letter order, an Outline, a report and logs); malformed briefs built in temp dirs (missing front matter, bad status, id mismatch, unknown key, bad list, missing brief.md, duplicate number, delivery on a strand).
5. `.gitignore`: `braids/**/temp/`. README: list and view under the CLI section.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Decisions: front matter values are always text (`0001` stays `0001`, no YAML number coercion); unknown keys are errors so typos fail loudly; braid ids are `0002`, strand ids `0002/A`, and `id` must match the folder; `delivery` is braid-only (default epic) and an error on a strand; strands without `order` run last, by letter. Root = nearest ancestor holding `braids/` or `.git`. Exit 1 for usage errors, 2 for malformed braids files. No new dependencies: a small YAML-subset parser instead of a YAML library.

Review of PR #60 (not blocking): inline list items now take JSON escapes in double quotes (chose the parser fix over a doc limit), documented in docs/braids-format.md; added tests for a BOM brief, quoted list items with escaped/doubled quotes and commas, and strands without order running last by letter.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
What changed: braid now reads the `braids/` folder. `docs/braids-format.md` defines the layout (`NNNN-slug` braids, `X-slug` strands, `brief.md`, optional `report.md`, `log-<date>-<thread>.md`, ignored `temp/`) and the brief front matter (id, title, status Outline | To Do | In Progress | Done, labels, dependencies, order, delivery epic | main). New code: `src/braids/frontmatter.ts` (a strict YAML subset with line-numbered errors; quoted values and list items take JSON escapes or doubled single quotes), `src/braids/brief.ts` (validated briefs and `## ` sections), `src/braids/store.ts` (root discovery and loading), `src/commands/braids.ts` (`braid list`, `braid view <0002|0002/A>`), routed in `src/cli.ts` and listed in help and the README. `.gitignore` ignores `braids/**/temp/`.

Why: the persistent format every later story builds on (TASK-5.2 writes it, the board reads it).

Validation: `test/braids.test.ts` runs the built CLI against a fixture repo (`test/fixtures/braids-repo`: three braids, strands out of letter order, Outline, report, logs, block and inline lists, quoted ids), temp repos for CRLF and BOM briefs, quoted list items with escaped quotes and commas, strands without `order` running last by letter, and 21 malformed cases (each error names the file, most with a line); `npm run verify` passes locally on Windows; CI green on Windows and Ubuntu.

Open: none.

For later items: `parseBrief(text, file, expectedId)` returns `Brief` with `sections` (title/text from `## ` headings) for `braid brief`; `loadBraids(root)` and `findRoot(cwd)` in `src/braids/store.ts`; `FormatError(file, message)` exits 2 and `UsageError` exits 1 via `src/cli.ts`. Values are text; a writer should quote ids (`'0001'`) for YAML compatibility and may emit JSON-escaped double-quoted strings, in values and list items alike. No writer exists yet; TASK-5.2 adds one that should emit this exact subset.

Needs the user: none
<!-- SECTION:FINAL_SUMMARY:END -->
