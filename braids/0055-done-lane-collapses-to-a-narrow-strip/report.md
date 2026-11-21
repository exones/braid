# 0055 report

## What changed

- `web/src/App.tsx`: the Done open state moved from `DoneLane` to `Board`. From `md` up, collapsed Done is a 3rem strip (dot, count, vertical "Done"), one `aria-expanded` button; the grid is four equal columns plus the strip. Opened, five columns with "Hide done" at the top. The phone keeps its tabs and "Show done" button.
- Open Done rows wrap: the title wraps and the day drops under it when the column is narrow (the overlap seen at 900 px), added by the user with the mockup approval.
- `docs/board.md` Done paragraph, decision D80, and desktop screenshots 31, 33, 61, 62 retaken on `braid board --demo` data.

## Why

The collapsed Done lane kept a fifth of the width for a count and a button; the user rarely opens it and wants the room for the other lanes.

## Validation

`npm run verify` (see PR). Checked by hand in headless Chrome at 1440 and 900 px, collapsed and opened, on `--demo` data.

For later items: none.
Needs the user: none.
