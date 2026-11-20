---
id: '0049/E'
title: "Board: show an unreadable GitHub once"
status: In Progress
labels: ["kind:task", "tier:S", "sweep"]
dependencies: ['0049/A']
order: 12
---

## Goal

Since 0049/A, unreadable GitHub shows twice: the readiness banner above the lanes plus the older header note on the board, and a `not ready:` line plus the older `note: GitHub could not be read` line in `braid status`. Show it once in each place (leftover 2026-11-20-2odh, from the review of 0049/A).

Expected size: about 40 lines in 4 files.

## Start here

- `web/src/App.tsx`: the header note for GitHub (around line 1074 at 0049/A's merge) and the readiness banner (around line 1101).
- `src/commands/coordinate.ts`: the `note: GitHub could not be read` lines (around lines 124 and 159) and the readiness lines `braid status` prints.
- `src/braids/readiness.ts` and `test/readiness.test.ts` from 0049/A; `docs/board.md` ("Not ready") and `docs/cli.md`.

## Change

- Keep one message per place for unreadable GitHub. The readiness problem stays (strand C reuses it per project); drop or merge the duplicate, keeping what the old note said that the banner doesn't (that PRs and checks are missing and lanes come from stored statuses).
- Tests: with GitHub unreadable, the board page data and `braid status` carry the message once.
- `docs/board.md`, `docs/cli.md` where they describe either message.

## Already decided

- A sweep strand of 0049, asked by the user on 2026-11-20.

## Out of scope

- Other notes on the board, and the banner's style.

## Completion

- [x] With GitHub unreadable, the board shows one GitHub message and `braid status` prints one GitHub line, with a test for each
- [x] The docs describe the single message
- [ ] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open
