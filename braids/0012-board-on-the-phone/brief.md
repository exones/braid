---
id: '0012'
title: "Board on the phone"
status: Outline
labels: ["kind:story", "tier:M", "ui"]
dependencies: ['0009']
order: 120
delivery: epic
---

## Goal

Story 9 of the braid plan (user, 2026-11-14). A board layout that fits a phone: one lane at a time, larger tap targets. `braid board --host <address>` serves it on the user's Tailscale network: opt-in, never on all networks by default. Board actions over the network need real authentication (Tailscale identity or sign-in), building on the token of braid 0009.

## Working at the end

Open the board on the phone over Tailscale and act on a braid safely.

## Open questions

- Whether the read-only part moves right after the MVP, ahead of 0008 to 0011.
- Which authentication: Tailscale identity or a sign-in.

Plan it fully when its turn comes, asking the user if needed.
