---
id: '0082/D'
title: "Answer a request from the board"
status: Outline
labels: ["kind:story", "tier:L", "ask:security"]
dependencies: ['0082/C']
order: 40
---

## Goal

The user answers a request from the board: an option or one line of free text, recorded on the request record as the user's answer, exactly as `braid answer` would, and the asking thread is woken with it (D113's wake).

What works at the end:

- A board endpoint that records an answer for an open request by handle, through the same code as `braid answer` (the lock, the record write and push), refusing a request that is no longer open.
- Only the board's owner can answer: the same check the board's other writing actions use (acting-board lease, the Tailscale owner answer, 0077/I); a read-only viewer can't.
- The asking coordinator or PM is woken with the answer and recaps it in one line (D116).
- Tests: answer by option and by text, a closed request refused, a non-owner refused.

The docs box: Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected.

Open questions (`ask:security`): who may answer from a board reached over Tailscale or the phone, and whether an answer from the board needs a confirmation step. The user decides before this strand is detailed.
