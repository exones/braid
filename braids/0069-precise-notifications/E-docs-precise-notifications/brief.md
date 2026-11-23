---
id: '0069/E'
title: "Docs: Precise notifications"
status: Done
labels: ["kind:task", "tier:S"]
dependencies: ['0069/A', '0069/B', '0069/C', '0069/D']
order: 50
---
## Goal

The docs from `BRAID.md` `docs` say, as a whole, what braid's notifications do after every other strand of 0069.

Expected size: about 80 lines in 4 files.

## Start here

- Everything 0069 changed, from its first strand: the braid branch's diff against `main` and the strands' reports.
- `docs/board.md` "Notifications", `docs/cli.md` (`braid notify`), `docs/decisions.md` (D70 and later), `README.md`, `docs/getting-started.md`, `docs/roadmap.md`, the CLI's help text.

## Change

- `docs/board.md` "Notifications": what triggers a push (the one rule), which thread it opens, the merge group, the PM's direct push; drop what no longer holds.
- `docs/cli.md`: `braid notify send`.
- `docs/decisions.md`: one decision for the rule and why (push only what a request asks of the user, from the request record; no mode setting).
- README, getting started, roadmap status: check, update where untrue.
- From the review of 0069/B (https://github.com/exones/braid/pull/256#issuecomment-7089918385): the CLI help (`src/cli.ts` near line 80), `docs/getting-started.md` and the README still say a forward reaches Needs You; D88 still says a programme-run Done pushes at `low` (D92 supersedes it: mark it).

## Already decided

- Docs only; a product gap found goes to the report's "For later items".

## Out of scope

- Skills and agent instructions (0069/D changes the braid-pm lines).

## Completion

- [x] Each doc from BRAID.md `docs` is listed in report.md as updated or unchanged
- [x] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open
