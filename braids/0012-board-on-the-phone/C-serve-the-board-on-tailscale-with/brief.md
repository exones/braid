---
id: '0012/C'
title: "Serve the board on Tailscale with identity checks"
status: In Progress
labels: ["kind:story", "tier:L", "ask:security", "ask:architecture"]
dependencies: []
order: 30
---

## Goal

`braid board --host <address>` also serves the board on this machine's Tailscale address, so the user can open it on their phone. Every request over that address, reads and actions alike, is allowed only when tailscaled says it comes from the Tailscale user who owns this machine. Opt-in, never on all networks.

Expected size: about 450 lines in 6 to 9 files, half of it tests.

## Start here

- `docs/decisions.md` D50: the local board's token, Host and Origin checks; they stay for the local listener.
- `src/commands/board.ts`: `startBoard`, `boardCommand` (flags), `postAction` (Host, Origin and token checks), `tokenMatches`.
- `docs/board.md` "Actions and the session token", "Open thread and Merge on request", "Start"; `docs/cli.md` for `braid board`.
- Tailscale: `tailscale status --json` (`Self`, `TailscaleIPs`, `User`, `CurrentTailnet.MagicDNSSuffix`) and `tailscale whois --json <ip>[:port]` (`UserProfile.LoginName`, `Node.Tags`). The user has Tailscale 1.104.

## Change

- `src/commands/board.ts`, or a new `src/board/tailnet.ts`:
  - `--host <address>` is accepted only when the address is one of this machine's Tailscale IPs or its MagicDNS name; anything else (`0.0.0.0`, `::`, a LAN or public address, a name that resolves elsewhere) is refused before listening, with a message saying why. `--host tailscale` picks the IPv4 Tailscale address. It adds a second listener on that address; the `127.0.0.1` one stays as it is.
  - On the Tailscale listener every request first asks tailscaled who the peer is (`whois` of the remote address and port). It is allowed only when the peer's login equals the login of this machine's owner (from `status`) and the peer node has no tags. Any failure (tailscaled down, unreadable output, a timeout, an unknown peer) refuses with 403: fail closed. An answer may be cached per remote address for a few seconds.
  - `Host` must be this listener's address or MagicDNS name with its port (stops DNS rebinding). Actions also need a matching `Origin` when one is sent, and a header that a cross-site page can't send without a CORS preflight the server never grants, so another page open on the phone can't act through the board. The token stays the local listener's.
  - The `open` action (which opens T3 on the PC) is refused on the Tailscale listener; there the page's Open thread is the thread's `t3code://` app link, opened by the phone's own T3 app. Check how T3's app on a phone handles that link (docs, or the T3 source) and say in the report whether it works; if it can't, the page offers no Open thread there.
  - It prints the phone URL (`http://<MagicDNS name>:<port>/`) and who may use it.
- `docs/board.md`, `docs/cli.md`, and a D60 entry in `docs/decisions.md` (D59 is the lane order of 0012/B).
- Tests with a fake tailscale runner (no real tailscaled in CI).

## Already decided

- Identity, not a code: the user chose the Tailscale identity (2026-11-18). Plain HTTP inside the tailnet (WireGuard encrypts it); no `tailscale serve`.
- Same user only: the login that owns this node. Tagged nodes and other users of a shared tailnet are refused.
- The phone can Start and Merge, and opens threads in its own T3 app through the app link (user, 2026-11-18).

## Failure modes

- tailscaled stops or logs out while the board runs: whois fails, so requests over Tailscale are refused (403); the local board keeps working.
- Tailscale is down or has no address at start: `--host` refuses to start, with a message, and starts nothing, so the user notices.
- A peer of another user, a tagged node, a shared-in node: 403.
- A request whose `Host` is another name (rebinding), or a cross-origin POST from another page on the phone: refused.
- A `whois` call that hangs: a timeout refuses the request instead of blocking the server.

## Required regression tests

- `--host` with `0.0.0.0`, `::`, a LAN address, a non-Tailscale name: refused before listening.
- Whois of another user, of a tagged node, a whois error, unreadable output, a timeout: 403 for the page, for the board data and for an action.
- The owner's peer: the page, the data, Start and Merge allowed; the `open` action refused.
- Wrong `Host`, wrong `Origin`, an action without the required header: refused.
- The local `127.0.0.1` board behaves as before (its existing tests pass unchanged).

## Out of scope

- HTTPS in any form, Funnel, `tailscale serve`, a sign-in or pairing code, several users (user, 2026-11-18: plain HTTP for now). Nothing specific to one machine or tailnet: names and addresses come from `tailscale status` at run time.

## Plan

1. `src/board/tailnet.ts`: a `TailscaleRunner` (`tailscale <args>`, 3 s timeout); `readTailnet` from `tailscale status --json` (running, IPs, MagicDNS name, owner login from `User[Self.UserID]`; a tagged machine has no owner and refuses); `tailnetAddress(host, tailnet)` (`tailscale`, one of the IPs, or the MagicDNS name, else a refusal saying why); `whoisGate` (whois `<ip>:<port>`, allowed only for the owner's login and no node tags; errors, bad JSON and a timeout refuse; 5 s cache per remote address, in-flight calls shared).
2. `src/commands/board.ts`: the request handler is shared by two listeners. The Tailscale listener (on the local listener's port number if free, else a free one) runs the whois gate on every request, then checks `Host` against its address and MagicDNS name with the port. Its actions need a matching `Origin` when sent and the `x-braid-request` header (a custom header forces a CORS preflight the server never answers); no token there; `open` is refused with 403. `--host <address>` in `runBoard`, refused before anything listens; it prints the phone URL and who may use it.
3. Page: `postAction` always sends `x-braid-request`; off `127.0.0.1` Open thread is only the `t3code://` app link, at every width.
4. Tests (fake runner, the Tailscale listener bound to 127.0.0.1 in tests): address refusals, whois cases × page/data/action, owner allowed (Start, Merge) and `open` refused, Host/Origin/header refusals.
5. docs/board.md, docs/cli.md, D60; report.md with what the T3 phone app does with the link.

## Completion

- [ ] `--host` serves on this machine's Tailscale address only and refuses every other address, with tests
- [ ] Every request over it is checked with tailscaled whois and allowed for the owner's login only, failing closed, with the regression tests above
- [ ] Actions over it are safe from cross-site pages; the `open` action is refused there and Open thread is the app link
- [ ] The local board is unchanged
- [ ] docs/board.md, docs/cli.md and D60 in docs/decisions.md describe it
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
