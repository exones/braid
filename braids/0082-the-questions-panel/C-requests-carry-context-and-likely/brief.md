---
id: '0082/C'
title: "Requests carry context and likely answers"
status: To Do
labels: ["kind:story", "tier:L", "ask:data"]
dependencies: []
order: 30
---

## Goal

A request can carry its context and the agent's likely answers, and a look request or FYI is a kind of its own (`look`), so the Questions panel (0082/E) can show the roomy card with one button per option and put looks and FYIs in their collapsed group. Takes in idea 2026-11-23-wcox (P17); the user: "when asking question: propose most probably answers (1, 2, 3 or 4), so that UI can propose them and also always propose free-style one line answer from UI".

Expected size: about 350 lines in 9 files, tests included.

## Start here

- `src/braids/requests.ts`: `Request`, `NewRequest`, `parseRecord` (line 157: a file with an unknown `kind` can't be read, so older versions skip it), `serialise`, `openRequest`, `answer`, `answeredRows`.
- `src/commands/requests.ts`: `askCommand` (its flags and `--file -`), `answerCommand`, the `requests` and `show` printers.
- `src/board/model.ts` `Need` and `needOfRequest`: what the board carries of a request (0082/E reads the new fields from here).
- D96 to D99 (the record), D113 (wakes) and D118 (the approved design, answer 5B) in `docs/decisions.md`; `docs/braids-format.md`, "The request record".
- `braids/0082-the-questions-panel/A-mockups-the-questions-panel/mockups.html`, frames 3 to 5: how context, options and the look/FYI mark are shown.
- `.agents/skills/braid/SKILL.md` ("Talking to the user") and `.agents/skills/braid-pm/SKILL.md`: where coordinators and the PM letter their options today.

## Change

- The request record gets two optional fields, written only when given: `context` (Markdown, at most 4000 characters) and `options` (one to four strings, lettered A to D in order). Older records read unchanged.
- `KINDS` gains a sixth kind, `look`: a look request or an FYI, which blocks nothing (0082/E puts it in the folded "blocks nothing" group). What sort of request it is stays in the one `kind` field. `braid ask --kind look`; wherever the code switches on the kind (act words, lanes, pushes, the board's words), `look` reads as a look, never as a decision.
- `braid ask --context <text>`, `--context-file <path|->`, `--option <text>` (repeated, in order; more than four refused), and `--kind look`. `braid requests` and `braid show` print the options as `A. …` lines and say when context is stored.
- `braid answer <handle> A` (a single letter of a stored option, any case) records the option's text, as `A. <text>`; any other text records as now.
- `Need` carries `context` and `options`, and its kind, for the board.
- The braid and braid-pm skills (`.agents/skills/`): a request to the user or the PM is opened with `--option` for each lettered answer the chat message gives, and `--context-file -` with the message's context when it is longer than the board line. The chat message stays as it is. Keep the skills' words net about even (D116: "don't overblow skills").
- Tests: the fields round-trip; an old record parses unchanged; a `look` request opens, lists and answers; `--option` limits; `braid answer` by letter; `--context-file -`.

## Already decided

- The user's answer 5B (shiny-muffin-fqro, D118): looks and FYIs get a mark of their own on the record.
- The user, 2026-11-26, through the PM, on calm-guitar-nde8 ("avoid spaghetti in fields/state"): "A": no `fyi` flag; the mark is the sixth kind `look`. Accepted: a braid older than this one skips a record of kind `look` (one install serves this machine).
- Changes to `.agents/skills/` are made because the user asked for P25 with P17 (likely answers) in it; the user merges them with the final PR.
- Known limit, accepted: an older braid that rewrites a new record (answers or withdraws it) serialises only the fields it knows and drops `context` and `options`; the answer itself is kept. Say in report.md whether that can happen with the versions in use, and add nothing to prevent it.
- Pushes keep their text (D114); whether a push carries the options is left for later.

## Plan

1. `src/braids/requests.ts`: `context?` and `options?` on `Request` and the file, written only when given, read leniently (a malformed field is dropped, the record still reads); `KINDS` gains `look`; `actOf` gives `look` for it; `optionOf(r, text)` turns a lone letter of a stored option into `A. <text>`.
2. `src/commands/requests.ts`: `braid ask --context`, `--context-file <path|->` (not with `--file -`), `--option` (repeated, one to four, one line each), `--kind look`; `braid answer <handle> [<text>]` (a lone letter from it or `--file` becomes the option); `braid requests` prints `A. …` lines under a request and `context stored`, `braid requests <name>` prints the options and the context.
3. `src/board/model.ts`: `Need` gets `context` and `options` (kind is there); `Reason` and `act` gain `look`. `marks.ts` a `look` reason mark, `notify/message.ts` its tag and `default` priority (nothing waits on it), `web/src/App.tsx` an eye for the mark.
4. Skills: braid's "Talking to the user" and braid-pm's request lines say `--option` per lettered answer and `--context-file -` when the context is longer than the board line.
5. Docs: braids-format "The request record", cli.md, decisions (D119), the CLI help.
6. Tests in `test/requests-options.test.ts`.

## Out of scope

- Showing the fields on the board (0082/E) and answering from the board (0082/D).
- Changing any existing field or event.

## Completion

- [x] `context` and `options` are optional record fields, round-trip, and old records read unchanged, with tests
- [x] `look` is a request kind (`braid ask --kind look`), read as blocking nothing, with tests
- [x] `braid ask --context/--context-file/--option` write them; `braid requests` and `braid show` print them
- [x] `braid answer <handle> <letter>` records the stored option's text, with a test
- [x] `Need` carries `context`, `options` and the kind
- [x] The braid and braid-pm skills open requests with `--option` (and `--context-file -` when the context is longer than the board line)
- [x] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open
