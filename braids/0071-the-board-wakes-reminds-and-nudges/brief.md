---
id: '0071'
title: "The board wakes, reminds and nudges"
status: Done
labels: ["kind:story", "tier:L"]
dependencies: ['0070']
related: ['0072']
delivery: epic
autonomy: free
---

## Goal

Programme pm/autonomous-dev-machine, row P6. One board rule over 0070's request record (P3), no new state: at each refresh the running board checks each open request's "done when"; when it holds, it closes the request as met and sends the waiting thread one wake message. While it doesn't hold, the board sends the addressee a reminder ("Gentle hourly reminder: I'm still waiting for you", the user's words) at most hourly, or after the addressee's estimate (one call: `braid eta <code> 2h "<why>"`, filling 0070's empty `eta`); the waiting card shows "expected by <time>" and never reads as stalled. A missed estimate, or a gone addressee, escalates as a stall. A real stall (idle, no open request or wait, no hold) gets one nudge, then escalates. Nothing happens while the braid is held or paused.

The case: 0069 waited on purpose until 0064 merged and read "Stalled: the coordinator stopped and nothing was asked" (the user: "this is a passive wait: so it also can sometimes never happen (imagine pm forgot about this thread)"). Also 0070's coordinator, whose background command's wake never came (inbox 2026-11-23-kq5k): the nudge is the safety net.

Try: a coordinator asks with `--to <n> --done-when braid:<n>` and ends its turn. Its addressee is reminded hourly, its card shows the wait and never "Stalled", and it is woken once the other braid merges into main. An idle coordinator with nothing open gets one nudge.

Expected size: about 1200 lines in 25 files, over five strands.

## Start here

- `braids/0070-questions-on-record/report.md` and its brief's "Already decided": the record this builds on.
- `src/braids/requests.ts`: `RecordFile`, events (`eta` and `by: board` exist), `openRequest` (replacement), `conditionPr`, `voidEnding`, `liveRequests` (where `pr:` is checked and `met` written today).
- `src/board/signals.ts` (`readSignals`, `ended`: the board applies `met` only in memory; waits are split from requests there), `src/board/model.ts` (`derive`, `toCard`: the stall alarms), `src/board/programme.ts` (the PM's stall, `pmChecks`), `src/board/t3.ts` (`thread list`, `thread show`, reviewers).
- `src/board/feed.ts` (`notify` and `act` after each good read) and `src/board/steerer.ts` (the board's only automatic sends today, and how it remembers them).

## Change

- 0071/A: the board checks `braid:` and `time:` as well as `pr:`, records `met` itself and sends the asker one wake; waits replace only waits (rf9z).
- 0071/B: reminders (hourly, or after the estimate), `braid eta`, "expected by" and the escalations on the card; mockups first.
- 0071/C: one nudge for a real stall, then the stall; the PM's delegated check seen by the board (2h98).
- 0071/D: the braid and braid-pm skills: waiting with a condition, the estimate, answering a wake, reminder or nudge; no longer than today.
- 0071/E: docs as a whole and the dated decision.

## Already decided

- The user: "Yes" to the PM's proposal: waits are requests with a condition on P3's record, and P6 is a small board rule (wake, remind, estimate, nudge), with no new state. No new state file: what the board sent is an event in the request's history (`met`, `reminded`, by `board`); the nudge reuses the board's existing alarm clock (`.braid/broke.json`).
- The reminder text: "Gentle hourly reminder: I'm still waiting for you".
- The user: "The agent that it waits for can say estimate when it thinks it will get back to it". One call, `braid eta <code> <duration or time> "<why>"`; it sets `eta` and appends an `eta` event.
- The user, on a passive wait: "this is a passive wait: so it also can sometimes never happen (imagine pm forgot about this thread)". The reminder, the estimate and the escalation exist so a wait never goes quiet for ever.
- Programme rule: "don't overblow skills, try to see how to make easier, don't create spaghetti states and lean more to realiable calls like with requests". Skill text gets shorter or stays the same size.
- UI changes: mockups first, sent to the PM, which forwards them to the user.
- Decided by the coordinator:
  - A wait is a request whose addressee is another braid (`--to <n>`), as 0070's board already splits them (`toBraid`). Every open request with a "done when" other than `answered` is checked and its asker woken, whatever its addressee: a handover's `pr:` too, so a coordinator learns that the user merged.
  - rf9z: replacement stays per asker and item, but a question (any request to the user or the PM) replaces only a question, and a wait replaces only a wait to the same braid. A coordinator can hold its question to the user and its waits at once; "an item has one open request" still holds for questions.
  - The board acts only while it runs with its steerer (0064). Without a running board nothing wakes, reminds or nudges. Reads never close a request (the PM's live check of #290 found that `braid requests` recording `met` loses the wake); only the board's tick does, with its wake (0071/G).
  - Reminders go to agent addressees only (another braid's coordinator, the PM). A request to the user is already on the board and pushed (0069); the board sends the user nothing new.
  - An addressee is gone when there is no thread to send to: the braid's coordinator thread is missing or archived, or the PM thread is. For a waited-on braid with no coordinator yet, the reminder goes to the PM when the waiting braid is PM-run; gone only when neither exists.
  - Escalation is the existing stall alarm on the card, with its reason (missed estimate, gone addressee, nudged and still idle); under a PM the board also sends the PM one message with it. 0069's push rule is unchanged.
  - Held or paused (a hold, a limit pause, the programme's hold): the board skips that braid entirely, as asker and as addressee: no wake, reminder, nudge or escalation until it resumes.
  - The board acts without a click: a dated decision in `docs/decisions.md`, next to 0064's steering.
- Related to 0072 (Questions say what they unblock, Outline on `braid/0072-questions-say-what-they-unblock`): both change the request code (`src/braids/requests.ts`, `src/commands/requests.ts`, the board's request rows). This braid merges into main first; 0072 is planned from it.

## Out of scope

- Answering from the board, a board-wide Questions list (P14).
- Holds, the Held lane and Hold/Go buttons (P5).
- Workers as T3 subagents (0060).
- Changing 0069's push rule.

## Completion

- [x] An open request with `--done-when braid:<n>`, `time:<iso>` or `pr:<n>` is closed as met by the running board once its condition holds, and the asking thread gets exactly one wake message, also across board restarts.
- [x] A wait's addressee gets "Gentle hourly reminder: I'm still waiting for you" at most hourly, and not before its estimate; `braid eta` sets the estimate; the waiting card shows the wait ("expected by <time>" in its details panel, per the user's verdict q-ocph: "slim please") and never reads as stalled; a missed estimate or a gone addressee reads as a stall.
- [x] A coordinator idle with no open request, wait, running agent or hold gets one nudge, then its card reads as stalled; a running delegated PM check keeps the programme from reading as stalled.
- [x] A wait no longer withdraws its asker's open question on the same item, and the reverse.
- [x] Nothing is woken, reminded or nudged while the braid is held or paused.
- [x] The braid and braid-pm skills are no longer than before this braid (word counts in the report).
- [x] The coordinator's try on a throwaway clone: a `braid:` wait reminded, shown and woken once; an idle coordinator nudged once.
- [x] Docs from BRAID.md `docs` are up to date (0071/E).

## Autonomy

PM-run (thread 9b3a8157-f696-45de-ac39-f35a4a90cf9b): security, data and outward: always ask. architecture, dependency and scope: ask when expensive to reverse (the platform or technology, the form of the product, a contract with another braid); scope: also ask for any change to the goal or the Completion boxes; otherwise decide and log it. Before merging a story or the final PR into main, send the PM the PR and its head, and merge only on the PM's go.
