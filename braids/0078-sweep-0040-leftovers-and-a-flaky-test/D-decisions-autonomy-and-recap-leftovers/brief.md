---
id: '0078/D'
title: "Decisions, autonomy and recap leftovers from 0040"
status: To Do
labels: ["kind:task", "tier:M"]
dependencies: []
order: 40
---

## Goal

The decision-reading commands from 0040 behave as the docs and coordinators expect: the recap puts the recorded decisions first, `braid autonomy` and `braid decisions` take a strand id, `--since` doesn't repeat a whole day, and the preset a PR is judged by can't be loosened by that PR. Leftovers 2026-11-19-diq9 and 2026-11-20-w5cd (1), (3), (4) (full text in the braid brief).

Expected size: about 200 lines in 6 to 9 files.

## Start here

- `src/commands/facts.ts` (recap draft, line 192: the Decisions placeholder) and where `Decided:` entries and answered requests are added.
- `src/commands/decisions.ts`: the listing and `--since <date or sha>`.
- `src/commands/autonomy.ts` and `src/braids/presets.ts`: how the preset and its source are read (live copies of the brief vs `origin/<base>`).
- `docs/braids-format.md` (lines ~279-294, decisions and recap bullets), `docs/autonomy.md`, the `decisions`, `autonomy` and `recap` usage lines in `src/cli.ts`.

## Change

- Recap: the `Decided:` entries and answered requests come first under Decisions; the report's placeholder shows only when there is nothing else, and never above recorded decisions. A test for a strand-only recap (a strand with its own `Decided:` lines, the braid with none).
- `braid help` and the braids-format recap bullet mention `Decided:` entries.
- `braid autonomy <id>` and `braid decisions <id>` accept a strand id (`0012/A`): autonomy prints its braid's preset; decisions lists that strand's entries.
- `braid decisions --since <date>` gains a time form, or the date form keeps only entries after a given moment (`--since <iso time>`), so a digest sent at 14:00 doesn't repeat the morning; keep `<YYYY-MM-DD>` meaning that day and later.
- w5cd (1): `braid autonomy` (and what `braid accept --preset` checks) read the preset the PR is judged by from its base (`origin/<base>`), so a PR into main can't loosen its own preset; if that needs a flag (`--at <ref>`) or a skill change, stop and report: a skill change is out of scope.

## Already decided

- No skill change (braid brief). The digest wording in the autonomy reference stays as it is; a time form of `--since` is additive.

## Out of scope

- w5cd (2) (a skill change). The presets' content.

## Completion

- [ ] Recap Decisions order fixed, with a strand-only recap test
- [ ] `braid help` and docs/braids-format.md mention `Decided:` entries
- [ ] `braid autonomy` and `braid decisions` accept a strand id, tested
- [ ] `--since` with a time keeps only later entries, tested
- [ ] The preset a PR is judged by comes from its base, tested, or report.md says what stopped it
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
