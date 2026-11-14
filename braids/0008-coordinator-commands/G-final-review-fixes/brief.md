---
id: '0008/G'
title: "Final review fixes"
status: To Do
labels: ["kind:task", "tier:S"]
dependencies: ['0008/C']
order: 40
---

## Goal

Apply the final review of braid 0008 (PR #84, https://github.com/exones/braid/pull/84#issuecomment-6881388157), so the CLI, docs and skills agree after 0008/F changed the lane rules.

Expected size: about 40 to 100 lines.

## Change

- `test/coordinate.test.ts`: `braid next` with a stored-Done strand that has an open PR (not ready, not all done), and `braid status` with an `ask:` label (printed after the lane).
- `docs/decisions.md` D40: an `ask:<key>` label is a flag only, not a waiting reason.
- `.agents/skills/braid/references/workflow.md` (around lines 46-48): a strand whose PR waits for merge shows To Review (or Needs You on failing checks), not Done.
- `docs/braids-format.md` (`braid status`) and `braid help`: `ask:<key>` after the lane; `clean` takes a braid number or a strand id.
- `0008/F`'s brief: tick its report.md box (report.md exists).

## Acceptance

- [ ] The two seam cases are covered by CLI tests
- [ ] D40, the workflow, docs/braids-format.md and braid help match the code
- [ ] CI green on Windows and Ubuntu

## Definition of done

- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
