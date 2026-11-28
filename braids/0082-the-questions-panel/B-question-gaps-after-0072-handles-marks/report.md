# 0082/B: Question gaps after 0072: handles, marks and waits

## What changed

Fixes leftovers 2026-11-26-03t9 and 2026-11-25-1onw, so the Questions panel (0082/E) reads clean data.

- A replaced request's text says `replaced by <handle>`, and `braid decisions` and the recap draft name requests by handle. Old records keep what they say.
- A wait reads `waits for 0077` or `until 21:00` instead of `decide` (`actWord`, `src/board/record.ts`), in `braid ask`, `braid requests` and the Requests tab. The tab shows no kind badge on a wait, and `braid requests <name>` and `--closed` call a timed wait `wait`.
- The Requests tab marks an escalated request as its card does ("Escalated to you: …", with why), and a forwarded one ("Forwarded by the PM: …"). The row carries it as `mark`.
- `braid ask` says `opened, replacing <handle>`.
- An open request on a Done braid or strand stays in the board model (`need`, `pmAsk`, `pm`). The Done lane lists those braids first with the need line, and the collapsed strip shows `? <n>`. A Done strand's request also shows on its live braid's card.
- `braid board --help` now prints the board's help line (before, it was refused). That line and the start line say `--no-pause` also turns off the wakes, reminders and nudges.
- Tests pin `Need.handle` and the accepted forms of an all-digit q-code (`test/request-gaps.test.ts`). Older tests that expected q-codes or `decide` on a wait are updated.

## Choices

- Pushes don't change: a Done braid still pushes only Done, and a Done strand's request pushes nothing new, as before (`src/notify/message.ts`).
- The programmes panel doesn't change: a Done braid or strand's own request isn't added to a programme's list. A forwarded one shows there as before.
- A Done item keeps its lane, with no reason icon, alarm or stall.
- Leftover 2026-11-26-dxqo (an all-digit suffix read as a braid number) isn't fixed here: only the test of the accepted forms.

## Validation

`npm run verify` on Windows: exit 0, 795 tests, 795 passed, none skipped (test run about 13 min). It builds the web page and type-checks both projects. The web changes were not looked at in a running board.

## Docs

`docs/board.md`, `docs/cli.md`, `docs/braids-format.md`. `README.md`, `docs/getting-started.md`, `docs/autonomy.md` and the internal docs besides these are not affected; `docs/decisions.md` already holds the user's answer (D118).

## Anything open

- A request to the PM that escalates on a Done item shows on the board but sends no push.
- Leftover 2026-11-26-dxqo stays open, including its flaky line in `test/request-words.test.ts`.

For later items: 0082/E: read each strand's `need` and `pmAsk` as well as the card's, since a card carries only the top need; a Done item's are filled too.
Needs the user: none
