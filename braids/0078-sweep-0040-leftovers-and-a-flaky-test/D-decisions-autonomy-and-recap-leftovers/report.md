# 0078/D report

## What changed

- `braid recap` and `braid handover` put the recorded decisions (`Decided:` lines and answered requests) first under `Decisions:`; the report's line follows them unless it says none, and the placeholder shows only with neither.
- `braid autonomy` and `braid decisions` accept a strand id: autonomy prints its braid's preset (read from the strand PR's base), decisions lists that strand's entries and requests.
- `braid decisions --since <ISO time with zone>` keeps only entries after that minute; the date and commit forms are unchanged.
- `braid autonomy` and `braid accept --preset` read the preset as `origin/<the PR's base>` has it: preset files, the `BRAID.md` default and, where the base has the braid, its brief. `braid autonomy` adds `Base:` and, when this checkout differs, `Differs here:`. `accept --preset` fetches the base and needs both the base's and the checkout's preset to allow the merge.

## Why

Leftovers 2026-11-19-diq9 and 2026-11-20-w5cd (1), (3), (4): decisions were shown below a placeholder, a strand id was refused, a digest repeated the whole day, and a PR into `main` could loosen the preset it was judged by.

## Not solved: part of w5cd (1)

A goal's braid brief and a story's are not on `main` before their own PR into it, so for that PR the brief's `autonomy:` and `## Autonomy` still come from the brief the PR brings. Reading them "from the base" is impossible (the base has none), and falling back to the project default would stop every braid-level preset (this braid's `free`) from applying to its final PR. Closing it needs a record of the approved preset made outside the PR (for example on `braid-requests` at plan approval): new behaviour and likely a skill change, so out of scope here. The output says so on its `Base:` line, and docs/autonomy.md, "The base decides", names the gap. Protected now: `autonomy/*.md` and the `BRAID.md` default, for every PR; the brief too for a strand PR into its braid branch and wherever the base already has the braid.

## Validation

- New tests: strand-only recap (test/facts.test.ts), strand id and `--since` time (test/decisions.test.ts), base reading and strand id (test/autonomy.test.ts), `accept --preset` against a checkout loosened off `main` (test/done-merge.test.ts). Two old assertions that expected a strand id to be refused now expect a missing strand to be refused.
- Gate: `npm run verify` passed at 4378ebf1 plus the docs/cli.md rows (716 tests, 0 failed, tests took about 11 minutes); the docs gate was run again after that last docs edit and passed.

## Docs

Updated: docs/cli.md, docs/braids-format.md, docs/autonomy.md, the `autonomy` and `decisions` help lines. `braid help` and the braids-format recap bullet already mentioned `Decided:` entries on this base (checked; the recap bullet now gives the order). README.md, docs/getting-started.md and docs/board.md: unaffected. docs/decisions.md: no user decision; D73 stays true (see For later items).

Decisions: base reading and the `--since` time form, both in the log as `Decided:`.

For later items: 0078/H: record in docs/decisions.md that a preset is read as the PR's base has it, and D73's `braid decisions <number>` now takes any id. Leftover: record the approved preset outside the PR so a story's or final PR's brief can't loosen it. Leftover (skill): braid-reviewer step 2 and references/autonomy.md still say `braid autonomy <number>`; a strand's reviewer could pass the strand id to read the braid branch's preset.

Needs the user: `none`
