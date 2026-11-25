# 0060/D report

## What changed

Docs brought up to date for workers as T3 subagents and `braid launch`, checked as a whole against 0060/A, B and C:

- README: workers are subagents launched with `braid launch`, and the coordinator waits for CI.
- `docs/cli.md`: `braid review` row (no `role`, read as review; `braid launch --child` records the others) and `braid clean` (forced delete covers any recorded subagent's `t3/` branch).
- `docs/roadmap.md`: braid 0060 entry.
- Help text: `braid clean` line in `src/cli.ts` and the matching comment in `src/commands/clean.ts` (wording only).

## Docs checked

- README.md: updated
- docs/getting-started.md: unchanged (0060/C already covers launch, CI watching, researcher)
- docs/cli.md: updated (launch rows were already there from 0060/A)
- docs/board.md: unchanged (0060/B covers worker children, Open thread)
- docs/autonomy.md: unchanged
- CLI help text: updated (clean line; launch and review lines were already right)
- docs/development.md: unchanged
- docs/decisions.md: unchanged (D107 from 0060/C)
- docs/braids-format.md: updated (`braid clean` forced delete names any recorded subagent; the `braid start` paragraph counts a worker recorded with `braid launch --child` as an agent)
- docs/npm-distribution.md: unchanged (about packaging and install; nothing about workers or launch)
- docs/roadmap.md: updated

## Validation

`npm run verify` passed locally: build, lint, 717 of 717 tests (17 min under load).

## Open

The researcher message still has a fixed 20-minute time box; the skill says to set it in `task`. No change.

For later items: none.

Needs the user: none
