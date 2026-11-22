---
id: '0066'
title: "Board on Tailscale: no \"forbidden is not valid JSON\""
status: In Progress
labels: ["kind:task", "tier:S", "ask:security"]
dependencies: []
delivery: epic
---
## Goal

The board opened on its Tailscale address sometimes shows `Unexpected token 'o', "forbidden" is not valid JSON` instead of the board (seen by the user on 2026-11-22 at `http://<machine>.<tailnet>.ts.net:7800`). Make that refusal rare, and when it does happen, readable, and gone on the next refresh.

Expected size: about 80 lines in 4 files, plus tests.

## Start here

- `src/commands/board.ts`, `handle` (around line 852): the Tailscale listener answers every refused request, `/api/` ones included, with plain-text `forbidden`; the local listener already answers `/api/` with JSON (`HOST_REFUSED`).
- `src/board/tailnet.ts`, `whoisGate`: one `tailscale whois` per remote address, 3 s timeout, and the answer, a refusal included, kept 5 s. So one slow or failed whois (a busy Windows machine: whois normally takes about 0.3 s here) refuses that phone for 5 s, page loads and polls alike.
- `web/src/api.ts`, `get` and `postAction`: `response.json()` runs before `response.ok` is looked at, so any non-JSON error body becomes a JSON parse error on the page.
- `docs/board.md`, "On Tailscale" and "Actions and the session token"; `docs/decisions.md` D60.

## Change

- `src/board/tailnet.ts`: keep only definite answers (tailscaled answered: the owner, or not the owner); a timeout, a non-zero exit or a spawn error refuses that request but isn't kept, so the next request asks again.
- `src/commands/board.ts`: on the Tailscale listener a refused `/api/` request gets a JSON 403 whose `error` says the board couldn't confirm who is asking through Tailscale (or that the Host isn't this listener's) and that it retries on the next refresh; other paths keep plain `forbidden`.
- `web/src/api.ts`: read the body as text and parse it only when it is JSON; a non-JSON error shows the status and text, never a parse error.
- Tests for each: the gate doesn't keep a timeout or failure but keeps a definite answer; the tailnet `/api/` refusal is JSON; the client's error for a non-JSON body.

## Already decided

- D60's security stays: fail closed, owner-only, untagged node, Host check, 3 s timeout. Only what is cached changes, and the shape of the refusal.
- No retry loop inside the gate; the page's next poll is the retry.

## Out of scope

- HTTPS, other auth for the Tailscale listener, and changes to the local listener.

## Completion

- [ ] A whois that times out or fails refuses that request but isn't kept; a definite answer is still kept 5 s (tests)
- [ ] A refused `/api/` request on the Tailscale listener answers JSON with an `error` that says what failed and that the next refresh retries (test)
- [ ] The page never shows a JSON parse error for a non-JSON error body; it shows the status and text (test)
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated (docs/board.md "On Tailscale" and the plain-text `forbidden` line; D60 in docs/decisions.md), or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
