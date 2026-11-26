---
id: '0072/F'
title: "Docs: Questions say what they unblock"
status: To Do
labels: ["kind:task", "tier:S"]
dependencies: ['0072/A', '0072/B', '0072/C', '0072/D', '0072/E', '0072/G', '0072/H']
order: 60
---

## Goal

Bring the project's docs up to date as a whole for braid 0072 (Questions say what they unblock).

Expected size: about 100 lines in 6 files.

## Start here

- Everything the braid changed, from its first strand: the braid branch's diff against `main` and the braid's log.
- `docs` in `BRAID.md`: the public and internal docs.

## Change

- Read everything 0072 changed and bring the docs from `docs` up to date as a whole: the README and overview, getting started, `docs/cli.md` (`braid ask`, `braid requests`, `braid answer`, codes in any case, `--kind action` for coordinators), `docs/board.md` (what a question unblocks, Decided, "Escalated to you", pushes, programme cards, the answer wake), the roadmap status, `docs/decisions.md` (derived "unblocks", the PM recording its own answers and the answer wake), and the CLI's help text.
- List in `report.md` each doc checked, as updated or unchanged.

## Out of scope

- Skills (0072/E). Anything 0074 or 0060 changed.

## Completion

- [x] Docs from BRAID.md `docs` are true for everything 0072 changed, as a whole
- [x] report.md lists each doc checked as updated or unchanged
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open

## Plan

1. Read the braid's diff, log and reports; check each doc in BRAID.md docs and the help text against the code (src/commands/requests.ts, src/notify/message.ts, src/board).
2. Fix the log's named gaps and what else is stale; add the recap decision (D113) and the roadmap line.
3. Gate, PR into the braid branch, report.md listing each doc.
