# Report

## What changed

- `listBraids()` prints "No braids." and then the `Inbox:` line, instead of returning early.
- New test in `test/inbox-sweep.test.ts`: origin unreachable, a leftover noted offline (local only), `braid list` shows `Inbox: 4 leftovers, 1 ideas` and nothing on stderr.
- `test/braids.test.ts` expects the inbox line after "No braids.".

## Why

Leftovers 2026-11-18-9e3w and 2026-11-18-k9xb from review 0020/B.

## Validation

`npm run verify` passes (300 tests). The new test counts the offline entry, so it fails if `openCounts` ignores local-only commits. A fetch against the dead origin would not break the count by itself; the check that nothing is fetched is the empty stderr.

## Open

The recap "Sweep due" path has no separate test of its own; it uses the same `openCounts`.

For later items: none
Needs the user: none
