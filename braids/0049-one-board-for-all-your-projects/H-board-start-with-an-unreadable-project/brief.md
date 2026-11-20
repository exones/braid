---
id: '0049/H'
title: "Board start with an unreadable project list exits 2"
status: To Do
labels: ["kind:task", "tier:S"]
dependencies: ['0049/G']
order: 60
---

## Goal

The final review of 0049 (https://github.com/exones/braid/pull/201#issuecomment-7053032085, blocking 2) found that `braid board` started with an unreadable `~/.braid/projects.json` (corrupt JSON or an unknown version) prints `error: unexpected failure` and exits 5. `docs/board.md` and the comment in `runBoard` promise a clean stop: exit 2 with a message naming the file, as `braid projects` already does. After this strand it does.

Expected size: about 30 lines in 2-3 files.

## Start here

- `src/commands/board.ts` `runBoard` (around 1037): `listed()` / `readProjects()` throw `ProjectsFileError` before anything listens.
- `src/cli.ts`: the `board` handler (around 237-252) catches only `UsageError` and `FormatError`; the `projects` commands map `ProjectsFileError` to exit 2 (around 293-296); the outer catch (around 333-338) gives exit 5.
- `test/board-projects.test.ts` (the while-running case around 421-434) and `test/projects.test.ts` (runs `node dist/cli.js` with the home folder redirected).

## Change

- Map `ProjectsFileError` in the `board` handler to exit 2 with its message, as the `projects` commands do.
- Test: with a corrupt list and with an unknown version, `braid board --no-open` exits 2, the message names the file, and nothing listens. The file is left as it was.

## Already decided

- A fix strand found by the final review; the coordinator doesn't fix product code (braid skill, "Fixes").

## Out of scope

- Any other change to the board or the list.

## Completion

- [ ] `braid board` started with an unreadable project list exits 2 with a message naming the file, and starts nothing
- [ ] A test for a corrupt list and for an unknown version
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
