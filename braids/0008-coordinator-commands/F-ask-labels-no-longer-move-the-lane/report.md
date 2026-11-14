# Report

## What changed
- `derive` (`src/board/model.ts`): an `ask:<key>` label no longer sets the lane. The key is returned as a new `ask` field on strand cards, braid cards and item detail (null once the PR is merged); the other rules decide the lane.
- `src/board/marks.ts`: the amber flag comes from `ask`, so it shows wherever the label is, next to any other reason; hover is "Will need your decision: <key>".
- `braid status` prints `ask:<key>` after the lane, with no Needs You lane.
- `docs/board.md` (rules renumbered, Needs You means a real block, flag text) and `docs/decisions.md` (log entry).

## Why
0008 sat in Needs You because 0008/C carries `ask:process` before any work had started.

## Validation
`npm run verify` passes. Tests: label keeps key but not lane; label plus open PR sits in To Review; marks flag and hover; demo still shows the flag on 0003/B. Demo lanes are unchanged (0003 stays Needs You through its question), so no screenshots changed.

## Open
Auto mode's use of `ask:` labels is untouched.

For later items: `ask` field added to `Derived`, `StrandCard`, `BraidCard`, `ItemDetail`; the demo's "ask" no longer counts as a Waiting reason. How the board learns the coordinator waits is braid 0015.
Needs the user: none
