## What changed

- A braid that would read To Do is Working while a coordinator thread of it runs or a planning PR (`plan/<slug>` into its braid branch) is open, with and without strands. While that PR's checks are pending the card shows the checks activity.
- `github.ts` keeps open planning PRs in a separate `planning` map by braid number; they are never in `prs`, so a merged one cannot make the braid Done.
- `startOf` now checks the running coordinator before the lane, so Start's reason stays "a coordinator for this braid is running".
- `braid status` builds its cards with `toCard`, so it shows the same lane with no change in `coordinate.ts`.
- `docs/board.md` rule 7 and decision D53 (amends D46).

## Why

On 2026-11-18 the 0020 card sat in To Do while its coordinator merged the planning PR.

## Validation

New tests in `test/lanes.test.ts` (lift, no lift when idle or PR merged, requests win, no strand/agent change), `test/github.test.ts` (planning PR open and merged) and `test/board-start.test.ts` (Start reason). `npm run verify` passed (the demo-data lane list in `test/marks.test.ts` now has 0011 and 0013, whose coordinators run, in Working).

## Open

Nothing. The coordinator-no-alarm change is covered by the existing alarm code, which this change does not touch.

For later items: none.
Needs the user: none
