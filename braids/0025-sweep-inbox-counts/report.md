# Report

## What changed

- `listBraids()` prints "No braids." and then the `Inbox:` line, instead of returning early.
- New test in `test/inbox-sweep.test.ts`: a leftover noted offline (local only), then another clone pushes one more leftover to origin that the first clone has not fetched. `braid list` shows `Inbox: 4 leftovers, 1 ideas`: it counts the local-only entry and not the origin-only one, and gives the same with origin unreachable.
- `test/braids.test.ts` expects the inbox line after "No braids.".

## Why

Leftovers 2026-11-18-9e3w and 2026-11-18-k9xb from review 0020/B.

## Validation

`npm run verify` passes. With `openCounts` temporarily calling `readInbox(root, { fetch: true })` the new test fails (5 leftovers instead of 4); reverted. If `openCounts` ignored local-only commits the count would be 3.

## Open

The recap "Sweep due" path has no separate test of its own; it uses the same `openCounts`.

For later items: none
Needs the user: none
