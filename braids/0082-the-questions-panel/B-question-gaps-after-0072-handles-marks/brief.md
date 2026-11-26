---
id: '0082/B'
title: "Question gaps after 0072: handles, marks and waits"
status: Outline
labels: ["kind:task", "tier:M"]
dependencies: []
order: 20
---

## Goal

Every place the user reads a request names it and marks it the same way, so the Questions panel shows clean data. Fixes leftover 2026-11-26-03t9 (the PM's live check of 0072 at af35754, PR #349) and 2026-11-25-1onw (spoken handles after 0072/G).

What works at the end:

1. The "replaced by …" text on a withdrawn request and `braid decisions` show handles, not q-codes (`src/braids/requests.ts` `openRequest`, `answeredRows`).
2. On the Requests tab, a request the PM escalated carries the escalated mark (`web/src/App.tsx` `RequestsTab`).
3. A wait on another braid doesn't read "· decide", and a timed wait doesn't show as "question" (`actOf`, `src/board/model.ts`).
4. `braid ask` that replaces an open question says which one it replaced (`askCommand`, `src/commands/requests.ts`).
5. An open request on a Done braid stays on the board.
6. `braid board --no-pause` help says it also turns off the wake.
7. Tests pin `Need.handle` and an all-digit q-code (q-0123 given with `q-` or its words).

The docs box: Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected.

Open questions: whether point 5 belongs on the card, the Questions panel or both (0082/A's mockups decide).
