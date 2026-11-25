---
id: '0072/G'
title: "Question codes that can be said aloud"
status: To Do
labels: ["kind:story", "tier:L"]
dependencies: ['0072/A']
order: 15
---

## Goal

The user voice-types about 90% of the time. Give every request a name that can be said aloud: an adjective and a noun ("yellow bear", "purple chair") next to its q-code. Every command that takes a code accepts it loosely, and the CLI shows the words first, so "yellow bear a" works as an answer in chat.

Expected size: about 350 lines in 6 files, word lists and tests included.

## Start here

- Inbox idea 2026-11-25-8l01, taken in (the user, through the PM, 2026-11-25): "Question codes that can be said aloud: an adjective and a noun ('yellow bear', 'purple chair') instead of q-5asx. The user: 'I use voice typing a lot like 90% of the time... naming questions with adjective plus noun would be great, meaning that if I said the question yellow bear or purple chair... would be much much easier.' Shape: two built-in word lists of about 100-150 short, common, distinct-sounding words each. No dependency needed; npm unique-names-generator and human-id do the same, but a list in the repo is deterministic and reviewable. Exclude homophones and near-homophones (bear/bare, pair/pear, blue/blew, right/write), words a speech engine splits or capitalises oddly, and anything rude. Deterministic: picked from a hash of the request id, re-drawn on a clash with an open or recently answered request. Every place that takes a code accepts it loosely: 'yellow bear', 'Yellow Bear.', 'yellow-bear', 'yellowbear', any case, trailing punctuation. Old q-codes keep working. The board, pushes and chat show the words first. In chat an answer reads naturally: 'yellow bear a'."
- `src/braids/requests.ts`: `RecordFile`, `parseRecord`, `toFile`, `newCode`, `openRequest`, `CODE`.
- `src/commands/requests.ts`: `target`, `etaCommand`, `requestsCommand`, and the code normalisation 0072/A added (any letter case).
- The board's and pushes' use of `code` (`src/board/model.ts` `Need.code`, `src/notify/message.ts` `coded`): 0072/B and 0072/C show the name there; this strand only provides it.

## Change

- Two word lists in the repo (adjectives, nouns), about 100 to 150 each, under the exclusions above, with a test that rejects duplicates, listed homophones and words that aren't lowercase ASCII letters.
- A request gets a `name` when it opens: picked from a hash of its code, re-drawn on a clash with an open request or one closed within the last 30 days. Stored as an optional field on the record; a record without it (written before) has no name and keeps its q-code only. The q-code stays the file name and the key.
- One normaliser for every command that takes a code (`braid answer`, `braid withdraw`, `braid eta`, `braid requests <code>`, and any other): a q-code in any case, or the name in any case, spaced, hyphenated or joined, with trailing punctuation. A name that matches no request is refused as "no request named …".
- The CLI's lines show the name first, then the q-code (`yellow bear (q-7f3k)`), in `braid ask`, `braid handover`, `braid requests`, `braid answer`, `braid withdraw`, `braid eta`; the board's wake text too.
- `src/board/model.ts`: `Need` carries the name beside `code`, so 0072/B and 0072/C can show it.
- Tests: the pick is deterministic, a clash re-draws, an old record reads with no name, each loose form finds the request, a q-code still works, an unknown name is refused.

## Already decided

- An added optional field on the record (the PM: ask first only for a change beyond an added field). No new dependency.
- The q-code stays the file name and every key (notification keys, the board's), so nothing already sent or stored changes.

## Out of scope

- How the card and pushes lay the name out: 0072/B and 0072/C (their mockups show it).
- Skills: 0072/E says the name where it mentions a code, if at all.

## Failure modes and required regression tests

- An older braid version reading a record with `name`: the field is ignored, tested by parsing a record with an unknown extra field.
- Two requests opened at once by two threads getting the same name: the pick happens inside the record's write lock against the branch as it is, tested.
- A loose form matching two requests (a closed and an open one): the open one wins, then the newest, tested.

## Completion

- [ ] New requests get an adjective-noun name, deterministic and clash-free, from word lists in the repo, with tests
- [ ] Every command that takes a code accepts the name loosely and old q-codes still work, with tests
- [ ] CLI lines and the wake text show the name first, and records written before keep only their q-code, with tests
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
