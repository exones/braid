# Report 0038

## What changed

- `docs/cli.md` lists `braid title`, as `braid help` does.
- `catBatchSync` takes an optional command override (tests only; behaviour unchanged). New tests: a missing object gives null, a failing git (not a repository) gives nulls, a hung process is killed at the timeout and gives nulls.
- `runsOf` and `checksOf` (`src/board/github.ts`) now treat only SUCCESS, NEUTRAL and SKIPPED as passing; CANCELLED, ACTION_REQUIRED, STALE and any other finished result are failing, for `braid accept`, `braid handover` and the board. Tests per conclusion in `test/github.test.ts` and `test/requests.test.ts` (handover).
- `braid ask` and `braid answer` find a braid through `loadKnownBraids`, as `braid view` does, so one that lives only on its branch works from the main checkout (test).
- The panel's history rules are pure helpers in `src/board/route.ts` (`openMode`, `closeMode`, `pushedAfter`), used by `web/src/App.tsx`, with tests including a link opened on a fresh load.
- README shows `docs/images/item-panel.png` (the details panel) with a matching caption; the old `item-page.png` is removed and `docs/design/readme/README.md` updated.
- All `rmSync` teardowns of test temp folders retry (`maxRetries: 20, retryDelay: 250`); the hung cat-file test uses a 3000 ms timeout so the child's start-up no longer races it.

## Why

Clears the eight leftovers; the CI-check fix stops a cancelled run counting as green.

## Validation

`npm run verify` passes (315 tests). The new tests were run alone and in the full suite.

## Open

`braid wait` (named in the brief) has no `src/commands/wait.ts` in this checkout; I applied the conclusions the brief names (success, neutral, skipped). I merged `origin/main` into the branch because 0034's panel code was not on it.

For later items: none.
Needs the user: none
