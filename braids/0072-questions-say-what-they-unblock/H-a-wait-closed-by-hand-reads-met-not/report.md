A wait (a request to another braid's coordinator, or a timed wait) closed by hand no longer reads "answered by the user".

What changed:

- `braid answer` on a wait: `met`, by the coordinator, with the condition's text, when its "done when" holds now; otherwise refused with nothing written, naming `braid withdraw <handle> --why`. A PR closed unmerged doesn't count as met. `--from user` and `--from pm` are refused. An answer text given with a met wait isn't recorded, and the output says so.
- The Requests tab's Decided group and `braid decisions` (so also the recap draft) leave waits out. Answered waits, including records already written, are listed under Closed as "answered", not "decided by you". No record is rewritten and the stored format is unchanged.
- `braid requests` and `braid answer` now check conditions with one shared function (`conditions` in `src/commands/requests.ts`).

Why: a coordinator closing a satisfied wait was recorded as the user's decision (reported from dctl-studio).

Validation: new tests in `test/requests-wait-answer.test.ts`. `npm run verify` locally: 745 tests, 743 pass; the 2 failures are the known multi-process lock tests in `test/requests.test.ts` ("overlapping writers in separate processes lose no update", with and without a stale lock; leftover 2026-11-25-2hkx, code this strand doesn't touch). The gate box is ticked on CI's green verify jobs, as the coordinator allowed. The web label change is covered by typecheck and build only.

Docs updated: `docs/cli.md`, `docs/braids-format.md`, `docs/board.md`, `docs/decisions.md` (D112), and the CLI help text.

Open:

- The board wakes only open waits, so a met wait closed by hand wakes nobody. If the waited-on braid's coordinator closes it, the asking coordinator gets no wake from the board.

Decisions: a wait on another braid with no condition (`--to <number>` alone, "done when answered") is recorded `answered` by the coordinator instead of refused, since its answer is the only way it ends. Answered waits move to Closed rather than being hidden.
For later items: 0072/E or the skills could tell a coordinator not to close another braid's wait by hand (the board closes and wakes it). Gap: `braid answer` on a met wait closes it without waking the asker (`answerCommand` in `src/commands/requests.ts`; the wake in `src/board/wake.ts` looks only at open requests), so when the addressee runs it the asker can stay idle until nudged; a later item could make hand-closing leave the wait to the board, or have the board wake for it. D112 may clash with another braid's numbering at the merge into `main`.
Needs the user: none
