---
id: '0013'
title: "braid view shows strand dependencies"
status: Done
labels: ["kind:story", "tier:S"]
dependencies: []
delivery: epic
---

## Goal

The coordinator finds the next ready strand from one `braid view <number>`: each strand line also shows the strand's dependencies, so it no longer has to open every strand. This is also the trial braid of 0007/E, the first braid run end to end on the braid skills.

Expected size: about 30 to 60 lines in 2 to 3 files, with tests.

## Start here

- `src/commands/braids.ts`: `strandLine` and the braid view that prints a braid's strands (id, status, order, title).
- `test/`: the existing tests for `braid view` and `braid list`.
- `docs/braids-format.md`, "Commands": what `braid view` is documented to print.

## Change

- `src/commands/braids.ts`: a strand line in `braid view <number>` ends with its dependencies when it has any, for example `0013/B  To Do  20  Title  (needs 0013/A)`; a strand without dependencies prints as today. `braid list` stays as it is.
- Tests for a strand with one dependency, with two, and with none.
- `docs/braids-format.md`: one line on the new part of the output.

## Already decided

- Only the strand lines of `braid view <number>` change; the output stays plain text for agents.

## Out of scope

- `braid next` and readiness logic (braid 0008, coordinator commands); `braid list`; the board.

## Acceptance

- [x] `braid view <number>` shows each strand's dependencies on its line, covered by tests
- [x] docs/braids-format.md describes it
- [x] CI green on Windows and Ubuntu

## Definition of done

- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open

## Plan

- `strandLine(strand, withDeps)`: the braid view passes true and appends `  (needs A, B)` when the strand has dependencies; `braid list` passes false.
- Tests in test/braids.test.ts: view with one, two and no dependencies; list unchanged.
- One line in docs/braids-format.md.
