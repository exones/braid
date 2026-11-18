---
id: '0020/C'
title: "Board: the inbox"
status: In Progress
labels: ["kind:story", "tier:M", "ui"]
dependencies: ['0020/A']
order: 30
---

## Goal

The board shows the user the project's inbox as two lists, leftovers and ideas: how many entries are open and what they are, read from `braid-inbox`.

Expected size: about 250 to 400 lines in 6 files, with tests.

This is a `ui` item, so it starts with mockups on realistic test data: several leftovers from different sources, one passed over once, a few ideas with titles and a few lines of text, and an empty inbox. Stop and wait for the user's verdict, and build only after they approve (workflow, "Converge loop").

## Start here

- `../brief.md` and `../A-inbox-entries-braid-note-and-braid-inbox/report.md`: the inbox and its reading functions.
- `docs/board.md`: the attention board, its lanes, marks and refresh.
- `src/commands/board.ts` (`/api/board`), `src/board/model.ts` (`toBoard`), `src/board/demo.ts` (sample data), `web/src/App.tsx`, `web/src/api.ts`.
- The mockups of 0015/B and 0009/A in their braid folders, to see how earlier board mockups were shown.

## Change

- `/api/board` carries the open inbox entries: kind, id, title or text, source, age, and passed (leftovers).
- The board reads the local refs on every refresh, and fetches `braid-inbox` when the Refresh button is pressed, so an entry captured in another clone shows up.
- The board shows the open counts and a way to read the entries of each kind, an idea in full; where and how is for the mockups to settle.
- The `--demo` sample data includes entries.
- Tests for the API data, and `docs/board.md`.

## Already decided

- The inbox isn't a lane and puts nothing in Needs You, because capturing asks the user nothing. The sweep proposal reaches the user as a `braid ask`, which the board already shows.
- Read only: no inbox actions on the board (user, 2026-11-18).

## Out of scope

- Taking, dropping, sweeping or adding an idea from the board. The skills (0020/D, 0020/E).

## Completion

- [ ] Mockups on realistic test data shown to the user and approved before building, with the verdicts in the log
- [ ] The board shows the open leftovers and ideas from `braid-inbox`, and Refresh fetches it; covered by tests of the API data
- [ ] `braid board --demo` shows sample entries
- [ ] `docs/board.md` describes it
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open, and final screenshots
