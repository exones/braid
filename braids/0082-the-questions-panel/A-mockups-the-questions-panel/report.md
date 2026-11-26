# 0082/A: Mockups: the Questions panel

## What changed

[mockups.html](mockups.html) (open it from this folder) shows the Questions panel on test data: three projects, nine questions to answer (one a PR to merge), two looks or FYIs. Nothing else is built: no product code, board code or tests changed.

1. The whole board at desktop width with the panel open on the right, 416 px (programmes: 320 px).
2. The panel collapsed to its rail: the count, and a red `!` while a question is escalated.
3. The ranked list, with a PR waiting for merge, and the look and FYI group closed and open.
4. The roomy card: as it opens with its context shown, context folded, the Custom text field, and the state just after an answer.
5. An older request with no options: the free-text line only.
6. Decided, collapsed and opened, with braid and programme requests.
7. Phone width: the panel stacked below the board.

The page follows the system theme and has a ◐ switch.

## Design choices

- Each rank has a heading (Escalated to you, Stops a braid or programme, Blocks several items, Blocks one item), so the order explains itself.
- A row shows the handle, the wait, the escalation mark, the question, the project and who asks, and `blocks … · decide|do`. A request that stops a whole programme reads `stops programme <slug>`. A look or FYI row carries its mark and, blocking nothing, only the act word.
- One card is open at a time, with its context shown (a click folds it). The rest stay as rows.
- Option buttons keep their words, because the words are the answer. Custom (✎), Send (➤), Merge (⇥), close and collapse are icon-only with tooltips. Open asking thread and item links are as today.
- The Look and FYI and Decided groups are collapsed by default, at the bottom. The panel scrolls by itself.
- The rail counts only the questions in the ranked list, not looks and FYIs.
- The details panel keeps opening from the right, over the Questions panel, as it does over the board today.
- The programmes panel keeps its layout; only a programme need's footer would also point at the panel.
- The board has no dark theme today. The dark version shows the panel's design; building a dark board is not part of this braid.

## Decisions

The user's answers (shiny-muffin-fqro, 2026-11-26), approving the mockups: "Otherwise very good job. Start it."

1. One click on an option: **A**, it sends at once, with no undo delay (drawn in 4d).
2. PRs waiting for the user's merge: **A**, ranked in the panel with the PR link and Merge (drawn in 1 and 3).
3. Context of an older request: **A**, no context box, only a link to the item (drawn in 5).
4. Narrow desktop screens: **B**, below about 1600 px opening one side panel collapses the other (noted at 1, not drawn).
5. Looks and FYIs: **B**, a mark of their own on the request record, from 0082/C (rows marked in 3).
6. An open request on a Done braid: **B**, in the panel and on the Done card, "I don't want to lose questions" (noted at 1, not drawn).

And one change, verbatim: "When I open a cart, I think the context has to be open as well, because otherwise how could I answer the question if I don't understand the context." An opened card now shows its context expanded (4a), still collapsible.

## Validation

- Rendered with T3's page preview after the last change at 1400 px, frames 1 to 4 light and 4 to 7 dark: no console messages. The page was not tried in a separate browser, and the preview does not exercise the ◐ switch.
- Gate `npm ci` then `npm run verify` on Windows: exit 0, 786 tests passed, none failed or skipped (the test run took about 10 min).

## Docs

`docs/decisions.md` records the approved design (D118). Nothing the product does changed, so no other doc is affected.

## Anything open

The panel is not built; 0082/B to E do that.

For later items: 0082/C: a look/FYI mark on the request record (answer 5). 0082/D: an option click records at once, with no confirmation step (answer 1; its other `ask:security` question stays). 0082/E: merge requests in the panel, context expanded on an opened card, one side panel collapsing the other below about 1600 px (answers 2 and 4). 0082/B or E: the open request on the Done card (answer 6). These are also in the parent brief's "Already decided".
Needs the user: none
