---
id: '0012'
title: "Board on the phone"
status: In Progress
labels: ["kind:story", "tier:L", "ui", "ask:security", "ask:architecture", "auto"]
dependencies: ['0009']
order: 120
delivery: epic
---

## Goal

Story 9 of the braid plan (user, 2026-11-14). The board works on the user's phone: a layout that fits a phone screen, served by `braid board` on the user's Tailscale network, opt-in, with only the user's own Tailscale identity allowed to read or act. On the way, the board's lanes get a new order and Done stops filling the screen (user, 2026-11-18).

## Working at the end

Open the board on the phone over Tailscale, see Needs You first, and Start or Merge a braid from there; a device of another Tailscale user, or any address outside Tailscale, gets nothing.

## Strands

- 0012/A Mockups: phone layout and the new lane order (S, ui): variants on the demo data; the user chooses.
- 0012/B Lane order, Done collapsed, phone layout (M, ui): builds what the user approved in A.
- 0012/C Serve the board on Tailscale with identity checks (L): `braid board --host`, the identity check, actions over the network.

## Already decided

- Lane order everywhere (desktop and phone): Needs You, To Review, Working, To Do, Done (user, 2026-11-18).
- Done is collapsed by default; opened, it shows the 10 newest items, newest first, and a "Show more" button (user, 2026-11-18).
- How the phone switches lanes is chosen from mockups (user, 2026-11-18).
- Authentication is the Tailscale identity: braid asks tailscaled who each connection is, and only the Tailscale login that owns this machine may read or act. No pairing code, no password (user, 2026-11-18).
- The phone can read and act (Start, Merge on request). Answering stays in the coordinator's thread: on the phone, Open thread opens the thread in the T3 app on the phone itself through T3's app link (`t3code://threads/<env>/<thread>`), not on the PC (user, 2026-11-18).
- On the phone, buttons show their icon with a short label (no hover there); the desktop keeps icon buttons with tooltips (user, 2026-11-18).
- Never on all networks: no `0.0.0.0`, no LAN address; the local `127.0.0.1` board and its token stay as they are (D50).

## Out of scope

- HTTPS in any form (a `tailscale cert` certificate or `tailscale serve`): plain HTTP inside the tailnet for now; the browser shows "Not secure" (user, 2026-11-18). Other sign-in methods, several users.
- Answering a request on the board itself (an answer form or approve button); answers are given in the thread.

## Completion

- [ ] Every strand Done on the braid branch
- [ ] The lanes show in the new order, with Done collapsed to the 10 newest and Show more
- [ ] The board fits a phone screen in the layout the user approved
- [ ] `braid board --host` serves it on this machine's Tailscale address only, to this machine's Tailscale user only, reads and actions alike
- [ ] docs/board.md, docs/cli.md and docs/decisions.md describe it
