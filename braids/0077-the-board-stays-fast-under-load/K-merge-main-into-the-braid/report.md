## What changed

`origin/main` (910cc2a1: 0060, 0081, 0082) is merged into the braid branch as merge commit 459a183f, with a test commit (54d0c51c) and a review fix (ed1f3cef) on top.

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

- `src/commands/requests.ts`, `src/commands/board.ts`: main's `answer` action called the synchronous record readers and writers from the board process. `boardAnswer` is now async (fetch, read and write). The action no longer reads T3 whole: it takes the asking thread's state from the board's last good T3 read (`repoSources`), else from one `thread show` of that thread (review finding at 27eb779).
- `test/board-async.test.ts`: the no-synchronous-process test now also answers a request through the `answer` action.
- `test/board-answer.test.ts`: an answer runs no `thread list` and at most one `thread show`.
- `docs/board.md`: how the action tells that the asking thread is archived.

## Why

The braid branch must hold `main` before the final PR. Main's new board-path code had to follow 0077's rule that the board process starts no synchronous `git`.

0077 had removed `readT3`'s short memory (`ttlMs`, `resetT3Memory`), so main's callers of it were adapted. A whole T3 read on a request path can take a minute (J's case), so the `answer` action never does one.

## Validation

- Gate (`node dist/cli.js gate`) on ed1f3cef: exit 0. Node tests: 852, 851 passed, 0 failed, 1 skipped; 1429 s.
- Includes `test/board-async.test.ts` and main's new tests (`launch`, `board-answer`, `board-questions`, `request-gaps`, `requests-options`).
- `braid check`: OK.

## Docs

The conflicted docs are resolved as above; `docs/board.md` also says how the `answer` action reads the asker's state.

## Open

- The braid branch moved to b53dc83e (adds 0077/L, under `braids/` only) while this ran. It is not merged into this branch.

For later items: none

Needs the user: none
