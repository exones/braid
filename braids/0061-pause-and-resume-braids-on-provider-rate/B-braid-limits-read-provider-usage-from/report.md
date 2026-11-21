## What changed

- `src/braids/limits.ts`: reads `BRAID.md` `limits:` (session 97, weekly 95, buffer 5, stale 10; invalid value is an error naming the key) and the `models` lines, reads `$T3CODE_HOME/caches/<instance>.json` (default `~/.t3/caches`), applies the reading rules and gives a verdict per provider. Model-scoped windows are one table, `SCOPED_WINDOWS` (`seven_day_fable` -> `fable`).
- `src/commands/limits.ts`, `src/cli.ts`: `braid limits [<instanceId>] [--role r [--tier T] [--kind k]] [--json]`. Exit 0 for ok and unknown, 3 for pause (errors stay 1). Human output in local time; `--json` has ISO UTC, `resumeAt`, windows and `limits`.
- `test/limits.test.ts` (11 tests) with nine fixtures in `test/fixtures/limits/` (shaped from the real caches, personal data removed, fixed "now").
- `docs/cli.md`: the command, the `limits:` key, exit code 3, an example.

## Why

Coordinators and PMs need one read-only command to decide whether to launch an agent on a provider (0061).

## Validation

`npm run verify` passes (455 tests). Run on this machine's real caches: Claude_Everix ok (22% / 29%), cursor unknown (unsupported).

## Docs

`docs/cli.md` updated. `docs/decisions.md` and the skills are 0061/E and 0061/D.

## Open

None.

For later items:
- `braid limits` for a `models` line without a model slug ignores model-scoped windows; fine today.
- Add a `limits:` key to this repo's `BRAID.md` only if the user wants other numbers (user's edit).

Fixes after review: session default 97; `--role worker --kind story` in the docs and a clearer error when a role map needs `--kind`; a `braid limits` bullet in `docs/braids-format.md`; `Said` carries the exit code.

Needs the user: none
