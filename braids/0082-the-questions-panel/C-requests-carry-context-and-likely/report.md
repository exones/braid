# 0082/C: Requests carry context and likely answers

## What changed

Takes in idea 2026-11-23-wcox (P17). The Questions panel (0082/E) can now show a request's context and one button per likely answer, and fold looks and FYIs away.

- The request record has two optional fields, `context` (Markdown, at most 4000 characters) and `options` (one to four strings, lettered A to D). They are written only when given. A malformed one is left out when read, and the request still reads. Old records read unchanged (`src/braids/requests.ts`).
- `look` is the sixth request kind: a look request or an FYI, which blocks nothing. Its act word is `look`, its lane Needs You with the reason `look`, and its board mark is a grey eye (`src/board/marks.ts`, `web/src/App.tsx`). Its push is tagged 👁 at default priority, not high. The push text doesn't change (D114).
- `braid ask` takes `--option <text>` (repeated, in order; more than four, or an empty one, is refused), `--context <text>`, `--context-file <path|->` (not together with `--file -`) and `--kind look`. It prints the options as `A. …` lines and `context stored (<n> characters)`.
- `braid requests` prints the options as `A. …` lines under the request and says when context is stored. `braid requests <name>` prints the options and the whole context. There is no `braid show` command; this is the request's show.
- `braid answer <handle> <answer>` takes the answer after the name, as well as through `--file` (not both). A lone letter of a stored option (`a`, `B.`, any case), from either source, records `A. <text>`. Any other text is recorded as given.
- `Need` carries `context` and `options` next to its `kind` and an `act` that can be `look`, on a coordinator's request, a forwarded one and the PM's own (`src/board/model.ts`).
- Skills: braid's "Talking to the user" says each lettered answer is also an `--option`, plus `--context-file -` when the context is longer than the board line. A lone letter answer records its option. braid-pm's request lines say the same and name `look`. That adds about 35 words.

## Choices

- `look` pushes at default priority. It blocks nothing, so it shouldn't alarm like a question. An escalated or forwarded look is still high, as every escalation is.
- The answer may be given after the name (`braid answer <handle> A`), as the brief writes it. `--file` also maps a lone letter, because coordinators record the user's chat reply with `--file -` and that reply is often just "A".
- A letter with no stored option (C when there are two) is recorded as the text given, not refused.
- `context` keeps its Markdown and line breaks (CRLF becomes LF) and is trimmed. Options are made one line each.
- D119 records the decision in `docs/decisions.md`, with a decision log line.

## Validation

- `test/requests-options.test.ts` (7 tests) covers:
  - the fields round-trip, and survive a merge
  - an old record has no empty fields, and malformed fields are left out
  - the ask flags and their limits
  - `braid requests` and `braid requests <name>` output
  - `braid answer` by letter, in any case, from text and from `--file`
  - a `look` request opens, lists, shows on the board as `look`, pushes 👁 at default and answers
  - `Need` carries context, options and kind
  - `--context-file -` through the CLI with standard input
- `npm run verify` on Windows: see "Gate" below.

## Docs

Updated `docs/braids-format.md` (the request record: the kinds, `context`, `options` and the older-braid limits), `docs/cli.md` (`ask`, `answer`, `requests`), `docs/board.md` (the act words, the 👁 tag, default priority), `docs/decisions.md` (D119), `README.md` (one line) and the CLI help (`src/cli.ts`). `docs/getting-started.md`, `docs/autonomy.md` and the other internal docs aren't affected.

## Anything open

- Known limit (accepted in the brief): an older braid that rewrites a newer record keeps only the fields it knows. That happens when it answers or withdraws the record, or when the board adds a reminder or an answer's wake to it. The two fields are lost, and the answer is kept. With the versions in use this can happen:
  - Agents run the installed `braid` (npm), and the board service runs from the user's checkout.
  - Once a version with this change is installed, a board service still running an older checkout drops `context` and `options` from any record it reminds or marks woken, until it is updated and restarted (`braid board service restart`). An older CLI elsewhere would do the same.
  - Before this version is installed, nothing writes the fields, so nothing is lost.
  - An older braid skips a `look` record as unreadable, as decided.
- The board doesn't show the fields yet (0082/E), and answering from the board is 0082/D.

For later items:
- 0082/D: send the letter, or `A. <text>`, as the answer; `optionAnswer` in `src/braids/requests.ts` maps it.
- 0082/E: read `need.context`, `need.options` and `need.kind === "look"` (also `act: "look"`) for the folded "blocks nothing" group.

Needs the user: none
