---
id: '0047'
title: "Board tab shows the braid favicon"
status: Done
labels: ["kind:story", "tier:S"]
dependencies: []
delivery: epic
---

## Goal

The `braid board` page shows no icon in the browser tab. Give it the approved braid favicon from the design pack, so the tab (and a phone's home-screen shortcut) shows the braid symbol on its navy tile.

The user added: every enabled clickable button on the board (for example "Open coordinator thread", "Open worker thread") shows the hand (pointer) cursor on hover, not the arrow. Tailwind v4 dropped the default `cursor: pointer` on buttons.

Expected size: about 30 lines in 4 files, plus three copied icon files.

## Start here

- `design/README.md`, "Using the files": the approved favicon set and the exact `<link>` tags (`favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`).
- `design/icons/` and `design/icons/png/`: the approved files. They are built by `design/source/build/`; don't redraw or regenerate them.
- `web/index.html` and `web/vite.config.ts`: the board page; Vite builds it into `dist/web`.
- `src/commands/board.ts`: `TYPES` and the static file route that serves `dist/web`.
- `test/board.test.ts`: how the server's routes are tested.

## Change

- `web/public/`: copies of `design/icons/favicon.svg`, `design/icons/png/favicon-32.png` and `design/icons/png/apple-touch-icon.png`, byte for byte, so Vite puts them at the root of `dist/web`.
- `web/index.html`: the three `<link>` tags from `design/README.md`.
- `src/commands/board.ts`: add `.png` (`image/png`) to `TYPES`.
- `test/`: the board serves `/favicon.svg`, `/favicon-32.png` and `/apple-touch-icon.png` with the right content types, and the copies in `web/public/` equal the files in `design/icons/`, so a later design change can't leave a stale copy unnoticed.
- `web/src/index.css`: one base rule giving enabled buttons and `[role="button"]` the pointer cursor; the existing `cursor-not-allowed` and `disabled:cursor-wait` classes keep working (utilities override base).

## Already decided

- Use the design pack's files as they are: the favicon tile (symbol on navy), not the bare symbol, since the README says to use it below 24 px.
- Copies in `web/public/`, guarded by the equality test, rather than pointing Vite at `design/icons/` (that would ship every icon size in the npm package).

## Out of scope

- A logo in the board's header, a web app manifest, the dark theme, or icons on phone notifications.
- Any change under `design/`.

## Completion

- [x] The built board page links the three favicon files, and the board serves each with its content type (`image/svg+xml`, `image/png`)
- [x] A test fails when a copy in `web/public/` differs from its file in `design/icons/`
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open
- [x] Every enabled button on the board shows the pointer cursor on hover; disabled ones keep their cursor
