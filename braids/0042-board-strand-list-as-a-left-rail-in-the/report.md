# Report 0042

## What changed

- `web/src/App.tsx`: `Contents` is the rail again, not a chip row. The panel for a braid with strands, or one of its strands, is two columns: a 280 px rail that scrolls on its own (braid id and title, lane and marks, "Braid brief", one row per strand with lane dot, `A · Title` and marks, the current one highlighted; a click calls `go`) and the details. A braid without strands keeps one column and no rail. On a phone the rail sits above the details, at most a third of the screen high, scrolling on its own. No "← Board" in the rail; the panel's ✕ and the phone's "← Board" are unchanged. The panel's width, closing and history rules are untouched.
- `docs/board.md` "The item details" and the phone paragraph describe the rail; screenshots 71 and 72 are new. D65 in `docs/decisions.md` records the rail and the phone placement (user's verdict, 2026-11-19).

## Why

The chip row 0034 introduced read oddly to the user; they wanted the old item page's left rail back inside the panel.

## Validation

- `npm run verify` passed (306 tests, 0 failures).
- Checked on `braid board --demo`: braid 0001 strand B at 1440 px (`final-desktop.png`) and at 390 px (`final-phone.png`) in this folder; braid 0005 (`Braid brief` selected) shows the highlight moving. Design stage: `mock-*.png`; verdict in `log-2026-11-19-user.md`.
- Not screenshotted: a braid without strands; it is the unchanged one-column branch (`strands.length > 0` guards the rail and the grid).

## Open

Nothing.

For later items: none.

Needs the user: none.
