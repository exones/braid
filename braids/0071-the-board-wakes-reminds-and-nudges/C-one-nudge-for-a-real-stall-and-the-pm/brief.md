---
id: '0071/C'
title: "One nudge for a real stall, and the PM check seen by the board"
status: To Do
labels: ["kind:story", "tier:M"]
dependencies: ['0071/B']
order: 30
---

## Goal

A real stall (a coordinator idle, no open request or wait, no running agent, no hold or pause) gets one nudge from the board in the coordinator's thread, then escalates as today's stall. The safety net for a coordinator whose wake never came (inbox 2026-11-23-kq5k). Also inbox 2026-11-23-2h98: the board reads the PM as stalled while its delegated live checker runs, because `thread list` doesn't list subagent threads.

Expected size: about 250 lines in 7 files.

## Start here

- The braid's brief (`braid view 0071`), and 0071/B's approved mockups and log (the nudged and stalled card text).
- `src/board/model.ts` (`derive`, `toCard`: `stallHolds`, the coordinator alarm, `BROKE_MS`), `src/board/signals.ts` (`brokeClock`, `.braid/broke.json`), `src/board/programme.ts` (`programmeOf`, `checkerOf`, `STALLED_TEXT`).
- `src/board/t3.ts` (`readFresh`: `thread list`, `thread show`, `relationshipToParent`, reviewers from `.braid/reviews.json`; `pmChecks`).
- The sends of 0071/A and 0071/B, and `src/board/steerer.ts`.
- Tests: `test/lanes.test.ts` (stalls), `test/programmes.test.ts` (`pmChecks`, programme stall), `test/t3.test.ts`.

## Change

- When a coordinator stall holds (item or braid level) and its 10-minute clock runs out, the board sends the braid's coordinator thread one nudge instead of raising the alarm, e.g. `Nudge from the board: 0071 looks idle: no running agent, no open request or wait, no hold. Go on with the next step, or open a request or wait and end your turn.` The card shows it was nudged (0071/B's mockup). If the stall still holds 10 minutes after the nudge, the alarm is raised as today, with "after a nudge" in its reason, and under a PM the board sends the PM one message. Anything that ends the stall (an agent runs, a request opens) resets it; a later stall gets a new nudge.
- The same for the PM: a programme stall nudges the PM thread once, then escalates as today.
- The nudge's memory is the existing alarm clock in `.braid/broke.json` (a nudged time beside the first-seen time), not a new file.
- 2h98: a running delegated PM check keeps the programme from reading as stalled. First see what T3 offers (a subagent's `thread show` has `relationshipToParent`; does `thread list` or `thread show` of the PM thread give its running children?). Prefer the board reading it with no skill change; if T3 gives no way, the PM records its checker the way reviewers are recorded (`braid review`-style, one CLI call), and 0071/D puts that call in the braid-pm skill. Log which and why.
- Skip a held or paused braid or programme.

## Already decided

- Everything in the braid's "Already decided".
- The nudge is sent once per stall; escalation keeps today's stall alarm and 0069's push rule.
- The PM, with the plan: for 2h98 prefer the board reading the PM thread's running children if T3 shows them; a second "record your checker" call is one more thing the PM can forget.

## Out of scope

- Skills (0071/D), except naming the call 0071/D needs if 2h98 needs one.
- Workers as T3 subagents (0060).

## Completion

- [ ] A coordinator stall sends one nudge to its thread, shows it on the card, and raises the stall only if it still holds after the nudge; a stall that ends and comes back gets a new nudge; tests cover it.
- [ ] A programme stall nudges the PM once, then escalates; tests cover it.
- [ ] A held or paused braid or programme is never nudged; a test covers it.
- [ ] A running delegated PM check keeps the programme from reading as stalled; a test covers it, and report.md says how the board sees it.
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
