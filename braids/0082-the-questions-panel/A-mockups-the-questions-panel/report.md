# 0082/A: Mockups: the Questions panel

## What changed

[mockups.html](mockups.html) (open it from this folder) shows the Questions panel on test data: three projects, eight questions to answer, two that block nothing. Nothing else is built: no product code, board code or tests changed.

1. The whole board at desktop width with the panel open on the right, 416 px (programmes: 320 px).
2. The panel collapsed to its rail: the count, and a red `!` while a question is escalated.
3. The ranked list, with the look and FYI group closed and open.
4. The roomy card: context closed, context open, the Custom text field, and the state just after an answer.
5. An older request with no options: the free-text line only.
6. Decided, collapsed and opened, with braid and programme requests.
7. Phone width: the panel stacked below the board.

The page follows the system theme and has a ◐ switch.

## Design choices

- Each rank has a heading (Escalated to you, Stops a braid or programme, Blocks several items, Blocks one item), so the order explains itself.
- A row shows the handle, the wait, the escalation mark, the question, the project and who asks, and `blocks … · decide|do`. A request that stops a whole programme reads `stops programme <slug>`. One that blocks nothing shows only the act word.
- One card is open at a time. The rest stay as rows.
- Option buttons keep their words, because the words are the answer. Custom (✎), Send (➤), Undo (↶), close and collapse are icon-only with tooltips. Open asking thread and item links are as today.
- The Look and FYI and Decided groups are collapsed by default, at the bottom. The panel scrolls by itself.
- The rail counts only the questions in the ranked list, not looks and FYIs.
- The details panel keeps opening from the right, over the Questions panel, as it does over the board today.
- The programmes panel stays as it is; only a programme need's footer would also point at the panel.
- The board has no dark theme today. The dark version shows the panel's design; building a dark board is not part of this braid.

## Open questions for the user

**1. What one click on an option does.** An answer wakes the asking agent, so a mis-click costs something once it is recorded.
- A. It sends at once.
- B. It sends after 5 seconds, with Undo until then; the next question opens right away (drawn in 4d; recommended).
- C. It only selects; ➤ sends.

**2. Merge handovers.** A coordinator that hands you a PR to merge also has an open request; the board shows it as `merge`, and your ranking names only decide and do. The mockups don't draw one.
- A. They are in the ranked list like any question, with the PR link and the card's Merge button instead of options (recommended: the panel then really lists everything waiting on you).
- B. They stay on the cards in To Review only.

**3. Context for an old request.** Requests opened before 0082/C have no `context`.
- A. No context box, only a link to the item (drawn in 5; recommended).
- B. The context box shows the item's brief Goal.

**4. Narrow desktop screens.** With both side panels open, the lanes get about 700 px on a 1440 px screen, so cards become tall and narrow.
- A. The lanes just get narrower (as drawn, at 1600 px).
- B. Below about 1600 px, opening one side panel collapses the other to its rail (recommended).
- C. The lanes keep a minimum width and scroll sideways.

**5. How a look request or an FYI is known.** The record has no such kind. The mockups put every request that blocks nothing into the collapsed group.
- A. Blocking nothing is enough (recommended: no record change).
- B. 0082/C adds a mark to the record, and a request that blocks nothing but needs a decision stays in the ranked list.

**6. An open request on a Done braid** (point 5 of 0082/B).
- A. It shows in the panel only (recommended: the panel is where questions are answered, and Done cards stay quiet).
- B. On the panel and on its Done card.

## Validation

- Rendered with T3's page preview at 1600 px light and 1400 px dark: no console messages. The page was not tried in a separate browser, and the preview does not exercise the ◐ switch.
- Gate `npm ci` then `npm run verify` on Windows: exit 0, 786 tests passed, none failed or skipped (the test run took about 10 min).

## Docs

None affected: nothing the product does changed.

## Anything open

The user's review of the mockups. No PR until the user approves.

For later items: none
Needs the user: none
