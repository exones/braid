---
id: '0073/E'
title: "Board: click a request code to copy it"
status: Done
labels: ["kind:story", "tier:S", "ui"]
dependencies: ['0073/D']
order: 50
---

## Goal

The user's addition to 0073 (relayed by the PM, 2026-11-23): "small button which copies question handle: so that when I answer I insert it into chat. IDK where to put it (probably the handle itself on the card must be clickable)". Every request code chip on the board (`q-7f3k`) copies its code on click, so the user can paste it into a chat when answering.

Expected size: about 40 lines in 1 to 2 files, plus a test.

Second addition from the user (relayed by the PM, 2026-11-23): "for project colors don't use red palette colors: looks like errors and attracts too much attention". Project tag colours use no warm hues.

## Start here

- `web/src/App.tsx`: `CodeChip`, the one component that draws every code chip (cards, the Requests tab, the PM box, the programmes panel, wait lines); its callers sit inside clickable cards (see `AskingLink`'s `stopPropagation`).
- `web/src/App.tsx`: `TAG_COLOURS` (about line 326), the project tag palette; it has `pink-700` and `orange-600`.
- How the web app is tested (`rg -l "web/src" test`), and `docs/board.md`.

## Change

- `CodeChip`: a click (or tap, or Enter when focused) copies the code and shows "copied" briefly (about 1.5 s) in place or next to it; the click doesn't open or toggle the card under it. The chip keeps its look, with `cursor: copy` and the tooltip `Copy q-7f3k` (`title`), and is reachable by keyboard (a button with the same styling, or `role="button"` and `tabIndex`).
- Copying: `navigator.clipboard.writeText` when `window.isSecureContext` and it exists; otherwise, or when it rejects, a hidden textarea with `document.execCommand('copy')`. The board is often opened over plain http on the Tailscale address, which is not a secure context, and it must work on a phone (iOS Safari: the textarea needs `readonly` off, a selection range, and no zoom; keep it off-screen).
- A test of both paths (the clipboard API, and the fallback when it is missing), in the way the web app is tested here; if there is no web test setup, a small pure helper (`copyText`) with a unit test.
- `docs/board.md`: one line that a request code copies on click.
- `TAG_COLOURS`: replace `pink-700` and `orange-600` with calm, non-warm colours that stay distinct from the others (for example `violet-600` and `sky-600`, or emerald and slate; keep lime only if it stays distinct). A comment above the list gives the rule: no red, pink, rose, orange or amber for projects, since those mean errors and "needs you" on the board. A test that the palette has no warm hue, if cheap.

## Already decided

- No mockup round (the PM): it is a click behaviour on an existing, approved chip.
- Runs last, after 0073/D, and after this braid branch merges main if 0071 (which changes the board) has merged by then.

## Out of scope

- Any other change to the chip's look or to the cards, beyond the project tag palette.

## Completion

- [x] Every code chip copies its code on click, tap or Enter, shows "copied" briefly, and doesn't open the card under it; it has a copy cursor and the tooltip `Copy <code>`
- [x] `TAG_COLOURS` has no red, pink, rose, orange or amber, with the rule as a comment above it; the colours stay distinct from each other
- [x] Copy works without a secure context (plain http), through the textarea fallback; tests cover both paths
- [x] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open, and a screenshot of a chip after a click (desktop and a narrow phone width)
