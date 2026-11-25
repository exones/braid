# 0072/A report

## What changed

- `unblocksOf(request, braids, requests)` and `actOf(kind)` (`src/braids/requests.ts`): pure, derived at each read, nothing stored. A request unblocks its item and every item that depends on it (directly or not) that isn't Done; a request on a braid with strands, those strands not Done (a story: the braid); and every other braid with an open wait on its braid (`--to <number>` or `--done-when braid:<number>`). Act word: `action` reads `do`, `review` `merge`, the rest `decide`.
- `braid requests` (list and `<code>`) shows `blocks 0072/B, 0072/C · decide` before the addressee; `braid ask` prints the same line under its first. With nothing waiting it is the act word alone. Timed waits (nobody asked) show none.
- `--kind action` is open to a coordinator too; the PM's wording stays "The PM asks you to:".
- `braid answer`, `braid withdraw`, `braid eta` and `braid requests <code>` lower-case a `/^q-/i` code first; a malformed one is refused as "not a request code", never as "not a braid or strand id".

## Why

So the user can tell "this blocks three strands" from a naming choice (inbox 2026-11-19-aeli), and `Q-L9EN` works (2026-11-23-nq6c).

## Validation

New `test/requests-unblocks.test.ts` (dependents, a Done dependent left out, braid-level, a wait from another braid, act words, the output lines, `--kind action`, letter case, malformed codes). Existing line expectations in `requests`, `pm-requests`, `requests-answer` and `pm-asks` tests updated. `npm run verify` is green.

## Docs updated

`docs/braids-format.md`, `docs/cli.md`, `docs/decisions.md` (D107), the `ask` help text in `src/cli.ts`. README and the board docs are not affected.

## Open

- Done reads from the lifecycle and the PRs in both `braid ask` and `braid requests` (`prsOf`); when GitHub can't be read the lifecycle alone is used and the ask never fails.

For later items:
- 0072/B and 0072/C can call `unblocksOf` with `loadKnownBraids` + `withStatuses` (see `statused` in `src/commands/requests.ts`).

Needs the user: none
