---
id: '0082/C'
title: "Requests carry context and likely answers"
status: To Do
labels: ["kind:story", "tier:L", "ask:data"]
dependencies: []
order: 30
---

## Goal

A request can carry its context, the agent's likely answers and a mark that it is only a look or an FYI, so the Questions panel (0082/E) can show the roomy card with one button per option and put looks and FYIs in their collapsed group. Takes in idea 2026-11-23-wcox (P17); the user: "when asking question: propose most probably answers (1, 2, 3 or 4), so that UI can propose them and also always propose free-style one line answer from UI".

Expected size: about 350 lines in 9 files, tests included.

## Start here

- `src/braids/requests.ts`: `Request`, `NewRequest`, `parseRecord` (line 157: a file with an unknown `kind` can't be read, so older versions skip it), `serialise`, `openRequest`, `answer`, `answeredRows`.
- `src/commands/requests.ts`: `askCommand` (its flags and `--file -`), `answerCommand`, the `requests` and `show` printers.
- `src/board/model.ts` `Need` and `needOfRequest`: what the board carries of a request (0082/E reads the new fields from here).
- D96 to D99 (the record), D113 (wakes) and D118 (the approved design, answer 5B) in `docs/decisions.md`; `docs/braids-format.md`, "The request record".
- `braids/0082-the-questions-panel/A-mockups-the-questions-panel/mockups.html`, frames 3 to 5: how context, options and the look/FYI mark are shown.
- `.agents/skills/braid/SKILL.md` ("Talking to the user") and `.agents/skills/braid-pm/SKILL.md`: where coordinators and the PM letter their options today.

## Change

- The request record gets three optional fields, written only when given: `context` (Markdown, at most 4000 characters), `options` (one to four strings, lettered A to D in order) and `fyi` (true: a look request or an FYI, blocks nothing; 0082/E puts it in the collapsed group). They are fields, not a new `kind` or event, so every braid version since 0070 still reads a new record, and older records read unchanged.
- `braid ask --context <text>`, `--context-file <path|->`, `--option <text>` (repeated, in order; more than four refused) and `--fyi`. `braid requests` and `braid show` print the options as `A. …` lines and say when context is stored.
- `braid answer <handle> A` (a single letter of a stored option, any case) records the option's text, as `A. <text>`; any other text records as now.
- `Need` carries `context`, `options` and `fyi` for the board.
- The braid and braid-pm skills (`.agents/skills/`): a request to the user or the PM is opened with `--option` for each lettered answer the chat message gives, and `--context-file -` with the message's context when it is longer than the board line. The chat message stays as it is. Keep the skills' words net about even (D116: "don't overblow skills").
- Tests: the fields round-trip; an old record parses unchanged; a record with the fields still passes today's `parseRecord` checks (it ignores unknown fields); `--option` limits; `braid answer` by letter; `--context-file -`.

## Already decided

- The user's answer 5B (shiny-muffin-fqro, D118): looks and FYIs get a mark of their own on the record.
- The record stays readable by older braid versions: optional fields only, as D113 did with an existing event kind (0072).
- Changes to `.agents/skills/` are made because the user asked for P25 with P17 (likely answers) in it; the user merges them with the final PR.
- Known limit, accepted: an older braid that rewrites a new record (answers or withdraws it) serialises only the fields it knows and drops the three; the answer itself is kept. Say in report.md whether that can happen with the versions in use, and add nothing to prevent it.
- Pushes keep their text (D114); whether a push carries the options is left for later.

## Out of scope

- Showing the fields on the board (0082/E) and answering from the board (0082/D).
- Changing any existing field or event.

## Completion

- [ ] `context`, `options` and `fyi` are optional record fields, round-trip, and old records read unchanged, with tests
- [ ] `braid ask --context/--context-file/--option/--fyi` write them; `braid requests` and `braid show` print them
- [ ] `braid answer <handle> <letter>` records the stored option's text, with a test
- [ ] `Need` carries the three fields
- [ ] The braid and braid-pm skills open requests with `--option` (and `--context-file -` when the context is longer than the board line)
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
