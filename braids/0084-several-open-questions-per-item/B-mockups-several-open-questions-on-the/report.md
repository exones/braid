# 0084/B: Mockups: several open questions on the board

The user approved the look with one change: variant B (lazy-cloud-560n, 2026-11-28). Nothing is built; 0084/C builds it.

## What changed

[mockups.html](mockups.html) (open it from this folder; ◐ switches light and dark) shows the board, on test data, when one item has several open questions:

1. Strand rows on an open braid card: three coordinator questions on 0009/A, a coordinator and a PM question on 0009/B; Details on and off.
2. The folded braid card that shows a strand's questions; Details on and off.
3. The two card variants: B approved, A kept as the record.
4. A handover (merge) open beside two questions.
5. The details panel: the banner above the brief and the Requests tab with three open.
6. The Questions panel with three rows from one item.
7. The programmes panel with two open `pm/<slug>` questions, and its rail.
8. Phone width (390 px).

A strand has no card of its own on today's board; the brief's "strand card" is drawn as its row on the braid card.

## The approved look

- A card with several questions on one item shows the oldest open one in today's box, then "+N more" with the other names (variant B). A click opens the Requests tab.
- The folded braid card shows the most urgent strand, plus "+N more in strands".
- A handover with open questions is in Needs You, the merge line and Merge button above the questions (amends D46).
- With Details off, the ? icon shows a count; its tooltip lists them all.
- The details banner shows all in one "Needs you · n open" box, and the programmes panel shows every `pm/<slug>` question. The Requests tab, Questions panel, ranking, rail and phone tab counts don't change.

## Decisions

The user's verdict (lazy-cloud-560n, 2026-11-28), approved with one change:

1. A card with several questions shows the oldest open question plus "+N more" (variant B), not every question in full.
2. As proposed: the folded braid card shows the most urgent strand plus "+N more in strands".
3. As proposed: a PR handover with open questions goes to Needs You, with the Merge button kept above the questions (this amends D46).
4. As proposed: with Details off, the ? icon shows a count.

How the mockups apply it where the verdict didn't say:

- On one item the coordinator's and the PM's questions count together: one box (the oldest of either) and "+N more". On 0009/B the PM's question is behind "+1 more".
- The folded braid card still shows another strand's PM question under the shown strand's, as today and as drawn in the proposal.
- The Merge button moves from the card's bottom row into the merge line, so it is above the questions.
- The details banner keeps the PM's question in its own "from the PM" box, as today.

## Validation

- Rendered in headless Edge after the change at 1200 px (light and dark) and in 390 px frames (light and dark); read through by eye. The ◐ switch was not clicked.
- Gate: `npm ci` then `npm run verify` on Windows: exit 0, 822 tests passed, none failed or skipped, in 1756 s.

## Docs

`docs/decisions.md` records the approved look (D122, with a note on D46) and has the decision log entry. No product behaviour changed, so the other docs are unaffected until 0084/C.

## Anything open

Nothing.

For later items: 0084/C: build the approved look and document it, with the D46 change, in `docs/board.md`; the programme rail badge is a fixed "1" per programme today and stays so.
Needs the user: none
