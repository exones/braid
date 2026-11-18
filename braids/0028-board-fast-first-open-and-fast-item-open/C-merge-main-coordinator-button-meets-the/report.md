## What changed

- Merged `origin/main` (braid 0030, the Coordinator button) into the 0028 strand branch.
- `openAction` (`src/commands/board.ts`) keeps both: 0030's `thread: "coordinator"` option with its refusals (a strand, another `thread` value, no coordinator thread), and 0028/A's snapshot lookup. The link comes from the snapshot; T3 is read fresh only when the snapshot has none.
- `docs/decisions.md`: 0030 keeps D63; 0028's snapshot decision is now D64 in the table, plus a decision-log line. The 0028/A and 0028/B reports now cite D64.
- `docs/board.md`: the snapshot paragraph names the Coordinator option too.

## Why

The final PR of 0028 into `main` could not open while the two branches conflicted.

## Validation

- New test in `test/board-snapshot.test.ts`: `{ id, thread: "coordinator" }` opens the coordinator link from a snapshot while `gh` and `t3` fail if called; a strand and `thread: "worker"` are refused.
- `rg "D63"` and `rg "D64"` each name only their own decision. `npm run verify` passes.

## Open

Nothing.

For later items: none.
Needs the user: none.
