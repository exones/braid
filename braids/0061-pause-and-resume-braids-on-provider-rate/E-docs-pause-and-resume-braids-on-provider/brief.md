---
id: '0061/E'
title: "Docs: Pause and resume braids on provider rate limits"
status: Done
labels: ["kind:task", "tier:S"]
dependencies: ['0061/A', '0061/B', '0061/C', '0061/D']
order: 50
---

## Goal

Bring the project's docs up to date as a whole with what braid 0061 changed: rate-limit checks before launches, `braid limits`, `braid pause` and `braid resume`, the paused state on the board, and the pause and resume protocol in the skills.

Expected size: about 150 lines across 6 to 9 docs.

## Start here

- `braid view 0061` and its log, then each strand's `report.md` (A to D), from the first strand: everything the braid changed.
- `BRAID.md` `docs`: the public and internal docs to check.

## Change

- Read everything the braid changed and update the docs from `docs` as a whole: README overview, `docs/getting-started.md`, `docs/cli.md`, `docs/board.md`, `docs/autonomy.md` (pausing under a preset and under a PM), `docs/roadmap.md` status, `docs/decisions.md` (one entry for the pause design and its reasons: coordinator/PM-driven, unknown never pauses, defaults, weekly windows), `docs/braids-format.md` and the CLI help text.
- Document the optional `limits:` key of `BRAID.md` where `BRAID.md`'s keys are described.

## Out of scope

- Editing skills, `AGENTS.md`, `CLAUDE.md` or `BRAID.md`.

## Completion

- [x] Docs from BRAID.md `docs` are up to date with braid 0061 as a whole
- [x] `docs/decisions.md` has the pause design's entry with its reasons
- [x] `report.md` lists each doc checked, as updated or unchanged
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open

## plan

Check each doc from BRAID.md docs against strands A to D; add what is missing (README, getting started, autonomy, roadmap, decisions log); no duplication of C/D edits.
