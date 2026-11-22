---
id: '0062/B'
title: "Requests addressed to the PM"
status: Done
labels: ["kind:story", "tier:M"]
dependencies: ['0062/A']
order: 20
---

## Goal

A request says whom it is for. A coordinator under a PM opens its requests addressed to the PM. The board shows these in the lane the braid's other state gives, with a "The PM is handling" line, and sends no push. A request escalates to the user's side and is pushed once in these cases:

- the PM hasn't answered within 20 minutes (60 for a handover);
- the PM thread is archived, unknown or failed;
- the PM forwards it with `braid forward`.

None of these escalates while the braid is paused. In the same strand, 0061's pause store gains a **hold**: the user's or PM's deliberate pause, with no provider or resume time. This is the design the user approved in 0062/A (report questions 2, 4 and 6; mockup screens 60 and 65).

Expected size: about 570 lines in 12 files.

## Start here

- `braids/0062-*/A-*/report.md`: questions 2 (request addressee), 4 (pushes, the table), 6 (hold and pause) and "Strands, restated", B. Mockups `docs/design/board-mockups/programmes.html?s=60-panel` and `?s=65-braid-panel`.
- `src/braids/requests.ts` (the request record), `src/commands/requests.ts` (`braid ask`, `braid answer`, `braid handover`), `src/board/model.ts` (lanes), `src/board/signals.ts` and `marks.ts`, `src/notify/notifier.ts`, `message.ts` and `sender.ts`.
- 0061 as merged into `main`: its pause store (`pauses.json`), `braid pause` and `braid resume`, and the paused marks (0061/C). Report S29 and question 6 list where the hold doesn't fit today.
- `docs/board.md`, "Requests", "Broke" and "Notifications"; `docs/cli.md`.

## Change

- **Requests:**
  - `to: user | pm` on the request record, set by `--to pm` on `braid ask` and `braid handover`. The PM's thread id (`pm`) comes from the brief's `PM-run (thread <id>)` line.
  - A record without `to` reads as the user's.
  - `braid status` and `braid requests` show the addressee.
- **`braid forward <id> [--note <text>]`:** the PM hands a request on to the user, and it escalates at once.
- **The board:** a request to the PM keeps the lane the item's other state gives, with the line "The PM is handling: <text>" and the 🧭 mark. It escalates on the timeouts, on a gone or failed PM thread, or on a forward, never while the braid is paused. An escalated request reads Needs You (a handover: To Review) with "Escalated:" or "Forwarded by the PM:" (screen 60). The timeouts are derived at each read from the request's `at`, like the broke alarms. The board writes nothing new.
- **Pushes:**
  - Only needs on the user's side are pushed. A request the PM handles is never pushed; an escalation or forward is pushed once, at high priority, opening the item's thread.
  - Add `low` to the push priority type (the reviewer noted it is missing). Strand D uses it for a PM-run braid becoming Done.
  - Set ntfy's sequence ID on each request push, and clear the push when the request closes.
- **The hold in 0061's pause store:**
  - A record gets `reason: limit | hold` (a missing `reason` reads as `limit`) and `words`. `provider`, `resumeAt`, `window` and `task` are null for a hold.
  - `braid pause <n> --hold "<words>" --thread <id> [--by pm]` records a hold.
  - The overdue phases (amber, then `stalled`) apply only to limits.
  - `braid status`, the card line and the details box show a hold with its words; `braid resume` clears it.
- Tests for each rule, and `docs/board.md` and `docs/cli.md` for what changes.

## Already decided

- The user approved the design on 2026-11-21 and 2026-11-22 (logged on 0062/A).
- Escalation timeouts of 20 and 60 minutes come from the dctl-studio run: the PM answered in 6 to 55 s, and its live check took up to 19 min (report, question 2).
- The board still writes only its own state files, and still acts only on the user's click.
- **Starts after 0061 merges into `main`.** Merge `main` into the braid branch first; the coordinator does this before `braid start`.

## Out of scope

- The PM's own requests (`--by pm`, `pm/<slug>`, `action`): strand C. The programmes panel: strand D. Skill changes: strand E.

## Plan

1. Store: `Request` gains `to`, `pm`, `forwarded`; `Pause` gains `reason` and `words`, null provider/resumeAt for a hold.
2. `src/board/pm.ts`: pure `routeOf` (user | pm | escalated by timeout, gone thread or forward; never while paused). T3 read gains thread states for the gone check.
3. `derive`/`toCard`: a request to the PM keeps the other lane and sets `pm` (line and mark); escalated ones read Needs You / To Review with a `via`.
4. Pushes: only the user's side; escalations high priority; `low` priority; ntfy `sequence_id` and `clear` when a request's need goes.
5. Commands: `--to pm`, `braid forward`, `braid pause --hold`; status and requests show the addressee and hold.
6. Page, docs, tests, report.

## Completion

- [x] A request opened with `--to pm` reads in its other lane with "The PM is handling" and the 🧭 mark, and sends no push; tests cover each lane rule
- [x] It reads Needs You (a handover: To Review) and is pushed once after 20 min (a handover: 60 min), when the PM thread is archived, unknown or failed, or after `braid forward`, and never while the braid is paused; tests cover each case
- [x] Old request records without `to` read as the user's
- [x] An answered request's push is cleared (ntfy sequence ID); unit-tested, not checked against a live topic (see report)
- [x] `braid pause <n> --hold "<words>"` records a hold with no provider or resume time; it shows paused with the words, never turns amber or stalled, and `braid resume` clears it; 0061's limit records without `reason` still read as before; tests cover both kinds
- [x] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open
