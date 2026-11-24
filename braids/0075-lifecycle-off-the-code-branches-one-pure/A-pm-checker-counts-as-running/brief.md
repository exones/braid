---
id: '0075/A'
title: "PM checker counts as running"
status: In Progress
labels: ["kind:story", "tier:S"]
dependencies: []
order: 10
---

## Goal

A PM whose only running work is its live checker (a T3 `delegate_task` child it recorded with `braid review pm/<slug> --thread <id>`) must not be nudged as idle or shown "Stalled after a nudge". A recorded checker counts as running until it is seen finished, or until a cap. This goes into `main` ahead of the rest of 0075 (the user: "it's already bugging us").

Expected size: about 80 lines in 3 files, half of them tests.

## Start here

- Inbox 2026-11-24-fwoa (`braid inbox show 2026-11-24-fwoa`): the report.
- `src/board/t3.ts` around 318-338 (`readT3`): a `pm/` record counts only while `t3 thread show` says `running`; the first other status drops the record (`dropEndedChecks`, 0071/E).
- `src/braids/reviews.ts`: the records in `.braid/reviews.json` (`recordReview`, `dropEndedChecks`).
- `src/board/programme.ts` 111-170: `checkerOf`, and `holds`, which starts the stall clock and the nudge.
- `test/` files for 0071/C and 0071/E (`rg -l "pm/" test | rg -i "check|review|programme"`).

## The real case

The PM thread 9b3a8157-f696-45de-ac39-f35a4a90cf9b recorded its checker `thread:delegated-task:command%3Amcp%3A3f801303-68b4-4c71-8d74-e7a6c88ab626%3Adelegate-task%3Apm-adm-0073-check-1` (title `🧭 agento pm check: 0073 braid on large repos`). `t3 thread show <that id> --json` works with the `thread:` prefix and gives `relationshipToParent: subagent`, `parentThreadId` the PM's thread, `runCount: 3`, `activeRunId: null` and `status: completed` between its runs. The checker ran three runs over seven hours; between them (waiting on its own background work) T3 said `completed`, so the board dropped the record, and about ten minutes later nudged the PM and showed it stalled while the checker was still at work. Use this thread's real `show --json` shape (trimmed) as the test fixture.

## Change

- `src/board/t3.ts`, `src/braids/reviews.ts`: a recorded `pm/` checker counts as running from its record until it is seen finished, or until a cap (pick one, for example 3 hours since the checker's last update, and say it in `docs/board.md`). "Seen finished" is the worker's to find from what T3 gives (for example the PM's thread starting a run after the checker's last run completed, which is the result being delivered; or a field of `thread show`); write in the report what T3 shows and why the chosen signal is reliable. A record T3 doesn't know, or an archived thread, ends at once as today.
- Tests: the real case above (completed between runs, still counts; PM not nudged, programme not stalled), finished (stops counting, record dropped), the cap.
- Optional, only if it falls out naturally in under about 40 more lines: a "quiet until <time>" for a PM or coordinator that doesn't land on the user (unlike `braid ask pm/<slug>`). Otherwise leave it as a leftover in the report under `For later items:`.

## Already decided

- Only the checker count changes here; the lane derivation is 0075/C's.
- No new command for the PM to end a checker unless the T3 signal can't be found; then ask the coordinator before adding one.

## Out of scope

- Reviewer threads of items (non-`pm/` records); the rest of 0075.

## Completion

- [ ] A recorded PM checker that T3 shows `completed` between runs still counts as running; the PM is not nudged and the programme doesn't read stalled (test from the real case)
- [ ] A finished checker, and one past the cap, stops counting and its record is dropped (tests)
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated (at least `docs/board.md` on the checker and the cap), or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
