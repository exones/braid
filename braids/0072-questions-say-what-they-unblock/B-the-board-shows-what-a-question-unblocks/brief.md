---
id: '0072/B'
title: "The board shows what a question unblocks, and what was decided"
status: To Do
labels: ["kind:story", "tier:M", "ui"]
dependencies: ['0072/A']
order: 20
---

## Goal

On the board, a question says what its answer unblocks and whether it is to decide or do, answered questions stay listed as Decided with the answer, and an escalation says plainly that it reached the user: "Escalated to you".

Expected size: about 250 lines in 5 files, tests included.

## Start here

- `src/board/model.ts`: `needOfRequest`, `needOfForward`, `needOfAsk`, `requestLane` and the `Need` type (what a card's need line carries); the item's `requests` view (open, waiting, closed).
- `src/board/pm.ts`: `routeOf` (`words: "Escalated:"`) and `viaNote` ("the PM hasn't answered for 20 min").
- `web/src/App.tsx`: the card's need line, `RequestsTab` and `RequestHistory` (about lines 1260 to 1300).
- The function 0072/A added for what a request unblocks.
- Inbox idea 2026-11-24-s9sr, taken in: "Wording: when the board moves a braid's question from the PM to the user, the card and the push say 'Escalated to you' (with the PM's silence, for example '… the PM hasn't answered for 20 min'), not just 'Escalated', which read as 'escalated to the PM'. The user, 2026-11-24: keep the 20-minute safety net ('I like that it escalated because at least I somehow caught it. This is a nice safety net'); change only the wording to 'escalated to you'."

## Change

- **Mockups first** (the `ui` label): on realistic test data (`src/board/demo.ts`), a card in Needs You with a strand question that blocks two strands, a braid-level plan question, an `action`, an escalated one, and the details panel's Requests tab with a Decided group. Stop and report them; build only after the user's verdict, through the coordinator.
- `Need` gets what the request unblocks and its act word (`decide`, `do`, `merge`); the card's need line shows them, e.g. "blocks 0072/B, 0072/C · decide".
- The Requests tab lists answered questions under **Decided**: the question, the answer, who answered (the user or the PM, with the PM's reason) and when. Withdrawn and met requests stay listed as now.
- The escalation's words: "Escalated to you:" on the card and wherever `words` is used; the PM's silence note stays.
- Tests on the model (need fields, the Decided list, the words); the web build passes.

## Already decided

- The escalation and its 20/60-minute limits stay; only the wording changes (the user).
- Related to 0074: it adds pause and Resume to cards (`src/board/pause.ts`, `src/board/programme.ts`); keep this strand out of those files.

## Out of scope

- Pushes and the programmes panel (0072/C). Pause, limits, Resume (0074).

## Completion

- [ ] Mockups shown and approved before building (log entry with the verdict)
- [ ] A card's question says what it unblocks and decide, do or merge, with tests
- [ ] The Requests tab lists answered questions as Decided with the answer, who and when, with tests
- [ ] An escalation reads "Escalated to you", with tests
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
