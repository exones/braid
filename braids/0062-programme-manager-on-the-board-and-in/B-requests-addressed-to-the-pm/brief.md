---
id: '0062/B'
title: "Requests addressed to the PM"
status: Outline
labels: ["kind:story", "tier:M"]
dependencies: ['0062/A']
order: 20
---

## Goal

A request says whom it is for: the user or the PM. The board shows a request the PM is handling outside Needs You, marked as being with the PM, and the notifier doesn't push it. A request the PM hasn't answered in time, or whose PM thread has stopped, escalates to Needs You and is pushed. This brief is detailed from 0062/A's report.

## Change

- `src/braids/requests.ts`, `braid ask` and `braid handover` (the addressee); `src/board/model.ts` (lane and mark); `src/notify/` (routing and escalation); tests; `docs/board.md` and `docs/cli.md`.

## Completion

- [ ] To be detailed from 0062/A's report
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
