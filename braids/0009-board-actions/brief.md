---
id: '0009'
title: "Board actions"
status: Outline
labels: ["kind:story", "tier:L", "ui"]
dependencies: ['0008']
order: 90
delivery: epic
---

## Goal

Story 6 of the braid plan. The board gets actions: Start (a T3 thread on a new worktree), Open thread and Merge on request. Local only, with a per-session token.

## Working at the end

Start a strand from the board.

## Open questions

- Start: let T3 create the worktree (its `worktree` launch mode from the braid branch), so the checkout is attached to T3 natively, instead of `braid start` plus `git worktree add`; `braid start` stays for use outside T3 (user, 2026-11-14, after looking at wtw).
- UI item: start with mockups on realistic test data and stop for the user to review the design (converge loop).
- How the per-session token is passed and checked.

Plan it fully when its turn comes, asking the user if needed.
