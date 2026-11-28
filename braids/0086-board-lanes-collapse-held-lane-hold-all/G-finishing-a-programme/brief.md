---
id: '0086/G'
title: "Finishing a programme"
status: To Do
labels: ["kind:story", "tier:M", "ui"]
dependencies: ['0086/A', '0086/C']
order: 70
---

## Goal

Finishing a programme is the user's act (idea 2026-11-25-s5o8): when every row is done the board offers to close it, the user closes it from the programme card or by answering the PM's question, and the record says who closed it and when. The programmes panel gets a Held/Paused group and a Finished group, both collapsed by default (idea 2026-11-24-l3l3), and a programme's row states are read from its braids' lanes rather than hand-kept (idea 2026-11-24-4bwm). As 0086/A's approved mockups (frame 7) show.

Expected size: about 400 lines in 10 files, tests included.

## Start here

- Ideas 2026-11-25-s5o8, 2026-11-24-l3l3 and 2026-11-24-4bwm on branch `braid-inbox` (`ideas/`).
- The parent brief `braids/0086-board-lanes-collapse-held-lane-hold-all/brief.md`, "Already decided", with the answer on how a close is recorded (the line beginning "Closing a programme").
- `braids/0086-board-lanes-collapse-held-lane-hold-all/A-mockups-lanes-holds-programmes-and-what/mockups.html` frame 7, its `report.md` and log.
- `src/braids/plan.ts` (`state`, rows and their `state`), `src/board/programme.ts` (`section`: needs, working, or off the panel when done or stopped; `over`; the row and done counts), `src/board/plans.ts` (where plans are read: the `pm/<slug>` branches).
- `src/braids/requests.ts` and `src/commands/requests.ts` (the request record on `braid-requests`, `braid ask pm/<slug>`, `braid answer`), the board's answer action from 0082/D in `src/commands/board.ts`.
- `web/src/App.tsx`: `ProgrammesPanel`, `SectionHead`, `ProgrammeCard`, the phone strip.

## Change

- A programme is finished when the user closes it, recorded with who and when where the board reads it (as the parent brief's "Closing a programme" line says); the plan file's own `state: done` still reads as finished for older plans.
- `braid programme close <slug>` records the close (the user's, through the board's Close action or an answered close question; `--by` names who). When every counted row is done, the programme card shows "Finished? Close it" with a Close button.
- `section` gains `held` (every open braid held or paused, or the programme held through 0086/C) and `finished`; the panel shows Needs you, Working, Held/Paused (collapsed by default) and Finished (collapsed by default), as the mockups show; a finished programme stops stalls, nudges and forwards as `done` does today.
- Row states derived: a row that names a braid takes its state from that braid's lane (done when Done, held when held, and so on); only `dropped` and `stopped` are kept by hand; a hand-kept state that disagrees is ignored, and `braid check --plan` notes it. The programme's done and running counts come from the same derivation.
- Tests: close by the card and by an answer, with who and when; a programme with every row done offers Close but stays Working until closed; the Held/Paused and Finished groups; a row's state from its braid's lane; an old plan with `state: done` reads finished.

## Already decided

- The PM asks once when every row is done (0086/H's skill change); this strand gives the board and the CLI their side.
- Holds come from 0086/C's reader, never from the plan file directly.

## Out of scope

- Settling (archiving) the PM's thread after the close.
- Hold and Go on the programme card (0086/E).

## Completion

- [ ] The user closes a finished programme from its card or by answering, through `braid programme close`, and the record says who and when
- [ ] The programmes panel shows Held/Paused and Finished groups, collapsed by default, as the approved mockups show
- [ ] A row that names a braid takes its state from the braid's lane; only dropped and stopped are hand-kept, with tests
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
