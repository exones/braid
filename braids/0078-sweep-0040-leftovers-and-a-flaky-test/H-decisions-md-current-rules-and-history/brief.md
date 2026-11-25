---
id: '0078/H'
title: "decisions.md: current rules and history, per-braid ids"
status: To Do
labels: ["kind:task", "tier:M"]
dependencies: []
order: 80
---

## Goal

An agent reads the decisions that hold today without wading through 121 KB of history, and two braids can no longer take the same decision number. docs/decisions.md becomes the current rules; superseded rows, supersession chains and the dated log move to a history file; new decisions take per-braid ids. Idea 2026-11-24-vwv0 (the part moved here by the user's "a", 2026-11-25) and idea 2026-11-20-gj9u (full text in the braid brief).

Expected size: a large move (most of 121 KB) plus about 100 new lines, in 3 to 8 files.

## Start here

- `docs/decisions.md`: the table (D1 onwards), "Superseded by" notes inside cells (D71 → D77 → D91, D66 → D99), the dated log at the end.
- `rg -n "decisions.md#|D[0-9]{2,3}\b" docs src README.md`: every link and mention of a decision id or anchor that must keep resolving (`.agents/skills/` has none today; check again, and if one appears, report it rather than edit the skill).
- `src/braids/presets.ts`: it names decisions.md.
- `scripts/check-markdown-links.mjs`: the link check the gate runs.

## Change

- docs/decisions.md: one entry per rule that holds today, its id kept, its text the current rule with its reason; a superseded rule leaves the current file and points to its successor in the history.
- docs/decisions-history.md (or the name you find clearer): the superseded rows and the dated log, unchanged in substance.
- gj9u: D47, D57 and D68 stop describing auto mode in the present tense (D74 replaced it): a dated note or the current wording with the reason.
- Per-braid ids: the head of docs/decisions.md says how new decisions are numbered (`D<braid>.<n>`, as the braid brief records), and every existing anchor and link still resolves.

## Already decided

- Ids D1 onwards keep their numbers and anchors; nothing is renumbered.
- Start after the docs strands of 0074, 0072, 0060 and P24 have merged into main and main was merged into the braid branch: every one of them adds rows to docs/decisions.md.
- No skill change (braid brief).

## Out of scope

- Changing what any decision says, beyond gj9u's tense fix.

## Completion

- [ ] docs/decisions.md lists only the rules that hold today, each with its id; superseded ones and the dated log are in the history file
- [ ] D47, D57 and D68 no longer describe auto mode as current
- [ ] The id scheme for new decisions is written at the head of docs/decisions.md
- [ ] Every link to a decision anchor resolves (the gate's link check passes; report how many links were checked)
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
