---
id: '0071/C'
title: "One nudge for a real stall, and the PM check seen by the board"
status: In Progress
labels: ["kind:story", "tier:M"]
dependencies: ['0071/B']
order: 30
---

## Goal

A real stall (a coordinator idle, no open request or wait, no running agent, no hold or pause) gets one nudge from the board in the coordinator's thread, then escalates as today's stall. The safety net for a coordinator whose wake never came (inbox 2026-11-23-kq5k). Also inbox 2026-11-23-2h98: the board reads the PM as stalled while its delegated live checker runs, because `thread list` doesn't list subagent threads.

Expected size: about 320 lines in 8 files.

## Start here

- The braid's brief (`braid view 0071`), and 0071/B's report and log, and the user's verdict on its mockups (q-ocph: "slim please"): the card says nothing while all is well, and only a stall gets one red line.
- `src/board/model.ts` (`derive`, `toCard`: `stallHolds`, the coordinator alarm, `BROKE_MS`), `src/board/signals.ts` (`brokeClock`, `.braid/broke.json`), `src/board/programme.ts` (`programmeOf`, `checkerOf`, `STALLED_TEXT`).
- `src/board/t3.ts` (`readFresh`: `thread list`, `thread show`, `relationshipToParent`, reviewers from `.braid/reviews.json`; `pmChecks`).
- The sends of 0071/A and 0071/B, and `src/board/steerer.ts`.
- Tests: `test/lanes.test.ts` (stalls), `test/programmes.test.ts` (`pmChecks`, programme stall), `test/t3.test.ts`.

## Change

- When a coordinator stall holds (item or braid level) and its 10-minute clock runs out, the board sends the braid's coordinator thread one nudge instead of raising the alarm, e.g. `Nudge from the board: 0071 looks idle: no running agent, no open request or wait, no hold. Go on with the next step, or open a request or wait and end your turn.` Per the user's verdict (q-ocph) the card shows nothing for the nudge and stays where it is. If the stall still holds 10 minutes after the nudge, the alarm is raised as today with one red line, "Stalled after a nudge: the coordinator stopped and nothing was asked", and under a PM the board sends the PM one message. Anything that ends the stall (an agent runs, a request opens) resets it; a later stall gets a new nudge.
- The same for the PM: a programme stall nudges the PM thread once, then escalates as today.
- The nudge's memory is the existing alarm clock in `.braid/broke.json` (a nudged time beside the first-seen time), not a new file.
- 2h98: a running delegated PM check keeps the programme from reading as stalled. First see what T3 offers (a subagent's `thread show` has `relationshipToParent`; does `thread list` or `thread show` of the PM thread give its running children?). Prefer the board reading it with no skill change; if T3 gives no way, the PM records its checker the way reviewers are recorded (`braid review`-style, one CLI call), and 0071/D puts that call in the braid-pm skill. Log which and why.
- Skip a held or paused braid or programme.
- Review nit from 0071/B (PR #278): the EVENTS comment in `src/braids/requests.ts` mentions a send for a gone addressee that is never written; make it true.
- Leftover 2026-11-23-1oq8 (from 0071/A): a request on a programme item (`pm/<slug>`) is still checked and woken by `src/board/wake.ts` while that plan is held; skip it while the programme is held or paused, like a held braid. A test covers it.
- Leftover 2026-11-23-dy2k (from 0071/A): two boards serving one project (a service and a hand-started run) each send the same wake, reminder or nudge, since each sends before either records. Make only one board act per project, or re-read the record right before each send so a second board skips what the first recorded; use existing state (the board's address file, the record), no new file. Log which, and test two boards on one record.

## Plan

1. The alarm clock (`brokeClock`) gets a nudgeable stall: after ten minutes it reports a due nudge instead of an alarm; after the nudge and ten more minutes it gives the alarm. `<id> stalled nudged` and `<id> stalled escalated` sit beside the first-seen time in `.braid/broke.json` and go with it.
2. `src/board/nudge.ts`: the step sends the nudge to an idle coordinator thread or the PM thread, and the escalation to the PM of a PM-run braid; it re-reads the file before each send.
3. The cards: item, braid-level and programme stalls pass their nudge target; the text after a nudge is the settled one-line text. No new card line for the nudge itself.
4. 2h98: T3 lists no subagents and `thread show` of the PM thread lists no children, so the PM records its checker with `braid review pm/<slug> --thread <id>`; the board counts it while it runs.
5. Leftovers: the `requests.ts` comment, held programme requests in the wake (1oq8), re-read before each send in the wake and reminders (dy2k).
6. Tests, docs (`docs/board.md`, `docs/cli.md`), gate.

## Already decided

- Everything in the braid's "Already decided".
- The nudge is sent once per stall; escalation keeps today's stall alarm and 0069's push rule.
- The PM, with the plan: for 2h98 prefer the board reading the PM thread's running children if T3 shows them; a second "record your checker" call is one more thing the PM can forget.

## Out of scope

- Skills (0071/D), except naming the call 0071/D needs if 2h98 needs one.
- Workers as T3 subagents (0060).

## Completion

- [x] A coordinator stall sends one nudge to its thread, shows it on the card (per the verdict: it shows nothing for the nudge), and raises the stall only if it still holds after the nudge; a stall that ends and comes back gets a new nudge; tests cover it.
- [x] A programme stall nudges the PM once, then escalates; tests cover it.
- [x] A held or paused braid or programme is never nudged; a test covers it.
- [x] A running delegated PM check keeps the programme from reading as stalled; a test covers it, and report.md says how the board sees it.
- [x] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open
