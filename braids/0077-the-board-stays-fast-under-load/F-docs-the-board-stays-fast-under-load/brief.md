---
id: '0077/F'
title: "Docs: The board stays fast under load"
status: To Do
labels: ["kind:task", "tier:L", "ask:process"]
dependencies: ['0077/A', '0077/B', '0077/C', '0077/D', '0077/E']
order: 60
---

## Goal

The docs say what braid 0077 changed, as a whole, and the worker skill runs the gate through `braid gate`.

Expected size: about 80 lines in 6 files.

## Start here

- The braid's log and every strand's report.md, from 0077/A.
- BRAID.md `docs` (public and internal lists).
- `.agents/skills/braid-worker/SKILL.md`: where it runs the gate.

## Change

- Read everything the braid changed, from its first strand, and bring the docs from `docs` up to date as a whole: README, docs/getting-started.md, docs/cli.md (`braid gate`, `--url` busy), docs/board.md (refresh without blocking, the probe, the programme card's count), docs/roadmap.md status, docs/decisions.md (no synchronous git or gh in the board process; one gate per machine; and why), help text.
- In the braid-worker skill (and any other skill that runs the gate), one line: run the gate with `braid gate`. Nothing else in the skills.
- report.md lists each doc checked as updated or unchanged.

## Already decided

- The skill line needs the user's own ask (AGENTS.md); the PM asks the user (q-f2ad). F starts only after the PM relays the answer; if the user says no, F drops the skill line and its box, and `braid gate` is only documented. The user merges F with the final PR into `main`.

## Out of scope

- Other skill changes.

## Completion

- [ ] Docs from BRAID.md `docs` that this braid made untrue are updated, each listed in report.md as updated or unchanged
- [ ] The braid-worker skill runs the gate with `braid gate`
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
