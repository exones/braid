# Report

## What changed

- `docs/design/board-mockups/phone-lanes.html`: one mockup file; screens by hash (`#desktop`, `#done-open`, `#a-needs`, ..., `#notes`).
- Screenshots 29 to 40 next to the earlier ones: 29 desktop lane order (Done closed), 30 Done opened (10 newest, Show more), 31 to 33 variant A (tabs with counts), 34 to 36 variant B (swipe), 37 to 39 variant C (lane picker), 40 the notes.
- No product code changed.

## Variants (phone, 390 px; Needs You first; Start, Merge, Answer at 44 px or more; no Open thread)

- A, tab bar with counts: all lanes and counts always visible, one tap. Labels are small (To Review shortened to Review).
- B, swipe: most room for cards. Other lanes' counts hidden, swipe can collide with the back gesture, not discoverable.
- C, lane picker sheet: biggest targets, scales. Two taps, counts hidden until opened.
- Recommendation: A, with swiping as an extra.

## Validation

Screens viewed after rendering. Gate (`npm run verify`) run on this branch; only docs and braid files changed.

## Open

- "Newest" in Done: proposed the date the item became Done (status commit), no GitHub call needed; the PR merge date is the alternative. Needs your pick.
- Done on the phone assumed collapsed with the same 10 and Show more.

For later items: none.
Needs the user: scope: pick a phone variant (A tabs, B swipe, C picker) and the date for "newest" in Done, so 0012/B can build it.
