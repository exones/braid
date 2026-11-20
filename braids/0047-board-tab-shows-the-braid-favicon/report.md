# Report 0047

## What changed

- `web/public/` holds byte-for-byte copies of `favicon.svg`, `favicon-32.png` and `apple-touch-icon.png` from `design/icons/`; Vite puts them at the root of `dist/web`.
- `web/index.html` has the three `<link>` tags from `design/README.md`.
- `src/commands/board.ts`: `.png` (`image/png`) added to `TYPES`.
- `test/board.test.ts`: the board serves the three files with the right content types and the page links them; a test fails if a copy differs from its design file.

## Why

The board tab showed no icon. Copies plus an equality test avoid shipping every icon size in the npm package.

## Validation

`npm run verify` passes (358 tests).

## Open

Nothing.

For later items: none
Needs the user: none
