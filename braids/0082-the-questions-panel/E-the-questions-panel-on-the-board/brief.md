---
id: '0082/E'
title: "The Questions panel on the board"
status: To Do
labels: ["kind:story", "tier:M", "ui"]
dependencies: ['0082/A', '0082/B', '0082/C', '0082/D']
order: 50
---

## Goal

The Questions panel on the board, built as the user approved it in 0082/A's mockups (D118): right of the board, a bit wider than the programmes panel, collapsible, with every open question of every project ranked by what it blocks, each answered in place with the roomy card through 0082/D's `answer` action, then on to the next; and Decided for braids and programmes. The user: "It now takes a lot of time chasing the questions all over the board."

Expected size: about 700 lines in 6 files, tests included.

## Start here

- `braids/0082-the-questions-panel/A-mockups-the-questions-panel/mockups.html` and its `report.md`: the approved design, frame by frame. Build to it; where the page and this brief differ, the user's answers in the parent brief win.
- D118 and D119 in `docs/decisions.md`; the parent brief's "Already decided" (the ranking, the row fields, the user's answers 1A to 6B, context open on an opened card).
- `src/board/model.ts`: `Need` (`blocks`, `act`, `handle`, and from 0082/C `context`, `options`, the kind), `needOfRequest`, and how a card carries only its top need while each strand has its own `need` and `pmAsk` (0082/B).
- `src/braids/requests.ts` `unblocksOf` (line 762): returns [] for a programme's own request (`id: pm/<slug>`), since it knows only braid numbers.
- `src/board/programme.ts`, `src/board/pm.ts` (`routeOf`, `viaNote`): programme requests and escalation.
- `web/src/App.tsx`: the programmes panel (`PANEL_KEY`, its rail, `ProgrammeCard`), the cards' need lines (`NeedLine`, gated on `details`), `RequestsTab` with its Decided group; `web/src/api.ts` and 0082/D's `answer` call.
- `src/board/demo.ts`: demo data; extend it so `braid board --demo` shows the panel with every rank.

## Change

- **Model** (`src/board/`, tested): one ranked list of open requests across the served projects, each with the handle, the question, who asks (a programme's PM or a braid's coordinator, with the project), `blocks … · decide|do|merge`, the wait and the escalation mark, plus `context` and `options`. Ranks:
  1. escalated, on top;
  2. stops a braid or programme entirely, including a programme's own questions (`pm/<slug>`, the PM, 2026-11-26) and a plan request;
  3. blocks several items, more first;
  4. blocks one item;
  5. blocks nothing (`look` requests and FYIs): a folded group.
  Oldest first within a rank. PRs waiting for the user's merge are ranked too, with the PR link and Merge (2A). Read each strand's `need` and `pmAsk`, not only the card's top one; an open request on a Done braid or strand is listed (6B).
- **Decided**: answered questions of braids and of programmes (the PM's own `pm/<slug>` requests), with the answer, who answered (the user, or the PM with its reason) and when; folded by default; waits left out (D115).
- **The panel** (`web/src/App.tsx`, or a new `web/src/Questions.tsx`): right of the lanes, a bit wider than the programmes panel; collapses to a rail with the open count (looks and FYIs left out) and an escalation mark; remembered open or collapsed in the browser like the programmes panel. Below about 1600 px, opening one side panel collapses the other (4B).
- **The roomy card**: a row opens in place; its context is open (and can be folded; 3A: an old request with no context shows only a link to the item); the question in larger type; one button per option, which sends at once (1A); Custom swaps the buttons for a one-line text field with Send. After an answer the next question opens. A refusal from the action (the request closed meanwhile) shows its message and refreshes the list.
- **Board buttons** icon-only with the words in the tooltip (q-i0ry); Open thread and thread links stay as they are.
- **The compact card**: a Done strand's request on a live braid shows with Details off, as in the Done row (0082/B's review).
- Tests on the ranking (every rank, ties by age, programme questions, looks folded, merges, Done items, strands' own needs) and on Decided; the web build passes.
- Screens: the worker's final screens of the panel, open, collapsed, an opened card and Decided, from `braid board --demo`, saved in this strand's folder and named in report.md.

## Already decided

- Everything in the parent brief's "Already decided", including the user's answers on shiny-muffin-fqro and the ranking.
- Answering goes through 0082/D's `answer` action on both listeners, with no confirmation (the user, smooth-window-jjid).
- `look` is a request kind (0082/C, the user on calm-guitar-nde8).

## Out of scope

- Answering from pushes or the phone strip; the phone width only stacks the panel.
- Changing the details panel's Requests tab beyond what the shared model needs.
- Docs as a whole (0082/F); this strand updates only what it makes untrue.

## Completion

- [ ] The model ranks every open request of every served project as above, with tests
- [ ] Decided lists answered questions of braids and programmes, with tests
- [ ] The panel sits right of the lanes, collapses to a rail with its count, and remembers its state; below about 1600 px one side panel collapses the other
- [ ] A question is answered in place with an option button or the Custom line through the `answer` action, then the next one opens
- [ ] Board buttons are icon-only with tooltips; a Done strand's request shows on the compact card with Details off
- [ ] Screens from `braid board --demo` saved in this folder and named in report.md
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
