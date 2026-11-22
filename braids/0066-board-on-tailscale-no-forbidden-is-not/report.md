# Report 0066

**What changed**
- `src/board/tailnet.ts`: the whois gate keeps only definite answers (owner, or not the owner) for 5 s. A timeout, a non-zero exit or a spawn error refuses that request and is dropped from the cache, so the next request asks again.
- `src/commands/board.ts`: on the Tailscale listener a refused `/api/` request gets a JSON 403 whose `error` says the board couldn't confirm who is asking through Tailscale (or the Host isn't this listener's) and that refreshing asks again. Other paths keep plain `forbidden`.
- `src/board/reply.ts` (new), used by `web/src/api.ts` (`get`, `postAction`): the body is parsed only when it is JSON; a non-JSON error shows `<status> <text>`.

**Why:** one slow whois refused a phone for 5 s and the page then tried to parse `forbidden` as JSON.

**Validation:** new tests in `test/board-tailnet.test.ts` (timeout, failure and spawn error not kept; owner and not-owner kept; JSON refusal on `/api/`, plain `forbidden` elsewhere) and `test/board-reply.test.ts`; `npm run verify`.

**Docs updated:** `docs/board.md` (On Tailscale; the `forbidden` line), D60 in `docs/decisions.md`.

**Open:** the refusal text doesn't tell a not-owner from an unconfirmed peer; both read as "couldn't confirm". Security is unchanged (fail closed).

For later items: none.
Needs the user: none
