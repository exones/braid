# 0084/B: Mockups: several open questions on the board

Waiting for the user's look. Nothing is built.

## What changed

[mockups.html](mockups.html) (open it from this folder; ◐ switches light and dark) shows the board, on test data, when one item has several open questions:

1. Strand rows on an open braid card: three coordinator questions on 0009/A, a coordinator and a PM question on 0009/B; Details on and off.
2. The folded braid card that shows a strand's questions; Details on and off.
3. The two card variants.
4. A handover (merge) open beside two questions.
5. The details panel: the banner above the brief and the Requests tab with three open.
6. The Questions panel with three rows from one item.
7. The programmes panel with two open `pm/<slug>` questions, and its rail.
8. Phone width (390 px).

A strand has no card of its own on today's board; the brief's "strand card" is drawn as its row on the braid card.

## Proposal

- Cards, programme cards: today's request box, once per open question, oldest first; on an item with both, the coordinator's come before the PM's. No new component.
- The folded braid card keeps showing one item (the most urgent), now with all its questions; "+n more in strands" keeps counting other strands, not questions.
- Details off: one ? icon with a count when there are several; its tooltip lists them all.
- Details banner: one "Needs you · n open" box with the questions separated by a line; the PM's keeps its own banner.
- Requests tab, Questions panel, ranking, rail marks and phone tab counts: unchanged.
- A request the PM is still handling would repeat its teal line the same way (not drawn).

## Variants

- **A (recommended):** every question listed in full. Readable without a click, matches the programmes panel, and simplest to build. Cost: a tall card.
- **B:** the oldest in full, then "+2 more questions" with the other names; a click opens the Requests tab. Shorter, but the others can't be read on the card.

## Questions for the user

1. The board cards, when one item has several open questions: list every one (A), or the first and "+2 more" (B)? Recommended: A.
2. A folded braid card, when more than one of its strands asks: keep showing only the most urgent strand's questions with "+1 more in strands" (drawn, recommended), or list every strand's questions?
3. A merge handover open beside questions on the same item (screen 4): put the card in Needs You with the merge line and Merge button kept and the questions under it (recommended), or keep it in To Review?
4. Compact cards (Details off): is the count on the ? icon wanted? Recommended: yes, it is the only sign there are several.

## Validation

- Rendered in headless Edge at 1200 px (light and dark) and in 390 px frames (light and dark); read through by eye. The ◐ switch was not clicked.
- The gate has not run yet: it runs before the PR, after the look.

## Docs

No product behaviour changed, so no doc is affected now. The approved look goes into `docs/decisions.md` after the user's verdict.

## Anything open

The user's look.

For later items: 0084/C: build the approved variant; the programme rail badge is a fixed "1" per programme today and stays so in the mockups.
Needs the user: none beyond the look (the four questions above)
