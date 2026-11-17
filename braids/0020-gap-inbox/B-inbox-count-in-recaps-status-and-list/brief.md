---
id: '0020/B'
title: "Sweep due in recaps, counts in braid list"
status: To Do
labels: ["kind:story", "tier:M"]
dependencies: ['0020/A']
order: 20
---

## Goal

The inbox stays out of the way until it matters. A recap says nothing about it until a sweep is due, then one short line says so. `braid list` shows the counts in one line.

Expected size: about 120 to 200 lines in 4 to 5 files, with tests.

## Start here

- `../brief.md` and `../A-inbox-entries-braid-note-and-braid-inbox/report.md`: the inbox and the reading functions 0020/A added.
- `src/commands/facts.ts` (`recapCommand`): the recap draft and its `For later items` lines. `src/commands/requests.ts`: `braid handover` prints the draft.
- `src/commands/braids.ts` (`braid list`).
- `docs/braids-format.md`, `docs/cli.md`.

## Change

- The recap draft (`braid recap`, and so `braid handover`) ends with `Sweep due: <n> open leftovers` when 3 or more leftovers are open, and otherwise says nothing about the inbox. It never lists entries or mentions ideas.
- `braid list` ends with `Inbox: <open> leftovers, <ideas> ideas` (counts only, no entries).
- Both read the local refs without fetching, as the rest of the recap does; `braid inbox` is there for a fresh read.
- Tests, `docs/braids-format.md` and `docs/cli.md`.

## Already decided

- The counts cover the whole project, not only this braid.
- Recaps show the inbox only when a sweep is due, and never list entries or ideas: the inbox can grow (user, 2026-11-18). The sweep proposal itself lists the leftovers (0020/D).
- `braid status` gets no inbox line: it is per braid (cut after the plan review).
- The coordinator captures before `braid handover`, so the count is right in the draft (0020/D).

## Out of scope

- The board (0020/C); the skills (0020/D).

## Completion

- [ ] `braid recap` and `braid handover` end with `Sweep due: <n> open leftovers` at 3 or more open leftovers and say nothing about the inbox below that; covered by tests
- [ ] `braid list` shows the open counts of both kinds; covered by a test
- [ ] `docs/braids-format.md` and `docs/cli.md` describe it
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
