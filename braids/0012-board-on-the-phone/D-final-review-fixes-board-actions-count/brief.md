---
id: '0012/D'
title: "Final review fixes: board actions count and D32 lane order"
status: To Do
labels: ["kind:task", "tier:S"]
dependencies: []
order: 40
---

## Goal

Fix two factual errors in the docs that the review of the braid's final PR found (https://github.com/exones/braid/pull/143#issuecomment-6985088871).

Expected size: about 4 lines in 2 files.

## Change

- `docs/board.md` around line 118: "Today there are two, `merge` and `start`" is wrong; `open` is a third registered action (local listener only). Name all three.
- `docs/decisions.md` D32: it still lists the old lane order (To Do, Working, To Review, Needs You, Done). Add that D59 replaced the display order.

## Out of scope

- Anything else; the other review notes are leftovers.

## Completion

- [ ] docs/board.md names the three actions
- [ ] D32 says D59 replaced its lane order
- [ ] The gate command from BRAID.md passes
- [ ] report.md written
