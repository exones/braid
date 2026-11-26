---
id: '0082/E'
title: "The Questions panel on the board"
status: Outline
labels: ["kind:story", "tier:M", "ui"]
dependencies: ['0082/A', '0082/B', '0082/C', '0082/D']
order: 50
---

## Goal

The Questions panel on the board, built as the user approved it in 0082/A's mockups: right of the board, wider than the programmes panel, collapsible, every open question of every project ranked by what it blocks, each answered in place with the roomy card, and Decided for braids and programmes.

What works at the end:

- The ranking from the parent brief, computed in the model from `Need` (`blocks`, `act`, `handle`) and the programme requests, with tests.
- The panel and its rail, remembered open or collapsed in the browser like the programmes panel.
- The roomy card (collapsible context, the question in larger type, option buttons, Custom swapping them for a text field), answering through 0082/D and moving on to the next question.
- Decided for braids and programmes (the PM's own `pm/<slug>` requests).
- Board buttons icon-only with the words in the tooltip (q-i0ry).
- The worker's final screens, light and dark, for the recap.

The docs box: Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected.

Open questions: whatever the mockup review leaves open; detailed after the user approves 0082/A.
