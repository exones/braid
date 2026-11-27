# 0082/F: Docs: The Questions panel

## What changed

The docs from BRAID.md `docs`, read against everything 0082/A to E changed. The strands had updated most of them; this fixes what they left stale or missing. No product code.

- **Push priority** (0082/C's known gap): `docs/board.md` and the `braid ask` cell in `docs/cli.md` no longer say a PM request always pushes high; a `look` is default priority, and an escalated or forwarded one is high. The same in `docs/getting-started.md` and `docs/braids-format.md`.
- **The page writes the record now:** `docs/board.md` and `docs/braids-format.md` said only braid commands (and the board's wake) write requests; the board's `answer` action does too.
- **`docs/board.md`:** `action` and `look` in the Needs You rule; the grey eye in the icon table; the details panel no longer says answering happens only in the coordinator's thread; `look` in the panel row's act words, and that an escalated look stays folded; two screenshots of the panel (0082/E's screens, copied to `docs/design/board-screenshots/120` and `121`); a stray bold mark at "The PM's own request".
- **`docs/cli.md`:** `braid answer` points to answering on the board; an answer given on the page still wakes under `--no-pause`.
- **Answer among the board's actions:** `README.md`, `docs/getting-started.md`, `docs/roadmap.md`.
- **`docs/roadmap.md`:** the Questions panel (0082) as built; 0072's "Not built: answering from the board" is gone.
- **`docs/decisions.md`:** D118 states the ranking the user decided; the date line. D118 to D120 are free on `origin/main` (its last is D117), so no renumbering.

## Docs checked

| Doc | Result |
| --- | --- |
| `README.md` | updated |
| `docs/getting-started.md` | updated |
| `docs/cli.md` | updated |
| `docs/board.md` | updated |
| `docs/braids-format.md` | updated |
| `docs/roadmap.md` | updated |
| `docs/decisions.md` | updated |
| `docs/autonomy.md` | unchanged: nothing in it that 0082 makes untrue |
| `docs/development.md` | unchanged |
| `docs/npm-distribution.md` | unchanged |
| CLI help (`src/cli.ts`) and the usage lines of `ask`, `answer`, `requests` | unchanged: they list `--context`, `--context-file`, `--option`, `look` and the answer by letter |

## Choices

- The screenshots are copies of 0082/E's, taken from the demo, so no board was started for this strand.
- The README's top screenshot and `31-board.png` predate the panel; they weren't retaken.

## Validation

- `braid check`: OK.
- `npm run verify`: exit 0 on Windows after `npm ci`, 816 tests, none failed or skipped (test run about 19 min).

## Anything open

- None.

For later items: none
Needs the user: none
