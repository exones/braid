---
id: '0084/A'
title: "Several open questions on the record and in the CLI"
status: To Do
labels: ["kind:story", "tier:M"]
dependencies: []
order: 10
---

## Goal

A coordinator or the PM can keep any number of questions open on one item: `braid ask` no longer withdraws the asker's open question there, `braid status` and `braid requests` show every open one, and an id alone is refused when several are open. The board is 0084/C's.

Expected size: about 250 lines in 6 files, tests included.

## Start here

- `src/braids/requests.ts`: `replaces` and `openRequest` (the withdrawal "replaced by <handle>"), `closeRequest`, `endRequest`.
- `src/commands/requests.ts`: `askCommand` (the `, replacing <name>` output), `target` (the refusal with several open, today only for a question beside a wait), `braid handover` (opens a `review` request through `openRequest`).
- `src/commands/braids.ts` and `src/commands/coordinate.ts`: what `braid status` prints for an item's open request.
- `test/requests-record.test.ts`, `test/pm-requests.test.ts`, `test/pm-asks.test.ts`: the tests of today's replacing rule.
- `docs/cli.md` rows `braid ask`, `braid answer`, `braid withdraw`, and `docs/braids-format.md` "Requests": today's rule in words.

## Change

- `src/braids/requests.ts`: a new request withdraws an open one of its asker on its item only when both are waits to the same braid, both timed waits, or both `review` requests. A question of any other kind withdraws nothing.
- `src/commands/requests.ts`: `braid ask` says `replacing <name>` only when a wait or timed wait replaced one. `braid answer <id>` and `braid withdraw <id>` with several open (one asker or both) list every handle with its kind (`waiting on braid <n>` for a wait) and change nothing; the message says to give the name.
- `braid status`: every open request of an item, one line each with its handle, not only one.
- Programme requests (`pm/<slug>`) and `--by pm` follow the same code path; cover both in tests.
- A test for the case that happened on 2026-11-28: one coordinator's plan request q-um22 on 0084 was withdrawn "replaced by fresh-dolphin-azs7" when another coordinator asked on the same number; after this change both stay open.
- The CLI help and usage lines for these commands, where they state the old rule.

## Already decided

- Read the braid brief `braids/0084-several-open-questions-per-item/brief.md` "Already decided": it is binding.
- No new record field, flag or state. Replacing one's own question is `braid withdraw <handle>`, then `braid ask`.
- `closeRequest` (used by `braid start`, `braid accept`, `braid done`) keeps closing every open request of the item.
- The board still keeps one request per item in `src/board/signals.ts` until 0084/C; don't change the board here.

## Out of scope

- The board, its pushes and the Questions panel (0084/C).
- The skills' text and the docs as a whole (0084/D).

## Completion

- [ ] A test asks three questions on one item (one asker) and finds three open; each is answered by its handle and the others stay open
- [ ] The same for `pm/<slug>` and for `--by pm` on a braid
- [ ] A wait still replaces its asker's wait to the same braid, a timed wait a timed wait, a `review` request an older `review` (tests), and a `review` leaves open questions open
- [ ] `braid answer <id>` and `braid withdraw <id>` with several open list their handles and change nothing (tests)
- [ ] `braid status` shows every open request of an item (test)
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
