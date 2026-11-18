# Report 0030: Board: Open coordinator thread button

## What changed

- A braid with strands now shows one compact **Coordinator** button (person icon; the label on a phone) that opens its coordinator thread, running else the newest idle one. It has no braid-level Open thread any more; each strand row keeps its own. A story keeps Open thread (its worker) plus Coordinator. Same on the braid's page and the Needs You item (`web/src/App.tsx`: `OpenThread` has a coordinator variant, `Actions` a `coordinator` link).
- The server `open` action takes `{ id, thread: "coordinator" }` (`src/commands/board.ts`) and still picks the link itself. It refuses (400) with no coordinator thread, with a strand id, or with another `thread` value.
- Both paths: on the phone and over Tailscale the button is the coordinator's `t3code://` app link (the existing `OpenThread` link logic); on the desktop it posts `open`.
- Demo data: 0009 (running strands) has a running coordinator.
- `docs/board.md` and decision D63 describe it.

## Why

While a strand ran, the coordinator could not be reached from the board. The user approved the design on mockups (log, 2026-11-18): each worker already has its strand button, so the braid needs only a compact Coordinator.

## Cause of the strand-opening braid button

Not reproduced. Checked: for a braid with strands, `toCard` gives `thread` only from the final-PR reviewers (`own.agents`) or an idle thread keyed by the braid number (`t3.idle`), never a strand's; the server and the web both fall back to `coordinator.link`. A test with the demo (0009: running strands A and B plus a running coordinator) confirms the braid card has `thread: null`, `coordinator` = its coordinator and each strand its own link. I did not read real T3 data (not permitted). The likeliest live cause is a thread whose title names the braid number only (`<repo> 0012 worker: …`, e.g. a strand worker started under the braid id), which `parseThreadTitle` puts in `t3.idle["0012"]` and `openThread` returns first. The braid-level Open thread had no other job than the final-PR reviewer and idle braid-keyed threads (user accepted losing the reviewer link). The new design makes the question moot: a braid with strands carries no agent thread button.

## Validation

- `npm run verify`: 274 tests pass. New test in `test/board-start.test.ts`: while strands run, `open` with `thread: "coordinator"` opens the coordinator (running and idle), the strand's own `open` its worker, and it refuses without a coordinator, for a strand and for another value.
- Demo board run: Coordinator button on 0009, 0010, 0011, 0013; none on 0002 (no coordinator). Screenshot: `~/.braid/artifacts/agento/0030/built-desktop.png`. The phone (label) and app-link paths are the existing `OpenThread` logic and are not covered by an automated test (no web tests in this repo).

## Open

For later items: a way to open the final-PR reviewer thread from a braid with strands, if wanted.
Needs the user: none
