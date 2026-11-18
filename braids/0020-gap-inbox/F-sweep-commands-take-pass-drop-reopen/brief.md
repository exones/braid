---
id: '0020/F'
title: "Sweep commands: take, pass, drop, reopen"
status: In Progress
labels: ["kind:story", "tier:M"]
dependencies: ['0020/A']
order: 15
---

## Goal

The coordinator records a sweep, and the user's later decisions on ideas, with braid commands that change entries on `braid-inbox`: take entries into braids, pass over leftovers, drop entries with a reason, and bring a dropped one back.

Expected size: about 200 to 300 lines in 3 to 4 files, with tests.

## Start here

- `../brief.md`: the sweep and drop rules.
- `../A-inbox-entries-braid-note-and-braid-inbox/report.md`: the entry format, the shared write function and the reading functions 0020/A added. Use them; don't write a second way to commit to `braid-inbox`.
- `src/cli.ts`, `docs/braids-format.md`, `docs/cli.md`.

## Change

- `braid inbox take <entry>... --into <braid id>[,<braid id>...]`: `status: taken`, with `into` set.
- `braid inbox pass <leftover>...`: `passed` + 1. At 2 the entry becomes `dropped` with `why: passed over in 2 sweeps`. An idea is refused with a message: ideas are never passed over.
- `braid inbox drop <entry>... --why "<reason>"`: `status: dropped`, with `why` set.
- `braid inbox reopen <entry>`: back to `open`, with `why` removed and `passed` reset to 0.
- Each command validates every entry it names first, so a typo changes nothing. It then writes all its changes as one commit through 0020/A's write function, for example `docs(inbox): sweep: take 2, pass 1, drop 1`.
- Tests on temporary repositories with a bare remote, and the docs.

## Already decided

- One verb per command, for the CLI's plain style. A sweep is a few commands in a row.
- No move between kinds: drop the entry, then note it again in the other kind (cut after the plan review).

## Out of scope

- The coordinator's rules for when to sweep (0020/D).

## Completion

- [x] take, pass (dropping a leftover at 2 and refusing an idea), drop and reopen change entries on `braid-inbox` as described, one commit per command; covered by tests
- [x] An unknown entry id makes the command change nothing; covered by a test
- [x] `braid help`, `docs/braids-format.md` and `docs/cli.md` describe the commands
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open

## Plan

One new file `src/commands/sweep.ts` with the four verbs, dispatched from `inboxCommand` when the first argument is `take`, `pass`, `drop` or `reopen`. Each runs inside `writeInbox`: its `change` loads and validates every named entry on the current view (so a typo throws before any commit, and the check repeats on the fetched tip after a refused push), then returns all changed files as one commit. Tests in `test/inbox-sweep.test.ts`; docs in cli.md, braids-format.md and `braid help`.
