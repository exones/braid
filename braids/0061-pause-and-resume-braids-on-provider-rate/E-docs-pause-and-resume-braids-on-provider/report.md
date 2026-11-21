## What changed

- `README.md`: a "Pauses before a usage limit" bullet.
- `docs/getting-started.md`: a "Provider usage limits" paragraph (checks before each launch, at each 10-minute wait timeout and every 15 minutes, the PM-run case, thresholds, pause, resume, weekly question, a pause is not a hold) and the `limits:` key in the BRAID.md keys list.
- `docs/autonomy.md`: a "Pausing for a provider limit" section (every preset pauses by itself, the PM's part, the weekly question, not a hold).
- `docs/roadmap.md`: status line for braid 0061.
- `docs/decisions.md`: decision log entry for D87 (D86 and D87 hold the pause design and its reasons: coordinator/PM-driven, unknown never pauses, defaults, weekly windows).

## Why

Braid 0061 added limit checks, `braid pause`/`resume`, the board's paused state and the skills' protocol; strands C and D documented their parts, E brings the rest up to date as a whole.

## Validation

`npm run verify` passed.

## Docs

Each doc from `BRAID.md` `docs`:
- README.md: updated
- docs/getting-started.md: updated
- docs/cli.md: unchanged (done in B and C: commands, `limits:` key, exit code 3, Pauses)
- docs/board.md: unchanged (done in C)
- docs/autonomy.md: updated
- CLI help text (src/cli.ts): unchanged, checked: `limits`, `pause`, `resume` are listed
- docs/development.md: unchanged (no change to build or test)
- docs/decisions.md: updated (D86, D87 from C and D; log entry for D87 added)
- docs/braids-format.md: unchanged (done in B and C)
- docs/roadmap.md: updated
- docs/npm-distribution.md: unchanged (no packaging change)

## Open

None.

For later items: none.
Needs the user: none
