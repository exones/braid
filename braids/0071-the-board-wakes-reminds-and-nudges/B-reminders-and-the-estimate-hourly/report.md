# 0071/B report

## What changed

- **`braid eta <code> <duration|time> ["<why>"]`** (`src/commands/requests.ts`, `src/cli.ts`). The addressee of an open request gives an estimate:
  - The time is a duration from now (`2h`, `90m`, `1h30m`, `2d`), a time of day (`16:30`; tomorrow once it has passed) or an ISO time.
  - It sets `eta` and appends an `eta` event, with the time in `text` and the why in `reason`. A later call moves it and the output says what it was before.
  - `by` is the coordinator, or the PM for a request to the PM; `--by` overrides.
  - It is refused, changing nothing, on a closed request, an unknown code, or a time that is unreadable or already past.
  - `braid requests` shows `expected by <time>` in the open list. The history lists the `eta` and `reminded` events.
- **The record** (`src/braids/requests.ts`):
  - One new event kind, `reminded`. An escalation is a `reminded` event with a reason (the user's verdict c1).
  - `addEvent` appends to an open request.
  - `eta` is read from the newest `eta` event, so a merge of two clones keeps the latest.
- **Reminders** (`src/board/waits.ts` holds the shared logic; `src/board/remind.ts` is the step, run after the wake in the steerer's tick through `steps(waker, reminder)`). At each refresh the running board checks every open wait and every open request to the PM that it hasn't forwarded:
  - **Who gets it:** the waited-on braid's coordinator thread, running or idle. If that braid has no coordinator thread, the PM gets it when the asking braid is PM-run. With neither, the addressee is gone and nothing is sent.
  - **When:** an hour after the request opened or was last reminded, and not before the estimate. The message is "Gentle hourly reminder: I'm still waiting for you. …", with the code, the asker, the item, the text, the "done when" and the `braid eta` call. Each send is recorded as a `reminded` event by `board`.
  - **Escalation:** when the estimate of a wait in a PM-run braid has passed, the PM gets one message per estimate, recorded as a `reminded` event with the reason "missed its estimate 13:00". A new estimate clears it; a second miss escalates again.
  - **Skipped:** a held or paused braid, asking or waited on. Requests to the user are never reminded.
  - **Order:** send first, record after, as the wake does. A failed send records nothing and is tried again at the next refresh.
- **The card** (`src/board/model.ts`). It stays as 0070 left it while all is well (the user: "slim please").
  - An open wait of a braid keeps the braid's own stall and its strands' stalls from showing.
  - A broken wait is the stall, in Needs You, with one red line and no PM line:
    - a missed estimate shows at once: "Stalled: waiting on braid 0002 past its estimate 13:00";
    - a gone addressee shows after ten minutes on the alarm clock as `<number> wait`: "Stalled: waiting on braid 0002, whose coordinator is gone".
  - Neither shows while the braid, or the braid it waits on, is held or paused.
- **Details panel** (`src/board/record.ts`, `web/src/App.tsx`): an open request's row shows "expected by <time>" (", missed" once passed) and its history: opened, eta (with the why) and reminded, with times and who. The demo's wait carries a reminder and an estimate.

## Why

- **The verdict (q-ocph):** "slim please", "b. leave it out" (no line on the waited-on braid's card), "c. c1" (no `escalated` kind). It is logged and recorded in `docs/decisions.md`.
- **No new state:** the reminders and escalations sent are events in the request's history, and the gone clock reuses `.braid/broke.json`.
- **Why a missed estimate shows at once:** the estimate is already a deadline the addressee set. A gone addressee is read from T3's thread list, so it waits ten minutes like any other broke alarm.

## Validation

- `test/board-remind.test.ts` (new, 10 tests):
  - `braid eta`: set, move, history and list output, a time of day, an ISO time, and the refusals (closed, past, unreadable, unknown code).
  - Reminders: hourly from the opening, also across a restarted board; not before the estimate; escalation once per estimate and again after a new one.
  - Who gets a reminder: the PM when the waited-on braid has no coordinator; nobody when the addressee is gone or T3 is unread; nobody for a held or paused asker or addressee, or for the user. A request to the PM reminds the PM.
  - A failed send is retried once.
  - Cards, with strands and without: no stall with an open wait; a missed estimate shows at once; a gone addressee shows after ten minutes; held braids and an unread T3 show nothing.
- Gate `npm run verify`: 637 tests pass.

## Docs

- `docs/board.md`: a new "Reminders" section, and the stall rules now name open waits.
- `docs/cli.md`: `braid eta`, "expected by" in `braid requests`, and `--to <braid number>` is now reminded.
- `docs/braids-format.md`: the `eta` and `reminded` events, `braid eta`, and the wait addressee.
- `docs/decisions.md`: the user's verdict in the decision log. The dated decision "the board acts without a click" stays 0071/E's.
- `src/cli.ts`: the help lines for `eta` and `ask --to`.

## Deviations from the Completion box wording

- "It shows 'expected by <time>' when an estimate is set": per the user's verdict this is in the details panel, not on the card.
- "A PM gets one message for it": only for a missed estimate. For a gone addressee the braid's "Already decided" sends the reminders to the PM when there is no coordinator. So in a PM-run braid the addressee is gone only when the PM thread is gone too, and there is nobody to message; the card's stall is the escalation then.

## Open

- An older braid CLI reads a record that has a `reminded` event as unreadable (0071/A noted the same for any new kind). Every clone that reads `braid-requests` needs this version once a board sends a reminder.
- Requests to the PM are reminded hourly and take estimates, but a missed estimate there puts no stall on the card: the PM is the one waited on, and its card already shows "The PM is handling".
- The estimate times in the messages and the card's red line are in the board machine's local time, like the other clock texts.

For later items: 0071/C builds the nudge from the approved text. H is dropped, so the card shows no "nudged" line. The stall after a nudge reads "Stalled after a nudge: the coordinator stopped and nothing was asked", in Needs You, one red line, with no PM line. The nudge message is as in mockup 5 (`mockups/reminders.html`). 0071/D: the skills should say that the addressee answers a reminder with `braid eta <code> 2h 'why'`, and the PM may need `--by pm` when it gets a reminder for a braid with no coordinator. 0071/E: the dated decision can cite "the reminders as events, an escalation as a `reminded` event with a reason".
Needs the user: none
