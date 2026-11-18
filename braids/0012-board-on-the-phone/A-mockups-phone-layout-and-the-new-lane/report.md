# Report

## What changed

- `docs/design/board-mockups/phone-lanes.html`: one mockup file; screens by hash (`#desktop`, `#done-open`, `#a-needs`, ..., `#notes`).
- Screenshots 29 to 40 next to the earlier ones: 29 desktop lane order (Done closed), 30 Done opened (10 newest, Show more), 31 to 33 variant A (tabs with counts), 34 to 36 variant B (swipe), 37 to 39 variant C (lane picker), 40 the notes.
- No product code changed.

## Variants (phone, 390 px; Needs You first; buttons icon + one-word label at 44 px or more)

- A, tab bar with counts: all lanes and counts always visible, one tap. Labels are small (To Review shortened to Review).
- B, swipe: most room for cards. Other lanes' counts hidden, swipe can collide with the back gesture, not discoverable.
- C, lane picker sheet: biggest targets, scales. Two taps, counts hidden until opened.
- Approved by the user (2026-11-18): A plus swiping left/right between lanes.

## Validation

Screens viewed after rendering. Gate (`npm run verify`) run on this branch; only docs and braid files changed.

## Decisions

- Buttons (user, 2026-11-18): the board's icons with tooltips; on the phone the same icons plus a one-word label (Start, Merge, Open thread), 44 px or more; desktop stays icon-only. No Answer or Approve plan buttons: answering is in the coordinator's thread, so on the phone Open thread opens it in the phone's own T3 app through the `t3code://threads/<env>/<thread>` app link. "Open item" opens the item page. This replaces the earlier "no Open thread on the phone".
- Phone: variant A (tab bar with counts) plus swiping left/right to switch lanes (user, 2026-11-18). The approved variant is marked in the mockup notes (screen 40).
- "Newest" in Done is the date the item became Done (its status commit).
- On the phone the Done tab works as on desktop: 10 newest, newest first, Show more.

## Open

Nothing. 0012/B builds this and updates `docs/board.md` and `docs/decisions.md`.

For later items: none.
Needs the user: none.
