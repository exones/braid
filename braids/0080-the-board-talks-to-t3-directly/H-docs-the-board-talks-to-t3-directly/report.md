# 0080/H report: Docs, the board talks to T3 directly

## What changed

D, E and F had documented their own parts. This fills what was missing for the braid as a whole:

- `docs/board.md`: "First sign-in and checking it" (the list to follow after the merge) and "T3's own settings" (auto-settle is a manual per-thread T3 setting; leave T3's usage-limit auto-resume off, and why). Also: which board acts on a hold, that resuming a hold restarts nothing, and the board's own T3 pushes under Notifications.
- `docs/decisions.md`: D-t3-stop for 0080/E, which had no entry; the log entry for the auto-settle drop (q-htgo); D108's "not built" now points at what was built.
- `docs/roadmap.md`: braid 0080.
- `docs/getting-started.md`, `README.md`, `docs/cli.md`: what the sign-in is for, that a hold stops running threads on a signed-in board, and that installing the CLI fetches `@napi-rs/keyring`.
- `src/cli.ts`: the `pause --hold` help line says the same.

## Why

A hold used to be a record only; on a signed-in board it now stops work, and the user needs to know that before the first one.

## Docs checked

| Doc | Result |
| --- | --- |
| `README.md` | updated |
| `docs/getting-started.md` | updated |
| `docs/cli.md` | updated |
| `docs/board.md` | updated |
| `docs/autonomy.md` | unchanged: presets and merging don't change |
| CLI help (`src/cli.ts`, usage lines) | updated (`pause --hold`); the `t3` lines were true |
| `docs/development.md` | unchanged: setup is still `npm ci`, and the gate is the same |
| `docs/decisions.md` | updated |
| `docs/braids-format.md` | unchanged: E documented the record's new fields |
| `docs/roadmap.md` | updated |
| `docs/npm-distribution.md` | unchanged: the release path doesn't change |

## Validation

- `npm run verify` passed locally (after `npm ci`): 922 tests, 921 pass, 0 fail, 1 skipped, about 13 min of tests.
- The user steps are written from the source (`src/commands/t3.ts`, `src/t3/signin.ts`, `src/board/stop.ts`, `steerer.ts`) and the strand reports. None was run against a real T3: the live check is still the user's, and the Task Scheduler step in particular is unproven until then.

## Open

- The live check of D, E and F with the user's sign-in (the "First sign-in" list covers it, apart from F's timing line).

For later items: the `braid-pm` skill's "Hold" says `braid pause --hold` makes the board show the hold; it doesn't say that a signed-in board also stops the braid's running threads. A skill change for the user to ask for.

Needs the user: none
