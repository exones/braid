---
id: '0005/A'
title: "Read braids: the braids/ format, braid list, braid view"
status: Done
labels: ["kind:story", "tier:L"]
dependencies: []
order: 10
---

Goal: braid reads the `braids/` folder and shows it: the persistent format every later story builds on.

Expected size: about 500 to 900 lines with tests, in 6 to 10 files.

Start here (read in this order):
- doc-5 ""Decided so far"" and ""Round 3"", story 2.
- `archive/backlog/docs/doc-1 - TASK-2.1-report-Backlog.md-as-braids-reference.md`: how Backlog.md parses front matter and sections (a reference, not a format to copy).

Change:
- The format: `braids/<0001-slug>/` with `brief.md` (front matter: id, title, status `Outline | To Do | In Progress | Done`, labels, dependencies, order, delivery mode `epic | main`; then sections), `report.md`, `log-<date>-<thread>.md` files, `temp/`; strands in `<A-slug>/` folders with the same files. Document it in a short `docs/braids-format.md`.
- A parser and loader with clear errors for malformed files.
- `braid list` (braids with their strands, status and order) and `braid view <0002>` / `<0002/A>` (brief, report presence, log files).
- `.gitignore`: `braids/**/temp/`.

Already decided (don't re-investigate): doc-5 "Decided so far" (`archive/backlog/docs/doc-5 - New-braid-implementation-plan-draft.md`) and the parent TASK-5. Node.js 26, strict TypeScript, ESM; the skeleton from TASK-4 (`src/cli.ts` router, tests that run the built CLI). Cross-platform: Windows and Ubuntu.

Out of scope: creating or editing (TASK-5.2), logs and reports (TASK-5.3), reading other branches (story 3).

## Acceptance

- [x] docs/braids-format.md describes the folder, file and front matter format
- [x] braid list and braid view show fixture braids and strands correctly, covered by tests
- [x] Malformed briefs give a clear error naming the file
- [x] npm run verify passes; CI green on Windows and Ubuntu

## Definition of done

- [x] The gate command from BRAID.md passes
- [x] Final summary written: what changed, why, validation, anything open

## Plan

1. Format (docs/braids-format.md): `braids/NNNN-slug/` braids and `X-slug/` strands (one capital letter); each with `brief.md`, optional `report.md`, `log-YYYY-MM-DD-<thread>.md` (thread: 8 letters/digits or `user`), `temp/` (gitignored). Front matter is a small YAML subset: `key: value`, quoted strings, inline `[a, b]` or block `- a` lists. Keys: id (braid `0002`, strand `0002/A`, must match the folder), title, status (Outline | To Do | In Progress | Done), labels, dependencies (braid or strand ids), order (integer, optional), delivery (epic | main, braids only, default epic). Unknown keys are errors. Body: `## ` sections.
2. Code: `src/braids/frontmatter.ts` (subset parser, line-numbered errors), `src/braids/brief.ts` (validated Brief + sections), `src/braids/store.ts` (find root: nearest ancestor with `braids/` or `.git`, else cwd; load braids, strands, report presence, logs; errors name the file), `src/commands/list.ts`, `src/commands/view.ts`; `src/cli.ts` routes `list` and `view` and lists them in help. No new dependencies.
3. Output: `braid list` prints braids by number with strands indented in run order (order, then letter); `braid view <0002>` / `<0002/A>` prints fields, folder, report yes/no, log files, strands (for a braid), then the brief body. Exit 1 for usage or not found, 2 for malformed braids files.
4. Tests (built CLI, like test/cli.test.ts): a fixture repo under test/fixtures/braids/ (two braids, one with strands out of letter order, an Outline, a report and logs); malformed briefs built in temp dirs (missing front matter, bad status, id mismatch, unknown key, bad list, missing brief.md, duplicate number, delivery on a strand).
5. `.gitignore`: `braids/**/temp/`. README: list and view under the CLI section.
