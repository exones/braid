---
id: '0084/A'
---

# 0084/A: Several open questions on the record and in the CLI

## What changed

A new question no longer withdraws an open one, so any number stay open per item and asker.

- **Record** (`src/braids/requests.ts`): a new request withdraws its asker's open one on the item only for a wait to the same braid, a timed wait or a `review` request. No new field, flag or state.
- **`braid answer <id>` / `braid withdraw <id>`** with several open list each name with whose it is and its kind (`the coordinator's plan`, `the coordinator's, waiting on braid 0042`, `timed wait`), say to give the name, and change nothing. `--by` is suggested only when it would leave one asker with exactly one.
- **`braid status`** prints every open request of an item, waits and those still with the PM included, one line each with its name. The card's own lines now start with the name too.
- **`braid forward`** takes a name or an id; an id with several questions still with the PM lists them and changes nothing.
- `braid ask` says `replacing <name>` only when something was replaced, which a question never does.

## Why

The user, 2026-11-27: "We found a hole with questions ... they can stack one on top of another." On 2026-11-28 a coordinator's plan request on 0084 was withdrawn when another coordinator asked on the same number.

## Decisions

- **`braid forward` also takes a name** (not in the brief; accepted by the coordinator). With several open, an id could only ever reach the oldest, so a second question to the PM could not be forwarded.
- **`braid status` reads the record itself** for the extra lines, so the board's code is unchanged.
- Recorded the user's rule as D121 in `docs/decisions.md`, with a note on D101.

## Validation

- `npm run verify`: exit 0, 822 of 822 tests, 23 minutes (another full gate was loading the machine).
- New `test/requests-several.test.ts`: three questions on one item, `--by pm` and `pm/<slug>`, two coordinators on one braid number, the refusal by id, `braid status`, `braid forward`.
- `test/requests-record.test.ts`: waits, timed waits and `review` requests still replace their own sort, and a `review` leaves questions open.
- Old tests that expected the replacing rule or the old messages follow the new ones.

## Docs

Updated: the CLI help (`src/cli.ts`), `docs/cli.md` (`status`, `ask`, `forward`, `answer`, `withdraw`), `docs/braids-format.md` (the request record and `braid answer`), `docs/board.md` (one sentence on the PM's requests), `docs/decisions.md` (D121). `README.md` and `docs/getting-started.md` state nothing this changes.

## Open

- Until 0084/C, the board keeps only the newest request per asker on an item. A question asked after a `review` request hides that review on the board: no merge button, and the item may not read In Review. The record and `braid status` still list it.
- `.agents/skills/braid/SKILL.md` (about lines 152 and 196) still says a new question replaces the open one (0084/D).

For later items: 0084/C must show the review beside newer questions. 0084/D updates the two skill lines.

Needs the user: none
