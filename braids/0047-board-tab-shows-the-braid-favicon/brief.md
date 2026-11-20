---
id: '0047'
title: "Board tab shows the braid favicon"
status: To Do
labels: ["kind:story", "tier:S"]
dependencies: []
delivery: epic
---

## Goal

The `braid board` page shows no icon in the browser tab. Give it the approved braid favicon from the design pack, so the tab (and a phone's home-screen shortcut) shows the braid symbol on its navy tile.

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

## Already decided

- Use the design pack's files as they are: the favicon tile (symbol on navy), not the bare symbol, since the README says to use it below 24 px.
- Copies in `web/public/`, guarded by the equality test, rather than pointing Vite at `design/icons/` (that would ship every icon size in the npm package).

## Out of scope

- A logo in the board's header, a web app manifest, the dark theme, or icons on phone notifications.
- Any change under `design/`.

## Completion

- [ ] The built board page links the three favicon files, and the board serves each with its content type (`image/svg+xml`, `image/png`)
- [ ] A test fails when a copy in `web/public/` differs from its file in `design/icons/`
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
