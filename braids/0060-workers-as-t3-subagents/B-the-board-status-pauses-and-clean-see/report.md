# 0060/B report

## What changed

- `src/board/t3.ts`: a recorded child with role `worker` is its item's `worker` while T3 says it runs (else `reviewer`, as before); every recorded child's `link` is T3's own `link` (was null for reviewers). The record keeps the full `thread:` id.
- `src/commands/clean.ts`: output says `worker thread` for a worker record. Removal of the checkout, `t3/` branch and record already worked for any role.
- `docs/board.md`, `docs/braids-format.md`: child threads, links, clean wording.
- Tests: `test/reviews.test.ts` (snapshot, link, provider, limits, pause targets, status, clean of a worker child, checks-pending not stalled), `test/done-merge.test.ts` + fixture `setShown` (accept refuses while a worker child runs).

## Why / decisions

- No new stall rule: an item reads stalled only when `agents.length === 0 && !checking`, and `checking` is PR checks pending/failing, so a finished child with pending checks isn't stalled already; a test pins it.
- Limits, `braid status`, `braid accept` and the pause targets all read `t3.threads`; nothing filters recorded threads to `reviewer` (checked), so they needed no change. `braid accept` and the programme also read it as before.
- Worktree workers are found as before (existing tests pass).

## Validation

`npm run verify` (see PR). Focused: reviews.test.ts 16/16, done-merge.test.ts 11/11.

## Docs

board.md and braids-format.md updated.

For later items: none.

Needs the user: none

## Gate note

Local `npm run verify` on this slow Windows machine: all tests passed except `requests.test.ts` "overlapping writers … stale lock" (a child process hit the lock timeout under load; requests/lock code untouched). Earlier start-clean failures were git fixture failures during an overlapping run and passed on rerun. CI is the judge.
