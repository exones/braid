---
id: '0009/C'
title: "Open thread and Merge on request"
status: To Do
labels: ["kind:task", "tier:M", "ui", "ask:process"]
dependencies: ['0009/A', '0009/B']
order: 30
---

## Goal

Two actions on the board, as in the approved mockups (0009/A): **Open thread** and **Merge on request**.

Expected size: about 250 lines in 7 files, with tests.

## Start here

- The approved mockups from 0009/A, and the token and action registry from 0009/B.
- `src/board/t3.ts` (`T3Thread.link`, read but not passed on), `src/board/model.ts` (`BoardData`).
- `src/braids/requests.ts`: an open review request (from `braid handover`) holds the PR, its head and the coordinator thread that handed it over.
- `.agents/skills/braid/SKILL.md`, "Merge on request".
- From the review of 0009/A: the mockups draw no tooltip for "no open review request" or "no coordinator thread"; write those in the same pattern (`Merge: <reason>`). After a refusal for non-green checks, Merge stays disabled with that tooltip while the checks are still red.

## Change

- **Open thread:** the thread link in the board data; a small button on cards and strand rows that have a thread, opening it in T3.
- **Merge on request:** the board doesn't merge itself; it asks the coordinator that handed the PR over (user, 2026-11-17). On a card with an open review request, the button opens the confirmation (PR, head commit, target branch, checks). On confirm the server sends that request's coordinator thread `Merge #<n> at <head>, from the board.` with `t3 thread send`, and the card shows the merge as asked for until the coordinator merges. No open review request, or no coordinator thread on it: the button is disabled with the reason.
- **The skill** ("Merge on request"): a message from the board in that form is the user's request to merge that PR at that head; the coordinator merges as for "merge it" (the head must match its recap), then continues with "After the merge".
- `docs/board.md`, and the places that still call the board read-only: `src/cli.ts` (help), `docs/cli.md`, `docs/getting-started.md`, `docs/braids-format.md`, the "read-only" in the header of `web/src/App.tsx`.
- From the review of 0009/B: a test that a POST body over 64 KB gets 413 and runs no action; D50 says a request without `Origin` passes with the token and a matching `Host` (as the code and `docs/board.md` do).

## Out of scope

- Start (0009/D). The board merging a PR itself. Auto mode.

## Completion

- [ ] Open thread opens the item's T3 thread; no button where there is none (tested with demo data)
- [ ] Merge sends the request's coordinator thread the merge message, only after the confirmation, with the shown head (tested with a fake `t3`)
- [ ] Merge is disabled with its reason when there is no open review request or no coordinator thread on it (tested)
- [ ] The braid skill's "Merge on request" covers the board's message
- [ ] Final screenshots in the report, light and dark
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
