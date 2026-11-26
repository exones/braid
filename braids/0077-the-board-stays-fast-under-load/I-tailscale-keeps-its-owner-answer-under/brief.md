---
id: '0077/I'
title: "Tailscale keeps its owner answer under load"
status: To Do
labels: ["kind:story", "tier:L", "ask:security"]
dependencies: []
order: 65
---

## Goal

Over Tailscale the board no longer refuses its owner when the machine is busy. Today the page often gets "forbidden" or "The board couldn't confirm through Tailscale who is asking … refused this request" (the user, 2026-11-26, from screenshots: "quite often I get this from the board ... it cannot verify that I am connecting from tailscale"). Cause (the PM, reading src/board/tailnet.ts): `whoisGate` keeps an answer for 5 s per remote IP and spawns `tailscale whois` for each new window. Under load the spawn passes `TAILSCALE_TIMEOUT_MS`, and every timeout refuses.

Expected size: about 120 lines in 3 files.

## Start here

- `whoisGate` and `ownerOf` in src/board/tailnet.ts (about lines 120 to 175), `TAILSCALE_TIMEOUT_MS`, `GateOptions`.
- Its tests (search test/ for `whoisGate`).
- docs/board.md, the Tailscale section.

## Change

- A positive answer (the owner's login on an untagged node) is kept per IP for minutes, not 5 s: a tailnet IP's owner is stable.
- On a timeout or a tailscaled failure (`ask` returns null), reuse the last positive answer for that IP if it is within a bounded window (stale-while-revalidate: answer from it, ask again in the background) instead of refusing. Past that window, or with no earlier positive answer, refuse as today.
- A negative answer ("not the owner", tagged node, unknown peer) stays short-lived and is never extended by a failure.
- Concurrent asks still share one call.
- Tests with a fake whois that is slow, fails, or changes its answer.

## Already decided

- Proposed by the PM (2026-11-26) under the PM-run line, from the user's report. The identity check itself (who counts as the owner) doesn't change; only how long its answers are kept and what a failed ask falls back to.
- The two windows (how long a positive answer is fresh, how long it may serve when tailscaled fails) are constants in tailnet.ts with a comment saying why; no setting. The worker picks them and states them in report.md (the PM's example: minutes).

## Failure modes and required regression tests

- A peer that was never the owner is refused, also when tailscaled times out (no earlier positive answer for that IP).
- A "not the owner" answer is never replaced by a stale positive one: once tailscaled says no for an IP, that IP is refused until a new positive answer.
- A stale positive answer serves only within its bounded window; past it a failing tailscaled refuses.
- An IP whose owner changes (fake whois answers yes, then no) is refused after the next successful ask.
- Unparseable addresses are still refused at once.
- Concurrent requests during a slow ask make one `tailscale whois` call.

## Out of scope

- Anything else in the Tailscale listener (hosts, ports, the gate's callers).

## Completion

- [ ] Positive answers are kept per IP for the chosen window, and a timeout or failure within the stale window reuses the last positive answer, tested with a slow and a failing fake whois
- [ ] Every failure mode above has a regression test
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated (docs/board.md, the Tailscale section), or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, the chosen windows, anything open
