## What changed

`origin/main` (910cc2a1: 0060, 0081, 0082) is merged into the braid branch as merge commit 459a183f, with one test commit on top (54d0c51c).

| File | Resolution |
| --- | --- |
| `src/board/t3.ts` | Kept J's finished-thread memory (`toShow`, `remember`) around main's recorded-child loop (role, link, `occupied`), and main's `parentsCheckout`. Imports from both sides. |
| `src/braids/reviews.ts` | `recordReview` has main's `where` and `role` and J's rule: the same thread recorded again moves its time (a `pm/` checker keeps its first). |
| `src/board/wake.ts` | Both sides' imports and the header of main's page-answer wake; `wakePageAnswer` writes the woken mark with `markAnswerWokenAsync`. |
| `src/cli.ts` | Help: main's `clean` line; `board` has main's `--no-pause` text and 0077's busy-board note; `board service` is 0077's. |
| `src/commands/board.ts` | Imports from both sides; 0077's `repoSources` with main's `answer` action. |
| `src/commands/clean.ts` | Main's header comment, 0077's `gitSync` import. |
| `test/cli.test.ts` | The skip list has both `gate` and `launch`. |
| `test/requests.test.ts` | Main's `handleOf`, without `resetT3Memory`. |
| `test/reviews.test.ts` | Both sides' tests; `ttlMs` and `resetT3Memory` removed. |
| `docs/board.md` | The programme tabs have main's Questions panel wording and 0077's running count; the T3 read has main's roles and J's re-check rule. |
| `docs/cli.md` | Main's `start`, `launch`, `clean` and `board` rows; 0077's `--url` and `service` rows; `review` has main's text and J's sentence. |
| `docs/decisions.md` | Both sides' rows and log entries. No number is shared (0077 uses names), so nothing was renumbered. |
| `docs/roadmap.md` | Main's 0072 and 0082 lines with 0077's line between them. |

Beyond the conflicts, in files that merged cleanly or already conflicted:

- `src/commands/requests.ts`, `src/commands/board.ts`: main's `answer` action called the synchronous record readers and writers from the board process. `boardAnswer` is now async (fetch, read and write), and the action calls `src.t3()` as 0077's `Sources` has it.
- `test/board-async.test.ts`: the no-synchronous-process test now also answers a request through the `answer` action.

## Why

The braid branch must hold `main` before the final PR. Main's new board-path code had to follow 0077's rule that the board process starts no synchronous `git`.

0077 had removed `readT3`'s short memory (`ttlMs`, `resetT3Memory`), so main's callers of it were adapted. The `answer` action therefore reads T3 afresh to see whether the asking thread is archived.

## Validation

- Gate (`node dist/cli.js gate`) on 54d0c51c: exit 0. Node tests: 851, 850 passed, 0 failed, 1 skipped; 1061 s.
- Includes `test/board-async.test.ts` and main's new tests (`launch`, `board-answer`, `board-questions`, `request-gaps`, `requests-options`).
- `braid check`: OK.

## Docs

The conflicted docs are resolved as above. No other doc needed a change.

## Open

- The braid branch moved to b53dc83e (adds 0077/L, under `braids/` only) while this ran. It is not merged into this branch.

For later items: none

Needs the user: none
