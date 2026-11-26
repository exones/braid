---
id: '0082/A'
title: "Mockups: the Questions panel"
status: To Do
labels: ["kind:task", "tier:S", "ui"]
dependencies: []
order: 10
---

## Goal

One HTML page of mockups, `mockups.html` in this strand's folder, that shows the Questions panel on realistic test data, so the user can approve its design before anything is built. Nothing else is built.

Expected size: one self-contained HTML file of about 600 lines, plus `report.md`.

## Start here

- `braids/0072-questions-say-what-they-unblock/B-the-board-shows-what-a-question-unblocks/mockups.html` (revised at d72bb557): the roomy question card (collapsible context, the question in larger type, one button per lettered option, Custom swapping the buttons for a text field) and the dark theme. Start from its look and styles: the same page format, self-contained, opened from the folder.
- The parent brief `braids/0082-the-questions-panel/brief.md`, "Already decided": the user's binding decisions, the ranking and the row fields.
- `web/src/App.tsx`: the board's layout, the programmes panel left of the lanes (`PANEL_KEY`, `ProgrammeCard`, its rail when collapsed), the cards' need lines, `RequestsTab` with its Decided group; `web/src/palette.ts` and `web/src/index.css` for the real colours. The mockups should look like this board, not a new design language.
- `src/board/demo.ts`: the board's demo data, for realistic names, handles and items.
- `src/board/model.ts` `Need` (`blocks`, `act`, `handle`) and `src/board/pm.ts` `routeOf` and `viaNote`: what a row can show today.

## Change

- `mockups.html` in this folder, light and dark (as 0072/B's page), with these frames, each titled with what it shows:
  1. The whole board at desktop width: the programmes panel on the left, the lanes, and the Questions panel on the right, a bit wider than the programmes panel, open. Two or three projects, about eight open questions across them.
  2. The same board with the Questions panel collapsed: its rail, with the count of open questions and a mark when one is escalated.
  3. The panel's list ranked as the parent brief says: escalated on top; stops a braid or programme entirely; blocks several items (more first); blocks one item; then a collapsed group of look requests and FYIs. Oldest first within a rank. Each row: the handle, the question, who asks (a programme's PM or a braid's coordinator, with the project), `blocks … · decide|do`, the wait (e.g. `42 min`) and the escalation mark.
  4. One question opened in place as the roomy card: context collapsed and expanded, the question in larger type, one button per lettered option (proposed by the agent), a Custom button that swaps the buttons for a one-line text field with Send, and the move on to the next question after an answer.
  5. A question with no proposed options (an older request): the free-text line only.
  6. The Decided group, collapsed by default and opened: answered questions of braids and of programmes (a PM's own request, e.g. `tiny-tractor-3i2b`), with the answer, who answered (the user, or the PM with its reason) and when.
  7. The panel at phone width (stacked below the board, or the panel alone); keep it simple.
- Buttons on the board are icon-only with the words in the tooltip (q-i0ry); Open thread and thread links stay as they are. Show a tooltip in one frame.
- A short note beside each frame on what is new against today's board.
- `report.md`: what the page shows, the design choices you made, and the open questions for the user as lettered options (for example where context comes from for an old request).
- Commit the page and the report on your strand branch and push. Then end your run with the report, naming the page's path, and stop: no PR yet. The coordinator shows the mockups to the user; each verdict comes back to you as a message, and you revise until the user approves. Only after the approval, on the coordinator's word, open the PR into the braid branch.

## Already decided

- Everything under the parent brief's "Already decided" is binding, including the user's "1. b, but on the right and a bit wider, collapsible; 2. a; 3. a", "E room is for special panel on the right", q-zctf and q-i0ry.
- The mockups are test data only: no product code, no change to `web/`, `src/` or tests.
- The request fields `context` and `options` don't exist yet (0082/C adds them); the mockups assume them.

## Out of scope

- Any product code, CLI or record change; any other strand.
- Answering from pushes or the phone strip.

## Completion

- [ ] `mockups.html` in this folder shows frames 1 to 7 above, light and dark, on realistic test data
- [ ] report.md lists the design choices made and the open questions for the user as lettered options
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
