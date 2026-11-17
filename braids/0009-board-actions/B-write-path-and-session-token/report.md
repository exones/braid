# 0009/B report

**What changed:** `braid board` now has a write path. `POST /api/action/<name>` runs an action registered by name (`Sources.action`); the repository registry is empty, only tests and `--demo` boards have actions. A per-run random token (24 bytes) is in the URL the command prints and opens, as `#token=…`; the page moves it into `sessionStorage`, clears the address bar, and `postAction` in `web/src/api.ts` sends it as `x-braid-token`. A request is refused with 403 without the right token, or with a `Host` or `Origin` that isn't `127.0.0.1:<port>`. Unknown action 404, bad JSON 400, body over 64 KB 413, other methods 405 as before. `--demo` boards accept every action and return `{ ok: true, demo: true }`. `docs/board.md` describes it; decision D50.

**Why:** C and D add the actions; they need a write path only this run's page can use, since any web page can send requests to 127.0.0.1.

**Validation:** `npm run verify` passes (189 tests). New `test/board-actions.test.ts`: no/wrong token, foreign Origin and Host are refused and never reach the handler; the right token does; the demo fakes results; tokens differ per run; the printed URL carries the fragment.

**Open:** a request with no `Origin` header (not a browser) is allowed if it has the token and a correct Host. The page's token handling has no browser test (the board has no browser test setup).

For later items: C and D register their actions in `ACTIONS` in `src/commands/board.ts`.
Needs the user: none
