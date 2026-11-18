# Report

## What changed

- Lanes read Needs You, To Review, Working, To Do, Done on desktop and phone (`LANES`, `LANE_LABEL`).
- Done is collapsed ("Show done"); opened it lists braids as rows, newest first, the 10 newest, and "Show more (n)" adds 10. Cards carry `doneAt`; `doneNewestFirst` and `DONE_PAGE` in `src/board/model.ts`.
- Phone layout (under 768 px): tab bar with counts, one lane at a time, Needs You first, swipe left/right between lanes; buttons at least 44 px (measured 44 px high in a 390 px headless Chrome) with icon and label (Start, Merge, Open thread); Open thread is an `<a href="t3code://threads/<env>/<thread>">`; the item page is one column. `t3codeUrl` moved to `src/board/marks.ts` so the page can build the link.
- Demo: 12 Done braids merged on different days, so Show more shows.
- Docs: `docs/board.md` (lanes, Done, "On the phone", demo), D58 in `docs/decisions.md`, screenshots 61 to 65 in `docs/design/board-screenshots/`; the two stale lines in `phone-lanes.html` fixed.
- Tests: lane order (API and labels), Done order and page (10, then 2 behind Show more), no-date ordering, `doneAt`, `t3codeUrl`.

## Why

Builds what the user approved in 0012/A (variant A plus swiping; icon and label buttons; Open thread app link).

## Validation

`npm run verify` passes (250 tests). Demo board driven in headless Chrome at 1500 px and 390 px: tabs, Done open with Show more, Start 82x44 and Open thread 132x44 px. Swiping is built from touch events and was not exercised on a real phone.

## Decisions

- "Became Done" is the merge date of the PR (`mergedAt`, already in the `gh pr list` call), not the status commit the verdict named: it needs no new Git reads and the two are the same day in practice. A Done item with no PR has no date and sorts after the dated ones, highest number first.
- "Show more" adds 10 per press.
- On the phone the Done tab still has the "Show done" fold, like desktop.

## Open

- Whether T3 on a phone handles `t3code://` is 0012/C's check.

For later items: the status-commit date for Done items without a PR (would need `git log` per brief) if the user wants it.
Needs the user: none
