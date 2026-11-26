# 0077/C report: braid board --url and service status find a busy board

## What changed

- One probe (`probeBoard`, src/board/address.ts) serves `--url` and `service status`. It gives a board 10 s and answers `answers` (with the version the board started from), `busy` (the port takes the request but doesn't answer in time) or `none` (refused, another run's token, any other answer or error).
- `braid board --url` prints a busy board's address, says `the board on port <n> answers slowly (no answer within 10 s)` on standard error and exits 0.
- `braid board service status` marks a busy board's address and shows `Version: the running board is busy`, exit 0. `install` and `restart` report a board that comes up busy as busy.
- The second request `service` made for the version (`versionAt`) is gone: the probe returns it.

## Why

Both commands gave a board 2 s, so on a busy machine a running board read as not running, or its version as unknown (idea 2026-11-24-z45n).

One request with the whole budget instead of several short ones: retries would give up on a board that needs longer than one attempt.

## Merge of origin/main (0074)

Merged f3879dda as its own merge commit, d26e2bfa. Conflicts:

- `src/braids/state.ts`: kept 0077's `mainCheckout` from `repo.ts` (no `spawnSync` here) and 0074's lock token and `lockIdentity`. 0074's rule, a waiter gives up only when the lock stops changing hands, had reached only `locked`; `lockedAsync` (0077, the board's record writes) now follows it too, with a new test in `test/requests.test.ts`.
- `test/board-limits.test.ts`: 0077 removed `resetT3Memory`, 0074 removed `steeringTitle`; both are dropped from the imports.
- `test/requests.test.ts`: 0074's `locked` import is kept, `resetT3Memory` dropped.

## Validation

- Gate on the merged tree, before the added `lockedAsync` test: passed, 753 tests, 752 pass, 1 skipped.
- New tests: a local server on a random port that answers after 3 s is found by `--url`; a silent one reads as busy with its address; a closed port reads as none; fake probes give `status` and `restart` a busy board. No real port 7800, `~/.braid` or T3 thread was used.
- Final gate: `node dist/cli.js gate` passed at 97fbb8e0: 756 tests, 755 pass, 1 skipped, tests 1051 s.

## Docs

docs/board.md (the address file, `service status`), docs/cli.md (`board --url`) and the help text in src/cli.ts. No decision of the user's to record.

## Open

Nothing.

For later items: none

Needs the user: none
