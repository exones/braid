# Report 0033

## What changed

- `src/commands/board.ts`: the 403s of `POST /api/action/<name>` now say which check failed and what to do: Host/Origin not this board's page; on the Tailscale listener a missing `x-braid-request` header; on the local listener no token (empty or absent header) and a token from another `braid board` run. Status, checks and order are as in D50/D60; no token is echoed. The Tailscale whois/Host gate stays terse.
- `docs/board.md` lists the reasons. D50/D60 unchanged (only reply text).
- `web/src/api.ts` unchanged: it already shows the server's `error`, and sends an empty token when it has none, so the Start dialog shows the "no token" text.

## Why

The user saw a bare `forbidden` on Start coordinator for 0029; the cause was a missing or stale token.

## Validation

`test/board-actions.test.ts` (new test: each local reason, token not in the body) and `test/board-tailnet.test.ts` (missing header, Host/Origin). The dialog shows the `error` string verbatim (`web/src/api.ts`), so the reply tested is what the page shows; no screenshot. Gate `npm run verify`: see PR checks.

## Open

None.

For later items: none.
Needs the user: none.
