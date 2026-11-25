---
id: '0080/H'
title: "Docs: The board talks to T3 directly"
status: To Do
labels: ["kind:task", "tier:S"]
dependencies: ['0080/A', '0080/B', '0080/C', '0080/D', '0080/E', '0080/F', '0080/G']
order: 80
---

## Goal

Bring the project's docs up to date as a whole with everything braid 0080 changed, from its first strand: the sign-in, stopping threads, events, failure reasons and the auto-settle line.

Expected size: about 100 lines in 5 to 8 files.

## Start here

- `braid view 0080` and each strand's `report.md` and log, then the braid's diff against `main`.
- The docs listed in BRAID.md `docs` (public and internal), especially `docs/board.md` ("Provider limits", the T3 reads), `docs/cli.md`, `README.md`, `docs/decisions.md`, `docs/roadmap.md`.

## Change

- Update the docs from BRAID.md `docs` so they are true as a whole: how to sign the board in to T3 and out, what the board does signed in and signed out, the expiry warning, how a hold or pause stops threads and children, events and the backstop, failure reasons on cards, why T3's own usage-limit auto-resume stays off; the decisions record gets this braid's decisions and their reasons; the roadmap's status.
- `report.md` lists each doc checked as updated or unchanged.

## Out of scope

- Skills (0080/G made the only skill change).

## Completion

- [ ] Docs from BRAID.md `docs` are true as a whole for everything 0080 changed
- [ ] report.md lists each doc checked as updated or unchanged
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
