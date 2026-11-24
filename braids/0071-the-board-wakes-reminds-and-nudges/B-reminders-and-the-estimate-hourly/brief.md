---
id: '0071/B'
title: "Reminders and the estimate: hourly reminder, braid eta, expected by on the card"
status: Done
labels: ["kind:story", "tier:L", "ui"]
dependencies: ['0071/A']
order: 20
---

## Goal

A wait never goes quiet for ever, and never reads as stalled while it is alive. While a wait's condition doesn't hold, the running board sends its addressee "Gentle hourly reminder: I'm still waiting for you" at most hourly, or not before the addressee's estimate. The addressee gives the estimate with one call, `braid eta <code> <duration or time> "<why>"`. The waiting card shows the wait with "expected by <time>" and never reads as stalled; a missed estimate or a gone addressee reads as a stall, with its reason.

This is a `ui` item: start with mockups of the card states on realistic test data and stop; the coordinator sends them to the PM, who forwards them to the user. Build only after the approval.

Expected size: about 450 lines in 10 files.

## Plan

0. Mockups (`mockups/reminders.html`, `reminders-full.png`): the card states A-G, the Requests tab history, the CLI, the messages, 0071/C's nudged card. Stop for approval.
1. `src/braids/requests.ts`: the event `reminded` (by `board`; an escalation is one with a `reason`, verdict c1); `addEvent(root, code, event)` (refuses a closed request); `eta` read from the newest `eta` event.
2. `src/commands/requests.ts`, `src/cli.ts`: `braid eta <code> <duration|time> ["<why>"]` with its parser; "expected by" in the `braid requests` open list (the history lists the events as they are).
3. `src/board/waits.ts` (pure: addressee, missed estimate, due, escalated) and `src/board/remind.ts` (the step, after the wake in the steerer's tick): per open wait or request to the PM, skipping held or paused braids: remind the addressee hourly, not before the estimate; a missed estimate of a PM-run wait sends the PM one message per estimate. Send first, then record `reminded`.
4. `src/board/model.ts`, `record.ts`, `web/src/App.tsx`: an open wait clears the braid's and its strands' stall; a broken wait is the stall need (verdict: slim card, no other lines); the Requests tab shows "expected by" and the history.
5. Tests (`test/board-remind.test.ts`), docs (`docs/board.md`, `docs/cli.md`, `docs/braids-format.md`, `docs/decisions.md`), gate.

## Start here

- The braid's brief (`braid view 0071`): "Already decided" binds this strand (addressees, gone, escalation, held or paused).
- 0071/A's report and PR: the shared condition check, how the board records and sends.
- `src/braids/requests.ts` (`eta`, the `eta` event, `parseRecord`), `src/commands/requests.ts` (`askCommand`, `history`), `src/cli.ts` (usage lines).
- `src/board/model.ts` (`derive`, `toCard`, `waitsOf`, the stall alarms and texts), `src/board/record.ts` (`rowOf`, `toBraid`), `src/board/marks.ts` (`reasonIcon`, `needLine`), `web/src/App.tsx` (`WaitLine`, the request rows).
- `src/board/t3.ts` (`coordinators`, `idleCoordinators`, archived threads): whether an addressee has a thread.
- The 0070/C mockups (`braids/0070-questions-on-record/C-codes-and-answers-on-the-board-and-in/mockups/`): the format the user approved last time.

## Change

- Mockups first (on test data, in this item's folder): the waiting card with a wait that has no estimate, one with "expected by <time>", one reminded ("reminded 14:05"), one escalated for a missed estimate, one for a gone addressee; the `braid requests <code>` history with `eta` and `reminded` events; and the card of a coordinator that 0071/C nudged ("nudged 14:05", then stalled after the nudge), so 0071/C builds from approved text.
- `braid eta <code> <duration|time> ["<why>"]` (or the flag form the mockups settle): sets `eta` and appends an `eta` event with the reason; a later call moves it. Refused on a closed request.
- The board, in its `act` step: for each open wait (and each open request to the PM), when an hour has passed since it was opened or last reminded, and its estimate, if any, has not yet come, send the addressee the reminder with the code, the asker, the item and the text and how to set an estimate; record it as a `reminded` event (`by: board`). After the estimate passes with the wait still open, it escalates and reminders go on hourly.
- Open waits keep the asker's card from reading as stalled (today they don't: waits are left out of `sig.requests`); an escalated wait reads as a stall with its reason, and under a PM the board sends the PM one message for it (recorded in the request's history so it is sent once).
- Skip a held or paused braid, as asker or as addressee.

## Already decided

- Everything in the braid's "Already decided"; the reminder's first sentence is exactly "Gentle hourly reminder: I'm still waiting for you".
- Memory of sends is the request's history (`reminded`, and the escalation message), no new state file.

## Out of scope

- The nudge for a real stall (0071/C builds it from this strand's approved mockups). Skills (0071/D).

## Completion

- [x] Mockups approved by the user (through the PM), recorded in the log, before building
- [x] `braid eta` sets and moves an estimate, appends an `eta` event and refuses a closed request; tests cover it.
- [x] The board reminds a wait's addressee at most hourly, not before its estimate, never a held or paused braid, and never the user; tests cover each.
- [x] A card with an open wait never reads as stalled; it shows "expected by <time>" when an estimate is set; a missed estimate or a gone addressee reads as a stall with its reason, and a PM gets one message for it; tests cover each.
- [x] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open
