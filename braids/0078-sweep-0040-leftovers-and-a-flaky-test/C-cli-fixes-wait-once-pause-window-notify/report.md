## What changed

- `braid wait <number> --once` reads the checks once and answers without sleeping: 0 green, 1 a failure seen, else 3 (also when no run has appeared yet or GitHub could not be read). It does not go with `--timeout`.
- `braid wait` (with and without `--once`, `ci` names or `ci: all`) now exits 1 as soon as one check has failed, naming also what still runs or has not started. The exit codes keep their meanings.
- `braid pause --window` without `--until` keeps its refusal; docs/cli.md, both usage lines and the code comment now say so.
- `braid notify send` without `--programme` uses the sequence id `braid-<repo>-pm-send`; with `--programme` it is unchanged. Its usage line names exit 0 for a failed send.

## Why

The four leftovers 2026-11-22-t7ap, 2026-11-23-5vky, 2026-11-23-mchu and the help half of 2026-11-23-uanu.

`--window` alone: keeping the refusal over pausing whatever the verdict. A window below its threshold may show a reset that is already past or none at all, so the pause could be born overdue or take no time from that window; `--until` already is the explicit "pause anyway". One rule is the unsurprising one.

The old push under `braid-<repo>-pm---send` is not replaced by the next one: a phone may show both once. Nothing else reads or clears that id (the board's notifier clears only ids it recorded itself), so a one-time extra notification is all.

## Validation

- `npm run verify` passed (711 node tests, 0 failed; about 18 minutes on this machine).
- Tests added or changed: test/wait.test.ts (`--once` never sleeps and its exits; early exit 1; refusal with `--timeout`), test/pauses.test.ts (`--window` alone refused), test/notify.test.ts (the new sequence id). No test reads the usage line text.

## Docs

docs/cli.md and docs/braids-format.md updated. docs/decisions.md is unchanged: D71, D77, D91 and D103 stay true (green still waits for every check; the exit codes are the same). README.md and the other docs are not affected.

## Open

None.

For later items: a run CANCELLED under a newer commit stays pending for 5 minutes counted from the start of the call, so a short call (`--timeout 0.25` or `--once`) never turns it into a failure while that newer commit has no run: it answers 3 every time (as before this change).

Needs the user: none
