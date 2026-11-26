# 0077/I report: Tailscale keeps its owner answer under load

## The chosen windows

- **Fresh: 5 minutes** (`OWNER_FRESH_MS`). After tailscaled says "the owner" for an address, the board lets that address in for 5 minutes without asking again. A tailnet address changes owner only when its node is removed and the address is handed to another user's node, which takes minutes, not seconds; asking at most every 5 minutes keeps `tailscale whois` off a busy machine's hot path, while a changed owner is still noticed within about 5 minutes.
- **Stale: 30 minutes** (`OWNER_STALE_MS`), counted from tailscaled's last "the owner", never extended by a failure. Between 5 and 30 minutes a request is let in at once and one whois runs in the background. 30 minutes covers a long stretch of load (a build, a test run) without the owner being refused, and bounds how long a tailscaled that stopped answering keeps an earlier-confirmed address in. Past it, a failed or slow whois refuses as before.
- Unchanged: "not the owner" (another user, a tagged node, an unknown peer) is kept 5 s (`REFUSAL_KEPT_MS`), and it drops the earlier "the owner" at once.

## What changed

- `whoisGate` in src/board/tailnet.ts keeps per remote address the time of the last "the owner", the time of the last "not the owner", and the whois in flight. `ownerOf` and the ask itself are unchanged, so who counts as the owner is unchanged.
  - Within 5 minutes of "the owner": allowed, no whois.
  - 5 to 30 minutes: allowed at once, one background whois. "The owner" renews the 5 minutes; "not the owner" refuses from the next request on; a timeout or failure changes nothing.
  - No "the owner" in the last 30 minutes: the request waits for the whois; a timeout or failure refuses that request only, as today.
  - One whois per address at a time, shared by every request that comes in while it runs.
- `GateOptions.ttlMs` became `freshMs`, `staleMs` and `refusalMs` (used only by tests; the board passes none).
- docs/board.md ("On Tailscale", Who) and docs/decisions.md (D60, with a dated reason) describe the new keeping.

## Why

The user often got "forbidden" or "couldn't confirm through Tailscale who is asking" on a busy machine: the gate kept the owner's answer only 5 s and every whois that passed the 3 s timeout refused. Now the owner's answer is reused while it is recent, and a slow whois runs off the request path.

## Validation

- Regression tests in test/board-tailnet.test.ts, fake tailscale runners only (no real tailscale, no port 7800), one per failure mode in the brief:
  - never the owner, also when tailscaled times out, fails or gives garbage, and also when another address of the same gate was confirmed;
  - a stale "the owner" serves within 30 minutes with a slow (hanging) and a failing whois, answering at once rather than after the timeout;
  - past 30 minutes a hanging or failing whois refuses, and failures in between don't extend the window;
  - "not the owner" is never replaced by the stale "the owner": after it the address stays refused through a later timeout and failure, until a new "the owner";
  - an owner that changes (yes, then other / tagged) is refused after the next successful ask, both inside and past the stale window;
  - unparseable addresses are refused at once and never asked;
  - concurrent requests during a slow whois make one call, both on a first ask and on a background one.
- Existing tests kept; the "kept for a few seconds" test now checks 5 minutes for "the owner" and 5 s for a refusal.
- `node --test test/board-tailnet.test.ts`: 28 pass. Gate: see below.

## Docs

docs/board.md (Tailscale "Who" paragraph) and docs/decisions.md D60 updated. No CLI help text mentions the timing.

## Open

- Decided (security, within the brief's stale-while-revalidate): between 5 and 30 minutes the request that starts the background whois is let in before that whois answers, so an address whose owner changed can pass for the duration of one whois (normally about 0.3 s, at most 3 s) after its 5 minutes ran out. Waiting for the whois instead would make that request wait up to 3 s on a busy machine, the slowness this item removes. The PM may prefer waiting; it is a two-line change.
- Gate result: GATE_PLACEHOLDER

For later items: none.
Needs the user: none.
