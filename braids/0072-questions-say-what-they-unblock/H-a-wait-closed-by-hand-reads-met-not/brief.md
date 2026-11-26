---
id: '0072/H'
title: "A wait closed by hand reads met, not answered by the user"
status: To Do
labels: ["kind:task", "tier:S"]
dependencies: ['0072/A']
order: 35
---

## Goal

A wait is a request to another braid's coordinator (`--to <number>`, `--done-when braid:<number>` or `pr:<n>`). When its coordinator closes it with `braid answer`, the record says "answered by the user", and the board's new Decided group lists it as the user's decision. A wait that is met should read as met, and `braid answer` on a wait should never default to the user.

Expected size: about 80 lines in 3 files, tests included.

## Start here

- The report, from the dctl-studio PM through this programme's PM (2026-11-26): a coordinator closing a wait request (`--done-when braid:<n>`) with `braid answer` gets it recorded as "answered by the user" (q-lygc, q-bz7z, q-9xam in dctl-studio). A satisfied wait should close itself as "met", and `braid answer` on a wait shouldn't default to the user.
- `src/commands/requests.ts`: `answerCommand` (`--from` defaults to `user`), `withdrawCommand`, `target`.
- `src/braids/requests.ts`: `isWait`, `isTimedWait`, `conditionEnding`, `endRequest`, `answeredRows` (what `braid decisions` lists).
- `src/board/record.ts`: the Requests tab's `decided` group (0072/B), which takes every `answered` request.

## Change

- `braid answer` on a wait:
  - if its condition holds now (`conditionEnding`), close it as `met`, by the coordinator, with the condition's text;
  - otherwise refuse and change nothing. The refusal says that a wait ends when its condition holds (the board closes it and wakes the asker), and that `braid withdraw <handle> --why` ends one that is no longer needed.
  - `--from user` or `--from pm` on a wait is refused too.
- The Decided group and `answeredRows` leave out waits and timed waits, whatever their state. Records already written (such as the dctl-studio ones) are left as they are.
- Tests: an answer on a met wait records `met` by the coordinator; on an unmet wait it is refused with nothing written; a wait answered before this change doesn't show under Decided or in `braid decisions`.

## Already decided

- Taken into 0072 at the PM's request (2026-11-26): it shows in 0072/B's Decided group.
- No change to the stored format, and no rewrite of old records.

## Out of scope

- The board's own wake for met waits (0071), which already closes them as met.

## Completion

- [ ] `braid answer` on a wait records `met` when its condition holds and refuses otherwise, never "answered by the user", with tests
- [ ] Waits are left out of the Decided group and `braid decisions`, with tests
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
