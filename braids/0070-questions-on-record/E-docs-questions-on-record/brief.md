---
id: '0070/E'
title: "Docs: Questions on record"
status: To Do
labels: ["kind:task", "tier:S"]
dependencies: ['0070/A', '0070/B', '0070/C', '0070/D']
order: 50
---
## Goal

The project's docs describe questions on record as a whole: the `braid-requests` branch and its form, codes, states and history, who answered, "done when", withdrawing, the board and pushes, the skills' chat questions and end markers.

Expected size: about 150 lines in 6 files.

## Start here

- Everything this braid changed, from its first strand: `git log --oneline main..braid/0070-questions-on-record` and each strand's `report.md`.
- The `docs` list in `BRAID.md`.

## Change

- Bring the docs from `docs` in `BRAID.md` up to date as a whole: README and getting started, `docs/cli.md`, `docs/board.md`, `docs/autonomy.md`, `docs/braids-format.md` (the record's form), `docs/decisions.md` (the record on its own branch, codes, states, answers off the braid branch, no question tool, the end markers, and why), `docs/roadmap.md` status, and the CLI's help text.

- From 0070/B's review (https://github.com/exones/braid/pull/269#issuecomment-7102957695): the `recap` help line in `src/cli.ts` still says the draft comes from `report.md`, the PR and the facts; `docs/braids-format.md` and `docs/autonomy.md` ("What the CLI enforces") still describe `braid decisions` and `braid recap` as reading only `Decided:` log entries, not the answered requests.

- From 0070/D (https://github.com/exones/braid/pull/271#issuecomment-7106247124): `docs/decisions.md` D82 still says PM decisions are logged as `Decided:`; add a note that D99 supersedes that (they are now the `--from pm` answers with their reason). And the braid skill's "Launched by a PM" says "the user's answer on the board" wakes the coordinator, but the board has no Answer button: make it "the user's reply". That is one skill wording fix, asked by the user through this braid.
- The upgrade path (the PM): requests opened with a pre-0070 `braid` sit in `.braid/requests.json` and are carried over once by 0070/A's migration. Say so where the docs describe installing or updating, and check it once by hand: put an open request in a temporary clone's `.braid/requests.json`, run `braid requests` with the built CLI, and note the result in `report.md`.

## Already decided

- The decisions record names the user's words from the braid's "Already decided" for each user decision.

## Out of scope

- Code and skills.

## Completion

- [ ] Docs from BRAID.md `docs` that this braid makes untrue are updated
- [ ] report.md lists each doc from `docs` as updated or unchanged
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
