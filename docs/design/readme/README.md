# README images

How the images in [`docs/images/`](../../images/) were made, so they can be redone. Two kinds: real screens of the board, and illustrative mock-ups drawn as HTML. The README marks each mock-up as illustrative.

All images are PNG at 2x device pixels, in light colours only (the board has no dark theme). Brand colours come from [`design/tokens`](../../../design/tokens/).

## Real screens

Taken from `braid board --demo` (sample data, nothing is read or written; see [the board](../../board.md#demo)). Start it with `braid board --demo --no-open --port 47321`, open the page in Edge or Chrome headless-style at the window size below, wait until the lanes have loaded (the page shows "Loading..." first), and capture the viewport.

| File | Address | Window (CSS px) |
| --- | --- | --- |
| `board.png` (hero) | `http://127.0.0.1:47321/#/` | 1440 × 900 |
| `item-page.png` | `http://127.0.0.1:47321/#/0001` | 1200 × 560 |
| `inbox.png` | `http://127.0.0.1:47321/#/inbox` | 390 × 510, mobile emulation, cut after the second leftover (the demo inbox lists a not-yet-built idea and an outdated leftover, which the README should not show) |
| `board-phone.png` | `http://127.0.0.1:47321/#/` | 390 × 844, mobile emulation |

`edge --headless --screenshot` captured the page before it loaded, because the board keeps a live refresh stream open. The captures were made over the browser's debugging port (`Emulation.setDeviceMetricsOverride`, wait for the text, `Page.captureScreenshot`) at a device scale factor of 2.

## Mock-ups (illustrative)

Plain HTML with inline CSS, no scripts and no external fonts.

| File | Source | Window (CSS px) | Shows |
| --- | --- | --- | --- |
| `coordinator-thread.png` | [`coordinator-thread.html`](coordinator-thread.html) | 900 × 700 | A coordinator thread for "add dark mode": the plan with strands A to C (A and B tier M, so an independent reviewer; C tier S) and its ask-first line on C, then the recap of strand A. Sample wording, not a real thread. |
| `flow.png` | [`flow.html`](flow.html) | 1100 × 380 | Goal, braid and strands, workers, reviewers, you merge; the ledger underneath. |

Open the HTML file in a browser at the window size above and capture it at 2x, the same way as the real screens.
