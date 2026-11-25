---
id: '0078/I'
title: "Docs: Sweep: 0040 leftovers and a flaky test"
status: To Do
labels: ["kind:task", "tier:S"]
dependencies: ['0078/A', '0078/B', '0078/C', '0078/D', '0078/E', '0078/F', '0078/G', '0078/H']
order: 90
---

## Goal

The project's docs are true as a whole after this braid: read everything 0078 changed from its first strand and bring the docs from BRAID.md `docs` up to date (overview and README, getting started, roadmap status, the decisions record, help text).

Expected size: about 50 to 150 lines in up to 8 docs.

## Start here

- The braid's log and each strand's `report.md` (`braid view 0078` and its strands), then the diff of the braid branch against main.
- BRAID.md `docs`: the public and internal docs to check.

## Change

- Each doc that a strand made untrue, or that misses what changed (development.md for the gate, cli.md for wait/pause/notify/decisions/autonomy, braids-format.md for recaps, board.md for pushes, roadmap.md status, decisions.md for any decision this braid took, with a per-braid id).

## Already decided

- No change to `.agents/skills/`, AGENTS.md, CLAUDE.md or BRAID.md (braid brief); gaps there go to report.md for a leftover.

## Out of scope

- Product code.

## Completion

- [ ] Docs from BRAID.md `docs` are up to date with everything 0078 changed
- [ ] report.md lists each doc from BRAID.md `docs` as updated or unchanged
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
