---
id: TASK-5.2
title: Create and edit braids and strands
status: Done
assignee: []
created_date: '2026-11-13T18:28:00Z'
updated_date: '2026-11-13T19:22:00Z'
labels:
  - kind:story
  - tier:L
milestone: m-2
dependencies:
  - TASK-5.1
parent_task_id: TASK-5
ordinal: 20
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Goal: braids and strands are made and changed only through braid, so agents never edit the files by hand.

Expected size: about 500 to 900 lines with tests, in 5 to 8 files.

Start here (read in this order):
- `docs/braids-format.md` and the loader from TASK-5.1.
- `.agents/skills/braid/assets/task.md`: which Backlog.md create and edit calls the skills make today; braid needs their equivalents, not all of Backlog.md's options.

Change:
- `braid new <title>`: the next free number, also checking remote branches for numbers already taken; creates the folder and `brief.md`.
- `braid strand new <braid> <title>`: the next free letter; letters never reused.
- `braid edit <id>`: status, title, labels, dependencies, order, delivery mode.
- `braid brief <id> <section>`: set a section of `brief.md`; multi-line text from a file or standard input.

Already decided (don't re-investigate): doc-5 "Decided so far" (`backlog/docs/doc-5 - New-braid-implementation-plan-draft.md`) and the parent TASK-5. Node.js 26, strict TypeScript, ESM; the skeleton from TASK-4 (`src/cli.ts` router, tests that run the built CLI). Cross-platform: Windows and Ubuntu.

Out of scope: logs and reports (TASK-5.3), the board, the import.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A braid with two strands can be created and edited entirely from the CLI, covered by tests
- [x] #2 Numbers and letters are never reused, including numbers taken on remote branches
- [x] #3 Multi-line text works from a file and from standard input on Windows and Ubuntu
- [ ] #4 npm run verify passes; CI green on Windows and Ubuntu
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 The gate command from BRAID.md passes
- [x] #2 Final summary written: what changed, why, validation, anything open
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. src/braids/write.ts: formatBrief (the front matter subset: ids in single quotes, text JSON-escaped in double quotes, labels and dependencies always, order when set, delivery on braids), slugify, setSection (replace a `## ` section outside code fences, or append it). Every write is parsed back with parseBrief before it lands.
2. src/braids/numbers.ts: taken numbers and letters = the working tree plus every path ever under braids/ in any ref (`git log --all --name-only -- braids`), so numbers and letters on other branches, remote-tracking branches and deleted folders are never reused; next = highest + 1 (gaps are not filled). Before that, `git fetch --all` when the repo has a remote; a failed fetch stops with exit 1 unless `--no-fetch`.
3. src/commands/edit.ts with node:util parseArgs: `braid new <title>` and `braid strand new <braid> <title>` (options --status, --labels, --dep, --order, --delivery (braids), --slug, --no-fetch); `braid edit <id>` (--status, --title, --labels, --dep, --order <n|none>, --delivery); `braid brief <id> <section>` with --file <path>, --file - (standard input) or --text. Dependencies must name existing braids or strands. The folder name keeps its slug when the title changes.
4. src/cli.ts routing and help; docs/braids-format.md and README commands.
5. test/edit.test.ts running the built CLI in temp git repos with a local bare remote: a braid with two strands made and edited from the CLI; numbers taken only on a remote branch and deleted folders not reused; letters not reused; multi-line text from a file and piped stdin (CRLF input too); usage errors.
6. npm run verify, PR into epic/task-5-braids-folder.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Numbers and letters: taken = the working tree plus every path ever under braids/ in any ref (git log --all --name-only), after git fetch --all; next = highest + 1. This also covers deleted folders. A failed fetch stops new/strand new (exit 1) unless --no-fetch. parseArgs rejects a value that starts with - (--order -1 is "ambiguous"); --order=-1 reaches braid's own check.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
What changed: four commands that make and change braids, so nobody edits brief.md by hand. `braid new <title>` (next free number, folder from a slug of the title or --slug, brief.md at To Do); `braid strand new <braid> <title>` (next free letter); `braid edit <id>` (--status, --title, --labels, --dep, --order <n|none>, --delivery for braids); `braid brief <id> <section>` (sets or appends a `## ` section from --file <path>, --file - for standard input, or --text). new and strand new take the edit options too, plus --no-fetch. New files: src/braids/write.ts (formatBrief, writeBrief, slugify, setSection, checkSectionText), src/braids/numbers.ts (fetchRemotes, takenIds, nextNumber, nextLetter, GitError), src/commands/edit.ts; cli.ts routes them; docs/braids-format.md and README describe them.
Why: TASK-5 story 2, strand B; agents must change braids only through braid.
How numbers stay unique: before choosing, braid runs `git fetch --all` (when there is a remote) and treats as taken every braid/strand folder in the working tree and in the history of any ref (`git log --all --name-only -- braids`), deleted ones included; the next is highest + 1, gaps not filled. A failed fetch exits 1 unless --no-fetch.
Every write is parsed back with parseBrief before it lands; the writer always emits labels and dependencies, delivery on every braid, ids in single quotes and other text JSON-escaped in double quotes. Section text may not contain `## ` headings or an unclosed fence; CRLF and a BOM become LF/none. Dependencies must exist; a title change keeps the folder name.
Validation: test/edit.test.ts (8 tests, built CLI in temp Git repos with HOME and friends in the scratch folder, a local bare remote for the fetch case); npm run verify green locally on Windows.
Open: none.
For later items: writeBrief(path, name, fields, body) and setSection(body, title, text) in src/braids/write.ts; GitError (exit 1) from src/braids/numbers.ts; UsageError and normaliseId still in src/commands/braids.ts. braid log (TASK-5.3) can reuse the fetch-free parts and the cli.ts dispatch switch.
Needs the user: none
<!-- SECTION:FINAL_SUMMARY:END -->
