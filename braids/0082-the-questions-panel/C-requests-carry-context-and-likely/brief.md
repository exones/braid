---
id: '0082/C'
title: "Requests carry context and likely answers"
status: Outline
labels: ["kind:story", "tier:L"]
dependencies: []
order: 30
---

## Goal

A request can carry its context and the agent's likely answers, so the Questions panel can show the roomy card with one button per option. Takes in idea 2026-11-23-wcox (P17); the user: "when asking question: propose most probably answers (1, 2, 3 or 4), so that UI can propose them and also always propose free-style one line answer from UI".

What works at the end:

- The request record has two optional fields, `context` (Markdown) and `options` (one to four lettered answers), on the `opened` event; records without them, and older `braid` versions reading new records, keep working (tier L: a persistent data format).
- `braid ask --context <text>`, `--context-file <path|->` and `--option <text>` (repeated, in order A to D); `braid requests` and `braid show` print them.
- `braid answer` accepts a letter of a stored option and records the option's text with it.
- The braid and braid-pm skills ask with `--option` (and `--context` when the chat message has more than the board line) instead of only lettering the options in chat. This edits agent instructions, which the user asked for as part of P25 (P17); the user merges it.

The docs box: Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected.

Open questions: how big `context` may be on the record branch, and whether the push carries the options (the 0082/A mockups and the user decide).
