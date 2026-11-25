---
id: '0072/G'
title: "Question codes that can be said aloud"
status: To Do
labels: ["kind:story", "tier:L"]
dependencies: ['0072/A']
order: 15
---

## Goal

The user voice-types about 90% of the time. Give every request a name that can be said aloud: an adjective and a noun followed by the four characters of its q-code ("yellow bear 5asx"). The words are unique among open requests, and names may repeat over time. Every command that takes a code accepts the name loosely. Cards, pushes, the CLI and copy buttons show and copy it as one handle, `yellow-bear-5asx`, so copying never loses a piece, and "yellow bear a" works as an answer in chat.

Expected size: about 300 lines in 6 files, word lists and tests included.

## Start here

- Inbox idea 2026-11-25-8l01, taken in (the user, through the PM, 2026-11-25): "Question codes that can be said aloud: an adjective and a noun ('yellow bear', 'purple chair') instead of q-5asx. The user: 'I use voice typing a lot like 90% of the time... naming questions with adjective plus noun would be great, meaning that if I said the question yellow bear or purple chair... would be much much easier.' Exclude homophones and near-homophones (bear/bare, pair/pear, blue/blew, right/write), words a speech engine splits or capitalises oddly, and anything rude. Every place that takes a code accepts it loosely: 'yellow bear', 'Yellow Bear.', 'yellow-bear', 'yellowbear', any case, trailing punctuation. Old q-codes keep working. The board, pushes and chat show the words first. In chat an answer reads naturally: 'yellow bear a'."
- The user's refinement, through the PM, 2026-11-25: "it would be nice if they would repeat from time to time... the same braid could ask question purple chair three times. So I would make it so that no open questions should clash with the human names but in the end we add a small ID of like four [characters] like yellow bear JC49. So that they are mostly unique throughout but at the same time open questions don't clash by name. And if they do you simply ask."
- The user's choice, through the PM, 2026-11-25 ("A)": one handle): shown and copied as one handle `yellow-bear-5asx` everywhere, not "yellow bear · 5asx" in two pieces: "copying one piece must never lose the other".
- `src/braids/requests.ts`: `RecordFile`, `parseRecord`, `toFile`, `newCode`, `openRequest`, `CODE`.
- `src/commands/requests.ts`: `target`, `etaCommand`, `requestsCommand`, and the code normalisation 0072/A added (any letter case).
- The board's and pushes' use of `code` (`src/board/model.ts` `Need.code`, `src/notify/message.ts` `coded`).

## Change

- Two small, familiar word lists in the repo (adjectives, nouns), about 50 to 64 words each (2,500 to 4,000 pairs). Favour the plainest words over coverage. Exclude the cases above. A test rejects duplicates, listed homophones, and words that aren't lowercase ASCII letters.
- A request gets its two words when it opens, inside the record's write lock. They are picked from a hash of its code and picked again only when the pair clashes with an open request in the same project. They are stored as one added optional field (for example `words: "yellow bear"`). The full name is the words plus the q-code's four characters ("yellow bear 5asx"), so there is no new id. A record written before has no words and keeps its q-code only. The q-code stays the file name and every key.
- One resolver for every command that takes a code (`braid answer`, `braid withdraw`, `braid eta`, `braid requests <code>`, and any other). It ignores case, spaces, hyphens, joining and any punctuation:
  - `yellow-bear-5asx`, "yellow bear 5asx", `5asx` or `q-5asx` match any request, open or closed;
  - "yellow bear" (the words alone) matches open requests only;
  - when the words match more than one request, refuse, list the candidates with their suffixes and change nothing; the agent then asks the user which one;
  - nothing matched: refused as "no request named …".
- Display: one handle, `yellow-bear-5asx`, wherever a code is shown or copied: the output of `braid ask`, `braid handover`, `braid requests`, `braid answer`, `braid withdraw` and `braid eta`, and the board's wake text. A record without words shows `q-5asx` as before. One function makes the handle; `Need` in `src/board/model.ts` carries it beside `code`, so 0072/B and 0072/C show and copy the same handle.
- Tests: the pick is deterministic, a clash with an open request leads to a new pick, a clash with a closed request is allowed, an old record reads without words, the handle reads `yellow-bear-5asx` and an old record's `q-5asx`, each loose form resolves, the words alone don't find a closed request, the words plus suffix do, an ambiguous match is refused with its candidates, and a q-code still works.

## Already decided

- One added optional field on the record (the PM: ask first only for a change beyond an added field). No new dependency.
- Uniqueness only among open requests in one project: the record is per project and the CLI reads only its own. The board shows several projects, but checking across them would need every project's record at opening time; a clash across projects is told apart by the project the card shows and by the suffix. Decided by the coordinator.
- The q-code stays the file name and every key (notification keys, the board's), so nothing already sent or stored changes. No migration.
- One handle, `yellow-bear-5asx`, shown and copied everywhere (the user, "A)").

## Out of scope

- Cards, pushes and copy buttons: 0072/B and 0072/C show and copy the handle this strand makes.
- Skills: 0072/E, which mentions the name where it mentions a code, if at all.

## Failure modes and required regression tests

- An older braid version reads a record that has `words`: the field is ignored. Tested by parsing a record with an unknown extra field.
- Two threads open requests at once: the pick happens inside the write lock against the branch as it is, so they don't get the same words. Tested.
- The words match two requests (an open one and a race): refused with both suffixes, nothing written. Tested.

## Plan

1. `src/braids/words.ts`: the two lists (adjectives, nouns, plain lowercase words, no homophones or names a speech engine capitalises), `pickWords(code, taken)` (sha256 of the code, then of `<code>#<n>` on a clash, then a scan; none when every pair is open), `handleOf(r)` (`yellow-bear-5asx`, or `q-5asx` without words), and `resolveName(raw, requests)`: everything but letters and digits dropped, lower-cased; the joined handle, the suffix and `q`+suffix match any request, the joined words open ones only; one code, several (ambiguous) or none.
2. `src/braids/requests.ts`: `words?` on `Request` and `RecordFile` (written after `text`, read when it is two lowercase words); `openRequest` picks inside the write against the open requests in its view and returns the handle too.
3. `src/commands/requests.ts`: `target`, `braid eta` and `braid requests <code>` resolve through `resolveName` (a strict q-code goes straight through as before; item ids and `pm/<slug>` keep their meaning); every output line shows the handle; ambiguous: refused with the candidates' handles, nothing changed; none: "no request named …".
4. `Need.handle` beside `code` (`src/board/model.ts`); the wake text and the reminders (`src/board/wake.ts`, `src/board/remind.ts`) name the handle.
5. Tests: `test/request-words.test.ts` for the lists, the pick, the handle and the resolver, the record (unknown field, clash in the write lock), and the CLI; existing tests' code patterns follow the handle.
6. Docs: `docs/cli.md`, `docs/braids-format.md` (the field), `docs/board.md` where it names codes, `docs/decisions.md`.

## Completion

- [x] New requests get two spoken words, unique among the project's open requests, from short word lists in the repo, and the full name is the words plus the q-code's four characters, with tests
- [x] Every command that takes a code resolves the handle, the words plus suffix, the suffix or the q-code (any request) and the words alone (open requests only), in any case and punctuation, and refuses an ambiguous match with its candidates, with tests
- [x] The CLI and the wake text show one handle `yellow-bear-5asx`, and records written before show `q-5asx` as before, with tests
- [x] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open
