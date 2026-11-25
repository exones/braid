---
id: '0077/F'
title: "Docs: The board stays fast under load"
status: To Do
labels: ["kind:task", "tier:S"]
dependencies: ['0077/A', '0077/B', '0077/C', '0077/D', '0077/E']
order: 60
---

## Goal

The docs say what braid 0077 changed, as a whole, including `braid gate`. No skill changes (the user, via the PM: "not yet, put in ideas").

Expected size: about 80 lines in 6 files.

## Start here

- The braid's log and every strand's report.md, from 0077/A.
- BRAID.md `docs` (public and internal lists).

## Change

- Read everything the braid changed, from its first strand, and bring the docs from `docs` up to date as a whole: README, docs/getting-started.md, docs/cli.md (`braid gate`, `--url` busy), docs/board.md (refresh without blocking, the probe, the programme card's count), docs/roadmap.md status, docs/decisions.md (no synchronous git or gh in the board process; one gate per machine; and why), help text.
- report.md lists each doc checked as updated or unchanged.

## Already decided

- No skill changes: the user said "not yet, put in ideas" to the braid-worker line (q-f2ad, relayed by the PM 2026-11-25); `braid gate` is only documented. The PM noted it as an idea.

## Out of scope

- Any skill change.

## Completion

- [ ] Docs from BRAID.md `docs` that this braid made untrue are updated, each listed in report.md as updated or unchanged
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
