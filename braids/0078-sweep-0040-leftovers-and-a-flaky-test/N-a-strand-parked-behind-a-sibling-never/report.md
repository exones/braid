# 0078/N report

## What changed

- A braid's working coordinator (`working()`) now holds off the `stalled` of its strands, as it already did for a braid without strands (`src/board/model.ts`).
- A strand stored In Progress, with a sibling it depends on that isn't Done, no agent, no pending PR checks and nothing asked, is parked: no stall, no nudge, and a quiet "Waiting on 0078/M" line on the card (`StrandCard.waitingOn`, `web/src/App.tsx`).
- The braid-level stall counts a parked strand as quiet, so it doesn't hold that stall off.

## Why

The board said "Stalled: nobody is working and nothing was asked" for strands that were only parked behind their coordinator's running work or a sibling (everix 0035/A, 0078/L).

## Validation

- Three new tests in `test/board-no-false-stalls.test.ts`: working coordinator (through `readT3`); parked behind a running or idle sibling; the real stalls that stay (no unfinished dependency, the idle sibling itself, and the braid-level stall when the sibling wasn't started).
- `test/branches.test.ts`: the expected strand card has the new `waitingOn: null`.
- `npm run verify` passed: 867 Node tests, 866 pass, 1 skipped, 0 fail. A first run was stopped by my own 10-minute background limit, with no failure up to then.
- The card line was typechecked and built, not looked at in a browser.

## Docs

docs/board.md (both stall rules and the paragraph on which threads are agents) and docs/decisions.md (D46, D53).

## Decisions

- Behind a sibling that is still To Do with the coordinator idle, the strand reads "waiting on", and the braid reads "Stalled: the coordinator stopped and nothing was asked". Silencing the strand alone would have hidden that stall.
- The "waiting on" line shows only for a started (In Progress) strand: on a To Do strand it would be noise.

## Open

- The two Completion boxes meet differently when the sibling is still To Do and the coordinator idle: it isn't Done (box 1: no stall on the strand) and isn't in progress (box 2: a stall shows). The stall shows on the braid, not on the strand.
- The item's details panel and `braid coordinate` don't show the "waiting on" line; the panel lists the dependencies already.

For later items: 0078/G touches `src/board/model.ts` too: `derive` takes the unfinished sibling ids as its last argument and returns `waitingOn`.

Needs the user: none
