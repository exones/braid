---
id: '0080/D'
title: "The board signs in to T3"
status: Outline
labels: ["kind:story", "tier:L", "ui", "ask:security"]
dependencies: ['0080/A', '0080/B']
order: 40
---

## Goal

The user signs the board in to T3's MCP once, at Supervised, as 0080/A's report proposed and the user approved; the token lives only in the OS secret store; the board shows whether it is signed in and warns before the 30-day sign-in ends; signed out, or on a host without a secret store, it works as today. Detailed into a full brief after the user's decision on 0080/A.

## What works at the end

- One sign-in (CLI and or a board button, as approved) and a sign-out; the board's T3 chip says signed in, signed out or expiring, icon-only with the words in the tooltip.
- The board's MCP client (0080/B) gets its token from the secret store; a 401 turns the board back to signed out without a retry storm.
- One push and an amber chip some days before expiry.
- Tested without a real T3 (the mock, a fake secret store); one live sign-in by the user, then a scratch-thread check.

## Open questions

- Everything 0080/A's report leaves to the user: the flow, the secret store and its dependency, the expiry warning's timing.
