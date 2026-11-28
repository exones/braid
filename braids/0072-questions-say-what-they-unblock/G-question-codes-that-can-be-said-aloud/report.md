# 0072/G: Question codes that can be said aloud

## What changed

- `src/braids/words.ts` (new): two lists of plain words, 60 adjectives and 64 nouns (3,840 pairs), without homophones (bear/bare, blue/blew, whale/wail, beetle/Beatle), names a speech engine capitalises (Rusty, Sandy, Swift), compounds or rude words. `pickWords` picks a pair from a sha256 of the code, again from `<code>#<n>` while an open request has it, then by a scan; `handleOf` makes the one handle, `yellow-bear-5asx` (`q-5asx` without words); `resolveName` reads a name loosely.
- The record (`src/braids/requests.ts`): one added optional field, `words`, written after `text`, read only when it is two lowercase words. `openRequest` picks it inside the write lock against the open requests of the branch as it is then (`takenWords`), and returns the handle beside the code. The q-code stays the file name and every key; no migration.
- Commands (`src/commands/requests.ts`): `braid answer`, `braid withdraw`, `braid eta` and `braid requests <name>` resolve a name through one function: a q-code in any case goes straight through as before; an item id (`0015`, `0015/C`) and `pm/<slug>` keep their meaning; anything else is looked up in the record as origin has it, ignoring case, spaces, hyphens, joining and punctuation. The handle, the words with the suffix, the suffix and the q-code name any request; the words alone only an open one. Several matches: refused with each handle, item and state, nothing written. None: `no request named …`. Every line `braid ask`, `braid handover`, `braid answer`, `braid withdraw`, `braid eta` and `braid requests` print shows the handle, also the "has 2 open requests" and "already answered" refusals.
- Board: `Need.handle` beside `Need.code` (`src/board/model.ts`), for 0072/B and 0072/C to show and copy. The wake text and the reminders and escalation (`src/board/wake.ts`, `src/board/remind.ts`) name the handle, so `braid eta <handle>` in a reminder works as written. Pushes (`src/notify/message.ts`) still lead with `code`: they are 0072/C's.

## Why

The user voice-types most of the time; `q-5asx` is hard to say and "yellow bear" isn't (inbox 2026-11-25-8l01, the user's refinement and choice "A)" in the brief).

## Validation

- `test/request-words.test.ts` (new, 8 tests): the lists (sizes, lowercase ASCII, no duplicates, no listed homophone); the pick is deterministic, picks again on an open clash, a closed request's words are free; the handle and an old record's `q-5asx`; every loose form resolves, the words alone don't find a closed request, the words plus suffix do, an ambiguous name returns its candidates; a record with words and an unknown field parses (the field ignored), one without has no words; the CLI prints the handle, every command takes the name, a race-made duplicate is refused naming both handles with the branch tip unchanged, an old record shows and takes its q-code; two clones opening four requests each at once get eight different pairs.
- Existing tests now read the handle where the output shows it.
- The gate (`npm run verify`) on the final code (f851985): 720 of 720 tests pass (14 min). Earlier runs on a loaded machine failed one test, `overlapping writers in separate processes lose no update when they start on a stale lock` (`test/requests.test.ts`), the flake 0019's report notes: one of six writer processes gave up waiting 10 s for the lock while the whole suite ran in parallel. It passes alone and in this run; this change adds only a hash inside the lock. One run failed on a full disk (ENOSPC), since cleaned. CI is green on Ubuntu and Windows.

## Docs

README (questions on the board), `docs/getting-started.md` (answering by name, by voice), `docs/cli.md` (`ask`, `answer`, `withdraw`, `eta`, `requests`), `docs/braids-format.md` (the `words` field and name resolution), `docs/board.md` (wake, reminder and escalation text), `docs/decisions.md` (D108), the CLI help (`src/cli.ts`). The board's card text in `docs/board.md` still shows `q-7f3k` chips: that display is 0072/B's.

## Open

- Decided: a code whose four characters are all digits (`q-0123`) is named with `q-` or its words, because `0123` is an item id; such a code is 1 in about 3,000.
- Decided: reminders and the PM's escalation name the handle too (the brief listed the wake text); they are the same kind of board text and tell the reader to run `braid eta <handle>`.
- Decided: `braid requests <name>` and `braid eta` given an item id say so ("is an item; give the request's name or code").

For later items: 0072/E can say "name the request (`yellow-bear-5asx`, or `yellow bear` while it is open)" where the skills say "the code".
Needs the user: none
